import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
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
import { WelcomeTour } from './components/WelcomeTour';
import { CustomModal } from './components/CustomModal';
import { SignalManager } from './components/SignalManager';
import { requestNotificationPermission, sendLocalNotification } from './lib/notifications';
import { User, MessageSquare, Settings, Zap, Heart, LogOut, Lock } from 'lucide-react';
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
  const signalsHistoryRef = useRef([]);
  const signalTypesRef = useRef([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [signalTypes, setSignalTypes] = useState([]);
  const [mySignal, setMySignal] = useState(null);
  const [partnerSignal, setPartnerSignal] = useState(null);
  const [isLocked, setIsLocked] = useState(localStorage.getItem('app_lock_enabled') === 'true');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [signalsHistory, setSignalsHistory] = useState([]);
  const [showTour, setShowTour] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSignalManagerGlobally, setShowSignalManagerGlobally] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [modalConfig, setModalConfig] = useState({ show: false });
  const [refreshCounter, setRefreshCounter] = useState(0);

  const currentUserRef = useRef(currentUser);
  const partnerIdRef = useRef(currentUser?.partner_id);

  // 0. Sincronizar Refs para uso em Listeners (Realtime)
  useEffect(() => {
    currentUserRef.current = currentUser;
    partnerIdRef.current = currentUser?.partner_id;
  }, [currentUser]);

  useEffect(() => {
    signalTypesRef.current = signalTypes;
  }, [signalTypes]);

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

  const [needRefresh, setNeedRefresh] = useState(false);
  const swRegistrationRef = useRef(null);

  // Lógica Manual de Detecção de Versão PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 1. Verificar se já existe um worker esperando (Waiting)
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          swRegistrationRef.current = reg;
          if (reg.waiting) setNeedRefresh(true);
          
          // 2. Escutar por novos workers que cheguem a "Installed"
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedRefresh(true);
                }
              });
            }
          });
        }
      });

      // 3. Quando o novo worker assumir (SKIP_WAITING), recarregar a página
      let isRefreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isRefreshing) return;
        isRefreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const handleUpdateApp = () => {
     if (swRegistrationRef.current && swRegistrationRef.current.waiting) {
        swRegistrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
     } else {
        // Fallback: se não estiver waiting por algum motivo, apenas recarrega
        window.location.reload();
     }
  };

  const addToast = (title, body, icon) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, body, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const showModal = (config) => {
    return new Promise((resolve) => {
      setModalConfig({
        ...config,
        show: true,
        onConfirm: (value) => {
          setModalConfig({ show: false });
          resolve(value);
        },
        onCancel: () => {
          setModalConfig({ show: false });
          resolve(null);
        }
      });
    });
  };
 
  // 19.9: Garantir que o tour comece assim que o usuário tiver um nome e estiver no layout principal
  useEffect(() => {
    if (currentUser?.id && currentUser?.name) {
      if (!localStorage.getItem(`tour_completed_${currentUser.id}`)) {
        // Pequeno delay para garantir que os elementos do DOM estejam renderizados
        const t = setTimeout(() => setShowTour(true), 1200);
        return () => clearTimeout(t);
      }
    }
  }, [!!currentUser?.name, currentUser?.id]);

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
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Caso 1: Usuário autênticado mas Sem Perfil (ex: conta deletada em outro device)
      if (error && error.code === 'PGRST116') {
        console.log("Perfil não encontrado. Tentando recriar para:", userId);
        const { data: { user } } = await supabase.auth.getUser();
        const codeFromMeta = user?.user_metadata?.connection_code || Math.floor(100000 + Math.random() * 900000).toString();
        
        const { data: newProfile, error: insError } = await supabase
          .from('profiles')
          .insert({ id: userId, connection_code: codeFromMeta })
          .select()
          .single();
          
        if (insError) {
           console.error("Erro ao recriar perfil:", insError);
           // Se não conseguir criar o perfil, forçamos logout para não travar no loading
           await supabase.auth.signOut();
           return;
        }
        profile = newProfile;
        await initializeDefaultSignals(userId);
      } else if (error) {
        console.error("Erro ao buscar perfil:", error);
        // Erros de conexão ou outros: não travamos se houver falha crítica
      } else if (profile && !profile.connection_code) {
        // Garantir código de conexão
        const { data: { user } } = await supabase.auth.getUser();
        const codeFromMeta = user?.user_metadata?.connection_code || Math.floor(100000 + Math.random() * 900000).toString();
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .update({ connection_code: codeFromMeta })
          .eq('id', userId)
          .select()
          .single();
        if (updatedProfile) profile = updatedProfile;
      }

      if (profile) {
        setCurrentUser(profile);
      } else {
        // Se após tudo isso não temos perfil, deslogamos
        console.warn("Sessão sem perfil e falha na criação. Deslogando...");
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Erro crítico no fetchProfile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App visível - Atualizando conexão...');
        fetchProfile(session?.user?.id);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      const partnerId = currentUser.partner_id;
      
      if (partnerId) {
        const { data: partner } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
        if (partner) setPartnerUser(partner);
      } else {
        setPartnerUser(null);
        setPartnerSignal(null);
      }

      const now = new Date();
      const lastMark = new Date(now);
      lastMark.setHours(now.getHours() < 12 ? 0 : 12, 0, 0, 0);

      const { data: stypes } = await supabase.from('signal_types')
        .select('*')
        .or(`created_by.eq.${currentUser.id}${partnerId ? `,created_by.eq.${partnerId}` : ''}`)
        .order('created_at', { ascending: true });

      if (stypes) {
        // UNIFICAÇÃO: Remover duplicatas de nomes (labels) para o Grid
        const uniqueTypes = [];
        const labelsSeen = new Set();
        stypes.forEach(t => {
          if (!labelsSeen.has(t.label)) {
            uniqueTypes.push(t);
            labelsSeen.add(t.label);
          }
        });
        setSignalTypes(uniqueTypes);

        // Garantir sinais padrão se a lista estiver realmente vazia (sem sinais próprios e sem sinais do parceiro herdados)
        if (uniqueTypes.length === 0 && currentUser?.id) {
           // Checagem extra no DB para evitar RACE CONDITION
           const { data: existingCheck } = await supabase.from('signal_types').select('id').eq('created_by', currentUser.id);
           if (!existingCheck || existingCheck.length === 0) {
             console.log("Inicializando sinais padrão para:", currentUser.id);
             await initializeDefaultSignals(currentUser.id, partnerId);
             const { data: retry } = await supabase.from('signal_types')
               .select('*')
               .or(`created_by.eq.${currentUser.id}${partnerId ? `,created_by.eq.${partnerId}` : ''}`)
               .order('created_at', { ascending: true });
             if (retry) {
                const uniqueRetry = [];
                const retryLabels = new Set();
                retry.forEach(r => { if(!retryLabels.has(r.label)) { uniqueRetry.push(r); retryLabels.add(r.label); } });
                setSignalTypes(uniqueRetry);
             }
           }
        }
      }

      const { data: signals } = await supabase.from('signals')
        .select('*')
        .or(`and(user_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(user_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .gte('created_at', lastMark.toISOString())
        .order('created_at', { ascending: false });

      if (signals) {
        const h = signals.map(s => {
          // Procurar o tipo correspondente na lista completa de stypes (não apenas os únicos do grid)
          const customType = (stypes || []).find(t => t.id === s.status_id);
          const resolved = customType
            ? { label: customType.label, color: customType.color }
            : (SIGNALS_MAP[s.status_id] || { label: 'Sinal Personalizado', color: 'var(--color-primary)' });
          return { ...resolved, timestamp: s.created_at, user_id: s.user_id };
        });
        setSignalsHistory(h);
        
        if (partnerId) {
          const lPart = signals.find(s => s.user_id === partnerId);
          if (lPart) setPartnerSignal(lPart.status_id);
        }
      }

      const { data: convs } = await supabase.from('conversations')
        .select('*')
        .order('created_at', { ascending: false });
      if (convs) setConversations(convs);

      const { data: msgs } = await supabase.from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (msgs) setMessages(msgs.reverse());
    };

    fetchData();
  }, [currentUser?.id, currentUser?.partner_id, refreshCounter]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const myId = currentUser.id;
    const pId = currentUser.partner_id;

    console.log("Reiniciando Canal Realtime para:", { myId, pId });

    const channel = supabase.channel(`realtime-v4-${myId}`)
      .on('postgres_changes', { event: '*', table: 'signals' }, (p) => {
        console.log("Realtime: Sinal recebido:", p);
        if (p.eventType === 'INSERT') {
          // Função rápida de mapeamento usando Ref para evitar capturar state antigo no listener
          const mapSignal = (id) => {
            const found = signalTypesRef.current.find(t => t.id === id);
            if (found) return { label: found.label, color: found.color };
            return SIGNALS_MAP[id] || { label: 'Sinal Enviado', color: 'var(--color-primary)' };
          };

          if (p.new.user_id === pId) {
            setPartnerSignal(p.new.status_id);
            const { label: signalLabel } = mapSignal(p.new.status_id);
            const partnerName = partnerUser?.nickname || partnerUser?.name || 'Seu Amor';
            sendLocalNotification(`Sinal de ${partnerName}`, signalLabel);
            addToast(`Sinal de ${partnerName}`, `Seu amor está: ${signalLabel}`, '🍃');
            setSignalsHistory(prev => [{ label: signalLabel, color: mapSignal(p.new.status_id).color, timestamp: p.new.created_at, user_id: p.new.user_id }, ...prev].slice(0, 20));
          } else if (p.new.user_id === myId) {
            setMySignal(p.new.status_id);
            const mapped = mapSignal(p.new.status_id);
            setSignalsHistory(prev => [{...mapped, timestamp: p.new.created_at, user_id: p.new.user_id}, ...prev].slice(0, 20));
          }
        }
        setRefreshCounter(prev => prev + 1);
      })
      .on('postgres_changes', { event: '*', table: 'notifications' }, (p) => {
        console.log("Realtime: Notificação recebida:", p);
        if (p.eventType === 'INSERT' && (p.new.user_id === myId)) {
          sendLocalNotification(p.new.title, p.new.body);
          addToast(p.new.title, p.new.body, '🔔');
        }
        setRefreshCounter(prev => prev + 1);
      })
      .on('postgres_changes', { event: '*', table: 'messages' }, (p) => {
        console.log("Realtime: Mensagem recebida:", p);
        if (p.eventType === 'INSERT') {
          setMessages(prev => [...prev, p.new]);
          if (p.new.sender_id === pId) {
            sendLocalNotification("Nova Mensagem", p.new.text);
            addToast("Mensagem", p.new.text, '💬');
          }
        }
        setRefreshCounter(prev => prev + 1);
      })
      .on('postgres_changes', { event: '*', table: 'profiles' }, (p) => {
        console.log("Realtime: Perfil alterado:", p);
        // Se o meu perfil mudou (o banco pode ter limpado o partner_id via trigger)
        // ou se o perfil do meu parceiro mudou
        const isMe = p.new?.id === myId || p.old?.id === myId;
        const isPartner = (pId && (p.new?.id === pId || p.old?.id === pId));

        if (isMe || isPartner) {
          console.log("Sincronizando perfil devido a mudança atômica...");
          fetchProfile(myId);
          setRefreshCounter(prev => prev + 1);
        }
      })
      .on('postgres_changes', { event: '*', table: 'signal_types' }, (p) => {
        console.log("Realtime: Tipos de sinais alterados");
        setRefreshCounter(prev => prev + 1);
      })
      .subscribe((status) => {
        console.log(`Status do Canal Realtime: ${status}`);
      });

    return () => {
      console.log("Limpando Canal Realtime antigo...");
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, currentUser?.partner_id]);

  const handleUnlock = () => { setIsLocked(false); localStorage.setItem('last_unlock', Date.now().toString()); };
  const handleLock = () => {
    if (!currentUser?.pin) {
      showModal({ 
        title: 'PIN não definido', 
        message: 'Você precisa definir um PIN de 4 dígitos na aba "Eu" antes de poder bloquear o app e garantir sua privacidade.', 
        type: 'info' 
      });
      return;
    }
    setIsLocked(true); 
  };
  const handleLogout = async () => { await supabase.auth.signOut(); localStorage.removeItem('last_unlock'); setIsLocked(true); setIsDeleting(false); };

  const handleSignalSelect = async (statusId) => {
    try {
      const { error } = await supabase.from('signals').insert({
        user_id: currentUser?.id,
        receiver_id: currentUser?.partner_id,
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
          theme_preference: formData.theme_preference,
          pin: formData.pin,
          lock_enabled: formData.lock_enabled
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      
       fetchProfile(currentUser.id);
    } catch (err) {
      showModal({ title: 'Ops!', message: "Erro ao salvar: " + err.message, type: 'error' });
    }
  };

   const handleDeleteAccount = async () => {
    try {
      const pin = await showModal({ 
        title: 'Confirmar Exclusão', 
        message: 'Por segurança, digite seu PIN para confirmar a exclusão permanente de sua conta:', 
        type: 'prompt',
        confirmText: 'Excluir Vitaliciamente'
      });
      
      const savedPin = currentUser?.pin || '1234';
      if (!pin) return;
      if (pin !== savedPin) {
        showModal({ title: 'PIN Incorreto', message: `O PIN informado não confere. ${!currentUser?.pin ? '(Dica: Se não definiu um, tente 1234)' : ''}`, type: 'error' });
        return;
      }

      setFadingOut(true);
      const { error } = await supabase.from('profiles').delete().eq('id', currentUser.id);
      if (error) throw error;
      
      showModal({ 
        title: 'Adeus, Amor! ❤️', 
        message: 'Sua conta e todos os seus dados foram apagados permanentemente com carinho.', 
        type: 'success' 
      });
      
      setTimeout(async () => {
        await supabase.auth.signOut();
        setFadingOut(false);
      }, 2000);
    } catch (err) {
      setFadingOut(false);
      showModal({ title: 'Erro ao Apagar', message: err.message, type: 'error' });
    }
  };

  const handleSendMessage = async (text) => {
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser?.id,
        receiver_id: currentUser?.partner_id,
        text: text.trim()
      });
      if (error) throw error;
     } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      showModal({ title: 'Erro no Chat', message: "Não foi possível enviar a mensagem.", type: 'error' });
    }
  };

  const handleLoadPreviousMessages = async () => {
    if (messages.length === 0) return;
    const oldestMessage = messages[0];
    const partnerId = currentUser?.partner_id;
    try {
      const { data: olderMsgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
       if (olderMsgs && olderMsgs.length > 0) {
        setMessages(prev => [...olderMsgs.reverse(), ...prev]);
      } else {
        showModal({ title: 'Fim do Histórico', message: "Não há mais mensagens para carregar.", type: 'info' });
      }
    } catch (err) {
      console.error("Erro ao carregar anteriores:", err);
    }
  };

  const handleAddSignalType = async (type) => {
    try {
      const { data, error } = await supabase.from('signal_types').insert({
        ...type,
        created_by: currentUser.id,
        partner_id: currentUser.partner_id
      }).select().single();

      if (error) throw error;
      if (data) setSignalTypes(prev => [...prev, data]);
    } catch (err) { console.error("Erro ao criar sinal:", err); }
  };

  const handleUpdateSignalType = async (type) => {
    try {
      const { error } = await supabase.from('signal_types').update(type).eq('id', type.id);
      if (error) throw error;
      setSignalTypes(prev => prev.map(s => s.id === type.id ? { ...s, ...type } : s));
    } catch (err) { console.error("Erro ao atualizar sinal:", err); }
  };

  const handleDeleteSignalType = async (id) => {
    try {
      const { error } = await supabase.from('signal_types').delete().eq('id', id);
      if (error) throw error;
      setSignalTypes(prev => prev.filter(s => s.id !== id));
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
      if (data) setConversations(prev => [data, ...prev]);
      return data;
     } catch (err) {
      console.error("Erro ao criar conversa:", err);
      showModal({ title: 'Erro ao Criar', message: "Não foi possível criar o novo assunto: " + err.message, type: 'error' });
      return null;
    }
  };


  const initializeDefaultSignals = async (userId, partnerId = null) => {
    const defaults = [
      { label: 'Estou bem', icon_name: 'Smile', color: '#84a98c' },
      { label: 'Sobrecarga', icon_name: 'Zap', color: '#d6ba73' },
      { label: 'Abraço', icon_name: 'Heart', color: '#b56576' },
      { label: 'Não-verbal', icon_name: 'MessageSquareOff', color: '#6d9dc5' },
      { label: 'Crise Aguda', icon_name: 'AlertCircle', color: '#ef4444' }
    ];

    try {
      // 1. Buscar sinais já existentes para este usuário
      const { data: existing } = await supabase
        .from('signal_types')
        .select('label')
        .eq('created_by', userId);
      
      const existingLabels = new Set((existing || []).map(s => s.label));

      // 2. Inserir apenas os que não existem
      for (const s of defaults) {
        if (!existingLabels.has(s.label)) {
          await supabase.from('signal_types').insert({
            ...s,
            created_by: userId,
            partner_id: partnerId
          });
        }
      }
    } catch (err) {
      console.error("Erro ao inicializar sinais padrão:", err);
    }
  };

  const handleRestoreDefaults = async () => {
    const confirm = await showModal({
      title: 'Restaurar Padrões?',
      message: 'Isso adicionará os 5 sinais originais à sua lista atual. Deseja continuar?',
      type: 'confirm'
    });
    if (confirm) {
      await initializeDefaultSignals(currentUser.id, currentUser.partner_id);
      addToast("Sucesso", "Sinais padrão restaurados!", '✨');
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
        receiver_id: currentUser?.partner_id,
        text: nudgeText
      });
       if (error) throw error;
      showModal({ title: 'Carinho Enviado!', message: "Seu amor vai receber seu carinho agora mesmo! ❤️", type: 'success' });
    } catch (err) {
      console.error("Erro no carinho:", err);
    }
  };

  const handlePairBiometrics = async () => {
    try {
      if (!window.isSecureContext || !window.PublicKeyCredential) {
        showModal({ title: 'Indisponível', message: "A biometria requer uma conexão segura (HTTPS).", type: 'error' });
        return;
      }

      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userIdStr = currentUser?.id || 'default';
      const userId = new TextEncoder().encode(userIdStr.slice(0, 16).padEnd(16, '0'));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { id: window.location.hostname, name: "Nossos Sinais" },
          user: {
            id: userId,
            name: currentUser?.name || "usuario",
            displayName: currentUser?.nickname || "Amor"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred"
          },
          timeout: 60000
        }
      });

      if (credential) {
        const rawId = new Uint8Array(credential.rawId);
         const base64Id = btoa(String.fromCharCode(...rawId));
        localStorage.setItem('biometric_paired', 'true');
        localStorage.setItem('biometric_credential_id', base64Id);
        showModal({ title: 'Sucesso!', message: "Biometria vinculada! 🎉 Da próxima vez use sua digital na tela de bloqueio.", type: 'success' });
      }
    } catch (err) {
      console.error(err);
       if (err.name === 'InvalidStateError') {
        localStorage.setItem('biometric_paired', 'true');
        showModal({ title: 'Já Configurado', message: "Biometria já estava configurada neste dispositivo! 👍", type: 'info' });
      } else if (err.name !== 'NotAllowedError') {
        showModal({ title: 'Erro de Biometria', message: "Erro ao vincular: " + err.message, type: 'error' });
      }
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const isPaired = localStorage.getItem('biometric_paired') === 'true';
      if (!isPaired || !window.isSecureContext || !window.PublicKeyCredential) return false;

      const challenge = window.crypto.getRandomValues(new Uint8Array(32));

      const base64Id = localStorage.getItem('biometric_credential_id');
      const allowCredentials = base64Id ? [{
        type: "public-key",
        id: Uint8Array.from(atob(base64Id), c => c.charCodeAt(0)).buffer,
        transports: ["internal"]
      }] : [];

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          allowCredentials
        }
      });

      if (assertion) {
        handleUnlock();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  if (loading) return <LoadingScreen />;
  if (isDeleting) return <LoadingScreen message="Apagando seus dados permanentemente... 🌳" />;
  if (!session) return <AuthScreen onAuthSuccess={(u) => fetchProfile(u.id)} showModal={showModal} />;

  console.log("Estado Atual:", { hasUser: !!currentUser, name: currentUser?.name, partnerId: currentUser?.partner_id, hasPartnerData: !!partnerUser });

  if (isLocked && currentUser?.pin) return <LockScreen onUnlock={handleUnlock} onBiometricUnlock={handleBiometricUnlock} showModal={showModal} />;

  // Roteamento de Onboarding
  if (!currentUser) return <LoadingScreen />;

  // 1. Novo usuário sem nome → ir para profile (sem travar o app)
  // Fazemos isso setando a aba automaticamente, mas não bloqueamos a renderização
  // A aba 'perfil' terá o ProfileSetupScreen integrado
  if (!currentUser.name) {
    return <ProfileSetupScreen onSave={async (data) => { await handleSaveProfile(data); setActiveTab('signals'); }} showModal={showModal} />;
  }

  // 2. Sem parceiro vinculado → app abre normalmente, Vida mostra painel de vínculo
  // (Sem tela bloqueante)

  return (
    <div className={`app-container ${fadingOut ? 'fade-out-active' : ''}`}>
      {fadingOut && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', animation: 'fadeInApp 0.8s ease-in-out forwards' }}>
           <LoadingScreen message="Sincronizando despedida... ❤️" />
        </div>
      )}
      <header className="app-header">
        <h1>Nossos Sinais</h1>
        <div className="header-actions">
          {currentUser?.lock_enabled && (
            <button
              className="lock-btn-header"
              onClick={handleLock}
              title="Bloquear app"
              aria-label="Bloquear"
            >
              <Lock size={18} />
            </button>
          )}
          <img src="/nosso_mascote_final.png" alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        </div>
      </header>

      {needRefresh && (
        <div className="pwa-update-banner">
          <div className="update-text">
            <strong>✨ Nova versão disponível!</strong>
            <span>Atualize para ter as últimas melhorias.</span>
          </div>
          <button className="update-action-btn" onClick={handleUpdateApp}>
             Atualizar Agora
          </button>
        </div>
      )}

      <main className="app-main">
        {showSignalManagerGlobally ? (
          <div className="tab-fade-in">
             <SignalManager 
                signalTypes={signalTypes}
                onAdd={handleAddSignalType}
                onSave={handleUpdateSignalType}
                onDelete={handleDeleteSignalType}
                onRestore={handleRestoreDefaults}
                showModal={showModal}
                onClose={() => setShowSignalManagerGlobally(false)}
              />
          </div>
        ) : (
          <>
            {activeTab === 'signals' && (
              <div className="tab-fade-in dash-layout">
                <div className="partner-bar" onClick={() => setActiveTab('partner')}>
                  <span className="p-icon">{partnerUser?.icon || '🐨'}</span>
                  <div className="p-text">
                    <span className="p-name">{partnerUser?.nickname || partnerUser?.name || 'Parceiro'}</span>
                    {partnerSignal && (
                      <span className="p-status" style={{ color: (signalTypes.find(t => t.id === partnerSignal) || SIGNALS_MAP[partnerSignal] || { color: 'var(--color-primary)' }).color }}>
                        {(signalTypes.find(t => t.id === partnerSignal) || SIGNALS_MAP[partnerSignal] || { label: 'Enviando...' }).label}
                      </span>
                    )}
                  </div>
                </div>
                <SignalGrid onSelect={handleSignalSelect} signalTypes={signalTypes} activeSignal={mySignal} />
                <button className="manage-signals-btn-main" onClick={() => setShowSignalManagerGlobally(true)}>
                  <Settings size={16} /> <span>Personalizar Sinais</span>
                </button>
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
                  showModal={showModal}
                />
              </div>
            )}

            {activeTab === 'perfil' && (
              <div className="tab-fade-in">
                <ProfileEditor
                  profile={currentUser}
                  onSave={handleSaveProfile}
                  signalTypes={signalTypes}
                  onAdd={handleAddSignalType}
                  onUpdateSignal={handleUpdateSignalType}
                  onDeleteSignal={handleDeleteSignalType}
                  onRestoreSignals={handleRestoreDefaults}
                   onDeleteAccount={handleDeleteAccount}
                  onPairBiometrics={handlePairBiometrics}
                  showModal={showModal}
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
                  userProfile={currentUser}
                  onComplete={() => { fetchProfile(currentUser.id); setRefreshCounter(prev => prev + 1); }}
                  showModal={showModal}
                  refreshCounter={refreshCounter}
                />
              </div>
            )}
          </>
        )}
      </main>

      <nav className="app-nav">
        <button className={activeTab === 'signals' ? 'active' : ''} onClick={() => setActiveTab('signals')}><Zap size={22} /> <span>Sinais</span></button>
        <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}><MessageSquare size={22} /> <span>Chat</span></button>
        <button className={activeTab === 'partner' ? 'active' : ''} onClick={() => setActiveTab('partner')}><User size={22} /> <span>Vida</span></button>
        <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}><Settings size={22} /> <span>Eu</span></button>
      </nav>

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

       {showTour && (
        <WelcomeTour
          onFinish={() => {
            setShowTour(false);
            localStorage.setItem(`tour_completed_${currentUser.id}`, 'true');
          }}
          onTabChange={(tab) => setActiveTab(tab)}
          hasPartner={!!currentUser?.partner_id}
          lockEnabled={!!currentUser?.lock_enabled}
        />
      )}

      <CustomModal {...modalConfig} />

      <style dangerouslySetInnerHTML={{
        __html: `
        .manage-signals-btn-main {
          width: 100%; margin-top: 15px; padding: 16px; border-radius: 20px;
          border: 2px dashed var(--color-accent); background: #fff;
          color: var(--color-secondary); font-weight: 800; font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          cursor: pointer; transition: all 0.2s;
        }
        .manage-signals-btn-main:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .manage-signals-btn-main:active { transform: scale(0.98); background: var(--bg-primary); }

        .tab-fade-in { animation: fadeInApp 0.4s ease-out; }
        .dash-layout { display: flex; flex-direction: column; gap: 20px; }
        .partner-bar { background: #fff; padding: 16px; border-radius: 20px; border: 1px solid #e5e5d1; display: flex; align-items: center; gap: 15px; cursor: pointer; }
        .p-icon { font-size: 2rem; }
        .p-text { display: flex; flex-direction: column; }
        .p-name { font-weight: 800; font-size: 1rem; color: #334148; }
        .p-status { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .logout-action { margin: 40px auto; display: flex; align-items: center; gap: 8px; color: #b56576; font-weight: 700; font-size: 0.9rem; opacity: 0.8; }
        @keyframes fadeInApp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}} />
    </div>
  );
}

export default App;
