# AWS Diagnostics Review Checklist

- [ ] Run backend unit tests with mocked boto3 clients.
- [ ] Run frontend tests and production build.
- [ ] Verify Lambda deployment package includes `aws_diagnostics.py`.
- [ ] Verify Lambda role has only required read permissions.
- [ ] Test AccessDenied behavior.
- [ ] Test resource-not-found behavior.
- [ ] Test EC2, Lambda, API Gateway, RDS, and CloudWatch flows.
- [ ] Confirm no diagnostic path executes state-changing AWS APIs.
- [ ] Manually verify mobile layout.
- [ ] Deploy only after CI/manual validation succeeds.
