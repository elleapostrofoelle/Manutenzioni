// --- TIPI E DATI REALI DAL CONTRATTO ---
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
  dueDate: string; // Modificato: Solo stringa
  status: TaskStatus;
  assignees: string[];
  type: 'maintenance' | 'odl';
  odlNumber?: string;
  startDate?: string; // Modificato: Solo stringa
}

export interface INotification {
  id: string;
  taskId: string;
  message: string;
  read: boolean;
  type: 'imminent' | 'overdue';
  task: ITask;
}

// --- API BASE URL ---
// Utilizza un percorso relativo per le API.
// In sviluppo, Vite proxyerà queste richieste.
// In produzione, IIS (tramite web.config) le inoltrerà al backend.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// --- UTILITY FUNCTIONS ---
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text(); // Leggi il corpo della risposta per più dettagli
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  return response.json();
};

// --- API FUNCTIONS ---
export const getSites = async (): Promise<ISite[]> => {
  const response = await fetch(`${API_BASE_URL}/sites`);
  return handleResponse(response);
};

export const getUsers = async (): Promise<IUser[]> => {
  const response = await fetch(`${API_BASE_URL}/users`);
  return handleResponse(response);
};

export const getTasks = async (): Promise<ITask[]> => {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  return handleResponse(response);
};

export const getMaintenanceActivities = async (): Promise<string[]> => {
  // This can be hardcoded or fetched from the backend
  return [
    'Manutenzione ordinaria impianto di condizionamento (Semestrale)',
    'Verifica impianto riscaldamento (Annuale)',
    'Controllo impianto idrico sanitario - Legionella (Semestrale)',
    'Manutenzione impianto elettrico e illuminazione (Annuale)',
    'Verifica interruttori differenziali (Annuale)',
    'Controllo automazione cancelli e varchi (Semestrale)',
    'Manutenzione ordinaria ascensore (Trimestrale)',
    'Pulizia e lubrificazione parti meccaniche ascensore (Semestrale)',
    'Ispezione visiva impianto aeraulico (Annuale)',
    'Analisi potabilità acque (Annuale)',
    'Verifica parametri temperatura/umidità (Mensile)',
    'Manutenzione impianto fotovoltaico (Annuale)',
    'Verifica estintori e segnaletica emergenza (Semestrale)',
    'Manutenzione impianto citofonico (Annuale)',
    'Manutenzione programmata (Mensile)',
    'Manutenzione programmata (Bimestrale)',
    'Manutenzione programmata (Trimestrale)',
    'Manutenzione programmata (Semestrale)',
    'Manutenzione programmata (Annuale)',
  ];
};

export const addTask = async (taskData: Omit<ITask, 'id'>): Promise<ITask> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...taskData,
      id: `task-${Date.now()}`,
    }),
  });
  return handleResponse(response);
};

export const updateTask = async (taskId: string, updates: Partial<ITask>): Promise<ITask> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
};

export const saveSite = async (siteData: ISite): Promise<ISite> => {
  // Assicurati che otherContacts sia sempre un array, anche se vuoto
  const siteDataToSend = {
    ...siteData,
    otherContacts: siteData.otherContacts || [],
  };

  // Nota: Questo modo di verificare l'esistenza del sito (fetchando tutti i siti)
  // non è ottimale per le API reali. In un backend vero, useresti un endpoint GET specifico
  // per ID per verificare, o l'API stessa gestirebbe l'UPSERT basato sull'ID fornito.
  const existingSite = await fetch(`${API_BASE_URL}/sites`).then(r => r.json()).then(sites => sites.find((s: ISite) => s.id === siteData.id));
  
  const method = existingSite ? 'PUT' : 'POST';
  const url = existingSite ? `${API_BASE_URL}/sites/${siteData.id}` : `${API_BASE_URL}/sites`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(siteDataToSend),
  });
  return handleResponse(response);
};

export const saveUser = async (userData: IUser): Promise<IUser> => {
  // Stessa nota per la verifica dell'esistenza utente.
  const existingUser = await fetch(`${API_BASE_URL}/users`).then(r => r.json()).then(users => users.find((u: IUser) => u.id === userData.id));
  
  const method = existingUser ? 'PUT' : 'POST';
  const url = existingUser ? `${API_BASE_URL}/users/${userData.id}` : `${API_BASE_URL}/users`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};