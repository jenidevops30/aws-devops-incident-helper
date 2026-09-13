# AWS DevOps Incident Helper

An AI-powered serverless application that helps developers and DevOps engineers understand AWS and infrastructure-related errors and provides actionable troubleshooting guidance.

## 🚀 Live Demo

**Frontend:** https://main.d2v4zdm3pgizqg.amplifyapp.com

**API Endpoint:** https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com/analyze

## 📌 Project Overview

AWS DevOps Incident Helper is a lightweight web application where users can paste an error message, log output, or incident description. The application analyzes the input using Amazon Bedrock and generates a structured troubleshooting response.

The goal is to help developers quickly understand:
- What went wrong
- What might have caused it
- What they should check
- Which AWS commands may help
- How they can resolve the problem

## ✨ Features

- **Incident Description Analyzer**: Large textarea for pasting error messages, logs, or incident descriptions (up to 10,000 chars)
- **CloudWatch Log Analyzer**: Dedicated log parsing engine for pasting raw multi-line CloudWatch logs (up to 20,000 chars) with verbatim log evidence extraction
- **CLI Diagnostic Generator (`/cli-generator`)**: Safe, read-only AWS CLI command generator with copy and text runbook download capabilities
- **Preset Scenarios**: Ready-to-use presets for Lambda timeouts, API Gateway 5xx, RDS connection errors, and S3 AccessDenied
- **Incident History**: Client-side persistent storage with real-time keyword search, severity filtering, detailed inspection modal, and Slack/Jira markdown export
- **Related Saved Incidents**: Automatically detects and surfaces relevant prior incidents when analyzing new issues
- **AI Analysis**: Powered by Amazon Bedrock (Nova Lite via APAC inference profile)
- **Structured Response**: 
  - Standard Incidents: Severity, summary, likely causes, recommended checks, troubleshooting steps, remediation, and AWS CLI commands
  - CloudWatch Logs: Adds error pattern breakdown, verbatim log quotes with significance, and long-term prevention strategies
  - CLI Diagnostics: Read-only command playbook, verification descriptions, investigative purpose, and safety warnings
- **Responsive UI**: Clean, AWS-inspired console aesthetic with intuitive tabs, code copy buttons, and responsive design
- **Security & Privacy**: Zero server-side log persistence, zero direct AWS account access claims, and $0-at-rest client-side architecture

## 🏗️ Architecture

```
User Browser (React + Vite on AWS Amplify)
    │
    │  Client-Side: LocalStorage Incident History & Related Matches
    ▼
Amazon API Gateway (HTTP API - POST /analyze)
    │
    ▼
AWS Lambda (Python 3.11, ap-south-1)
    │  Privacy: Logs metadata only, never raw customer logs
    │  Safety: Dual-layer read-only command sanitizer
    ▼
Amazon Bedrock (Nova Lite via APAC Inference Profile)
    │
    ▼
Structured Troubleshooting & CLI Runbook JSON
    │
    ▼
Browser (Interactive Log, Incident & CLI Playbook Explorer)
```

### AWS Services Used

- **AWS Amplify** - Frontend hosting & continuous deployment
- **Amazon API Gateway** - HTTP API endpoint (`POST /analyze`)
- **AWS Lambda** - Serverless compute (Python 3.11, 256MB, 30s timeout)
- **Amazon Bedrock** - AI inference (Nova Lite `apac.amazon.nova-lite-v1:0`)
- **Amazon CloudWatch** - Monitoring & Lambda execution logs (privacy-hardened)
- **AWS IAM** - Least-privilege permissions

### Region

- **Primary**: `ap-south-1` (Asia Pacific - Mumbai)
- **Bedrock Model**: `apac.amazon.nova-lite-v1:0` (cross-region inference profile)

## 📡 API Specification

### 1. Analyze Incident Description

**Endpoint:** `POST /analyze`

**Request:**
```json
{
  "incident": "Lambda function is timing out after 30 seconds"
}
```

**Response:**
```json
{
  "severity": "MEDIUM",
  "summary": "...",
  "likely_causes": ["..."],
  "recommended_checks": ["..."],
  "troubleshooting_steps": ["..."],
  "remediation": ["..."],
  "aws_commands": ["aws lambda get-function --function-name <name>"]
}
```

### 2. Analyze CloudWatch Logs

**Endpoint:** `POST /analyze`

**Request:**
```json
{
  "action": "analyze_logs",
  "logs": "2026-09-13T10:00:00.000Z Task timed out after 30.00 seconds\nREPORT RequestId: abc-123 Duration: 30000 ms..."
}
```

**Response:**
```json
{
  "severity": "HIGH",
  "summary": "Lambda invocation timeout detected from CloudWatch logs",
  "error_pattern": "Task timed out after 30.00 seconds",
  "evidence": [
    {
      "quote": "Task timed out after 30.00 seconds",
      "significance": "Direct timeout indicator exceeding function timeout configuration"
    }
  ],
  "likely_causes": ["..."],
  "recommended_checks": ["..."],
  "troubleshooting_steps": ["..."],
  "remediation": ["..."],
  "aws_commands": ["aws lambda update-function-configuration ..."],
  "prevention": ["..."]
}
```

### 3. Generate CLI Diagnostics

**Endpoint:** `POST /analyze`

**Request:**
```json
{
  "action": "generate_cli",
  "service": "Lambda",
  "incident": "Lambda function is timing out after 30 seconds",
  "resource_name": "payment-processor",
  "region": "ap-south-1"
}
```

