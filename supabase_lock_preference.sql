-- 23.1: ADICIONAR COLUNA DE PREFERÊNCIA DE BLOQUEIO AO PERFIL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'lock_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN lock_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
