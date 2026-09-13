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

- **Incident Input**: Large textarea for pasting errors, logs, or incident descriptions
- **Example Incidents**: Pre-defined buttons for common AWS issues (Lambda timeout, API Gateway 502, S3 AccessDenied, etc.)
- **AI Analysis**: Powered by Amazon Bedrock (Nova Lite) for intelligent troubleshooting
- **Structured Response**: Severity, summary, likely causes, recommended checks, troubleshooting steps, remediation, and AWS CLI commands
- **Responsive UI**: Clean, modern interface that works on desktop and mobile
- **Error Handling**: Graceful handling of network errors, validation errors, and API failures

## 🏗️ Architecture

```
User Browser
    │
    ▼
AWS Amplify (React + Vite)
    │
    ▼
Amazon API Gateway (HTTP API)
    │
    ▼
AWS Lambda (Python 3.11)
    │
    ▼
Amazon Bedrock (Nova Lite via APAC Inference Profile)
    │
    ▼
AI Troubleshooting Response
    │
    ▼
Browser
```

### AWS Services Used

- **AWS Amplify** - Frontend hosting
- **Amazon API Gateway** - HTTP API endpoint (POST /analyze)
- **AWS Lambda** - Serverless compute (Python 3.11)
- **Amazon Bedrock** - AI inference (Nova Lite)
- **Amazon CloudWatch** - Logging and monitoring
- **AWS IAM** - Least-privilege permissions

### Region

- **Primary**: ap-south-1 (Asia Pacific - Mumbai)
- **Bedrock Model**: apac.amazon.nova-lite-v1:0 (cross-region inference)

## 📡 API Specification

### Analyze Incident

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

*Screenshots to be added:*
1. Application homepage
2. User entering an incident
3. AI-generated incident analysis
4. AWS Lambda configuration
5. API Gateway endpoint
6. Architecture diagram

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
