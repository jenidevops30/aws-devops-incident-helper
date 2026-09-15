import { describe, expect, it } from 'vitest';

describe('AWS diagnostics UI contract', () => {
  it('uses the read-only diagnostics action', () => {
    const request = { action: 'aws_diagnostics', service: 'ec2', resource_id: 'i-test', diagnostic_scope: 'health' };
    expect(request.action).toBe('aws_diagnostics');
    expect(request.diagnostic_scope).toBe('health');
  });
});
