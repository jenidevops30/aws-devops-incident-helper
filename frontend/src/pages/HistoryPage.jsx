import { useState, useEffect } from 'react';
import { getHistory, deleteIncident, clearAllHistory, searchHistory } from '../utils/historyStorage';
import IncidentAnalysis from '../components/IncidentAnalysis';
import LogAnalysis from '../components/LogAnalysis';
import Footer from '../components/Footer';

export default function HistoryPage({ onNavigate }) {
  const [incidents, setIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const loadHistory = () => setIncidents(searchQuery.trim() ? searchHistory(searchQuery) : getHistory());
  useEffect(() => {
    const timer = setTimeout(() => {
      setIncidents(searchQuery.trim() ? searchHistory(searchQuery) : getHistory());
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = (e, id) => {
    e.stopPropagation(); deleteIncident(id);
    if (selectedIncident?.id === id) setSelectedIncident(null);
    loadHistory();
  };
  const handleClearAll = () => { clearAllHistory(); setSelectedIncident(null); setConfirmClearOpen(false); loadHistory(); };

  const typeLabel = (type) => type === 'log_analysis' ? 'Log Analysis' : type === 'runbook' ? 'Runbook' : 'Incident';
  const handleGenerateReport = (e, item) => {
    e.stopPropagation();
    onNavigate('/incident-report', null, { sourceId: item.id });
    window.history.replaceState({}, '', `/incident-report?incident=${encodeURIComponent(item.id)}`);
  };

  return <div className="history-page">
    <header className="analyzer-header" role="banner"><div className="container">
      <div className="analyzer-header-top"><div className="analyzer-breadcrumbs"><button className="back-link" onClick={() => onNavigate('/')}><span className="material-symbols-outlined">arrow_back</span>Back to Home</button><span className="breadcrumb-separator">/</span><span className="breadcrumb-current">Incident History</span></div><div className="analyzer-header-badge"><span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>lock</span><span>100% Private (Stored Locally in Browser)</span></div></div>
      <div className="analyzer-brand-heading"><span className="material-symbols-outlined history-brand-icon">history</span><h1 className="analyzer-title">Incident History & Runbooks</h1></div>
      <p className="analyzer-subtitle">Review, search, and export previously diagnosed AWS incidents, CloudWatch analyses, and generated runbooks.</p>
    </div></header>

    <main className="history-main"><div className="container">
      <div className="history-controls-bar"><div className="history-search-wrap"><span className="material-symbols-outlined history-search-icon">search</span><input type="text" className="history-search-input" placeholder="Search saved incidents, runbooks, services, errors, or severity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Search history" />{searchQuery ? <button className="history-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search query"><span className="material-symbols-outlined">close</span></button> : null}</div>
        <div className="history-actions-group"><button className="btn btn-secondary history-nav-analyze-btn" onClick={() => onNavigate('/analyze')}><span className="material-symbols-outlined">add</span>New Incident</button><button className="btn btn-secondary" onClick={() => onNavigate('/runbook-generator')}><span className="material-symbols-outlined">menu_book</span>New Runbook</button><button className="btn btn-secondary" onClick={() => onNavigate('/incident-report')}><span className="material-symbols-outlined">description</span>New Report</button>{incidents.length > 0 ? <button className="btn btn-outline-danger" onClick={() => setConfirmClearOpen(true)}><span className="material-symbols-outlined">delete_sweep</span>Clear History</button> : null}</div>
      </div>

      <div className="history-privacy-notice" role="note"><span className="material-symbols-outlined privacy-notice-icon">shield</span><span><strong>Security & Storage Note:</strong> Saved investigations and runbooks are stored exclusively in your browser's local cache. Avoid saving secrets, tokens, or production credentials.</span></div>

      {incidents.length === 0 ? <div className="empty-history-card"><div className="empty-state-icon"><span className="material-symbols-outlined">folder_open</span></div><h3 className="empty-state-title">{searchQuery ? 'No matching history found' : 'No saved investigations yet.'}</h3><p className="empty-state-text">{searchQuery ? `No previous records match "${searchQuery}".` : 'Save an incident analysis or generated runbook to create a private on-call reference library.'}</p><button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => onNavigate('/analyze')}>Go to Analyzer →</button></div> :
        <div className="history-grid">{incidents.map((item) => {
          const isSelected = selectedIncident?.id === item.id;
          const severityClass = `severity-tag-${(item.severity || 'medium').toLowerCase()}`;
          return <div key={item.id} className={`history-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedIncident(item)}>
            <div className="history-card-top"><div className="history-badges-group"><span className={`badge severity-badge ${severityClass}`}>{item.severity}</span><span className="badge type-badge">{typeLabel(item.type)}</span></div><span className="history-timestamp">{item.formattedDate}</span></div>
            <h3 className="history-card-title">{item.title}</h3><p className="history-card-summary">{item.summary || 'Click to view the saved investigation.'}</p>
            <div className="history-card-actions"><button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setSelectedIncident(item); }}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>View {item.type === 'runbook' ? 'Runbook' : 'Analysis'}</button><button className="btn btn-sm btn-secondary" onClick={(e) => handleGenerateReport(e, item)}><span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>Generate Report</button><button className="btn btn-sm btn-icon-danger" onClick={(e) => handleDelete(e, item.id)} title="Delete record" aria-label="Delete record"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span></button></div>
          </div>;
        })}</div>}

      {selectedIncident ? <div className="history-modal-overlay" onClick={() => setSelectedIncident(null)}><div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="history-modal-header"><div className="history-modal-title-group"><span className="history-modal-type-badge">{typeLabel(selectedIncident.type)}</span><h2 className="history-modal-title">{selectedIncident.title}</h2><span className="history-modal-date">{selectedIncident.formattedDate}</span></div><button className="history-modal-close" onClick={() => setSelectedIncident(null)} aria-label="Close modal"><span className="material-symbols-outlined">close</span></button></div>
        <div className="history-modal-body">
          <div className="history-modal-report-action"><button className="btn btn-primary" onClick={(e) => handleGenerateReport(e, selectedIncident)}><span className="material-symbols-outlined">description</span>Generate Incident Report</button></div>
          {selectedIncident.type === 'runbook' ? <div className="analysis-container runbook-results"><div className="analysis-results-header"><div><h2 className="analysis-results-title"><span className="material-symbols-outlined">menu_book</span>{selectedIncident.analysis?.runbook_title || selectedIncident.title}</h2><p className="analysis-results-subtitle">Saved locally in this browser.</p></div></div>{Object.entries({
            'Incident Overview': selectedIncident.analysis?.incident_overview,
            'Impact': selectedIncident.analysis?.impact,
            'Symptoms': selectedIncident.analysis?.symptoms,
            'Initial Triage': selectedIncident.analysis?.initial_triage,
            'Evidence to Collect': selectedIncident.analysis?.evidence_to_collect,
            'Likely Root Causes': selectedIncident.analysis?.likely_root_causes,
            'Troubleshooting Procedure': selectedIncident.analysis?.troubleshooting_procedure,
            'Remediation': selectedIncident.analysis?.remediation,
            'Verification': selectedIncident.analysis?.verification,
            'Rollback Considerations': selectedIncident.analysis?.rollback_considerations,
            'Prevention': selectedIncident.analysis?.prevention,
            'Post-Incident Checklist': selectedIncident.analysis?.post_incident_checklist,
          }).map(([title, value]) => <section className="analysis-section runbook-section" key={title}><div className="analysis-section-header"><h3>{title}</h3></div><div className="analysis-section-content">{Array.isArray(value) ? <ul className="runbook-list">{value.map((v, i) => <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>)}</ul> : <p>{value || 'No information provided.'}</p>}</div></section>)}</div> : selectedIncident.type === 'log_analysis' ? <LogAnalysis analysis={selectedIncident.analysis} isLoading={false} error={false} rawLogs={selectedIncident.inputSnippet} /> : <IncidentAnalysis analysis={selectedIncident.analysis} isLoading={false} error={false} rawIncident={selectedIncident.inputSnippet} />}
        </div>
      </div></div> : null}

      {confirmClearOpen ? <div className="history-modal-overlay" onClick={() => setConfirmClearOpen(false)}><div className="history-confirm-dialog" onClick={(e) => e.stopPropagation()}><div className="confirm-icon-wrap"><span className="material-symbols-outlined confirm-warn-icon">warning</span></div><h3 className="confirm-title">Clear All Incident History?</h3><p className="confirm-desc">This will permanently delete all {incidents.length} saved records from your browser's local cache.</p><div className="confirm-actions"><button className="btn btn-secondary" onClick={() => setConfirmClearOpen(false)}>Cancel</button><button className="btn btn-danger" onClick={handleClearAll}>Yes, Clear All</button></div></div></div> : null}
    </div></main>
    <Footer />
  </div>;
}
