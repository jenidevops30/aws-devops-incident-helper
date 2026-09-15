import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const SERVICES = [
  ['ec2', 'EC2'],
  ['lambda', 'Lambda'],
  ['apigateway', 'API Gateway'],
  ['rds', 'RDS'],
  ['cloudwatch', 'CloudWatch'],
];
const SCOPES = ['health', 'configuration', 'recent_errors', 'performance'];

export default function AwsDiagnosticsPage({ onNavigate }) {
  const [service, setService] = useState('ec2');
  const [resourceId, setResourceId] = useState('');
  const [scope, setScope] = useState('health');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (service !== 'cloudwatch' && !resourceId.trim()) return setError('Enter a resource identifier.');
    if (!API_URL) return setError('API URL is not configured.');
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'aws_diagnostics', service, resource_id: resourceId.trim(), diagnostic_scope: scope }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Diagnostics failed.');
      setResult(data);
    } catch (err) { setError(err.message || 'Unable to run diagnostics.'); }
    finally { setLoading(false); }
  };

  const pretty = (value) => JSON.stringify(value, null, 2);

  return <main className="page-container">
    <section className="page-header">
      <p className="eyebrow">AWS OPERATIONS</p>
      <h1>AWS Read-Only Diagnostics</h1>
      <p>Collect real AWS resource evidence using strictly read-only diagnostic APIs. No AWS resource is modified by this feature.</p>
    </section>
    <section className="card">
      <div className="card-header"><div><h2>Diagnostic Request</h2><p>Choose a supported AWS service and diagnostic scope.</p></div><span className="status-badge">READ-ONLY</span></div>
      <div className="workspace-grid">
        <label>Service<select value={service} onChange={(e) => setService(e.target.value)}>{SERVICES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Diagnostic Scope<select value={scope} onChange={(e) => setScope(e.target.value)}>{SCOPES.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></label>
      </div>
      <label>Resource Identifier <span className="muted">(not required for CloudWatch)</span><input value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder={service === 'ec2' ? 'i-0123456789abcdef0' : service === 'lambda' ? 'my-function' : service === 'rds' ? 'my-database' : service === 'apigateway' ? 'api-id' : 'Optional'} /></label>
      {error && <div className="error-message" role="alert">{error}</div>}
      <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Collecting Evidence…' : 'Run Read-Only Diagnostics →'}</button>
    </section>
    {result && <section className="card">
      <div className="card-header"><div><p className="eyebrow">DIAGNOSTIC RESULT</p><h2>{result.service}</h2><p>{result.resource_id || 'Account-level CloudWatch diagnostics'} · {result.scope}</p></div><span className="status-badge">READ-ONLY: YES</span></div>
      {result.error ? <div className="error-message" role="alert"><strong>{result.error.code}</strong><br />{result.error.message}</div> : <>
        <div className="result-block"><h3>Observed Evidence</h3><pre className="code-block">{pretty(result.evidence || {})}</pre></div>
        <div className="result-block"><h3>How to continue</h3><p>Use this evidence with the Investigation Workspace or Runbook Generator. Review all recommendations before execution.</p></div>
        <div className="workspace-actions"><button className="btn btn-primary" onClick={() => onNavigate?.('/investigation')}>Open Investigation Workspace</button><button className="btn btn-secondary" onClick={() => onNavigate?.('/runbook-generator', null, { title: 'AWS Diagnostic Runbook', service: service === 'apigateway' ? 'API Gateway' : service === 'cloudwatch' ? 'CloudWatch' : service.charAt(0).toUpperCase() + service.slice(1), severity: 'Unknown', description: `Read-only ${service} diagnostics for ${resourceId || 'selected CloudWatch scope'}.`, existingAnalysis: pretty(result), diagnosticCommands: '' })}>Generate Runbook</button></div>
      </>}
    </section>}
  </main>;
}
