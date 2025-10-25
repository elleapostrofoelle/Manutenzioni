import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js'; // Importa il client Supabase
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Express } from 'express'; // Importa esplicitamente il tipo Express

dotenv.config();

const app: Express = express(); // Annota 'app' con il tipo Express

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

// Inizializza il client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usa la service role key per il backend

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
  user_id?: string; // Aggiunto per l'associazione all'utente
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
  user_id?: string; // Aggiunto per l'associazione all'utente
}

// Estendi l'interfaccia Request di Express per includere l'utente Supabase
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        // Aggiungi altre proprietà dell'utente se necessario
      };
    }
  }
}

// HELPER FUNCTIONS FOR MAPPING DB (snake_case) TO FRONTEND (camelCase)
const mapDbSiteToFrontend = (dbSite: any): ISite => ({
  id: dbSite.id,
  name: dbSite.name,
  address: dbSite.address,
  manager: dbSite.manager || undefined,
  contactPerson: dbSite.contactperson || undefined, // Mappa da snake_case a camelCase
  landline: dbSite.landline || undefined,
  otherContacts: dbSite.othercontacts || undefined, // Mappa da snake_case a camelCase
  user_id: dbSite.user_id || undefined,
});

const mapDbTaskToFrontend = (dbTask: any): ITask => ({
  id: dbTask.id,
  siteId: dbTask.siteid, // Mappa da snake_case a camelCase
  description: dbTask.description,
  dueDate: dbTask.duedate, // Mappa da snake_case a camelCase
  status: dbTask.status,
  assignees: dbTask.assignees,
  type: dbTask.type,
  odlNumber: dbTask.odlnumber || undefined, // Mappa da snake_case a camelCase
  startDate: dbTask.startdate || undefined, // Mappa da snake_case a camelCase
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
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server error' });
});

// HEALTH CHECK (non richiede autenticazione)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Applica il middleware di autenticazione a tutte le rotte API protette
app.use('/api/sites', authenticate);
app.use('/api/tasks', authenticate);
// Per gli utenti, permettiamo di leggere tutti gli utenti per l'assegnazione dei task,
// ma le operazioni di scrittura saranno filtrate per l'utente corrente.
app.post('/api/users', authenticate);
app.put('/api/users/:id', authenticate);
app.delete('/api/users/:id', authenticate);


// CRUD SITES
app.get('/api/sites', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').eq('user_id', req.user!.id);
    if (error) throw error;
    console.log('Supabase raw data (before mapping):', JSON.stringify(data, null, 2)); // LOG AGGIUNTO
    const mappedData = data.map(mapDbSiteToFrontend); // Store mapped data
    console.log('Mapped data for frontend (after mapping):', JSON.stringify(mappedData, null, 2)); // LOG AGGIUNTO
    res.json(mappedData); // Applica la mappatura
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile ottenere siti' });
  }
});

app.get('/api/sites/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').eq('id', req.params.id).eq('user_id', req.user!.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Sito non trovato' }); // No rows found
      throw error;
    }
    res.json(mapDbSiteToFrontend(data)); // Applica la mappatura
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Errore nel recupero sito' });
  }
});

app.post('/api/sites', async (req, res) => {
  try {
    const site: ISite = req.body;
    console.log('Received site for insert:', req.body); // Log per debug
    // Utilizza i nomi delle colonne camelCase come nell'interfaccia
    const siteToInsert = {
      id: site.id,
      name: site.name,
      address: site.address,
      manager: site.manager && site.manager.name ? site.manager : {}, 
      contactperson: site.contactPerson && site.contactPerson.name ? site.contactPerson : {}, // Modificato
      landline: site.landline || '',
      othercontacts: site.otherContacts || [], // Modificato
      user_id: req.user!.id, // Associa il sito all'utente autenticato
    };
    console.log('Site data prepared for Supabase insert:', JSON.stringify(siteToInsert, null, 2)); // Log dettagliato
    const { data, error } = await supabase.from('sites').insert([siteToInsert]).select().single();
    if (error) {
      console.error('Supabase insert error for site:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.status(201).json(mapDbSiteToFrontend(data)); // Applica la mappatura al risultato
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile creare sito' });
  }
});

app.put('/api/sites/:id', async (req, res) => {
  try {
    const site: Partial<ISite> = req.body;
    console.log('Received site for update:', req.body); // Log per debug
    // Utilizza i nomi delle colonne camelCase come nell'interfaccia
    const siteToUpdate = {
      name: site.name,
      address: site.address,
      manager: site.manager && site.manager.name ? site.manager : {}, 
      contactperson: site.contactPerson && site.contactPerson.name ? site.contactPerson : {}, // Modificato
      landline: site.landline || '',
      othercontacts: site.otherContacts || [], // Modificato
    };
    console.log('Site data prepared for Supabase update:', JSON.stringify(siteToUpdate, null, 2)); // Log dettagliato
    const { data, error } = await supabase.from('sites').update(siteToUpdate).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
    if (error) {
      console.error('Supabase update error for site:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Sito non trovato' });
    res.json(mapDbSiteToFrontend(data)); // Applica la mappatura al risultato
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile aggiornare sito' });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('sites').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) {
      console.error('Supabase delete error for site:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.json({ message: 'Sito eliminato' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile eliminare sito' });
  }
});

// CRUD USERS
// Permetti a tutti gli utenti autenticati di leggere tutti gli utenti (per l'assegnazione dei task)
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json(data); // Gli utenti non richiedono mappatura se le colonne sono già camelCase
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile ottenere utenti' });
  }
});

