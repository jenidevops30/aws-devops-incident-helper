export default function ExampleIncidents({ onSelectExample }) {
  const examples = [
    {
      sev: 'SEV-1',
      sevType: 'error',
      tag: 'Serverless',
      title: 'Lambda Timeout',
      text: 'Lambda function is timing out after 30 seconds when connecting to RDS Postgres database in VPC private subnet',
      shortDesc: 'Function execution exceeding 30s limit when connecting to database in VPC.',
    },
    {
      sev: 'SEV-1',
      sevType: 'error',
      tag: 'API Gateway',
      title: 'API Gateway 502',
      text: 'API Gateway returns 502 Bad Gateway with message: Internal server error on POST /checkout',
      shortDesc: 'Internal server error returned when proxying requests to VPC integration backend.',
    },
    {
      sev: 'SEV-3',
      sevType: 'warning',
      tag: 'Storage & IAM',
      title: 'S3 Access Denied',
      text: 'AccessDeniedException: 403 Forbidden when calling PutObject on s3://production-reports-bucket/daily.csv',
      shortDesc: 'GetObject or PutObject failing with 403 Forbidden on customer bucket objects.',
    },
    {
      sev: 'SEV-1',
      sevType: 'error',
      tag: 'Compute & Networking',
      title: 'EC2 Unreachable',
      text: 'My EC2 instance in us-east-1 is unreachable over SSH (port 22) after updating security group rules',
      shortDesc: 'SSH connection timed out on public subnet instance after security group update.',
    },
  ];

  return (
    <section className="section section-alt" id="examples">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">QUICK START SCENARIOS</span>
          <h2 className="section-title">Try These Example Incidents</h2>
          <p className="section-subtitle">
            Click an incident to auto-populate the report and run instant troubleshooting.
          </p>
        </div>

        <div className="examples-grid">
          {examples.map((example, idx) => (
            <button 
              key={idx} 
              className="example-card"
              onClick={() => onSelectExample(example.text)}
              aria-label={`Test example incident: ${example.title}`}
            >
              <div className="example-card-top">
                <span className={`example-sev-badge ${example.sevType}`}>{example.sev}</span>
                <span className="material-symbols-outlined example-arrow">arrow_forward</span>
              </div>
              <h3 className="example-card-title">{example.title}</h3>
              <p className="example-card-desc">{example.shortDesc}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
