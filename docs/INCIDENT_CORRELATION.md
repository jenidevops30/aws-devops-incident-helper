# Incident Correlation

## Overview

Incident Correlation is the next investigation workflow for AWS DevOps Incident Helper. It combines incident descriptions, log analysis, diagnostic evidence, CLI output, runbook context, and previous incident context into one evidence-aware analysis.

## Evidence Confidence

The correlation engine must distinguish:

- **Confirmed** — directly supported by supplied evidence.
- **Probable** — strongly supported but requires verification.
- **Possible** — plausible hypothesis with limited evidence.
- **Unknown** — insufficient evidence to make a reliable determination.

The application must never invent AWS account IDs, ARNs, resource names, metrics, timestamps, logs, credentials, or other evidence.

## Safety

Correlation is analysis-only. It does not execute AWS CLI commands, modify AWS resources, perform remediation, or provide credentials to the model.

## Planned Flow

```text
Incident Description
        +
CloudWatch Logs
        +
AWS Diagnostics
        +
CLI Evidence
        +
Previous Incidents
        ↓
Correlation Engine
        ↓
Evidence-Aware Analysis
        ↓
Incident Report
```

## Implementation Status

The correlation workflow is introduced as a separate feature branch and should be implemented incrementally without modifying the previously merged Incident Export & Reporting workflow.
