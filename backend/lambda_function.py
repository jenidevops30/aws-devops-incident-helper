import json
import os
import boto3

from aws_diagnostics import run_diagnostics, SUPPORTED_SERVICES, SUPPORTED_SCOPES

REGION = os.environ.get('AWS_REGION', 'ap-south-1')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-lite-v1:0')
bedrock = boto3.client('bedrock-runtime', region_name=REGION)

DESTRUCTIVE_COMMAND_KEYWORDS = [
    'terminate-', 'delete-', ' rm ', ' rb ', 'drop-', 'purge-', 'destroy-',
    'modify-', 'update-', 'create-', 'put-', 'stop-', 'reboot-', 'deregister-',
    'disassociate-', 'detach-', 'revoke-', 'authorize-security-group-ingress',
    'authorize-security-group-egress'
]
RUNBOOK_SERVICES = {'EC2', 'Lambda', 'API Gateway', 'S3', 'IAM', 'RDS', 'CloudWatch', 'VPC', 'CloudFormation', 'ECS', 'EKS', 'ALB', 'Other'}
RUNBOOK_SEVERITIES = {'Unknown', 'Low', 'Medium', 'High', 'Critical'}


def build_prompt(incident):
    return f'''You are an AWS DevOps troubleshooting assistant.
Analyze the incident provided by the user. Return ONLY valid JSON with exactly these fields:
{{"severity":"LOW|MEDIUM|HIGH|CRITICAL","summary":"Short explanation","likely_causes":["cause 1"],"recommended_checks":["check 1"],"troubleshooting_steps":["step 1"],"remediation":["remediation 1"],"aws_commands":["read-only command 1"]}}
Rules: never claim AWS account access; do not claim CloudWatch inspection unless logs were supplied; do not invent resources; keep commands read-only.
Incident:\n{incident}'''


def build_log_prompt(logs):
    return f'''You are an AWS DevOps troubleshooting specialist and CloudWatch log analysis expert.
Analyze ONLY the user-provided logs. Never claim access to AWS systems. Quote evidence verbatim.
Return ONLY valid JSON with fields severity, summary, error_pattern, evidence, likely_causes, recommended_checks, troubleshooting_steps, remediation, aws_commands, prevention.
User-Provided Logs:\n{logs}'''


def build_cli_prompt(service, incident, resource_name, region):
    resource_instruction = (f"Use this exact resource identifier: {resource_name.strip()}." if resource_name and resource_name.strip() else 'Use uppercase placeholders such as INSTANCE_ID, FUNCTION_NAME, BUCKET_NAME or API_ID. Do not invent identifiers.')
    return f'''You are an expert AWS CLI diagnostic specialist.
Generate safe, READ-ONLY commands for this incident.
Service: {service}\nIncident: {incident}\nRegion: {region}\n{resource_instruction}
Never generate delete, terminate, rm, modify, update, create, put, reboot, stop, or other state-changing commands.
Return ONLY valid JSON: {{"service":"{service}","summary":"...","commands":[{{"command":"aws ...","description":"...","purpose":"...","risk":"READ_ONLY"}}],"safety_note":"Review commands before execution."}}'''


def build_runbook_prompt(title, service, severity, description, existing_analysis, diagnostic_commands, logs, troubleshooting_notes):
    return f'''You are an AWS DevOps incident-response runbook writer.
Create a practical, review-first operational runbook from ONLY the information supplied below.
Do not claim AWS account access. Do not invent resources, ARNs, account IDs, IPs, secrets, deployment IDs, or confirmed impact.
Separate known evidence from possible causes. Diagnostic commands must be READ-ONLY. Never include delete, terminate, stop, reboot, modify, update, create, put, or security-group mutation commands.
Return ONLY valid JSON with exactly this schema:
{{"runbook_title":"...","incident_overview":"...","severity":"Unknown|Low|Medium|High|Critical","impact":"...","symptoms":["..."],"initial_triage":["..."],"evidence_to_collect":["..."],"diagnostic_commands":[{{"command":"aws ...","description":"...","purpose":"...","risk":"READ_ONLY"}}],"likely_root_causes":["..."],"troubleshooting_procedure":["..."],"remediation":["..."],"verification":["..."],"rollback_considerations":["..."],"prevention":["..."],"post_incident_checklist":["..."]}}
Title: {title}\nAWS Service: {service}\nSeverity: {severity}\nIncident Description: {description}\nExisting Incident Analysis: {existing_analysis}\nDiagnostic Commands: {diagnostic_commands}\nLogs / Evidence: {logs}\nTroubleshooting Notes: {troubleshooting_notes}\nIf information is missing, say what should be checked instead of inventing facts.'''


