# Weekend Deployment Challenge: AWS DevOps Incident Helper

#deployment

**Live App:** https://d2v4zdm3pgizqg.amplifyapp.com  
**GitHub:** https://github.com/jenidevops30/aws-devops-incident-helper  
**Region:** ap-south-1 (Mumbai)

---

## Introduction

Every DevOps engineer has experienced the panic of a production incident. Lambda timeouts. API Gateway returning 502s. An EC2 instance that mysteriously stops accepting SSH connections at 2 AM. An S3 bucket suddenly returning AccessDenied to an application that was working perfectly the day before.

The troubleshooting process is often slow not because engineers lack skill, but because incident response requires quickly recalling the right mental checklist under pressure. Which CloudWatch metric do I look at first? Which AWS CLI command surfaces the configuration I need? Is this a security group issue, a VPC routing issue, or a Lambda execution role problem?

The AWS DevOps Incident Helper was built to solve exactly this problem — an AI-powered assistant that takes a plain-language incident description and instantly returns structured, actionable troubleshooting guidance.

---

## What I Built

The AWS DevOps Incident Helper is a web application that lets DevOps engineers describe an incident in plain English and immediately receive:

- **Severity classification** — HIGH, MEDIUM, or LOW based on the impact assessment
- **Summary** — A concise restatement of the problem with initial context
- **Likely causes** — The most probable root causes ranked by relevance
- **Recommended checks** — Specific things to look at in the AWS Console or CLI
- **Troubleshooting steps** — Step-by-step diagnostic procedure
- **Remediation** — Actionable fixes once the cause is confirmed
- **AWS CLI commands** — Copy-to-clipboard diagnostic commands ready to run

The application works across a wide range of AWS incidents: Lambda, API Gateway, S3, EC2, IAM/permissions, networking, RDS, CloudFormation, and more. The AI adapts its response to the specific service and error pattern described.

The UI is purpose-built for incident response — a clean landing page explaining the tool's capabilities, followed by a focused incident analyzer page with a large textarea for the incident description and a prominent Analyze button. Results render in clearly separated cards, and each AWS CLI command has a one-click copy button.

---

## Architecture

The application is built entirely on AWS managed services:

```
React + Vite (Frontend)
       ↓
AWS Amplify (Hosting + CI/CD)
       ↓ HTTPS POST /analyze
Amazon API Gateway (HTTP API)
       ↓
AWS Lambda (Python 3.11)
       ↓
Amazon Bedrock — Nova Lite (APAC inference)
```

**AWS Amplify** serves the React/Vite frontend and handles HTTPS, CDN distribution, and deployment automation. The `amplify.yml` build spec at the project root defines the build pipeline.

**Amazon API Gateway** exposes a single HTTP API endpoint — `POST /analyze` — with CORS configured to allow requests from the Amplify domain. No authentication is required for this MVP, making it immediately usable without sign-in friction.

**AWS Lambda** is the backend engine. A Python 3.11 function receives the incident text, constructs a structured prompt, calls Amazon Bedrock, parses the response, and returns a JSON object containing all seven response fields.

**Amazon Bedrock** provides the AI inference. The Lambda uses the Bedrock Converse API with the `apac.amazon.nova-lite-v1:0` model — the APAC cross-region inference profile for Nova Lite, which is available in `ap-south-1`.

**CloudWatch** captures all Lambda logs automatically, making it easy to debug failed invocations and track usage.

---

## Why Serverless

The architecture was deliberately chosen to avoid always-on infrastructure. There are no EC2 instances, no load balancers beyond API Gateway, no NAT Gateways, and no managed database.

**Amplify** eliminates the need to configure a web server, manage TLS certificates, or set up a CDN. Deployment is a `git push`.

**API Gateway** provides a production-grade HTTP endpoint with built-in CORS, throttling, and HTTPS — without any server configuration.

**Lambda** means zero cost when nobody is using the app. The function spins up in milliseconds when called and scales automatically under load. For an MVP, this is the right tradeoff: fast to ship, cost-conscious by design.

**Bedrock** removes the need to host or manage a machine learning model. Nova Lite provides strong reasoning quality for structured output tasks at a low per-token cost.

This serverless stack meant the entire application could be deployed, tested, and ready for production in a weekend.

---

## Building the Backend

The Lambda function is the core of the application. It accepts a JSON payload with an `incident` field, validates it, and then calls Bedrock using the Converse API.

The prompt is structured to instruct the model to return a JSON object with exactly seven fields: `severity`, `summary`, `likely_causes`, `recommended_checks`, `troubleshooting_steps`, `remediation`, and `aws_commands`. The model is instructed to assess the incident as if it were a senior AWS DevOps engineer, and to return only valid JSON.

Nova Lite reliably returns valid structured JSON when the prompt is specific about the output format. The Lambda then parses this JSON and returns it directly to API Gateway.

