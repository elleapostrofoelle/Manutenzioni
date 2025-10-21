import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as api from './api.ts'; // Modificato da api.js a api.ts
import type { ITask, ISite, IUser, INotification, TaskStatus, IPersonContact, IOtherContact } from './api.ts'; // Modificato da api.js a api.ts

// Global type for BeforeInstallPromptEvent if not already in your environment (e.g., tsconfig lib)
declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed',
      platform: string,
    }>;
    prompt(): Promise<void>;
  }
}

// --- COMPONENTI UI ---

interface NotificationBellProps {
  notifications: INotification[];
  onNotificationClick: (notification: INotification) => void;
  onMarkAllAsRead: () => void;
  sites: ISite[];
}

const NotificationBell = ({ notifications, onNotificationClick, onMarkAllAsRead, sites }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n: INotification) => !n.read).length;
  const siteNameMap = useMemo(() => Object.fromEntries(sites.map((s: ISite) => [s.id, s.name])), [sites]);

  return (
    <div className="notification-bell-wrapper">
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)} aria-label={`Notifiche: ${unreadCount} non lette`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifiche</h3>
            {unreadCount > 0 && <button onClick={onMarkAllAsRead}>Segna tutte come lette</button>}
          </div>
          <div className="notification-list">
            {notifications.length > 0 ? notifications.map((notif: INotification) => (
              <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''} ${notif.type}`} onClick={() => { onNotificationClick(notif); setIsOpen(false); }}>
                <p className="notification-message">{notif.message}</p>
                <p className="notification-details">{siteNameMap[notif.task.siteId]} - Scadenza: {new Date(notif.task.dueDate).toLocaleDateString('it-IT')}</p>
              </div>
            )) : <p className="no-notifications">Nessuna notifica.</p>}
          </div>
        </div>
      )}
    </div>
  );
};


const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void; }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

interface AddTaskFormProps {
  sites: ISite[];
  users: IUser[];
  maintenanceActivities: string[];
  onAddTask: (taskData: Omit<ITask, 'id'>) => Promise<void>;
  onClose: () => void;
  selectedDate: Date;
  selectedSiteId?: string;
}

const AddTaskForm = ({ sites, users, maintenanceActivities, onAddTask, onClose, selectedDate, selectedSiteId }: AddTaskFormProps) => {
  const [siteId, setSiteId] = useState(selectedSiteId || sites[0]?.id || '');
  const [description, setDescription] = useState(maintenanceActivities[0] || '');
  const [customDescription, setCustomDescription] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);

  const handleAssigneeChange = (userName: string) => {
    setAssignees(prev => 
      prev.includes(userName) 
        ? prev.filter(name => name !== userName)
        : [...prev, userName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDescription = customDescription.trim() || description;

    if (!finalDescription) {
        alert('Per favore, inserisci una descrizione per l\'attività.');
        return;
    }
    if (assignees.length === 0) {
        alert('Selezionare almeno un assegnatario.');
        return;
    }
    await onAddTask({
      siteId,
      description: finalDescription,
      dueDate: selectedDate.toISOString().split('T')[0], // Passa come stringa ISO
      status: 'pending',
      assignees,
      type: 'maintenance',
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-header">
        <h2>Nuova Manutenzione</h2>
        <button type="button" className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="form-group">
        <label htmlFor="site">Sito</label>
        <select id="site" value={siteId} onChange={e => setSiteId(e.target.value)} required>
          {sites.map((site: ISite) => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="description">Descrizione Attività</label>
        <select 
            id="description" 
            value={description} 
            onChange={e => { setDescription(e.target.value); setCustomDescription(''); }} // Reset custom description on select change
            disabled={!!customDescription.trim()} // Disable if custom description is active
            required={!customDescription.trim()}
        >
            {maintenanceActivities.map((activity: string) => <option key={activity} value={activity}>{activity}</option>)}
        </select>
        <textarea 
            placeholder="O inserisci una descrizione personalizzata..." 
            value={customDescription}
            onChange={e => setCustomDescription(e.target.value)} 
            style={{marginTop: '8px'}} 
            rows={3}
        />
      </div>
       <div className="form-group">
        <label>Assegnato a</label>
        <div className="assignee-group">
          {users.map((user: IUser) => (
            <div key={user.id} className="assignee-item">
              <input 
                type="checkbox" 
                id={`user-${user.id}`} 
                checked={assignees.includes(user.name)}
                onChange={() => handleAssigneeChange(user.name)}
              />
              <label htmlFor={`user-${user.id}`}>{user.name}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">Aggiungi</button>
      </div>
    </form>
  );
};

interface AddODLFormProps {
  sites: ISite[];
  users: IUser[];
  onAddTask: (taskData: Omit<ITask, 'id'>) => Promise<void>;
  onClose: () => void;
}

const AddODLForm = ({ sites, users, onAddTask, onClose }: AddODLFormProps) => {
    const [siteId, setSiteId] = useState(sites[0]?.id || '');
    const [description, setDescription] = useState('');
    const [assignees, setAssignees] = useState<string[]>([]);
    const [odlNumber, setOdlNumber] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAssigneeChange = (userName: string) => {
        setAssignees(prev => 
            prev.includes(userName) 
                ? prev.filter(name => name !== userName)
                : [...prev, userName]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!siteId || !description || !odlNumber || assignees.length === 0) {
            alert('Per favore, compila tutti i campi obbligatori.');
            return;
        }
        await onAddTask({
            siteId,
            description,
            dueDate, // Passa come stringa ISO
            status: 'pending',
            assignees,
            type: 'odl',
            odlNumber,
            startDate, // Passa come stringa ISO
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-header">
                <h2>Nuovo Ordine di Lavoro (ODL)</h2>
                <button type="button" className="close-button" onClick={onClose}>&times;</button>
            </div>
            <div className="form-group">
                <label htmlFor="odlNumber">Numero ODL</label>
                <input id="odlNumber" type="text" value={odlNumber} onChange={e => setOdlNumber(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="site">Sito</label>
                <select id="site" value={siteId} onChange={e => setSiteId(e.target.value)} required>
                    {sites.map((site: ISite) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="description">Descrizione Lavoro</label>
                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="form-group-row">
                <div className="form-group">
                    <label htmlFor="startDate">Data Inizio</label>
                    <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="dueDate">Data Fine</label>
                    <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
            </div>
            <div className="form-group">
                <label>Assegnato a</label>
                <div className="assignee-group">
                    {users.map((user: IUser) => (
                        <div key={user.id} className="assignee-item">
                            <input 
                                type="checkbox" 
                                id={`user-odl-${user.id}`} 
                                checked={assignees.includes(user.name)}
                                onChange={() => handleAssigneeChange(user.name)}
                            />
                            <label htmlFor={`user-odl-${user.id}`}>{user.name}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Crea ODL</button>
            </div>
        </form>
    );
};

interface SiteFormProps {
  onSaveSite: (site: ISite) => Promise<void>;
  onClose: () => void;
  siteToEdit: ISite | null;
}

const SiteForm = ({ onSaveSite, onClose, siteToEdit }: SiteFormProps) => {
    const isEditing = !!siteToEdit;
    const [name, setName] = useState(siteToEdit?.name || '');
    const [address, setAddress] = useState(siteToEdit?.address || '');
    const [manager, setManager] = useState<IPersonContact>(siteToEdit?.manager || { name: '', phone: '', email: '' });
    const [contactPerson, setContactPerson] = useState<IPersonContact>(siteToEdit?.contactPerson || { name: '', phone: '', email: '' });
    const [landline, setLandline] = useState(siteToEdit?.landline || '');
    const [otherContacts, setOtherContacts] = useState<IOtherContact[]>(siteToEdit?.otherContacts || []);

    const handleAddContact = () => {
        setOtherContacts([...otherContacts, { id: `c-${Date.now()}`, name: '', phone: '', email: '' }]);
    };
    
    const handleRemoveContact = (id: string) => {
        setOtherContacts(otherContacts.filter(c => c.id !== id));
    };
    
    const handleContactChange = (id: string, field: keyof Omit<IOtherContact, 'id'>, value: string) => {
        setOtherContacts(otherContacts.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSaveSite({
            id: isEditing ? siteToEdit!.id : `site-${Date.now()}`,
            name,
            address,
            manager,
            contactPerson,
            landline,
            otherContacts,
        });
        onClose();
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-header">
                <h2>{isEditing ? 'Modifica Sito' : 'Nuovo Sito'}</h2>
                <button type="button" className="close-button" onClick={onClose}>&times;</button>
            </div>
            <div className="form-group">
                <label htmlFor="name">Nome Sito</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
                <label htmlFor="address">Indirizzo</label>
                <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} required />
            </div>
             <div className="form-group">
                <label htmlFor="landline">Telefono Fisso Sito</label>
                <input id="landline" type="text" value={landline} onChange={e => setLandline(e.target.value)} />
            </div>

            <div className="form-group-row">
                 <div className="form-group">
                    <label htmlFor="manager-name">Responsabile</label>
                    <input id="manager-name" type="text" placeholder="Nome" value={manager.name} onChange={e => setManager(m => ({...m, name: e.target.value}))} />
                </div>
                <div className="form-group">
                     <label htmlFor="manager-phone" className="sr-only">Telefono</label> {/* Utilizzo di sr-only per accessibilità */}
                    <input id="manager-phone" type="text" placeholder="Telefono" value={manager.phone} onChange={e => setManager(m => ({...m, phone: e.target.value}))} />
                </div>
                 <div className="form-group">
                     <label htmlFor="manager-email" className="sr-only">Email</label> {/* Utilizzo di sr-only per accessibilità */}
                    <input id="manager-email" type="email" placeholder="Email" value={manager.email} onChange={e => setManager(m => ({...m, email: e.target.value}))} />
                </div>
            </div>

            <div className="form-group-row">
                 <div className="form-group">
                    <label htmlFor="contact-name">Referente</label>
                    <input id="contact-name" type="text" placeholder="Nome" value={contactPerson.name} onChange={e => setContactPerson(c => ({...c, name: e.target.value}))} />
                </div>
                <div className="form-group">
                     <label htmlFor="contact-phone" className="sr-only">Telefono</label> {/* Utilizzo di sr-only per accessibilità */}
                    <input id="contact-phone" type="text" placeholder="Telefono" value={contactPerson.phone} onChange={e => setContactPerson(c => ({...c, phone: e.target.value}))} />
                </div>
                 <div className="form-group">
                     <label htmlFor="contact-email" className="sr-only">Email</label> {/* Utilizzo di sr-only per accessibilità */}
                    <input id="contact-email" type="email" placeholder="Email" value={contactPerson.email} onChange={e => setContactPerson(c => ({...c, email: e.target.value}))} />
                </div>
            </div>
            
            <div className="form-group">
                <label>Altri Contatti</label>
                <div className="other-contacts-list">
                    {otherContacts.map((contact: IOtherContact) => (
                        <div key={contact.id} className="contact-row">
                            <input type="text" placeholder="Nome" value={contact.name} onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)} />
                            <input type="text" placeholder="Telefono" value={contact.phone} onChange={(e) => handleContactChange(contact.id, 'phone', e.target.value)} />
                            <input type="email" placeholder="Email" value={contact.email} onChange={(e) => handleContactChange(contact.id, 'email', e.target.value)} />
                            <button type="button" className="btn-remove-contact" onClick={() => handleRemoveContact(contact.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddContact} className="btn btn-secondary btn-add-contact">Aggiungi Contatto</button>
            </div>

            <div className="modal-actions">
                <button type="submit" className="btn btn-primary">{isEditing ? 'Salva Modifiche' : 'Aggiungi Sito'}</button>
            </div>
        </form>
    );
};

interface UserFormProps {
  onSaveUser: (user: IUser) => Promise<void>;
  onClose: () => void;
  userToEdit: IUser | null;
}

const UserForm = ({ onSaveUser, onClose, userToEdit }: UserFormProps) => {
  const isEditing = !!userToEdit;
  const [name, setName] = useState(userToEdit?.name || '');
  const [role, setRole] = useState(userToEdit?.role || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveUser({ 
      id: isEditing ? userToEdit!.id : `user-${Date.now()}`, 
      name, 
      role 
    });
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-header">
        <h2>{isEditing ? 'Modifica Risorsa' : 'Nuova Risorsa'}</h2>
        <button type="button" className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="form-group">
        <label htmlFor="name">Nome e Cognome</label>
        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="role">Mansione</label>
        <input id="role" type="text" value={role} onChange={e => setRole(e.target.value)} required />
      </div>
      <div className="modal-actions">
        <button type="submit" className="btn btn-primary">{isEditing ? 'Salva Modifiche' : 'Aggiungi Risorsa'}</button>
      </div>
    </form>
  );
};

interface TaskDetailsFormProps {
  task: ITask;
  sites: ISite[];
  users: IUser[];
  onUpdateTask: (taskId: string, updates: Partial<ITask>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onClose: () => void;
}

const TaskDetailsForm = ({ task, sites, users, onUpdateTask, onDeleteTask, onClose }: TaskDetailsFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    
    // Converti le date in stringhe ISO 8601 per gli input type="date"
    const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);
    const [editDescription, setEditDescription] = useState(task.description);
    const [editDueDate, setEditDueDate] = useState(task.dueDate); // Già stringa ISO
    const [editAssignees, setEditAssignees] = useState<string[]>(task.assignees);
    const [editOdlNumber, setEditOdlNumber] = useState(task.odlNumber || '');
    const [editStartDate, setEditStartDate] = useState(task.startDate || ''); // Già stringa ISO
    
    const site = sites.find((s: ISite) => s.id === task.siteId);

    const handleDelete = async () => {
        if (window.confirm('Sei sicuro di voler eliminare questa attività?')) {
            await onDeleteTask(task.id);
            onClose();
        }
    };
    
    const handleSaveChanges = async () => {
        const updates: Partial<ITask> = {
            description: editDescription,
            dueDate: editDueDate, // Mantenuta come stringa ISO
            assignees: editAssignees,
            status: editStatus,
        };

        if (task.type === 'odl') {
            updates.odlNumber = editOdlNumber;
            updates.startDate = editStartDate || undefined; // Mantenuta come stringa ISO
        }

        await onUpdateTask(task.id, updates);
        setIsEditing(false);
    };
    
    const handleAssigneeChange = (userName: string) => {
        setEditAssignees(prev => 
          prev.includes(userName) 
            ? prev.filter(name => name !== userName)
            : [...prev, userName]
        );
    };

    const handleCancelEdit = () => {
        setEditStatus(task.status);
        setEditDescription(task.description);
        setEditDueDate(task.dueDate);
        setEditAssignees(task.assignees);
        setEditOdlNumber(task.odlNumber || '');
        setEditStartDate(task.startDate || '');
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div>
                <div className="modal-header">
                    <h2>Modifica {task.type === 'odl' ? 'ODL' : 'Attività'}</h2>
                    <button type="button" className="close-button" onClick={onClose}>&times;</button>
                </div>
                
                {task.type === 'odl' && (
                  <div className="form-group">
                    <label htmlFor="odlNumber-edit">Numero ODL</label>
                    <input id="odlNumber-edit" type="text" value={editOdlNumber} onChange={e => setEditOdlNumber(e.target.value)} />
                  </div>
                )}
                
                <div className="form-group">
                    <label htmlFor="description-edit">Descrizione</label>
                    <textarea id="description-edit" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                </div>
                
                {task.type === 'odl' ? (
                  <div className="form-group-row">
                    <div className="form-group">
                        <label htmlFor="startDate-edit">Data Inizio</label>
                        <input id="startDate-edit" type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dueDate-edit">Data Fine</label>
                        <input id="dueDate-edit" type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="dueDate-edit">Scadenza</label>
                    <input id="dueDate-edit" type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
                  </div>
                )}

                <div className="form-group">
                    <label>Assegnato a</label>
                    <div className="assignee-group">
                        {users.map((user: IUser) => (
                            <div key={user.id} className="assignee-item">
                                <input 
                                    type="checkbox" 
                                    id={`edit-user-${user.id}`} 
                                    checked={editAssignees.includes(user.name)}
                                    onChange={() => handleAssigneeChange(user.name)}
                                />
                                <label htmlFor={`edit-user-${user.id}`}>{user.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="status-edit">Stato</label>
                    <select id="status-edit" value={editStatus} onChange={e => setEditStatus(e.target.value as TaskStatus)}>
                        <option value="pending">Da fare</option>
                        <option value="in_progress">In corso</option>
                        <option value="completed">Completato</option>
                    </select>
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={handleCancelEdit} className="btn">Annulla</button>
                    <button type="button" onClick={handleSaveChanges} className="btn btn-primary">Salva Modifiche</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="modal-header">
                <h2>Dettagli {task.type === 'odl' ? 'ODL' : 'Manutenzione'}</h2>
                <button type="button" className="close-button" onClick={onClose}>&times;</button>
            </div>
            <div className="task-details">
                {task.type === 'odl' && <p><strong>Numero ODL:</strong> {task.odlNumber}</p>}
                <p><strong>Sito:</strong> {site?.name}</p>
                <p><strong>Indirizzo:</strong> {site?.address}</p>
                <p><strong>Descrizione:</strong> {task.description}</p>
                 {task.type === 'odl' && <p><strong>Data Inizio:</strong> {task.startDate ? new Date(task.startDate).toLocaleDateString('it-IT') : ''}</p>}
                <p><strong>Scadenza / Data Fine:</strong> {new Date(task.dueDate).toLocaleDateString('it-IT')}</p>
                <p><strong>Assegnato a:</strong> {task.assignees.join(', ')}</p>
                <p>
                    <strong>Stato:</strong>&nbsp;
                    <span className={`task-status-badge status-${task.status}`}>
                        {task.status === 'pending' ? 'Da fare' : task.status === 'in_progress' ? 'In corso' : 'Completato'}
                    </span>
                </p>
            </div>
             <div className="modal-actions space-between">
                <button type="button" onClick={handleDelete} className="btn btn-danger">Elimina</button>
                <div>
                    <button type="button" onClick={onClose} className="btn btn-secondary">Chiudi</button>
                    <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary">Modifica</button>
                </div>
            </div>
        </div>
    );
};

interface TaskListModalProps {
  title: string;
  tasks: ITask[];
  sites: ISite[];
  onClose: () => void;
  onTaskClick: (task: ITask) => void;
}

const TaskListModal = ({ title, tasks, sites, onClose, onTaskClick }: TaskListModalProps) => {
    const siteNameMap = useMemo(() => Object.fromEntries(sites.map((s: ISite) => [s.id, s.name])), [sites]);

    return (
        <div>
            <div className="modal-header">
                <h2>{title}</h2>
                <button type="button" className="close-button" onClick={onClose}>&times;</button>
            </div>
            <div className="task-list-modal-content">
                {tasks.length > 0 ? (
                    tasks.map((task: ITask) => (
                        <div key={task.id} className="task-list-modal-item" onClick={() => onTaskClick(task)}>
                            <span className={`status-dot ${task.status}`}></span>
                            <div className="task-list-modal-details">
                                <p className="task-desc">{task.type === 'odl' && `[ODL] `}{task.description}</p>
                                <p className="task-site">{siteNameMap[task.siteId]}</p>
                            </div>
                            <span className="history-assignees">{task.assignees.join(', ')}</span>
                            <span className="history-date">{new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                        </div>
                    ))
                ) : (
                    <p>Nessuna attività in questa categoria.</p>
                )}
            </div>
        </div>
    );
};

// --- VISTE PRINCIPALI ---

interface DashboardProps {
  tasks: ITask[];
  sites: ISite[];
  onCardClick: (cardType: string) => void;
  onTaskClick: (task: ITask) => void;
}

const Dashboard = ({ tasks, sites, onCardClick, onTaskClick }: DashboardProps) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const pendingTasks = tasks.filter((t: ITask) => t.status === 'pending').length;
  const inProgressTasks = tasks.filter((t: ITask) => t.status === 'in_progress').length;
  const completedThisMonth = tasks.filter((t: ITask) => t.status === 'completed' && new Date(t.dueDate).getMonth() === now.getMonth()).length;
  const overdueTasks = tasks.filter((t: ITask) => t.status !== 'completed' && new Date(t.dueDate) < todayStart).length;

  const upcomingTasks = tasks
    .filter((t: ITask) => t.status !== 'completed' && new Date(t.dueDate) >= todayStart)
    .sort((a: ITask, b: ITask) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="header"><h1>Dashboard</h1></div>
      <div className="card-grid">
        <div className="card overdue dashboard-card-clickable" onClick={() => onCardClick('overdue')}><h3>Scadute</h3><div className="value">{overdueTasks}</div></div>
        <div className="card dashboard-card-clickable" onClick={() => onCardClick('pending')}><h3>Da Fare</h3><div className="value">{pendingTasks}</div></div>
        <div className="card dashboard-card-clickable" onClick={() => onCardClick('in_progress')}><h3>In Corso</h3><div className="value">{inProgressTasks}</div></div>
        <div className="card dashboard-card-clickable" onClick={() => onCardClick('completed')}><h3>Completate (mese)</h3><div className="value">{completedThisMonth}</div></div>
      </div>
      <div className="upcoming-tasks">
        <h2>Prossime Scadenze</h2>
        {upcomingTasks.length > 0 ? (
          <ul>
            {upcomingTasks.map((task: ITask) => {
              const site = sites.find((s: ISite) => s.id === task.siteId);
              return (
                <li key={task.id} className="clickable" onClick={() => onTaskClick(task)}>
                  <span className={`status-dot ${task.status}`}></span>
                  <span className="task-date">{new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                  <span className="task-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                  <span className="task-site">{site?.name}</span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p>Nessuna attività in scadenza.</p>
        )}
      </div>
    </div>
  );
};

interface SiteListProps {
  sites: ISite[];
  onAddSiteClick: () => void;
  onSiteClick: (siteId: string) => void;
}

const SiteList = ({ sites, onAddSiteClick, onSiteClick }: SiteListProps) => (
  <div>
    <div className="header">
        <h1>Siti</h1>
        <button className="btn btn-primary" onClick={onAddSiteClick}>Aggiungi Sito</button>
    </div>
    <div className="card-grid">
      {sites.map((site: ISite) => (
        <div key={site.id} className="card site-card" onClick={() => onSiteClick(site.id)}>
          <h2>{site.name}</h2>
          <p>{site.address}</p>
        </div>
      ))}
    </div>
  </div>
);

interface ResourcesProps {
  users: IUser[];
  onAddUserClick: () => void;
  onUserClick: (user: IUser) => void;
}

const Resources = ({ users, onAddUserClick, onUserClick }: ResourcesProps) => (
  <div>
    <div className="header">
        <h1>Risorse</h1>
        <button className="btn btn-primary" onClick={onAddUserClick}>Aggiungi Risorsa</button>
    </div>
    <div className="card-grid">
      {users.map((user: IUser) => (
        <div key={user.id} className="card user-card" onClick={() => onUserClick(user)}>
          <h2>{user.name}</h2>
          <p>{user.role}</p>
        </div>
      ))}
    </div>
  </div>
);

interface ODLViewProps {
  tasks: ITask[];
  sites: ISite[];
  onAddODLClick: () => void;
  onTaskClick: (task: ITask) => void;
}

const ODLView = ({ tasks, sites, onAddODLClick, onTaskClick }: ODLViewProps) => {
    const odls = tasks.filter((task: ITask) => task.type === 'odl').sort((a: ITask, b: ITask) => {
        // Usa le stringhe direttamente per il confronto o converti in Date
        const dateB = new Date(b.startDate || b.dueDate);
        const dateA = new Date(a.startDate || a.dueDate);
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <div>
            <div className="header">
                <h1>Ordini di Lavoro (ODL)</h1>
                <button className="btn btn-primary" onClick={onAddODLClick}>Aggiungi ODL</button>
            </div>
            <div className="odl-list">
                {odls.length > 0 ? odls.map((odl: ITask) => {
                    const site = sites.find((s: ISite) => s.id === odl.siteId);
                    return (
                        <div key={odl.id} className="history-item" onClick={() => onTaskClick(odl)}>
                             <span className={`status-dot ${odl.status}`}></span>
                             <span className="odl-item-main">
                                 <span className="odl-number">{odl.odlNumber}</span>
                                 <span className="history-desc">{odl.description}</span>
                                 <span className="odl-site">{site?.name}</span>
                             </span>
                             <span className="history-assignees">{odl.assignees.join(', ')}</span>
                             <span className="history-date">{odl.startDate ? new Date(odl.startDate).toLocaleDateString('it-IT') : ''} - {new Date(odl.dueDate).toLocaleDateString('it-IT')}</span>
                        </div>
                    )
                }) : <p>Nessun Ordine di Lavoro presente.</p>}
            </div>
        </div>
    );
};

interface SiteDetailProps {
  site: ISite;
  tasks: ITask[];
  onTaskClick: (task: ITask) => void;
  onEditSiteClick: (site: ISite) => void;
}

const SiteDetail = ({ site, tasks, onTaskClick, onEditSiteClick }: SiteDetailProps) => {
    const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'maintenance' | 'odl'>('all');

    const filteredTasks = useMemo(() => {
        return tasks
            .filter((task: ITask) => task.siteId === site.id)
            .filter((task: ITask) => typeFilter === 'all' || task.type === typeFilter)
            .filter((task: ITask) => statusFilter === 'all' || task.status === statusFilter);
    }, [tasks, site.id, typeFilter, statusFilter]);
    
    const pending = filteredTasks.filter((t: ITask) => t.status === 'pending');
    const inProgress = filteredTasks.filter((t: ITask) => t.status === 'in_progress');
    const completed = filteredTasks.filter((t: ITask) => t.status === 'completed');

    return (
        <div>
            <div className="site-detail-header">
                <div>
                    <h1>{site.name}</h1>
                    <p>{site.address}</p>
                </div>
                <button className="btn" onClick={() => onEditSiteClick(site)}>Modifica Sito</button>
            </div>
            
            <div className="site-info-grid">
                <div className="site-info-section">
                    <h3>Contatti Principali</h3>
                    {site.landline && <p><strong>Tel. Sito:</strong> {site.landline}</p>}
                    {site.manager?.name && <p><strong>Responsabile:</strong> {site.manager.name}</p>}
                    {site.manager?.phone && <p><strong>Tel. Resp.:</strong> {site.manager.phone}</p>}
                    {site.manager?.email && <p><strong>Email Resp.:</strong> {site.manager.email}</p>}
                    {site.contactPerson?.name && <p><strong>Referente:</strong> {site.contactPerson.name}</p>}
                    {site.contactPerson?.phone && <p><strong>Tel. Ref.:</strong> {site.contactPerson.phone}</p>}
                    {site.contactPerson?.email && <p><strong>Email Ref.:</strong> {site.contactPerson.email}</p>}
                </div>
                {site.otherContacts && site.otherContacts.length > 0 && (
                    <div className="site-info-section">
                        <h3>Altri Contatti</h3>
                        <ul>
                            {site.otherContacts.map((contact: IOtherContact) => (
                                <li key={contact.id}>
                                    <strong>{contact.name}:</strong> 
                                    <span>{contact.phone}</span>
                                    {contact.email && <span style={{marginLeft: '8px', color: '#6b7280'}}>({contact.email})</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <span className="filter-label">Stato:</span>
                    <button className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>Tutti</button>
                    <button className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Da Fare</button>
                    <button className={`filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in_progress')}>In Corso</button>
                    <button className={`filter-btn ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>Completato</button>
                </div>
                <div className="filter-group">
                    <span className="filter-label">Tipo:</span>
                    <button className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>Tutti</button>
                    <button className={`filter-btn ${typeFilter === 'maintenance' ? 'active' : ''}`} onClick={() => setTypeFilter('maintenance')}>Manutenzione</button>
                    <button className={`filter-btn ${typeFilter === 'odl' ? 'active' : ''}`} onClick={() => setTypeFilter('odl')}>ODL</button>
                </div>
            </div>

            <h2>Riepilogo Attività</h2>
            <div className="odl-summary">
                <div className="odl-column">
                    <h3>Da Fare ({pending.length})</h3>
                    {pending.map((task: ITask) => (
                        <div key={task.id} className={`task-item ${task.status}`} onClick={() => onTaskClick(task)}>
                            <span className="task-item-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                            <span className="task-item-assignee">{task.assignees.join(', ')}</span>
                            <span className="task-item-duedate">Scadenza: {new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                        </div>
                    ))}
                </div>
                <div className="odl-column">
                    <h3>In Corso ({inProgress.length})</h3>
                    {inProgress.map((task: ITask) => (
                         <div key={task.id} className={`task-item ${task.status}`} onClick={() => onTaskClick(task)}>
                            <span className="task-item-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                            <span className="task-item-assignee">{task.assignees.join(', ')}</span>
                            <span className="task-item-duedate">Scadenza: {new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                        </div>
                    ))}
                </div>
                <div className="odl-column">
                    <h3>Completate ({completed.length})</h3>
                    {completed.map((task: ITask) => (
                        <div key={task.id} className={`task-item ${task.status}`} onClick={() => onTaskClick(task)}>
                            <span className="task-item-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                            <span className="task-item-assignee">{task.assignees.join(', ')}</span>
                            <span className="task-item-duedate">Scadenza: {new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="history-list">
                <h2>Storico Attività</h2>
                {[...filteredTasks].sort((a: ITask, b: ITask) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map((task: ITask) => (
                    <div key={task.id} className="history-item" onClick={() => onTaskClick(task)}>
                        <span className={`status-dot ${task.status}`}></span>
                        <span className="history-date">{new Date(task.dueDate).toLocaleDateString('it-IT')}</span>
                        <span className="history-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                        <span className="history-assignees">{task.assignees.join(', ')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ScheduleProps {
  tasks: ITask[];
  sites: ISite[];
  users: IUser[];
  resourceFilter: string;
  onResourceFilterChange: (filter: string) => void;
  onAddTaskClick: (date: Date) => void;
  onTaskClick: (task: ITask) => void;
}

const Schedule = ({ tasks, sites, users, resourceFilter, onResourceFilterChange, onAddTaskClick, onTaskClick }: ScheduleProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = useMemo(() => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const days: Date[] = [];
      while (date.getMonth() === currentDate.getMonth()) {
          days.push(new Date(date));
          date.setDate(date.getDate() + 1);
      }
      return days;
  }, [currentDate]);

  const startDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  // Adjust to make Monday the first day (0=Mon, 6=Sun)
  const startingDay = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;


  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc: Record<string, ITask[]>, task: ITask) => {
      const dateKey = new Date(task.dueDate).toDateString(); // Converti stringa in Date per la chiave
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, ITask[]>);
  }, [tasks]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div>
      <div className="header"><h1>Pianificazione</h1></div>
       <div className="schedule-controls">
        <div className="month-navigator">
            <button onClick={() => changeMonth(-1)}>&lt;</button>
            <h2>{currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => changeMonth(1)}>&gt;</button>
        </div>
        <div className="resource-filter">
            <label htmlFor="resource-filter-schedule">Risorsa:</label>
            <select
                id="resource-filter-schedule"
                value={resourceFilter}
                onChange={(e) => onResourceFilterChange(e.target.value)}
            >
                <option value="">Tutte le Risorse</option>
                {users.map((user: IUser) => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                ))}
            </select>
        </div>
      </div>
      <div className="calendar-grid">
        {weekDays.map(day => <div key={day} className="calendar-header">{day}</div>)}
        {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="calendar-day other-month"></div>)}
        {daysInMonth.map((day: Date) => {
          const dateKey = day.toDateString();
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <div key={dateKey} className={`calendar-day ${isToday ? 'today' : ''}`}>
              <div className="day-number">{day.getDate()}</div>
              <button className="add-task-btn" onClick={() => onAddTaskClick(day)}>+</button>
              <div className="tasks-list">
                {dayTasks.map((task: ITask) => {
                  const site = sites.find((s: ISite) => s.id === task.siteId);
                  return(
                  <div key={task.id} className={`task-item ${task.status}`} onClick={() => onTaskClick(task)} title={`${task.description} - ${site?.name} (${task.assignees.join(', ')})`}>
                      <span className="task-item-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                      <span className="task-item-assignee">{task.assignees.join(', ')}</span>
                  </div>
                )})}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface MatrixViewProps {
  tasks: ITask[];
  sites: ISite[];
  users: IUser[];
  resourceFilter: string;
  onResourceFilterChange: (filter: string) => void;
  onTaskClick: (task: ITask) => void;
  onAddTaskClick: (date: Date, siteId: string) => void;
}

const MatrixView = ({ tasks, sites, users, resourceFilter, onResourceFilterChange, onTaskClick, onAddTaskClick }: MatrixViewProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days: Date[] = [];
        while (date.getMonth() === currentDate.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const tasksBySiteAndDate = useMemo(() => {
        const groupedTasks: Record<string, Record<number, ITask[]>> = {};
        sites.forEach((site: ISite) => {
            groupedTasks[site.id] = {};
        });
        tasks.forEach((task: ITask) => {
            const taskDueDate = new Date(task.dueDate); // Converti stringa in Date per il confronto
            if (taskDueDate.getMonth() === currentDate.getMonth() && taskDueDate.getFullYear() === currentDate.getFullYear()) {
                const date = taskDueDate.getDate();
                if (!groupedTasks[task.siteId]) groupedTasks[task.siteId] = {};
                if (!groupedTasks[task.siteId][date]) {
                    groupedTasks[task.siteId][date] = [];
                }
                groupedTasks[task.siteId][date].push(task);
            }
        });
        return groupedTasks;
    }, [tasks, sites, currentDate]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    return (
        <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <div className="header"><h1>Vista a Matrice</h1></div>
            <div className="schedule-controls">
                <div className="month-navigator">
                    <button onClick={() => changeMonth(-1)}>&lt;</button>
                    <h2>{currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)}>&gt;</button>
                </div>
                <div className="resource-filter">
                    <label htmlFor="resource-filter-matrix">Risorsa:</label>
                    <select
                        id="resource-filter-matrix"
                        value={resourceFilter}
                        onChange={(e) => onResourceFilterChange(e.target.value)}
                    >
                        <option value="">Tutte le Risorse</option>
                        {users.map((user: IUser) => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="matrix-container">
                <div className="matrix-grid" style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${daysInMonth.length}, minmax(150px, 1fr))` }}>
                    <div className="matrix-cell matrix-header sticky-top sticky-left">Sito</div>
                    {daysInMonth.map((day: Date) => (
                        <div key={`header-${day.getDate()}`} className={`matrix-cell matrix-header sticky-top ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`}>
                            <span className="matrix-day-name">{day.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                            <span className="matrix-day-number">{day.getDate()}</span>
                        </div>
                    ))}
                    {sites.map((site: ISite) => (
                        <React.Fragment key={site.id}>
                            <div className="matrix-cell matrix-site-header sticky-left">{site.name}</div>
                            {daysInMonth.map((day: Date) => {
                                const dayNumber = day.getDate();
                                const cellTasks = tasksBySiteAndDate[site.id]?.[dayNumber] || []; // <--- CORREZIONE QUI
                                return (
                                    <div key={`${site.id}-${dayNumber}`} className={`matrix-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`}>
                                        <button className="add-task-btn" onClick={() => onAddTaskClick(day, site.id)}>+</button>
                                        {cellTasks.map((task: ITask) => (
                                            <div
                                                key={task.id}
                                                className={`task-item ${task.status}`}
                                                onClick={() => onTaskClick(task)}
                                                title={`${task.description} - ${task.assignees.join(', ')}`}
                                            >
                                                <span className="task-item-desc">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                                                <span className="task-item-assignee">{task.assignees.join(', ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface GanttViewProps {
  tasks: ITask[];
  sites: ISite[];
  onTaskClick: (task: ITask) => void;
}

const GanttView = ({ tasks, sites, onTaskClick }: GanttViewProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days: Date[] = [];
        while (date.getMonth() === currentDate.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);
    
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const monthStart = daysInMonth[0];
    const monthEnd = daysInMonth[daysInMonth.length - 1];

    const tasksForMonth = useMemo(() => {
        return tasks.filter((task: ITask) => {
            const { start, end } = getTaskInterval(task);
            return start <= monthEnd && end >= monthStart;
        });
    }, [tasks, monthStart, monthEnd]);

    return (
        <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <div className="header"><h1>Gantt</h1></div>
            <div className="schedule-controls">
                <div className="month-navigator">
                    <button onClick={() => changeMonth(-1)}>&lt;</button>
                    <h2>{currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)}>&gt;</button>
                </div>
            </div>
            <div className="gantt-container">
                <div className="gantt-grid" style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${daysInMonth.length}, 1fr)` }}>
                    {/* Headers */}
                    <div className="gantt-cell gantt-header sticky-top sticky-left">Sito</div>
                    {daysInMonth.map((day: Date) => (
                        <div key={`header-${day.getDate()}`} className={`gantt-cell gantt-header sticky-top ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`}>
                             <span className="gantt-day-name">{day.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                             <span className="gantt-day-number">{day.getDate()}</span>
                        </div>
                    ))}
                    
                    {/* Site Rows & Background Grid */}
                    {sites.map((site: ISite, siteIndex: number) => (
                        <React.Fragment key={site.id}>
                            <div className="gantt-cell gantt-site-header sticky-left" style={{gridRow: siteIndex + 2}}>{site.name}</div>
                             {daysInMonth.map((day: Date, dayIndex: number) => (
                                <div key={`${site.id}-${day.getDate()}`} className={`gantt-cell gantt-row-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`} style={{gridRow: siteIndex + 2, gridColumn: dayIndex + 2}}></div>
                            ))}
                        </React.Fragment>
                    ))}

                    {/* Task Bars */}
                    {tasksForMonth.map((task: ITask) => {
                        const siteIndex = sites.findIndex((s: ISite) => s.id === task.siteId);
                        if (siteIndex === -1) return null;

                        const { start, end } = getTaskInterval(task);

                        const startDayOfMonth = start < monthStart ? 1 : start.getDate();
                        const endDayOfMonth = end > monthEnd ? daysInMonth.length : end.getDate();

                        // grid-column is 1-based, our days are 0-indexed. And first column is site names.
                        const gridColumnStart = startDayOfMonth + 1; 
                        const gridColumnEnd = endDayOfMonth + 2;
                        
                        return (
                             <div 
                                key={task.id} 
                                className={`gantt-task ${task.status}`}
                                style={{
                                    gridRow: siteIndex + 2,
                                    gridColumn: `${gridColumnStart} / ${gridColumnEnd}`
                                }}
                                title={`${task.description} (${task.assignees.join(', ')})`}
                                onClick={() => onTaskClick(task)}
                            >
                                <span className="gantt-task-label">{task.type === 'odl' && `[ODL] `}{task.description}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};



// --- HELPERS ---
const getTaskInterval = (task: ITask): { start: Date, end: Date } => {
    // Le date in task sono già stringhe ISO, le convertiamo per la manipolazione
    const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    const end = new Date(task.dueDate);
    end.setHours(23, 59, 59, 999); // Normalize to end of day
    return { start, end };
};

const checkAssignmentConflicts = (
    newAssignees: string[], 
    newTaskInterval: { start: Date, end: Date },
    allTasks: ITask[], 
    currentTaskId: string | null
): string[] => {
    const conflictingAssignees = new Set<string>();
    const { start: newStart, end: newEnd } = newTaskInterval;

    for (const assignee of newAssignees) {
        // Filtra solo i task non completati e non il task che stiamo modificando/aggiungendo
        const assignedTasks = allTasks.filter(
            (t: ITask) => t.id !== currentTaskId && t.assignees.includes(assignee) && t.status !== 'completed'
        );

        for (const task of assignedTasks) {
            const { start: existingStart, end: existingEnd } = getTaskInterval(task);
            
            // Check for overlap: (StartA <= EndB) and (EndA >= StartB)
            if (newStart <= existingEnd && newEnd >= existingStart) {
                conflictingAssignees.add(assignee);
                break; // Found a conflict for this assignee, move to the next
            }
        }
    }
    return Array.from(conflictingAssignees);
};


// --- COMPONENTE PRINCIPALE APP ---

const App = () => {
  const [view, setView] = useState<string>('dashboard');
  const [sites, setSites] = useState<ISite[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [maintenanceActivities, setMaintenanceActivities] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{ type: string | null; data?: any }>({ type: null });
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null); // Tipizzato correttamente
  
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
        const item = window.localStorage.getItem('readNotificationIds');
        return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
        console.error("Failed to load read notifications from localStorage", error);
        return new Set();
    }
  });

  const selectedSite = useMemo(() => sites.find((s: ISite) => s.id === selectedSiteId), [sites, selectedSiteId]);

    useEffect(() => {
        try {
            window.localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(readNotificationIds)));
        } catch (error) {
            console.error("Failed to save read notifications to localStorage", error);
        }
    }, [readNotificationIds]);
    
    // Initial data fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [sitesData, usersData, tasksData, maintenanceData] = await Promise.all([
                    api.getSites(),
                    api.getUsers(),
                    api.getTasks(),
                    api.getMaintenanceActivities()
                ]);
                setSites(sitesData);
                setUsers(usersData);
                setTasks(tasksData);
                setMaintenanceActivities(maintenanceData);
            } catch (err) {
                setError('Impossibile caricare i dati. Riprova più tardi.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);
    
    useEffect(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const imminentEnd = new Date(todayStart);
        imminentEnd.setDate(imminentEnd.getDate() + 3); // Due in the next 2 days (today, tomorrow, day after)

        const generated: INotification[] = [];

        tasks.forEach((task: ITask) => {
            if (task.status !== 'completed') {
                const dueDate = new Date(task.dueDate); // Converti la stringa in Date per il confronto
                const notificationId = `notif-${task.id}`;

                if (dueDate < todayStart) { // Overdue
                    generated.push({
                        id: notificationId,
                        taskId: task.id,
                        message: `ATTIVITÀ SCADUTA: ${task.description}`,
                        type: 'overdue',
                        task,
                        read: readNotificationIds.has(notificationId),
                    });
                } else if (dueDate >= todayStart && dueDate < imminentEnd) { // Imminent
                    const daysDiff = Math.ceil((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                    let imminentMsg = 'domani';
                    if (daysDiff === 0) imminentMsg = 'oggi';
                    else if (daysDiff > 1) imminentMsg = `tra ${daysDiff} giorni`;
                     generated.push({
                        id: notificationId,
                        taskId: task.id,
                        message: `In scadenza ${imminentMsg}: ${task.description}`,
                        type: 'imminent',
                        task,
                        read: readNotificationIds.has(notificationId),
                    });
                }
            }
        });
        
        const finalNotifications = generated.sort((a: INotification, b: INotification) => {
            if (a.read !== b.read) {
                return a.read ? 1 : -1; // Unread notifications first
            }
            return new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime(); // Then sort by due date
        });
        
        setNotifications(finalNotifications);
    }, [tasks, readNotificationIds]);
    
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('SW registered: ', registration);
                }).catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }

        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => { // Tipizzato correttamente
            e.preventDefault();
            setInstallPrompt(e);
        };
        const handleAppInstalled = () => {
            setInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    useEffect(() => {
      if (view === 'site-detail' && !selectedSite) {
        setView('sites');
      }
    }, [view, selectedSite]);

    const filteredTasks = useMemo(() => {
        if (!resourceFilter) {
            return tasks;
        }
        return tasks.filter((task: ITask) => task.assignees.includes(resourceFilter));
    }, [tasks, resourceFilter]);


  const closeModal = () => setModalConfig({ type: null });
  
  const handleAddTask = async (taskData: Omit<ITask, 'id'>) => { // taskData ha già dueDate e startDate come stringhe
        const { startDate, dueDate, assignees } = taskData;
        const newTaskInterval = {
            start: startDate ? new Date(startDate) : new Date(dueDate),
            end: new Date(dueDate)
        };
        newTaskInterval.start.setHours(0,0,0,0);
        newTaskInterval.end.setHours(23,59,59,999);

        const conflictingAssignees = checkAssignmentConflicts(assignees, newTaskInterval, tasks, null);
        
        if (conflictingAssignees.length > 0) {
            const proceed = window.confirm(`Attenzione: Le seguenti risorse hanno già impegni concomitanti:\n\n- ${conflictingAssignees.join('\n- ')}\n\nVuoi procedere comunque?`);
            if (!proceed) return;
        }
      const savedTask = await api.addTask(taskData);
      setTasks(prevTasks => [...prevTasks, savedTask].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  };
  
  const handleSaveSite = async (site: ISite) => {
    const savedSite = await api.saveSite(site);
    const siteExists = sites.some((s: ISite) => s.id === savedSite.id);
    if (siteExists) {
        setSites(sites.map((s: ISite) => s.id === savedSite.id ? savedSite : s));
    } else {
        setSites(prevSites => [...prevSites, savedSite]);
    }
  };

  const handleSaveUser = async (user: IUser) => {
    const savedUser = await api.saveUser(user);
    const userExists = users.some((u: IUser) => u.id === savedUser.id);
    if (userExists) {
      setUsers(users.map((u: IUser) => u.id === savedUser.id ? savedUser : u));
    } else {
      setUsers(prevUsers => [...prevUsers, savedUser]);
    }
  };
  
  const handleUpdateTask = async (taskId: string, updates: Partial<ITask>) => {
    const originalTask = tasks.find((t: ITask) => t.id === taskId);
    if (!originalTask) return;

    // Crea un oggetto task aggiornato per il controllo dei conflitti
    const updatedTaskData = { ...originalTask, ...updates } as ITask;
    const { startDate, dueDate, assignees } = updatedTaskData;
    const updatedTaskInterval = {
        start: startDate ? new Date(startDate) : new Date(dueDate),
        end: new Date(dueDate)
    };
    updatedTaskInterval.start.setHours(0,0,0,0);
    updatedTaskInterval.end.setHours(23,59,59,999);
    
    const conflictingAssignees = checkAssignmentConflicts(assignees, updatedTaskInterval, tasks, taskId);
    
    if (conflictingAssignees.length > 0) {
        const proceed = window.confirm(`Attenzione: Aggiornando questa attività si creano conflitti di pianificazione per:\n\n- ${conflictingAssignees.join('\n- ')}\n\nVuoi salvare le modifiche comunque?`);
        if (!proceed) return;
    }
    
    const updatedTask = await api.updateTask(taskId, updates);
    setTasks(tasks.map((t: ITask) => t.id === taskId ? updatedTask : t));
  };

  const handleDeleteTask = async (taskId: string) => {
      await api.deleteTask(taskId);
      setTasks(tasks.filter((t: ITask) => t.id !== taskId));
  };

  const handleAddTaskClick = (date: Date, siteId?: string) => {
    setModalConfig({ type: 'addTask', data: { selectedDate: date, selectedSiteId: siteId } });
  };
  
  const handleAddSiteClick = () => {
     setModalConfig({ type: 'siteForm', data: { siteToEdit: null } });
  };

  const handleEditSiteClick = (site: ISite) => {
    setModalConfig({ type: 'siteForm', data: { siteToEdit: site } });
  };

  const handleAddUserClick = () => {
     setModalConfig({ type: 'userForm', data: { userToEdit: null } });
  };
  
  const handleUserClick = (user: IUser) => {
    setModalConfig({ type: 'userForm', data: { userToEdit: user } });
  }
  
  const handleAddODLClick = () => {
    setModalConfig({ type: 'addODL' });
  };

  const handleTaskClick = (task: ITask) => {
    setModalConfig({ type: 'taskDetails', data: { taskId: task.id } });
  };

  const handleCardClick = (cardType: string) => {
    setModalConfig({ type: 'taskList', data: { cardType } });
};

  const handleSiteClick = (siteId: string) => {
      setSelectedSiteId(siteId);
      setView('site-detail');
  };
  
  const handleNotificationClick = (notification: INotification) => {
      handleTaskClick(notification.task);
      setReadNotificationIds(prev => new Set(prev).add(notification.id));
  };
  
  const handleMarkAllAsRead = () => {
      const allCurrentIds = notifications.map((n: INotification) => n.id);
      setReadNotificationIds(prev => new Set([...Array.from(prev), ...allCurrentIds]));
  };
  
    const handleInstallClick = async () => {
        if (!installPrompt) {
            return;
        }
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
    };

  const navigate = (viewName: string) => {
      setSelectedSiteId(null);
      setView(viewName);
  };
  
  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }
  
  if (error) {
      return <div className="loading-container"><div className="error-message">{error}</div></div>;
  }

  const renderModalContent = () => {
    if (!modalConfig.type) return null;

    switch (modalConfig.type) {
        case 'addTask':
            return <AddTaskForm 
                sites={sites} 
                users={users} 
                maintenanceActivities={maintenanceActivities} 
                onAddTask={handleAddTask} 
                onClose={closeModal} 
                selectedDate={modalConfig.data.selectedDate} // selectedDate è un oggetto Date qui
                selectedSiteId={modalConfig.data.selectedSiteId}
            />;
        
        case 'addODL':
            return <AddODLForm 
                sites={sites} 
                users={users} 
                onAddTask={handleAddTask} 
                onClose={closeModal} 
            />;

        case 'siteForm':
            return <SiteForm 
                onSaveSite={handleSaveSite} 
                onClose={closeModal} 
                siteToEdit={modalConfig.data.siteToEdit} 
            />;

        case 'userForm':
            return <UserForm 
                onSaveUser={handleSaveUser} 
                onClose={closeModal} 
                userToEdit={modalConfig.data.userToEdit} 
            />;

        case 'taskDetails': {
            const task = tasks.find((t: ITask) => t.id === modalConfig.data.taskId);
            if (!task) return null;
            return <TaskDetailsForm 
                task={task} 
                sites={sites} 
                users={users} 
                onUpdateTask={handleUpdateTask} 
                onDeleteTask={handleDeleteTask} 
                onClose={closeModal} 
            />;
        }

        case 'taskList': {
            const cardType = modalConfig.data.cardType;
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            let filtered: ITask[] = [];
            let title = '';

            switch (cardType) {
                case 'overdue':
                    title = 'Attività Scadute';
                    filtered = tasks.filter((t: ITask) => t.status !== 'completed' && new Date(t.dueDate) < todayStart);
                    break;
                case 'pending':
                    title = 'Attività da Fare';
                    filtered = tasks.filter((t: ITask) => t.status === 'pending');
                    break;
                case 'in_progress':
                    title = 'Attività in Corso';
                    filtered = tasks.filter((t: ITask) => t.status === 'in_progress');
                    break;
                case 'completed':
                    title = 'Completate nel Mese';
                    filtered = tasks.filter((t: ITask) => t.status === 'completed' && new Date(t.dueDate).getMonth() === now.getMonth());
                    break;
                default: return null;
            }

            return <TaskListModal 
                title={title} 
                tasks={filtered.sort((a: ITask, b: ITask) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())} 
                sites={sites} 
                onClose={closeModal} 
                onTaskClick={handleTaskClick} 
            />;
        }

        default:
            return null;
    }
  };

  const renderView = () => {
    switch (view) {
      case 'sites':
        return <SiteList sites={sites} onAddSiteClick={handleAddSiteClick} onSiteClick={handleSiteClick} />;
      case 'schedule':
        return <Schedule tasks={filteredTasks} sites={sites} users={users} resourceFilter={resourceFilter} onResourceFilterChange={setResourceFilter} onAddTaskClick={handleAddTaskClick} onTaskClick={handleTaskClick}/>;
      case 'matrix':
        return <MatrixView tasks={filteredTasks} sites={sites} users={users} resourceFilter={resourceFilter} onResourceFilterChange={setResourceFilter} onTaskClick={handleTaskClick} onAddTaskClick={handleAddTaskClick}/>;
      case 'gantt':
        return <GanttView tasks={filteredTasks} sites={sites} onTaskClick={handleTaskClick} />;
      case 'risorse':
        return <Resources users={users} onAddUserClick={handleAddUserClick} onUserClick={handleUserClick} />;
      case 'odl':
        return <ODLView tasks={tasks} sites={sites} onAddODLClick={handleAddODLClick} onTaskClick={handleTaskClick} />;
      case 'site-detail':
        if (selectedSite) {
            return <SiteDetail site={selectedSite} tasks={tasks} onTaskClick={handleTaskClick} onEditSiteClick={handleEditSiteClick} />;
        }
        return null;
      case 'dashboard':
      default:
        return <Dashboard tasks={tasks} sites={sites} onCardClick={handleCardClick} onTaskClick={handleTaskClick} />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1 className="sidebar-header">Gestione M.</h1>
        <ul className="sidebar-nav">
          <li><button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}>Dashboard</button></li>
          <li><button className={view === 'sites' ? 'active' : ''} onClick={() => navigate('sites')}>Siti</button></li>
          <li><button className={view === 'schedule' ? 'active' : ''} onClick={() => navigate('schedule')}>Pianificazione</button></li>
          <li><button className={view === 'matrix' ? 'active' : ''} onClick={() => navigate('matrix')}>Vista a Matrice</button></li>
          <li><button className={view === 'gantt' ? 'active' : ''} onClick={() => navigate('gantt')}>Gantt</button></li>
          <li><button className={view === 'odl' ? 'active' : ''} onClick={() => navigate('odl')}>ODL</button></li>
          <li><button className={view === 'risorse' ? 'active' : ''} onClick={() => navigate('risorse')}>Risorse</button></li>
        </ul>
        {installPrompt && (
            <div className="sidebar-footer">
                <button className="btn-install" onClick={handleInstallClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>Installa App</span>
                </button>
            </div>
        )}
      </aside>
      <main className="main-content">
        <NotificationBell
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onMarkAllAsRead={handleMarkAllAsRead}
            sites={sites}
        />
        {renderView()}
      </main>
      {modalConfig.type && <Modal onClose={closeModal}>{renderModalContent()}</Modal>}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);