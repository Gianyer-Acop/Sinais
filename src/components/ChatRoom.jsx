import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, ArrowLeft, Plus, MessageCircle, Trash2, 
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
  ThumbsUp: <ThumbsUp size={20} />,
  MessageCircle: <MessageCircle size={20} />
};

export function ChatRoom({ 
  messages, 
  conversations, 
  onSendMessage, 
  onLoadPrevious, 
  onCreateConversation, 
  onDeleteConversation,
  onUpdateConversation,
  currentUserId,
  showModal
}) {
  const [view, setView] = useState('list'); // 'list' or 'thread'
  const [selectedConv, setSelectedConv] = useState(null);
  const [inputText, setInputText] = useState('');
  const [newTopicMode, setNewTopicMode] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicIcon, setNewTopicIcon] = useState('MessageCircle');
  const [editingConvIconId, setEditingConvIconId] = useState(null);
  
  const scrollRef = useRef(null);

  const orphanMessages = messages.filter(m => !m.conversation_id);
  const effectiveConversations = [...conversations];
  
  const hasBatePapo = conversations.some(c => c.title === 'BATE PAPO');
  if (!hasBatePapo && (orphanMessages.length > 0 || conversations.length === 0)) {
    effectiveConversations.push({
      id: 'default-bate-papo',
      title: 'BATE PAPO',
      icon: 'Smile',
      is_virtual: true
    });
  }

  useEffect(() => {
    if (view === 'thread' && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const conv = await onCreateConversation(newTopicTitle, newTopicIcon);
    if (conv) {
      setSelectedConv(conv);
      setView('thread');
      setNewTopicMode(false);
      setNewTopicTitle('');
      setNewTopicIcon('MessageCircle');
    }
  };

  const currentMessages = messages.filter(m => {
    if (selectedConv?.is_virtual) return !m.conversation_id;
    return m.conversation_id === selectedConv?.id;
  });

  const handleSubmitMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText, selectedConv?.is_virtual ? null : selectedConv?.id);
    inputText === '' ? null : setInputText('');
  };

  const renderMessages = () => {
    const blocks = [];
    let currentBlock = null;

    currentMessages.forEach((msg, idx) => {
      const prevMsg = currentMessages[idx - 1];
      const msgDate = new Date(msg.created_at);
      const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
      const isNewSubject = prevDate && (msgDate - prevDate > 30 * 60 * 1000);
      const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;

      if (isNewSubject || !isSameSender) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: msg.id, sender_id: msg.sender_id, timestamp: msg.created_at, isNewSubject, messages: [msg]
        };
      } else {
        currentBlock.messages.push(msg);
      }
    });
    if (currentBlock) blocks.push(currentBlock);

    if (currentMessages.length === 0) {
      return (
        <div className="empty-thread-calm">
          <p>Diga algo sobre {selectedConv?.title}... ✨</p>
        </div>
      );
    }

    return blocks.map((block) => (
      <React.Fragment key={block.id}>
        {block.isNewSubject && (
          <div className="subject-divider">
            <span>Novo momento — {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
        <div className={`chat-block ${block.sender_id === currentUserId ? 'mine' : 'theirs'}`}>
          <div className="block-bubbles">
            {block.messages.map((m, i) => (
              <div key={m.id} className="bubble-wrapper">
                <span className="bubble-text">{m.text}</span>
                {i === block.messages.length - 1 && (
                  <span className="bubble-time">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </React.Fragment>
    ));
  };

  if (view === 'list') {
    return (
      <div className="chat-viewport-calm">
        <div className="chat-inbox-header" id="tour-chat-inbox">
           <div className="inbox-title">
             <MessageCircle size={20} />
             <span>Assuntos do Chat</span>
           </div>
           <button className="new-chat-btn" id="tour-new-topic-btn" onClick={() => setNewTopicMode(true)}>
             <Plus size={18} />
             <span>Novo Assunto</span>
           </button>
        </div>

        {newTopicMode && (
          <form className="new-topic-form-calm" onSubmit={handleCreateTopic}>
            <input 
              autoFocus
              className="topic-input"
              placeholder="Ex: Jantar, Filme, Planos..."
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
            />
            <div className="topic-icon-grid">
               {Object.keys(ICON_MAP).map(key => (
                 <button 
                  key={key} 
                  type="button" 
                  className={`icon-selector-btn ${newTopicIcon === key ? 'active' : ''}`}
                  onClick={() => setNewTopicIcon(key)}
                 >
                   {ICON_MAP[key]}
                 </button>
               ))}
            </div>
            <div className="form-actions">
               <button type="button" onClick={() => setNewTopicMode(false)}>Cancelar</button>
               <button type="submit" className="confirm">Criar Assunto</button>
            </div>
          </form>
        )}

        <div className="chat-list-scroll">
          {effectiveConversations.map(conv => (
            <div key={conv.id} className="conv-item-wrapper">
              <div className="conv-item-calm">
                <div className="conv-content-box" onClick={() => { setSelectedConv(conv); setView('thread'); }}>
                  <div 
                    className="conv-icon-box" 
                    onClick={(e) => { 
                      if (!conv.is_virtual) {
                        e.stopPropagation();
                        setEditingConvIconId(editingConvIconId === conv.id ? null : conv.id);
                      }
                    }}
                    title={conv.is_virtual ? "" : "Mudar ícone"}
                  >
                    {ICON_MAP[conv.icon] || <MessageCircle size={20} />}
                  </div>
                  <div className="conv-info">
                    <span className="conv-title">{conv.title}</span>
                    <span className="conv-meta">
                      {conv.is_virtual ? 'Conversas rápidas' : `Criado em ${new Date(conv.created_at).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
                {!conv.is_virtual && onDeleteConversation && (
                  <button 
                    className="delete-conv-btn"
                    onClick={async () => {
                      const confirm = await showModal({
                        title: 'Apagar Conversa?',
                        message: `Deseja apagar "${conv.title}" e todas as suas mensagens? Esta ação não pode ser desfeita.`,
                        type: 'confirm'
                      });
                      if (confirm) onDeleteConversation(conv.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              {editingConvIconId === conv.id && (
                <div className="edit-icon-panel" onClick={e => e.stopPropagation()}>
                    <div className="topic-icon-grid mini">
                      {Object.keys(ICON_MAP).map(key => (
                        <button 
                          key={key} 
                          type="button" 
                          className={`icon-selector-btn ${conv.icon === key ? 'active' : ''}`}
                          onClick={() => {
                            onUpdateConversation(conv.id, key);
                            setEditingConvIconId(null);
                          }}
                        >
                          {ICON_MAP[key]}
                        </button>
                      ))}
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .chat-viewport-calm { height: 100%; display: flex; flex-direction: column; background: transparent; }
          
          .chat-inbox-header { padding: 20px 4px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-accent); margin-bottom: 15px; }
          .inbox-title { display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--text-primary); }
          .new-chat-btn { background: var(--color-primary); color: #fff; border: none; padding: 10px 16px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; }
          
          .new-topic-form-calm { 
            padding: 24px; background: #fff; border-radius: 24px; border: 1px solid var(--color-accent); 
            margin-bottom: 20px; animation: slideDown 0.3s ease; display: flex; flex-direction: column; gap: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.02);
          }
          .topic-input { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1px solid var(--color-accent); background: var(--bg-primary); outline: none; font-size: 1rem; }
          .topic-icon-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; max-height: 120px; overflow-y: auto; padding-right: 5px; }
          .topic-icon-grid.mini { grid-template-columns: repeat(6, 1fr); max-height: 150px; }
          .icon-selector-btn { 
            aspect-ratio: 1; border-radius: 10px; border: 2px solid transparent; background: var(--bg-primary); 
            color: #888; display: flex; align-items: center; justify-content: center; cursor: pointer;
          }
          .icon-selector-btn.active { border-color: var(--color-primary); color: var(--color-primary); background: #fff; }
          
          .form-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 5px; }
          .form-actions button { border: none; background: none; font-weight: 800; cursor: pointer; }
          .confirm { color: var(--color-primary); }

          .chat-list-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; scrollbar-width: none; padding-bottom: 20px; }
          .chat-list-scroll::-webkit-scrollbar { display: none; }
          
          .conv-item-wrapper { display: flex; flex-direction: column; gap: 8px; }
          .conv-item-calm { 
            display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 12px 18px; 
            background: #fff; border-radius: 20px; border: 1px solid var(--color-accent);
            cursor: pointer; transition: all 0.2s;
          }
          .conv-content-box { flex: 1; display: flex; align-items: center; gap: 15px; }
          .conv-item-calm:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.02); border-color: var(--color-primary); }
          .conv-icon-box { width: 44px; height: 44px; background: var(--bg-primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--color-primary); transition: transform 0.2s; }
          .conv-icon-box:hover { transform: scale(1.1); background: #fff; border: 1px solid var(--color-primary); }
          .conv-info { display: flex; flex-direction: column; gap: 1px; }
          .conv-title { font-weight: 800; color: var(--text-primary); font-size: 1.05rem; }
          .conv-meta { font-size: 0.75rem; color: #888; font-weight: 600; }
          .delete-conv-btn { background: transparent; border: none; color: #ff6b6b; cursor: pointer; padding: 8px; opacity: 0.5; transition: 0.2s; }
          .delete-conv-btn:hover { opacity: 1; transform: scale(1.1); }
          
          .edit-icon-panel { padding: 15px; background: #fff; border-radius: 18px; border: 1px dashed var(--color-primary); animation: slideDown 0.2s ease; }

          @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        `}} />
      </div>
    );
  }

  return (
    <div className="chat-thread-outer">
      <div className="chat-thread-container-integrated">
        <div className="thread-header-minimal">
          <button className="back-btn-calm" onClick={() => setView('list')}>
            <ArrowLeft size={20} />
          </button>
          <div className="thread-titling-calm">
            <div className="thread-icon-mini">
                {ICON_MAP[selectedConv?.icon] || <MessageCircle size={18} />}
            </div>
            <div className="thread-names">
              <span className="thread-title">{selectedConv?.title}</span>
              <span className="thread-status">Chat Ativo</span>
            </div>
          </div>
        </div>

        <div className="messages-area-calm-integrated">
          <div className="messages-scroll">
            {renderMessages()}
            <div ref={scrollRef} style={{ height: '1px' }} />
          </div>
        </div>

        <form className="message-input-bar-calm-integrated" onSubmit={handleSubmitMessage}>
          <input 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Diga algo..."
          />
          <button type="submit" className="send-btn-calm" disabled={!inputText.trim()}>
            <Send size={20} />
          </button>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .chat-thread-outer { height: 100%; width: 100%; display: flex; flex-direction: column; }
        .chat-thread-container-integrated { height: 100%; display: flex; flex-direction: column; background: transparent; animation: slideIn 0.3s ease; }
        
        .thread-header-minimal { padding: 10px 4px 20px; display: flex; align-items: center; gap: 15px; border-bottom: 2px solid var(--color-accent); margin-bottom: 15px; }
        .back-btn-calm { background: #fff; border: 1px solid var(--color-accent); padding: 10px; border-radius: 12px; color: var(--color-primary); cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.02); }
        .thread-titling-calm { display: flex; align-items: center; gap: 12px; }
        .thread-icon-mini { width: 36px; height: 36px; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; color: var(--color-primary); border: 1px solid var(--color-accent); }
        .thread-names { display: flex; flex-direction: column; }
        .thread-title { font-weight: 800; color: var(--text-primary); font-size: 1.1rem; }
        .thread-status { font-size: 0.65rem; color: #84a98c; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

        .messages-area-calm-integrated { flex: 1; overflow-y: auto; padding: 10px 0; scrollbar-width: none; }
        .messages-area-calm-integrated::-webkit-scrollbar { display: none; }
        
        .chat-block { display: flex; flex-direction: column; gap: 4px; margin-bottom: 18px; width: 100%; }
        .chat-block.mine { align-items: flex-end; }
        .chat-block.theirs { align-items: flex-start; }
        
        .block-bubbles { display: flex; flex-direction: column; gap: 4px; max-width: 85%; }
        .bubble-wrapper { padding: 12px 18px; border-radius: 20px; position: relative; display: flex; flex-direction: column; gap: 2px; }
        .mine .bubble-wrapper { background: var(--color-primary); color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .theirs .bubble-wrapper { background: #fff; color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--color-accent); }
        
        .bubble-text { font-size: 1rem; font-weight: 600; line-height: 1.4; word-break: break-word; }
        .bubble-time { font-size: 0.65rem; opacity: 0.7; align-self: flex-end; font-weight: 800; }
        
        .subject-divider { text-align: center; margin: 30px 0; position: relative; }
        .subject-divider span { background: var(--bg-primary); padding: 4px 16px; border-radius: 20px; font-size: 0.7rem; color: #888; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }

        .message-input-bar-calm-integrated { padding: 15px 0; display: flex; gap: 12px; background: transparent; }
        .message-input-bar-calm-integrated input { flex: 1; padding: 16px 20px; border-radius: 20px; border: 1px solid var(--color-accent); background: #fff; outline: none; font-size: 1rem; font-weight: 600; box-shadow: 0 4px 8px rgba(0,0,0,0.02); }
        .send-btn-calm { background: var(--color-primary); color: #fff; border: none; width: 52px; height: 52px; border-radius: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .send-btn-calm:disabled { opacity: 0.5; box-shadow: none; }
        
        .empty-thread-calm { height: 100%; display: flex; align-items: center; justify-content: center; color: #ccc; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; }

        @keyframes slideIn { from { transform: translateX(10px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}} />
    </div>
  );
}
