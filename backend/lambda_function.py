import json
import os
import logging
import boto3
from botocore.exceptions import ClientError, BotoCoreError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Bedrock client
bedrock_client = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'ap-south-1'))

# Model configuration - using APAC Nova Lite inference profile
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'apac.amazon.nova-lite-v1:0')
MAX_TOKENS = int(os.environ.get('MAX_TOKENS', '2048'))
TEMPERATURE = float(os.environ.get('TEMPERATURE', '0.1'))

# Input validation constants
MAX_INCIDENT_LENGTH = 5000
MIN_INCIDENT_LENGTH = 10

# System prompt for the AI
SYSTEM_PROMPT = """You are an AWS DevOps troubleshooting assistant.

Analyze the incident provided by the user.

Return a practical troubleshooting analysis in JSON format with these exact keys:
1. severity (string: "LOW", "MEDIUM", "HIGH", "CRITICAL")
2. summary (string)
3. likely_causes (array of strings)
4. recommended_checks (array of strings)
5. troubleshooting_steps (array of strings)
6. remediation (array of strings)
7. aws_commands (array of strings)

Rules:
- Do not claim that you accessed the user's AWS account.
- Do not claim that you inspected CloudWatch logs unless the user actually provided them.
- Do not assume resources exist unless the user provided them.
- If information is missing, clearly state what additional information would be useful.
- Return ONLY valid JSON. No markdown, no extra text.
- Keep responses practical and actionable for a DevOps engineer."""

def validate_request(body: dict) -> tuple[bool, str]:
    """Validate the incoming request body."""
    if not body:
        return False, "Request body is empty"
    
    if 'incident' not in body:
        return False, "Missing required field: 'incident'"
    
    incident = body['incident']
    
    if not isinstance(incident, str):
        return False, "Field 'incident' must be a string"
    
    incident = incident.strip()
    
    if len(incident) < MIN_INCIDENT_LENGTH:
        return False, f"Incident description too short (minimum {MIN_INCIDENT_LENGTH} characters)"
    
    if len(incident) > MAX_INCIDENT_LENGTH:
        return False, f"Incident description too long (maximum {MAX_INCIDENT_LENGTH} characters)"
    
    return True, ""

def build_prompt(incident: str) -> str:
    """Build the user prompt for Bedrock."""
    return f"""Incident:
{incident}

Please analyze this incident and provide structured troubleshooting guidance in the specified JSON format."""

def call_bedrock(prompt: str) -> dict:
    """Call Amazon Bedrock Converse API."""
    try:
        response = bedrock_client.converse(
            modelId=MODEL_ID,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": prompt}]
                }
            ],
            system=[{"text": SYSTEM_PROMPT}],
            inferenceConfig={
                "maxTokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "topP": 0.9
            }
        )
        
        # Extract the response text
        output_text = response['output']['message']['content'][0]['text']
        logger.info(f"Bedrock response received, length: {len(output_text)}")
        
        # Strip markdown code fences if present
        output_text = output_text.strip()
        if output_text.startswith('```json'):
            output_text = output_text[7:]  # Remove ```json
        if output_text.startswith('```'):
            output_text = output_text[3:]  # Remove ```
        if output_text.endswith('```'):
            output_text = output_text[:-3]  # Remove trailing ```
        output_text = output_text.strip()
        
        return json.loads(output_text)
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        logger.error(f"Bedrock ClientError: {error_code} - {error_message}")
        raise
    except BotoCoreError as e:
        logger.error(f"Bedrock BotoCoreError: {str(e)}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Bedrock response as JSON: {str(e)}")
        logger.error(f"Raw response: {output_text}")
        raise ValueError("Invalid JSON response from model")
    except KeyError as e:
        logger.error(f"Unexpected response structure from Bedrock: {str(e)}")
        raise ValueError("Unexpected response structure from model")

def lambda_handler(event, context):
    """Main Lambda handler."""
    logger.info(f"Received event: {json.dumps(event, default=str)}")
    
    # Handle API Gateway request format
    try:
        # Parse body from API Gateway event
        if 'body' in event:
            body = event['body']
            if isinstance(body, str):
                body = json.loads(body)
        else:
            body = event
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    
    # Validate request
    is_valid, error_msg = validate_request(body)
    if not is_valid:
        logger.warning(f"Validation failed: {error_msg}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': error_msg})
        }
    
    incident = body['incident'].strip()
    logger.info(f"Processing incident (length: {len(incident)})")
    
    try:
        # Build prompt and call Bedrock
        prompt = build_prompt(incident)
        analysis = call_bedrock(prompt)
        
        # Validate response structure
        required_keys = ['severity', 'summary', 'likely_causes', 'recommended_checks', 
                        'troubleshooting_steps', 'remediation', 'aws_commands']
        for key in required_keys:
            if key not in analysis:
                analysis[key] = [] if key != 'severity' and key != 'summary' else ""
        
        # Ensure severity is valid
        valid_severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        if analysis.get('severity') not in valid_severities:
            analysis['severity'] = 'MEDIUM'
        
        logger.info("Analysis completed successfully")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(analysis)
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'ThrottlingException':
            logger.error("Bedrock throttling error")
            return {
                'statusCode': 429,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Service temporarily unavailable. Please try again.'})
            }
        elif error_code == 'AccessDeniedException':
            logger.error("Bedrock access denied - check IAM permissions")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Service configuration error'})
            }
        elif error_code == 'ValidationException':
            logger.error(f"Bedrock validation error: {e.response['Error']['Message']}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Model configuration error'})
            }
        else:
            logger.error(f"Bedrock error: {error_code}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Internal service error'})
            }
            
    except ValueError as e:
        logger.error(f"Response parsing error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Failed to process AI response'})
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }