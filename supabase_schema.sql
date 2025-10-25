-- Inizia una transazione per assicurare che tutte le modifiche siano atomiche
BEGIN;

-- 1. Elimina tutte le policy RLS esistenti per evitare dipendenze
DROP POLICY IF EXISTS "Users can view their own sites." ON public.sites;
DROP POLICY IF EXISTS "Users can insert their own sites." ON public.sites;
DROP POLICY IF EXISTS "Users can update their own sites." ON public.sites;
DROP POLICY IF EXISTS "Users can delete their own sites." ON public.sites;

DROP POLICY IF EXISTS "Users can view their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks." ON public.tasks;

DROP POLICY IF EXISTS "Authenticated users can view all users." ON public.users;
DROP POLICY IF EXISTS "Users can create their own user profile." ON public.users;
DROP POLICY IF EXISTS "Users can update their own user profile." ON public.users;
DROP POLICY IF EXISTS "Users can delete their own user profile." ON public.users;

-- 2. Elimina i vincoli di chiave esterna che potrebbero fare riferimento a user_id
ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- 3. Elimina le colonne user_id se esistono, indipendentemente dal loro tipo attuale
ALTER TABLE public.sites DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS user_id;

-- 4. Aggiungi le colonne user_id con il tipo UUID corretto
ALTER TABLE public.sites ADD COLUMN user_id uuid;
ALTER TABLE public.tasks ADD COLUMN user_id uuid;

-- 5. Aggiungi i vincoli di chiave esterna
ALTER TABLE public.sites ADD CONSTRAINT sites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Rendi user_id NOT NULL in public.sites (se non lo è già E non ci sono valori NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sites' AND column_name='user_id' AND is_nullable='YES') THEN
        IF NOT EXISTS (SELECT 1 FROM public.sites WHERE user_id IS NULL) THEN
            ALTER TABLE public.sites ALTER COLUMN user_id SET NOT NULL;
        ELSE
            RAISE NOTICE 'Skipping SET NOT NULL for public.sites.user_id because NULL values exist. Please update existing rows after user registration.';
        END IF;
    END IF;
END
$$;

-- 7. Abilita Row Level Security (RLS) per public.sites
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- 8. Policy per 'sites' (con cast esplicito per massima sicurezza)
CREATE POLICY "Users can view their own sites." ON public.sites
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own sites." ON public.sites
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own sites." ON public.sites
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own sites." ON public.sites
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 9. Rendi user_id NOT NULL in public.tasks (se non lo è già E non ci sono valori NULL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='user_id' AND is_nullable='YES') THEN
        IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE user_id IS NULL) THEN
            ALTER TABLE public.tasks ALTER COLUMN user_id SET NOT NULL;
        ELSE
            RAISE NOTICE 'Skipping SET NOT NULL for public.tasks.user_id because NULL values exist. Please update existing rows after user registration.';
        END IF;
    END IF;
END
$$;

-- 10. Abilita Row Level Security (RLS) per public.tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 11. Policy per 'tasks' (con cast esplicito per massima sicurezza)
CREATE POLICY "Users can view their own tasks." ON public.tasks
  FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own tasks." ON public.tasks
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own tasks." ON public.tasks
  FOR UPDATE USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own tasks." ON public.tasks
  FOR DELETE USING (auth.uid()::uuid = user_id);


-- 12. Crea la tabella public.users se non esiste
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text NOT NULL
);

-- 13. Abilita Row Level Security (RLS) per public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 14. Policy per 'users'
CREATE POLICY "Authenticated users can view all users." ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own user profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own user profile." ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own user profile." ON public.users
  FOR DELETE USING (auth.uid() = id);

-- 15. Funzione per creare un profilo utente nella tabella 'public.users' dopo la registrazione in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (NEW.id, NEW.email, 'user'); -- Puoi impostare un nome e un ruolo di default
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Trigger per chiamare la funzione dopo l'inserimento in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Termina la transazione
COMMIT;