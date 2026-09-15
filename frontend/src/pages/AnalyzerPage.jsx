import { useState } from 'react';
import IncidentInput from '../components/IncidentInput';
import IncidentAnalysis from '../components/IncidentAnalysis';
import LogAnalysis from '../components/LogAnalysis';
import Footer from '../components/Footer';
import { EXAMPLE_LOGS } from '../data/exampleLogs';
import { findRelatedIncidents } from '../utils/historyStorage';

export default function AnalyzerPage({ incidentText, onIncidentTextChange, onNavigate }) {
  const [activeTab, setActiveTab] = useState('incident');
  const [logText, setLogText] = useState('');
  const [incidentAnalysis, setIncidentAnalysis] = useState(null);
  const [logAnalysisResult, setLogAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  const [selectedRelatedModal, setSelectedRelatedModal] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com';

  const updateRelated = (text) => {
    if (!text || text.length < 10) { setRelatedIncidents([]); return; }
    setRelatedIncidents(findRelatedIncidents(text));
  };

  const handleAnalyzeIncident = async (textToAnalyze) => {
    const text = textToAnalyze || incidentText;
    if (!text || !text.trim()) return;
    setIsLoading(true); setError(false);
    try {
      const response = await fetch(`${API_URL}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ incident: text.trim() }) });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      let data = await response.json();
      if (data && typeof data.body === 'string') { try { data = JSON.parse(data.body); } catch (parseErr) { console.warn('Unable to parse nested JSON body:', parseErr); } }
      if (data && (data.severity || data.summary || data.likely_causes)) { setIncidentAnalysis(data); updateRelated(text); }
      else throw new Error('Malformed response received from analysis service');
    } catch (err) { console.error('Incident analysis request failed:', err); setError(true); }
    finally { setIsLoading(false); }
  };

  const handleAnalyzeLogs = async () => {
    if (!logText || !logText.trim()) return;
    setIsLoading(true); setError(false);
    try {
      const response = await fetch(`${API_URL}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'analyze_logs', logs: logText.trim() }) });
      if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
      let data = await response.json();
      if (data && typeof data.body === 'string') { try { data = JSON.parse(data.body); } catch (parseErr) { console.warn('Unable to parse nested JSON body:', parseErr); } }
      if (data && (data.severity || data.summary || data.error_pattern || data.evidence)) { setLogAnalysisResult(data); updateRelated(logText); }
      else throw new Error('Malformed response received from log analysis service');
    } catch (err) { console.error('CloudWatch log analysis request failed:', err); setError(true); }
    finally { setIsLoading(false); }
  };

  const handleLoadLogExample = (exampleKey) => { const example = EXAMPLE_LOGS[exampleKey]; if (example && example.logs) setLogText(example.logs); };

  const openLogReport = () => {
    if (!logAnalysisResult) return;
    const lower = `${logAnalysisResult.error_pattern || ''} ${logAnalysisResult.summary || ''}`.toLowerCase();
    let service = 'CloudWatch';
    if (lower.includes('lambda')) service = 'Lambda'; else if (lower.includes('api gateway') || lower.includes('apigateway')) service = 'API Gateway'; else if (lower.includes('s3')) service = 'S3'; else if (lower.includes('ec2')) service = 'EC2'; else if (lower.includes('rds') || lower.includes('database')) service = 'RDS';
    onNavigate('/incident-report', null, { form: { title: logAnalysisResult.error_pattern || 'CloudWatch Log Incident', service, severity: (logAnalysisResult.severity || 'Unknown').charAt(0) + (logAnalysisResult.severity || 'Unknown').slice(1).toLowerCase(), description: logAnalysisResult.summary || 'CloudWatch log incident', logs: logText, analysis: JSON.stringify(logAnalysisResult, null, 2), diagnostic_commands: (logAnalysisResult.aws_commands || []).join('\n'), troubleshooting: (logAnalysisResult.troubleshooting_steps || []).join('\n'), remediation: (logAnalysisResult.remediation || []).join('\n') } });
  };

  return (
    <div className="analyzer-page">
      <header className="analyzer-header" role="banner"><div className="container">
        <div className="analyzer-header-top"><div className="analyzer-breadcrumbs"><button className="back-link" onClick={() => onNavigate('/')} aria-label="Back to Landing Page"><span className="material-symbols-outlined">arrow_back</span>Back to Home</button><span className="breadcrumb-separator">/</span><span className="breadcrumb-current">Incident Analyzer</span></div><div className="analyzer-header-actions-group"><button className="btn btn-sm btn-secondary history-quick-btn" onClick={() => onNavigate('/history')} title="View saved incident investigations"><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span><span>History</span></button><div className="analyzer-header-badge"><span className="status-pulse-dot"></span><span>Model: Amazon Nova Lite (ap-south-1)</span></div></div></div>
        <div className="analyzer-brand-heading"><img src="/logo-icon.png" alt="AWS DevOps Incident Helper" className="analyzer-logo-img" /><h1 className="analyzer-title">AWS DevOps Incident Helper</h1></div>
        <p className="analyzer-subtitle">Diagnose AWS errors, inspect CloudWatch logs, and generate actionable remediation commands in seconds.</p>
        <div className="analyzer-tabs-bar" role="tablist"><button className={`analyzer-tab-btn ${activeTab === 'incident' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'incident'} onClick={() => { setActiveTab('incident'); setError(false); }}><span className="material-symbols-outlined tab-icon">error_outline</span><span>Incident Description</span></button><button className={`analyzer-tab-btn ${activeTab === 'logs' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setError(false); }}><span className="material-symbols-outlined tab-icon">terminal</span><span>CloudWatch Log Analyzer</span><span className="tab-pill-badge">V2</span></button></div>
      </div></header>

      <main className="analyzer-main"><div className="container">
        {activeTab === 'incident' ? <><IncidentInput value={incidentText} onChange={onIncidentTextChange} onAnalyze={handleAnalyzeIncident} isLoading={isLoading} /><IncidentAnalysis analysis={incidentAnalysis} isLoading={isLoading} error={error} onRetry={() => handleAnalyzeIncident(incidentText)} rawIncident={incidentText} onNavigate={onNavigate} /></> :
          <div className="log-analyzer-card"><div className="log-analyzer-header"><div className="log-analyzer-title-wrap"><div className="log-analyzer-icon" aria-hidden="true"><span className="material-symbols-outlined">receipt_long</span></div><div><h2 className="log-analyzer-title">CloudWatch Log Analyzer</h2><p className="log-analyzer-desc">Paste CloudWatch or application logs below to extract failure patterns, pinpoint log evidence, and generate CLI runbooks.</p></div></div><div className="log-privacy-pill" title="Logs are analyzed in real-time and never saved on AWS servers"><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span><span>Private & Stateless</span></div></div>
            <div className="log-presets-group"><span className="log-presets-label">Quick-Load Sample Logs:</span><div className="log-presets-buttons"><button className="log-preset-chip" onClick={() => handleLoadLogExample('lambdaTimeout')} type="button">⚡ Lambda Timeout</button><button className="log-preset-chip" onClick={() => handleLoadLogExample('apiGateway5xx')} type="button">🌐 API Gateway 5xx</button><button className="log-preset-chip" onClick={() => handleLoadLogExample('appError')} type="button">📦 Application Error</button><button className="log-preset-chip" onClick={() => handleLoadLogExample('dbConnectionError')} type="button">🗄️ Database Connection Error</button></div></div>
            <div className="log-textarea-wrap"><textarea className="log-textarea" placeholder="Paste raw CloudWatch log streams, Lambda execution traces, or container error logs here..." rows={9} maxLength={20000} value={logText} onChange={(e) => setLogText(e.target.value)} disabled={isLoading} aria-label="CloudWatch log input" /><div className="log-textarea-footer"><span className="log-char-count">Character count: {logText.length.toLocaleString()} / 20,000</span>{logText ? <button className="log-clear-btn" onClick={() => setLogText('')} disabled={isLoading}>Clear Logs</button> : null}</div></div>
            <div className="log-actions-bar"><button className="btn btn-lg btn-primary analyze-logs-btn" onClick={handleAnalyzeLogs} disabled={isLoading || !logText.trim()}>{isLoading ? <><span className="loading-spin-sm"></span><span>Analyzing CloudWatch Logs...</span></> : <><span>✦ Analyze Logs</span><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span></>}</button></div>
            <LogAnalysis analysis={logAnalysisResult} isLoading={isLoading} error={error} onRetry={handleAnalyzeLogs} rawLogs={logText} onNavigate={onNavigate} />
            {logAnalysisResult ? <div className="analysis-actions-toolbar" style={{ marginTop: '12px' }}><button className="btn btn-sm btn-primary" onClick={openLogReport}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>Generate Incident Report</button></div> : null}
          </div>}

        {relatedIncidents.length > 0 ? <div className="related-incidents-section"><div className="related-incidents-header"><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>sync_problem</span><div><h3 className="related-incidents-title">Related Saved Incidents</h3><p className="related-incidents-subtitle">Found {relatedIncidents.length} previously investigated incidents in your browser history matching similar AWS services or error patterns.</p></div></div><div className="related-incidents-grid">{relatedIncidents.map((rel) => <div key={rel.id} className="related-incident-chip-card" onClick={() => setSelectedRelatedModal(rel)}><div className="related-chip-top"><span className={`badge severity-badge severity-tag-${(rel.severity || 'medium').toLowerCase()}`}>{rel.severity}</span><span className="related-chip-date">{rel.formattedDate}</span></div><h4 className="related-chip-title">{rel.title}</h4><p className="related-chip-snippet">{rel.summary?.slice(0, 120)}...</p><span className="related-chip-view-link">View Previous Solution →</span></div>)}</div></div> : (incidentAnalysis || logAnalysisResult) ? <div className="related-incidents-empty-note"><span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--muted)' }}>info</span><span>No related saved incidents found in local history.</span></div> : null}

        {selectedRelatedModal ? <div className="history-modal-overlay" onClick={() => setSelectedRelatedModal(null)}><div className="history-modal-content" onClick={(e) => e.stopPropagation()}><div className="history-modal-header"><div className="history-modal-title-group"><span className="history-modal-type-badge">{selectedRelatedModal.type === 'log_analysis' ? 'CloudWatch Logs' : 'Incident'}</span><h2 className="history-modal-title">{selectedRelatedModal.title}</h2><span className="history-modal-date">{selectedRelatedModal.formattedDate}</span></div><button className="history-modal-close" onClick={() => setSelectedRelatedModal(null)} aria-label="Close modal"><span className="material-symbols-outlined">close</span></button></div><div className="history-modal-body">{selectedRelatedModal.type === 'log_analysis' ? <LogAnalysis analysis={selectedRelatedModal.analysis} isLoading={false} error={false} rawLogs={selectedRelatedModal.inputSnippet} /> : <IncidentAnalysis analysis={selectedRelatedModal.analysis} isLoading={false} error={false} rawIncident={selectedRelatedModal.inputSnippet} />}</div></div></div> : null}
      </div></main>
      <Footer />
    </div>
  );
}
