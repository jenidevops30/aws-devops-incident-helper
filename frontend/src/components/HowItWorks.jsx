export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Describe Your Incident',
      desc: 'Paste raw CloudWatch logs, error stack traces, or simply type out the observed failure in plain English.',
      tag: 'Input Validation',
    },
    {
      number: '02',
      title: 'AI Analyzes the Issue',
      desc: 'Amazon Bedrock Nova 2 Lite correlates logs against vast AWS infrastructure patterns to isolate root anomalies.',
      tag: 'Amazon Bedrock',
    },
    {
      number: '03',
      title: 'Get Actionable Guidance',
      desc: 'Receive ranked causes, verification steps, deep remediation guides, and ready-to-run AWS CLI scripts.',
      tag: 'Instant Remediation',
    },
  ];

  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">PROCESS ARCHITECTURE</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            From incident to resolution in three simple steps
          </p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="step-card">
              <div className="step-number-watermark">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <div className="step-action-tag">
                <span>{step.tag}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
