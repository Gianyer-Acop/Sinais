import React from 'react';
import { X } from 'lucide-react';

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-wrapper-top">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="toast-item-calm"
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-icon-side">{toast.icon || '🍃'}</div>
          <div className="toast-content-side">
            <span className="toast-title-text">{toast.title}</span>
            <p className="toast-body-text">{toast.body}</p>
          </div>
          <button className="toast-close-btn">
            <X size={14} />
          </button>
        </div>
      ))}

      <style dangerouslySetInnerHTML={{ __html: `
        .toast-wrapper-top {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          width: 90%; max-width: 400px; z-index: 9999;
          display: flex; flex-direction: column; gap: 10px;
          pointer-events: none;
        }
        .toast-item-calm {
          pointer-events: auto;
          background: #fff; padding: 12px 16px; border-radius: 18px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #e5e5d1;
          display: flex; align-items: center; gap: 14px;
          animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer; position: relative;
        }
        .toast-icon-side { font-size: 1.5rem; }
        .toast-content-side { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .toast-title-text { font-size: 0.85rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase; }
        .toast-body-text { font-size: 0.95rem; color: #334148; font-weight: 600; line-height: 1.2; }
        
        .toast-close-btn { opacity: 0.3; margin-left: 5px; }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-40px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
