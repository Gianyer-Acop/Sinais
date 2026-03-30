-- ARQUIVO DE MIGRAÇÃO: ÍCONES EM CONVERSAS (V18.1)

-- 1. Adicionar coluna de ícone à tabela de conversas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'icon') THEN
        ALTER TABLE public.conversations ADD COLUMN icon TEXT DEFAULT 'MessageCircle';
    END IF;
END $$;

-- 2. Garantir que as permissões de RLS estejam ativas para as conversas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Manage conversations with partner') THEN
        CREATE POLICY "Manage conversations with partner" ON public.conversations
            FOR ALL USING (
                auth.uid() = created_by OR 
                auth.uid() = partner_id
            )
            WITH CHECK (
                auth.uid() = created_by OR 
                auth.uid() = partner_id
            );
    END IF;
END $$;
