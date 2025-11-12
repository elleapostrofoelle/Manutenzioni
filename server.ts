// server.ts (Versione finale per IIS/Reverse Proxy - Rimosso il Servizio File Statici)

import 'dotenv/config'; // Importa e configura dotenv
import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from './src/database.types.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken'; 

// --- ALIAS E INTERFACCE (Invariate) ---
type Role = Database['public']['Tables']['roles']['Row'];
type RoleInsert = Database['public']['Tables']['roles']['Insert'];
type SiteInsert = Database['public']['Tables']['sites']['Insert'];
type SiteUpdate = Database['public']['Tables']['sites']['Update'];
type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface IPersonContact { name: string; phone?: string; email?: string; }
export interface IOtherContact extends IPersonContact { id: string; }
export interface ISite { id: string; name: string; address: string; manager?: IPersonContact; contactPerson?: IPersonContact; landline?: string; otherContacts?: IOtherContact[]; user_id?: string; }
export interface IUser { id: string; name: string; role: string; }
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export interface ITask { id: string; siteId: string; description: string; dueDate: string; status: TaskStatus; assignees: string[]; type: 'maintenance' | 'odl'; odlNumber?: string; startDate?: string; user_id?: string; }


// --- INIZIALIZZAZIONE APP ---
const app: Express = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const frontendDistPath = path.join(projectRoot, 'dist'); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
// DICHIARAZIONE UNICA DEL JWT SECRET CON FALLBACK PER L'AMBIENTE IIS
const jwtSecret = process.env.SUPABASE_JWT_SECRET || "OZIgA+b032QGvPejVNx0HdPJ34KAdV9Yvd9JXtEl+PsrxuTOUzJzvyLuVMkH7+fxwppF5pmpwjTP2A6IziPE+w=="; 


let supabase: SupabaseClient<Database>;
try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili d\'ambiente SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non impostate.');
  }
  supabase = createClient<Database>(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully (using SERVICE_ROLE_KEY).');
} catch (e: any) {
  console.error('ERRORE CRITICO: Supabase client initialization failed:', e.message);
  process.exit(1); 
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email?: string; }; // 'id' è il 'sub' del JWT
    }
  }
}

// --- MIDDLEWARE DI AUTENTICAZIONE (CORREZIONE PRINCIPALE QUI) ---
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    if (!supabase) return res.status(503).json({ error: 'Servizio non disponibile per problemi di configurazione.' });
    if (req.path === '/health') return next();
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token di autenticazione mancante o formato errato.' });
    
    const token = authHeader.split(' ')[1];

    try {
        // VALIDAZIONE DIRETTA DEL JWT CON LA CHIAVE SEGRETA DEL PROGETTO
        const decoded = jwt.verify(token, jwtSecret) as { sub: string, email: string };
        
        // Assegna i dati dell'utente (ID e email) alla richiesta
        req.user = { id: decoded.sub, email: decoded.email }; 
        
        next();
    } catch (error: any) {
        // Cattura errori di scadenza ('TokenExpiredError') o di firma ('JsonWebTokenError')
        console.error('Errore di Validazione JWT:', error.message);
        res.status(401).json({ error: 'Token non valido o scaduto' });
    }
};

app.use('/api', authenticate);

