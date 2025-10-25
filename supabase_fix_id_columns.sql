-- Modifica la colonna 'id' nella tabella 'sites' a TEXT
ALTER TABLE sites
ALTER COLUMN id TYPE TEXT;

-- Se la colonna 'id' aveva un valore predefinito UUID, rimuovilo
-- Esegui questo comando SOLO se avevi un default come gen_random_uuid()
-- ALTER TABLE sites ALTER COLUMN id DROP DEFAULT;

-- Modifica la colonna 'id' nella tabella 'users' a TEXT
ALTER TABLE users
ALTER COLUMN id TYPE TEXT;

-- Se la colonna 'id' aveva un valore predefinito UUID, rimuovilo
-- Esegui questo comando SOLO se avevi un default come gen_random_uuid()
-- ALTER TABLE users ALTER COLUMN id DROP DEFAULT;

-- Modifica la colonna 'id' nella tabella 'tasks' a TEXT
ALTER TABLE tasks
ALTER COLUMN id TYPE TEXT;

-- Se la colonna 'id' aveva un valore predefinito UUID, rimuovilo
-- Esegui questo comando SOLO se avevi un default come gen_random_uuid()
-- ALTER TABLE tasks ALTER COLUMN id DROP DEFAULT;

-- Nota: Le colonne 'user_id' (es. in 'sites' e 'tasks') dovrebbero rimanere di tipo UUID,
-- poiché memorizzano gli ID utente di Supabase che sono UUID validi.