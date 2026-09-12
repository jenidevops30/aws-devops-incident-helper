import { useState } from 'react'
import './App.css'

const API_ENDPOINT = 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com/analyze';

const EXAMPLE_INCIDENTS = [
  'Lambda function is timing out after 30 seconds',
  'API Gateway returns 502 Bad Gateway',
  'AccessDeniedException when uploading an object to S3',
  'EC2 instance is unreachable',
  'ECS task keeps stopping',
  'Application Load Balancer target is unhealthy'
];

function App() {
  const [incident, setIncident] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!incident.trim()) {
      setError('Please enter an incident description');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ incident: incident.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setIncident(example);
    setError(null);
    setResult(null);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const renderSection = (title, items, icon) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="result-section">
        <h3>{icon} {title}</h3>
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AWS DevOps Incident Helper</h1>
        <p className="subtitle">Understand and troubleshoot AWS incidents faster.</p>
      </header>

      <main className="main">
        <section className="input-section">
          <h2>Enter Incident</h2>
          <textarea
            className="incident-input"
            placeholder="Paste your error, log output, or incident description here..."
            value={incident}
            onChange={(e) => setIncident(e.target.value)}
            rows={6}
            disabled={loading}
          />
          
          <div className="examples">
            <span>Examples:</span>
            <div className="example-buttons">
              {EXAMPLE_INCIDENTS.map((ex, idx) => (
                <button
                  key={idx}
                  className="example-btn"
                  onClick={() => handleExampleClick(ex)}
                  disabled={loading}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading || !incident.trim()}
          >
            {loading ? 'Analyzing...' : 'Analyze Incident'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </section>

        {result && (
          <section className="result-section-container">
            <h2>Incident Analysis</h2>
            <div className="severity-badge" style={{ backgroundColor: getSeverityColor(result.severity) }}>
              Severity: {result.severity}
            </div>

            {renderSection('Summary', [result.summary], '📋')}
            {renderSection('Likely Causes', result.likely_causes, '🔍')}
            {renderSection('Recommended Checks', result.recommended_checks, '✅')}
            {renderSection('Troubleshooting Steps', result.troubleshooting_steps, '🛠️')}
            {renderSection('Remediation', result.remediation, '🔧')}
            {renderSection('AWS CLI Commands', result.aws_commands, '💻')}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Powered by Amazon Bedrock (Nova Lite) • AWS Lambda • API Gateway • Amplify</p>
      </footer>
    </div>
  );
}

export default App;
