import { useState } from 'react';

export default function Navbar({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('/', targetId);
    }
  };

  const handleLaunchClick = () => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('/analyze');
    }
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar-container">
        <button 
          className="navbar-brand" 
          onClick={(e) => handleLinkClick(e, 'top')}
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
          <button className="nav-link" onClick={(e) => handleLinkClick(e, 'top')}>Home</button>
          <button className="nav-link" onClick={(e) => handleLinkClick(e, 'how-it-works')}>How It Works</button>
          <button className="nav-link" onClick={(e) => handleLinkClick(e, 'features')}>Features</button>
          <button className="nav-link" onClick={(e) => handleLinkClick(e, 'architecture')}>Architecture</button>
          <button className="nav-link" onClick={(e) => handleLinkClick(e, 'examples')}>Examples</button>
        </nav>

        <div className="navbar-actions">
          <button 
            className="btn btn-primary navbar-cta-btn" 
            onClick={handleLaunchClick}
            aria-label="Launch Incident Helper App"
          >
            Launch Incident Helper →
          </button>
          <div className="navbar-avatar" title="AWS DevOps Engineer" aria-hidden="true">
            <span className="material-symbols-outlined">person</span>
          </div>
          <button 
            className="mobile-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
