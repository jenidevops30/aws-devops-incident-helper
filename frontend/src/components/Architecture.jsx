export default function Architecture() {
  const architectureNodes = [
    {
      icon: 'web',
      title: 'React Frontend',
      desc: 'AWS Amplify',
      badge: 'Client Tier',
    },
    {
      icon: 'api',
      title: 'API Gateway',
      desc: 'HTTP API',
      badge: 'API Gateway',
    },
    {
      icon: 'data_object',
      title: 'AWS Lambda',
      desc: 'Python 3.12 Runtime',
      badge: 'Compute Engine',
    },
    {
      icon: 'psychology',
      title: 'Amazon Bedrock',
      desc: 'Nova 2 Lite Foundation Model',
      badge: 'Generative AI',
    },
  ];

  const highlights = [
    'Sub-second cold starts',
    'IAM role least privilege',
    'Encrypted payload streams',
    'Auto-scaling on demand',
    'Zero servers to maintain',
  ];

  return (
    <section className="section" id="architecture">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">SYSTEM DESIGN</span>
          <h2 className="section-title">Built with AWS</h2>
          <p className="section-subtitle">
            Serverless, highly scalable, and secure cloud architecture.
          </p>
        </div>

        <div className="arch-grid">
          <div className="arch-flow-card">
            <div className="arch-topology-header">DATA FLOW TOPOLOGY</div>
            <div className="arch-steps-chain">
              {architectureNodes.map((node, idx) => (
                <div key={idx} className="arch-node-wrapper">
                  <div className="arch-node">
                    <div className="arch-node-icon-box">
                      <span className="material-symbols-outlined">{node.icon}</span>
                    </div>
                    <div className="arch-node-info">
                      <h4>{node.title}</h4>
                      <p>{node.desc}</p>
                    </div>
                    <span className="arch-node-badge">{node.badge}</span>
                  </div>
                  {idx < architectureNodes.length - 1 && (
                    <div className="arch-chain-arrow" aria-hidden="true">
                      <span className="material-symbols-outlined">east</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="arch-side-card">
            <span className="arch-side-badge">SERVERLESS ADVANTAGE</span>
            <h3>Zero Infrastructure Management</h3>
            <p className="arch-side-desc">
              Built entirely on AWS serverless primitives, ensuring automatic scaling during peak incident hours, pay-per-request pricing, and enterprise-grade security compliance.
            </p>
            <ul className="arch-check-list">
              {highlights.map((item, idx) => (
                <li key={idx} className="arch-check-item">
                  <span className="material-symbols-outlined arch-check-icon">check</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
