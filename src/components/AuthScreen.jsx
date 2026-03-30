import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

export function AuthScreen({ onAuthSuccess }) {
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
              connection_code: Math.floor(100000 + Math.random() * 900000).toString() // Gera código de 6 dígitos
            }
          }
        });
        if (error) throw error;
        alert("Cadastro realizado! Verifique seu e-mail se necessário ou faça login.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
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
                onChange={(e) => setEmail(e.target.value)} 
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
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Sua senha secreta"
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        <div className="auth-toggle">
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-screen {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: var(--bg-primary);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          padding: 40px 30px;
          border-radius: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.03);
          border: 1px solid #e5e5d1;
        }
        .auth-header { text-align: center; margin-bottom: 30px; }
        .auth-header h2 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 8px; }
        .auth-header p { color: var(--color-secondary); font-size: 0.95rem; }
        
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
        
        .auth-error { background: #fee2e2; color: #b91c1c; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
        .auth-submit-btn {
          background: var(--color-primary); color: #fff; padding: 14px; border-radius: 12px;
          font-weight: 700; font-size: 1rem; margin-top: 10px; cursor: pointer;
        }
        .auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .auth-toggle { margin-top: 24px; text-align: center; }
        .auth-toggle button { color: var(--color-primary); font-weight: 600; font-size: 0.9rem; border-bottom: 2px solid transparent; }
        .auth-toggle button:hover { border-bottom-color: var(--color-primary); }
      `}} />
    </div>
  );
}
