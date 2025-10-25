import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Express } from 'express';

const app: Express = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let projectRoot: string;

if (__dirname.includes(path.join('dist', 'backend'))) {
  projectRoot = path.resolve(__dirname, '../../');
} else {
  projectRoot = __dirname;
}

console.log('Server __dirname:', __dirname);
console.log('Calculated projectRoot:', projectRoot);
console.log('Serving static files from:', path.join(projectRoot, 'dist'));
console.log('Fallback index.html path:', path.resolve(projectRoot, 'dist', 'index.html'));

const indexPath = path.resolve(projectRoot, 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  console.log(`index.html found at: ${indexPath}`);
} else {
  console.error(`index.html NOT found at: ${indexPath}. Frontend build might be missing or path is incorrect.`);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variabili d\'ambiente SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non impostate.');
  process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseKey);

// INTERFACES (ALLINEATE CON api.ts)
export interface IPersonContact {
  name: string;
  phone?: string;
  email?: string;
}

export interface IOtherContact extends IPersonContact {
  id: string;
}

export interface ISite {
  id: string;
  name: string;
  address: string;
  manager?: IPersonContact;
  contactPerson?: IPersonContact;
  landline?: string;
  otherContacts?: IOtherContact[];
  user_id?: string;
}

export interface IUser {
  id: string;
  name: string;
  role: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface ITask {
  id: string;
  siteId: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assignees: string[];
  type: 'maintenance' | 'odl';
  odlNumber?: string;
  startDate?: string;
  user_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

// HELPER FUNCTIONS FOR MAPPING DB (camelCase) TO FRONTEND (camelCase)
// Ora le funzioni di mappatura accedono direttamente ai nomi delle colonne come sono nel DB
const mapDbSiteToFrontend = (dbSite: any): ISite => ({
  id: dbSite.id,
  name: dbSite.name,
  address: dbSite.address,
  manager: dbSite.manager || undefined,
  contactPerson: dbSite.contactperson || undefined, // Corretto: usa contactperson
  landline: dbSite.landline || undefined,
  otherContacts: dbSite.othercontacts || undefined, // Corretto: usa othercontacts
  user_id: dbSite.user_id || undefined,
});

const mapDbTaskToFrontend = (dbTask: any): ITask => ({
  id: dbTask.id,
  siteId: dbTask.siteid, // Corretto: usa siteid
  description: dbTask.description,
  dueDate: dbTask.duedate, // Corretto: usa duedate
  status: dbTask.status,
  assignees: dbTask.assignees,
  type: dbTask.type,
  odlNumber: dbTask.odlnumber || undefined, // Corretto: usa odlnumber
  startDate: dbTask.startdate || undefined, // Corretto: usa startdate
  user_id: dbTask.user_id || undefined,
});


// MIDDLEWARE DI AUTENTICAZIONE
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header mancante' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token di autenticazione mancante' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Errore verifica token Supabase:', error?.message);
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch (error: any) {
    console.error('Errore nel middleware di autenticazione:', error);
    res.status(500).json({ error: 'Errore interno del server durante l\'autenticazione' });
  }
};


// ERROR HANDLER
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err.stack); // Logging più dettagliato
  res.status(500).json({ error: err.message || 'Server error' });
});

// HEALTH CHECK (non richiede autenticazione)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Applica il middleware di autenticazione a tutte le rotte API protette
app.use('/api/sites', authenticate);
app.use('/api/tasks', authenticate);
app.post('/api/users', authenticate);
app.put('/api/users/:id', authenticate);
app.delete('/api/users/:id', authenticate);


// CRUD SITES
app.get('/api/sites', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').eq('user_id', req.user!.id);
    if (error) throw error;
    console.log('Supabase raw data (before mapping):', JSON.stringify(data, null, 2));
    const mappedData = data.map(mapDbSiteToFrontend);
    console.log('Mapped data for frontend (after mapping):', JSON.stringify(mappedData, null, 2));
    res.json(mappedData);
  } catch (error: any) {
    console.error('Error in GET /api/sites:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile ottenere siti' });
  }
});

app.get('/api/sites/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').eq('id', req.params.id).eq('user_id', req.user!.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Sito non trovato' });
      throw error;
    }
    res.json(mapDbSiteToFrontend(data));
  } catch (error: any) {
    console.error('Error in GET /api/sites/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Errore nel recupero sito' });
  }
});

app.post('/api/sites', async (req, res) => {
  try {
    const site: ISite = req.body;
    console.log('Received site for insert:', req.body);
    const siteToInsert = {
      id: site.id,
      name: site.name,
      address: site.address,
      manager: site.manager && site.manager.name ? site.manager : {}, 
      contactperson: site.contactPerson && site.contactPerson.name ? site.contactPerson : {}, // Corretto: usa contactperson
      landline: site.landline || '',
      othercontacts: site.otherContacts || [], // Corretto: usa othercontacts
      user_id: req.user!.id,
    };
    console.log('Site data prepared for Supabase insert:', JSON.stringify(siteToInsert, null, 2));
    const { data, error } = await supabase.from('sites').insert([siteToInsert]).select().single();
    if (error) {
      console.error('Supabase insert error for site:', error);
      throw error;
    }
    res.status(201).json(mapDbSiteToFrontend(data));
  } catch (error: any) {
    console.error('Error in POST /api/sites:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile creare sito' });
  }
});

