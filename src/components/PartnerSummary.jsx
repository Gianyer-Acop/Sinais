import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, Bell, Activity, History, Heart, Copy, Check, Link as LinkIcon, Info } from 'lucide-react';

// ─── Modo SEM parceiro: vínculo ─────────────────────────────────────────────
function ConnectionPanel({ userProfile, onComplete }) {
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = userProfile?.connection_code?.toString().trim();
    if (!code) return;
    try {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      });
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el); el.select(); document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    const cleanCode = partnerCode.trim().toUpperCase();
    if (cleanCode.length !== 6) return;

    setLoading(true);
    setError(null);
    try {
      const { data: partner, error: findError } = await supabase
        .from('profiles')
        .select('id, nickname, name')
        .eq('connection_code', cleanCode)
        .neq('id', userProfile?.id)
        .single();

      if (findError || !partner) throw new Error('Código não encontrado ou inválido.');

      await supabase.from('profiles').update({ partner_id: partner.id }).eq('id', userProfile.id);
      await supabase.from('profiles').update({ partner_id: userProfile.id }).eq('id', partner.id);

      alert(`Conectados com ${partner.nickname || partner.name}! ❤️`);
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partner-summary-calm">
      {/* Hero vazio */}
      <div className="connection-hero">
        <div className="connection-hero-icon">🦦</div>
        <h3>Vincule seu amor</h3>
        <p>Compartilhe seu código ou insira o do seu parceiro para começarem a se conectar.</p>
      </div>

      {/* Meu código */}
      <div className="conn-section">
        <div className="conn-label">Meu Código</div>
        <div className="code-display-panel" id="tour-connection-code" onClick={handleCopy}>
          <span className="code-text-panel">{userProfile?.connection_code || '------'}</span>
          {copied ? <Check size={18} color="#5e8c61" /> : <Copy size={18} color="#888" />}
        </div>
        {copied && <span className="copy-hint-panel">Copiado! ✓</span>}
      </div>

      {/* Divider */}
      <div className="conn-divider">ou insira o código do seu amor</div>

      {/* Formulário */}
      <form onSubmit={handleConnect} className="conn-form">
        <div className="conn-input-row">
          <input
            type="text"
            maxLength={6}
            placeholder="Código de 6 dígitos"
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
            className="conn-input"
            required
          />
          <button
            type="submit"
            className="conn-submit"
            disabled={loading || partnerCode.length !== 6}
          >
            {loading ? '...' : <LinkIcon size={18} />}
          </button>
        </div>
        {error && <p className="conn-error">{error}</p>}
      </form>

      {/* Info */}
      <div className="conn-info">
        <Info size={14} />
        <span>A conexão é privada. Só vocês dois terão acesso aos sinais e mensagens.</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .connection-hero { text-align: center; padding: 20px 0 10px; }
        .connection-hero-icon { font-size: 3.5rem; margin-bottom: 12px; }
        .connection-hero h3 { font-size: 1.4rem; font-weight: 900; color: var(--text-primary); margin-bottom: 6px; }
        .connection-hero p { font-size: 0.9rem; color: var(--color-secondary); font-weight: 600; line-height: 1.5; }

        .conn-section { display: flex; flex-direction: column; gap: 8px; }
        .conn-label { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #888; padding-left: 4px; }

        .code-display-panel {
          background: #fff; border: 2px dashed var(--color-accent); border-radius: 20px;
          padding: 18px; display: flex; align-items: center; justify-content: center;
          gap: 12px; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .code-display-panel:active { transform: scale(0.98); }
        .code-text-panel {
          font-family: 'Courier New', monospace; font-size: 2rem; font-weight: 900;
          color: var(--text-primary); letter-spacing: 0.15em;
        }
        .copy-hint-panel { font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-align: center; }

        .conn-divider {
          display: flex; align-items: center; gap: 10px;
          font-size: 0.75rem; font-weight: 800; color: #aaa;
        }
        .conn-divider::before, .conn-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--color-accent);
        }

        .conn-form { display: flex; flex-direction: column; gap: 8px; }
        .conn-input-row { display: flex; gap: 10px; }
        .conn-input {
          flex: 1; padding: 16px; border-radius: 16px; border: 2px solid var(--color-accent);
          background: #fff; font-size: 1.1rem; font-weight: 800; text-align: center;
          letter-spacing: 0.12em; color: var(--text-primary); outline: none;
          transition: border-color 0.2s;
        }
        .conn-input:focus { border-color: var(--color-primary); }
        .conn-submit {
          width: 56px; min-width: 56px; border-radius: 16px; border: none;
          background: var(--color-primary); color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.85rem; transition: all 0.2s;
        }
        .conn-submit:disabled { opacity: 0.4; }
        .conn-error { font-size: 0.8rem; color: #b56576; font-weight: 700; text-align: center; }

        .conn-info {
          display: flex; align-items: flex-start; gap: 8px; padding: 14px 16px;
          background: var(--bg-primary); border-radius: 16px;
          font-size: 0.78rem; color: var(--color-secondary); font-weight: 600; line-height: 1.5;
        }
        .conn-info svg { flex-shrink: 0; margin-top: 2px; }
      `}} />
    </div>
  );
}

// ─── Modo COM parceiro: resumo ───────────────────────────────────────────────
export function PartnerSummary({ partner, signals, onNudge, userProfile, onComplete }) {
  const [timeElapsed, setTimeElapsed] = useState('');
  const [isSending, setIsSending] = useState(false);

  React.useEffect(() => {
    const latestSignal = signals[0];
    if (!latestSignal) return;
    const calculateTime = () => {
      const diff = Date.now() - new Date(latestSignal.timestamp).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      setTimeElapsed(hours > 0 ? `${hours}h ${mins % 60}m` : `${mins} min`);
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [signals[0]]);

  const handleNudgeClick = async () => {
    setIsSending(true);
    await onNudge();
    setTimeout(() => setIsSending(false), 2000);
  };

  // ─── Sem parceiro: mostrar painel de conexão ───────────────────────────────
  if (!partner) {
    return (
      <ConnectionPanel
        userProfile={userProfile}
        onComplete={onComplete}
      />
    );
  }

  // ─── Com parceiro: mostrar resumo ──────────────────────────────────────────
  const latestSignal = signals[0];

  return (
    <div className="partner-summary-calm">
      <div className="profile-hero-calm">
        <div className="avatar-large-calm">{partner.icon || '🐨'}</div>
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
          {latestSignal?.label || 'Sem sinal hoje'}
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
            signals.filter(s => s.user_id === partner.id).slice(0, 4).map((s, i) => (
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
        
        .profile-hero-calm { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 0; }
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
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .nudge-btn-calm.sent { background: var(--color-secondary); transform: scale(1.02); }
        .nudge-btn-calm:active { transform: scale(0.95); }
        
        .history-tray-calm { background: var(--bg-primary); padding: 24px; border-radius: 28px; border: 1px dashed var(--color-accent); }
        .tray-header { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.75rem; color: var(--color-secondary); text-transform: uppercase; margin-bottom: 20px; }
        .tray-items { display: flex; flex-direction: column; gap: 12px; }
        .tray-row { display: flex; align-items: center; gap: 12px; background: #fff; padding: 14px 18px; border-radius: 16px; border: 1px solid var(--color-accent); }
        .tray-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .tray-label { flex: 1; font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
        .tray-time { font-size: 0.8rem; color: var(--color-secondary); font-weight: 700; }
        
        .no-data-msg { text-align: center; color: var(--color-secondary); font-weight: 600; padding: 10px; font-size: 0.9rem; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
