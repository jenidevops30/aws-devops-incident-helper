import json
import os
import boto3

REGION = os.environ.get("AWS_REGION", "ap-south-1")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "apac.amazon.nova-lite-v1:0")

bedrock = boto3.client(
    "bedrock-runtime",
    region_name=REGION
)


def build_prompt(incident):
    return f"""
You are an AWS DevOps troubleshooting assistant.

Analyze the incident provided by the user.

Return ONLY valid JSON with exactly these fields:

{{
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Short explanation",
  "likely_causes": [
    "cause 1",
    "cause 2",
    "cause 3"
  ],
  "recommended_checks": [
    "check 1",
    "check 2",
    "check 3"
  ],
  "troubleshooting_steps": [
    "step 1",
    "step 2",
    "step 3"
  ],
  "remediation": [
    "remediation 1",
    "remediation 2"
  ],
  "aws_commands": [
    "command 1",
    "command 2"
  ]
}}

Important rules:

- Do not claim you accessed the user's AWS account.
- Do not claim you inspected CloudWatch logs unless the user provided them.
- Do not assume specific AWS resources exist.
- Do not invent resource IDs.
- If information is missing, explain what should be checked.
- Keep the recommendations practical and safe.
- AWS CLI commands should be read-only diagnostic commands whenever possible.

Incident:

{incident}
"""


def build_log_prompt(logs):
    return f"""
You are an AWS DevOps troubleshooting specialist and CloudWatch log analysis expert.

Analyze the user-provided application or CloudWatch logs below.

CRITICAL SAFETY & ATTRIBUTION RULES:
- You MUST NOT claim that you accessed CloudWatch, the user's AWS account, Lambda functions, EC2 instances, or any external AWS systems.
- Clearly state that your analysis is based strictly and solely on the logs provided by the user.
- Do not assume specific AWS accounts or invent resource IDs that do not appear in the logs.
- Identify specific log lines as evidence, quoting them verbatim and explaining what each suggests.
- Keep AWS CLI commands focused on safe diagnostic inspections and troubleshooting.

Return ONLY valid JSON with exactly these fields:

{{
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Executive summary of the failure or error observed in the logs",
  "error_pattern": "Name and brief pattern of the failure (e.g. Lambda Task Timeout, HTTP 502 Bad Gateway, RDS Connection Refused)",
  "evidence": [
    {{
      "quote": "Exact verbatim string or line from the provided log",
      "significance": "Detailed explanation of what this log line demonstrates or suggests"
    }}
  ],
  "likely_causes": [
    "Specific cause 1",
    "Specific cause 2",
    "Specific cause 3"
  ],
  "recommended_checks": [
    "Specific check 1",
    "Specific check 2",
    "Specific check 3"
  ],
  "troubleshooting_steps": [
    "Step 1",
    "Step 2",
    "Step 3"
  ],
  "remediation": [
    "Actionable remediation step 1",
    "Actionable remediation step 2"
  ],
  "aws_commands": [
    "aws ... diagnostic command 1",
    "aws ... diagnostic command 2"
  ],
  "prevention": [
    "Preventative measure 1",
    "Preventative measure 2"
  ]
}}

User-Provided Logs:

{logs}
"""


DESTRUCTIVE_COMMAND_KEYWORDS = [
    "terminate-", "delete-", " rm ", " rb ", "drop-", "purge-",
    "destroy-", "modify-", "update-", "create-", "put-", "stop-",
    "reboot-", "deregister-", "disassociate-", "detach-", "revoke-",
    "authorize-security-group-ingress", "authorize-security-group-egress"
]