// --- ROUTE API (Invariate) ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// CRUD SITES
app.get('/api/sites', async (req, res) => {
  // Ora req.user!.id proviene dal JWT validato
  const { data, error } = await supabase.from('sites').select('*').eq('user_id', req.user!.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/sites', async (req, res) => {
  const siteData: ISite = req.body;
  const siteToInsert: SiteInsert = {
    id: uuidv4(),
    name: siteData.name,
    address: siteData.address,
    manager: siteData.manager as unknown as Json,
    contactperson: siteData.contactPerson as unknown as Json,
    landline: siteData.landline,
    othercontacts: siteData.otherContacts as unknown as Json,
    user_id: req.user!.id,
  };
  const { data, error } = await supabase.from('sites').insert(siteToInsert).select().single();
  if (error) return res.status(500).json({ error: error.message, details: error.details });
  res.status(201).json(data);
});
app.put('/api/sites/:id', async (req, res) => {
    const siteData: Partial<ISite> = req.body;
    const siteToUpdate: SiteUpdate = {
      name: siteData.name,
      address: siteData.address,
      manager: siteData.manager as unknown as Json,
      contactperson: siteData.contactPerson as unknown as Json,
      landline: siteData.landline,
      othercontacts: siteData.otherContacts as unknown as Json,
    };
    const { data, error } = await supabase.from('sites').update(siteToUpdate).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
    if (error) return res.status(500).json({ error: error.message, details: error.details });
    if (!data) return res.status(404).json({ error: 'Sito non trovato' });
    res.json(data);
});
// ROTTA AGGIUNTA: DELETE per Siti
app.delete('/api/sites/:id', async (req, res) => {
    const { error } = await supabase.from('sites').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
});


// CRUD USERS
app.get('/api/users', async (req, res) => {
    // Rimosso il filtro eq('id', req.user!.id) per visualizzare tutte le risorse create
    const { data, error } = await supabase.from('users').select('*');
        
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

// ROTTE AGGIUNTE: POST (Aggiungi utente)
app.post('/api/users', async (req, res) => {
    const userData: IUser = req.body;
    const userToInsert: UserInsert = { 
      id: uuidv4(), // Generiamo un ID univoco per la risorsa utente interna (non è l'ID di Supabase Auth)
      name: userData.name,
      role: userData.role
    };
    const { data, error } = await supabase.from('users').insert(userToInsert).select().single();
    if (error) return res.status(500).json({ error: error.message, details: error.details });
    res.status(201).json(data);
});

// ROTTE AGGIUNTE: PUT (Aggiorna utente)
app.put('/api/users/:id', async (req, res) => {
    const { name, role } = req.body;
    const updates: Partial<UserInsert> = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    
    // Aggiorniamo solo per ID utente
    const { data, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single(); 
    if (error) return res.status(500).json({ error: error.message, details: error.details });
    if (!data) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(data);
});

// ROTTE AGGIUNTE: DELETE (Elimina utente)
app.delete('/api/users/:id', async (req, res) => {
    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    // Risposta 204 No Content è standard per le eliminazioni riuscite senza corpo di risposta
    res.status(204).send(); 
});


// CRUD ROLES (MANSIONI)
app.get('/api/roles', async (req, res) => {
    const { data, error } = await supabase.from('roles').select('*').eq('user_id', req.user!.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});
app.post('/api/roles', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Il nome è obbligatorio' });

    const roleToInsert: RoleInsert = {
        name,
        user_id: req.user!.id
    };
    const { data, error } = await supabase.from('roles').insert(roleToInsert).select().single();
    if (error) return res.status(501).json({ error: error.message, details: "Controlla le policy RLS" });
    res.status(201).json(data);
});

// CRUD TASKS
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', req.user!.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
// ROTTE AGGIUNTE: POST (Aggiungi task)
app.post('/api/tasks', async (req, res) => {
  const taskData: ITask = req.body;
  
  // Mappatura da camelCase a snake_case per il DB
  const taskToInsert: TaskInsert = {
    id: uuidv4(),
    user_id: req.user!.id,
    description: taskData.description,
    status: taskData.status,
    assignees: taskData.assignees,
    type: taskData.type,
    // Mappatura campi:
    siteid: taskData.siteId,
    duedate: taskData.dueDate,
    odlnumber: taskData.odlNumber,
    startdate: taskData.startDate,
  };
  
  const { data, error } = await supabase.from('tasks').insert(taskToInsert).select().single();
  if (error) return res.status(500).json({ error: error.message, details: error.details });
  res.status(201).json(data);
});

// ROTTE AGGIUNTE: PUT (Aggiorna task)
app.put('/api/tasks/:id', async (req, res) => {
    const updates: Partial<ITask> = req.body;
    
    // Mappatura da camelCase a snake_case per l'update
    const updatesToDB: Partial<TaskUpdate> = {
        description: updates.description,
        status: updates.status,
        assignees: updates.assignees,
        // Mappatura campi:
        siteid: updates.siteId,
        duedate: updates.dueDate,
        odlnumber: updates.odlNumber,
        startdate: updates.startDate,
    };

    // Filtra per ID e user_id (per sicurezza)
    const { data, error } = await supabase.from('tasks').update(updatesToDB).eq('id', req.params.id).eq('user_id', req.user!.id).select().single();
    if (error) return res.status(500).json({ error: error.message, details: error.details });
    if (!data) return res.status(404).json({ error: 'Task non trovato' });
    res.json(data);
});

// ROTTE AGGIUNTE: DELETE (Elimina task)
app.delete('/api/tasks/:id', async (req, res) => {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
});


// --- GESTIONE FRONTEND (SPAZIO DI LAVORO) ---

// RIMOZIONE DELLA GESTIONE DEI FILE STATICI E DEL FALLBACK PER INDEX.HTML!
// IIS gestirà i file statici e il fallback SPA.

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next(); 
    }
    // Qualsiasi richiesta che non sia /api/ deve essere gestita da IIS.
    // Se arriva qui, il browser ha fatto una richiesta API non valida, o IIS ha fallito.
    // Restituiamo 404 per evitare cicli di riscrittura e 500.
    res.status(404).send('Not Found: Express only serves /api/ routes.'); 
});

// FINAL 404/ERRORE HANDLER GLOBALE
app.use((req, res) => {
  res.status(404).send('Not Found: API not found or route not handled by Express.');
});

// --- AVVIO SERVER ---
const port = 5001; // USIAMO LA PORTA STABILE
app.listen(port, () => {
    console.log(`Server Express in ascolto sulla porta ${port}`);
   
});

export default app;