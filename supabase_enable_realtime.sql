-- 26.1: HABILITAR O ENVIO DE EVENTOS REALTIME PARA AS TABELAS DO APP
-- Sem isso, o Supabase não avisa o site quando ocorrem mudanças no banco
BEGIN;
  -- Remover para garantir que estamos criando de forma limpa (opcional, dependendo do ambiente)
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Criar a publicação para as tabelas que o app precisa ouvir ao vivo
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles, 
    public.signals, 
    public.messages, 
    public.signal_types, 
    public.notifications, 
    public.conversations;
    
  -- Garantir REPLICA IDENTITY FULL em todas elas para que o App saiba 'quem' mudou em exclusões
  ALTER TABLE public.profiles REPLICA IDENTITY FULL;
  ALTER TABLE public.signals REPLICA IDENTITY FULL;
  ALTER TABLE public.messages REPLICA IDENTITY FULL;
  ALTER TABLE public.signal_types REPLICA IDENTITY FULL;
  ALTER TABLE public.notifications REPLICA IDENTITY FULL;
  ALTER TABLE public.conversations REPLICA IDENTITY FULL;
COMMIT;
