import express, { Express, Request, Response } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione del pool di connessioni MySQL
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

// Interfacce TypeScript
interface ISite {
  id: string;
  name: string;
  address: string;
  manager?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  contactPerson?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  landline?: string;
  otherContacts?: Array<{
    id: string;
    name: string;
    phone?: string;
    email?: string;
  }>;
}

interface IUser {
  id: string;
  name: string;
  role: string;
}

interface ITask {
  id: string;
  siteId: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignees: string[];
  type: 'maintenance' | 'odl';
  odlNumber?: string;
  startDate?: string;
}

// ROUTES - SITES
app.get('/api/sites', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM sites');
    
    const sites: ISite[] = [];
    for (const row of rows as any[]) {
      const [otherContacts] = await connection.query(
        'SELECT id, name, phone, email FROM other_contacts WHERE site_id = ?',
        [row.id]
      );
      
      sites.push({
        id: row.id,
        name: row.name,
        address: row.address,
        manager: row.manager_name ? {
          name: row.manager_name,
          phone: row.manager_phone,
          email: row.manager_email,
        } : undefined,
        contactPerson: row.contact_person_name ? {
          name: row.contact_person_name,
          phone: row.contact_person_phone,
          email: row.contact_person_email,
        } : undefined,
        landline: row.landline,
        otherContacts: otherContacts as any,
      });
    }
    
    connection.release();
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

app.post('/api/sites', async (req: Request, res: Response) => {
  try {
    const { id, name, address, manager, contactPerson, landline, otherContacts } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO sites (id, name, address, manager_name, manager_phone, manager_email, contact_person_name, contact_person_phone, contact_person_email, landline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        name,
        address,
        manager?.name || null,
        manager?.phone || null,
        manager?.email || null,
        contactPerson?.name || null,
        contactPerson?.phone || null,
        contactPerson?.email || null,
        landline || null,
      ]
    );
    
    if (otherContacts && Array.isArray(otherContacts)) {
      for (const contact of otherContacts) {
        await connection.query(
          'INSERT INTO other_contacts (id, site_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
          [contact.id, id, contact.name, contact.phone || null, contact.email || null]
        );
      }
    }
    
    connection.release();
    res.status(201).json({ id, name, address, manager, contactPerson, landline, otherContacts });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
});

app.put('/api/sites/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, manager, contactPerson, landline, otherContacts } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE sites SET name = ?, address = ?, manager_name = ?, manager_phone = ?, manager_email = ?, contact_person_name = ?, contact_person_phone = ?, contact_person_email = ?, landline = ? WHERE id = ?',
      [
        name,
        address,
        manager?.name || null,
        manager?.phone || null,
        manager?.email || null,
        contactPerson?.name || null,
        contactPerson?.phone || null,
        contactPerson?.email || null,
        landline || null,
        id,
      ]
    );
    
    // Delete old other_contacts and insert new ones
    await connection.query('DELETE FROM other_contacts WHERE site_id = ?', [id]);
    if (otherContacts && Array.isArray(otherContacts)) {
      for (const contact of otherContacts) {
        await connection.query(
          'INSERT INTO other_contacts (id, site_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
          [contact.id, id, contact.name, contact.phone || null, contact.email || null]
        );
      }
    }
    
    connection.release();
    res.json({ id, name, address, manager, contactPerson, landline, otherContacts });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// ROUTES - USERS
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { id, name, role } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO users (id, name, role) VALUES (?, ?, ?)',
      [id, name, role]
    );
    
    connection.release();
    res.status(201).json({ id, name, role });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE users SET name = ?, role = ? WHERE id = ?',
      [name, role, id]
    );
    
    connection.release();
    res.json({ id, name, role });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ROUTES - TASKS
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM tasks');
    
    const tasks: ITask[] = [];
    for (const row of rows as any[]) {
      const [assignees] = await connection.query(
        'SELECT assignee_name FROM task_assignees WHERE task_id = ?',
        [row.id]
      );
      
      tasks.push({
        id: row.id,
        siteId: row.site_id,
        description: row.description,
        dueDate: row.due_date,
        status: row.status,
        assignees: (assignees as any[]).map(a => a.assignee_name),
        type: row.type,
        odlNumber: row.odl_number,
        startDate: row.start_date,
      });
    }
    
    connection.release();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { id, siteId, description, dueDate, status, assignees, type, odlNumber, startDate } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO tasks (id, site_id, description, due_date, status, type, odl_number, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, siteId, description, dueDate, status, type, odlNumber || null, startDate || null]
    );
    
    if (assignees && Array.isArray(assignees)) {
      for (const assignee of assignees) {
        await connection.query(
          'INSERT INTO task_assignees (task_id, assignee_name) VALUES (?, ?)',
          [id, assignee]
        );
      }
    }
    
    connection.release();
    res.status(201).json({ id, siteId, description, dueDate, status, assignees, type, odlNumber, startDate });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { siteId, description, dueDate, status, assignees, type, odlNumber, startDate } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE tasks SET site_id = ?, description = ?, due_date = ?, status = ?, type = ?, odl_number = ?, start_date = ? WHERE id = ?',
      [siteId, description, dueDate, status, type, odlNumber || null, startDate || null, id]
    );
    
    // Delete old assignees and insert new ones
    await connection.query('DELETE FROM task_assignees WHERE task_id = ?', [id]);
    if (assignees && Array.isArray(assignees)) {
      for (const assignee of assignees) {
        await connection.query(
          'INSERT INTO task_assignees (task_id, assignee_name) VALUES (?, ?)',
          [id, assignee]
        );
      }
    }
    
    connection.release();
    res.json({ id, siteId, description, dueDate, status, assignees, type, odlNumber, startDate });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query('DELETE FROM tasks WHERE id = ?', [id]);
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ROUTES - NOTIFICATIONS
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT n.*, t.description, t.due_date, t.status, t.site_id
      FROM notifications n
      JOIN tasks t ON n.task_id = t.id
      ORDER BY n.created_at DESC
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    
    connection.release();
    res.json({ id, is_read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

