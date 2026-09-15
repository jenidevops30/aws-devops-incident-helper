import { useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com';
const EMPTY = { incident: '', logs: '', diagnostics: '', cli: '', previous: '', runbook: '' };

function asList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [String(value)];
}

function ResultList({ title, items }) {
  const list = asList(items);
  return <div><h3>{title}</h3>{list.length ? <ul>{list.map((item, i) => <li key={`${title}-${i}`}>{item}</li>)}</ul> : <p className="muted-text">Information not provided.</p>}</div>;
}

export default function IncidentCorrelationPage({ onNavigate, initialData }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initialData?.form || {}) }));
  const [result, setResult] = useState(initialData?.result || null);
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
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_incident_correlation',
          incident: form.incident,
          logs: form.logs,
          diagnostics: form.diagnostics,
          cli: form.cli,
          previous: form.previous,
          runbook: form.runbook
        })
      });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      let data = await response.json();
      if (data && typeof data.body === 'string') {
        try { data = JSON.parse(data.body); } catch (_) { /* API returned an object already */ }
      }
      if (!data || (!data.summary && !data.severity && !data.confirmed_findings && !data.probable_findings)) {
        throw new Error('Malformed correlation response');
      }
      setResult(data);
    } catch (err) {
      console.error('Incident correlation failed:', err);
      setError('Unable to correlate the supplied evidence. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reportData = result ? {
    form: {
      title: 'Correlated AWS Incident', service: 'Other',
      severity: result.severity ? (result.severity.charAt(0) + result.severity.slice(1).toLowerCase()) : 'Unknown',
      description: form.incident,
      analysis: JSON.stringify(result, null, 2), logs: form.logs,
      diagnostic_commands: asList(result.safe_cli_commands).map((item) => typeof item === 'string' ? item : item.command).join('\n'),
      troubleshooting: asList(result.troubleshooting_steps).join('\n'),
      remediation: asList(result.next_actions).join('\n'), runbook: form.runbook
    }
  } : null;

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
            <ResultList title="Evidence Relationships" items={result.evidence_relationships} />
            <ResultList title="Confirmed Findings" items={result.confirmed_findings} />
            <ResultList title="Probable Findings" items={result.probable_findings} />
            <ResultList title="Possible Findings" items={result.possible_findings} />
            <ResultList title="Unknowns" items={result.unknowns} />
            <ResultList title="Recommended Checks" items={result.recommended_checks} />
            <ResultList title="Troubleshooting" items={result.troubleshooting_steps} />
            <ResultList title="Next Actions" items={result.next_actions} />
          </div>
          {asList(result.safe_cli_commands).length ? <div className="correlation-command-list"><h3>Safe Diagnostic Commands</h3>{asList(result.safe_cli_commands).map((item, i) => <pre key={i}>{typeof item === 'string' ? item : item.command}</pre>)}</div> : null}
          <div className="correlation-result-footer"><span>AI-generated analysis • Verify conclusions against the supplied evidence.</span><button className="btn btn-sm btn-primary" onClick={() => onNavigate('/incident-report', null, reportData)}>Generate Incident Report</button></div>
        </section> : null}
      </div></main>
    </div>
  );
}
