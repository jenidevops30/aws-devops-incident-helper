import json
import unittest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import lambda_function


class TestLambdaBackend(unittest.TestCase):

    def setUp(self):
        self.mock_analysis = {
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

    def test_options_preflight_rest_api(self):
        """OPTIONS preflight request (REST API / v1) should return 200 with CORS headers."""
        event = {"httpMethod": "OPTIONS"}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        self.assertEqual(res["headers"]["Access-Control-Allow-Origin"], "*")
        self.assertIn("OPTIONS", res["headers"].get("Access-Control-Allow-Methods", ""))
        self.assertIn("Content-Type", res["headers"].get("Access-Control-Allow-Headers", ""))

    def test_options_preflight_http_api_v2(self):
        """OPTIONS preflight request (HTTP API / v2) should return 200 with CORS headers."""
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
        self.assertIn("OPTIONS", res["headers"].get("Access-Control-Allow-Methods", ""))

    def test_missing_incident_returns_400(self):
        """Request without 'incident' field returns 400 Bad Request."""
        event = {"body": json.dumps({})}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("error", body)
        self.assertIn("incident", body["error"].lower())

    def test_empty_incident_returns_400(self):
        """Empty or whitespace-only incident returns 400 Bad Request."""
        event = {"body": json.dumps({"incident": "   "})}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("error", body)

    def test_incident_too_long_returns_400(self):
        """Incident exceeding 10,000 characters returns 400."""
        event = {"body": json.dumps({"incident": "A" * 10001})}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("error", body)
        self.assertIn("too long", body["error"].lower())

    def test_invalid_json_request_body_returns_400(self):
        """Malformed JSON in request body returns 400, not 502."""
        event = {"body": "{malformed json"}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 400)
        body = json.loads(res["body"])
        self.assertIn("Invalid JSON", body["error"])

    @patch.object(lambda_function, "bedrock")
    def test_successful_analysis(self, mock_bedrock):
        """Valid incident calls Bedrock and returns structured JSON analysis."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": json.dumps(self.mock_analysis)}
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({"incident": "Lambda function is timing out after 30 seconds"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        self.assertEqual(res["headers"]["Access-Control-Allow-Origin"], "*")
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "HIGH")
        self.assertEqual(body["summary"], self.mock_analysis["summary"])
        self.assertEqual(len(body["likely_causes"]), 3)
        mock_bedrock.converse.assert_called_once()

    @patch.object(lambda_function, "bedrock")
    def test_successful_analysis_with_markdown_fences(self, mock_bedrock):
        """Model output wrapped in ```json fences is properly parsed."""
        raw_text = f"```json\n{json.dumps(self.mock_analysis)}\n```"
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
            "body": json.dumps({"incident": "S3 AccessDenied error during put_object"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "HIGH")

    @patch.object(lambda_function, "bedrock")
    def test_successful_analysis_with_surrounding_text(self, mock_bedrock):
        """Model output with explanatory preamble/postscript is extracted properly."""
        raw_text = f"Here is the analysis:\n{json.dumps(self.mock_analysis)}\nLet me know if you need more help."
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
            "body": json.dumps({"incident": "S3 403 Forbidden on static website"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "HIGH")

    @patch.object(lambda_function, "bedrock")
    def test_direct_dict_invocation(self, mock_bedrock):
        """Direct test event without API Gateway body string works as expected."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": json.dumps(self.mock_analysis)}
                    ]
                }
            }
        }
        event = {"incident": "API Gateway returns 502 Bad Gateway"}
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 200)
        body = json.loads(res["body"])
        self.assertEqual(body["severity"], "HIGH")

    @patch.object(lambda_function, "bedrock")
    def test_bedrock_invalid_json_returns_502(self, mock_bedrock):
        """If Bedrock returns non-JSON text, return 502 Bad Gateway."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": "Sorry, I am unable to analyze this at the moment."}
                    ]
                }
            }
        }
        event = {
            "body": json.dumps({"incident": "ECS task keeps restarting"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 502)
        body = json.loads(res["body"])
        self.assertIn("Bedrock returned an invalid JSON response", body["error"])

    @patch.object(lambda_function, "bedrock")
    def test_bedrock_exception_returns_500(self, mock_bedrock):
        """If Bedrock invocation raises an unexpected exception, return 500."""
        mock_bedrock.converse.side_effect = Exception("Service unavailable")
        event = {
            "body": json.dumps({"incident": "EC2 instance terminated unexpectedly"})
        }
        res = lambda_function.lambda_handler(event, None)
        self.assertEqual(res["statusCode"], 500)
        body = json.loads(res["body"])
        self.assertEqual(body["error"], "Unable to analyze the incident.")


if __name__ == "__main__":
    unittest.main()
