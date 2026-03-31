import React from 'react';
import { AlertCircle, HelpCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

export function CustomModal({ 
  show, 
  type = 'info', 
  title, 
  message, 
  defaultValue = '', 
  onConfirm, 
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) {
  const [inputValue, setInputValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (show) setInputValue(defaultValue);
  }, [show, defaultValue]);

  if (!show) return null;

  const Icon = {
    info: <Info className="modal-icon-calm info" size={40} />,
    confirm: <HelpCircle className="modal-icon-calm confirm" size={40} />,
    prompt: <HelpCircle className="modal-icon-calm prompt" size={40} />,
    success: <CheckCircle2 className="modal-icon-calm success" size={40} />,
    error: <XCircle className="modal-icon-calm error" size={40} />
  }[type] || <Info className="modal-icon-calm" size={40} />;

  return (
    <div className="modal-backdrop-calm">
      <div className="modal-card-calm">
        <div className="modal-header-calm">
          {Icon}
          <h3>{title}</h3>
        </div>
        
        <div className="modal-body-calm">
          <p>{message}</p>
          {type === 'prompt' && (
            <input 
              autoFocus
              type="text" 
              className="modal-input-calm" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onConfirm(inputValue)}
            />
          )}
        </div>

        <div className="modal-actions-calm">
          {(type === 'confirm' || type === 'prompt') && (
            <button className="modal-btn-calm cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className="modal-btn-calm confirm" onClick={() => onConfirm(type === 'prompt' ? inputValue : true)}>
            {confirmText}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-backdrop-calm {
          position: fixed; inset: 0; z-index: 20000;
          background: rgba(0,0,0,0.15); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: fadeIn 0.3s ease-out;
        }
        .modal-card-calm {
          width: 100%; max-width: 380px; background: #fff;
          border-radius: 32px; padding: 32px; border: 1px solid var(--color-accent);
          display: flex; flex-direction: column; gap: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-header-calm { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
        .modal-header-calm h3 { font-size: 1.3rem; font-weight: 800; color: var(--text-primary); }
        
        .modal-icon-calm { color: var(--color-primary); }
        .modal-icon-calm.info { color: var(--color-primary); }
        .modal-icon-calm.error { color: #ff6b6b; }
        .modal-icon-calm.success { color: #84a98c; }
        
        .modal-body-calm { text-align: center; }
        .modal-body-calm p { font-size: 0.95rem; color: var(--color-secondary); font-weight: 600; line-height: 1.5; }
        
        .modal-input-calm {
          width: 100%; margin-top: 15px; padding: 14px 18px; border-radius: 14px;
          border: 2px solid var(--color-accent); background: var(--bg-primary);
          font-size: 1rem; font-weight: 800; text-align: center; outline: none;
          transition: border-color 0.2s;
        }
        .modal-input-calm:focus { border-color: var(--color-primary); background: #fff; }

        .modal-actions-calm { display: flex; gap: 12px; margin-top: 5px; }
        .modal-btn-calm {
          flex: 1; padding: 16px; border-radius: 16px; border: none;
          font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
        }
        .modal-btn-calm.cancel { background: var(--bg-primary); color: #888; }
        .modal-btn-calm.confirm { background: var(--color-primary); color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .modal-btn-calm:active { transform: scale(0.96); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>
  );
}
