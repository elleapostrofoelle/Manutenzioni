// --- START OF FILE server.ts ---

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'manutenzioni',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// INTERFACES (ALLINEATE CON api.ts)
// Idealmente, queste interfacce sarebbero in un file separato (es. 'shared-types.ts')
// e importate sia nel frontend che nel backend.

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
  manager?: IPersonContact; // Usa l'interfaccia IPersonContact
  contactPerson?: IPersonContact; // Usa l'interfaccia IPersonContact
  landline?: string;
  otherContacts?: IOtherContact[]; // Usa l'interfaccia IOtherContact
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
  dueDate: string; // Come in api.ts
  status: TaskStatus;
  assignees: string[];
  type: 'maintenance' | 'odl';
  odlNumber?: string;
  startDate?: string; // Come in api.ts
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

// CRUD SITES (Esempio rudimentale - da completare e adattare al tuo schema DB)
// Assicurati che il tuo schema DB abbia colonne di tipo JSON o TEXT per manager, contactPerson, otherContacts
// Esempio di SCHEMA:
// CREATE TABLE sites (
//   id VARCHAR(255) PRIMARY KEY,
//   name VARCHAR(255) NOT NULL,
//   address VARCHAR(255) NOT NULL,
//   manager JSON,
//   contactPerson JSON,
//   landline VARCHAR(255),
//   otherContacts JSON
// );


app.get('/api/sites', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM sites');
    connection.release();
    // Parsifica i campi JSON recuperati dal DB
    const sites = (rows as any[]).map(row => ({
      ...row,
      manager: row.manager ? JSON.parse(row.manager) : undefined,
      contactPerson: row.contactPerson ? JSON.parse(row.contactPerson) : undefined,
      otherContacts: row.otherContacts ? JSON.parse(row.otherContacts) : undefined,
    }));
    res.json(sites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile ottenere siti' });
  }
});

app.get('/api/sites/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM sites WHERE id = ?', [req.params.id]);
    connection.release();
    if ((rows as any[]).length === 0) return res.status(404).json({ error: 'Sito non trovato' });
    
    const row = (rows as any[])[0];
    // Parsifica i campi JSON recuperati dal DB
    const site: ISite = {
      ...row,
      manager: row.manager ? JSON.parse(row.manager) : undefined,
      contactPerson: row.contactPerson ? JSON.parse(row.contactPerson) : undefined,
      otherContacts: row.otherContacts ? JSON.parse(row.otherContacts) : undefined,
    };
    res.json(site);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero sito' });
  }
});

