import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link as LinkIcon, Copy, Check, Info } from 'lucide-react';

export function ConnectionScreen({ userProfile, onComplete }) {
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!userProfile?.connection_code) return;
    try {
      const textToCopy = userProfile.connection_code.toString().trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        throw new Error("Clipboard API indesejada");
      }
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = userProfile.connection_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    const cleanCode = partnerCode.trim().toUpperCase();
    if (cleanCode.length !== 6) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log("Tentando vincular com código:", cleanCode);
      
      // 1. Buscar o perfil que tem esse código e NÃO é o próprio usuário
      const { data: partner, error: findError } = await supabase
        .from('profiles')
        .select('id, nickname, name')
        .eq('connection_code', cleanCode)
        .neq('id', userProfile?.id)
        .single();
      
      if (findError || !partner) {
        console.error("Erro ou parceiro não encontrado:", findError);
        throw new Error("Código não encontrado ou inválido.");
      }

      console.log("Parceiro localizado:", partner);

      // 2. Vincular ambos os perfis (Bidirecional)
      const { error: updateSelfError } = await supabase
        .from('profiles')
        .update({ partner_id: partner.id })
        .eq('id', userProfile.id);
      
      if (updateSelfError) throw updateSelfError;

      const { error: updatePartnerError } = await supabase
        .from('profiles')
        .update({ partner_id: userProfile.id })
        .eq('id', partner.id);
      
      if (updatePartnerError) throw updatePartnerError;

      alert(`Conectados com sucesso com ${partner.nickname || partner.name}! ❤️`);
      onComplete(); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connection-screen">
      <div className="connection-card">
        <div className="connection-header">
           <LinkIcon size={32} color="var(--color-primary)" />
           <h2>Seu Código de Acesso</h2>
           <p>Copie o código abaixo e envie para seu parceiro ou insira o dele para conectar.</p>
        </div>

        <div className="my-code-section">
           <label>Meu Código</label>
           <div className="code-display" onClick={handleCopy}>
              <span className="code-text">{userProfile?.connection_code || '------'}</span>
              {copied ? <Check size={18} color="#5e8c61" /> : <Copy size={18} />}
           </div>
           {copied && <span className="copy-hint">Código copiado!</span>}
        </div>

        <div className="divider">ou</div>

        <form onSubmit={handleConnect} className="partner-code-form">
           <label htmlFor="p-code">Código do Parceiro</label>
           <div className="input-group-modern">
               <input 
                 id="p-code"
                 type="text" 
                 maxLength="6" 
                 placeholder="Digite os 6 dígitos"
                 value={partnerCode}
                 onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                 required
               />
               <button type="submit" className="connect-submit-btn" disabled={loading || partnerCode.length !== 6}>
                  {loading ? '...' : 'Conectar'}
               </button>
           </div>
           {error && <p className="conn-error">{error}</p>}
        </form>

        <div className="connection-info">
           <Info size={16} />
           <p>Essa conexão é privada. Apenas você e seu parceiro poderão ver os sinais e mensagens um do outro.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .connection-screen {
          height: 100%; display: flex; align-items: center; justify-content: center;
          background-color: var(--bg-primary); padding: 20px; overflow-y: auto;
        }
        .connection-card {
           width: 100%; max-width: 360px; background: #fff; border-radius: 28px;
           padding: 30px 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); border: 1px solid var(--color-accent);
           text-align: center; display: flex; flex-direction: column; gap: 15px; margin: auto;
        }
        .connection-header h2 { font-size: 1.3rem; color: var(--text-primary); margin: 10px 0 5px; font-weight: 800; }
        .connection-header p { color: var(--color-secondary); font-size: 0.85rem; font-weight: 600; line-height: 1.4; }
        
        .my-code-section { margin-top: 10px; }
        .my-code-section label { display: block; font-size: 0.75rem; font-weight: 800; color: #52616a; margin-bottom: 8px; text-transform: uppercase; }
        .code-display {
           background: var(--bg-primary); border: 2px dashed var(--color-accent); border-radius: 16px;
           padding: 14px; display: flex; align-items: center; justify-content: center;
           gap: 12px; cursor: pointer; transition: all 0.2s;
        }
        .code-display:active { transform: scale(0.98); background: #eee; }
        .code-text { font-family: 'Courier New', monospace; font-size: 1.6rem; font-weight: 900; color: var(--text-primary); letter-spacing: 0.1em; }
        .copy-hint { font-size: 0.75rem; color: var(--color-primary); font-weight: 700; margin-top: 5px; display: block; }
        
        .divider { font-size: 0.75rem; font-weight: 900; color: var(--color-accent); display: flex; align-items: center; gap: 10px; margin: 5px 0; }
        .divider::before, .divider::after { content: ''; height: 1px; background: #e5e5d1; flex: 1; }
        
        .partner-code-form { text-align: left; }
        .partner-code-form label { display: block; font-size: 0.75rem; font-weight: 800; color: #52616a; margin-bottom: 8px; margin-left: 5px; text-transform: uppercase; }
        .input-group-modern { display: flex; gap: 8px; }
        .input-group-modern input {
           flex: 1; padding: 12px; border-radius: 12px; border: 2px solid var(--bg-primary);
           background: var(--bg-primary); font-size: 1rem; text-align: center; font-weight: 700;
           outline: none; transition: all 0.2s; min-width: 0;
        }
        .input-group-modern input:focus { border-color: var(--color-primary); background: #fff; }
        .connect-submit-btn {
           background: var(--color-primary); color: #fff; padding: 12px 16px; border-radius: 12px;
           font-weight: 800; font-size: 0.85rem; border: none; cursor: pointer; white-space: nowrap;
        }
        .connect-submit-btn:disabled { opacity: 0.5; }
        
        .conn-error { color: #b56576; font-size: 0.75rem; font-weight: 700; margin-top: 8px; text-align: center; }
        .connection-info {
           margin-top: 10px; padding: 12px; background: var(--bg-primary); border-radius: 14px;
           display: flex; align-items: center; gap: 10px; text-align: left;
        }
        .connection-info p { font-size: 0.75rem; color: var(--color-secondary); font-weight: 600; margin: 0; }
      `}} />
    </div>
  );
}
