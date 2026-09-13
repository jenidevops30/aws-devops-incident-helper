import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AnalyzerPage from './pages/AnalyzerPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/analyze') return '/analyze';
      if (path === '/history') return '/history';
      return '/';
    }
    return '/';
  });

  const [incidentText, setIncidentText] = useState('');

  // Synchronize route with browser history (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/analyze') setCurrentRoute('/analyze');
      else if (path === '/history') setCurrentRoute('/history');
      else setCurrentRoute('/');
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
      ) : currentRoute === '/history' ? (
        <HistoryPage
          onNavigate={navigate}
        />
      ) : (
        <LandingPage
          onNavigate={navigate}
          onSelectExample={handleSelectExample}
          currentRoute={currentRoute}
        />
      )}
    </div>
  );
}
