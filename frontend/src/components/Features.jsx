export default function Features() {
  const features = [
    {
      icon: 'warning',
      title: 'Severity Assessment',
      desc: 'Instantly grade incident impact from low operational nuisance to critical sev-1 service outage.',
    },
    {
      icon: 'psychology',
      title: 'Likely Causes',
      desc: 'Pinpoint precise infrastructure misconfigurations, IAM permission gaps, or resource bottlenecks.',
    },
    {
      icon: 'checklist',
      title: 'Recommended Checks',
      desc: 'Step-by-step diagnostic procedures prioritized by statistical likelihood of resolution.',
    },
    {
      icon: 'build',
      title: 'Remediation Guidance',
      desc: 'Actionable advice to permanently fix issues and update Terraform, CDK, or IAM definitions.',
    },
    {
      icon: 'terminal',
      title: 'AWS CLI Commands',
      desc: 'Copy-ready AWS CLI commands with pre-filled parameters for immediate terminal execution.',
    },
    {
      icon: 'speed',
      title: 'Instant AI Diagnostics',
      desc: 'Sub-second automated incident triage powered by Amazon Bedrock Nova 2 Lite.',
    },
  ];

  return (
    <section className="section section-alt" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">CAPABILITIES</span>
          <h2 className="section-title">What You Get</h2>
          <p className="section-subtitle">
            Comprehensive diagnostics designed for high-velocity DevOps teams.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-box" aria-hidden="true">
                <span className="material-symbols-outlined feature-symbol">{feature.icon}</span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
