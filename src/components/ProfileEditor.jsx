import React, { useState, useEffect } from 'react';
import { Save, Camera, Check, Shield, Lock, LayoutGrid, Bell, Settings as SettingsIcon } from 'lucide-react';
import { SignalManager } from './SignalManager';
import { requestNotificationPermission } from '../lib/notifications';

const ICONS = ['🦊', '🐨', '🦦', '🦉', '🦄', '🦁', '🐼', '🐯', '🐸', '🐙', '🐰', '🐹'];

export function ProfileEditor({ 
  profile, 
  onSave, 
  signalTypes, 
  onAddSignal, 
  onUpdateSignal, 
  onDeleteSignal,
  onRestoreSignals,
  onDeleteAccount
}) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    nickname: profile?.nickname || '',
    icon: profile?.icon || '🦊',
    theme_preference: profile?.theme_preference || 'sage'
  });

  const [lockEnabled, setLockEnabled] = useState(localStorage.getItem('app_lock_enabled') === 'true');
  const [appPin, setAppPin] = useState(localStorage.getItem('app_pin') || '1234');
  const [showSignalManager, setShowSignalManager] = useState(false);

  useEffect(() => {
    if (profile && profile.id) {
      setFormData({
        name: profile.name || '',
        nickname: profile.nickname || '',
        icon: profile.icon || '🦊',
        theme_preference: profile.theme_preference || 'sage'
      });
    }
  }, [profile?.id, profile?.theme_preference]);

  const handleThemeChange = (newTheme) => {
    setFormData({...formData, theme_preference: newTheme});
    document.body.className = `theme-${newTheme}`;
    localStorage.setItem('app_theme', newTheme);
  };

  const handleRequestPermission = () => {
    requestNotificationPermission().then(permission => {
      if (permission === 'granted') {
        alert("Ótimo! Notificações ativadas com sucesso. 🎉");
      } else if (permission === 'denied') {
        alert("As notificações foram bloqueadas. Você precisará permitir nas configurações do seu navegador.");
      } else {
        alert("Não foi possível ativar as notificações neste dispositivo.");
      }
    }).catch(err => {
      console.error(err);
      alert("Erro ao tentar ativar notificações.");
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('app_lock_enabled', lockEnabled.toString());
    localStorage.setItem('app_pin', appPin);
    onSave(formData);
    alert("Preferências atualizadas! ❤️");
  };

  if (showSignalManager) {
    return (
      <SignalManager 
        signalTypes={signalTypes}
        onAdd={onAddSignal}
        onSave={onUpdateSignal}
        onDelete={onDeleteSignal}
        onRestore={onRestoreSignals}
        onClose={() => setShowSignalManager(false)}
      />
    );
  }

  return (
    <div className="profile-editor-container">
      <div className="profile-header-card-calm">
        <div className="avatar-display-box">
          {formData.icon}
        </div>
        <h2>{formData.nickname || 'Seu Perfil'}</h2>
        <p>Personalize sua experiência</p>
      </div>

      <form className="profile-form-calm" onSubmit={handleSubmit}>
        <div className="section-title-calm">
           <Camera size={18} /> <span>Escolha seu Ícone</span>
        </div>
        <div className="icon-grid-calm">
          {ICONS.map(i => (
            <button 
              key={i}
              type="button"
              className={`icon-circle-calm ${formData.icon === i ? 'active' : ''}`}
              onClick={() => setFormData({...formData, icon: i})}
            >
              {i}
            </button>
          ))}
        </div>

        <div className="section-title-calm">
           <LayoutGrid size={18} /> <span>Personalização de Sinais</span>
        </div>
        <div className="manage-signals-card" onClick={() => setShowSignalManager(true)}>
           <div className="manage-icon">✨</div>
           <div className="manage-text">
              <strong>Personalizar Botões de Sinais</strong>
              <p>Adicione ou edite seus próprios sentimentos e emojis.</p>
           </div>
        </div>

        <div className="section-title-calm">
           <SettingsIcon size={18} /> <span>Dados Básicos</span>
        </div>
        <div className="input-group-calm">
          <label>Como você se chama?</label>
          <input 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Seu nome"
          />
        </div>
        <div className="input-group-calm">
          <label>Apelido carinhoso</label>
          <input 
            value={formData.nickname} 
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
            placeholder="Ex: Amor, Vida, Baby"
          />
        </div>

        <div className="section-title-calm">
           <Check size={18} /> <span>Cores do Tema</span>
        </div>
        <div className="theme-circles-calm">
          {['sage', 'blue', 'brown', 'yellow'].map(t => (
            <button 
              key={t}
              type="button"
              className={`theme-circle-calm ${t} ${formData.theme_preference === t ? 'active' : ''}`}
              onClick={() => handleThemeChange(t)}
              title={t}
            />
          ))}
        </div>

        <div className="section-title-calm" style={{ marginTop: '30px' }}>
           <Lock size={18} /> <span>Privacidade & Bloqueio</span>
        </div>
        <div className="lock-control-calm">
           <div className="lock-text">
              <strong>PIN de Acesso</strong>
              <p>Pedir senha ao abrir o app</p>
           </div>
           <label className="switch-calm">
              <input 
                type="checkbox" 
                checked={lockEnabled} 
                onChange={(e) => setLockEnabled(e.target.checked)} 
              />
              <span className="slider-calm"></span>
           </label>
        </div>

        {lockEnabled && (
          <div className="input-group-calm" style={{ marginTop: '10px' }}>
             <label>Definir PIN (4 dígitos)</label>
             <input 
               type="password" 
               maxLength="4"
               inputMode="numeric"
               value={appPin}
               onChange={(e) => setAppPin(e.target.value.replace(/\D/g, ''))}
               placeholder="1234"
               style={{ letterSpacing: '0.5em', textAlign: 'center' }}
             />
          </div>
        )}

        <div className="section-title-calm" style={{ marginTop: '30px' }}>
           <Shield size={18} /> <span>Vínculo com o Sistema</span>
        </div>

        <div className="system-links-calm">
           <button type="button" className="sys-btn-calm" onClick={handleRequestPermission}>
             <Bell size={16} /> Ativar Notificações no Dispositivo
           </button>
           <p className="sys-hint-calm">Ative para receber avisos do seu parceiro mesmo com o app fechado.</p>
        </div>

        <button type="submit" className="save-btn-calm">
          <Check size={20} />
          <span>Salvar Alterações</span>
        </button>

        <div className="danger-zone-calm">
          <div className="danger-content">
            <Shield size={20} color="#ff6b6b" />
            <div className="danger-text">
              <strong>Zona de Perigo</strong>
              <p>A exclusão da conta é permanente e apagará todos os seus sinais e mensagens.</p>
            </div>
          </div>
          <button 
            type="button" 
            className="delete-account-btn"
            onClick={onDeleteAccount}
          >
            Excluir Minha Conta
          </button>
        </div>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-editor-container { animation: fadeIn 0.4s ease-out; padding-bottom: 40px; }
        
        .profile-header-card-calm {
          background: var(--color-primary); padding: 40px 20px; border-radius: 28px;
          color: #fff; text-align: center; margin-bottom: -20px;
        }
        .avatar-display-box {
          width: 90px; height: 90px; background: #fff; border-radius: 24px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px; font-size: 3rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .profile-header-card-calm h2 { font-weight: 800; font-size: 1.5rem; margin-bottom: 4px; }
        .profile-header-card-calm p { opacity: 0.8; font-size: 0.9rem; font-weight: 600; }

        .profile-form-calm { background: #fff; border-radius: 32px; padding: 40px 24px; position: relative; z-index: 10; display: flex; flex-direction: column; gap: 20px; }
        .section-title-calm { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 5px; }
        
        .icon-grid-calm { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 10px; }
        .icon-circle-calm { 
          aspect-ratio: 1; border: 2px solid transparent; border-radius: 12px; background: var(--bg-primary);
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem; cursor: pointer; transition: all 0.2s;
        }
        .icon-circle-calm.active { border-color: var(--color-primary); background: #fff; transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

        .manage-signals-card { 
          background: var(--bg-primary); padding: 18px; border-radius: 20px; border: 1px solid var(--color-accent);
          display: flex; align-items: center; gap: 15px; cursor: pointer; transition: all 0.2s;
        }
        .manage-signals-card:active { transform: scale(0.98); }
        .manage-icon { width: 44px; height: 44px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        .manage-text strong { display: block; font-size: 0.95rem; color: var(--text-primary); }
        .manage-text p { font-size: 0.75rem; color: #888; font-weight: 600; margin-top: 2px; }

        .input-group-calm { display: flex; flex-direction: column; gap: 8px; }
        .input-group-calm label { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); padding-left: 4px; }
        .input-group-calm input { padding: 14px 18px; border-radius: 16px; border: 1px solid var(--color-accent); background: var(--bg-primary); font-size: 1rem; color: var(--text-primary); outline: none; }
        
        .theme-circles-calm { display: flex; gap: 15px; padding: 10px 0; }
        .theme-circle-calm { width: 42px; height: 42px; border-radius: 50%; border: 4px solid #fff; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.1); transition: all 0.2s; }
        .theme-circle-calm.active { transform: scale(1.15); border-color: var(--text-primary); }
        .theme-circle-calm.sage { background: #84a98c; }
        .theme-circle-calm.blue { background: #6d9dc5; }
        .theme-circle-calm.brown { background: #d6ba73; }
        .theme-circle-calm.yellow { background: #e9c46a; }

        .lock-control-calm { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
        .lock-text strong { display: block; font-size: 0.95rem; color: var(--text-primary); }
        .lock-text p { font-size: 0.8rem; color: #888; font-weight: 600; }
        
        .switch-calm { position: relative; display: inline-block; width: 50px; height: 26px; }
        .switch-calm input { opacity: 0; width: 0; height: 0; }
        .slider-calm { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #eee; border-radius: 34px; transition: .4s; }
        .slider-calm:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .4s; }
        input:checked + .slider-calm { background-color: var(--color-primary); }
        input:checked + .slider-calm:before { transform: translateX(24px); }

        .system-links-calm { padding: 15px; background: var(--bg-primary); border-radius: 18px; border: 1px solid var(--color-accent); }
        .sys-btn-calm { width: 100%; padding: 14px; border-radius: 12px; border: none; background: #fff; color: var(--color-primary); font-weight: 800; font-size: 0.9rem; cursor: pointer; border: 1px solid var(--color-accent); display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }
        .sys-hint-calm { font-size: 0.75rem; color: #888; font-weight: 600; text-align: center; }

        .save-btn-calm { 
          margin-top: 20px; padding: 18px; border-radius: 20px; border: none;
          background: var(--color-primary); color: #fff; font-weight: 800; font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;
        }

        .danger-zone-calm { 
          margin-top: 40px; padding: 20px; border-radius: 24px; border: 1px dashed #ff6b6b;
          background: rgba(255, 107, 107, 0.05); display: flex; flex-direction: column; gap: 15px;
        }
        .danger-content { display: flex; gap: 15px; align-items: flex-start; }
        .danger-text strong { display: block; font-size: 0.95rem; color: #ff6b6b; }
        .danger-text p { font-size: 0.8rem; color: #888; font-weight: 600; line-height: 1.4; }
        .delete-account-btn { 
          padding: 14px; border-radius: 14px; border: 1px solid #ff6b6b; background: #fff;
          color: #ff6b6b; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: 0.2s;
        }
        .delete-account-btn:hover { background: #ff6b6b; color: #fff; }
      `}} />
    </div>
  );
}