app.put('/api/sites/:id', async (req, res) => {
  try {
    const site: Partial<ISite> = req.body;
    console.log('Received site for update:', req.body);
    const siteToUpdate = {
      name: site.name,
      address: site.address,
      manager: site.manager && site.manager.name ? site.manager : {}, 
      contactperson: site.contactPerson && site.contactPerson.name ? site.contactPerson : {}, // Corretto: usa contactperson
      landline: site.landline || '',
      othercontacts: site.otherContacts || [], // Corretto: usa othercontacts
    };
    console.log('Site data prepared for Supabase update:', JSON.stringify(siteToUpdate, null, 2));
    const { data, error } = await supabase.from('sites').update(siteToUpdate).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
    if (error) {
      console.error('Supabase update error for site:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Sito non trovato' });
    res.json(mapDbSiteToFrontend(data));
  } catch (error: any) {
    console.error('Error in PUT /api/sites/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile aggiornare sito' });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('sites').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) {
      console.error('Supabase delete error for site:', error);
      throw error;
    }
    res.json({ message: 'Sito eliminato' });
  } catch (error: any) {
    console.error('Error in DELETE /api/sites/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile eliminare sito' });
  }
});

// CRUD USERS
app.get('/api/users', authenticate, async (req, res) => {
  try {
    // Per la tabella users, non filtriamo per user_id perché vogliamo che tutti gli utenti autenticati
    // possano vedere l'elenco delle risorse (altri utenti) per l'assegnazione dei task.
    // Le policy RLS su Supabase dovrebbero già gestire chi può vedere cosa.
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/users:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile ottenere utenti' });
  }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    // L'accesso a un singolo utente è limitato al proprio profilo per sicurezza
    if (req.params.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato ad accedere a questo profilo utente' });
    }
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Utente non trovato' });
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/users/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Errore nel recupero utente' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user: IUser = req.body;
    // Assicurati che l'ID dell'utente che si sta creando corrisponda all'ID dell'utente autenticato
    if (user.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato a creare questo utente' });
    }
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) {
      console.error('Supabase insert error for user:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error in POST /api/users:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile creare utente' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user: Partial<IUser> = req.body;
    // L'aggiornamento di un utente è limitato al proprio profilo
    if (req.params.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato ad aggiornare questo utente' });
    }
    const { data, error } = await supabase.from('users').update(user).eq('id', req.params.id).single();
    if (error) {
      console.error('Supabase update error for user:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(data);
  } catch (error: any) {
    console.error('Error in PUT /api/users/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile aggiornare utente' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    // L'eliminazione di un utente è limitata al proprio profilo
    if (req.params.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato ad eliminare questo utente' });
    }
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) {
      console.error('Supabase delete error for user:', error);
      throw error;
    }
    res.json({ message: 'Utente eliminato' });
  } catch (error: any) {
    console.error('Error in DELETE /api/users/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile eliminare utente' });
  }
});

// CRUD TASKS
app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', req.user!.id);
    if (error) throw error;
    res.json(data.map(mapDbTaskToFrontend));
  } catch (error: any) {
    console.error('Error in GET /api/tasks:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile ottenere task' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', req.params.id).eq('user_id', req.user!.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Task non trovato' });
      throw error;
    }
    res.json(mapDbTaskToFrontend(data));
  } catch (error: any) {
    console.error('Error in GET /api/tasks/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Errore nel recupero task' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task: ITask = req.body;
    const taskToInsert = {
      id: task.id,
      siteid: task.siteId, // Corretto: usa siteid
      description: task.description,
      duedate: task.dueDate, // Corretto: usa duedate
      status: task.status,
      assignees: task.assignees,
      type: task.type,
      odlnumber: task.odlNumber, // Corretto: usa odlnumber
      startdate: task.startDate, // Corretto: usa startdate
      user_id: req.user!.id,
    };
    const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();
    if (error) {
      console.error('Supabase insert error for task:', error);
      throw error;
    }
    res.status(201).json(mapDbTaskToFrontend(data));
  } catch (error: any) {
    console.error('Error in POST /api/tasks:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile creare task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task: Partial<ITask> = req.body;
    const taskToUpdate: Partial<any> = {
      description: task.description,
      status: task.status,
      assignees: task.assignees,
      type: task.type,
    };
    if (task.siteId !== undefined) taskToUpdate.siteid = task.siteId; // Corretto: usa siteid
    if (task.dueDate !== undefined) taskToUpdate.duedate = task.dueDate; // Corretto: usa duedate
    if (task.odlNumber !== undefined) taskToUpdate.odlnumber = task.odlNumber; // Corretto: usa odlnumber
    if (task.startDate !== undefined) taskToUpdate.startdate = task.startDate; // Corretto: usa startdate

    const { data, error } = await supabase.from('tasks').update(taskToUpdate).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
    if (error) {
      console.error('Supabase update error for task:', error);
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Task non trovato' });
    res.json(mapDbTaskToFrontend(data));
  } catch (error: any) {
    console.error('Error in PUT /api/tasks/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile aggiornare task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) {
      console.error('Supabase delete error for task:', error);
      throw error;
    }
    res.json({ message: 'Task eliminato' });
  } catch (error: any) {
    console.error('Error in DELETE /api/tasks/:id:', error); // Logging più dettagliato
    res.status(500).json({ error: error.message || 'Impossibile eliminare task' });
  }
});

// Serve static files from the 'dist' directory (frontend build output)
app.use(express.static(path.join(projectRoot, 'dist')));

// SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexHtmlPath = path.resolve(projectRoot, 'dist', 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      res.sendFile(indexHtmlPath);
    } else {
      console.error(`index.html NOT found at: ${indexHtmlPath}. Impossibile servire il fallback SPA.`);
      res.status(500).send('Frontend build mancante o percorso errato.');
    }
  } else {
    next();
  }
});

// Final 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

export default app;