def sanitize_cli_commands(commands):
    safe = []
    if not isinstance(commands, list):
        return safe
    for item in commands:
        command = item.get('command', '') if isinstance(item, dict) else item if isinstance(item, str) else ''
        if not isinstance(command, str) or not command.strip() or any(k in command.lower() for k in DESTRUCTIVE_COMMAND_KEYWORDS):
            continue
        cleaned = dict(item) if isinstance(item, dict) else {'command': command, 'description': 'Diagnostic check', 'purpose': 'Inspects AWS resource state'}
        cleaned['risk'] = 'READ_ONLY'
        safe.append(cleaned)
    return safe


def sanitize_runbook_commands(commands):
    safe = []
    for item in commands if isinstance(commands, list) else []:
        command = item.get('command', '') if isinstance(item, dict) else item if isinstance(item, str) else ''
        if not isinstance(command, str) or not command.strip() or any(k in command.lower() for k in DESTRUCTIVE_COMMAND_KEYWORDS):
            continue
        safe.append({'command': command, 'description': item.get('description', 'Diagnostic check') if isinstance(item, dict) else 'Diagnostic check', 'purpose': item.get('purpose', 'Collects diagnostic evidence') if isinstance(item, dict) else 'Collects diagnostic evidence', 'risk': 'READ_ONLY'})
    return safe


def is_options_request(event):
    return isinstance(event, dict) and (event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS')


def extract_json(text):
    text = text.strip()
    if '```' in text:
        start = text.find('```'); newline = text.find('\n', start); end = text.rfind('```')
        if newline != -1 and end > newline:
            try: return json.loads(text[newline + 1:end].strip())
            except json.JSONDecodeError: pass
    try: return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find('{'), text.rfind('}')
        if start != -1 and end > start: return json.loads(text[start:end + 1])
        raise


def response(status_code, body):
    return {'statusCode': status_code, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'POST,OPTIONS'}, 'body': json.dumps(body)}


