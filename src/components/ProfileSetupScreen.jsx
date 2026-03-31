import React, { useState } from 'react';
import { Check, Heart } from 'lucide-react';

const ICONS = ['🦊', '🐨', '🦦', '🦉', '🦄', '🦁', '🐼', '🐯', '🐸', '🐙', '🐰', '🐹'];

export function ProfileSetupScreen({ onSave, showModal }) {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    icon: '🦊'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showModal({ 
        title: 'Campo Obrigatório', 
        message: "Por favor, digite seu nome para que seu parceiro te identifique.", 
        type: 'info' 
      });
      return;
    }
    onSave(formData);
  };

  return (
    <div className="setup-screen-calm">
      <div className="setup-card-minimal">
        <header className="setup-header">
           <div className="setup-heart-icon">
              <Heart size={32} fill="var(--color-primary)" color="var(--color-primary)" />
           </div>
           <h2>Bem-vind@ ao seu Refúgio!</h2>
           <p>Vamos deixar seu perfil com a sua cara para seu parceiro te encontrar.</p>
        </header>

        <form onSubmit={handleSubmit} className="setup-form-minimal">
           <div className="avatar-preview-setup">
              <span className="icon-setup">{formData.icon}</span>
           </div>

           <div className="setup-input-group">
              <label>Como você se chama? (Nome)</label>
              <input 
                type="text" 
                placeholder="Ex: Maria, João..."
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
           </div>

           <div className="setup-input-group">
              <label>Como quer ser chamad@ aqui? (Apelido)</label>
              <input 
                type="text" 
                placeholder="Ex: Vida, Amor, Sol..."
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              />
           </div>

           <div className="setup-icon-picker">
              <label>Escolha seu ícone</label>
              <div className="icon-setup-grid">
                {ICONS.map(icon => (
                  <button 
                    key={icon} 
                    type="button"
                    className={`icon-setup-btn ${formData.icon === icon ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, icon})}
                  >
                    {icon}
                  </button>
                ))}
              </div>
           </div>

           <button type="submit" className="setup-continue-btn">
              <span>Continuar para Conectar</span>
              <Check size={20} />
           </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .setup-screen-calm {
          height: 100vh; display: flex; align-items: center; justify-content: center;
          background-color: var(--bg-primary); padding: 20px;
        }
        .setup-card-minimal {
           width: 100%; max-width: 400px; text-align: center;
           background: #fff; padding: 40px 24px; border-radius: 32px;
           box-shadow: 0 4px 12px rgba(0,0,0,0.02); border: 1px solid var(--color-accent); 
        }
        .setup-heart-icon { margin-bottom: 20px; opacity: 0.8; }
        .setup-header h2 { font-size: 1.5rem; color: var(--text-primary); font-weight: 800; margin-bottom: 8px; }
        .setup-header p { color: var(--color-secondary); font-size: 0.9rem; font-weight: 600; line-height: 1.5; margin-bottom: 30px; }
        
        .avatar-preview-setup {
           width: 90px; height: 90px; background: var(--bg-primary); border-radius: 28px;
           display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
           font-size: 3rem; border: 1px solid var(--color-accent); 
        }
        
        .setup-input-group { margin-bottom: 20px; text-align: left; }
        .setup-input-group label { display: block; font-size: 0.8rem; font-weight: 800; color: #52616a; margin-bottom: 8px; margin-left: 5px; text-transform: uppercase; }
        .setup-input-group input {
           width: 100%; padding: 14px; border-radius: 12px; border: 2px solid var(--bg-primary);
           background: var(--bg-primary); font-size: 1rem; font-weight: 700; color: var(--text-primary); outline: none; transition: all 0.2s;
        }
        .setup-input-group input:focus { border-color: var(--color-primary); background: #fff; }
        
        .setup-icon-picker { text-align: left; margin-bottom: 30px; }
        .setup-icon-picker label { display: block; font-size: 0.8rem; font-weight: 800; color: #52616a; margin-bottom: 12px; margin-left: 5px; text-transform: uppercase; }
        .icon-setup-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .icon-setup-btn {
           height: 50px; border-radius: 12px; border: 2px solid var(--bg-primary);
           background: var(--bg-primary); font-size: 1.4rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .icon-setup-btn.active { border-color: var(--color-primary); background: #fff; transform: scale(1.05); }
        
        .setup-continue-btn {
           width: 100%; padding: 18px; border-radius: 16px; border: none;
           background: var(--color-primary); color: #fff; font-weight: 800; font-size: 1rem;
           display: flex; align-items: center; justify-content: center; gap: 10px;
           cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .setup-continue-btn:active { transform: scale(0.98); }
      `}} />
    </div>
  );
}
