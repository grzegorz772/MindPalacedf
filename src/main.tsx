import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Rejestracja Service Workera dla pełnego PWA (automatyczne instalowanie przez przeglądarkę)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('Service Worker zarejestrowany pomyślnie:', reg.scope);
      })
      .catch((err) => {
        console.warn('Rejestracja Service Workera nie powiodła się:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

