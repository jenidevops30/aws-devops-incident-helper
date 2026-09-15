import { useMemo, useState } from 'react';
import { saveIncident } from '../utils/historyStorage';

const SERVICES = ['EC2', 'Lambda', 'API Gateway', 'S3', 'IAM', 'RDS', 'CloudWatch', 'VPC', 'CloudFormation', 'ECS', 'EKS', 'ALB', 'Other'];
const SEVERITIES = ['Unknown', 'Low', 'Medium', 'High', 'Critical'];
const API_URL = import.meta.env.VITE_API_URL || 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com';

function Section({ title, icon, children }) {
  return (
    <section className="analysis-section runbook-section">
      <div className="analysis-section-header">
        <span className="material-symbols-outlined">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="analysis-section-content">{children}</div>
    </section>
  );
}

function Items({ items, numbered = false }) {
  if (!Array.isArray(items) || items.length === 0) return <p className="muted-text">No information provided.</p>;
  return numbered ? (
    <ol className="runbook-list">{items.map((item, i) => <li key={i}>{item}</li>)}</ol>
  ) : (
    <ul className="runbook-list">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
  );
}

function runbookToMarkdown(runbook) {
  const list = (items) => Array.isArray(items) && items.length ? items.map((x, i) => `${i + 1}. ${x}`).join('\n') : '_None provided._';
  return `# ${runbook.runbook_title || 'AWS Incident Runbook'}\n\n` +
    `## Incident Overview\n${runbook.incident_overview || '_None provided._'}\n\n` +
    `## Severity\n${runbook.severity || 'Unknown'}\n\n` +
    `## Impact\n${runbook.impact || '_None provided._'}\n\n` +
    `## Symptoms\n${list(runbook.symptoms)}\n\n` +
    `## Initial Triage\n${list(runbook.initial_triage)}\n\n` +
    `## Evidence to Collect\n${list(runbook.evidence_to_collect)}\n\n` +
    `## Diagnostic Commands\n${Array.isArray(runbook.diagnostic_commands) && runbook.diagnostic_commands.length ? runbook.diagnostic_commands.map((c) => `\`\`\`bash\n${typeof c === 'string' ? c : c.command || ''}\n\`\`\``).join('\n\n') : '_None provided._'}\n\n` +
    `## Likely Root Causes\n${list(runbook.likely_root_causes)}\n\n` +
    `## Troubleshooting Procedure\n${list(runbook.troubleshooting_procedure)}\n\n` +
    `## Remediation\n${list(runbook.remediation)}\n\n` +
    `## Verification\n${list(runbook.verification)}\n\n` +
    `## Rollback Considerations\n${list(runbook.rollback_considerations)}\n\n` +
    `## Prevention\n${list(runbook.prevention)}\n\n` +
    `## Post-Incident Checklist\n${list(runbook.post_incident_checklist)}\n\n` +
    `> Commands are for review only. Verify every command and resource before execution.\n`;
}

