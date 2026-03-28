import React, { useState } from 'react';
import { UserCheck, Edit3 } from 'lucide-react';

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
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1>Boas-vindas ao Nossos Sinais</h1>
        <p>Vamos configurar seu perfil privado.</p>
        
        <div className="setup-form">
          <div className="input-field">
             <label>Seu Nome</label>
             <input 
               type="text" 
               value={profile.name} 
               onChange={(e) => setProfile({...profile, name: e.target.value})}
               placeholder="Ex: Ana"
             />
          </div>
          <div className="input-field">
             <label>Como quer ser chamad@? (Apelido)</label>
             <input 
               type="text" 
               value={profile.nickname} 
               onChange={(e) => setProfile({...profile, nickname: e.target.value})}
               placeholder="Ex: Amor, Vida..."
             />
          </div>
        </div>

        <div className="role-selector">
           <button className="start-btn" onClick={() => handleStart('user1')}>
             <UserCheck size={20} /> Começar como Usuário 1
           </button>
           <button className="start-btn secondary" onClick={() => handleStart('user2')}>
             <Edit3 size={20} /> Começar como Usuário 2
           </button>
        </div>
        <p className="hint">Cada celular deve escolher um usuário diferente.</p>
      </div>
    </div>
  );
}
