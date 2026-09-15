import json

from lambda_function import build_runbook_prompt, extract_json, sanitize_runbook_commands


def test_runbook_prompt_contains_required_schema_and_safety_rules():
    prompt = build_runbook_prompt(
        'EC2 High CPU', 'EC2', 'High', 'CPU reached 95%',
        'Existing analysis', 'aws ec2 describe-instances', '', ''
    )
    assert 'diagnostic_commands' in prompt
    assert 'READ-ONLY' in prompt
    assert 'Do not invent resources' in prompt


def test_runbook_commands_remove_state_changing_commands():
    commands = [
        {'command': 'aws ec2 describe-instances --instance-ids <INSTANCE_ID>'},
        {'command': 'aws ec2 stop-instances --instance-ids <INSTANCE_ID>'},
        {'command': 'aws rds describe-db-instances --db-instance-identifier <DB_ID>'},
    ]
    result = sanitize_runbook_commands(commands)
    assert len(result) == 2
    assert all(item['risk'] == 'READ_ONLY' for item in result)
    assert all('stop-instances' not in item['command'] for item in result)


def test_extract_json_handles_markdown_fence():
    value = extract_json('```json\n{"runbook_title":"Test"}\n```')
    assert value == {'runbook_title': 'Test'}
