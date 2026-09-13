import SeverityCard from './SeverityCard';
import AnalysisSection from './AnalysisSection';
import CommandList from './CommandList';

export default function IncidentAnalysis({ analysis, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="loading-state-card" role="status" aria-live="polite">
        <div className="loading-spinner-wrap">
          <div className="loading-ping"></div>
          <div className="loading-spin"></div>
        </div>
        <h3 className="loading-title">Analyzing Incident Architecture...</h3>
        <p className="loading-desc">
          Querying Amazon Bedrock (Nova Lite) and correlating AWS best practice runbooks.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state-card" role="alert">
        <div className="error-icon-badge" aria-hidden="true">
          <span className="material-symbols-outlined">error</span>
        </div>
        <h3 className="error-title">Unable to analyze incident</h3>
        <p className="error-desc">
          The analysis service could not be reached. Check your API configuration and try again.
        </p>
        <button 
          className="btn btn-primary"
          onClick={onRetry}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon" aria-hidden="true">
          <span className="material-symbols-outlined">analytics</span>
        </div>
        <div className="empty-state-content">
          <h3 className="empty-state-title">Awaiting Incident Description</h3>
          <p className="empty-state-text">
            Paste your error logs, describe your AWS issue, or select a quick-fill template above to generate a comprehensive diagnostic report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <div className="analysis-results-header">
        <h2 className="analysis-results-title">
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }}>
            troubleshoot
          </span>
          Diagnostic Analysis Report
        </h2>
        <p className="analysis-results-subtitle">
          AI-generated troubleshooting guidance based on AWS Well-Architected incident response runbooks.
        </p>
      </div>

      <SeverityCard severity={analysis.severity} />

      <AnalysisSection
        title="Summary"
        icon={<span className="material-symbols-outlined">subject</span>}
        items={analysis.summary}
        type="summary"
        emptyMessage="No summary provided."
      />

      <AnalysisSection
        title="Likely Causes"
        icon={<span className="material-symbols-outlined">psychology</span>}
        items={analysis.likely_causes}
        type="bullet"
        emptyMessage="No specific root causes identified."
      />

      <AnalysisSection
        title="Recommended Checks"
        icon={<span className="material-symbols-outlined">checklist</span>}
        items={analysis.recommended_checks}
        type="bullet"
        emptyMessage="No recommended checks provided."
      />

      <AnalysisSection
        title="Troubleshooting Steps"
        icon={<span className="material-symbols-outlined">format_list_numbered</span>}
        items={analysis.troubleshooting_steps}
        type="numbered"
        emptyMessage="No specific troubleshooting steps provided."
      />

      <AnalysisSection
        title="Remediation"
        icon={<span className="material-symbols-outlined">build</span>}
        items={analysis.remediation}
        type="bullet"
        emptyMessage="No remediation recommendations provided."
      />

      <CommandList commands={analysis.aws_commands} />

      <div className="disclaimer-card" role="note">
        <div className="disclaimer-icon" aria-hidden="true">
          <span className="material-symbols-outlined">info</span>
        </div>
        <div>
          <strong>AI-generated guidance is informational.</strong> Always verify recommendations against
          your AWS environment and documentation before executing production changes.
        </div>
      </div>
    </div>
  );
}
