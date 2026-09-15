import { useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com';

const EMPTY = { incident: '', logs: '', diagnostics: '', cli: '', previous: '', runbook: '' };

function asList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [String(value)];
}

export default function IncidentCorrelationPage({ onNavigate }) {
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const evidenceCount = useMemo(() => Object.values(form).filter((v) => v.trim()).length, [form]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const correlate = async (event) => {
    event.preventDefault();
    if (!form.incident.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    const correlationPrompt = `You are an evidence-aware AWS incident correlation specialist. Correlate ONLY the evidence supplied below. Do not claim AWS account access. Do not invent resources, ARNs, account IDs, metrics, timestamps, logs, or facts. Distinguish confirmed facts from probable, possible, and unknown hypotheses. Explain relationships between evidence sources and identify the most useful next checks. Do not execute commands and do not recommend destructive commands. Return concise structured JSON when possible, otherwise a normal structured incident analysis is acceptable.\n\nINCIDENT:\n${form.incident}\n\nCLOUDWATCH / APPLICATION LOGS:\n${form.logs || 'Information not provided.'}\n\nAWS DIAGNOSTIC EVIDENCE:\n${form.diagnostics || 'Information not provided.'}\n\nCLI OUTPUT:\n${form.cli || 'Information not provided.'}\n\nPREVIOUS INCIDENT CONTEXT:\n${form.previous || 'Information not provided.'}\n\nRUNBOOK CONTEXT:\n${form.runbook || 'Information not provided.'}`;
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: correlationPrompt })
      });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      let data = await response.json();
      if (data && typeof data.body === 'string') {
        try { data = JSON.parse(data.body); } catch (_) { /* already an object */ }
      }
      if (!data || (!data.summary && !data.severity && !data.likely_causes)) throw new Error('Malformed correlation response');
      setResult(data);
    } catch (err) {
      console.error('Incident correlation failed:', err);
      setError('Unable to correlate the supplied evidence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-page">
      <header className="analyzer-header"><div className="container">
        <div className="analyzer-header-top">
          <div className="analyzer-breadcrumbs"><button className="back-link" onClick={() => onNavigate('/')}><span className="material-symbols-outlined">arrow_back</span>Back to Home</button><span className="breadcrumb-separator">/</span><span className="breadcrumb-current">Incident Correlation</span></div>
          <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('/history')}><span className="material-symbols-outlined">history</span>History</button>
        </div>
        <div className="analyzer-brand-heading"><img src="/logo-icon.png" alt="AWS DevOps Incident Helper" className="analyzer-logo-img" /><h1 className="analyzer-title">Incident Correlation</h1></div>
        <p className="analyzer-subtitle">Combine incident details and investigation evidence into one evidence-aware diagnosis.</p>
      </div></header>

      <main className="analyzer-main"><div className="container">
        <div className="log-analyzer-card">
          <div className="log-analyzer-header"><div className="log-analyzer-title-wrap"><div className="log-analyzer-icon"><span className="material-symbols-outlined">hub</span></div><div><h2 className="log-analyzer-title">Correlate Investigation Evidence</h2><p className="log-analyzer-desc">Supply whatever evidence you have. Missing evidence is explicitly treated as unknown.</p></div></div><div className="log-privacy-pill"><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span><span>Analysis Only</span></div></div>

          <form onSubmit={correlate}>
            <div className="correlation-grid">
              {[
                ['incident', 'Incident Description', 'Describe the customer or system impact and observed symptoms.', true],
                ['logs', 'CloudWatch / Application Logs', 'Paste relevant log lines or error traces.'],
                ['diagnostics', 'AWS Diagnostic Evidence', 'Paste read-only diagnostic output or observed metrics.'],
                ['cli', 'CLI Output', 'Paste output from read-only AWS CLI checks.'],
                ['previous', 'Previous Incident Context', 'Paste a previous incident summary or related investigation.'],
                ['runbook', 'Runbook / Troubleshooting Context', 'Paste relevant runbook steps or troubleshooting notes.']
              ].map(([key, label, placeholder, required]) => (
                <label key={key} className={`correlation-field ${key === 'incident' ? 'correlation-field-wide' : ''}`}>
                  <span className="correlation-label">{label}{required ? ' *' : ''}</span>
                  <textarea value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} rows={key === 'incident' ? 5 : 6} maxLength={key === 'logs' ? 20000 : 10000} required={required} disabled={loading} />
                </label>
              ))}
            </div>
            <div className="correlation-toolbar"><span>{evidenceCount} evidence sources supplied</span><button type="button" className="btn btn-sm btn-secondary" onClick={() => { setForm(EMPTY); setResult(null); setError(''); }} disabled={loading}>Clear</button><button type="submit" className="btn btn-lg btn-primary" disabled={loading || !form.incident.trim()}>{loading ? <><span className="loading-spin-sm"></span>Correlating Evidence...</> : <><span className="material-symbols-outlined">hub</span>Correlate Incident</>}</button></div>
          </form>
        </div>

        <div className="correlation-safety-note"><span className="material-symbols-outlined">verified_user</span><div><strong>Evidence and safety rules</strong><p>The assistant analyzes only the text supplied here. It does not connect to your AWS account, execute CLI commands, modify resources, or prove a root cause without supporting evidence.</p></div></div>

        {error ? <div className="analysis-error-card"><span className="material-symbols-outlined">error</span><div><strong>Correlation failed</strong><p>{error}</p></div></div> : null}

        {result ? <section className="correlation-result-card">
          <div className="correlation-result-header"><div><span className="result-eyebrow">Evidence-aware result</span><h2>{result.summary || 'Correlated incident analysis'}</h2></div><span className={`badge severity-badge severity-tag-${String(result.severity || 'unknown').toLowerCase()}`}>{result.severity || 'UNKNOWN'}</span></div>
          <div className="correlation-result-grid">
            <div><h3>Likely Causes</h3><ul>{asList(result.likely_causes).map((item, i) => <li key={i}>{item}</li>)}</ul></div>
            <div><h3>Recommended Checks</h3><ul>{asList(result.recommended_checks).map((item, i) => <li key={i}>{item}</li>)}</ul></div>
            <div><h3>Troubleshooting</h3><ul>{asList(result.troubleshooting_steps).map((item, i) => <li key={i}>{item}</li>)}</ul></div>
            <div><h3>Remediation</h3><ul>{asList(result.remediation).map((item, i) => <li key={i}>{item}</li>)}</ul></div>
          </div>
          <div className="correlation-result-footer"><span>AI-generated analysis • Verify conclusions against the supplied evidence.</span><button className="btn btn-sm btn-primary" onClick={() => onNavigate('/incident-report', null, { form: { title: 'Correlated AWS Incident', service: 'Other', severity: result.severity ? result.severity.charAt(0) + result.severity.slice(1).toLowerCase() : 'Unknown', description: form.incident, analysis: JSON.stringify(result, null, 2), logs: form.logs, diagnostic_commands: form.cli, troubleshooting: asList(result.troubleshooting_steps).join('\n'), remediation: asList(result.remediation).join('\n'), runbook: form.runbook } })}>Generate Incident Report</button></div>
        </section> : null}
      </div></main>
    </div>
  );
}

