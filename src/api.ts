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
  dueDate: string; // Modificato: Solo stringa
  status: TaskStatus;
  assignees: string[];
  type: 'maintenance' | 'odl';
  odlNumber?: string;
  startDate?: string; // Modificato: Solo stringa
  user_id?: string; // Aggiunto per l'associazione all'utente
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

// Funzione helper per aggiungere l'header di autorizzazione
const getAuthHeaders = (accessToken?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
};

// --- API FUNCTIONS ---
export const getSites = async (accessToken?: string): Promise<ISite[]> => {
  const response = await fetch(`${API_BASE_URL}/sites`, {
    headers: getAuthHeaders(accessToken),
  });
  return handleResponse(response);
};

export const getUsers = async (accessToken?: string): Promise<IUser[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(accessToken),
  });
  return handleResponse(response);
};

export const getTasks = async (accessToken?: string): Promise<ITask[]> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: getAuthHeaders(accessToken),
  });
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

export const addTask = async (taskData: Omit<ITask, 'id'>, accessToken?: string): Promise<ITask> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      ...taskData,
      id: `task-${Date.now()}`,
    }),
  });
  return handleResponse(response);
};

export const updateTask = async (taskId: string, updates: Partial<ITask>, accessToken?: string): Promise<ITask> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(updates),
  });
  return handleResponse(response);
};

export const deleteTask = async (taskId: string, accessToken?: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(accessToken),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
};

export const saveSite = async (siteData: ISite, accessToken?: string): Promise<ISite> => {
  // Assicurati che i campi JSONB siano sempre oggetti (anche vuoti) e i campi text siano stringhe (anche vuote)
  // per evitare violazioni di vincoli NOT NULL se il database li richiede.
  const siteDataToSend = {
    ...siteData,
    manager: siteData.manager && siteData.manager.name ? siteData.manager : {},
    contactPerson: siteData.contactPerson && siteData.contactPerson.name ? siteData.contactPerson : {},
    landline: siteData.landline || '',
    otherContacts: siteData.otherContacts || [],
  };

  // Nota: Questo modo di verificare l'esistenza del sito (fetchando tutti i siti)
  // non è ottimale per le API reali. In un backend vero, useresti un endpoint GET specifico
  // per ID per verificare, o l'API stessa gestirebbe l'UPSERT basato sull'ID fornito.
  // Per ora, manteniamo la logica esistente ma con l'accessToken.
  const existingSite = await fetch(`${API_BASE_URL}/sites`, { headers: getAuthHeaders(accessToken) }).then(r => r.json()).then(sites => sites.find((s: ISite) => s.id === siteData.id));
  
  const method = existingSite ? 'PUT' : 'POST';
  const url = existingSite ? `${API_BASE_URL}/sites/${siteData.id}` : `${API_BASE_URL}/sites`;
  
  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(siteDataToSend),
  });
  return handleResponse(response);
};

export const saveUser = async (userData: IUser, accessToken?: string): Promise<IUser> => {
  // Stessa nota per la verifica dell'esistenza utente.
  // Per ora, manteniamo la logica esistente ma con l'accessToken.
  const existingUser = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders(accessToken) }).then(r => r.json()).then(users => users.find((u: IUser) => u.id === userData.id));
  
  const method = existingUser ? 'PUT' : 'POST';
  const url = existingUser ? `${API_BASE_URL}/users/${userData.id}` : `${API_BASE_URL}/users`;
  
  const response = await fetch(url, {
    method,
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};