app.post('/api/sites', async (req, res) => {
  try {
    const site: ISite = req.body;
    const connection = await pool.getConnection();
    await connection.query(`
      INSERT INTO sites (id, name, address, manager, contactPerson, landline, otherContacts)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        site.id,
        site.name,
        site.address,
        site.manager ? JSON.stringify(site.manager) : null, // Stringifica l'oggetto JSON
        site.contactPerson ? JSON.stringify(site.contactPerson) : null, // Stringifica l'oggetto JSON
        site.landline || null,
        site.otherContacts ? JSON.stringify(site.otherContacts) : null, // Stringifica l'array di oggetti JSON
      ]);
    connection.release();
    res.status(201).json(site); // Ritorna il sito creato (con ID se generato dal DB)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile creare sito' });
  }
});

app.put('/api/sites/:id', async (req, res) => {
  try {
    const site: Partial<ISite> = req.body; // Potrebbe non avere tutti i campi
    const connection = await pool.getConnection();
    const result = await connection.query(`
      UPDATE sites
      SET name = ?, address = ?, manager = ?, contactPerson = ?, landline = ?, otherContacts = ?
      WHERE id = ?`,
      [
        site.name,
        site.address,
        site.manager ? JSON.stringify(site.manager) : null,
        site.contactPerson ? JSON.stringify(site.contactPerson) : null,
        site.landline || null,
        site.otherContacts ? JSON.stringify(site.otherContacts) : null,
        req.params.id
      ]);
    connection.release();
    if ((result[0] as any).affectedRows === 0) return res.status(404).json({ error: 'Sito non trovato' });
    res.json({ message: 'Sito aggiornato' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile aggiornare sito' });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM sites WHERE id = ?', [req.params.id]);
    connection.release();
    if ((result[0] as any).affectedRows === 0) return res.status(404).json({ error: 'Sito non trovato' });
    res.json({ message: 'Sito eliminato' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile eliminare sito' });
  }
});


// CRUD USERS (già corretto)

app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile ottenere utenti' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    connection.release();
    if ((rows as any[]).length === 0) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero utente' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user: IUser = req.body;
    const connection = await pool.getConnection();
    // Nota: l'id è fornito dal frontend. Se il DB lo genera, rimuovilo dall'INSERT e recuperalo.
    await connection.query('INSERT INTO users (id, name, role) VALUES (?, ?, ?)', [user.id, user.name, user.role]);
    connection.release();
    res.status(201).json(user); // Ritorna l'utente creato per coerenza con il frontend
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile creare utente' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user: Partial<IUser> = req.body;
    const connection = await pool.getConnection();
    const result = await connection.query('UPDATE users SET name = ?, role = ? WHERE id = ?', [user.name, user.role, req.params.id]);
    connection.release();
    if ((result[0] as any).affectedRows === 0) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ ...user, id: req.params.id }); // Ritorna l'utente aggiornato per coerenza
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile aggiornare utente' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    connection.release();
    if ((result[0] as any).affectedRows === 0) return res.status(404).json({ error: 'Utente non trovato' });
    res.json({ message: 'Utente eliminato' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile eliminare utente' });
  }
});

// CRUD TASKS (già corretto, con aggiunta di JSON.parse per assignees)

app.get('/api/tasks', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM tasks');
    connection.release();
    // Parsifica il campo 'assignees' da stringa JSON a array di stringhe
    const tasks = (rows as any[]).map(row => ({
      ...row,
      assignees: JSON.parse(row.assignees),
    }));
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile ottenere task' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    connection.release();
    if ((rows as any[]).length === 0) return res.status(404).json({ error: 'Task non trovato' });
    
    const row = (rows as any[])[0];
    // Parsifica il campo 'assignees'
    const task: ITask = {
      ...row,
      assignees: JSON.parse(row.assignees),
    };
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Errore nel recupero task' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task: ITask = req.body;
    const connection = await pool.getConnection();
    await connection.query(`
      INSERT INTO tasks (id, siteId, description, dueDate, status, assignees, type, odlNumber, startDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [task.id, task.siteId, task.description, task.dueDate, task.status, JSON.stringify(task.assignees), // Stringifica l'array di stringhe
      task.type, task.odlNumber || null, task.startDate || null]);
    connection.release();
    res.status(201).json(task); // Ritorna il task creato per coerenza con il frontend
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile creare task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task: Partial<ITask> = req.body;
    const connection = await pool.getConnection();
    const result = await connection.query(`
      UPDATE tasks
      SET siteId = ?, description = ?, dueDate = ?, status = ?, assignees = ?, type = ?, odlNumber = ?, startDate = ?
      WHERE id = ?`,
      [task.siteId, task.description, task.dueDate, task.status, JSON.stringify(task.assignees), // Stringifica l'array di stringhe
      task.type, task.odlNumber || null, task.startDate || null, req.params.id]);
    connection.release();
    if ((result[0] as any).affectedRows === 0) return res.status(404).json({ error: 'Task non trovato' });
    // Ritorna il task aggiornato per coerenza. Potresti volerlo recuperare intero dal DB per essere sicuro.
    res.json({ ...task, id: req.params.id }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile aggiornare task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    connection.release();
    if ((result[0] as any).affectedRows === 0) return res.status(404).json({ error: 'Task non trovato' });
    res.json({ message: 'Task eliminato' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossibile eliminare task' });
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});