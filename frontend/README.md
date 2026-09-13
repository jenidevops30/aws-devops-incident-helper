# AWS DevOps Incident Helper - Frontend

AI-powered serverless DevOps troubleshooting assistant built with React and Vite, powered by Amazon Bedrock (Nova 2 Lite).

## Features

- **Product Landing Page (`/`)**:
  - AWS-styled navigation and hero with live product illustration
  - Three-step incident troubleshooting lifecycle ("How It Works")
  - Enterprise feature capabilities breakdown
  - Serverless architecture diagram & highlights panel
  - Quick-start example incidents
  - Call-to-Action and AWS-themed footer

- **Interactive Incident Analyzer (`/analyze`)**:
  - Direct incident input with live character counter (up to 10,000 characters)
  - Quick-fill preset buttons (Lambda Timeout, API Gateway 502, S3 Access Denied, EC2 Unreachable)
  - AI-driven structured response rendering:
    - Multi-level Severity assessment (CRITICAL, HIGH, MEDIUM, LOW)
    - Incident summary
    - Likely root causes
    - Recommended diagnostic checks
    - Step-by-step troubleshooting guide
    - Practical remediation recommendations
    - Monospace AWS CLI commands with individual `Copy` and `Copy All` buttons
  - Comprehensive client-side validation and resilient error handling

## Architecture

```text
User Browser
     ↓
React + Vite Frontend (AWS Amplify)
     ↓
Amazon API Gateway HTTP API (POST /analyze)
     ↓
AWS Lambda (Python 3.12, ARM64)
     ↓
Amazon Bedrock (Nova 2 Lite)
```

- **Frontend**: React 19, Vite, Vanilla CSS with AWS Design Tokens
- **API**: Amazon API Gateway HTTP API
- **Compute**: AWS Lambda (Python 3.12, ARM64)
- **AI Model**: Amazon Bedrock Nova 2 Lite (`apac.amazon.nova-lite-v1:0`)
- **Region**: `ap-south-1`

## Local Development

```bash
# 1. Clone repository & change directory
cd frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Environment Variables

Configure environment variables in `.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of Amazon API Gateway HTTP API | `https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com` |
| `VITE_GITHUB_URL` | Optional GitHub repository link | `https://github.com/your-username/your-repo` |

## API Configuration

The frontend issues POST requests to `${VITE_API_URL}/analyze` with payload:

```json
{
  "incident": "Lambda function is timing out after 30 seconds"
}
```

Expected JSON response structure:

```json
{
  "severity": "HIGH",
  "summary": "...",
  "likely_causes": ["..."],
  "recommended_checks": ["..."],
  "troubleshooting_steps": ["..."],
  "remediation": ["..."],
  "aws_commands": ["aws ..."]
}
```

## Production Build

To build the production-ready bundle:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```