def lambda_handler(event, context):
    if is_options_request(event): return response(200, {'message': 'OK'})
    action = ''
    try:
        body = event.get('body', event) if isinstance(event, dict) else event
        if isinstance(body, str):
            try: body = json.loads(body)
            except json.JSONDecodeError: return response(400, {'error': 'Invalid JSON in request body.'})
        if not isinstance(body, dict): return response(400, {'error': 'Invalid request format: expected JSON object.'})
        action = body.get('action', '')
        action = action.strip() if isinstance(action, str) else ''

        if action == 'aws_diagnostics':
            service = body.get('service', '')
            scope = body.get('diagnostic_scope', '')
            resource_id = body.get('resource_id', '')
            region = body.get('region', REGION)
            if not isinstance(service, str) or service not in SUPPORTED_SERVICES:
                return response(400, {'error': 'Unsupported AWS service.'})
            if not isinstance(scope, str) or scope not in SUPPORTED_SCOPES:
                return response(400, {'error': 'Unsupported diagnostic scope.'})
            if not isinstance(region, str) or not region.strip() or len(region) > 50:
                return response(400, {'error': 'Invalid AWS region.'})
            if service != 'cloudwatch' and (not isinstance(resource_id, str) or not resource_id.strip() or len(resource_id.strip()) > 256):
                return response(400, {'error': 'A valid resource identifier is required.'})
            result = run_diagnostics(service, resource_id, scope, region.strip())
            return response(200, result)

        if action == 'analyze_logs':
            logs = body.get('logs', '')
            if not isinstance(logs, str) or not logs.strip(): return response(400, {'error': "The 'logs' field is required when action is 'analyze_logs'."})
            logs = logs.strip()
            if len(logs) > 20000: return response(400, {'error': 'Log input is too long. Maximum is 20,000 characters.'})
            prompt, max_tokens = build_log_prompt(logs), 2048
        elif action == 'generate_cli':
            service, incident = body.get('service', ''), body.get('incident', '')
            if not isinstance(service, str) or not service.strip(): return response(400, {'error': "The 'service' field is required when action is 'generate_cli'."})
            if not isinstance(incident, str) or not incident.strip(): return response(400, {'error': "The 'incident' field is required when action is 'generate_cli'."})
            incident = incident.strip()
            if len(incident) > 5000: return response(400, {'error': 'Incident description is too long. Maximum is 5,000 characters.'})
            resource_name = body.get('resource_name', '') if isinstance(body.get('resource_name', ''), str) else ''
            region = body.get('region', REGION) if isinstance(body.get('region', REGION), str) else REGION
            prompt, max_tokens = build_cli_prompt(service.strip()[:100], incident, resource_name[:200], region[:50] or REGION), 2048
        elif action == 'generate_runbook':
            title, service, severity, description = [body.get(k, '') for k in ('title', 'service', 'severity', 'description')]
            if not all(isinstance(v, str) for v in (title, service, severity, description)): return response(400, {'error': 'Runbook fields must be strings.'})
            title, service, severity, description = title.strip(), service.strip(), severity.strip() or 'Unknown', description.strip()
            if not title or not description: return response(400, {'error': 'Runbook title and incident description are required.'})
            if service not in RUNBOOK_SERVICES or severity not in RUNBOOK_SEVERITIES: return response(400, {'error': 'Invalid AWS service or severity selected.'})
            optional = {}
            for key, limit in [('existing_analysis', 8000), ('diagnostic_commands', 6000), ('logs', 10000), ('troubleshooting_notes', 6000)]:
                value = body.get(key, '') if isinstance(body.get(key, ''), str) else ''
                if len(value) > limit: return response(400, {'error': f"The '{key}' field is too long. Maximum is {limit} characters."})
                optional[key] = value.strip()
            prompt, max_tokens = build_runbook_prompt(title, service, severity, description, optional['existing_analysis'], optional['diagnostic_commands'], optional['logs'], optional['troubleshooting_notes']), 4096
        else:
            incident = body.get('incident', '')
            if not isinstance(incident, str) or not incident.strip(): return response(400, {'error': "The 'incident' field is required."})
            incident = incident.strip()
            if len(incident) > 10000: return response(400, {'error': 'Incident input is too long. Maximum is 10,000 characters.'})
            prompt, max_tokens = build_prompt(incident), 1200

        result = bedrock.converse(modelId=MODEL_ID, messages=[{'role': 'user', 'content': [{'text': prompt}]}], inferenceConfig={'maxTokens': max_tokens, 'temperature': 0.1})
        analysis = extract_json(result['output']['message']['content'][0]['text'])
        if action == 'generate_cli' and isinstance(analysis, dict):
            analysis['commands'] = sanitize_cli_commands(analysis.get('commands', [])); analysis.setdefault('service', service); analysis.setdefault('safety_note', 'These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment.')
        elif action == 'generate_runbook' and isinstance(analysis, dict):
            analysis['diagnostic_commands'] = sanitize_runbook_commands(analysis.get('diagnostic_commands', [])); analysis.setdefault('runbook_title', title); analysis.setdefault('severity', severity)
        return response(200, analysis)
    except json.JSONDecodeError:
        return response(502, {'error': 'Bedrock returned an invalid JSON response.'})
    except ValueError as exc:
        return response(400, {'error': str(exc)})
    except Exception as exc:
        print(f'Unexpected error: {type(exc).__name__}: {exc}')
        if action == 'analyze_logs':
            return response(500, {'error': 'Unable to analyze the incident.'})
        return response(500, {'error': 'Unable to complete the requested operation.'})
