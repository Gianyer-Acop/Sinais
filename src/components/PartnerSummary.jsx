import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, Bell, Activity, History, Heart, Copy, Check, Link as LinkIcon, Info, UserPlus, X } from 'lucide-react';
import { sendRemoteNotification } from '../lib/notifications';

// ─── Modo SEM parceiro: vínculo ─────────────────────────────────────────────
function ConnectionPanel({ userProfile, onComplete, showModal, refreshCounter }) {
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  // Buscar se alguém solicitou conexão com este usuário
  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, nickname, icon, partner_id')
        .eq('partner_id', userProfile.id)
        .neq('id', userProfile.id);
      
      if (data && data.length > 0) {
        setPendingRequest(data[0]);
      } else {
        setPendingRequest(null);
      }
    };

    fetchPending();

    // ESCUTA REALTIME LOCAL: Se alguém mudar o perfil e me marcar como parceiro
    const channel = supabase.channel(`pending-conn-${userProfile.id}`)
      .on('postgres_changes', { 
        event: '*', 
        table: 'profiles', 
        filter: `partner_id=eq.${userProfile.id}` 
      }, (p) => {
        console.log("Mudança de vínculo detectada no Realtime:", p);
        fetchPending();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile, refreshCounter]);

  const handleCopy = () => {
    const code = userProfile?.connection_code?.toString().trim();
    if (!code) return;
    
    const finishCopy = () => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(finishCopy).catch(() => {
        fallbackCopyTextToClipboard(code);
        finishCopy();
      });
    } else {
      fallbackCopyTextToClipboard(code);
      finishCopy();
    }
  };

  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  }

  const handleConnect = async (e, forcedPartnerId = null) => {
    if (e) e.preventDefault();
    const targetId = forcedPartnerId;
    const cleanCode = partnerCode.trim().toUpperCase();

    setLoading(true);
    setError(null);

    try {
      let partnerToLink = null;

      if (targetId) {
        // Aceitando um pedido existente
        const { data } = await supabase.from('profiles').select('id, name, nickname').eq('id', targetId).single();
        partnerToLink = data;
      } else {
        // Iniciando um novo pedido via código
        if (cleanCode.length !== 6) throw new Error('Código inválido.');
        const { data, error: findError } = await supabase
          .from('profiles')
          .select('id, nickname, name')
          .eq('connection_code', cleanCode)
          .neq('id', userProfile?.id)
          .single();
        if (findError || !data) throw new Error('Código não encontrado.');
        partnerToLink = data;
      }

      // PASSO 1: Vincular apenas O MEU perfil ao parceiro
      await supabase.from('profiles').update({ partner_id: partnerToLink.id }).eq('id', userProfile.id);

      // PASSO 2: Enviar Notificação Remota
      await sendRemoteNotification(
        supabase, 
        partnerToLink.id, 
        userProfile.id, 
        "Novo Pedido de Vínculo! 🦦", 
        `${userProfile.nickname || userProfile.name} quer se conectar com você no Nossos Sinais.`,
        'connection_request'
      );

      showModal({ 
        title: 'Pedido Enviado! ✨', 
        message: `Solicitação enviada para ${partnerToLink.nickname || partnerToLink.name}. Agora seu amor só precisa aceitar ou inserir seu código também!`, 
        type: 'info' 
      });
      
      onComplete(); // Recarrega perfil no App.jsx
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="partner-summary-calm">
      <div className="connection-hero">
        <div className="connection-hero-icon">🦦</div>
        <h3>Vincule seu amor</h3>
        <p>Compartilhe seu código ou insira o do seu parceiro para começarem a se conectar.</p>
      </div>

      {pendingRequest && (
        <div className="pending-request-card">
          <div className="pending-request-icon">
            <UserPlus size={24} color="var(--color-primary)" />
          </div>
          <div className="pending-request-info">
             <h4>Pedido de Vínculo!</h4>
             <p><strong>{pendingRequest.nickname || pendingRequest.name}</strong> quer se conectar com você.</p>
          </div>
          <div className="pending-actions">
             <button className="accept-btn" onClick={() => handleConnect(null, pendingRequest.id)} disabled={loading}>
                {loading ? '...' : 'Aceitar'}
             </button>
          </div>
        </div>
      )}

      {!pendingRequest && (
        <>
          <div className="conn-section">
            <div className="conn-label">Meu Código</div>
            <div className="code-display-panel" id="tour-connection-code" onClick={handleCopy}>
              <span className="code-text-panel">{userProfile?.connection_code || '------'}</span>
              {copied ? <Check size={18} color="#5e8c61" /> : <Copy size={18} color="#888" />}
            </div>
            {copied && <span className="copy-hint-panel">Copiado! ✓</span>}
          </div>

          <div className="conn-divider">ou insira o código do seu amor</div>

          <form onSubmit={(e) => handleConnect(e)} className="conn-form">
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
        </>
      )}

      <div className="conn-info">
        <Info size={14} />
        <span>A conexão é privada. Só vocês dois terão acesso aos sinais e mensagens.</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .connection-hero { text-align: center; padding: 20px 0 10px; }
        .connection-hero-icon { font-size: 3.5rem; margin-bottom: 12px; }
        .connection-hero h3 { font-size: 1.4rem; font-weight: 900; color: var(--text-primary); margin-bottom: 6px; }
        .connection-hero p { font-size: 0.9rem; color: var(--color-secondary); font-weight: 600; line-height: 1.5; }

        .pending-request-card {
           background: #fff; border: 2px solid var(--color-primary); border-radius: 24px;
           padding: 20px; display: flex; align-items: center; gap: 15px;
           box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 10px;
           animation: slideUp 0.4s ease-out;
        }
        .pending-request-icon { width: 50px; height: 50px; background: var(--bg-primary); border-radius: 15px; display: flex; align-items: center; justify-content: center; }
        .pending-request-info { flex: 1; }
        .pending-request-info h4 { font-size: 0.9rem; font-weight: 900; color: var(--text-primary); margin-bottom: 2px; }
        .pending-request-info p { font-size: 0.8rem; color: var(--color-secondary); font-weight: 600; line-height: 1.4; }
        .pending-actions { display: flex; gap: 8px; }
        .accept-btn { background: var(--color-primary); color: #fff; border: none; padding: 10px 18px; border-radius: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; }
        
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
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

// ─── Modo COM parceiro: resumo ───────────────────────────────────────────────
export function PartnerSummary({ partner, signals, onNudge, userProfile, onComplete, showModal, refreshCounter }) {
  const [activeView, setActiveView] = useState('summary');
  const [isSending, setIsSending] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('');

  React.useEffect(() => {
    const latestSignal = signals ? signals[0] : null;
    if (!latestSignal) {
      setTimeElapsed('');
      return;
    }
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

  // VERIFICAR SE O PARCEIRO TAMBÉM NOS TEM VINCULADO
  // Se eu aponte para ele, mas ele NÃO aponte para mim (ou para outra pessoa), a conexão é esperada
  if (!partner || partner.partner_id !== userProfile.id) {
    if (partner && partner.partner_id !== userProfile.id) {
        // Estado de "Aguardando confirmação"
        return (
            <div className="partner-summary-calm">
                <div className="connection-hero">
                    <div className="connection-hero-icon-pulse">⏳</div>
                    <h3>Tudo pronto do seu lado! ✨</h3>
                    <p>Agora falta apenas <strong>{partner.nickname || partner.name}</strong> aceitar o seu pedido ou inserir o seu código para vocês se conectarem.</p>
                </div>
                
                <div className="conn-status-card">
                  <div className="status-dot-pulse"></div>
                  <span>Aguardando o seu amor...</span>
                </div>

                <button className="verify-conn-btn" onClick={() => onComplete()}>
                   <Activity size={18} />
                   <span>Verificar Conexão Agora</span>
                </button>

                <div className="conn-info-box">
                    <Info size={16} />
                    <span>Dica: Seu amor pode encontrar o seu pedido na aba "Vida" do app dele(a). Assim que ele(a) aceitar, esta tela atualizará sozinha!</span>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .partner-summary-calm { display: flex; flex-direction: column; gap: 24px; animation: fadeIn 0.4s ease-out; text-align: center; padding: 10px; }
                    .connection-hero h3 { font-size: 1.4rem; font-weight: 900; color: var(--text-primary); margin-bottom: 8px; }
                    .connection-hero p { font-size: 0.9rem; color: var(--color-secondary); font-weight: 600; line-height: 1.5; padding: 0 10px; }
                    .connection-hero-icon-pulse { font-size: 4rem; margin-bottom: 10px; animation: heartbeat 2s infinite; }
                    
                    .conn-status-card { 
                      background: #fff; border: 1px solid var(--color-accent); border-radius: 16px; 
                      padding: 12px; display: flex; align-items: center; justify-content: center; gap: 10px;
                      font-size: 0.85rem; font-weight: 700; color: var(--color-secondary);
                    }
                    .status-dot-pulse { width: 8px; height: 8px; background: #eab308; border-radius: 50%; animation: pulse-yellow 1.5s infinite; }
                    
                    .verify-conn-btn { 
                      width: 100%; padding: 18px; border-radius: 20px; border: none; 
                      background: var(--color-primary); color: #fff; font-weight: 800; cursor: pointer;
                      display: flex; align-items: center; justify-content: center; gap: 10px;
                      box-shadow: 0 4px 12px rgba(82, 121, 111, 0.2); transition: all 0.2s;
                    }
                    .verify-conn-btn:active { transform: scale(0.98); }
                    
                    .conn-info-box { 
                      display: flex; align-items: flex-start; gap: 10px; padding: 16px; 
                      background: var(--bg-primary); border-radius: 18px; text-align: left; 
                      color: var(--color-secondary); font-size: 0.8rem; line-height: 1.4;
                    }
                    .conn-info-box svg { flex-shrink: 0; color: var(--color-primary); }

                    @keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                    @keyframes pulse-yellow { 0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(234, 179, 8, 0); } 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0); } }
                `}} />
            </div>
        );
    }
    return <ConnectionPanel userProfile={userProfile} onComplete={onComplete} showModal={showModal} refreshCounter={refreshCounter} />;
  }

  const latestSignal = (signals && signals.length > 0) ? signals[0] : null;

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
