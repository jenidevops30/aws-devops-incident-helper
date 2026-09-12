# Backend - AWS Lambda Function

This directory contains the AWS Lambda function that powers the AWS DevOps Incident Helper backend.

## Files


- `requirements.txt` - Python dependencies

## Functionality

The Lambda function:
1. Receives POST requests from API Gateway with an incident description
2. Validates the input (length, format, required fields)
3. Constructs a structured prompt for Amazon Bedrock
4. Calls the Bedrock Converse API using an Amazon Nova model
5. Parses and validates the AI response
6. Returns structured JSON with troubleshooting guidance

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

## Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Test locally (requires AWS credentials configured)
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

## Deployment

The Lambda function will be deployed via AWS CLI or infrastructure-as-code (CloudFormation/CDK) as part of the full application deployment.