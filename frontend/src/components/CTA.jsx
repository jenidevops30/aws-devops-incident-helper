export default function CTA({ onLaunch }) {
  return (
    <section className="cta-section">
      <div className="container cta-container">
        <div className="cta-ambient-glow" aria-hidden="true"></div>
        <h2 className="cta-title">Ready to troubleshoot your AWS incident?</h2>
        <p className="cta-desc">
          Cut mean time to resolution (MTTR) by up to 75% with automated AI diagnostics and instant remediation scripts.
        </p>
        <button 
          className="btn btn-lg hero-btn-primary cta-btn"
          onClick={onLaunch}
          id="cta-launch-btn"
        >
          <span>✦ Launch Incident Helper</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
