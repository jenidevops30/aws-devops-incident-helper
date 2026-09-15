from diagnostics_allowlist import READ_ONLY_OPERATIONS


def test_allowlist_contains_only_read_operations():
    forbidden = ('delete', 'terminate', 'stop', 'start', 'reboot', 'modify', 'update', 'put', 'create', 'attach', 'detach')
    for operations in READ_ONLY_OPERATIONS.values():
        for operation in operations:
            assert not any(word in operation.lower() for word in forbidden)