def sanitize_cli_commands(commands):
    """Filter out destructive, modifying, or state-changing commands to ensure only safe read-only diagnostics remain."""
    safe_commands = []
    if not isinstance(commands, list):
        return []
    for item in commands:
        if isinstance(item, dict):
            cmd_str = item.get("command", "")
            is_destructive = any(kw in cmd_str.lower() for kw in DESTRUCTIVE_COMMAND_KEYWORDS)
            if is_destructive:
                continue
            item["risk"] = "READ_ONLY"
            safe_commands.append(item)
        elif isinstance(item, str):
            is_destructive = any(kw in item.lower() for kw in DESTRUCTIVE_COMMAND_KEYWORDS)
            if not is_destructive:
                safe_commands.append({
                    "command": item,
                    "description": "Diagnostic check",
                    "purpose": "Inspects AWS resource status",
                    "risk": "READ_ONLY"
                })
    return safe_commands


def build_cli_prompt(service, incident, resource_name, region):
    res_placeholder = resource_name.strip() if resource_name and resource_name.strip() else ""
    target_region = region.strip() if region and region.strip() else "ap-south-1"

    if res_placeholder:
        resource_instruction = f"Target resource identifier specified by user: '{res_placeholder}'. Use this exact identifier in the relevant parameter flags."
    else:
        resource_instruction = (
            "No specific resource name was provided. DO NOT invent an account ID, ARN, or fake identifier. "
            "Use clear uppercase placeholders such as FUNCTION_NAME, INSTANCE_ID, BUCKET_NAME, API_ID, ROLE_NAME, LOG_GROUP, DB_INSTANCE_ID, or SECURITY_GROUP_ID."
        )

    return f"""
You are an expert AWS Solutions Architect and AWS CLI diagnostic specialist.

Generate safe, read-only AWS CLI diagnostic commands to help an engineer troubleshoot and investigate the following AWS issue.

AWS Service: {service}
Diagnostic Goal / Incident: {incident}
Target Region: {target_region}
{resource_instruction}

STRICT SAFETY RULES:
1. ONLY generate READ-ONLY diagnostic commands (such as describe-*, get-*, list-*, head-*, etc.).
2. NEVER generate destructive, modifying, or state-changing commands (e.g., delete-*, terminate-*, rm, rb, modify-*, update-*, create-*, put-*, reboot-*, stop-*).
3. Do not invent AWS account numbers, arbitrary ARNs, or secret keys.
4. Include the '--region {target_region}' flag where applicable.

Return ONLY valid JSON matching this exact structure:

{{
  "service": "{service}",
  "summary": "Short explanation of the diagnostic strategy and what these commands will investigate",
  "commands": [
    {{
      "command": "aws <service> <subcommand> [flags]",
      "description": "What this specific command checks",
      "purpose": "Why running this check is useful for investigating the stated issue",
      "risk": "READ_ONLY"
    }}
  ],
  "safety_note": "These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment."
}}
"""


def is_options_request(event):
    """Check if the incoming request is an HTTP OPTIONS preflight request."""
    if not isinstance(event, dict):
        return False
    # REST API (Payload format v1)
    if event.get("httpMethod") == "OPTIONS":
        return True
    # HTTP API (Payload format v2)
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return True
    return False


def extract_json(text: str):
    """Extract and parse JSON from model output, handling markdown fences and surrounding commentary."""
    text = text.strip()

    # Handle Markdown code blocks
    if "```" in text:
        fence_start = text.find("```")
        newline_after_start = text.find("\n", fence_start)
        fence_end = text.rfind("```")
        if newline_after_start != -1 and fence_end > newline_after_start:
            candidate = text[newline_after_start + 1:fence_end].strip()
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Attempt to extract JSON from surrounding text by finding outermost braces
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return json.loads(text[start_idx:end_idx + 1])

    raise json.JSONDecodeError("No valid JSON found in model output", text, 0)


