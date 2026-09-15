import json
import os
import boto3

REGION = os.environ.get('AWS_REGION', 'ap-south-1')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-lite-v1:0')
bedrock = boto3.client('bedrock-runtime', region_name=REGION)

DESTRUCTIVE_COMMAND_KEYWORDS = [
    'terminate-', 'delete-', ' rm ', ' rm\t', ' rb ', 'drop-', 'purge-', 'destroy-',
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
{{
  "runbook_title":"...","incident_overview":"...","severity":"Unknown|Low|Medium|High|Critical","impact":"...",
  "symptoms":["..."],"initial_triage":["..."],"evidence_to_collect":["..."],
  "diagnostic_commands":[{{"command":"aws ...","description":"...","purpose":"...","risk":"READ_ONLY"}}],
  "likely_root_causes":["..."],"troubleshooting_procedure":["..."],"remediation":["..."],
  "verification":["..."],"rollback_considerations":["..."],"prevention":["..."],"post_incident_checklist":["..."]
}}
Title: {title}\nAWS Service: {service}\nSeverity: {severity}\nIncident Description: {description}\nExisting Incident Analysis: {existing_analysis}\nDiagnostic Commands: {diagnostic_commands}\nLogs / Evidence: {logs}\nTroubleshooting Notes: {troubleshooting_notes}
If information is missing, say what should be checked instead of inventing facts.'''


def build_report_prompt(title, service, severity, description, analysis, logs, commands, troubleshooting, remediation, verification, runbook, timestamp):
    return f'''You are a senior AWS DevOps incident-response report writer.
Create a professional incident report using ONLY the operator-supplied information below.
Never claim access to AWS accounts or systems. Never invent account IDs, ARNs, resource names, timestamps, metrics, logs, impact, or confirmed root causes.
Clearly distinguish observed evidence from AI recommendations. A root cause is CONFIRMED only when the supplied evidence supports it; otherwise put it under probable or unknown.
Diagnostic commands must be READ-ONLY. Never include destructive or state-changing commands. Never include credentials, secrets, access keys, or tokens.
For missing information, use exactly "Information not provided." rather than guessing.
Return ONLY valid JSON with exactly this schema:
{{
  "incident_overview": {{"title":"...","service":"...","severity":"Unknown|Low|Medium|High|Critical","timestamp":"...","status":"..."}},
  "executive_summary":"...","impact":["..."],"symptoms":["..."],"evidence":["..."],
  "root_cause": {{"confirmed":["..."],"probable":["..."],"unknown":["..."]}},
  "troubleshooting":["..."],
  "diagnostic_commands":[{{"command":"aws ...","description":"...","purpose":"...","risk":"READ_ONLY"}}],
  "remediation": {{"immediate":["..."],"long_term":["..."]}},"verification":["..."],"rollback":["..."],"prevention":["..."],
  "post_incident_checklist":["Incident resolved","Root cause confirmed","Monitoring verified","Alerts verified","Logs reviewed","Documentation updated","Runbook updated","Preventive action identified"]
}}
Incident Title: {title}\nAWS Service: {service}\nSeverity: {severity}\nDate/Time supplied by operator: {timestamp}\nIncident Description: {description}\nIncident Analysis: {analysis}\nLogs / Evidence: {logs}\nDiagnostic Commands: {commands}\nTroubleshooting Steps: {troubleshooting}\nRemediation: {remediation}\nVerification Results: {verification}\nRunbook: {runbook}\n'''


def build_correlation_prompt(incident, logs, diagnostics, cli, previous, runbook):
    return f'''You are an evidence-aware AWS DevOps incident correlation specialist.
Correlate ONLY the operator-supplied evidence below. Connect related symptoms, log patterns, diagnostics, CLI output, previous incidents, and runbook context without pretending to have AWS access.
Never invent AWS account IDs, ARNs, resource names, metrics, timestamps, log lines, commands, deployment facts, credentials, or impact.
Do not turn a hypothesis into a confirmed root cause. Classify findings as Confirmed, Probable, Possible, or Unknown based only on supplied evidence. Explain relationships and identify the next safe checks needed to increase confidence.
Do not execute commands. Any CLI commands returned must be READ-ONLY diagnostic commands only; never include destructive or state-changing commands.
For missing information use "Information not provided.".
Return ONLY valid JSON with exactly this schema:
{{
  "summary":"Short evidence-aware correlation summary",
  "severity":"LOW|MEDIUM|HIGH|CRITICAL|Unknown",
  "evidence_relationships":["Explain how supplied evidence relates"],
  "confirmed_findings":["Only directly supported findings"],
  "probable_findings":["Strong but not proven relationships"],
  "possible_findings":["Plausible relationships needing validation"],
  "unknowns":["Important unanswered questions"],
  "recommended_checks":["Safe next checks"],
  "troubleshooting_steps":["Ordered review-first steps"],
  "safe_cli_commands":[{{"command":"aws ...","description":"...","purpose":"...","risk":"READ_ONLY"}}],
  "next_actions":["Concrete operator actions that do not modify resources"]
}}

INCIDENT DESCRIPTION:\n{incident}
CLOUDWATCH / APPLICATION LOGS:\n{logs}
AWS DIAGNOSTIC EVIDENCE:\n{diagnostics}
CLI OUTPUT:\n{cli}
PREVIOUS INCIDENT CONTEXT:\n{previous}
RUNBOOK / TROUBLESHOOTING CONTEXT:\n{runbook}
'''


def sanitize_cli_commands(commands):
    safe = []
    if not isinstance(commands, list):
        return safe
    for item in commands:
        command = item.get('command', '') if isinstance(item, dict) else item if isinstance(item, str) else ''
        if not isinstance(command, str) or not command.strip():
            continue
        if any(keyword in command.lower() for keyword in DESTRUCTIVE_COMMAND_KEYWORDS):
            continue
        if isinstance(item, dict):
            cleaned = dict(item)
            cleaned['risk'] = 'READ_ONLY'
        else:
            cleaned = {'command': command, 'description': 'Diagnostic check', 'purpose': 'Inspects AWS resource state', 'risk': 'READ_ONLY'}
        safe.append(cleaned)
    return safe


def sanitize_runbook_commands(commands):
    return sanitize_cli_commands(commands)


def sanitize_correlation_commands(commands):
    safe = []
    for item in sanitize_cli_commands(commands):
        if not item['command'].lstrip().startswith('aws '):
            continue
        safe.append({'command': item['command'], 'description': item.get('description', 'Diagnostic check'), 'purpose': item.get('purpose', 'Collects diagnostic evidence'), 'risk': 'READ_ONLY'})
    return safe


def is_options_request(event):
    return isinstance(event, dict) and (event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS')


def extract_json(text):
    text = text.strip()
    if '```' in text:
        start = text.find('```')
        newline = text.find('\n', start)
        end = text.rfind('```')
        if newline != -1 and end > newline:
            try:
                return json.loads(text[newline + 1:end].strip())
            except json.JSONDecodeError:
                pass
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find('{'), text.rfind('}')
        if start != -1 and end > start:
            return json.loads(text[start:end + 1])
        raise


def response(status_code, body):
    return {'statusCode': status_code, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token', 'Access-Control-Allow-Methods': 'POST,OPTIONS'}, 'body': json.dumps(body)}


def call_bedrock(prompt, max_tokens):
    result = bedrock.converse(modelId=MODEL_ID, messages=[{'role': 'user', 'content': [{'text': prompt}]}], inferenceConfig={'maxTokens': max_tokens, 'temperature': 0.2})
    return extract_json(result['output']['message']['content'][0]['text'])


def require_string(body, key, required=False, max_length=None, default=''):
    value = body.get(key, default)
    if not isinstance(value, str):
        raise ValueError(f"The '{key}' field must be a string.")
    value = value.strip()
    if required and not value:
        raise ValueError(f"The '{key}' field is required.")
    if max_length and len(value) > max_length:
        raise ValueError(f"The '{key}' field is too long. Maximum is {max_length} characters.")
    return value


def lambda_handler(event, context):
    if is_options_request(event):
        return response(200, {'message': 'OK'})
    try:
        body = event.get('body', event) if isinstance(event, dict) else event
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return response(400, {'error': 'Invalid JSON in request body.'})
        if not isinstance(body, dict):
            return response(400, {'error': 'Invalid request format: expected JSON object.'})

        action = body.get('action', '')
        action = action.strip() if isinstance(action, str) else ''

        if action == 'analyze_logs':
            logs = require_string(body, 'logs', True, 20000)
            prompt, max_tokens = build_log_prompt(logs), 2048
        elif action == 'generate_cli':
            service = require_string(body, 'service', True, 100)
            incident = require_string(body, 'incident', True, 5000)
            resource_name = require_string(body, 'resource_name', False, 200)
            region = require_string(body, 'region', False, 50, 'ap-south-1') or 'ap-south-1'
            prompt, max_tokens = build_cli_prompt(service, incident, resource_name, region), 2048
        elif action == 'generate_runbook':
            title = require_string(body, 'title', True, 160)
            service = require_string(body, 'service', True, 100)
            severity = require_string(body, 'severity', False, 20, 'Unknown') or 'Unknown'
            description = require_string(body, 'description', True, 10000)
            if service not in RUNBOOK_SERVICES:
                return response(400, {'error': 'Invalid AWS service selected.'})
            if severity not in RUNBOOK_SEVERITIES:
                return response(400, {'error': 'Invalid severity selected.'})
            optional = {key: require_string(body, key, False, limit) for key, limit in [('existing_analysis', 8000), ('diagnostic_commands', 6000), ('logs', 10000), ('troubleshooting_notes', 6000)]}
            prompt = build_runbook_prompt(title, service, severity, description, optional['existing_analysis'], optional['diagnostic_commands'], optional['logs'], optional['troubleshooting_notes'])
            max_tokens = 4096
        elif action == 'generate_incident_report':
            values = {key: require_string(body, key, key in {'title', 'description'}, limit) for key, limit in [('title',160),('service',100),('severity',20),('description',10000),('analysis',8000),('logs',10000),('diagnostic_commands',6000),('troubleshooting',6000),('remediation',6000),('verification',6000),('runbook',8000),('timestamp',100)]}
            if values['severity'] not in RUNBOOK_SEVERITIES:
                return response(400, {'error': 'Invalid severity selected.'})
            prompt, max_tokens = build_report_prompt(**values), 4096
        elif action == 'generate_incident_correlation':
            incident = require_string(body, 'incident', True, 10000)
            logs = require_string(body, 'logs', False, 12000)
            diagnostics = require_string(body, 'diagnostics', False, 10000)
            cli = require_string(body, 'cli', False, 8000)
            previous = require_string(body, 'previous', False, 8000)
            runbook = require_string(body, 'runbook', False, 8000)
            prompt, max_tokens = build_correlation_prompt(incident, logs, diagnostics, cli, previous, runbook), 4096
        else:
            incident = require_string(body, 'incident', True, 10000)
            prompt, max_tokens = build_prompt(incident), 2048

        print(f'Executing {action or "incident"}: payload_length={len(prompt)} chars')
        result = call_bedrock(prompt, max_tokens)

        if action == 'analyze_logs':
            result['aws_commands'] = sanitize_cli_commands(result.get('aws_commands', []))
        elif action == 'generate_cli':
            result['commands'] = sanitize_cli_commands(result.get('commands', []))
        elif action == 'generate_runbook':
            result['diagnostic_commands'] = sanitize_runbook_commands(result.get('diagnostic_commands', []))
        elif action == 'generate_incident_report':
            result['diagnostic_commands'] = sanitize_runbook_commands(result.get('diagnostic_commands', []))
        elif action == 'generate_incident_correlation':
            result['safe_cli_commands'] = sanitize_correlation_commands(result.get('safe_cli_commands', []))
        else:
            result['aws_commands'] = sanitize_cli_commands(result.get('aws_commands', []))

        return response(200, result)
    except ValueError as exc:
        return response(400, {'error': str(exc)})
    except Exception as exc:
        print(f'Unhandled error: {type(exc).__name__}: {exc}')
        return response(500, {'error': 'Unable to analyze the request right now. Please try again.'})
