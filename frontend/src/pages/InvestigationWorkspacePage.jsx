import { useMemo, useState } from 'react';
import { saveIncident } from '../utils/historyStorage';

const API_URL = import.meta.env.VITE_API_URL || '';

function pretty(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export default function InvestigationWorkspacePage({ onNavigate }) {
  const [incident, setIncident] = useState('');
  const [awsEvidence, setAwsEvidence] = useState('');
  const [logEvidence, setLogEvidence] = useState('');
  const [cliEvidence, setCliEvidence] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const evidenceCount = useMemo(() => [awsEvidence, logEvidence, cliEvidence].filter((v) => v.trim()).length, [awsEvidence, logEvidence, cliEvidence]);

  const investigate = async () => {
    if (!incident.trim()) return setError('Describe the incident before starting the investigation.');
    if (!API_URL) return setError('API URL is not configured. Set VITE_API_URL in the frontend environment.');
    setLoading(true); setError(''); setAnalysis(null); setSaved(false);
    const combined = `INCIDENT:\n${incident.trim()}\n\nAWS DIAGNOSTIC EVIDENCE:\n${awsEvidence.trim() || 'No AWS diagnostic evidence supplied.'}\n\nCLOUDWATCH LOG EVIDENCE:\n${logEvidence.trim() || 'No CloudWatch log evidence supplied.'}\n\nCLI DIAGNOSTIC EVIDENCE:\n${cliEvidence.trim() || 'No CLI diagnostic evidence supplied.'}\n\nInvestigation rule: distinguish supplied evidence from inference. Do not claim direct AWS access. Do not invent resources or facts.`;
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ incident: combined }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Investigation failed.');
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'Unable to complete investigation.');
    } finally { setLoading(false); }
  };

  const save = () => {
    if (!analysis) return;
    const record = saveIncident({ title: 'Incident Investigation Workspace', type: 'incident', severity: analysis.severity || 'MEDIUM', summary: analysis.summary || 'Evidence-based incident investigation', analysis: { ...analysis, evidence: { aws: awsEvidence, logs: logEvidence, cli: cliEvidence } }, rawInput: incident });
    setSaved(Boolean(record));
  };

  const report = () => {
    if (!analysis) return;
    const text = `# Incident Investigation\n\n## Incident\n${incident}\n\n## Evidence\n\n### AWS Diagnostics\n${awsEvidence || 'None supplied'}\n\n### CloudWatch Logs\n${logEvidence || 'None supplied'}\n\n### CLI Diagnostics\n${cliEvidence || 'None supplied'}\n\n## AI Assessment\n\n### Severity\n${analysis.severity || 'Unknown'}\n\n### Summary\n${analysis.summary || ''}\n\n### Likely Causes\n${(analysis.likely_causes || []).map((x) => `- ${x}`).join('\n')}\n\n### Recommended Checks\n${(analysis.recommended_checks || []).map((x) => `- ${x}`).join('\n')}\n\n### Troubleshooting\n${(analysis.troubleshooting_steps || []).map((x) => `- ${x}`).join('\n')}\n\n## Safety\nEvidence supplied to this workspace is user-provided. AI output is an assessment, not proof of root cause. Review all recommendations before execution.`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'incident-investigation.md'; a.click(); URL.revokeObjectURL(url);
  };

  return <main className="page-container">
    <section className="page-header">
      <p className="eyebrow">INCIDENT RESPONSE</p>
      <h1>Investigation Workspace</h1>
      <p>Bring incident details, AWS evidence, CloudWatch logs, and CLI diagnostics together for one evidence-based investigation.</p>
    </section>

    <section className="card">
      <div className="card-header"><div><h2>Investigation Evidence</h2><p>{evidenceCount} evidence source{evidenceCount === 1 ? '' : 's'} supplied</p></div><span className="status-badge">READ-ONLY ANALYSIS</span></div>
      <label>Incident description<textarea value={incident} onChange={(e) => setIncident(e.target.value)} placeholder="Example: API requests are returning intermittent 502 errors..." rows={5} /></label>
      <div className="workspace-grid">
        <label>AWS diagnostic evidence<textarea value={awsEvidence} onChange={(e) => setAwsEvidence(e.target.value)} placeholder="Paste read-only AWS diagnostic results..." rows={8} /></label>
        <label>CloudWatch log evidence<textarea value={logEvidence} onChange={(e) => setLogEvidence(e.target.value)} placeholder="Paste relevant CloudWatch logs or log analysis..." rows={8} /></label>
      </div>
      <label>CLI diagnostic evidence<textarea value={cliEvidence} onChange={(e) => setCliEvidence(e.target.value)} placeholder="Paste outputs from read-only AWS CLI diagnostics..." rows={7} /></label>
      {error && <div className="error-message" role="alert">{error}</div>}
      <button className="btn btn-primary" onClick={investigate} disabled={loading}>{loading ? 'Correlating Evidence…' : 'Correlate Investigation →'}</button>
    </section>

    {analysis && <section className="card investigation-results">
      <div className="card-header"><div><p className="eyebrow">AI ASSESSMENT</p><h2>Investigation Findings</h2></div><strong>{analysis.severity || 'UNKNOWN'}</strong></div>
      <div className="result-block"><h3>Summary</h3><p>{analysis.summary}</p></div>
      <div className="workspace-grid">
        <div className="result-block"><h3>Likely Causes</h3><ul>{(analysis.likely_causes || []).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="result-block"><h3>Recommended Checks</h3><ul>{(analysis.recommended_checks || []).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
      <div className="result-block"><h3>Troubleshooting Steps</h3><ol>{(analysis.troubleshooting_steps || []).map((x, i) => <li key={i}>{x}</li>)}</ol></div>
      <div className="result-block"><h3>Remediation</h3><ul>{(analysis.remediation || []).map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      <div className="workspace-actions"><button className="btn btn-primary" onClick={save}>{saved ? 'Saved to History ✓' : 'Save Investigation'}</button><button className="btn btn-secondary" onClick={report}>Export Report</button><button className="btn btn-secondary" onClick={() => onNavigate?.('/runbook-generator', null, { title: 'Incident Investigation Runbook', service: 'Other', severity: analysis.severity || 'Unknown', description: incident, existingAnalysis: pretty(analysis), logs: logEvidence, diagnosticCommands: cliEvidence })}>Generate Runbook</button></div>
    </section>}
  </main>;
}
