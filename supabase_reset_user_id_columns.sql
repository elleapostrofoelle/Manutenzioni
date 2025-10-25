-- Elimina le policy esistenti che potrebbero fare riferimento a user_id
DROP POLICY IF EXISTS "Users can view their own sites." ON public.sites;
DROP POLICY IF EXISTS "Users can insert their own sites." ON public.sites;
DROP POLICY IF EXISTS "Users can update their own sites." ON public.sites;
DROP POLICY IF EXISTS "Users can delete their own sites." ON public.sites;

DROP POLICY IF EXISTS "Users can view their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks." ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks." ON public.tasks;

-- Elimina i vincoli di chiave esterna se esistono
ALTER TABLE public.sites DROP CONSTRAINT IF EXISTS sites_user_id_fkey;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;

-- Elimina la colonna user_id se esiste, indipendentemente dal tipo
ALTER TABLE public.sites DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS user_id;

-- Aggiungi la colonna user_id con il tipo UUID corretto
ALTER TABLE public.sites ADD COLUMN user_id uuid;
ALTER TABLE public.tasks ADD COLUMN user_id uuid;