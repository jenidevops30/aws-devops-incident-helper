# AWS DevOps Incident Helper - Frontend

AI-powered serverless DevOps troubleshooting assistant built with React and Vite, powered by Amazon Bedrock (Nova 2 Lite).

## Features

- **Product Landing Page (`/`)**:
  - AWS-styled navigation with active tab states and live Incident History counter
  - Hero with live product illustration and quick-start actions
  - Three-step incident troubleshooting lifecycle ("How It Works")
  - Enterprise feature capabilities breakdown
  - Serverless architecture diagram & highlights panel
  - Call-to-Action and AWS-themed footer

- **Interactive Incident Analyzer (`/analyze`)**:
  - **Dual Mode Switcher**:
    - **Incident Description**: Up to 10,000 characters with presets for Lambda Timeout, API Gateway 502, S3 Access Denied, and EC2 Unreachable.
    - **CloudWatch Log Analyzer**: Up to 20,000 characters with real multi-line log presets (Lambda Timeout, API Gateway 5xx, App Error, RDS Connection Error).
  - **AI-Driven Structured Response**:
    - Multi-level severity assessment (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
    - Error pattern identification and summary
    - **Verbatim Evidence Quotes**: Explicit log extracts with analytical significance
    - Likely root causes, recommended checks, troubleshooting steps, and remediation
    - Long-term prevention strategies
    - Monospace AWS CLI commands with individual `Copy` and `Copy All`
  - **Collaboration & Export**:
    - One-click `Save Incident` to client history
    - `Copy for Slack / Jira` formatted markdown sharing
  - **Related Saved Incidents**: Automatically detects prior related incidents from local history

- **Incident History (`/history`)**:
  - Client-side storage via `localStorage` (`aws_incident_history_v2`)
  - Real-time search by keywords, summary, error pattern, or severity
  - Detailed inspection modal with formatted response viewer
  - Individual item deletion and bulk clear with confirmation dialog
  - Export capabilities for incident post-mortems

## Architecture

```text
User Browser
     ↓
React + Vite Frontend (AWS Amplify) ── LocalStorage (Incident History)
     ↓
Amazon API Gateway HTTP API (POST /analyze)
     ↓
AWS Lambda (Python 3.11, x86_64)
     ↓
Amazon Bedrock (Nova Lite - apac.amazon.nova-lite-v1:0)
```

- **Frontend**: React 19, Vite, Vanilla CSS with AWS Design Tokens
- **API**: Amazon API Gateway HTTP API
- **Compute**: AWS Lambda (Python 3.11)
- **AI Model**: Amazon Bedrock Nova Lite (`apac.amazon.nova-lite-v1:0`)
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

## Live Deployment

The application is deployed on AWS Amplify Hosting:
- **Production URL:** [https://main.d2v4zdm3pgizqg.amplifyapp.com](https://main.d2v4zdm3pgizqg.amplifyapp.com)

