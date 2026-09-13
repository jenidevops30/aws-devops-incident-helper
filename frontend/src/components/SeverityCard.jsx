export default function SeverityCard({ severity }) {
  const normalized = (severity || 'MEDIUM').toUpperCase();

  const config = {
    CRITICAL: {
      className: 'critical',
      icon: '🚨',
      desc: 'Critical production outage or severe security breach. Immediate intervention required.',
    },
    HIGH: {
      className: 'high',
      icon: '⚠️',
      desc: 'This issue may impact application availability or performance.',
    },
    MEDIUM: {
      className: 'medium',
      icon: '⚡',
      desc: 'Degraded operational capability or non-blocking infrastructure error.',
    },
    LOW: {
      className: 'low',
      icon: 'ℹ️',
      desc: 'Minor defect, informational notice, or optimization opportunity.',
    },
  };

  const current = config[normalized] || config.MEDIUM;

  return (
    <div className={`severity-card ${current.className}`} role="status">
      <div className="severity-info">
        <div className="severity-icon-badge" aria-hidden="true">
          {current.icon}
        </div>
        <div className="severity-label-group">
          <span className="severity-heading">Severity Level</span>
          <span className="severity-badge-text">{normalized}</span>
        </div>
      </div>
      <p className="severity-desc">{current.desc}</p>
    </div>
  );
}
