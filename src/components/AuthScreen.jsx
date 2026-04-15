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
    if (e) e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    console.log('[Auth] Iniciando:', isLogin ? 'Login' : 'Cadastro', '| Email:', email);

    try {
      if (isLogin) {
        // --- FLUXO DE LOGIN ---
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (loginError) throw loginError;
        
        if (data.user) {
          console.log('[Auth] Login bem sucedido!');
          onAuthSuccess(data.user);
        }
      } else {
        // --- FLUXO DE CADASTRO ---
        const { data, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              connection_code: Math.floor(100000 + Math.random() * 900000).toString()
            }
          }
        });

        if (signUpError) throw signUpError;

        // Se o Supabase retornar user mas sem identidades, significa que já existe
        if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
          throw new Error('user_already_exists');
        }

        console.log('[Auth] Cadastro bem sucedido!');

        // ✅ AUTO-LOGIN: Se o Supabase já nos der uma sessão (e-mail confirmado desativado), entramos direto
        if (data.session) {
          console.log('[Auth] Sessão ativa após cadastro, entrando...');
          onAuthSuccess(data.user);
        } else {
          // Caso a confirmação de e-mail ainda esteja ativa no servidor por algum motivo
          showModal({ 
            title: 'Verifique seu e-mail 📧', 
            message: 'Cadastro realizado! Por favor, confirme seu e-mail na sua caixa de entrada para poder entrar.', 
            type: 'info' 
          });
          setIsLogin(true);
        }
      }
    } catch (err) {
      console.error('[Auth] Erro detalhado:', err);
      
      let mensagem = err.message;

      // Tratamento amigável de erros comuns
      if (err.message === 'user_already_exists' || err.message.includes('already registered')) {
        mensagem = 'Este e-mail já tem uma conta cadastrada. Clique em "Já tem conta? Faça login" abaixo.';
      } else if (err.message.includes('Invalid login credentials')) {
        mensagem = 'E-mail ou senha incorretos. Verifique e tente novamente.';
      } else if (err.message.includes('Password should be')) {
        mensagem = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.message.includes('network')) {
        mensagem = 'Erro de conexão. Verifique sua internet.';
      }

      setError(mensagem);
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
            <div className={`input-wrapper ${error && email === '' ? 'error' : ''}`}>
              <Mail size={18} />
              <input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); setError(null); }} 
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group-auth">
            <label htmlFor="password">Senha</label>
            <div className={`input-wrapper ${error && password === '' ? 'error' : ''}`}>
              <Lock size={18} />
              <input 
                id="password"
                type="password" 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setError(null); }} 
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
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
            {loading ? 'Aguarde...' : (isLogin ? 'Fazer Login' : 'Cadastrar agora')}
          </button>
        </form>

        <div className="auth-toggle">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            disabled={loading}
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-screen {
          height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; 
          padding: 20px; background-color: var(--bg-primary); position: fixed; top: 0; left: 0; z-index: 1000;
        }
        .auth-card {
           width: 100%; max-width: 400px; background: #fff; padding: 40px 30px; border-radius: 28px; 
           box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid var(--color-accent);
           animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-header h2 { font-size: 1.6rem; color: var(--text-primary); margin-bottom: 8px; font-weight: 800; }
        .auth-header p { color: var(--color-secondary); font-size: 1rem; font-weight: 600; opacity: 0.8; }
        
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group-auth label { display: block; font-size: 0.85rem; font-weight: 700; color: #52616a; margin-bottom: 8px; margin-left: 4px; }
        .input-wrapper {
          display: flex; align-items: center; gap: 12px; background: var(--bg-primary);
          padding: 14px 18px; border-radius: 16px; border: 2px solid transparent;
          transition: all 0.2s;
        }
        .input-wrapper:focus-within { border-color: var(--color-primary); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .input-wrapper input { border: none; background: transparent; outline: none; flex: 1; font-size: 1rem; color: var(--text-primary); }
        .input-wrapper svg { color: var(--color-secondary); opacity: 0.7; }
        
        .auth-error-container {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s;
          opacity: 0;
        }
        .auth-error-container.visible {
          grid-template-rows: 1fr;
          opacity: 1;
          margin-top: 10px;
        }
        .auth-error-wrapper { overflow: hidden; }
        .auth-error-inline { 
          background: #fff5f5; color: #e53e3e; padding: 14px; 
          border-radius: 14px; display: flex; align-items: flex-start; gap: 10px; 
          font-size: 0.85rem; font-weight: 600; border: 1px solid #feb2b2;
          line-height: 1.4;
        }
        
        .auth-submit-btn {
          background: var(--color-primary); color: #fff; padding: 16px; border-radius: 18px;
          font-weight: 800; font-size: 1.1rem; margin-top: 10px; cursor: pointer;
          border: none; transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(132, 169, 140, 0.3);
        }
        .auth-submit-btn:active { transform: scale(0.98); }
        .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
        
        .auth-toggle { margin-top: 24px; text-align: center; }
        .auth-toggle button { color: var(--color-primary); font-weight: 700; font-size: 1rem; border: none; background: none; cursor: pointer; transition: all 0.2s; opacity: 0.8; }
        .auth-toggle button:hover { opacity: 1; text-decoration: underline; }
      `}} />
    </div>
  );
}
