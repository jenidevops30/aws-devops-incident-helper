export default function Hero({ onLaunch }) {
  const githubUrl = import.meta.env.VITE_GITHUB_URL || '';

  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <img src="/logo-icon.png" alt="Logo" className="hero-eyebrow-logo" />
            <span>AI-POWERED AWS TROUBLESHOOTING</span>
          </div>

          <h1 className="hero-heading">
            AWS DevOps <br />
            <span className="hero-heading-highlight">Incident Helper</span>
          </h1>

          <div className="hero-subtitle">
            Understand and troubleshoot AWS incidents faster.
          </div>

          <p className="hero-description">
            Leveraging advanced generative AI to diagnose infrastructure errors, pinpoint root causes, and output precise remediation scripts in seconds.
          </p>

          <div className="hero-cta-group">
            <button 
              className="btn btn-lg hero-btn-primary"
              onClick={onLaunch}
              id="hero-launch-btn"
            >
              <span>✦ Launch Incident Helper</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>

            {githubUrl ? (
              <a 
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg hero-btn-secondary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>code</span>
                <span>GitHub</span>
              </a>
            ) : null}
          </div>

          <div className="hero-benefits">
            <div className="hero-benefit-item">
              <span className="material-symbols-outlined hero-benefit-icon">bolt</span>
              <span>Faster troubleshooting</span>
            </div>
            <div className="hero-benefit-item">
              <span className="material-symbols-outlined hero-benefit-icon">check_circle</span>
              <span>Built with AWS best practices</span>
            </div>
            <div className="hero-benefit-item">
              <span className="material-symbols-outlined hero-benefit-icon">group</span>
              <span>For DevOps & Cloud Engineers</span>
            </div>
          </div>
        </div>

        {/* Right side: Visual Product Preview Card matching Stitch */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-card">
            <div className="hero-visual-header">
              <div className="hero-visual-dots">
                <span className="hero-visual-dot red"></span>
                <span className="hero-visual-dot yellow"></span>
                <span className="hero-visual-dot green"></span>
              </div>
              <span className="hero-visual-badge">Incident Analysis v2.4</span>
            </div>

            <div className="hero-visual-body">
              <div className="hero-visual-input-box">
                <span className="hero-visual-input-label">INPUT LOG</span>
                <p className="hero-visual-input-text">Lambda function is timing out after 30 seconds</p>
              </div>

              <div className="hero-visual-results">
                <div className="hero-visual-severity-row">
                  <span className="hero-visual-severity-label">SEVERITY: HIGH</span>
                  <span className="hero-visual-confidence-badge">Confidence: 98%</span>
                </div>

                <div className="hero-visual-sections">
                  <div className="hero-visual-section-item">
                    <div className="hero-visual-section-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>psychology</span>
                      <span>Primary Root Cause</span>
                    </div>
                    <p className="hero-visual-section-desc">
                      API Gateway timeout limit (29s) reached before Lambda execution completed due to unoptimized database connection pooling.
                    </p>
                  </div>

                  <div className="hero-visual-section-item">
                    <div className="hero-visual-section-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--blue)' }}>terminal</span>
                      <span>Runbook Command:</span>
                    </div>
                    <div className="hero-visual-code">
                      aws lambda update-function-configuration --timeout 60
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
