import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './runbook.css';
import './investigation.css';
import './awsDiagnostics.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