def lambda_handler(event, context):
    # Handle CORS preflight OPTIONS request immediately
    if is_options_request(event):
        return response(200, {"message": "OK"})

    try:
        # API Gateway can provide the body as a string.
        body = event.get("body", event) if isinstance(event, dict) else event

        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return response(
                    400,
                    {"error": "Invalid JSON in request body."}
                )

        if not isinstance(body, dict):
            return response(
                400,
                {"error": "Invalid request format: expected JSON object."}
            )

        action = body.get("action", "").strip()

        # Handle CloudWatch Log Analysis
        if action == "analyze_logs":
            logs = body.get("logs", "")
            if not isinstance(logs, str):
                return response(
                    400,
                    {"error": "The 'logs' field must be a string."}
                )

            logs = logs.strip()
            if not logs:
                return response(
                    400,
                    {"error": "The 'logs' field is required when action is 'analyze_logs'."}
                )

            if len(logs) > 20000:
                return response(
                    400,
                    {"error": "Log input is too long. Maximum is 20,000 characters."}
                )

            # Safe privacy logging: Record payload size without writing raw user logs to CloudWatch
            print(f"Executing analyze_logs: payload_length={len(logs)} chars")
            prompt = build_log_prompt(logs)
            max_tokens = 2048

        # Handle AWS CLI Diagnostic Command Generation
        elif action == "generate_cli":
            service = body.get("service", "")
            if not isinstance(service, str) or not service.strip():
                return response(
                    400,
                    {"error": "The 'service' field is required when action is 'generate_cli'."}
                )
            service = service.strip()
            if len(service) > 100:
                return response(
                    400,
                    {"error": "The 'service' field is too long. Maximum is 100 characters."}
                )

            incident = body.get("incident", "")
            if not isinstance(incident, str) or not incident.strip():
                return response(
                    400,
                    {"error": "The 'incident' field is required when action is 'generate_cli'."}
                )
            incident = incident.strip()
            if len(incident) > 5000:
                return response(
                    400,
                    {"error": "Incident description is too long. Maximum is 5,000 characters."}
                )

            resource_name = body.get("resource_name", "")
            if not isinstance(resource_name, str):
                resource_name = ""
            resource_name = resource_name.strip()[:200]

            region = body.get("region", "")
            if not isinstance(region, str):
                region = "ap-south-1"
            region = region.strip()[:50] or "ap-south-1"

            print(f"Executing generate_cli: service={service}, payload_length={len(incident)} chars")
            prompt = build_cli_prompt(service, incident, resource_name, region)
            max_tokens = 2048

        # Handle Standard Incident Analysis (Default / Legacy)
        else:
            incident = body.get("incident", "")
            if not isinstance(incident, str):
                return response(
                    400,
                    {"error": "The 'incident' field must be a string."}
                )

            incident = incident.strip()
            if not incident:
                return response(
                    400,
                    {"error": "The 'incident' field is required."}
                )

            if len(incident) > 10000:
                return response(
                    400,
                    {"error": "Incident input is too long. Maximum is 10,000 characters."}
                )

            print(f"Executing analyze_incident: payload_length={len(incident)} chars")
            prompt = build_prompt(incident)
            max_tokens = 1200

        result = bedrock.converse(
            modelId=MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": 0.1
            }
        )

        text = result["output"]["message"]["content"][0]["text"]
        analysis = extract_json(text)

        # Post-process CLI commands to enforce safety guardrails
        if action == "generate_cli" and isinstance(analysis, dict):
            raw_commands = analysis.get("commands", [])
            analysis["commands"] = sanitize_cli_commands(raw_commands)
            if not analysis.get("service"):
                analysis["service"] = service
            if not analysis.get("safety_note"):
                analysis["safety_note"] = "These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment."

        return response(
            200,
            analysis
        )

    except json.JSONDecodeError:
        return response(
            502,
            {
                "error": "Bedrock returned an invalid JSON response."
            }
        )

    except Exception as exc:
        print(f"Unexpected error: {type(exc).__name__}: {exc}")

        return response(
            500,
            {
                "error": "Unable to analyze the incident."
            }
        )


def response(status_code, body, additional_headers=None):
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    }
    if additional_headers:
        headers.update(additional_headers)
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": json.dumps(body)
    }