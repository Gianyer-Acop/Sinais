import React, { useState, useEffect } from 'react';
import { Clock, Bell, User, MessageCircle } from 'lucide-react';

export function PartnerSummary({ partner, signals, onNudge }) {
  const [timeElapsed, setTimeElapsed] = useState('');
  const latestSignal = signals[0];

  useEffect(() => {
    if (!latestSignal) return;
    
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(latestSignal.timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      
      if (hours > 0) {
        setTimeElapsed(`${hours}h ${mins % 60}m`);
      } else {
        setTimeElapsed(`${mins} min`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [latestSignal]);

  return (
    <div className="partner-summary">
      <div className="summary-card">
         <div className="summary-header">
           <User size={32} color="var(--color-primary)" />
           <div>
             <h3>{partner.name} ({partner.nickname})</h3>
             <p className="doing-now">Fazendo agora: {partner.doing_now || '---'}</p>
           </div>
         </div>

         <div className="summary-stats">
           <div className="stat-item">
             <Clock size={16} />
             <span>Nesse estado há: <strong>{timeElapsed}</strong></span>
           </div>
           <button className="nudge-btn" onClick={onNudge}>
             <Bell size={16} /> Perguntar se está bem
           </button>
         </div>

         <div className="summary-timeline">
           <h4>Histórico Recente</h4>
           {signals.slice(0, 5).map((s, i) => (
             <div key={i} className="timeline-item">
               <span className="dot" style={{ backgroundColor: s.color }} />
               <span className="label">{s.label}</span>
               <span className="time">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
