import React, { useState } from 'react';
import { 
  Plus, Trash2, Check, X, RotateCcw,
  Smile, Heart, Zap, MessageSquare, AlertCircle, 
  Moon, Sun, Coffee, Home, Ghost, 
  Bell, Cloud, Umbrella, Anchor, Wind, 
  Music, Camera, Gift, Star, ThumbsUp, MessageSquareOff
} from 'lucide-react';

const ICON_MAP = {
  Smile: <Smile size={20} />,
  Heart: <Heart size={20} />,
  Zap: <Zap size={20} />,
  MessageSquare: <MessageSquare size={20} />,
  MessageSquareOff: <MessageSquareOff size={20} />,
  AlertCircle: <AlertCircle size={20} />,
  Moon: <Moon size={20} />,
  Sun: <Sun size={20} />,
  Coffee: <Coffee size={20} />,
  Home: <Home size={20} />,
  Ghost: <Ghost size={20} />,
  Bell: <Bell size={20} />,
  Cloud: <Cloud size={20} />,
  Umbrella: <Umbrella size={20} />,
  Anchor: <Anchor size={20} />,
  Wind: <Wind size={20} />,
  Music: <Music size={20} />,
  Camera: <Camera size={20} />,
  Gift: <Gift size={20} />,
  Star: <Star size={20} />,
  ThumbsUp: <ThumbsUp size={20} />
};

const PASTEL_COLORS = [
  { name: 'Sálvia', hex: '#84a98c' },
  { name: 'Rosa', hex: '#b56576' },
  { name: 'Oceano', hex: '#6d9dc5' },
  { name: 'Sol', hex: '#d6ba73' },
  { name: 'Lavanda', hex: '#9a8c98' },
  { name: 'Pêssego', hex: '#e29578' },
  { name: 'Neve', hex: '#f8f9fa' },
  { name: 'Grafite', hex: '#6d6875' }
];

