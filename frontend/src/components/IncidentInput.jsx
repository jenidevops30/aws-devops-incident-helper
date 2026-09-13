import { useState } from 'react';

const EXAMPLES = [
  {
    icon: 'bolt',
    label: 'Lambda Timeout',
    text: 'Lambda function is timing out after 30 seconds when connecting to RDS Postgres database in VPC private subnet',
  },
  {
    icon: 'api',
    label: 'API Gateway 502',
    text: 'API Gateway returns 502 Bad Gateway with message: Internal server error on POST /checkout',
  },
  {
    icon: 'lock',
    label: 'S3 Access Denied',
    text: 'AccessDeniedException: 403 Forbidden when calling PutObject on s3://production-reports-bucket/daily.csv',
  },
  {
    icon: 'dns',
    label: 'EC2 Unreachable',
    text: 'My EC2 instance in us-east-1 is unreachable over SSH (port 22) after updating security group rules',
  },
];

const MAX_CHARS = 10000;

export default function IncidentInput({ value, onChange, onAnalyze, isLoading }) {
  const [validationError, setValidationError] = useState('');

  const handleTextChange = (e) => {
    const text = e.target.value;
    onChange(text);
    if (validationError && text.trim().length > 0 && text.length <= MAX_CHARS) {
      setValidationError('');
    }
  };

  const handleSelectPreset = (text) => {
    onChange(text);
    setValidationError('');
  };

  const handleClear = () => {
    onChange('');
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setValidationError('Please describe your AWS incident before analyzing.');
      return;
    }

    if (value.length > MAX_CHARS) {
      setValidationError(`Incident description cannot exceed ${MAX_CHARS.toLocaleString()} characters.`);
      return;
    }

    setValidationError('');
    onAnalyze(trimmed);
  };

  const isNearLimit = value.length > MAX_CHARS * 0.9 && value.length <= MAX_CHARS;
  const isOverLimit = value.length > MAX_CHARS;

  return (
    <div className="card input-card">
      <div className="input-card-header">
        <h2 className="input-card-title">
          <span className="material-symbols-outlined input-card-icon">terminal</span>
          Describe your incident
        </h2>
        <p className="input-card-desc">
          Enter details about the AWS issue you're facing. The AI will analyze it and provide troubleshooting guidance.
        </p>
      </div>

      <div className="example-chips-group">
        <span className="example-chips-label">Quick examples:</span>
        {EXAMPLES.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => handleSelectPreset(item.text)}
            disabled={isLoading}
          >
            <span className="material-symbols-outlined chip-icon">{item.icon}</span>
            <span>[{item.label}]</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="textarea-wrap">
          <textarea
            className="incident-textarea"
            placeholder="Example: Lambda function is timing out after 30 seconds when connecting to RDS Postgres database in VPC private subnet..."
            value={value}
            onChange={handleTextChange}
            disabled={isLoading}
            rows={5}
            aria-label="Incident Description"
            maxLength={MAX_CHARS + 500}
          />
          <div className={`char-counter ${isOverLimit ? 'limit-reached' : isNearLimit ? 'limit-near' : ''}`}>
            {value.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </div>
        </div>

        {validationError && (
          <div className="input-validation-wrap">
            <span className="input-validation-msg" role="alert">
              ⚠️ {validationError}
            </span>
          </div>
        )}

        <div className="input-card-bottom">
          <div className="input-privacy-note">
            <span className="material-symbols-outlined">lock_reset</span>
            <span>Logs are encrypted and never stored permanently.</span>
          </div>

          <div className="input-actions">
            {value && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || isOverLimit}
              id="analyze-submit-btn"
            >
              {isLoading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0 }}></span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>auto_awesome</span>
                  <span>✦ Analyze Incident</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
