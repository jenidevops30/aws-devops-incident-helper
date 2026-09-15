# Incident Correlation — Implementation

## Feature branch

`feature/incident-correlation`

## User workflow

Open `/incident-correlation` after wiring the page into the application's existing route table.

The workspace accepts:

1. Incident description
2. CloudWatch/application logs
3. AWS diagnostic evidence
4. Read-only CLI output
5. Previous incident context
6. Runbook/troubleshooting context

The frontend sends these sources as a single evidence-bounded investigation prompt to the existing `/analyze` API. This preserves the existing Bedrock client and API contract while the dedicated backend correlation action is introduced in a later backend-only change.

## Safety model

The correlation prompt explicitly requires:

- evidence-only reasoning
- no AWS account access claims
- no invented ARNs, account IDs, metrics, logs, timestamps, or resources
- confirmed/probable/possible/unknown reasoning
- no command execution
- no destructive recommendations

The result can be passed directly to the existing Incident Report workflow.

## Important verification note

This branch was implemented through the repository connector. The local environment was not available for `npm ci`, lint, or build verification, so those commands must be run in CI or a local checkout before merge.

The existing backend's dedicated `generate_incident_report` action remains unchanged. The current correlation workspace intentionally reuses the existing analysis endpoint so the feature remains backward compatible; a subsequent backend change can promote this to a dedicated `generate_incident_correlation` action with a strict schema.
