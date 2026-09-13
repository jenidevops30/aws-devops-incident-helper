import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Set dummy AWS credentials before importing boto3/lambda_function
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_DEFAULT_REGION"] = "ap-south-1"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lambda_function


class TestLambdaBackend(unittest.TestCase):

    def setUp(self):
        self.mock_incident_analysis = {
            "severity": "HIGH",
            "summary": "Lambda function execution timed out.",
            "likely_causes": [
                "Downstream API latency",
                "Database connection timeout",
                "Insufficient timeout configured"
            ],
            "recommended_checks": [
                "Check CloudWatch logs for execution duration",
                "Verify database security groups and connectivity"
            ],
            "troubleshooting_steps": [
                "Increase timeout temporarily to observe total execution time",
                "Profile database query times"
            ],
            "remediation": [
                "Increase Lambda timeout configuration",
                "Add database connection pooling"
            ],
            "aws_commands": [
                "aws lambda get-function-configuration --function-name my-function",
                "aws logs tail /aws/lambda/my-function"
            ]
        }

        self.mock_log_analysis = {
            "severity": "CRITICAL",
            "summary": "Lambda execution timed out after 30 seconds due to stalled downstream HTTP call.",
            "error_pattern": "Lambda Task Timeout",
            "evidence": [
                {
                    "quote": "2026-09-13T10:00:30.123Z Task timed out after 30.00 seconds",
                    "significance": "Demonstrates the function reached its maximum execution threshold."
                },
                {
                    "quote": "HTTPConnectionPool(host='api.internal', port=443): Read timed out.",
                    "significance": "Points directly to an unhandled timeout in the external dependency call."
                }
            ],
            "likely_causes": [
                "Downstream microservice latency",
                "Security group egress blocking VPC traffic",
                "NAT Gateway bottleneck"
            ],
            "recommended_checks": [
                "Verify downstream host latency from same subnet",
                "Check VPC Flow logs for REJECT status"
            ],
            "troubleshooting_steps": [
                "Inspect CloudWatch metric Duration for p99 latency trend",
                "Add explicit socket timeouts in python requests"
            ],
            "remediation": [
                "Configure a 5-second socket timeout in HTTP client",
                "Increase Lambda timeout to 60 seconds with dead letter queue"
            ],
            "aws_commands": [
                "aws lambda get-function-configuration --function-name processor-fn",
                "aws ec2 describe-security-groups --group-ids sg-0123456789abcdef0"
            ],
            "prevention": [
                "Implement circuit breaker pattern for external API dependencies",
                "Set up CloudWatch Alarm on Lambda Errors and Timeouts"
            ]
        }

    # ==========================================
    # 1. CORS Preflight Tests
    # ==========================================
    def test_options_preflight_rest_api(self):
        """OPTIONS preflight request (REST API / v1) returns 200 with CORS headers."""
        event = {"httpMethod": "OPTIONS"}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        self.assertEqual(res["headers"]["Access-Control-Allow-Origin"], "*")
        self.assertIn("OPTIONS", res["headers"].get("Access-Control-Allow-Methods", ""))

    def test_options_preflight_http_api_v2(self):
        """OPTIONS preflight request (HTTP API / v2) returns 200 with CORS headers."""
        event = {
            "requestContext": {
                "http": {
                    "method": "OPTIONS",
                    "path": "/analyze"
                }
            }
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        self.assertEqual(res["headers"]["Access-Control-Allow-Origin"], "*")

    # ==========================================
    # 2. Standard Incident Analysis Tests
    # ==========================================
    def test_missing_incident_returns_400(self):
        """Request without 'incident' field returns 400 Bad Request."""
        event = {"body": json.dumps({})}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("incident", body["error"].lower())

    def test_empty_incident_returns_400(self):
        """Empty or whitespace-only incident returns 400 Bad Request."""
        event = {"body": json.dumps({"incident": "   "})}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)

    def test_incident_too_long_returns_400(self):
        """Incident exceeding 10,000 characters returns 400."""
        event = {"body": json.dumps({"incident": "A" * 10001})}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("too long", body["error"].lower())

    def test_invalid_json_request_body_returns_400(self):
        """Malformed JSON in request body returns 400."""
        event = {"body": "{malformed json"}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("Invalid JSON", body["error"])

    @patch.object(lambda_function, "bedrock")
    def test_successful_incident_analysis(self, mock_bedrock):
        """Valid incident calls Bedrock and returns structured JSON analysis."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": json.dumps(self.mock_incident_analysis)}
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({"incident": "Lambda function is timing out after 30 seconds"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "HIGH")
        self.assertEqual(body["summary"], self.mock_incident_analysis["summary"])
        mock_bedrock.converse.assert_called_once()

    # ==========================================
    # 3. CloudWatch Log Analyzer Tests
    # ==========================================
    def test_missing_logs_field_returns_400(self):
        """Action 'analyze_logs' without 'logs' field returns 400."""
        event = {
            "body": json.dumps({"action": "analyze_logs"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("logs", body["error"].lower())

    def test_empty_logs_returns_400(self):
        """Action 'analyze_logs' with empty whitespace logs returns 400."""
        event = {
            "body": json.dumps({"action": "analyze_logs", "logs": "   \n\t  "})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)

    def test_oversized_logs_returns_400(self):
        """Action 'analyze_logs' exceeding 20,000 characters returns 400."""
        event = {
            "body": json.dumps({"action": "analyze_logs", "logs": "L" * 20001})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("20,000", body["error"])

    @patch.object(lambda_function, "bedrock")
    def test_successful_log_analysis(self, mock_bedrock):
        """Valid CloudWatch logs call Bedrock and return 10-field structured analysis."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": json.dumps(self.mock_log_analysis)}
                    ]
                }
            }
        }
        sample_logs = (
            "2026-09-13T10:00:00.000Z START RequestId: 11111111-2222-3333-4444-555555555555\n"
            "2026-09-13T10:00:30.123Z Task timed out after 30.00 seconds\n"
            "2026-09-13T10:00:30.124Z REPORT RequestId: 11111111 Duration: 30000.00 ms Memory Used: 128 MB"
        )
        event = {
            "body": json.dumps({"action": "analyze_logs", "logs": sample_logs})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "CRITICAL")
        self.assertEqual(body["error_pattern"], "Lambda Task Timeout")
        self.assertEqual(len(body["evidence"]), 2)
        self.assertIn("quote", body["evidence"][0])
        self.assertIn("significance", body["evidence"][0])
        self.assertIn("prevention", body)

    @patch.object(lambda_function, "bedrock")
    def test_log_analysis_with_markdown_fences(self, mock_bedrock):
        """Bedrock output wrapped in ```json markdown fences parses properly."""
        raw_text = f"```json\n{json.dumps(self.mock_log_analysis)}\n```"
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": raw_text}
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({"action": "analyze_logs", "logs": "HTTP 502 Bad Gateway from ALB"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "CRITICAL")

    @patch.object(lambda_function, "bedrock")
    def test_bedrock_invalid_json_returns_502(self, mock_bedrock):
        """If Bedrock returns non-JSON text, return 502 Bad Gateway."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": "I am an AI and cannot format JSON right now."}
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({"action": "analyze_logs", "logs": "Some error logs"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 502)
        body = json.loads(res["body"])
        self.assertIn("Bedrock returned an invalid JSON response", body["error"])

    @patch.object(lambda_function, "bedrock")
    def test_bedrock_exception_returns_500(self, mock_bedrock):
        """If Bedrock raises an exception, return 500."""
        mock_bedrock.converse.side_effect = Exception("ThrottlingException: Rate exceeded")
        event = {
            "body": json.dumps({"action": "analyze_logs", "logs": "Fatal database crash"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 500)
        body = json.loads(res["body"])
        self.assertEqual(body["error"], "Unable to analyze the incident.")

    # -------------------------------------------------------------
    # CLI Diagnostic Generator Tests
    # -------------------------------------------------------------

    @patch.object(lambda_function, "bedrock")
    def test_generate_cli_success(self, mock_bedrock):
        """Valid CLI command generation returns 200 with structured commands and safety note."""
        mock_cli_response = {
            "service": "Lambda",
            "summary": "Commands to inspect Lambda function configuration, runtime logs, and execution limits.",
            "commands": [
                {
                    "command": "aws lambda get-function-configuration --function-name my-function --region ap-south-1",
                    "description": "Checks function timeout, memory, and runtime settings",
                    "purpose": "Identify if function timed out due to configured limits",
                    "risk": "READ_ONLY"
                },
                {
                    "command": "aws logs describe-log-streams --log-group-name /aws/lambda/my-function --order-by LastEventTime --descending --region ap-south-1",
                    "description": "Lists latest execution log streams",
                    "purpose": "Locate most recent invocation logs for timeout analysis",
                    "risk": "READ_ONLY"
                }
            ],
            "safety_note": "These commands are intended for read-only diagnostics."
        }
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": json.dumps(mock_cli_response)}
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({
                "action": "generate_cli",
                "service": "Lambda",
                "incident": "Lambda function is timing out after 30 seconds",
                "resource_name": "my-function",
                "region": "ap-south-1"
            })
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["service"], "Lambda")
        self.assertEqual(len(body["commands"]), 2)
        self.assertEqual(body["commands"][0]["risk"], "READ_ONLY")
        self.assertIn("my-function", body["commands"][0]["command"])
        self.assertIn("safety_note", body)

    def test_generate_cli_missing_service(self):
        """Action generate_cli without service returns 400."""
        event = {
            "body": json.dumps({
                "action": "generate_cli",
                "incident": "Lambda function is timing out"
            })
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("The 'service' field is required", body["error"])

    def test_generate_cli_empty_incident(self):
        """Action generate_cli without incident returns 400."""
        event = {
            "body": json.dumps({
                "action": "generate_cli",
                "service": "EC2",
                "incident": "   "
            })
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("The 'incident' field is required", body["error"])

    def test_generate_cli_oversized_incident(self):
        """Incident description exceeding 5,000 characters returns 400."""
        event = {
            "body": json.dumps({
                "action": "generate_cli",
                "service": "S3",
                "incident": "A" * 5001
            })
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("Incident description is too long", body["error"])

    def test_sanitize_cli_commands_strips_destructive(self):
        """Destructive commands such as terminate, delete, rm are stripped by sanitizer."""
        raw_commands = [
            {
                "command": "aws ec2 describe-instances --instance-ids i-1234567890abcdef0",
                "description": "Safe check",
                "purpose": "Inspect state"
            },
            {
                "command": "aws ec2 terminate-instances --instance-ids i-1234567890abcdef0",
                "description": "Destructive command",
                "purpose": "Kill instance"
            },
            {
                "command": "aws s3 rm s3://my-bucket/data --recursive",
                "description": "Destructive command",
                "purpose": "Delete files"
            },
            {
                "command": "aws s3api head-bucket --bucket my-bucket",
                "description": "Safe check",
                "purpose": "Check bucket existence"
            }
        ]
        sanitized = lambda_function.sanitize_cli_commands(raw_commands)
        self.assertEqual(len(sanitized), 2)
        commands_text = [item["command"] for item in sanitized]
        self.assertIn("aws ec2 describe-instances --instance-ids i-1234567890abcdef0", commands_text)
        self.assertIn("aws s3api head-bucket --bucket my-bucket", commands_text)
        self.assertNotIn("terminate-instances", "".join(commands_text))
        self.assertNotIn("rm s3://", "".join(commands_text))
        for item in sanitized:
            self.assertEqual(item["risk"], "READ_ONLY")

    @patch.object(lambda_function, "bedrock")
    def test_generate_cli_defaults_optional_fields(self, mock_bedrock):
        """Missing resource_name and region default safely without error."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {
                            "text": json.dumps({
                                "service": "RDS",
                                "summary": "Diagnostic checks for RDS connection refusal.",
                                "commands": [
                                    {
                                        "command": "aws rds describe-db-instances --db-instance-identifier DB_INSTANCE_ID --region ap-south-1",
                                        "description": "Check instance status and endpoint",
                                        "purpose": "Verify database availability",
                                        "risk": "READ_ONLY"
                                    }
                                ]
                            })
                        }
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({
                "action": "generate_cli",
                "service": "RDS",
                "incident": "Connection refused to database on port 5432"
            })
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["service"], "RDS")
        self.assertIn("DB_INSTANCE_ID", body["commands"][0]["command"])
        self.assertIn("safety_note", body)


if __name__ == "__main__":
    unittest.main()