app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    // Un utente può vedere solo il proprio profilo utente
    if (req.params.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato ad accedere a questo profilo utente' });
    }
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Utente non trovato' });
      throw error;
    }
    res.json(data); // Gli utenti non richiedono mappatura
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Errore nel recupero utente' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user: IUser = req.body;
    // Assicurati che l'ID dell'utente nel corpo della richiesta corrisponda all'utente autenticato
    if (user.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato a creare questo utente' });
    }
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) {
      console.error('Supabase insert error for user:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.status(201).json(data); // Gli utenti non richiedono mappatura
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile creare utente' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user: Partial<IUser> = req.body;
    // Assicurati che l'ID dell'utente nella richiesta corrisponda all'utente autenticato
    if (req.params.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato ad aggiornare questo utente' });
    }
    const { data, error } = await supabase.from('users').update(user).eq('id', req.params.id).single();
    if (error) {
      console.error('Supabase update error for user:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(data); // Gli utenti non richiedono mappatura
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile aggiornare utente' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    // Assicurati che l'ID dell'utente nella richiesta corrisponda all'utente autenticato
    if (req.params.id !== req.user!.id) {
      return res.status(403).json({ error: 'Non autorizzato ad eliminare questo utente' });
    }
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) {
      console.error('Supabase delete error for user:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.json({ message: 'Utente eliminato' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile eliminare utente' });
  }
});

// CRUD TASKS
app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', req.user!.id);
    if (error) throw error;
    res.json(data.map(mapDbTaskToFrontend)); // Applica la mappatura
  } catch (error: any) {
    console.error(error);
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
    res.json(mapDbTaskToFrontend(data)); // Applica la mappatura
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Errore nel recupero task' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task: ITask = req.body;
    // Utilizza i nomi delle colonne camelCase come nell'interfaccia
    const taskToInsert = {
      id: task.id,
      siteid: task.siteId, // Modificato
      description: task.description,
      duedate: task.dueDate, // Modificato
      status: task.status,
      assignees: task.assignees,
      type: task.type,
      odlnumber: task.odlNumber, // Modificato
      startdate: task.startDate, // Modificato
      user_id: req.user!.id, // Associa il task all'utente autenticato
    };
    const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();
    if (error) {
      console.error('Supabase insert error for task:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.status(201).json(mapDbTaskToFrontend(data)); // Applica la mappatura al risultato
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile creare task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task: Partial<ITask> = req.body;
    // Utilizza i nomi delle colonne camelCase come nell'interfaccia
    const taskToUpdate: Partial<any> = { // Usa any per permettere l'assegnazione di snake_case
      description: task.description,
      status: task.status,
      assignees: task.assignees,
      type: task.type,
    };
    // Conditionally add fields that might be undefined
    if (task.siteId !== undefined) taskToUpdate.siteid = task.siteId; // Modificato
    if (task.dueDate !== undefined) taskToUpdate.duedate = task.dueDate; // Modificato
    if (task.odlNumber !== undefined) taskToUpdate.odlnumber = task.odlNumber; // Modificato
    if (task.startDate !== undefined) taskToUpdate.startdate = task.startDate; // Modificato

    const { data, error } = await supabase.from('tasks').update(taskToUpdate).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
    if (error) {
      console.error('Supabase update error for task:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Task non trovato' });
    res.json(mapDbTaskToFrontend(data)); // Applica la mappatura al risultato
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile aggiornare task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) {
      console.error('Supabase delete error for task:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.json({ message: 'Task eliminato' });
  } catch (error: any) {
    console.error(error);
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