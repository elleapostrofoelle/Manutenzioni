-- Tabella per i siti
    CREATE TABLE sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      manager JSONB,
      contactPerson JSONB,
      landline TEXT,
      otherContacts JSONB
    );

    -- Tabella per gli utenti (risorse)
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );

    -- Tabella per i task (manutenzioni e ODL)
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      "siteId" TEXT REFERENCES sites(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      "dueDate" TEXT NOT NULL,
      status TEXT NOT NULL,
      assignees TEXT[] NOT NULL, -- Array di stringhe
      type TEXT NOT NULL,
      "odlNumber" TEXT,
      "startDate" TEXT
    );

    -- Aggiungi un indice per migliorare le prestazioni delle query sui task per siteId
    CREATE INDEX tasks_siteId_idx ON tasks ("siteId");