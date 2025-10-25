-- Aggiorna la tabella 'sites'
UPDATE public.sites
SET user_id = 'IL_TUO_USER_ID_QUI'
WHERE user_id IS NULL;

-- Aggiorna la tabella 'tasks'
UPDATE public.tasks
SET user_id = 'IL_TUO_USER_ID_QUI'
WHERE user_id IS NULL;