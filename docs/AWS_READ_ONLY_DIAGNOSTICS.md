# AWS Read-Only Diagnostics

AWS Read-Only Diagnostics adds real AWS evidence collection to the incident investigation workflow.

## Workflow

Incident → Read-Only Diagnostics → Evidence → AI Investigation → CLI Diagnostics → Runbook

## Supported Services

- EC2
- Lambda
- API Gateway
- RDS
- CloudWatch

## Supported Scopes

- health
- configuration
- recent_errors
- performance

## API

`POST /analyze`

```json
{
  "action": "aws_diagnostics",
  "service": "ec2",
  "resource_id": "i-0123456789abcdef0",
  "diagnostic_scope": "health"
}
```

The response contains the service, resource, scope, `read_only: true`, observed evidence, or a safe error object.

## Security Model

The diagnostic path uses an explicit service-to-function allowlist. User input cannot select an arbitrary boto3 method. No diagnostic operation performs a resource mutation.

The Lambda execution role should receive only the read permissions required by the enabled diagnostics, for example:

- `ec2:Describe*`
- `lambda:GetFunction`
- `lambda:GetFunctionConfiguration`
- `rds:DescribeDBInstances`
- `apigateway:GET`
- `cloudwatch:DescribeAlarms`

CloudWatch Logs permissions can be added when log-specific diagnostics are implemented.

Do not grant this feature permissions for termination, deletion, stopping, starting, rebooting, modifying, updating, creating, or security-group mutation operations.

## Limitations

The current MVP does not execute CLI commands, automatically remediate resources, or claim that an AWS resource is healthy when permissions prevent inspection. CloudWatch `recent_errors` and `performance` scopes currently provide the safe account-level alarm view; deeper metric/log collection can be added incrementally.

## Integration

Diagnostic output can be supplied to the Investigation Workspace and Runbook Generator. AI output remains an assessment and must distinguish observed evidence from inference and recommendations.
