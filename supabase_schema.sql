-- Crea la tabella 'sites'
CREATE TABLE IF NOT EXISTS public.sites (
    id text PRIMARY KEY,
    name text NOT NULL,
    address text NOT NULL,
    manager jsonb,
    contactperson jsonb,
    landline text,
    othercontacts jsonb,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL -- Aggiunto user_id
);

-- Abilita Row Level Security (RLS) per la tabella 'sites'
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policy per 'sites'
CREATE POLICY "Users can view their own sites." ON public.sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sites." ON public.sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites." ON public.sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites." ON public.sites
  FOR DELETE USING (auth.uid() = user_id);

-- Crea la tabella 'tasks'
CREATE TABLE IF NOT EXISTS public.tasks (
    id text PRIMARY KEY,
    siteid text REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
    description text NOT NULL,
    duedate date NOT NULL,
    status text NOT NULL,
    assignees text[],
    type text NOT NULL,
    odlnumber text,
    startdate date,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL -- Aggiunto user_id
);

-- Abilita Row Level Security (RLS) per la tabella 'tasks'
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy per 'tasks'
CREATE POLICY "Users can view their own tasks." ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks." ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks." ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks." ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Crea la tabella 'users' (se non esiste già, altrimenti aggiorna)
-- Nota: la tabella auth.users è gestita da Supabase. Questa è per i profili utente aggiuntivi.
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    role text NOT NULL
);

-- Abilita Row Level Security (RLS) per la tabella 'users'
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy per 'users'
-- Gli utenti possono vedere tutti gli altri utenti (per l'assegnazione dei task)
CREATE POLICY "Authenticated users can view all users." ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Gli utenti possono creare il proprio profilo utente
CREATE POLICY "Users can create their own user profile." ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Gli utenti possono aggiornare il proprio profilo utente
CREATE POLICY "Users can update their own user profile." ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Gli utenti possono eliminare il proprio profilo utente
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