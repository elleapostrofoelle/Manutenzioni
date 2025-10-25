-- Assicurati che la colonna 'id' nella tabella 'sites' sia di tipo TEXT
ALTER TABLE sites
ALTER COLUMN id TYPE TEXT;

-- Assicurati che la colonna 'user_id' nella tabella 'sites' sia di tipo UUID
ALTER TABLE sites
ALTER COLUMN user_id TYPE UUID USING user_id::uuid; -- Aggiungi CAST se ci sono dati esistenti non UUID

-- Assicurati che la colonna 'id' nella tabella 'tasks' sia di tipo TEXT
ALTER TABLE tasks
ALTER COLUMN id TYPE TEXT;

-- Assicurati che la colonna 'user_id' nella tabella 'tasks' sia di tipo UUID
ALTER TABLE tasks
ALTER COLUMN user_id TYPE UUID USING user_id::uuid; -- Aggiungi CAST se ci sono dati esistenti non UUID

-- Assicurati che la colonna 'id' nella tabella 'users' sia di tipo UUID
-- Questa è la correzione più importante per l'errore persistente
ALTER TABLE users
ALTER COLUMN id TYPE UUID USING id::uuid; -- Aggiungi CAST se ci sono dati esistenti non UUID

-- Se avevi un default come gen_random_uuid() sulle colonne TEXT, rimuovilo.
-- Esegui questi comandi SOLO se avevi un default UUID su colonne che ora sono TEXT.
-- ALTER TABLE sites ALTER COLUMN id DROP DEFAULT;
-- ALTER TABLE tasks ALTER COLUMN id DROP DEFAULT;

-- Se avevi rimosso il default UUID dalla colonna 'users.id', potresti volerlo ripristinare
-- ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();