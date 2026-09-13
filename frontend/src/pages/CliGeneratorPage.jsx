import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AWS_SERVICES = [
  'Lambda',
  'API Gateway',
  'S3',
  'EC2',
  'IAM',
  'RDS',
  'CloudFormation',
  'CloudWatch',
  'VPC / Networking',
];

const SERVICE_EXAMPLES = {
  Lambda: {
    incident: 'Lambda function is timing out after 30 seconds with 504 gateway timeout',
    resource: 'order-processor-fn',
  },
  'API Gateway': {
    incident: 'API Gateway returning 502 Bad Gateway intermittently under traffic spikes',
    resource: 'orders-http-api',
  },
  S3: {
    incident: '403 AccessDeniedException when uploading multipart objects to S3 bucket',
    resource: 'app-assets-production',
  },
  EC2: {
    incident: 'EC2 instance unreachable via SSH and failing 2/2 status checks',
    resource: 'i-0123456789abcdef0',
  },
  IAM: {
    incident: 'User or role is unauthorized to perform sts:AssumeRole or access KMS key',
    resource: 'DeploymentPipelineRole',
  },
  RDS: {
    incident: 'Database connection refused on port 5432, max connections limit reached',
    resource: 'prod-postgres-db',
  },
  CloudFormation: {
    incident: 'Stack creation failed in UPDATE_ROLLBACK_FAILED state due to resource dependency',
    resource: 'ProductionAppStack',
  },
  CloudWatch: {
    incident: 'High volume of 5xx errors reported by alarm, log streams throttled',
    resource: '/aws/application/production',
  },
  'VPC / Networking': {
    incident: 'Subnet route table cannot route egress traffic through NAT Gateway',
    resource: 'rtb-0123456789abcdef0',
  },
};

