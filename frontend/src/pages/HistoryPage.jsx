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

  const loadHistory = () => {
    if (searchQuery.trim()) {
      setIncidents(searchHistory(searchQuery));
    } else {
      setIncidents(getHistory());
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchQuery]);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteIncident(id);
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident(null);
    }
    loadHistory();
  };

  const handleClearAll = () => {
    clearAllHistory();
    setSelectedIncident(null);
    setConfirmClearOpen(false);
    loadHistory();
  };

  return (
    <div className="history-page">
      {/* Header */}
      <header className="analyzer-header" role="banner">
        <div className="container">
          <div className="analyzer-header-top">
            <div className="analyzer-breadcrumbs">
              <button 
                className="back-link" 
                onClick={() => onNavigate('/')}
                aria-label="Back to Landing Page"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Home
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Incident History</span>
            </div>

            <div className="analyzer-header-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>lock</span>
              <span>100% Private (Stored Locally in Browser)</span>
            </div>
          </div>

          <div className="analyzer-brand-heading">
            <span className="material-symbols-outlined history-brand-icon">history</span>
            <h1 className="analyzer-title">Incident History & Runbooks</h1>
          </div>
          <p className="analyzer-subtitle">
            Review, search, and export previously diagnosed AWS incidents and CloudWatch log analyses.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="history-main">
        <div className="container">
          {/* Controls Bar: Search & Clear */}
          <div className="history-controls-bar">
            <div className="history-search-wrap">
              <span className="material-symbols-outlined history-search-icon">search</span>
              <input
                type="text"
                className="history-search-input"
                placeholder="Search saved incidents by keyword, service, error code, or severity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search incidents"
              />
              {searchQuery ? (
                <button
                  className="history-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              ) : null}
            </div>

            <div className="history-actions-group">
              <button
                className="btn btn-secondary history-nav-analyze-btn"
                onClick={() => onNavigate('/analyze')}
              >
                <span className="material-symbols-outlined">add</span>
                New Incident
              </button>

              {incidents.length > 0 ? (
                <button
                  className="btn btn-outline-danger"
                  onClick={() => setConfirmClearOpen(true)}
                  aria-label="Clear all history"
                >
                  <span className="material-symbols-outlined">delete_sweep</span>
                  Clear History
                </button>
              ) : null}
            </div>
          </div>

          {/* Privacy & Security Reminder */}
          <div className="history-privacy-notice" role="note">
            <span className="material-symbols-outlined privacy-notice-icon">shield</span>
            <span>
              <strong>Security & Storage Note:</strong> Your incident analyses are stored exclusively in your browser's local cache. They are never uploaded or retained on any AWS server. Please avoid saving sensitive secrets or production access keys.
            </span>
          </div>

          {/* Incident List */}
          {incidents.length === 0 ? (
            <div className="empty-history-card">
              <div className="empty-state-icon" aria-hidden="true">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <h3 className="empty-state-title">
                {searchQuery ? 'No matching incidents found' : 'No saved incidents yet.'}
              </h3>
              <p className="empty-state-text">
                {searchQuery
                  ? `No previous diagnoses match "${searchQuery}". Try a different keyword.`
                  : 'When you run an incident or log analysis, click "Save Incident" to bookmark it here for fast on-call reference.'}
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => onNavigate('/analyze')}
              >
                Go to Analyzer →
              </button>
            </div>
          ) : (
            <div className="history-grid">
              {incidents.map((item) => {
                const isSelected = selectedIncident && selectedIncident.id === item.id;
                const severityClass = `severity-tag-${(item.severity || 'medium').toLowerCase()}`;
                const isLogType = item.type === 'log_analysis';

                return (
                  <div
                    key={item.id}
                    className={`history-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedIncident(item)}
                  >
                    <div className="history-card-top">
                      <div className="history-badges-group">
                        <span className={`badge severity-badge ${severityClass}`}>
                          {item.severity}
                        </span>
                        <span className="badge type-badge">
                          {isLogType ? 'Log Analysis' : 'Incident'}
                        </span>
                      </div>
                      <span className="history-timestamp">{item.formattedDate}</span>
                    </div>

                    <h3 className="history-card-title">{item.title}</h3>

                    <p className="history-card-summary">
                      {item.summary || 'Click to view full diagnosis, troubleshooting steps, and CLI commands.'}
                    </p>

                    <div className="history-card-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(item);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                        View Analysis
                      </button>

                      <button
                        className="btn btn-sm btn-icon-danger"
                        onClick={(e) => handleDelete(e, item.id)}
                        title="Delete incident from history"
                        aria-label="Delete incident"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Incident Viewer Modal */}
          {selectedIncident ? (
            <div className="history-modal-overlay" onClick={() => setSelectedIncident(null)}>
              <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="history-modal-header">
                  <div className="history-modal-title-group">
                    <span className="history-modal-type-badge">
                      {selectedIncident.type === 'log_analysis' ? 'CloudWatch Logs' : 'Incident'}
                    </span>
                    <h2 className="history-modal-title">{selectedIncident.title}</h2>
                    <span className="history-modal-date">{selectedIncident.formattedDate}</span>
                  </div>
                  <button
                    className="history-modal-close"
                    onClick={() => setSelectedIncident(null)}
                    aria-label="Close modal"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="history-modal-body">
                  {selectedIncident.type === 'log_analysis' ? (
                    <LogAnalysis
                      analysis={selectedIncident.analysis}
                      isLoading={false}
                      error={false}
                      rawLogs={selectedIncident.inputSnippet}
                    />
                  ) : (
                    <IncidentAnalysis
                      analysis={selectedIncident.analysis}
                      isLoading={false}
                      error={false}
                      rawIncident={selectedIncident.inputSnippet}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Confirmation Modal for Clear All */}
          {confirmClearOpen ? (
            <div className="history-modal-overlay" onClick={() => setConfirmClearOpen(false)}>
              <div className="history-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon-wrap">
                  <span className="material-symbols-outlined confirm-warn-icon">warning</span>
                </div>
                <h3 className="confirm-title">Clear All Incident History?</h3>
                <p className="confirm-desc">
                  This will permanently delete all {incidents.length} saved investigations from your browser's local cache. This action cannot be undone.
                </p>
                <div className="confirm-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConfirmClearOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleClearAll}
                  >
                    Yes, Clear All
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
