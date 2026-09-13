import { useState } from 'react';
import IncidentInput from '../components/IncidentInput';
import IncidentAnalysis from '../components/IncidentAnalysis';
import Footer from '../components/Footer';

export default function AnalyzerPage({ incidentText, onIncidentTextChange, onNavigate }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleAnalyze = async (textToAnalyze) => {
    const text = textToAnalyze || incidentText;
    if (!text || !text.trim()) return;

    setIsLoading(true);
    setError(false);

    const API_URL = import.meta.env.VITE_API_URL || 'https://8s5f4an7kb.execute-api.ap-south-1.amazonaws.com';

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      let data = await response.json();

      // Robust handling for Lambda proxy wrapper if present
      if (data && typeof data.body === 'string') {
        try {
          data = JSON.parse(data.body);
        } catch (parseErr) {
          console.warn('Unable to parse nested JSON body:', parseErr);
        }
      }

      // Check if data is valid analysis object
      if (data && (data.severity || data.summary || data.likely_causes)) {
        setAnalysis(data);
      } else {
        throw new Error('Malformed response received from analysis service');
      }
    } catch (err) {
      console.error('Incident analysis request failed:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="analyzer-page">
      <header className="analyzer-header" role="banner">
        <div className="container">
          <div className="analyzer-header-top">
            <div className="analyzer-breadcrumbs">
              <button 
                className="back-link" 
                onClick={() => onNavigate('/')}
                aria-label="Back to Landing Page"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Home
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Incident Analyzer</span>
            </div>

            <div className="analyzer-header-badge">
              <span className="status-pulse-dot"></span>
              <span>AI Model: Amazon Nova Lite (AWS Bedrock)</span>
            </div>
          </div>

          <div className="analyzer-brand-heading">
            <img src="/logo-icon.png" alt="AWS DevOps Incident Helper" className="analyzer-logo-img" />
            <h1 className="analyzer-title">AWS DevOps Incident Helper</h1>
          </div>
          <p className="analyzer-subtitle">
            Understand and troubleshoot AWS incidents faster with intelligent AI analysis.
          </p>
        </div>
      </header>

      <main className="analyzer-main">
        <div className="container">
          <IncidentInput
            value={incidentText}
            onChange={onIncidentTextChange}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          <IncidentAnalysis
            analysis={analysis}
            isLoading={isLoading}
            error={error}
            onRetry={() => handleAnalyze(incidentText)}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
