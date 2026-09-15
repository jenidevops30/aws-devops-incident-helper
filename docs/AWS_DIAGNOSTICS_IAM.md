# IAM Guidance

Attach only the permissions required for the enabled read-only diagnostics. The current example uses EC2 `DescribeInstances` and `DescribeInstanceStatus`, Lambda `GetFunction`, RDS `DescribeDBInstances`, API Gateway `GET`, and CloudWatch `DescribeAlarms`.

Do not add mutation permissions to the Lambda execution role for this feature.