export function SignalManager({ signalTypes, onSave, onAdd, onDelete, onRestore, onClose, showModal }) {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ label: '', icon_name: 'Smile', color: '#84a98c' });
  const [isAdding, setIsAdding] = useState(false);

  const handleRestore = async () => {
    const confirm = await showModal({
      title: 'Restaurar Padrões?',
      message: 'Isso irá adicionar os 5 sinais originais do app. Deseja continuar?',
      type: 'confirm'
    });
    if (confirm) onRestore();
  };

  const handleStartAdd = () => {
    setFormData({ label: '', icon_name: 'Smile', color: '#84a98c' });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!formData.label.trim()) return;
    if (isAdding) {
      onAdd(formData);
      setIsAdding(false);
    } else {
      onSave({ ...formData, id: editingId });
      setEditingId(null);
    }
  };

  return (
    <div className="signal-manager-modal">
      <div className="manager-header">
        <button className="back-btn-calm" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="header-text-calm">
          <h2>Meus Sinais</h2>
          <p>Personalize seus cartões de sentimento</p>
        </div>
      </div>

      <div className="signals-list-calm">
        {signalTypes.map(s => (
          <div key={s.id} className="signal-item-edit">
            <div className="signal-preview-box" style={{ backgroundColor: s.color }}>
              {ICON_MAP[s.icon_name] || <Smile size={20} />}
            </div>
            <div className="signal-info-edit">
               <span className="signal-label-edit">{s.label}</span>
            </div>
            <div className="signal-actions">
               <button onClick={() => { setEditingId(s.id); setFormData(s); setIsAdding(false); }} className="edit-mini-btn">Editar</button>
               <button onClick={() => onDelete(s.id)} className="delete-mini-btn"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {(isAdding || editingId) && (
        <div className="editor-panel-calm">
          <h3>{isAdding ? 'Novo Sinal' : 'Editar Sinal'}</h3>
          
          <div className="input-group-calm">
            <label>Nome do Sinal</label>
            <input 
              autoFocus
              className="calm-input"
              value={formData.label} 
              onChange={(e) => setFormData({...formData, label: e.target.value})}
              placeholder="Ex: Frio, Cansado, Fome..."
            />
          </div>

          <div className="editor-group-calm">
            <label>Escolha o Ícone Minimalista</label>
            <div className="icon-grid-minimal">
              {Object.keys(ICON_MAP).map(name => (
                <button 
                  key={name}
                  type="button"
                  className={`icon-opt-btn ${formData.icon_name === name ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, icon_name: name})}
                >
                  {ICON_MAP[name]}
                </button>
              ))}
            </div>
          </div>

          <div className="editor-group-calm">
            <label>Escolha a Cor Pastel</label>
            <div className="color-grid-minimal">
              {PASTEL_COLORS.map(c => (
                <button 
                  key={c.hex}
                  type="button"
                  className={`color-opt-btn ${formData.color === c.hex ? 'active' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setFormData({...formData, color: c.hex})}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="panel-actions-calm">
            <button className="cancel-btn" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancelar</button>
            <button className="save-btn-mini" onClick={handleSave}>
              <Check size={18} /> <span>Salvar</span>
            </button>
          </div>
        </div>
      )}

      {!isAdding && !editingId && (
        <div className="manager-bottom-actions">
          <button className="add-signal-large" onClick={handleStartAdd}>
            <Plus size={20} />
            <span>Criar Novo Sinal</span>
          </button>
          
          <div className="restore-signals-box">
             <button className="restore-btn-link" onClick={handleRestore}>
                <RotateCcw size={14} /> Restaurar Sinais Padrão
             </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .signal-manager-modal { height: 100%; display: flex; flex-direction: column; animation: fadeIn 0.3s; }
        .manager-header { display: flex; align-items: flex-start; gap: 15px; padding-bottom: 24px; border-bottom: 1px solid var(--color-accent); margin-bottom: 20px; }
        .header-text-calm h2 { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px; }
        .header-text-calm p { font-size: 0.85rem; color: #888; font-weight: 600; }
        
        .signals-list-calm { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px; scrollbar-width: none; }
        .signals-list-calm::-webkit-scrollbar { display: none; }
        
        .signal-item-edit { 
          display: flex; align-items: center; gap: 15px; padding: 16px; 
          background: #fff; border-radius: 20px; border: 1px solid var(--color-accent);
          transition: all 0.2s;
        }
        .signal-preview-box { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #fff; }
        .signal-info-edit { flex: 1; }
        .signal-label-edit { font-weight: 800; color: var(--text-primary); font-size: 1rem; }
        .signal-actions { display: flex; gap: 8px; }
        
        .edit-mini-btn { border: none; background: var(--bg-primary); padding: 8px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: var(--color-primary); cursor: pointer; }
        .delete-mini-btn { border: none; background: transparent; color: #ff6b6b; cursor: pointer; padding: 8px; }

        .editor-panel-calm { 
          background: #fff; border-radius: 28px; padding: 24px; border: 1px solid var(--color-accent); margin-top: 20px; 
          display: flex; flex-direction: column; gap: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.03);
          margin-bottom: 40px;
        }
        .editor-panel-calm h3 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }
        .editor-group-calm label { display: block; font-size: 0.85rem; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.02em; }
        
        .calm-input { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1px solid var(--color-accent); background: var(--bg-primary); font-size: 1rem; outline: none; transition: 0.2s; }
        .calm-input:focus { border-color: var(--color-primary); background: #fff; }

        .icon-grid-minimal { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .icon-opt-btn { height: 48px; border-radius: 14px; border: 2px solid transparent; background: var(--bg-primary); color: #888; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .icon-opt-btn.active { border-color: var(--color-primary); color: var(--color-primary); background: #fff; transform: scale(1.05); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        
        .color-grid-minimal { display: grid; grid-template-columns: repeat(8, 1fr); gap: 10px; }
        .color-opt-btn { aspect-ratio: 1; border-radius: 50%; border: 3px solid #fff; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: 0.2s; }
        .color-opt-btn.active { transform: scale(1.2); border-color: var(--text-primary); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
        
        .panel-actions-calm { display: flex; justify-content: flex-end; gap: 15px; margin-top: 15px; }
        .panel-actions-calm button { border: none; font-weight: 800; cursor: pointer; font-size: 0.95rem; }
        .save-btn-mini { background: var(--color-primary); color: #fff; padding: 12px 24px; border-radius: 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .cancel-btn { background: transparent; color: #888; }
        
        .manager-bottom-actions { margin-top: 20px; display: flex; flex-direction: column; gap: 15px; }
        .add-signal-large { 
          width: 100%; padding: 20px; border-radius: 20px; border: 2px dashed var(--color-accent);
          background: #fff; color: var(--color-primary); font-weight: 800; font-size: 1.05rem;
          display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 0.2s;
        }
        .add-signal-large:active { transform: scale(0.98); background: var(--bg-primary); }
        
        .restore-signals-box { text-align: center; }
        .restore-btn-link { background: transparent; border: none; color: #bbb; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; margin: 0 auto; transition: 0.2s; }
        .restore-btn-link:hover { color: var(--color-secondary); }
      `}} />
    </div>
  );
}
