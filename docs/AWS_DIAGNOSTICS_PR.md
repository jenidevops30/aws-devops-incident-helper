# AWS Diagnostics Review

This branch adds optional read-only AWS diagnostics on top of the merged Investigation Workspace.

Before merging, run backend tests, frontend tests/build, and manual checks with the Lambda execution role configured. The feature should degrade safely with AccessDenied when permissions are not present.
