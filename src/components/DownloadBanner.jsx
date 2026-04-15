import React from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { isNativePlatform } from '../lib/notifications';

export function DownloadBanner() {
  const [visible, setVisible] = React.useState(true);
  
  // Detectar se é Android e se NÃO está rodando como APK nativo
  const isAndroid = /Android/i.test(navigator.userAgent);
  const shouldShow = isAndroid && !isNativePlatform() && visible;

  if (!shouldShow) return null;

  return (
    <div className="download-banner-container">
      <div className="download-banner-content">
        <div className="download-info">
          <div className="app-icon-mini">
            <Smartphone size={20} />
          </div>
          <div className="download-text">
            <strong>Experiência Completa 🚀</strong>
            <span>Instale o App para vibração e alertas reais!</span>
          </div>
        </div>
        <div className="download-actions">
          <a href="/nossasinais.apk" download className="download-btn-action">
            <Download size={16} />
            <span>Baixar APK</span>
          </a>
          <button className="close-banner" onClick={() => setVisible(false)}>
            <X size={18} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .download-banner-container {
          position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;
          padding: 10px; animation: slideDown 0.4s ease-out;
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
        .download-banner-content {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(132, 169, 140, 0.3);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex; align-items: center; justify-content: space-between;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          max-width: 500px; margin: 0 auto;
        }
        .download-info { display: flex; align-items: center; gap: 12px; }
        .app-icon-mini { 
          background: var(--color-primary); color: white; 
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .download-text { display: flex; flex-direction: column; }
        .download-text strong { font-size: 0.85rem; color: var(--text-primary); font-weight: 800; }
        .download-text span { font-size: 0.75rem; color: var(--color-secondary); font-weight: 600; }
        
        .download-actions { display: flex; align-items: center; gap: 8px; }
        .download-btn-action {
          background: var(--color-primary); color: white; padding: 8px 14px;
          border-radius: 10px; font-weight: 700; font-size: 0.8rem;
          display: flex; align-items: center; gap: 6px; text-decoration: none;
          transition: transform 0.2s;
        }
        .download-btn-action:active { transform: scale(0.95); }
        .close-banner {
          background: none; border: none; color: var(--color-secondary);
          padding: 4px; cursor: pointer; opacity: 0.6;
        }
      `}} />
    </div>
  );
}
