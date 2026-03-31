-- 27.1: GARANTIR PUBLICAÇÃO E RÉPLICA TOTAL PARA REALTIME INSTANTÂNEO
BEGIN;
  -- Forçar a inclusão das tabelas na publicação do Supabase
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles, 
    public.signals, 
    public.messages, 
    public.signal_types, 
    public.notifications, 
    public.conversations;
    
  -- Garantir que as exclusões incluam o ID do registro antigo
  ALTER TABLE public.profiles REPLICA IDENTITY FULL;
  ALTER TABLE public.signals REPLICA IDENTITY FULL;
  ALTER TABLE public.messages REPLICA IDENTITY FULL;
  ALTER TABLE public.signal_types REPLICA IDENTITY FULL;
  ALTER TABLE public.notifications REPLICA IDENTITY FULL;
  ALTER TABLE public.conversations REPLICA IDENTITY FULL;
COMMIT;
