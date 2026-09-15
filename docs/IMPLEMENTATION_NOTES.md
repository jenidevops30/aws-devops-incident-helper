# Implementation Notes

The AWS diagnostics feature is intentionally additive. It introduces an explicit `aws_diagnostics` action and keeps the existing Bedrock incident, log, CLI, and runbook actions intact.

The feature returns safe AccessDenied and not-found responses and marks successful evidence as read-only. It does not execute CLI commands or remediation actions.

Local tests/build have not been run in this environment; validate them before merging.
