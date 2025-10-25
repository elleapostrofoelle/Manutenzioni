-- Aggiungi la colonna user_id alla tabella public.sites se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sites' AND column_name='user_id') THEN
        ALTER TABLE public.sites ADD COLUMN user_id uuid;
    END IF;
END
$$;

-- Aggiungi il vincolo di chiave esterna a public.sites.user_id se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sites_user_id_fkey' AND conrelid = 'public.sites'::regclass) THEN
        ALTER TABLE public.sites ADD CONSTRAINT sites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Rendi user_id NOT NULL in public.sites (se non lo è già E non ci sono valori NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sites' AND column_name='user_id' AND is_nullable='YES') THEN
        -- Controlla se ci sono valori NULL prima di tentare di impostare NOT NULL
        IF NOT EXISTS (SELECT 1 FROM public.sites WHERE user_id IS NULL) THEN
            ALTER TABLE public.sites ALTER COLUMN user_id SET NOT NULL;
        ELSE
            RAISE NOTICE 'Skipping SET NOT NULL for public.sites.user_id because NULL values exist. Please update existing rows after user registration.';
        END IF;
    END IF;
END
$$;

-- Abilita Row Level Security (RLS) per public.sites
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policy per 'sites'
DROP POLICY IF EXISTS "Users can view their own sites." ON public.sites;
CREATE POLICY "Users can view their own sites." ON public.sites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sites." ON public.sites;
CREATE POLICY "Users can insert their own sites." ON public.sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sites." ON public.sites;
CREATE POLICY "Users can update their own sites." ON public.sites
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sites." ON public.sites;
CREATE POLICY "Users can delete their own sites." ON public.sites
  FOR DELETE USING (auth.uid() = user_id);


-- Ripeti per public.tasks
-- Aggiungi la colonna user_id alla tabella public.tasks se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='user_id') THEN
        ALTER TABLE public.tasks ADD COLUMN user_id uuid;
    END IF;
END
$$;

-- Aggiungi il vincolo di chiave esterna a public.tasks.user_id se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_user_id_fkey' AND conrelid = 'public.tasks'::regclass) THEN
        ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Rendi user_id NOT NULL in public.tasks (se non lo è già E non ci sono valori NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='user_id' AND is_nullable='YES') THEN
        -- Controlla se ci sono valori NULL prima di tentare di impostare NOT NULL
        IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE user_id IS NULL) THEN
            ALTER TABLE public.tasks ALTER COLUMN user_id SET NOT NULL;
        ELSE
            RAISE NOTICE 'Skipping SET NOT NULL for public.tasks.user_id because NULL values exist. Please update existing rows after user registration.';
        END IF;
    END IF;
END
$$;

-- Abilita Row Level Security (RLS) per public.tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy per 'tasks'
DROP POLICY IF EXISTS "Users can view their own tasks." ON public.tasks;
CREATE POLICY "Users can view their own tasks." ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks." ON public.tasks;
CREATE POLICY "Users can insert their own tasks." ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks." ON public.tasks;
CREATE POLICY "Users can update their own tasks." ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks." ON public.tasks;
CREATE POLICY "Users can delete their own tasks." ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);


-- Crea la tabella public.users se non esiste
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text NOT NULL
);

-- Abilita Row Level Security (RLS) per public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy per 'users'
DROP POLICY IF EXISTS "Authenticated users can view all users." ON public.users;
CREATE POLICY "Authenticated users can view all users." ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create their own user profile." ON public.users;
CREATE POLICY "Users can create their own user profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own user profile." ON public.users;
CREATE POLICY "Users can update their own user profile." ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own user profile." ON public.users;
CREATE POLICY "Users can delete their own user profile." ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Funzione per creare un profilo utente nella tabella 'public.users' dopo la registrazione in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (NEW.id, NEW.email, 'user'); -- Puoi impostare un nome e un ruolo di default
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per chiamare la funzione dopo l'inserimento in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();