-- 21.1: TABELA DE NOTIFICAÇÕES PARA INTERAÇÕES ENTRE PARCEIROS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'nudge', -- 'nudge', 'connection_request', 'signal_update'
    status TEXT DEFAULT 'unread', -- 'unread', 'read'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuário só lê suas próprias notificações
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Qualquer usuário autenticado pode enviar uma notificação (INSERT)
CREATE POLICY "Users can insert notifications for others" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Política: Usuário pode marcar suas notificações como lidas (UPDATE)
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Adicionar coluna 'connection_status' opcional ao perfil para facilitar (opcional, mas cross-link já resolve)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'connection_status') THEN
        ALTER TABLE public.profiles ADD COLUMN connection_status TEXT DEFAULT 'none'; -- 'none', 'pending', 'connected'
    END IF;
END $$;
