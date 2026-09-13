# Backend - AWS Lambda Function

This directory contains the AWS Lambda function that powers the AWS DevOps Incident Helper backend.

## Files

- `lambda_function.py` - Core Lambda handler with input validation, CORS support, Bedrock Converse invocation, and JSON parsing
- `test_lambda.py` - Automated unit test suite with mocked Bedrock responses
- `package.sh` - Deployment packaging script that tests and creates `lambda_function.zip`
- `requirements.txt` - Python runtime and testing dependencies

## Functionality

The Lambda function:
1. Receives requests from API Gateway (supporting both HTTP API v2 and REST API v1 formats)
2. Handles CORS preflight (`OPTIONS`) requests immediately
3. Validates the input (`incident` string presence, whitespace check, max length 10,000 characters)
4. Constructs a structured prompt for Amazon Bedrock
5. Calls the Bedrock Converse API using an Amazon Nova model
6. Parses, extracts, and validates the AI JSON response (handling markdown fences and commentary)
7. Returns structured JSON with troubleshooting guidance

## Response Format

```json
{
  "severity": "HIGH",
  "summary": "The Lambda function is exceeding its execution time.",
  "likely_causes": [
    "Slow downstream API",
    "Database connection timeout",
    "VPC networking issue"
  ],
  "recommended_checks": [
    "Check CloudWatch logs",
    "Check Lambda timeout configuration",
    "Check downstream API latency"
  ],
  "troubleshooting_steps": [
    "Review CloudWatch Logs for the Lambda function",
    "Check the Lambda timeout setting in configuration",
    "Analyze downstream service response times"
  ],
  "remediation": [
    "Increase timeout if appropriate",
    "Investigate slow dependencies",
    "Review VPC networking"
  ],
  "aws_commands": [
    "aws lambda get-function-configuration --function-name <function-name>",
    "aws logs filter-log-events --log-group-name /aws/lambda/<function-name>"
  ]
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEDROCK_MODEL_ID` | Bedrock inference profile ID | `apac.amazon.nova-lite-v1:0` |
| `MAX_TOKENS` | Maximum output tokens | `2048` |
| `TEMPERATURE` | Model temperature (0.0-1.0) | `0.1` |
| `AWS_REGION` | AWS region for Bedrock client | `ap-south-1` |

## IAM Permissions Required

The Lambda execution role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:ap-south-1::inference-profile/apac.amazon.nova-lite-v1:0"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-south-1:*:log-group:/aws/lambda/*"
    }
  ]
}
```

## Testing
 
### 1. Automated Unit Tests (Offline / Mocked)
 
The unit test suite runs offline without requiring active AWS credentials or making network calls:
 
```bash
python3 -m unittest backend/test_lambda.py
# or with pytest:
pytest backend/test_lambda.py
```
 
Tests verify:
- Preflight `OPTIONS` requests for both API Gateway v1 and v2
- Validation logic (`incident` presence, whitespace, character length limits, bad JSON in body)
- Bedrock output parsing with code fences (` ```json `) and surrounding commentary
- Error handling (malformed model JSON $\to$ 502, exceptions $\to$ 500)
 
### 2. Manual Local Testing (Live AWS Bedrock)
 
Requires AWS credentials configured with access to Amazon Bedrock:
 
```bash
python -c "
import json
from lambda_function import lambda_handler

event = {
    'body': json.dumps({
        'incident': 'Lambda function is timing out after 30 seconds'
    })
}
result = lambda_handler(event, None)
print(json.dumps(result, indent=2))
"
```
 
## Packaging & Deployment
 
To create the deployment `.zip` package for AWS Lambda:
 
```bash
./backend/package.sh
```
 
This runs the unit test suite and packages `lambda_function.py` into `backend/lambda_function.zip`.
 
Deploy or update the Lambda function via AWS CLI:
 
```bash
aws lambda update-function-code \
  --function-name aws-devops-incident-helper \
  --zip-file fileb://backend/lambda_function.zip \
  --region ap-south-1
```