import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { SignalGrid } from './components/SignalGrid';
import { ChatRoom } from './components/ChatRoom';
import { ProfileEditor } from './components/ProfileEditor';
import { LockScreen } from './components/LockScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PartnerSummary } from './components/PartnerSummary';
import { requestNotificationPermission, sendLocalNotification } from './lib/notifications';
import { User, MessageSquare, Settings, Zap, Heart, Bell } from 'lucide-react';
import './App.css';

const SIGNALS_MAP = {
  ok: { label: 'Tudo bem', color: 'var(--color-safe)' },
  overwhelmed: { label: 'Sobrecarga', color: 'var(--color-primary)' },
  hug: { label: 'Abraço', color: 'var(--color-safe)' },
  'non-verbal': { label: 'Não-verbal', color: 'var(--color-secondary)' },
  crisis: { label: 'Crise Aguda', color: 'var(--color-critical)' }
};

const DUMMY_PARTNER = { id: 'dummy', name: 'Parceiro', nickname: 'Vida', icon: '🐨', doing_now: 'Configurando...' };

function App() {
  const [activeTab, setActiveTab] = useState('signals');
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerUser, setPartnerUser] = useState(null);
  const [signalsHistory, setSignalsHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [mySignal, setMySignal] = useState(null);
  const [partnerSignal, setPartnerSignal] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Check Auth (Lock & Identity)
  useEffect(() => {
    const lastUnlock = localStorage.getItem('last_unlock');
    if (lastUnlock) {
      const hoursPassed = (Date.now() - parseInt(lastUnlock)) / (1000 * 60 * 60);
      if (hoursPassed < 24) setIsLocked(false);
    }

    const savedUser = JSON.parse(localStorage.getItem('my_profile'));
    if (savedUser) setCurrentUser(savedUser);
    
    setLoading(false);
    requestNotificationPermission();
  }, []);

  // 2. Real-time Subscriptions (Supabase)
  useEffect(() => {
    if (!currentUser) return;

    // Fetch Initial Data
    const fetchData = async () => {
      // Profiles
      const { data: profiles } = await supabase.from('profiles').select('*');
      const partner = profiles?.find(p => p.id !== currentUser.id);
      if (partner) setPartnerUser(partner);

      // Latest Signals
      const { data: signals } = await supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(10);
      if (signals) {
        setSignalsHistory(signals.map(s => ({
          ...SIGNALS_MAP[s.status_id],
          timestamp: s.created_at
        })));
        const latestPartner = signals.find(s => s.user_id !== currentUser.id);
        if (latestPartner) setPartnerSignal(latestPartner.status_id);
      }

      // Messages
      const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(20);
      if (msgs) setMessages(msgs.reverse());
    };

    fetchData();

    // Real-time Channel
    const channel = supabase.channel('nossos-sinais-realtime')
      .on('postgres_changes', { event: 'INSERT', table: 'signals' }, (payload) => {
        if (payload.new.user_id !== currentUser.id) {
          setPartnerSignal(payload.new.status_id);
          sendLocalNotification("Novo Sinal de Vida ❤️", `O parceiro sinalizou: ${SIGNALS_MAP[payload.new.status_id]?.label}`);
        }
      })
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', table: 'profiles' }, (payload) => {
        if (payload.new.id !== currentUser.id) setPartnerUser(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const handleUnlock = () => {
    setIsLocked(false);
    localStorage.setItem('last_unlock', Date.now().toString());
  };

  const handleSetupComplete = async (user) => {
    setCurrentUser(user);
    localStorage.setItem('my_profile', JSON.stringify(user));
    // Save to DB
    await supabase.from('profiles').upsert(user);
  };

  const handleSignalSelect = async (signalId) => {
    setMySignal(signalId);
    await supabase.from('signals').insert({ user_id: currentUser.id, status_id: signalId });
  };

  const handleSendMessage = async (text) => {
    await supabase.from('messages').insert({ sender_id: currentUser.id, text });
  };

  const handleNudge = async () => {
    // Simple nudge by sending a system-like message
    await handleSendMessage("Ping! 💓 Como você está?");
    alert("Você enviou um carinho para o parceiro!");
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (isLocked) return <LockScreen onUnlock={handleUnlock} />;
  if (!currentUser) return <WelcomeScreen onComplete={handleSetupComplete} />;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Nossos Sinais</h1>
        <div className="header-actions">
           <Heart className="pulse-icon" size={24} color="#F56565" />
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'signals' && (
          <>
            <div className="partner-card active-pulse" onClick={() => setActiveTab('partner')}>
              <div className="profile-badge">
                {partnerUser?.icon || DUMMY_PARTNER.icon}
              </div>
              <span className="profile-name">{partnerUser?.name || DUMMY_PARTNER.name}</span>
              <span className="profile-nick">{partnerUser?.nickname || DUMMY_PARTNER.nickname}</span>
              {partnerSignal && SIGNALS_MAP[partnerSignal] && (
                <div className="partner-status-badge" style={{ color: SIGNALS_MAP[partnerSignal].color }}>
                   {SIGNALS_MAP[partnerSignal].label}
                </div>
              )}
            </div>

            <SignalGrid onSelect={handleSignalSelect} activeSignal={mySignal} />
          </>
        )}

        {activeTab === 'chat' && (
          <ChatRoom 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            currentUserId={currentUser.id} 
          />
        )}

        {activeTab === 'perfil' && (
          <ProfileEditor 
            profile={currentUser} 
            onSave={(u) => handleSetupComplete(u)} 
          />
        )}

        {activeTab === 'partner' && (
          <PartnerSummary 
            partner={partnerUser || DUMMY_PARTNER} 
            signals={signalsHistory.length > 0 ? signalsHistory : [{ label: 'Sem sinais recentes', color: 'var(--color-accent)', timestamp: new Date() }]}
            onNudge={handleNudge}
          />
        )}
      </main>

      <nav className="app-nav">
        <button className={activeTab === 'signals' ? 'active' : ''} onClick={() => setActiveTab('signals')}>
           <Zap size={20} /> <span>Sinais</span>
        </button>
        <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
           <MessageSquare size={20} /> <span>Chat</span>
        </button>
        <button className={activeTab === 'partner' ? 'active' : ''} onClick={() => setActiveTab('partner')}>
           <User size={20} /> <span>Vida</span>
        </button>
        <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}>
           <Settings size={20} /> <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
