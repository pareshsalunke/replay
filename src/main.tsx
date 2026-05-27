import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global stylesheets — order matters: tokens first, then base, then keyframes.
import './styles/tokens.css';
import './styles/global.css';
import './styles/keyframes.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
