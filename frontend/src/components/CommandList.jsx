import { useState } from 'react';

export default function CommandList({ commands }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const commandList = Array.isArray(commands) ? commands : [];

  const handleCopySingle = async (command, index) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleCopyAll = async () => {
    if (commandList.length === 0) return;
    try {
      const allText = commandList.join('\n');
      await navigator.clipboard.writeText(allText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all commands:', err);
    }
  };

  if (commandList.length === 0) {
    return (
      <div className="card analysis-section-card">
        <h3 className="section-card-title">
          <span className="material-symbols-outlined section-card-icon">terminal</span>
          <span>AWS CLI Commands</span>
        </h3>
        <p className="empty-list-msg">No CLI commands generated for this incident.</p>
      </div>
    );
  }

  return (
    <div className="card analysis-section-card commands-terminal-card">
      <div className="commands-header">
        <div className="terminal-title-wrap">
          <div className="terminal-header-dots" aria-hidden="true">
            <span className="terminal-dot dot-red"></span>
            <span className="terminal-dot dot-yellow"></span>
            <span className="terminal-dot dot-green"></span>
          </div>
          <h3 className="section-card-title" style={{ margin: 0, fontSize: '16px' }}>
            <span className="material-symbols-outlined section-card-icon" style={{ fontSize: '20px' }}>terminal</span>
            <span>CLI Remediation Runbook</span>
          </h3>
        </div>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleCopyAll}
          aria-label="Copy all AWS CLI commands"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>
            {copiedAll ? 'done_all' : 'content_copy'}
          </span>
          {copiedAll ? 'All Copied!' : 'Copy All'}
        </button>
      </div>

      <div className="commands-list">
        {commandList.map((cmd, idx) => (
          <div key={idx} className="command-row">
            <span className="command-prompt" aria-hidden="true">$</span>
            <code className="command-code">{cmd}</code>
            <button
              className={`btn-copy ${copiedIndex === idx ? 'copied' : ''}`}
              onClick={() => handleCopySingle(cmd, idx)}
              aria-label={`Copy command: ${cmd}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>
                {copiedIndex === idx ? 'check' : 'content_copy'}
              </span>
              {copiedIndex === idx ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
