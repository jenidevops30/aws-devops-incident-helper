# AWS Diagnostics Follow-up

Next improvements should be implemented only after this branch passes CI/manual validation:

1. Add deeper CloudWatch metric and log evidence collection.
2. Add diagnostic evidence directly into Investigation Workspace without copy/paste.
3. Save AWS diagnostic records with a distinct `aws_diagnostics` history type.
4. Add evidence-source references to AI findings.
5. Add account/resource scoping and stronger IAM resource constraints where practical.
6. Add integration tests with mocked boto3 clients.