IAM permissions follow least-privilege: the Lambda execution role has only `bedrock:InvokeModel` access scoped to the Nova Lite model ARN, plus the standard CloudWatch Logs permissions for `logs:CreateLogGroup`, `logs:CreateLogStream`, and `logs:PutLogEvents`.

CloudWatch captures every invocation. Log groups are prefixed at `/aws/lambda/aws-devops-incident-helper`, making it easy to stream recent logs with the AWS CLI.

---

## Building the Frontend

The frontend is built with React and Vite, structured into two pages and a set of focused components.

The **Landing Page** explains the tool's purpose, walks through the supported incident categories, and includes a visual architecture section showing how the request flows from browser through Amplify, API Gateway, Lambda, and Bedrock. A prominent "Launch Incident Helper" button takes users to the analyzer.

The **Analyzer Page** is the main working interface. It has a large textarea for the incident description, an Analyze button, and a results section. Results render as separate cards — one for severity (color-coded by level), one for each of the seven response fields, and a final card listing AWS CLI commands with individual copy buttons.

The API call is made from the frontend using `fetch` against the `VITE_API_URL` environment variable. This means the same build artifact works in local development and in Amplify production — only the environment variable changes.

The application is fully responsive. On mobile, the cards stack vertically, the textarea remains usable, and the navigation collapses cleanly.

---

## Challenges and Lessons Learned

**Bedrock model availability in ap-south-1.** Nova Lite is not directly available as a base model ID in `ap-south-1`. The solution is to use the APAC cross-region inference profile — `apac.amazon.nova-lite-v1:0` — which routes requests to the nearest available APAC region automatically. This is a non-obvious detail that took time to discover.

**Structured JSON output from the model.** Getting the model to return consistently valid, parseable JSON required careful prompt engineering. The prompt explicitly states the output must be valid JSON, defines the schema, and instructs the model not to include markdown code fences or explanation text. Nova Lite handles this well with a low temperature setting (`0.1`).

**CORS configuration.** API Gateway's HTTP API requires explicit CORS configuration. Setting `Access-Control-Allow-Origin: *` works for development, but the preflight OPTIONS request must also return the correct headers. Testing with `curl -X OPTIONS` with the `Origin` header is the quickest way to verify this before touching the frontend.

**Connecting API Gateway to Lambda.** HTTP API integrations use the `AWS_PROXY` integration type with a Lambda ARN. The integration must grant Lambda invoke permissions to API Gateway via `aws lambda add-permission`, otherwise the API returns a 403 or 500 even though the configuration looks correct in the Console.

**Frontend environment variable injection in Amplify.** Vite requires environment variables to be prefixed with `VITE_` and they must be set at build time, not runtime. Setting `VITE_API_URL` in the Amplify Console's environment variable settings ensures it is available during `npm run build`.

---

## Cost Considerations

The architecture is designed to minimize cost, especially at low traffic volumes.

There are no always-on servers. Lambda charges only for actual invocations and compute duration. API Gateway HTTP API charges per request. Amplify charges for build minutes and hosting, both of which are minimal at this scale.

The primary variable cost is Bedrock inference. Nova Lite is one of the most cost-efficient models on Bedrock, making it well-suited for a tool where the number of requests is bounded by actual incidents rather than high-volume automated traffic.

For a weekend project or low-traffic DevOps tool, the real-world cost for normal usage is expected to remain well within AWS Free Tier limits for Lambda and API Gateway, with Bedrock charges depending on request volume and token length.

---

## What's Next

Several improvements would make this a more complete incident response tool:

- **Incident history** — Store past analyses so engineers can reference previous similar incidents
- **Authentication** — Add Cognito-based sign-in for team access control
- **CloudWatch integration** — Allow users to paste CloudWatch log snippets directly and have the AI analyze them in context
- **AWS account-aware diagnostics** — Let authenticated users authorize read-only account access so the AI can look at actual resource configurations
- **Saved investigations** — Bookmark and share incident analyses across the team
- **Automated remediation** — With strong safety controls and human-in-the-loop confirmation, suggest and optionally apply fixes

These are future ideas. The current application focuses on the core use case: fast, structured troubleshooting guidance for the most common AWS incident types.

---

## Conclusion

The AWS DevOps Incident Helper demonstrates how AWS managed services can be composed into a genuinely useful DevOps tool in a weekend. The serverless architecture — Amplify, API Gateway, Lambda, Bedrock — removes infrastructure management entirely and lets the development effort focus on the application logic and user experience.

The most valuable lesson is that Amazon Bedrock's Converse API makes it straightforward to integrate AI reasoning into a real application. The challenge is not the AI integration itself, but the prompt engineering that turns a general-purpose language model into a specialized, structured troubleshooting assistant.

The result is an application that I would actually use during a real incident. That is the best measure of whether a weekend project was worth building.

---

*Built for the AWS Builder Center Weekend Deployment Challenge.*  
*Region: ap-south-1 (Mumbai)*  
*#deployment*
