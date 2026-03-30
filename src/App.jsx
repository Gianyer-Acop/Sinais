import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { SignalGrid } from './components/SignalGrid';
import { ChatRoom } from './components/ChatRoom';
import { ProfileEditor } from './components/ProfileEditor';
import { LockScreen } from './components/LockScreen';
import { AuthScreen } from './components/AuthScreen';
import { ConnectionScreen } from './components/ConnectionScreen';
import { ProfileSetupScreen } from './components/ProfileSetupScreen';
import { PartnerSummary } from './components/PartnerSummary';
import { ToastContainer } from './components/ToastContainer';
import { LoadingScreen } from './components/LoadingScreen';
import { requestNotificationPermission, sendLocalNotification } from './lib/notifications';
import { User, MessageSquare, Settings, Zap, Heart, LogOut } from 'lucide-react';
import './App.css';

const SIGNALS_MAP = {
  ok: { label: 'Estou bem', color: '#5e8c61' },
  overwhelmed: { label: 'Sobrecarga', color: '#a68a64' },
  hug: { label: 'Abraço', color: '#b56576' },
  'non-verbal': { label: 'Não-verbal', color: 'var(--color-primary)' },
  crisis: { label: 'Crise Aguda', color: '#ef4444' }
};

function App() {
  const [activeTab, setActiveTab] = useState('signals');
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerUser, setPartnerUser] = useState(null);
  const [signalsHistory, setSignalsHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [signalTypes, setSignalTypes] = useState([]);
  const [mySignal, setMySignal] = useState(null);
  const [partnerSignal, setPartnerSignal] = useState(null);
  const [isLocked, setIsLocked] = useState(localStorage.getItem('app_lock_enabled') === 'true');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // 0. Aplicar Tema IMEDIATAMENTE (LocalStorage)
  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) {
      document.body.className = `theme-${savedTheme}`;
    }
  }, []);

  // Aplicar Tema ao carregar perfil (Sincronização)
  useEffect(() => {
    if (currentUser?.theme_preference) {
      document.body.className = `theme-${currentUser.theme_preference}`;
      localStorage.setItem('app_theme', currentUser.theme_preference);
    }
  }, [currentUser?.theme_preference]);

  const addToast = (title, body, icon) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, body, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // 1. Gerenciar Sessão e Perfil
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setCurrentUser(null);
        setPartnerUser(null);
        setLoading(false);
      }
    });

    requestNotificationPermission();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: { user } } = await supabase.auth.getUser();
      const codeFromMeta = user?.user_metadata?.connection_code || Math.floor(100000 + Math.random() * 900000).toString();

      if (error && error.code === 'PGRST116') {
        // Criar perfil se não existir
        const { data: newProfile, error: insError } = await supabase
          .from('profiles')
          .insert({ id: userId, connection_code: codeFromMeta })
          .select()
          .single();
        if (insError) throw insError;
        profile = newProfile;
      } else if (!profile.connection_code) {
        // Atualizar perfil se existir mas não tiver código (da migração anterior)
        const { data: updatedProfile, error: updError } = await supabase
          .from('profiles')
          .update({ connection_code: codeFromMeta })
          .eq('id', userId)
          .select()
          .single();
        if (updError) throw updError;
        profile = updatedProfile;
      }

      setCurrentUser(profile);
    } catch (err) {
      console.error("Erro detalhado no perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Real-time e Dados do Parceiro
  useEffect(() => {
    if (!currentUser || !currentUser.partner_id) return;

    const partnerId = currentUser.partner_id;

    const fetchData = async () => {
      const { data: partner } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
      if (partner) setPartnerUser(partner);

      // Filtro de Histórico (12h fixo: 00:00 ou 12:00)
      const now = new Date();
      const lastMark = new Date(now);
      lastMark.setHours(now.getHours() < 12 ? 0 : 12, 0, 0, 0);
      
      const { data: signals } = await supabase.from('signals')
        .select('*')
        .gte('created_at', lastMark.toISOString())
        .order('created_at', { ascending: false });
        
      if (signals) {
        setSignalsHistory(signals.map(s => ({ 
          label: s.status_id, // Usaremos o ID para mapear icones dinamicamente
          timestamp: s.created_at, 
          user_id: s.user_id 
        })));
        const lPart = signals.find(s => s.user_id === partnerId);
        if (lPart) setPartnerSignal(lPart.status_id);
      }

      const { data: convs } = await supabase.from('conversations')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Se não houver conversas, mas houver mensagens, garantimos o "BATE PAPO"
      if (convs) {
        setConversations(convs);
      }

      const { data: stypes } = await supabase.from('signal_types')
        .select('*')
        .order('created_at', { ascending: true });
      if (stypes) setSignalTypes(stypes);

      const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(20);
      if (msgs) setMessages(msgs.reverse());
    };

    fetchData();

    const channel = supabase.channel('realtime-nossos-sinais')
      .on('postgres_changes', { event: 'INSERT', table: 'signals' }, (p) => {
        if (p.new.user_id === partnerId) {
          setPartnerSignal(p.new.status_id);
          const label = SIGNALS_MAP[p.new.status_id]?.label;
          const partnerName = partnerUser?.nickname || partnerUser?.name || 'Seu Amor';
          sendLocalNotification(`Sinal de ${partnerName}`, `Novo estado: ${label}`);
          addToast(`Sinal de ${partnerName}`, `Seu amor está: ${label}`, '🍃');
        } else if (p.new.user_id === currentUser.id) {
          setMySignal(p.new.status_id);
        }
        setSignalsHistory(prev => [{ ...SIGNALS_MAP[p.new.status_id], timestamp: p.new.created_at, user_id: p.new.user_id }, ...prev].slice(0, 20));
      })
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (p) => {
        setMessages(prev => [...prev, p.new]);
        if (p.new.sender_id === partnerId) {
          sendLocalNotification("Nova Mensagem", p.new.text);
          addToast("Mensagem", p.new.text, '💬');
        }
      })
      .on('postgres_changes', { event: 'UPDATE', table: 'profiles' }, (p) => {
        if (p.new.id === partnerId) setPartnerUser(p.new);
        else if (p.new.id === currentUser.id) setCurrentUser(p.new);
      })
      .on('postgres_changes', { event: 'INSERT', table: 'conversations' }, (p) => {
        setConversations(prev => [p.new, ...prev]);
      })
      .on('postgres_changes', { event: '*', table: 'signal_types' }, (p) => {
        if (p.event === 'INSERT') setSignalTypes(prev => [...prev, p.new]);
        if (p.event === 'UPDATE') setSignalTypes(prev => prev.map(s => s.id === p.new.id ? p.new : s));
        if (p.event === 'DELETE') setSignalTypes(prev => prev.filter(s => s.id === p.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser]);

  const handleUnlock = () => { setIsLocked(false); localStorage.setItem('last_unlock', Date.now().toString()); };
  const handleLogout = async () => { await supabase.auth.signOut(); localStorage.removeItem('last_unlock'); setIsLocked(true); };

  const handleSignalSelect = async (statusId) => {
    try {
      const { error } = await supabase.from('signals').insert({
        user_id: currentUser.id,
        status_id: statusId
      });
      if (error) throw error;
      setMySignal(statusId);
    } catch (err) {
      console.error("Erro ao enviar sinal:", err);
    }
  };

  const handleSaveProfile = async (formData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          nickname: formData.nickname,
          icon: formData.icon,
          theme_preference: formData.theme_preference
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      fetchProfile(currentUser.id);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const handleSendMessage = async (text) => {
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser?.id,
        text: text.trim()
      });
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Não foi possível enviar a mensagem.");
    }
  };

  const handleLoadPreviousMessages = async () => {
    if (messages.length === 0) return;
    const oldestMessage = messages[0];
    try {
      const { data: olderMsgs, error } = await supabase
        .from('messages')
        .select('*')
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (error) throw error;
      if (olderMsgs && olderMsgs.length > 0) {
        setMessages(prev => [...olderMsgs.reverse(), ...prev]);
      } else {
        alert("Não há mais mensagens para carregar.");
      }
    } catch (err) {
      console.error("Erro ao carregar anteriores:", err);
    }
  };

  const handleAddSignalType = async (type) => {
    try {
      const { error } = await supabase.from('signal_types').insert({
        ...type,
        created_by: currentUser.id,
        partner_id: currentUser.partner_id
      });
      if (error) throw error;
    } catch (err) { console.error("Erro ao criar sinal:", err); }
  };

  const handleUpdateSignalType = async (type) => {
    try {
      const { error } = await supabase.from('signal_types').update(type).eq('id', type.id);
      if (error) throw error;
    } catch (err) { console.error("Erro ao atualizar sinal:", err); }
  };

  const handleDeleteSignalType = async (id) => {
    try {
      const { error } = await supabase.from('signal_types').delete().eq('id', id);
      if (error) throw error;
    } catch (err) { console.error("Erro ao excluir sinal:", err); }
  };

  const handleUpdateConversationIcon = async (id, icon) => {
    try {
      const { error } = await supabase.from('conversations').update({ icon }).eq('id', id);
      if (error) throw error;
      setConversations(prev => prev.map(c => c.id === id ? { ...c, icon } : c));
    } catch (err) { console.error("Erro ao atualizar ícone:", err); }
  };

  const handleCreateConversation = async (title, icon = 'MessageCircle') => {
    try {
      const { data, error } = await supabase.from('conversations').insert({
        title,
        icon,
        created_by: currentUser.id,
        partner_id: currentUser.partner_id
      }).select().single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erro ao criar conversa:", err);
      alert("Não foi possível criar o novo assunto: " + err.message);
      return null;
    }
  };

  const handleRestoreDefaults = async () => {
    const defaults = [
      { id: 'ok', label: 'Estou bem', icon_name: 'Smile', color: '#84a98c' },
      { id: 'overwhelmed', label: 'Sobrecarga', icon_name: 'Zap', color: '#d6ba73' },
      { id: 'hug', label: 'Abraço', icon_name: 'Heart', color: '#b56576' },
      { id: 'non-verbal', label: 'Não-verbal', icon_name: 'MessageSquareOff', color: '#6d9dc5' },
      { id: 'crisis', label: 'Crise Aguda', icon_name: 'AlertCircle', color: '#ef4444' }
    ];
    
    for (const s of defaults) {
      await supabase.from('signal_types').upsert({
        ...s,
        created_by: currentUser.id,
        partner_id: currentUser.partner_id
      });
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== id));
      addToast("Sucesso", "Assunto removido permanentemente.", '🗑️');
    } catch (err) {
      console.error("Erro ao apagar conversa:", err);
    }
  };

  const handleNudge = async () => {
    try {
      const nudgeText = "Pensando em você... 💓";
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser?.id,
        text: nudgeText
      });
      if (error) throw error;
      alert("Carinho enviado! ❤️");
    } catch (err) {
      console.error("Erro no carinho:", err);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen onAuthSuccess={(u) => fetchProfile(u.id)} />;
  
  // Logs de Depuração (Apenas interna)
  console.log("Estado Atual:", { hasUser: !!currentUser, name: currentUser?.name, partnerId: currentUser?.partner_id, hasPartnerData: !!partnerUser });

  if (isLocked) return <LockScreen onUnlock={handleUnlock} />;
  
  // Roteamento de Onboarding
  if (!currentUser) return <LoadingScreen />;
  
  // 1. Configuração Inicial (Se não tiver nome)
  if (!currentUser.name) {
    return <ProfileSetupScreen onSave={handleSaveProfile} />;
  }

  // 2. Vínculo de Parceiro (Se não tiver parceiro vinculado)
  if (!currentUser.partner_id) {
    return <ConnectionScreen userProfile={currentUser} onComplete={() => fetchProfile(currentUser.id)} />;
  }

  // 3. Aguardar dados do parceiro (Usa tela carinhosa)
  if (!partnerUser) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Nossos Sinais</h1>
        <div className="header-actions">
           <Heart size={20} fill="#b56576" color="#b56576" />
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'signals' && (
          <div className="tab-fade-in dash-layout">
            <div className="partner-bar" onClick={() => setActiveTab('partner')}>
              <span className="p-icon">{partnerUser?.icon || '🐨'}</span>
              <div className="p-text">
                <span className="p-name">{partnerUser?.nickname || partnerUser?.name || 'Parceiro'}</span>
                {partnerSignal && <span className="p-status" style={{ color: SIGNALS_MAP[partnerSignal]?.color }}>{SIGNALS_MAP[partnerSignal]?.label}</span>}
              </div>
            </div>
            <SignalGrid onSelect={handleSignalSelect} signalTypes={signalTypes} activeSignal={mySignal} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-fade-in" style={{ height: '100%' }}>
            <ChatRoom 
              conversations={conversations}
              messages={messages} 
              onSendMessage={handleSendMessage} 
              onLoadPrevious={handleLoadPreviousMessages}
              onCreateConversation={handleCreateConversation}
              onDeleteConversation={handleDeleteConversation}
              onUpdateConversation={handleUpdateConversationIcon}
              currentUserId={currentUser?.id} 
            />
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="tab-fade-in">
            <ProfileEditor 
              profile={currentUser} 
              onSave={handleSaveProfile} 
              signalTypes={signalTypes}
              onAddSignal={handleAddSignalType}
              onUpdateSignal={handleUpdateSignalType}
              onDeleteSignal={handleDeleteSignalType}
              onRestoreSignals={handleRestoreDefaults}
            />
            <button className="logout-action" onClick={handleLogout}><LogOut size={16} /> Encerrar sessão</button>
          </div>
        )}

        {activeTab === 'partner' && (
          <div className="tab-fade-in">
            <PartnerSummary 
              partner={partnerUser} 
              signals={signalsHistory.filter(s => s.user_id === currentUser?.partner_id)} 
              onNudge={handleNudge} 
            />
          </div>
        )}
      </main>

      <nav className="app-nav">
        <button className={activeTab === 'signals' ? 'active' : ''} onClick={() => setActiveTab('signals')}><Zap size={22} /> <span>Sinais</span></button>
        <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}><MessageSquare size={22} /> <span>Chat</span></button>
        <button className={activeTab === 'partner' ? 'active' : ''} onClick={() => setActiveTab('partner')}><User size={22} /> <span>Vida</span></button>
        <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}><Settings size={22} /> <span>Eu</span></button>
      </nav>

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <style dangerouslySetInnerHTML={{ __html: `
        .loading-modern { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); color: var(--color-primary); font-weight: 700; }
        .tab-fade-in { animation: fadeIn 0.4s ease-out; }
        .dash-layout { display: flex; flex-direction: column; gap: 20px; }
        .partner-bar { background: #fff; padding: 16px; border-radius: 20px; border: 1px solid #e5e5d1; display: flex; align-items: center; gap: 15px; cursor: pointer; }
        .p-icon { font-size: 2rem; }
        .p-text { display: flex; flex-direction: column; }
        .p-name { font-weight: 800; font-size: 1rem; color: #334148; }
        .p-status { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .logout-action { margin: 40px auto; display: flex; align-items: center; gap: 8px; color: #b56576; font-weight: 700; font-size: 0.9rem; opacity: 0.8; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

export default App;
