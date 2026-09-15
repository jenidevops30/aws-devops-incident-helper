import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from diagnostics_allowlist import READ_ONLY_OPERATIONS


def test_allowlist_contains_only_read_operations():
    forbidden = (
        'delete', 'terminate', 'stop', 'start', 'reboot', 'modify',
        'update', 'put', 'create', 'attach', 'detach'
    )
    for operations in READ_ONLY_OPERATIONS.values():
        for operation in operations:
            assert not any(word in operation.lower() for word in forbidden)
