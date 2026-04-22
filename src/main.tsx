import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { AppProvider } from './context';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {/* ignore */});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