export default function CliGeneratorPage({ onNavigate, initialFormState = null }) {
  const [service, setService] = useState(initialFormState?.service || 'Lambda');
  const [incident, setIncident] = useState(initialFormState?.incident || '');
  const [resourceName, setResourceName] = useState(initialFormState?.resource_name || '');
  const [region, setRegion] = useState(initialFormState?.region || 'ap-south-1');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Sync if initialFormState changes
  useEffect(() => {
    if (initialFormState) {
      if (initialFormState.service) setService(initialFormState.service);
      if (initialFormState.incident) setIncident(initialFormState.incident);
      if (initialFormState.resource_name) setResourceName(initialFormState.resource_name);
      if (initialFormState.region) setRegion(initialFormState.region);
    }
  }, [initialFormState]);

  const handleApplyPreset = (svcName) => {
    setService(svcName);
    const preset = SERVICE_EXAMPLES[svcName];
    if (preset) {
      setIncident(preset.incident);
      setResourceName(preset.resource);
    }
  };

  const handleGenerate = async () => {
    if (!service) {
      setError('Please select an AWS service.');
      return;
    }
    if (!incident.trim()) {
      setError('Please describe what you want to diagnose.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com';

    try {
      const res = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_cli',
          service,
          incident: incident.trim(),
          resource_name: resourceName.trim(),
          region: region.trim() || 'ap-south-1',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.commands)) {
        setResult(data);
      } else {
        throw new Error('Malformed response received from command generator service.');
      }
    } catch (err) {
      console.error('CLI generation error:', err);
      setError(err.message || 'Unable to generate diagnostic commands. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCommand = (cmdText, index) => {
    navigator.clipboard.writeText(cmdText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopyAll = () => {
    if (!result || !result.commands) return;
    const allText = result.commands.map((c) => c.command).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleDownload = () => {
    if (!result || !result.commands) return;

    const lines = [
      '==================================================',
      'AWS DevOps Incident Helper - CLI Diagnostic Commands',
      '==================================================',
      `Service:     ${result.service || service}`,
      `Region:      ${region || 'ap-south-1'}`,
      `Target:      ${resourceName || 'Generic / Placeholders'}`,
      `Generated:   ${new Date().toISOString()}`,
      '',
      'Summary:',
      result.summary || 'Diagnostic inspection commands.',
      '',
      '--------------------------------------------------',
      'DIAGNOSTIC COMMANDS (READ-ONLY)',
      '--------------------------------------------------',
      '',
    ];

    result.commands.forEach((item, idx) => {
      lines.push(`[${idx + 1}] ${item.command}`);
      if (item.description) lines.push(`    Checks:  ${item.description}`);
      if (item.purpose) lines.push(`    Why:     ${item.purpose}`);
      lines.push('');
    });

    lines.push('--------------------------------------------------');
    lines.push('SAFETY NOTICE:');
    lines.push(result.safety_note || 'These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment.');
    lines.push('The browser and assistant do not execute AWS commands directly.');
    lines.push('==================================================');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aws-cli-diagnostics-${(service || 'aws').toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cli-generator-page">
      <Navbar onNavigate={onNavigate} currentRoute="/cli-generator" />

      {/* Header Banner */}
      <header className="analyzer-header" role="banner">
        <div className="container">
          <div className="analyzer-header-top">
            <div className="analyzer-breadcrumbs">
              <button
                className="back-link"
                onClick={() => onNavigate('/analyze')}
                aria-label="Back to Analyzer"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Analyzer
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">CLI Generator</span>
            </div>

            <div className="analyzer-header-actions-group">
              <div className="analyzer-header-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>terminal</span>
                <span>Safe Read-Only Commands</span>
              </div>
            </div>
          </div>

          <div className="analyzer-brand-heading">
            <span className="material-symbols-outlined cli-page-icon">terminal</span>
            <h1 className="analyzer-title">AWS CLI Diagnostic Generator</h1>
          </div>
          <p className="analyzer-subtitle">
            Generate safe, read-only AWS CLI commands for troubleshooting common AWS incidents.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="cli-generator-main">
        <div className="container">
          <div className="cli-generator-layout">
            {/* Input Form Card */}
            <div className="cli-form-card">
              <div className="cli-form-header">
                <div className="cli-form-icon" aria-hidden="true">
                  <span className="material-symbols-outlined">tune</span>
                </div>
                <div>
                  <h2 className="cli-form-title">Diagnostic Parameters</h2>
                  <p className="cli-form-subtitle">
                    Select the target service and describe the symptom to receive targeted inspection commands.
                  </p>
                </div>
              </div>

              {/* Presets Row */}
              <div className="cli-quick-presets">
                <span className="cli-presets-label">Quick Scenarios:</span>
                <div className="cli-presets-chips">
                  {AWS_SERVICES.map((svc) => (
                    <button
                      key={svc}
                      type="button"
                      className={`cli-preset-chip ${service === svc ? 'active' : ''}`}
                      onClick={() => handleApplyPreset(svc)}
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cli-form-body">
                {/* AWS Service Select */}
                <div className="cli-field-group">
                  <label htmlFor="cli-service-select" className="cli-label">
                    AWS Service <span className="cli-required">*</span>
                  </label>
                  <select
                    id="cli-service-select"
                    className="cli-select"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    disabled={isLoading}
                  >
                    {AWS_SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Diagnostic Goal Textarea */}
                <div className="cli-field-group">
                  <label htmlFor="cli-incident-input" className="cli-label">
                    Incident / Diagnostic Goal <span className="cli-required">*</span>
                  </label>
                  <textarea
                    id="cli-incident-input"
                    className="cli-textarea"
                    rows={4}
                    maxLength={5000}
                    placeholder="e.g., Lambda function is timing out after 30 seconds"
                    value={incident}
                    onChange={(e) => setIncident(e.target.value)}
                    disabled={isLoading}
                  />
                  <div className="cli-field-hint">
                    <span>Describe the symptoms, error codes, or what you need to verify.</span>
                    <span>{incident.length} / 5,000</span>
                  </div>
                </div>

                {/* Resource Name and Region Row */}
                <div className="cli-form-row">
                  <div className="cli-field-group">
                    <label htmlFor="cli-resource-input" className="cli-label">
                      Resource Name <span className="cli-optional">(optional)</span>
                    </label>
                    <input
                      id="cli-resource-input"
                      type="text"
                      className="cli-input"
                      placeholder="e.g., my-function"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="cli-field-note">
                      If omitted, standard uppercase placeholders (e.g. <code>FUNCTION_NAME</code>) are used.
                    </span>
                  </div>

                  <div className="cli-field-group">
                    <label htmlFor="cli-region-input" className="cli-label">
                      Region <span className="cli-optional">(optional)</span>
                    </label>
                    <input
                      id="cli-region-input"
                      type="text"
                      className="cli-input"
                      placeholder="ap-south-1"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      disabled={isLoading}
                    />
                    <span className="cli-field-note">Defaults to selected region: <code>ap-south-1</code></span>
                  </div>
                </div>

                {/* Error Banner */}
                {error ? (
                  <div className="cli-error-alert" role="alert">
                    <span className="material-symbols-outlined" style={{ color: 'var(--danger)' }}>error</span>
                    <span>{error}</span>
                  </div>
                ) : null}

                {/* Action Button */}
                <div className="cli-actions-bar">
                  <button
                    className="btn btn-lg btn-primary cli-submit-btn"
                    onClick={handleGenerate}
                    disabled={isLoading || !incident.trim()}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading-spin-sm"></span>
                        <span>Generating Diagnostic Commands...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">terminal</span>
                        <span>Generate Commands</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            {result ? (
              <div className="cli-results-container">
                {/* Results Header Toolbar */}
                <div className="cli-results-toolbar">
                  <div>
                    <h3 className="cli-results-heading">Generated Diagnostic Playbook</h3>
                    <p className="cli-results-subheading">
                      Service: <strong>{result.service || service}</strong> • Region: <strong>{region || 'ap-south-1'}</strong>
                    </p>
                  </div>

                  <div className="cli-results-buttons">
                    <button
                      className={`btn btn-sm ${copiedAll ? 'btn-success' : 'btn-secondary'}`}
                      onClick={handleCopyAll}
                      title="Copy all commands concatenated"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {copiedAll ? 'done' : 'content_copy'}
                      </span>
                      <span>{copiedAll ? 'All Copied!' : 'Copy All Commands'}</span>
                    </button>

                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={handleDownload}
                      title="Download commands as a .txt runbook"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                      <span>Download Commands</span>
                    </button>
                  </div>
                </div>

                {/* Safety Notice Banner */}
                <div className="cli-safety-banner" role="note">
                  <div className="cli-safety-icon" aria-hidden="true">
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <strong>Safety Notice:</strong> {result.safety_note || 'These commands are intended for read-only diagnostics. Review commands before running them in your AWS environment.'}
                  </div>
                </div>

                {/* Diagnostic Summary */}
                {result.summary ? (
                  <div className="analysis-card cli-summary-card">
                    <div className="analysis-card-header">
                      <div className="analysis-card-icon" aria-hidden="true">
                        <span className="material-symbols-outlined">lightbulb</span>
                      </div>
                      <div>
                        <h4 className="analysis-card-title">Diagnostic Strategy</h4>
                        <p className="analysis-card-subtitle">Investigation hypothesis and expected findings.</p>
                      </div>
                    </div>
                    <p className="cli-summary-text">{result.summary}</p>
                  </div>
                ) : null}

                {/* Commands List */}
                <div className="cli-commands-list">
                  <div className="cli-commands-list-header">
                    <h4 className="cli-commands-title">Recommended CLI Commands ({result.commands?.length || 0})</h4>
                    <span className="cli-readonly-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                      Read-Only
                    </span>
                  </div>

                  {result.commands && result.commands.length > 0 ? (
                    result.commands.map((cmdItem, idx) => {
                      const isCopied = copiedIndex === idx;
                      return (
                        <div key={idx} className="cli-command-card">
                          <div className="cli-command-top">
                            <div className="cli-command-badge-group">
                              <span className="cli-command-index">#{idx + 1}</span>
                              <span className="badge severity-badge severity-tag-low">
                                {cmdItem.risk || 'READ_ONLY'}
                              </span>
                            </div>
                            <button
                              className={`cli-copy-btn ${isCopied ? 'copied' : ''}`}
                              onClick={() => handleCopyCommand(cmdItem.command, idx)}
                              aria-label={`Copy command ${idx + 1}`}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                {isCopied ? 'check' : 'content_copy'}
                              </span>
                              <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>

                          {/* Monospace Code Box */}
                          <div className="cli-code-wrap">
                            <pre className="cli-code-block">
                              <code>{cmdItem.command}</code>
                            </pre>
                          </div>

                          {/* Explanations */}
                          <div className="cli-command-details">
                            {cmdItem.description ? (
                              <div className="cli-detail-row">
                                <span className="cli-detail-label">What it checks:</span>
                                <span className="cli-detail-text">{cmdItem.description}</span>
                              </div>
                            ) : null}

                            {cmdItem.purpose ? (
                              <div className="cli-detail-row">
                                <span className="cli-detail-label">Why it is useful:</span>
                                <span className="cli-detail-text">{cmdItem.purpose}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state-card">
                      <p className="empty-state-text">No commands generated.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
