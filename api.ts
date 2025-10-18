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
  dueDate: Date | string; // Use string for serialization
  status: TaskStatus;
  assignees: string[];
  type: 'maintenance' | 'odl';
  odlNumber?: string;
  startDate?: Date | string; // Use string for serialization
}

export interface INotification {
  id: string;
  taskId: string;
  message: string;
  read: boolean;
  type: 'imminent' | 'overdue';
  task: ITask;
}

// --- FAKE DATABASE ---
const SIMULATED_DELAY = 500; // ms

let sites: ISite[] = [
    { 
        id: 'site-1', name: 'Centro di Arezzo', address: 'Via Delle Biole, 18, 52100 Arezzo (AR)',
        manager: { name: 'Paolo Gentili', phone: '333 1112233', email: 'p.gentili@example.com' },
        contactPerson: { name: 'Francesca Neri', phone: '333 4445566', email: 'f.neri@example.com' },
        landline: '0575 123456',
        otherContacts: [{id: 'c-1', name: 'Ufficio Tecnico', phone: '0575 123457', email: 'uff.tecnico.ar@example.com'}]
    },
    { 
        id: 'site-2', name: 'Centro di Avezzano', address: 'Via Avezzano, 136, 67051 Avezzano (AQ)',
        manager: { name: 'Simone Rinaldi', phone: '347 9998877', email: 's.rinaldi@example.com' },
        contactPerson: { name: 'Marco Esposito', phone: '348 1122334', email: 'm.esposito@example.com' },
        landline: '0863 987654'
    },
    { id: 'site-3', name: 'Centro di Follonica', address: 'Via del Fonditore, 747, 58022 Follonica (GR)' },
    { id: 'site-4', name: 'Centro di Guidonia', address: 'Via Nomentana Km 15, 00012 Guidonia (RM)' },
    { id: 'site-5', name: 'Centro di Pisa', address: 'Via Don Minzoni, 3, 56010 Migliarino Pisano (PI)' },
    { id: 'site-6', name: 'Distaccamento S. Stefano di Magra', address: 'Via Lagoscuro, 119, 19020 Vezzano Ligure (SP)' },
    { id: 'site-7', name: 'Centro di Spoleto', address: 'Via Flaminia Vecchia 228, 06049 Spoleto (PG)' },
    { id: 'site-8', name: 'Centro di Scandicci', address: 'Via Delle Fonti Località La Pieve, 50018 Scandicci (FI)' },
    { id: 'site-9', name: 'Centro di Terracina', address: 'S.S.148 Pontina, Km. 102, 04019 Terracina (LT)' },
    { id: 'site-10', name: 'Centro di Viterbo', address: 'Strada Rinaldone, 24, Loc. Poggino, 01100 Viterbo (VT)' },
    { id: 'site-11', name: 'Progetti Infrastrutture Viterbo', address: 'Via delle Industrie 22, 01100 Viterbo (VT)' },
    { id: 'site-12', name: 'Centrale Compressione Gallese', address: 'S.P. Ortana - Località Rio Fratta snc, 01035 Gallese Scalo (VT)' },
    { id: 'site-13', name: 'Centrale Compressione Terranuova Bracciolini', address: 'Località Cicogna - via I. Piani, 42, 52028 Terranuova Bracciolini (AR)' },
];

let users: IUser[] = [
    { id: 'user-1', name: 'Mario Rossi', role: 'Elettricista' },
    { id: 'user-2', name: 'Luca Bianchi', role: 'Idraulico' },
    { id: 'user-3', name: 'Paolo Verdi', role: 'Tecnico HVAC' },
    { id: 'user-4', name: 'Anna Neri', role: 'Manutentore Generale' },
];