**Response:**
```json
{
  "service": "Lambda",
  "summary": "Retrieves configuration and invocation metrics for payment-processor to isolate timeout triggers.",
  "commands": [
    {
      "command": "aws lambda get-function-configuration --function-name payment-processor --region ap-south-1",
      "description": "Retrieves current function timeout, memory size, and environment variables.",
      "purpose": "Verifies whether configured timeout is too low for downstream latency.",
      "risk": "READ_ONLY"
    }
  ],
  "safety_note": "These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment."
}
```

## 🛠️ Technology Stack

### Frontend
- React 18
- Vite
- JavaScript (ES6+)
- CSS3

### Backend
- Python 3.11
- AWS Lambda
- boto3 (AWS SDK for Python)

### AI
- Amazon Bedrock
- Amazon Nova Lite (via APAC inference profile)

### Infrastructure
- AWS Amplify
- Amazon API Gateway
- AWS IAM
- Amazon CloudWatch

## 🔐 Security

- **Least Privilege IAM**: Lambda only has permissions to invoke the specific Bedrock model and write CloudWatch logs
- **No Hardcoded Credentials**: All credentials managed via IAM roles
- **Input Validation**: Server-side validation of all user inputs
- **CORS Configuration**: Properly configured for the deployed frontend origin
- **No Secrets in Code**: No AWS credentials, API keys, or tokens in source code

## 💰 Cost Strategy

This project uses inexpensive serverless services:
- AWS Amplify (free tier eligible)
- Amazon API Gateway (free tier eligible)
- AWS Lambda (free tier eligible)
- Amazon Bedrock (pay per request)
- Amazon CloudWatch (free tier eligible)

No EC2, RDS, ECS, OpenSearch, NAT Gateway, or Load Balancers used.

## 🧪 Testing

### Test Cases

1. **Lambda Timeout**: "Lambda function is timing out after 30 seconds"
2. **API Gateway 502**: "API Gateway returns 502 Bad Gateway"
3. **S3 Access Denied**: "AccessDeniedException when uploading an object to S3"
4. **Empty Input**: Validates minimum length requirement
5. **Invalid JSON**: Handles malformed requests gracefully
6. **Very Long Input**: Validates maximum length requirement

## 📁 Project Structure

```
aws-devops-incident-helper/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/
│   ├── lambda_function.py
│   ├── requirements.txt
│   └── README.md
│
├── architecture/
│   └── architecture.txt
│
├── screenshots/
│
├── README.md
├── PRD.md
└── .gitignore
```

## 🚀 Deployment

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- Python 3.11+

### Backend Deployment

1. Create IAM role for Lambda:
```bash
aws iam create-role --role-name aws-devops-incident-helper-lambda-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
```

2. Attach least-privilege policy:
```bash
aws iam put-role-policy --role-name aws-devops-incident-helper-lambda-role \
  --policy-name BedrockAndLogsPolicy \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["bedrock:InvokeModel"],"Resource":["arn:aws:bedrock:ap-south-1:*:inference-profile/apac.amazon.nova-lite-v1:0"]},{"Effect":"Allow","Action":["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],"Resource":"arn:aws:logs:ap-south-1:*:log-group:/aws/lambda/aws-devops-incident-helper*"}]}'
```

3. Create Lambda function:
```bash
cd backend
zip -r lambda_function.zip lambda_function.py
aws lambda create-function --function-name aws-devops-incident-helper \
  --runtime python3.11 --role <role-arn> \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda_function.zip \
  --environment Variables={BEDROCK_MODEL_ID=apac.amazon.nova-lite-v1:0,MAX_TOKENS=2048,TEMPERATURE=0.1} \
  --region ap-south-1
```

4. Create API Gateway and connect to Lambda

### Frontend Deployment

1. Build the frontend:
```bash
cd frontend
npm ci
npm run build
```

2. Deploy to AWS Amplify (via console or CLI)

## 📸 Screenshots

1. **Application Homepage**
   ![Application Homepage](screenshots/01-application-homepage.png)

2. **User Entering an Incident**
   ![User Entering an Incident](screenshots/02-user-entering-incident.png)

3. **AI-Generated Incident Analysis**
   ![AI-Generated Incident Analysis](screenshots/03-ai-generated-incident-analysis.png)

4. **AWS Lambda Configuration**
   ![AWS Lambda Configuration](screenshots/04-aws-lambda-configuration.png)

5. **API Gateway Endpoint**
   ![API Gateway Endpoint](screenshots/05-api-gateway-endpoint.png)

6. **AWS Architecture Diagram**
   ![Architecture Diagram](screenshots/06-architecture-diagram.png)

## 📚 What I Learned

- Creating a serverless application with AWS Amplify, API Gateway, Lambda, and Bedrock
- Configuring least-privilege IAM permissions for Bedrock inference profiles
- Handling cross-region Bedrock model access via inference profiles
- Parsing and validating AI model responses (handling markdown code fences)
- CORS configuration for API Gateway with Lambda proxy integration
- Manual deployment to Amplify using CreateDeployment/StartDeployment APIs
- CloudWatch logging for debugging Lambda functions

## 🏆 AWS Weekend Deployment Challenge

This project was built for the AWS Weekend Deployment Challenge, demonstrating:
1. Building a real serverless application
2. Deploying it on AWS using multiple services
3. Integrating Amazon Bedrock for AI-powered features
4. Making the application publicly accessible
5. Documenting the architecture and deployment process

## 🔮 Future Improvements

- CloudWatch log analysis integration
- AWS account-aware troubleshooting (with user permissions)
- Incident history with DynamoDB storage
- User authentication with Amazon Cognito
- Slack/Teams integration for notifications
- ECS/EKS troubleshooting support
- CloudFormation/Terraform error analysis
- Automated remediation suggestions
- CI/CD pipeline integration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

---

**Built with ❤️ for the AWS Weekend Deployment Challenge**
