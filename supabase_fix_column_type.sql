-- Elimina la colonna user_id dalla tabella 'sites' se esiste
ALTER TABLE public.sites DROP COLUMN IF EXISTS user_id;

-- Aggiungi la colonna user_id alla tabella 'sites' con il tipo UUID
ALTER TABLE public.sites ADD COLUMN user_id uuid;

-- Elimina la colonna user_id dalla tabella 'tasks' se esiste
ALTER TABLE public.tasks DROP COLUMN IF EXISTS user_id;

-- Aggiungi la colonna user_id alla tabella 'tasks' con il tipo UUID
ALTER TABLE public.tasks ADD COLUMN user_id uuid;