import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react';

export function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    // Check if biometrics are supported in this browser
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricAvailable(available));
    }
  }, []);

  const handlePinInput = (value) => {
    if (pin.length < 4) {
      const newPin = pin + value;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Mock PIN check (In real app, compare with hashed PIN in localStorage/DB)
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

  const handleBiometric = async () => {
    // Basic mock of triggering biometrics. 
    // Real implementation would use navigator.credentials.get()
    try {
      // Small delay to simulate system prompt
      await new Promise(r => setTimeout(r, 500));
      onUnlock();
    } catch (e) {
      console.error("Biometric failed", e);
    }
  };

  return (
    <div className="lock-screen">
      <div className="lock-content">
        <div className="lock-icon-wrapper">
          <Lock size={48} color="var(--color-primary)" />
        </div>
        <h2>Acesso Protegido</h2>
        <p>Digite seu PIN para entrar no Nossos Sinais</p>

        <div className={`pin-display ${error ? 'error' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />
          ))}
        </div>

        <div className="pin-pad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handlePinInput(num.toString())}>
              {num}
            </button>
          ))}
          <button className="biometric-btn" onClick={handleBiometric} disabled={!isBiometricAvailable}>
            <Fingerprint size={24} />
          </button>
          <button onClick={() => handlePinInput('0')}>0</button>
          <button onClick={() => setPin('')}>C</button>
        </div>
        
        {isBiometricAvailable && (
          <button className="quick-unlock" onClick={handleBiometric}>
            <ShieldCheck size={16} /> Toque para biometria
          </button>
        )}
      </div>
    </div>
  );
}
