import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

export function AuthScreen({ onAuthSuccess, showModal }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // PEDIDO DE GESTO: Solicitar permissão de notificação no momento do clique
      const permission = await Notification.requestPermission();
      console.log('Auth: Permissão de notificação solicitada via clique:', permission);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              connection_code: Math.floor(100000 + Math.random() * 900000).toString()
            }
          }
        });
        if (error) throw error;
        showModal({ title: 'Bem-vind@!', message: "Cadastro realizado com sucesso! ✨ Agora você pode entrar com seu e-mail e senha.", type: 'success' });
        setIsLogin(true);
      }
    } catch (err) {
      if (isLogin) {
        setError("E-mail ou senha incorretos. Verifique os dados ou crie uma nova conta.");
      } else {
        showModal({ title: 'Erro de Cadastro', message: err.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? 'Bem-vindo de volta' : 'Criar nossa conta'}</h2>
          <p>{isLogin ? 'Acesse seu cantinho seguro' : 'Comece sua jornada de conexão'}</p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="input-group-auth">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <Mail size={18} />
              <input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); setError(null); }} 
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="input-group-auth">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setError(null); }} 
                placeholder="Sua senha secreta"
                required
              />
            </div>
          </div>

          <div className={`auth-error-container ${error ? 'visible' : ''}`}>
            <div className="auth-error-wrapper">
              <div className="auth-error-inline">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="auth-toggle">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }}>
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-screen {
          height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; background-color: var(--bg-primary);
        }
        .auth-card {
           width: 100%; max-width: 400px; background: #fff; padding: 40px 30px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); border: 1px solid #e5e5d1;
           transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
           overflow: hidden;
        }
        .auth-header { text-align: center; margin-bottom: 24px; }
        .auth-header h2 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 8px; font-weight: 800; }
        .auth-header p { color: var(--color-secondary); font-size: 0.95rem; font-weight: 600; }
        
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group-auth label { display: block; font-size: 0.85rem; font-weight: 700; color: #52616a; margin-bottom: 8px; }
        .input-wrapper {
          display: flex; align-items: center; gap: 12px; background: var(--bg-primary);
          padding: 12px 16px; border-radius: 12px; border: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .input-wrapper:focus-within { border-color: var(--color-primary); background: #fff; }
        .input-wrapper input { border: none; background: transparent; outline: none; flex: 1; font-size: 1rem; color: var(--text-primary); }
        .input-wrapper svg { color: var(--color-secondary); }
        .auth-error-container {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
          opacity: 0;
          margin-bottom: 0;
        }
        .auth-error-container.visible {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-bottom: 20px;
        }
        .auth-error-wrapper {
          overflow: hidden;
        }
        .auth-error-inline { 
          background: #fff0f0; color: #d00000; padding: 12px 16px; 
          border-radius: 14px; display: flex; align-items: center; gap: 10px; 
          font-size: 0.85rem; font-weight: 700; border: 1px solid #ffcccc;
        }
        
        .auth-submit-btn {
          background: var(--color-primary); color: #fff; padding: 14px; border-radius: 12px;
          font-weight: 700; font-size: 1rem; margin-top: 10px; cursor: pointer;
        }
        .auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .auth-toggle { margin-top: 24px; text-align: center; }
        .auth-toggle button { color: var(--color-primary); font-weight: 700; font-size: 0.95rem; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .auth-toggle button:hover { border-bottom-color: var(--color-primary); }
      `}} />
    </div>
  );
}
