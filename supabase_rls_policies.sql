-- Policy per la tabella 'sites'
-- Abilita RLS per la tabella sites (se non già fatto tramite UI)
-- ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- 1. Permetti agli utenti autenticati di leggere i PROPRI siti
CREATE POLICY "Allow authenticated users to view their own sites"
ON sites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Permetti agli utenti autenticati di creare i PROPRI siti
CREATE POLICY "Allow authenticated users to create their own sites"
ON sites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Permetti agli utenti autenticati di aggiornare i PROPRI siti
CREATE POLICY "Allow authenticated users to update their own sites"
ON sites FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Permetti agli utenti autenticati di eliminare i PROPRI siti
CREATE POLICY "Allow authenticated users to delete their own sites"
ON sites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Policy per la tabella 'tasks'
-- Abilita RLS per la tabella tasks (se non già fatto tramite UI)
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 1. Permetti agli utenti autenticati di leggere i PROPRI task
CREATE POLICY "Allow authenticated users to view their own tasks"
ON tasks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Permetti agli utenti autenticati di creare i PROPRI task
CREATE POLICY "Allow authenticated users to create their own tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Permetti agli utenti autenticati di aggiornare i PROPRI task
CREATE POLICY "Allow authenticated users to update their own tasks"
ON tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Permetti agli utenti autenticati di eliminare i PROPRI task
CREATE POLICY "Allow authenticated users to delete their own tasks"
ON tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Policy per la tabella 'users' (risorse)
-- Abilita RLS per la tabella users (se non già fatto tramite UI)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Permetti agli utenti autenticati di leggere TUTTI gli utenti (necessario per assegnare i task)
CREATE POLICY "Allow authenticated users to view all users"
ON users FOR SELECT
TO authenticated
USING (true); -- 'true' significa che tutti gli utenti autenticati possono vedere tutte le righe

-- 2. Permetti agli utenti autenticati di creare il PROPRIO profilo utente
CREATE POLICY "Allow authenticated users to create their own user profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Permetti agli utenti autenticati di aggiornare il PROPRIO profilo utente
CREATE POLICY "Allow authenticated users to update their own user profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Permetti agli utenti autenticati di eliminare il PROPRIO profilo utente
CREATE POLICY "Allow authenticated users to delete their own user profile"
ON users FOR DELETE
TO authenticated
USING (auth.uid() = id);