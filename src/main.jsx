import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// REGISTRO MANUAL E ROBUSTO DO SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('PWA: Service Worker registrado com sucesso!');
        // Forçar verificação de update no carregamento
        reg.update();
      })
      .catch(err => console.error('PWA: Falha ao registrar Service Worker:', err));
  });
}