export default function RunbookGeneratorPage({ onNavigate, initialFormState = null }) {
  const [form, setForm] = useState(() => ({
    title: '', service: 'EC2', severity: 'Unknown', description: '', existing_analysis: '', diagnostic_commands: '', logs: '', troubleshooting_notes: '',
    ...(initialFormState || {}),
  }));
  const [runbook, setRunbook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const markdown = useMemo(() => runbook ? runbookToMarkdown(runbook) : '', [runbook]);

  const generate = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Runbook title and incident description are required.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_runbook', ...form }),
      });
      const payload = await response.json();
      let data = payload;
      if (data && typeof data.body === 'string') data = JSON.parse(data.body);
      if (!response.ok || data.error) throw new Error(data.error || `API returned HTTP ${response.status}`);
      setRunbook(data);
    } catch (err) {
      console.error('Runbook generation failed:', err);
      setError(err.message || 'Unable to generate the runbook.');
    } finally { setLoading(false); }
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${(form.title || 'aws-incident-runbook').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.md`;
    anchor.click(); URL.revokeObjectURL(url);
  };

  const saveRunbook = () => {
    if (!runbook) return;
    const result = saveIncident({ title: form.title, type: 'runbook', severity: runbook.severity || form.severity, summary: runbook.incident_overview || '', analysis: runbook, rawInput: form.description });
    if (result) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  return (
    <div className="analyzer-page">
      <header className="analyzer-header">
        <div className="container">
          <div className="analyzer-header-top">
            <div className="analyzer-breadcrumbs">
              <button className="back-link" onClick={() => onNavigate('/')}><span className="material-symbols-outlined">arrow_back</span>Back to Home</button>
              <span className="breadcrumb-separator">/</span><span className="breadcrumb-current">Runbook Generator</span>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('/history')}><span className="material-symbols-outlined">history</span>History</button>
          </div>
          <div className="analyzer-brand-heading"><img src="/logo-icon.png" alt="AWS DevOps Incident Helper" className="analyzer-logo-img" /><h1 className="analyzer-title">Incident Runbook Generator</h1></div>
          <p className="analyzer-subtitle">Turn an incident investigation into a reusable, review-first AWS operational runbook.</p>
        </div>
      </header>

      <main className="analyzer-main"><div className="container">
        <form className="runbook-form-card" onSubmit={generate}>
          <div className="runbook-form-grid">
            <label>Runbook Title<input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="EC2 High CPU Incident" maxLength={160} /></label>
            <label>AWS Service<select value={form.service} onChange={(e) => update('service', e.target.value)}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label>Severity<select value={form.severity} onChange={(e) => update('severity', e.target.value)}>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="runbook-full-field">Incident Description<textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={5} maxLength={10000} placeholder="Describe the incident, symptoms, affected service, and known evidence..." /></label>
            <label>Existing Incident Analysis<textarea value={form.existing_analysis} onChange={(e) => update('existing_analysis', e.target.value)} rows={4} maxLength={8000} placeholder="Optional analysis from Incident Analyzer" /></label>
            <label>Diagnostic Commands<textarea value={form.diagnostic_commands} onChange={(e) => update('diagnostic_commands', e.target.value)} rows={4} maxLength={6000} placeholder="Optional commands from CLI Generator" /></label>
            <label>Logs / Evidence<textarea value={form.logs} onChange={(e) => update('logs', e.target.value)} rows={4} maxLength={10000} placeholder="Optional evidence or relevant log excerpts" /></label>
            <label>Troubleshooting Notes<textarea value={form.troubleshooting_notes} onChange={(e) => update('troubleshooting_notes', e.target.value)} rows={4} maxLength={6000} placeholder="Optional notes from your investigation" /></label>
          </div>
          {error ? <div className="error-state-card" role="alert"><strong>{error}</strong></div> : null}
          <div className="runbook-form-actions"><button className="btn btn-lg btn-primary" disabled={loading}>{loading ? 'Generating Runbook...' : 'Generate Runbook'}<span className="material-symbols-outlined">auto_awesome</span></button></div>
          <div className="runbook-safety-note"><span className="material-symbols-outlined">verified_user</span>Commands generated by this tool are for review only. Verify every command and resource before execution.</div>
        </form>

        {runbook ? <div className="analysis-container runbook-results">
          <div className="analysis-results-header"><div><h2 className="analysis-results-title"><span className="material-symbols-outlined">menu_book</span>{runbook.runbook_title || form.title}</h2><p className="analysis-results-subtitle">Generated from the information supplied by the operator; no AWS account was accessed.</p></div><div className="analysis-actions-toolbar"><button className="btn btn-sm btn-secondary" onClick={copyMarkdown}>{copied ? 'Copied!' : 'Copy Runbook'}</button><button className="btn btn-sm btn-secondary" onClick={downloadMarkdown}>Download Markdown</button><button className={`btn btn-sm ${saved ? 'btn-success' : 'btn-secondary'}`} onClick={saveRunbook}>{saved ? 'Saved' : 'Save Runbook'}</button></div></div>
          <div className="runbook-meta"><strong>{runbook.severity || form.severity}</strong><span>{form.service}</span></div>
          <Section title="Incident Overview" icon="description"><p>{runbook.incident_overview || 'No overview provided.'}</p></Section>
          <Section title="Impact" icon="warning"><p>{runbook.impact || 'No impact information provided.'}</p></Section>
          <Section title="Symptoms" icon="troubleshoot"><Items items={runbook.symptoms} /></Section>
          <Section title="Initial Triage" icon="priority_high"><Items items={runbook.initial_triage} numbered /></Section>
          <Section title="Evidence to Collect" icon="fact_check"><Items items={runbook.evidence_to_collect} /></Section>
          <Section title="Diagnostic Commands" icon="terminal"><div className="runbook-command-list">{Array.isArray(runbook.diagnostic_commands) && runbook.diagnostic_commands.length ? runbook.diagnostic_commands.map((cmd, i) => <div className="runbook-command" key={i}><code>{typeof cmd === 'string' ? cmd : cmd.command}</code><button className="btn btn-sm btn-secondary" onClick={() => navigator.clipboard.writeText(typeof cmd === 'string' ? cmd : cmd.command)}>Copy</button></div>) : <p className="muted-text">No diagnostic commands generated.</p>}</div></Section>
          <Section title="Likely Root Causes" icon="psychology"><Items items={runbook.likely_root_causes} /></Section>
          <Section title="Troubleshooting Procedure" icon="format_list_numbered"><Items items={runbook.troubleshooting_procedure} numbered /></Section>
          <Section title="Remediation" icon="build"><Items items={runbook.remediation} /></Section>
          <Section title="Verification" icon="check_circle"><Items items={runbook.verification} /></Section>
          <Section title="Rollback Considerations" icon="undo"><Items items={runbook.rollback_considerations} /></Section>
          <Section title="Prevention" icon="shield"><Items items={runbook.prevention} /></Section>
          <Section title="Post-Incident Checklist" icon="checklist"><Items items={runbook.post_incident_checklist} /></Section>
        </div> : null}
      </div></main>
    </div>
  );
}
