import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';

export function LockScreen({ onUnlock, onBiometricUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    // Biometria só é possível em ambientes seguros (HTTPS ou Localhost em alguns navegadores)
    const isSecure = window.isSecureContext;
    if (isSecure && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          setIsBiometricAvailable(available);
          // Removido o desbloqueio automático para evitar bypass de segurança
        });
    }
  }, []);

  const handleBiometricUnlock = async () => {
    try {
      const success = await onBiometricUnlock();
      if (success) {
        // Redirecionamento já feito pelo handleUnlock() no App.jsx via prop
      } else {
        const isPaired = localStorage.getItem('biometric_paired') === 'true';
        if (!isPaired) {
          alert("Você primeiro precisa ativar a biometria na aba 'Eu' (Configurações).");
        }
      }
    } catch (err) {
      console.error("Erro na biometria:", err);
    }
  };

  const handlePinInput = (value) => {
    if (pin.length < 4) {
      const newPin = pin + value;
      setPin(newPin);
      
      if (newPin.length === 4) {
        const savedPin = localStorage.getItem('app_pin') || '1234';
        if (newPin === savedPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
             setPin('');
             setError(false);
          }, 800);
        }
      }
    }
  };

  return (
    <div className="lock-screen-calm">
      <div className="lock-content-minimal">
        <div className="lock-header-minimal">
          <div className="lock-icon-minimal">
            <Lock size={32} color="var(--color-primary)" />
          </div>
          <h2>Área Protegida</h2>
          <p>O cantinho nosso está seguro.</p>
        </div>

        <div className={`pin-dots-calm ${error ? 'shake-calm' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`p-dot-calm ${pin.length > i ? 'active' : ''} ${error ? 'error' : ''}`} />
          ))}
        </div>

        <div className="pin-pad-minimal">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="pin-num-btn" onClick={() => handlePinInput(num.toString())}>
              {num}
            </button>
          ))}
          <button className="pin-num-btn-aux" onClick={() => setPin('')}>Limpar</button>
          <button className="pin-num-btn" onClick={() => handlePinInput('0')}>0</button>
          {isBiometricAvailable && window.isSecureContext && (
            <button 
              className="pin-num-btn-aux active"
              onClick={handleBiometricUnlock}
              title="Usar Biometria"
            >
              <Fingerprint size={24} color="var(--color-primary)" />
            </button>
          )}
          {!isBiometricAvailable && <div />}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .lock-screen-calm {
          background-color: var(--bg-primary); height: 100%;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .lock-content-minimal {
          width: 100%; max-width: 320px; text-align: center;
        }
        .lock-icon-minimal {
          width: 80px; height: 80px; background: #fff; border-radius: 24px;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
          border: 1px solid var(--color-accent);
        }
        .lock-header-minimal h2 { font-size: 1.4rem; color: var(--text-primary); font-weight: 800; margin-bottom: 4px; }
        .lock-header-minimal p { color: var(--color-secondary); font-size: 0.9rem; font-weight: 600; }
        
        .pin-dots-calm { display: flex; justify-content: center; gap: 16px; margin: 40px 0; }
        .p-dot-calm { width: 14px; height: 14px; border-radius: 50%; background: var(--color-accent); transition: all 0.2s; }
        .p-dot-calm.active { background: var(--color-primary); transform: scale(1.2); }
        .p-dot-calm.error { background: #b56576; }
        
        .pin-pad-minimal { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .pin-num-btn {
          height: 64px; border-radius: 16px; border: 1px solid #e5e5d1; background: #fff;
          font-size: 1.4rem; font-weight: 700; color: var(--text-primary); cursor: pointer; transition: all 0.2s;
        }
        .pin-num-btn:active { background: var(--bg-primary); transform: scale(0.95); }
        .pin-num-btn-aux {
          background: none; border: none; color: var(--color-primary); font-weight: 700; font-size: 0.85rem; cursor: pointer;
        }
        
        .shake-calm { animation: shake-calm 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake-calm {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}} />
    </div>
  );
}
