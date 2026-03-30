import React from 'react';
import { 
  Smile, Heart, Zap, MessageSquare, AlertCircle, 
  Moon, Sun, Coffee, Home, Ghost, 
  Bell, Cloud, Umbrella, Anchor, Wind, 
  Music, Camera, Gift, Star, ThumbsUp, MessageSquareOff
} from 'lucide-react';

const ICON_MAP = {
  Smile: <Smile size={24} />,
  Heart: <Heart size={24} />,
  Zap: <Zap size={24} />,
  MessageSquare: <MessageSquare size={24} />,
  MessageSquareOff: <MessageSquareOff size={24} />,
  AlertCircle: <AlertCircle size={24} />,
  Moon: <Moon size={24} />,
  Sun: <Sun size={24} />,
  Coffee: <Coffee size={24} />,
  Home: <Home size={24} />,
  Ghost: <Ghost size={24} />,
  Bell: <Bell size={24} />,
  Cloud: <Cloud size={24} />,
  Umbrella: <Umbrella size={24} />,
  Anchor: <Anchor size={24} />,
  Wind: <Wind size={24} />,
  Music: <Music size={24} />,
  Camera: <Camera size={24} />,
  Gift: <Gift size={24} />,
  Star: <Star size={24} />,
  ThumbsUp: <ThumbsUp size={24} />
};

export function SignalGrid({ activeSignal, signalTypes, onSelect }) {
  // Se não houver tipos carregados ainda, mostrar nada ou placeholders
  if (!signalTypes || signalTypes.length === 0) {
    return <div className="loading-signals-calm">Preparando seus sinais...</div>;
  }

  return (
    <div className="signal-grid-container">
      <p className="grid-title">Como você está agora?</p>
      <div className="signal-grid">
        {signalTypes.map((signal) => (
          <button
            key={signal.id}
            className={`sign-btn ${activeSignal === signal.id ? 'active' : ''}`}
            onClick={() => onSelect(signal.id)}
          >
            <div className="btn-icon" style={{ backgroundColor: signal.color + '25', color: signal.color }}>
              {ICON_MAP[signal.icon_name] || <Smile size={24} />}
            </div>
            <span className="btn-label">{signal.label}</span>
          </button>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .signal-grid-container { margin-top: 10px; }
        .grid-title { font-weight: 700; color: var(--color-secondary); font-size: 0.85rem; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; padding-left: 4px; }
        .signal-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding-bottom: 20px; }
        .sign-btn {
          background: #fff; border: 2px solid transparent; border-radius: 24px;
          padding: 24px 16px; display: flex; flex-direction: column; align-items: center;
          gap: 12px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02); border: 1px solid var(--color-accent);
        }
        .sign-btn:active { transform: scale(0.95); }
        .sign-btn.active { border-color: var(--color-primary); background: var(--bg-primary); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        
        /* O último botão ocupa a largura toda se for ímpar */
        .sign-btn:last-child:nth-child(odd) { grid-column: span 2; }
        
        .btn-icon { width: 52px; height: 52px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
        .btn-label { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }
        .loading-signals-calm { padding: 40px; text-align: center; opacity: 0.5; font-weight: 700; }
      `}} />
    </div>
  );
}
