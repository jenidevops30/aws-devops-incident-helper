import { useState, useEffect } from 'react';
import { getHistory } from '../utils/historyStorage';

export default function Navbar({ onNavigate, currentRoute = '/' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const updateCount = () => {
    setHistoryCount(getHistory().length);
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('incident_history_updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('incident_history_updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const handleNav = (e, route, sectionId = null) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(route, sectionId);
    }
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar-container">
        <button 
          className="navbar-brand" 
          onClick={(e) => handleNav(e, '/', 'top')}
          aria-label="AWS DevOps Incident Helper Home"
        >
          <img 
            src="/logo-icon.png" 
            alt="AWS DevOps Incident Helper" 
            className="navbar-logo-img"
          />
          <span className="navbar-title">AWS DevOps Incident Helper</span>
        </button>

        <nav className={`navbar-links ${mobileMenuOpen ? 'open' : ''}`} aria-label="Main Navigation">
          <button 
            className={`nav-link ${currentRoute === '/' ? 'active' : ''}`} 
            onClick={(e) => handleNav(e, '/', 'top')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentRoute === '/analyze' ? 'active' : ''}`} 
            onClick={(e) => handleNav(e, '/analyze')}
          >
            Analyzer
          </button>
          <button 
            className={`nav-link ${currentRoute === '/history' ? 'active' : ''}`} 
            onClick={(e) => handleNav(e, '/history')}
          >
            <span>History</span>
            {historyCount > 0 ? (
              <span className="navbar-history-badge">{historyCount}</span>
            ) : null}
          </button>
          <button 
            className={`nav-link ${currentRoute === '/cli-generator' ? 'active' : ''}`} 
            onClick={(e) => handleNav(e, '/cli-generator')}
          >
            CLI Generator
          </button>
        </nav>

        <div className="navbar-actions">
          <button 
            className="btn btn-primary navbar-cta-btn" 
            onClick={(e) => handleNav(e, '/analyze')}
            aria-label="Launch Incident Helper App"
          >
            Launch Analyzer →
          </button>
          <div className="navbar-avatar" title="AWS DevOps Engineer (Stateless)" aria-hidden="true">
            <span className="material-symbols-outlined">person</span>
          </div>
          <button 
            className="mobile-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
