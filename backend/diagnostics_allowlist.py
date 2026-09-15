READ_ONLY_OPERATIONS = {
    'ec2': {'describe_instances', 'describe_instance_status'},
    'lambda': {'get_function'},
    'rds': {'describe_db_instances'},
    'apigateway': {'get_rest_api'},
    'cloudwatch': {'describe_alarms'},
}

# This module is documentation/test data only; runtime dispatch is explicit in aws_diagnostics.py.
