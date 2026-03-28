import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronUp } from 'lucide-react';

export function ChatRoom({ messages, onSendMessage, onLoadMore, hasMore, currentUserId }) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="chat-container">
      {hasMore && (
        <button className="load-more-btn" onClick={onLoadMore}>
          <ChevronUp size={16} /> Carregar mensagens antigas
        </button>
      )}
      
      <div className="chat-messages" aria-live="polite">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${msg.sender_id === currentUserId ? 'mine' : 'theirs'}`}
          >
            <span className="msg-text">{msg.text}</span>
            <span className="msg-info">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          type="text"
          placeholder="Escreva uma mensagem..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!inputText.trim()}>
          <Send size={20} />
          <span className="sr-only">Enviar</span>
        </button>
      </form>
    </div>
  );
}
