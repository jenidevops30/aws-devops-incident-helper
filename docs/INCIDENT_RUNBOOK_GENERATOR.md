# Incident Runbook Generator

The Incident Runbook Generator converts an operator's incident description and existing investigation evidence into a structured, review-first AWS operational runbook.

## Workflow

```text
Incident Analyzer ─┐
                   ├──> Runbook Generator ──> Save / Markdown Export
Log Analyzer ──────┤
                   │
CLI Generator ─────┘
```

## Inputs

- Runbook title
- AWS service
- Severity
- Incident description
- Existing incident analysis (optional)
- Diagnostic commands (optional)
- Logs/evidence (optional)
- Troubleshooting notes (optional)

## Generated Sections

1. Incident Overview
2. Severity
3. Impact
4. Symptoms
5. Initial Triage
6. Evidence to Collect
7. Diagnostic Commands
8. Likely Root Causes
9. Troubleshooting Procedure
10. Remediation
11. Verification
12. Rollback Considerations
13. Prevention
14. Post-Incident Checklist

## Safety Model

The runbook generator does not access an AWS account and does not execute commands. Diagnostic commands are filtered by the Lambda safety layer so state-changing commands are removed and retained commands are marked `READ_ONLY`.

Operators must review generated commands and resource identifiers before execution.

## Storage and Export

Saved runbooks use the existing browser-only incident history mechanism. No runbook database was introduced. Runbooks can also be copied as Markdown or downloaded as `.md` files.

## API

The existing `POST /analyze` endpoint accepts:

```json
{
  "action": "generate_runbook",
  "title": "EC2 High CPU Incident",
  "service": "EC2",
  "severity": "High",
  "description": "Application latency increased while CPU reached 95%.",
  "existing_analysis": "...",
  "diagnostic_commands": "...",
  "logs": "...",
  "troubleshooting_notes": "..."
}
```

The backend uses the existing Amazon Bedrock Converse API integration and returns structured JSON.
