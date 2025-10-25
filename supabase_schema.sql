-- Elimina le tabelle esistenti se presenti (solo per sviluppo/test, fai attenzione in produzione!)
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.sites CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create the 'sites' table
CREATE TABLE public.sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    manager JSONB, -- Stores manager contact info as JSON
    contactPerson JSONB, -- Stores contact person info as JSON
    landline TEXT,
    otherContacts JSONB -- Stores an array of other contacts as JSON
);

-- Enable Row Level Security (RLS) for 'sites'
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policies for 'sites'
CREATE POLICY "Allow public read access to sites" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage sites" ON public.sites
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- For anonymous inserts/updates (if needed, otherwise remove)
CREATE POLICY "Allow anonymous inserts on sites" ON public.sites
    FOR INSERT
    WITH CHECK (true);
CREATE POLICY "Allow anonymous updates on sites" ON public.sites
    FOR UPDATE
    USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous deletes on sites" ON public.sites
    FOR DELETE
    USING (true);


-- Create the 'users' table
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL
);

-- Enable Row Level Security (RLS) for 'users'
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for 'users'
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage users" ON public.users
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- For anonymous inserts/updates (if needed, otherwise remove)
CREATE POLICY "Allow anonymous inserts on users" ON public.users
    FOR INSERT
    WITH CHECK (true);
CREATE POLICY "Allow anonymous updates on users" ON public.users
    FOR UPDATE
    USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous deletes on users" ON public.users
    FOR DELETE
    USING (true);


-- Create the 'tasks' table
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    siteId TEXT NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE, -- Foreign key to sites table
    description TEXT NOT NULL,
    dueDate DATE NOT NULL, -- Use DATE type for dates
    status TEXT NOT NULL, -- Stores 'pending', 'in_progress', 'completed'
    assignees TEXT[], -- Array of text for assignees
    type TEXT NOT NULL, -- Stores 'maintenance' or 'odl'
    odlNumber TEXT,
    startDate DATE -- Use DATE type for dates
);

-- Enable Row Level Security (RLS) for 'tasks'
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for 'tasks'
CREATE POLICY "Allow public read access to tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage tasks" ON public.tasks
    FOR ALL
    TO authenticated
    USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
-- For anonymous inserts/updates (if needed, otherwise remove)
CREATE POLICY "Allow anonymous inserts on tasks" ON public.tasks
    FOR INSERT
    WITH CHECK (true);
CREATE POLICY "Allow anonymous updates on tasks" ON public.tasks
    FOR UPDATE
    USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous deletes on tasks" ON public.tasks
    FOR DELETE
    USING (true);