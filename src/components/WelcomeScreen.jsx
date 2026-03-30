import React, { useState } from 'react';
import { UserCheck, Heart, Sparkles } from 'lucide-react';

export function WelcomeScreen({ onComplete }) {
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    nickname: '',
    icon: '🦊'
  });

  const handleStart = (id) => {
    if (!profile.name || !profile.nickname) {
       alert("Por favor, preencha as informações para continuar.");
       return;
    }
    const finalProfile = { ...profile, id: id || `user_${Date.now()}` };
    onComplete(finalProfile);
  };

  return (
    <div className="welcome-screen-modern">
      <div className="welcome-container glass-effect">
        <div className="welcome-header">
          <div className="logo-badge">
             <Heart size={32} fill="#6366f1" color="#6366f1" />
          </div>
          <h1>Nossos Sinais</h1>
          <p>O espaço seguro para você e seu amor se comunicarem sem pressão.</p>
        </div>
        
        <div className="setup-card">
          <div className="input-group-modern">
             <label>Seu Nome</label>
             <input 
               type="text" 
               value={profile.name} 
               onChange={(e) => setProfile({...profile, name: e.target.value})}
               placeholder="Como você se chama?"
             />
          </div>
          <div className="input-group-modern">
             <label>Apelidos carinhosos</label>
             <input 
               type="text" 
               value={profile.nickname} 
               onChange={(e) => setProfile({...profile, nickname: e.target.value})}
               placeholder="Ex: Vida, Amor, Bebê..."
             />
          </div>
        </div>

        <div className="action-section">
           <p className="selection-label">Quem é você nesta conexão?</p>
           <div className="role-buttons">
              <button className="role-btn primary" onClick={() => handleStart('user1')}>
                <UserCheck size={20} />
                <span>Sou o Usuário 1</span>
              </button>
              <button className="role-btn secondary" onClick={() => handleStart('user2')}>
                <Sparkles size={20} />
                <span>Sou o Usuário 2</span>
              </button>
           </div>
           <p className="footer-hint">Cada um deve escolher um perfil diferente.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .welcome-screen-modern {
          min-height: 100vh; min-height: 100dvh;
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .welcome-container {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 36px;
          padding: 40px 24px;
          width: 100%; max-width: 420px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.05);
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .logo-badge {
          width: 64px; height: 64px; background: #fff; border-radius: 20px;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
        }
        .welcome-header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
        .welcome-header p { color: #64748b; font-size: 0.95rem; line-height: 1.5; margin-bottom: 30px; }
        .setup-card { text-align: left; background: #fff; padding: 24px; border-radius: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .input-group-modern { margin-bottom: 16px; }
        .input-group-modern:last-child { margin-bottom: 0; }
        .input-group-modern label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 6px; margin-left: 4px; }
        .input-group-modern input {
          width: 100%; padding: 14px 16px; border-radius: 16px; border: 2px solid #f1f5f9;
          background: #f8fafc; outline: none; transition: border-color 0.2s; font-size: 1rem;
        }
        .input-group-modern input:focus { border-color: #6366f1; background: #fff; }
        .selection-label { font-weight: 700; color: #64748b; font-size: 0.85rem; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
        .role-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .role-btn {
          padding: 16px; border-radius: 18px; border: none; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          transition: all 0.2s; font-weight: 700; font-size: 0.85rem;
        }
        .role-btn.primary { background: #6366f1; color: #fff; }
        .role-btn.secondary { background: #fff; color: #6366f1; border: 2px solid #e2e8f0; }
        .role-btn:active { transform: scale(0.95); }
        .footer-hint { margin-top: 20px; font-size: 0.8rem; color: #94a3b8; }
      `}} />
    </div>
  );
}
