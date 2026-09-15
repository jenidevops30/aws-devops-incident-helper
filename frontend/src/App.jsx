import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AnalyzerPage from './pages/AnalyzerPage';
import HistoryPage from './pages/HistoryPage';
import CliGeneratorPage from './pages/CliGeneratorPage';
import RunbookGeneratorPage from './pages/RunbookGeneratorPage';
import InvestigationWorkspacePage from './pages/InvestigationWorkspacePage';
import AwsDiagnosticsPage from './pages/AwsDiagnosticsPage';

export default function App() {
  const routeFromPath = () => {
    const path = window.location.pathname;
    if (path === '/analyze') return '/analyze';
    if (path === '/history') return '/history';
    if (path === '/cli-generator') return '/cli-generator';
    if (path === '/runbook-generator') return '/runbook-generator';
    if (path === '/investigation') return '/investigation';
    if (path === '/aws-diagnostics') return '/aws-diagnostics';
    return '/';
  };
  const [currentRoute, setCurrentRoute] = useState(() => typeof window !== 'undefined' ? routeFromPath() : '/');
  const [incidentText, setIncidentText] = useState('');
  const [cliInitialState, setCliInitialState] = useState(null);
  const [runbookInitialState, setRunbookInitialState] = useState(null);

  useEffect(() => {
    const handlePopState = () => setCurrentRoute(routeFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route, targetSection, extraState = null) => {
    if (extraState) {
      if (route === '/cli-generator') setCliInitialState(extraState);
      if (route === '/runbook-generator') setRunbookInitialState(extraState);
    }
    if (window.location.pathname !== route) window.history.pushState({}, '', route);
    setCurrentRoute(route);
    if (route === '/' && targetSection) setTimeout(() => targetSection === 'top' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : document.getElementById(targetSection)?.scrollIntoView({ behavior: 'smooth' }), 60);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleSelectExample = (text) => { setIncidentText(text); navigate('/analyze'); };

  return <div className="app-root">
    {currentRoute === '/analyze' ? <AnalyzerPage incidentText={incidentText} onIncidentTextChange={setIncidentText} onNavigate={navigate} />
      : currentRoute === '/history' ? <HistoryPage onNavigate={navigate} />
      : currentRoute === '/cli-generator' ? <CliGeneratorPage onNavigate={navigate} initialFormState={cliInitialState} />
      : currentRoute === '/runbook-generator' ? <RunbookGeneratorPage onNavigate={navigate} initialFormState={runbookInitialState} />
      : currentRoute === '/investigation' ? <InvestigationWorkspacePage onNavigate={navigate} />
      : currentRoute === '/aws-diagnostics' ? <AwsDiagnosticsPage onNavigate={navigate} />
      : <LandingPage onNavigate={navigate} onSelectExample={handleSelectExample} currentRoute={currentRoute} />}
  </div>;
}
