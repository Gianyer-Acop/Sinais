import React from 'react';
import { Smile, Zap, Heart, MessageSquareOff, AlertCircle } from 'lucide-react';

const SIGNALS = [
  { id: 'ok', label: 'Estou bem', icon: <Smile />, color: 'var(--color-safe)' },
  { id: 'overwhelmed', label: 'Sobrecarga', icon: <Zap />, color: 'var(--color-primary)' },
  { id: 'hug', label: 'Abraço', icon: <Heart />, color: 'var(--color-safe)' },
  { id: 'non-verbal', label: 'Não-verbal', icon: <MessageSquareOff />, color: 'var(--color-secondary)' },
  { id: 'crisis', label: 'Crise Aguda', icon: <AlertCircle />, color: 'var(--color-primary-dark)' },
];

export function SignalGrid({ activeSignal, onSendSignal }) {
  return (
    <div className="signal-grid">
      {SIGNALS.map((signal) => (
        <button
          key={signal.id}
          className={`sign-btn ${activeSignal === signal.id ? 'active' : ''}`}
          onClick={() => onSendSignal(signal.id)}
          aria-label={`Sinalizar ${signal.label}`}
        >
          <div className="btn-icon" style={{ color: signal.color }}>
            {signal.icon}
          </div>
          <span className="btn-label">{signal.label}</span>
        </button>
      ))}
    </div>
  );
}
