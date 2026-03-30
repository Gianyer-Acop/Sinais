import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

const PHRASES = [
  "Sincronizando nossos corações...",
  "Preparando nosso cantinho seguro...",
  "Carregando todo o amor do mundo...",
  "Quase lá, vida... ✨",
  "Conectando almas, um segundo...",
  "Organizando os sentimentos...",
  "Cultivando nossa conexão...",
  "Sempre perto de você..."
];

export function LoadingScreen() {
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  }, []);

  return (
    <div className="loading-screen-premium">
      <div className="loading-content">
        <div className="heart-pulse-container">
          <img src="/nosso_mascote_final.png" alt="Carregando" style={{ width: '140px', height: '140px', objectFit: 'contain' }} />
        </div>
        <h1 className="loading-title">Nossos Sinais</h1>
        <p className="loading-phrase">{phrase}</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .loading-screen-premium {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: var(--bg-primary);
          background: linear-gradient(135deg, var(--bg-primary) 0%, #fff 100%);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
        }
        .loading-content { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20px; }
        
        .heart-pulse-container {
          color: var(--color-primary);
          animation: heartbeat 1.5s ease-in-out infinite;
          filter: drop-shadow(0 0 15px rgba(0,0,0,0.05));
        }
        
        .loading-title { 
          font-family: inherit; font-size: 1.8rem; font-weight: 900; 
          color: var(--text-primary); letter-spacing: -0.02em; 
        }
        
        .loading-phrase { 
          font-size: 0.95rem; font-weight: 700; color: var(--color-secondary);
          opacity: 0.8; animation: pulseFade 2s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0% { transform: scale(1); }
          15% { transform: scale(1.15); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          70% { transform: scale(1); }
        }

        @keyframes pulseFade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