let tasks: ITask[] = [
    { id: 'task-1', siteId: 'site-12', description: 'Controllo automazione cancelli e varchi', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)), status: 'pending', assignees: ['Mario Rossi'], type: 'maintenance' },
    { id: 'task-2', siteId: 'site-1', description: 'Verifica impianto riscaldamento', dueDate: new Date(new Date().setDate(new Date().getDate() + 4)), status: 'in_progress', assignees: ['Luca Bianchi', 'Paolo Verdi'], type: 'maintenance' },
    { id: 'task-3', siteId: 'site-7', description: 'Manutenzione ordinaria ascensore (trimestrale)', dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), status: 'pending', assignees: ['Mario Rossi'], type: 'maintenance' },
    { id: 'task-4', siteId: 'site-4', description: 'Verifica estintori e segnaletica emergenza', dueDate: new Date(new Date().setDate(new Date().getDate() - 2)), status: 'completed', assignees: ['Paolo Verdi'], type: 'maintenance' },
    { id: 'task-5', siteId: 'site-13', description: 'Manutenzione impianto elettrico e illuminazione', dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), status: 'pending', assignees: ['Luca Bianchi'], type: 'maintenance' },
    { id: 'task-6', siteId: 'site-10', description: 'Controllo impianto idrico sanitario (Legionella)', dueDate: new Date(new Date().setDate(new Date().getDate() - 1)), status: 'in_progress', assignees: ['Anna Neri'], type: 'maintenance' },
    { id: 'task-7', siteId: 'site-5', description: 'Analisi potabilità acque (annuale)', dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), status: 'pending', assignees: ['Paolo Verdi'], type: 'maintenance' },
    { id: 'task-8', siteId: 'site-8', description: 'Manutenzione ordinaria impianto di condizionamento', dueDate: new Date(new Date().setDate(new Date().getDate() + 18)), status: 'completed', assignees: ['Mario Rossi'], type: 'maintenance' },
    { id: 'task-9', siteId: 'site-2', description: 'Verifica parametri temperatura/umidità (mensile)', dueDate: new Date(new Date().setDate(new Date().getDate() + 20)), status: 'pending', assignees: ['Luca Bianchi'], type: 'maintenance' },
    { id: 'task-10', siteId: 'site-11', description: 'Verifica interruttori differenziali (annuale)', dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), status: 'pending', assignees: ['Anna Neri'], type: 'maintenance' },
    { id: 'task-11', siteId: 'site-3', description: 'Manutenzione impianto citofonico', dueDate: new Date(new Date().setDate(new Date().getDate() + 25)), status: 'in_progress', assignees: ['Mario Rossi'], type: 'maintenance' },
    { id: 'task-12', siteId: 'site-6', description: 'Ispezione visiva impianto aeraulico (annuale)', dueDate: new Date(new Date().setDate(new Date().getDate() + 28)), status: 'pending', assignees: ['Paolo Verdi'], type: 'maintenance' },
    { id: 'task-13', siteId: 'site-1', description: 'Sostituzione pompa di calore', dueDate: new Date(new Date().setDate(new Date().getDate() + 10)), status: 'pending', assignees: ['Paolo Verdi'], type: 'odl', odlNumber: 'ODL-2024-001', startDate: new Date(new Date().setDate(new Date().getDate() + 8))},
];

const maintenanceActivities: string[] = [
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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API FUNCTIONS ---
export const getSites = async (): Promise<ISite[]> => {
    await wait(SIMULATED_DELAY);
    return JSON.parse(JSON.stringify(sites));
};

export const getUsers = async (): Promise<IUser[]> => {
    await wait(SIMULATED_DELAY);
    return JSON.parse(JSON.stringify(users));
};

export const getTasks = async (): Promise<ITask[]> => {
    await wait(SIMULATED_DELAY);
    // Convert Date objects to ISO strings for serialization simulation
    return JSON.parse(JSON.stringify(tasks.map(task => ({
        ...task,
        dueDate: new Date(task.dueDate).toISOString(),
        startDate: task.startDate ? new Date(task.startDate).toISOString() : undefined
    }))));
};

export const getMaintenanceActivities = async (): Promise<string[]> => {
    await wait(SIMULATED_DELAY);
    return [...maintenanceActivities];
}

export const addTask = async (taskData: Omit<ITask, 'id'>): Promise<ITask> => {
    await wait(SIMULATED_DELAY);
    const newTask = { ...taskData, id: `task-${Date.now()}` };
    tasks.push(newTask);
    return JSON.parse(JSON.stringify(newTask));
}

export const updateTask = async (taskId: string, updates: Partial<ITask>): Promise<ITask> => {
    await wait(SIMULATED_DELAY);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error("Task not found");
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    return JSON.parse(JSON.stringify(tasks[taskIndex]));
}

export const deleteTask = async (taskId: string): Promise<void> => {
    await wait(SIMULATED_DELAY);
    tasks = tasks.filter(t => t.id !== taskId);
}

export const saveSite = async (siteData: ISite): Promise<ISite> => {
    await wait(SIMULATED_DELAY);
    const siteIndex = sites.findIndex(s => s.id === siteData.id);
    if (siteIndex > -1) {
        sites[siteIndex] = siteData;
    } else {
        sites.push(siteData);
    }
    return JSON.parse(JSON.stringify(siteData));
}

export const saveUser = async (userData: IUser): Promise<IUser> => {
    await wait(SIMULATED_DELAY);
    const userIndex = users.findIndex(u => u.id === userData.id);
    if (userIndex > -1) {
        users[userIndex] = userData;
    } else {
        users.push(userData);
    }
    return JSON.parse(JSON.stringify(userData));
}