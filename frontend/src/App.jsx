import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AnalyzerPage from './pages/AnalyzerPage';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/analyze' ? '/analyze' : '/';
    }
    return '/';
  });

  const [incidentText, setIncidentText] = useState('');

  // Synchronize route with browser history (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname === '/analyze' ? '/analyze' : '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route, targetSection) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);

    if (route === '/' && targetSection) {
      setTimeout(() => {
        if (targetSection === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(targetSection);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectExample = (text) => {
    setIncidentText(text);
    navigate('/analyze');
  };

  return (
    <div className="app-root">
      {currentRoute === '/analyze' ? (
        <AnalyzerPage
          incidentText={incidentText}
          onIncidentTextChange={setIncidentText}
          onNavigate={navigate}
        />
      ) : (
        <LandingPage
          onNavigate={navigate}
          onSelectExample={handleSelectExample}
        />
      )}
    </div>
  );
}
