import boto3
from botocore.exceptions import ClientError

SUPPORTED_SERVICES = {"ec2", "lambda", "apigateway", "rds", "cloudwatch"}
SUPPORTED_SCOPES = {"health", "configuration", "recent_errors", "performance"}


def _error(exc):
    code = exc.response.get("Error", {}).get("Code", "AWS_ERROR")
    if code in {"AccessDenied", "AccessDeniedException", "UnauthorizedOperation"}:
        return {"code": "ACCESS_DENIED", "message": "AWS permissions do not allow this read-only diagnostic."}
    if code in {"ResourceNotFoundException", "InvalidInstanceID.NotFound", "DBInstanceNotFound"}:
        return {"code": "NOT_FOUND", "message": "The requested AWS resource was not found."}
    return {"code": code, "message": "AWS read-only diagnostic request failed."}


def diagnose_ec2(resource_id, scope, region):
    ec2 = boto3.client("ec2", region_name=region)
    result = {"service": "ec2", "resource_id": resource_id, "scope": scope, "read_only": True, "evidence": {}}
    try:
        if scope in {"health", "configuration", "performance"}:
            data = ec2.describe_instances(InstanceIds=[resource_id])
            instance = data["Reservations"][0]["Instances"][0]
            result["evidence"].update({
                "instance_state": instance.get("State", {}).get("Name"),
                "instance_type": instance.get("InstanceType"),
                "availability_zone": instance.get("Placement", {}).get("AvailabilityZone"),
                "private_ip": instance.get("PrivateIpAddress"),
            })
        if scope in {"health", "performance"}:
            status = ec2.describe_instance_status(InstanceIds=[resource_id], IncludeAllInstances=True)
            if status.get("InstanceStatuses"):
                s = status["InstanceStatuses"][0]
                result["evidence"].update({
                    "system_status": s.get("SystemStatus", {}).get("Status"),
                    "instance_status": s.get("InstanceStatus", {}).get("Status"),
                })
        if scope == "configuration":
            result["evidence"]["security_groups"] = [g.get("GroupId") for g in instance.get("SecurityGroups", [])]
        return result
    except ClientError as exc:
        return {"service": "ec2", "resource_id": resource_id, "scope": scope, "read_only": True, "error": _error(exc)}


def diagnose_lambda(resource_id, scope, region):
    client = boto3.client("lambda", region_name=region)
    result = {"service": "lambda", "resource_id": resource_id, "scope": scope, "read_only": True, "evidence": {}}
    try:
        data = client.get_function(FunctionName=resource_id)
        cfg = data.get("Configuration", {})
        result["evidence"].update({"runtime": cfg.get("Runtime"), "memory_size": cfg.get("MemorySize"), "timeout": cfg.get("Timeout"), "state": cfg.get("State")})
        return result
    except ClientError as exc:
        return {"service": "lambda", "resource_id": resource_id, "scope": scope, "read_only": True, "error": _error(exc)}


def diagnose_rds(resource_id, scope, region):
    client = boto3.client("rds", region_name=region)
    result = {"service": "rds", "resource_id": resource_id, "scope": scope, "read_only": True, "evidence": {}}
    try:
        data = client.describe_db_instances(DBInstanceIdentifier=resource_id)
        db = data["DBInstances"][0]
        result["evidence"].update({"status": db.get("DBInstanceStatus"), "engine": db.get("Engine"), "engine_version": db.get("EngineVersion"), "instance_class": db.get("DBInstanceClass"), "availability_zone": db.get("AvailabilityZone")})
        return result
    except ClientError as exc:
        return {"service": "rds", "resource_id": resource_id, "scope": scope, "read_only": True, "error": _error(exc)}


def diagnose_apigateway(resource_id, scope, region):
    client = boto3.client("apigateway", region_name=region)
    result = {"service": "apigateway", "resource_id": resource_id, "scope": scope, "read_only": True, "evidence": {}}
    try:
        api = client.get_rest_api(restApiId=resource_id)
        result["evidence"].update({"name": api.get("name"), "description": api.get("description"), "created_date": str(api.get("createdDate")) if api.get("createdDate") else None})
        return result
    except ClientError as exc:
        return {"service": "apigateway", "resource_id": resource_id, "scope": scope, "read_only": True, "error": _error(exc)}


def diagnose_cloudwatch(resource_id, scope, region):
    client = boto3.client("cloudwatch", region_name=region)
    result = {"service": "cloudwatch", "resource_id": resource_id or None, "scope": scope, "read_only": True, "evidence": {}}
    try:
        alarms = client.describe_alarms(MaxRecords=20)
        result["evidence"]["alarms"] = [{"name": a.get("AlarmName"), "state": a.get("StateValue"), "reason": a.get("StateReason")} for a in alarms.get("MetricAlarms", [])]
        return result
    except ClientError as exc:
        return {"service": "cloudwatch", "resource_id": resource_id or None, "scope": scope, "read_only": True, "error": _error(exc)}


def run_diagnostics(service, resource_id, scope, region="ap-south-1"):
    if service not in SUPPORTED_SERVICES:
        raise ValueError("Unsupported AWS service.")
    if scope not in SUPPORTED_SCOPES:
        raise ValueError("Unsupported diagnostic scope.")
    if service != "cloudwatch" and (not isinstance(resource_id, str) or not resource_id.strip()):
        raise ValueError("A resource identifier is required for this service.")
    resource_id = resource_id.strip() if isinstance(resource_id, str) else ""
    runners = {"ec2": diagnose_ec2, "lambda": diagnose_lambda, "rds": diagnose_rds, "apigateway": diagnose_apigateway, "cloudwatch": diagnose_cloudwatch}
    return runners[service](resource_id, scope, region)
