import React, { useState } from 'react';
import { Camera, User, Check } from 'lucide-react';

const ICONS = ['🦊', '🐨', '🌸', '🌈', '🚲', '🍕', '🌙', '⭐', '🎈'];

export function ProfileEditor({ profile, onSave }) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    nickname: profile.nickname || '',
    icon: profile.icon || '🦊',
    avatar_url: profile.avatar_url || ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar_url: reader.result }); // Temporary base64 for preview/demo
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form className="editor-form" onSubmit={handleSubmit}>
      <div className="avatar-preview-section">
        <label htmlFor="avatar-upload" className="avatar-wrapper editor">
          {formData.avatar_url ? (
            <img src={formData.avatar_url} alt="Ajustar Foto" className="avatar-img" />
          ) : (
            <span className="avatar-letter">{formData.icon}</span>
          )}
          <div className="avatar-overlay">
            <Camera size={20} />
          </div>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
        <p className="hint">Toque na foto para alterar</p>
      </div>

      <div className="input-group">
        <label>Nome</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: João"
        />
      </div>

      <div className="input-group">
        <label>Apelido / Carinho</label>
        <input
          type="text"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          placeholder="Como você prefere ser chamad@"
        />
      </div>

      <div className="icon-selector">
        <label>Escolha um ícone:</label>
        <div className="icon-grid">
          {ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={`icon-btn ${formData.icon === icon ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, icon })}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="save-btn">
        <Check size={18} /> Salvar Alterações
      </button>
    </form>
  );
}
