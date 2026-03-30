import React, { useState, useEffect } from 'react';
import { Clock, Bell, Activity, History, Heart } from 'lucide-react';

export function PartnerSummary({ partner, signals, onNudge }) {
  const [timeElapsed, setTimeElapsed] = useState('');
  const [isSending, setIsSending] = useState(false);
  const latestSignal = signals[0];

  useEffect(() => {
    if (!latestSignal) return;
    
    const calculateTime = () => {
      const diff = Date.now() - new Date(latestSignal.timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      
      if (hours > 0) {
        setTimeElapsed(`${hours}h ${mins % 60}m`);
      } else {
        setTimeElapsed(`${mins} min`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [latestSignal]);

  const handleNudgeClick = async () => {
    setIsSending(true);
    await onNudge();
    setTimeout(() => setIsSending(false), 2000);
  };

  if (!partner) return <div className="no-partner-summary-calm">Carregando dados do amor...</div>;

  return (
    <div className="partner-summary-calm">
      <div className="profile-hero-calm">
        <div className="avatar-large-calm">
           {partner.icon || '🐨'}
        </div>
        <div className="hero-text-calm">
           <h3>{partner.nickname || partner.name}</h3>
           <p>{partner.name}</p>
        </div>
      </div>

      <div className="status-focus-calm">
        <div className="focus-header">
           <Activity size={16} color="#52796f" />
           <span>Estado Atual</span>
        </div>
        <div className="focus-value" style={{ color: latestSignal?.color || '#334148' }}>
           {latestSignal?.label || 'Sem sinal'}
        </div>
        {latestSignal && (
          <div className="focus-time">
             <Clock size={14} />
             <span>Há {timeElapsed}</span>
          </div>
        )}
      </div>

      <button 
        className={`nudge-btn-calm ${isSending ? 'sent' : ''}`} 
        onClick={handleNudgeClick}
        disabled={isSending}
      >
        {isSending ? <Heart size={20} fill="#fff" /> : <Bell size={20} />}
        <span>{isSending ? 'Carinho Enviado!' : 'Enviar um Carinho'}</span>
      </button>

      <div className="history-tray-calm">
        <div className="tray-header">
           <History size={16} />
           <span>Histórico Recente</span>
        </div>
        <div className="tray-items">
           {signals.length === 0 ? (
             <p className="no-data-msg">Ainda não há sinais hoje.</p>
           ) : (
             signals.slice(0, 4).map((s, i) => (
               <div key={i} className="tray-row">
                  <div className="tray-dot" style={{ backgroundColor: s.color }} />
                  <span className="tray-label">{s.label}</span>
                  <span className="tray-time">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
             ))
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .partner-summary-calm { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.4s ease-out; }
        
        .profile-hero-calm { 
          display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 0;
        }
        .avatar-large-calm { 
          width: 100px; height: 100px; background: #fff; border-radius: 35px; border: 1px solid var(--color-accent);
          display: flex; align-items: center; justify-content: center; font-size: 3.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }
        .hero-text-calm { text-align: center; }
        .hero-text-calm h3 { font-size: 1.6rem; color: var(--text-primary); font-weight: 800; margin-bottom: 4px; }
        .hero-text-calm p { font-size: 0.95rem; color: var(--color-secondary); font-weight: 600; }
        
        .status-focus-calm { 
          background: #fff; padding: 24px; border-radius: 28px; border: 1px solid var(--color-accent);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }
        .focus-header { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.8rem; color: var(--color-secondary); text-transform: uppercase; }
        .focus-value { font-size: 2.2rem; font-weight: 900; letter-spacing: -0.03em; }
        .focus-time { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--color-secondary); font-weight: 700; }
        
        .nudge-btn-calm {
          width: 100%; padding: 22px; border-radius: 20px; border: none;
          background: var(--color-primary); color: #fff; font-weight: 800; font-size: 1rem;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        .nudge-btn-calm.sent { background: var(--color-secondary); transform: scale(1.02); }
        .nudge-btn-calm:active { transform: scale(0.95); }
        
        .history-tray-calm { 
          background: var(--bg-primary); padding: 24px; border-radius: 28px; border: 1px dashed var(--color-accent);
        }
        .tray-header { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.75rem; color: var(--color-secondary); text-transform: uppercase; margin-bottom: 20px; }
        .tray-items { display: flex; flex-direction: column; gap: 12px; }
        .tray-row { display: flex; align-items: center; gap: 12px; background: #fff; padding: 14px 18px; border-radius: 16px; border: 1px solid var(--color-accent); }
        .tray-dot { width: 10px; height: 10px; border-radius: 50%; }
        .tray-label { flex: 1; font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
        .tray-time { font-size: 0.8rem; color: var(--color-secondary); font-weight: 700; }
        
        .no-data-msg { text-align: center; color: var(--color-secondary); font-weight: 600; padding: 10px; font-size: 0.9rem; }
        .no-partner-summary-calm { text-align: center; padding: 40px; color: var(--color-secondary); font-weight: 700; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
