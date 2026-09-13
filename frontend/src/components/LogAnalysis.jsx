import { useState } from 'react';
import SeverityCard from './SeverityCard';
import AnalysisSection from './AnalysisSection';
import CommandList from './CommandList';
import { saveIncident } from '../utils/historyStorage';

export default function LogAnalysis({ analysis, isLoading, error, onRetry, rawLogs, onNavigate }) {
  const [copiedSlack, setCopiedSlack] = useState(false);
  const [saved, setSaved] = useState(false);

  const inferService = (text = '') => {
    const lower = text.toLowerCase();
    if (lower.includes('lambda')) return 'Lambda';
    if (lower.includes('api gateway') || lower.includes('apigateway') || lower.includes('502') || lower.includes('504')) return 'API Gateway';
    if (lower.includes('s3') || lower.includes('bucket')) return 'S3';
    if (lower.includes('ec2') || lower.includes('instance')) return 'EC2';
    if (lower.includes('rds') || lower.includes('database') || lower.includes('postgres') || lower.includes('mysql')) return 'RDS';
    if (lower.includes('iam') || lower.includes('role') || lower.includes('policy') || lower.includes('sts')) return 'IAM';
    if (lower.includes('cloudformation') || lower.includes('stack')) return 'CloudFormation';
    if (lower.includes('cloudwatch') || lower.includes('log')) return 'CloudWatch';
    if (lower.includes('vpc') || lower.includes('subnet') || lower.includes('nat gateway')) return 'VPC / Networking';
    return 'CloudWatch';
  };

  const handleOpenCliGenerator = () => {
    if (onNavigate) {
      const detectedService = inferService(`${analysis?.error_pattern || ''} ${analysis?.summary || ''}`);
      onNavigate('/cli-generator', null, {
        service: detectedService,
        incident: analysis?.error_pattern || analysis?.summary || 'Investigate CloudWatch logs error',
        region: 'ap-south-1',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="loading-state-card" role="status" aria-live="polite">
        <div className="loading-spinner-wrap">
          <div className="loading-ping"></div>
          <div className="loading-spin"></div>
        </div>
        <h3 className="loading-title">Parsing CloudWatch Logs & Evidence...</h3>
        <p className="loading-desc">
          Querying Amazon Bedrock (Nova Lite) to correlate timestamps, stack traces, and AWS service runbooks.
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
        <h3 className="error-title">Unable to analyze CloudWatch logs</h3>
        <p className="error-desc">
          The analysis service could not process the provided logs. Check your network connection or verify that log payload does not exceed 20,000 characters.
        </p>
        <button className="btn btn-primary" onClick={onRetry}>
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon" aria-hidden="true">
          <span className="material-symbols-outlined">terminal</span>
        </div>
        <div className="empty-state-content">
          <h3 className="empty-state-title">Awaiting CloudWatch Log Input</h3>
          <p className="empty-state-text">
            Paste application or CloudWatch log output into the box above, or choose a sample scenario to extract failure evidence and remediation steps.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const title = analysis.error_pattern || analysis.summary?.slice(0, 60) || 'CloudWatch Log Analysis';
    const result = saveIncident({
      title: `[Logs] ${title}`,
      type: 'log_analysis',
      severity: analysis.severity || 'MEDIUM',
      summary: analysis.summary || '',
      analysis,
      rawInput: rawLogs || '',
    });

    if (result) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleCopySlack = () => {
    const evidenceText = (analysis.evidence || [])
      .map((e) => `> *Quote:* \`${e.quote || e}\`\n> *Significance:* ${e.significance || 'Identified failure indicator'}`)
      .join('\n\n');

    const causesText = (analysis.likely_causes || []).map((c) => `- ${c}`).join('\n');
    const checksText = (analysis.recommended_checks || []).map((c) => `- ${c}`).join('\n');
    const stepsText = (analysis.troubleshooting_steps || []).map((s, idx) => `${idx + 1}. ${s}`).join('\n');
    const remediationText = (analysis.remediation || []).map((r) => `- ${r}`).join('\n');
    const commandsText = (analysis.aws_commands || []).map((cmd) => `\`\`\`bash\n${cmd}\n\`\`\``).join('\n');
    const preventionText = (analysis.prevention || []).map((p) => `- ${p}`).join('\n');

    const markdown = `### 🚨 CloudWatch Incident Analysis: ${analysis.severity || 'ALERT'}
*Error Pattern:* **${analysis.error_pattern || 'Log Discrepancy'}**

**Executive Summary:**
${analysis.summary}

**Evidence From Logs:**
${evidenceText || 'No explicit quotes extracted.'}

**Likely Root Causes:**
${causesText}

**Recommended Diagnostic Checks:**
${checksText}

**Troubleshooting Steps:**
${stepsText}

**Remediation:**
${remediationText}

**Diagnostic AWS CLI Commands:**
${commandsText || 'None generated.'}

**Prevention & Next Steps:**
${preventionText || 'None.'}

---
*Generated by AWS DevOps Incident Helper (Private & Stateless)*`;

    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedSlack(true);
      setTimeout(() => setCopiedSlack(false), 3000);
    });
  };

  return (
    <div className="analysis-container">
      {/* Top Header & Action Toolbar */}
      <div className="analysis-results-header">
        <div className="analysis-title-group">
          <h2 className="analysis-results-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '8px' }}>
              receipt_long
            </span>
            CloudWatch Log Diagnostic Report
          </h2>
          <p className="analysis-results-subtitle">
            Structured forensic analysis derived strictly from user-provided log lines.
          </p>
        </div>

        <div className="analysis-actions-toolbar">
          {onNavigate ? (
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleOpenCliGenerator}
              title="Generate targeted AWS CLI diagnostic commands for this incident"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>terminal</span>
              <span>Generate CLI Diagnostics</span>
            </button>
          ) : null}

          <button
            className={`btn btn-sm ${saved ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleSave}
            title="Save to local browser history"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {saved ? 'check_circle' : 'bookmark_add'}
            </span>
            <span>{saved ? 'Saved in History' : 'Save Incident'}</span>
          </button>

          <button
            className={`btn btn-sm ${copiedSlack ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleCopySlack}
            title="Copy full incident briefing formatted for Slack / Jira"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {copiedSlack ? 'done' : 'content_paste'}
            </span>
            <span>{copiedSlack ? 'Copied for Slack!' : 'Copy for Slack / Jira'}</span>
          </button>
        </div>
      </div>

      {/* 1. Severity Card */}
      <SeverityCard severity={analysis.severity} />

      {/* 2. Executive Summary */}
      <AnalysisSection
        title="Executive Summary"
        icon={<span className="material-symbols-outlined">subject</span>}
        items={analysis.summary}
        type="summary"
        emptyMessage="No summary provided."
      />

      {/* 3. Error / Failure Pattern */}
      {analysis.error_pattern ? (
        <div className="analysis-card pattern-card">
          <div className="analysis-card-header">
            <div className="analysis-card-icon pattern-icon" aria-hidden="true">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <h3 className="analysis-card-title">Error / Failure Pattern</h3>
          </div>
          <div className="pattern-badge-wrap">
            <span className="pattern-badge">{analysis.error_pattern}</span>
          </div>
        </div>
      ) : null}

      {/* 4. Evidence From Logs (Crucial Feature Requirement) */}
      <div className="analysis-card evidence-card">
        <div className="analysis-card-header">
          <div className="analysis-card-icon evidence-icon" aria-hidden="true">
            <span className="material-symbols-outlined">find_in_page</span>
          </div>
          <div>
            <h3 className="analysis-card-title">Evidence From Logs</h3>
            <p className="analysis-card-subtitle">
              Direct log quotes extracted by the model with operational significance.
            </p>
          </div>
        </div>

        <div className="evidence-list">
          {Array.isArray(analysis.evidence) && analysis.evidence.length > 0 ? (
            analysis.evidence.map((item, index) => {
              const quote = typeof item === 'object' ? item.quote : item;
              const significance = typeof item === 'object' ? item.significance : 'Direct failure indicator.';
              return (
                <div key={index} className="evidence-item">
                  <div className="evidence-quote-wrap">
                    <span className="material-symbols-outlined evidence-quote-icon">format_quote</span>
                    <code className="evidence-quote-code">{quote}</code>
                  </div>
                  {significance ? (
                    <div className="evidence-significance">
                      <strong>Significance:</strong> {significance}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="empty-section-text">No direct log quotes extracted.</p>
          )}
        </div>
      </div>

      {/* 5. Likely Root Causes */}
      <AnalysisSection
        title="Likely Root Causes"
        icon={<span className="material-symbols-outlined">psychology</span>}
        items={analysis.likely_causes}
        type="bullet"
        emptyMessage="No specific root causes identified."
      />

      {/* 6. Recommended Diagnostic Checks */}
      <AnalysisSection
        title="Recommended Diagnostic Checks"
        icon={<span className="material-symbols-outlined">checklist</span>}
        items={analysis.recommended_checks}
        type="bullet"
        emptyMessage="No recommended checks provided."
      />

      {/* 7. Troubleshooting Steps */}
      <AnalysisSection
        title="Troubleshooting Steps"
        icon={<span className="material-symbols-outlined">format_list_numbered</span>}
        items={analysis.troubleshooting_steps}
        type="numbered"
        emptyMessage="No specific troubleshooting steps provided."
      />

      {/* 8. Actionable Remediation */}
      <AnalysisSection
        title="Remediation"
        icon={<span className="material-symbols-outlined">build</span>}
        items={analysis.remediation}
        type="bullet"
        emptyMessage="No remediation recommendations provided."
      />

      {/* 9. AWS CLI Commands */}
      <CommandList commands={analysis.aws_commands} />

      {/* 10. Prevention / Next Steps */}
      {analysis.prevention ? (
        <AnalysisSection
          title="Prevention & Hardening"
          icon={<span className="material-symbols-outlined">shield</span>}
          items={analysis.prevention}
          type="bullet"
          emptyMessage="No prevention guidance provided."
        />
      ) : null}

      {/* Compliance & Safety Disclaimer */}
      <div className="disclaimer-card" role="note">
        <div className="disclaimer-icon" aria-hidden="true">
          <span className="material-symbols-outlined">security</span>
        </div>
        <div>
          <strong>Stateless & Isolated Analysis:</strong> This analysis was performed on-demand using Amazon Bedrock Nova Lite based exclusively on the text you provided. The application does not connect to or query your AWS account or live CloudWatch streams.
        </div>
      </div>
    </div>
  );
}
