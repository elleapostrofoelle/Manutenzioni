import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js'; // Importa il client Supabase
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();

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
}

// ERROR HANDLER
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Server error' });
});

// HEALTH CHECK
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// CRUD SITES
app.get('/api/sites', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sites').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile ottenere siti' });
  }
});

app.get('/api/sites/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sites').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Sito non trovato' }); // No rows found
      throw error;
    }
    res.json(data);
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
      contactPerson: site.contactPerson && site.contactPerson.name ? site.contactPerson : {}, 
      landline: site.landline || '',
      otherContacts: site.otherContacts || [], 
    };
    console.log('Site data prepared for Supabase insert:', JSON.stringify(siteToInsert, null, 2)); // Log dettagliato
    const { data, error } = await supabase.from('sites').insert([siteToInsert]).select().single();
    if (error) {
      console.error('Supabase insert error for site:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.status(201).json(data);
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
      contactPerson: site.contactPerson && site.contactPerson.name ? site.contactPerson : {}, 
      landline: site.landline || '',
      otherContacts: site.otherContacts || [], 
    };
    console.log('Site data prepared for Supabase update:', JSON.stringify(siteToUpdate, null, 2)); // Log dettagliato
    const { data, error } = await supabase.from('sites').update(siteToUpdate).eq('id', req.params.id).select().single();
    if (error) {
      console.error('Supabase update error for site:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Sito non trovato' });
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile aggiornare sito' });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('sites').delete().eq('id', req.params.id);
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
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile ottenere utenti' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Utente non trovato' });
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Errore nel recupero utente' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user: IUser = req.body;
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) {
      console.error('Supabase insert error for user:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.status(201).json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile creare utente' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user: Partial<IUser> = req.body;
    const { data, error } = await supabase.from('users').update(user).eq('id', req.params.id).select().single();
    if (error) {
      console.error('Supabase update error for user:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile aggiornare utente' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
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
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile ottenere task' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Task non trovato' });
      throw error;
    }
    res.json(data);
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
      siteId: task.siteId, 
      description: task.description,
      dueDate: task.dueDate, 
      status: task.status,
      assignees: task.assignees,
      type: task.type,
      odlNumber: task.odlNumber, 
      startDate: task.startDate, 
    };
    const { data, error } = await supabase.from('tasks').insert([taskToInsert]).select().single();
    if (error) {
      console.error('Supabase insert error for task:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    res.status(201).json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile creare task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task: Partial<ITask> = req.body;
    // Utilizza i nomi delle colonne camelCase come nell'interfaccia
    const taskToUpdate: Partial<ITask> = {
      description: task.description,
      status: task.status,
      assignees: task.assignees,
      type: task.type,
    };
    // Conditionally add fields that might be undefined
    if (task.siteId !== undefined) (taskToUpdate as any).siteId = task.siteId;
    if (task.dueDate !== undefined) (taskToUpdate as any).dueDate = task.dueDate;
    if (task.odlNumber !== undefined) (taskToUpdate as any).odlNumber = task.odlNumber;
    if (task.startDate !== undefined) (taskToUpdate as any).startDate = task.startDate;

    const { data, error } = await supabase.from('tasks').update(taskToUpdate).eq('id', req.params.id).select().single();
    if (error) {
      console.error('Supabase update error for task:', error); // Log dettagliato dell'errore Supabase
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Task non trovato' });
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Impossibile aggiornare task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
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