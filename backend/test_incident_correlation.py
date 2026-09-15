import json
from unittest.mock import patch

import lambda_function


def test_correlation_prompt_contains_all_evidence_sources():
    prompt = lambda_function.build_correlation_prompt(
        'API is returning 5xx',
        'ERROR timeout',
        'status=500',
        'aws apigateway get-rest-api --rest-api-id API_ID',
        'Similar timeout last week',
        'Check API integration latency',
    )
    assert 'API is returning 5xx' in prompt
    assert 'ERROR timeout' in prompt
    assert 'status=500' in prompt
    assert 'Similar timeout last week' in prompt
    assert 'Check API integration latency' in prompt
    assert 'Do not turn a hypothesis into a confirmed root cause' in prompt


def test_correlation_commands_remove_state_changing_commands():
    commands = [
        {'command': 'aws cloudwatch get-metric-data --metric-data-queries X'},
        {'command': 'aws ec2 stop-instances --instance-ids i-123'},
        {'command': 'aws lambda update-function-code --function-name fn'},
        {'command': 'echo not-an-aws-command'},
    ]
    result = lambda_function.sanitize_correlation_commands(commands)
    assert [item['command'] for item in result] == [
        'aws cloudwatch get-metric-data --metric-data-queries X'
    ]
    assert result[0]['risk'] == 'READ_ONLY'


def test_correlation_action_uses_dedicated_bedrock_prompt():
    fake_result = {
        'summary': 'Evidence points to an upstream timeout.',
        'severity': 'HIGH',
        'evidence_relationships': ['Timeout evidence aligns with supplied 5xx logs.'],
        'confirmed_findings': [],
        'probable_findings': ['Upstream latency may be contributing.'],
        'possible_findings': [],
        'unknowns': ['Exact upstream dependency is not provided.'],
        'recommended_checks': ['Review upstream latency metrics.'],
        'troubleshooting_steps': ['Validate the supplied timeout evidence.'],
        'safe_cli_commands': [{'command': 'aws cloudwatch get-metric-data --metric-data-queries X'}],
        'next_actions': ['Collect the missing dependency evidence.'],
    }
    event = {
        'body': json.dumps({
            'action': 'generate_incident_correlation',
            'incident': 'API returns 5xx after a timeout.',
            'logs': 'ERROR timeout',
            'diagnostics': 'status=500',
            'cli': '',
            'previous': '',
            'runbook': '',
        })
    }
    with patch.object(lambda_function, 'call_bedrock', return_value=fake_result) as mocked:
        response = lambda_function.lambda_handler(event, None)
    assert response['statusCode'] == 200
    payload = json.loads(response['body'])
    assert payload['severity'] == 'HIGH'
    assert payload['safe_cli_commands'][0]['risk'] == 'READ_ONLY'
    mocked.assert_called_once()
    assert 'evidence-aware AWS DevOps incident correlation specialist' in mocked.call_args.args[0]
