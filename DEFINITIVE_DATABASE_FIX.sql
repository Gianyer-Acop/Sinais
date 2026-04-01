-- ==========================================
-- DEFINTIVE DATABASE FIX - NOSSASINAIS (V2 - PUSH & AUTOMATION REVISION)
-- ==========================================
-- Este script consolida TODA a estrutura do banco de dados e automação.

BEGIN;

-- 1. ESTRUTURA DE TABELAS
-- --------------------------------------------------

-- Tabela de Perfis (Atualizada com Push)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    nickname TEXT,
    icon TEXT DEFAULT '🐨',
    connection_code TEXT UNIQUE,
    partner_id UUID REFERENCES public.profiles(id),
    pin TEXT,
    lock_enabled BOOLEAN DEFAULT FALSE,
    theme_preference TEXT DEFAULT 'light',
    connection_status TEXT DEFAULT 'none',
    push_subscription JSONB, -- ADICIONADO PARA PWA PUSH
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir coluna caso a tabela já exista
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Tabela de Tipos de Sinais (Personalizados)
CREATE TABLE IF NOT EXISTS public.signal_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    icon_name TEXT DEFAULT 'Smile',
    color TEXT DEFAULT '#5e8c61',
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Sinais
CREATE TABLE IF NOT EXISTS public.signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_id TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela de Mensagens (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conversas (Assuntos)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT DEFAULT 'MessageCircle',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CONFIGURAÇÃO DE REALTIME
-- --------------------------------------------------
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles, 
    public.signals, 
    public.messages, 
    public.signal_types, 
    public.notifications, 
    public.conversations;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.signals REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.signal_types REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- 3. POLÍTICAS DE SEGURANÇA (RLS)
-- --------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Perfis
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Sinais e Tipos
DROP POLICY IF EXISTS "Partners can view shared signal types" ON public.signal_types;
CREATE POLICY "Partners can view shared signal types" ON public.signal_types FOR ALL USING (true); 

DROP POLICY IF EXISTS "Manage signals" ON public.signals;
CREATE POLICY "Manage signals" ON public.signals FOR ALL USING (auth.uid() = user_id OR auth.uid() = receiver_id);

-- Chat
DROP POLICY IF EXISTS "Manage messages" ON public.messages;
CREATE POLICY "Manage messages" ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notificações
DROP POLICY IF EXISTS "View own notifications" ON public.notifications;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Insert notifications" ON public.notifications;
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 4. FUNÇÕES DE AUTOMAÇÃO (O CÉREBRO)
-- --------------------------------------------------

-- A. Gatilho de Limpeza ao Deletar Conta
CREATE OR REPLACE FUNCTION public.handle_partner_deletion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles SET partner_id = NULL, connection_status = 'none' WHERE partner_id = OLD.id;
    DELETE FROM public.messages WHERE sender_id = OLD.id OR receiver_id = OLD.id;
    DELETE FROM public.signals WHERE user_id = OLD.id OR receiver_id = OLD.id;
    DELETE FROM public.notifications WHERE user_id = OLD.id OR sender_id = OLD.id;
    DELETE FROM public.conversations WHERE created_by = OLD.id OR partner_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_partner_deleted ON public.profiles;
CREATE TRIGGER on_partner_deleted BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_partner_deletion();

-- B. Gatilho de Notificação Automática (PUSH INTERNO)
CREATE OR REPLACE FUNCTION public.notify_partner_of_signal()
RETURNS TRIGGER AS $$
DECLARE
    partner_id_to_notify UUID;
    sender_name TEXT;
BEGIN
    -- Descobrir parceiro e nome
    SELECT p.partner_id INTO partner_id_to_notify FROM profiles p WHERE p.id = NEW.user_id;
    SELECT COALESCE(p.nickname, p.name, 'Seu parceiro') INTO sender_name FROM profiles p WHERE p.id = NEW.user_id;

    IF partner_id_to_notify IS NOT NULL THEN
        INSERT INTO notifications (user_id, sender_id, title, body, type)
        VALUES (partner_id_to_notify, NEW.user_id, sender_name || ' enviou um sinal', 'Dê uma olhada no status agora.', 'signal');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_signal_inserted ON public.signals;
CREATE TRIGGER on_signal_inserted AFTER INSERT ON public.signals FOR EACH ROW EXECUTE FUNCTION public.notify_partner_of_signal();

COMMIT;
