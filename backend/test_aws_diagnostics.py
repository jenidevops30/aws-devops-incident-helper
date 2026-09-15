import unittest
from unittest.mock import patch

from aws_diagnostics import run_diagnostics


class ReadOnlyDiagnosticsTests(unittest.TestCase):
    def test_invalid_service_rejected(self):
        with self.assertRaises(ValueError):
            run_diagnostics('s3', 'bucket', 'health')

    def test_invalid_scope_rejected(self):
        with self.assertRaises(ValueError):
            run_diagnostics('ec2', 'i-123', 'modify')

    def test_resource_required(self):
        with self.assertRaises(ValueError):
            run_diagnostics('ec2', '', 'health')

    @patch('aws_diagnostics.boto3.client')
    def test_ec2_uses_read_only_apis(self, mock_client):
        client = mock_client.return_value
        client.describe_instances.return_value = {'Reservations': [{'Instances': [{'State': {'Name': 'running'}, 'InstanceType': 't3.micro', 'Placement': {'AvailabilityZone': 'ap-south-1a'}, 'PrivateIpAddress': '10.0.0.1', 'SecurityGroups': []}]}]}
        client.describe_instance_status.return_value = {'InstanceStatuses': [{'SystemStatus': {'Status': 'ok'}, 'InstanceStatus': {'Status': 'ok'}}]}
        result = run_diagnostics('ec2', 'i-1234567890abcdef0', 'health')
        self.assertTrue(result['read_only'])
        client.describe_instances.assert_called_once()
        client.describe_instance_status.assert_called_once()
        for method in client.method_calls:
            self.assertNotIn(method[0].lower(), {'delete_instances', 'terminate_instances', 'stop_instances', 'reboot_instances', 'modify_instance_attribute'})


if __name__ == '__main__':
    unittest.main()
