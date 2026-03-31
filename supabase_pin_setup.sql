-- 22.1: ADICIONAR COLUNA DE PIN AO PERFIL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'pin') THEN
        ALTER TABLE public.profiles ADD COLUMN pin TEXT;
    END IF;
END $$;
