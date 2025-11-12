// src/api.ts

// --- TIPI E INTERFACCE ---
export interface IPersonContact { name: string; phone?: string; email?: string; }
export interface IOtherContact extends IPersonContact { id: string; }
export interface ISite { id: string; name: string; address: string; manager?: IPersonContact; contactPerson?: IPersonContact; landline?: string; otherContacts?: IOtherContact[]; user_id?: string; }
export interface IUser { id: string; name: string; role: string; }
export interface IRole { id: string; name: string; user_id: string; }
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export interface ITask { id: string; siteId: string; description: string; dueDate: string; status: TaskStatus; assignees: string[]; type: 'maintenance' | 'odl'; odlNumber?: string; startDate?: string; user_id?: string; }
export interface INotification { id: string; taskId: string; message: string; read: boolean; type: 'imminent' | 'overdue'; task: ITask; }
export const deleteUser = (userId: string, accessToken?: string): Promise<void> => {
  return makeApiCall(`/users/${userId}`, accessToken, { method: 'DELETE' });
};

// --- CONFIGURAZIONE API E FUNZIONE HELPER ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
console.log('API_BASE_URL in src/api.ts:', API_BASE_URL);

/**
 * Funzione helper centralizzata per tutte le chiamate API.
 */
async function makeApiCall<T>(endpoint: string, accessToken?: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorBody = 'No error details provided';
      try {
        const errorData = await response.json();
        errorBody = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        // errorBody = await response.text();
      }
      throw new Error(`${response.status} ${response.statusText} - ${errorBody}`);
    }

    if (response.status === 204) {
      return undefined as T; 
    }

    return await response.json();
  } catch (error) {
    throw error; 
  }
}

// --- FUNZIONI API DI LETTURA (CON GESTIONE ERRORI PER EVITARE CRASH) ---

export const getSites = async (accessToken?: string): Promise<ISite[]> => {
    try {
        return await makeApiCall<ISite[]>('/sites', accessToken);
    } catch (e) {
        return [];
    }
};

export const getUsers = async (accessToken?: string): Promise<IUser[]> => {
    try {
        // La logica nel backend per questa rotta restituisce un array, quindi usiamo IUser[]
        return await makeApiCall<IUser[]>('/users', accessToken);
    } catch (e) {
        // Restituisci un array vuoto in caso di errore per evitare il crash di .map nell'app
        return [];
    }
};

export const getTasks = async (accessToken?: string): Promise<ITask[]> => {
    try {
        return await makeApiCall<ITask[]>('/tasks', accessToken);
    } catch (e) {
        return [];
    }
};

export const getRoles = async (accessToken?: string): Promise<IRole[]> => {
    try {
        return await makeApiCall<IRole[]>('/roles', accessToken);
    } catch (e) {
        return [];
    }
};

export const getMaintenanceActivities = (): Promise<string[]> => {
  return Promise.resolve([
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
  ]);
};

// --- FUNZIONI API DI SCRITTURA ---

export const addTask = (taskData: Omit<ITask, 'id'>, accessToken?: string): Promise<ITask> => {
  return makeApiCall('/tasks', accessToken, { method: 'POST', body: JSON.stringify(taskData) });
};

export const updateTask = (taskId: string, updates: Partial<ITask>, accessToken?: string): Promise<ITask> => {
  return makeApiCall(`/tasks/${taskId}`, accessToken, { method: 'PUT', body: JSON.stringify(updates) });
};

export const deleteTask = (taskId: string, accessToken?: string): Promise<void> => {
  return makeApiCall(`/tasks/${taskId}`, accessToken, { method: 'DELETE' });
};

export const saveSite = (siteData: ISite, accessToken?: string): Promise<ISite> => {
  const isUpdating = siteData.id && !siteData.id.startsWith('site-'); 
  const method = isUpdating ? 'PUT' : 'POST';
  const endpoint = isUpdating ? `/sites/${siteData.id}` : '/sites';
  
  const { id, ...dataToSend } = siteData;
  const finalData = isUpdating ? siteData : dataToSend;
  
  return makeApiCall(endpoint, accessToken, { method, body: JSON.stringify(finalData) });
};

export const saveUser = (userData: IUser, accessToken?: string): Promise<IUser> => {
    const isUpdating = userData.id && !userData.id.startsWith('user-'); 
    const method = isUpdating ? 'PUT' : 'POST';
    const endpoint = isUpdating ? `/users/${userData.id}` : '/users';
  
    const { id, ...dataToSend } = userData;
    const finalData = isUpdating ? userData : dataToSend;
  
    return makeApiCall(endpoint, accessToken, { method, body: JSON.stringify(finalData) });
};

// --- NUOVE FUNZIONI API PER LE MANSIONI (ROLES) ---

export const addRole = (roleData: { name: string }, accessToken?: string): Promise<IRole> => {
  return makeApiCall('/roles', accessToken, { method: 'POST', body: JSON.stringify(roleData) });
};

export const updateRole = (roleId: string, roleData: { name: string }, accessToken?: string): Promise<IRole> => {
  return makeApiCall(`/roles/${roleId}`, accessToken, { method: 'PUT', body: JSON.stringify(roleData) });
};

export const deleteRole = (roleId: string, accessToken?: string): Promise<void> => {
  return makeApiCall(`/roles/${roleId}`, accessToken, { method: 'DELETE' });
};