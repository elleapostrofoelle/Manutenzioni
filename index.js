import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as api from './api.js';
// --- COMPONENTI UI ---
const NotificationBell = ({ notifications, onNotificationClick, onMarkAllAsRead, sites }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;
    const siteNameMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);
    return (_jsxs("div", { className: "notification-bell-wrapper", children: [_jsxs("button", { className: "notification-bell", onClick: () => setIsOpen(!isOpen), "aria-label": `Notifiche: ${unreadCount} non lette`, children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }), _jsx("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })] }), unreadCount > 0 && _jsx("span", { className: "notification-badge", children: unreadCount })] }), isOpen && (_jsxs("div", { className: "notification-panel", children: [_jsxs("div", { className: "notification-header", children: [_jsx("h3", { children: "Notifiche" }), unreadCount > 0 && _jsx("button", { onClick: onMarkAllAsRead, children: "Segna tutte come lette" })] }), _jsx("div", { className: "notification-list", children: notifications.length > 0 ? notifications.map(notif => (_jsxs("div", { className: `notification-item ${notif.read ? 'read' : ''} ${notif.type}`, onClick: () => { onNotificationClick(notif); setIsOpen(false); }, children: [_jsx("p", { className: "notification-message", children: notif.message }), _jsxs("p", { className: "notification-details", children: [siteNameMap[notif.task.siteId], " - Scadenza: ", new Date(notif.task.dueDate).toLocaleDateString('it-IT')] })] }, notif.id))) : _jsx("p", { className: "no-notifications", children: "Nessuna notifica." }) })] }))] }));
};
const Modal = ({ children, onClose }) => (_jsx("div", { className: "modal-overlay", onClick: onClose, children: _jsx("div", { className: "modal-content", onClick: e => e.stopPropagation(), children: children }) }));
const AddTaskForm = ({ sites, users, maintenanceActivities, onAddTask, onClose, selectedDate, selectedSiteId }) => {
    const [siteId, setSiteId] = useState(selectedSiteId || sites[0]?.id || '');
    const [description, setDescription] = useState(maintenanceActivities[0]);
    const [assignees, setAssignees] = useState([]);
    const handleAssigneeChange = (userName) => {
        setAssignees(prev => prev.includes(userName)
            ? prev.filter(name => name !== userName)
            : [...prev, userName]);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (assignees.length === 0) {
            alert('Selezionare almeno un assegnatario.');
            return;
        }
        onAddTask({
            siteId,
            description,
            dueDate: selectedDate,
            status: 'pending',
            assignees,
            type: 'maintenance',
        });
        onClose();
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: "Nuova Manutenzione" }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "site", children: "Sito" }), _jsx("select", { id: "site", value: siteId, onChange: e => setSiteId(e.target.value), required: true, children: sites.map(site => _jsx("option", { value: site.id, children: site.name }, site.id)) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "description", children: "Descrizione Attivit\u00E0" }), _jsx("select", { id: "description", value: description, onChange: e => setDescription(e.target.value), required: true, children: maintenanceActivities.map(activity => _jsx("option", { value: activity, children: activity }, activity)) }), _jsx("textarea", { placeholder: "O inserisci una descrizione personalizzata...", onChange: e => setDescription(e.target.value), style: { marginTop: '8px' } })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Assegnato a" }), _jsx("div", { className: "assignee-group", children: users.map(user => (_jsxs("div", { className: "assignee-item", children: [_jsx("input", { type: "checkbox", id: `user-${user.id}`, checked: assignees.includes(user.name), onChange: () => handleAssigneeChange(user.name) }), _jsx("label", { htmlFor: `user-${user.id}`, children: user.name })] }, user.id))) })] }), _jsx("div", { className: "modal-actions", children: _jsx("button", { type: "submit", className: "btn btn-primary", children: "Aggiungi" }) })] }));
};
const AddODLForm = ({ sites, users, onAddTask, onClose }) => {
    const [siteId, setSiteId] = useState(sites[0]?.id || '');
    const [description, setDescription] = useState('');
    const [assignees, setAssignees] = useState([]);
    const [odlNumber, setOdlNumber] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
    const handleAssigneeChange = (userName) => {
        setAssignees(prev => prev.includes(userName)
            ? prev.filter(name => name !== userName)
            : [...prev, userName]);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!siteId || !description || !odlNumber || assignees.length === 0) {
            alert('Per favore, compila tutti i campi obbligatori.');
            return;
        }
        onAddTask({
            siteId,
            description,
            dueDate: new Date(dueDate),
            status: 'pending',
            assignees,
            type: 'odl',
            odlNumber,
            startDate: new Date(startDate),
        });
        onClose();
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: "Nuovo Ordine di Lavoro (ODL)" }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "odlNumber", children: "Numero ODL" }), _jsx("input", { id: "odlNumber", type: "text", value: odlNumber, onChange: e => setOdlNumber(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "site", children: "Sito" }), _jsx("select", { id: "site", value: siteId, onChange: e => setSiteId(e.target.value), required: true, children: sites.map(site => _jsx("option", { value: site.id, children: site.name }, site.id)) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "description", children: "Descrizione Lavoro" }), _jsx("textarea", { id: "description", value: description, onChange: e => setDescription(e.target.value), required: true })] }), _jsxs("div", { className: "form-group-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "startDate", children: "Data Inizio" }), _jsx("input", { id: "startDate", type: "date", value: startDate, onChange: e => setStartDate(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "dueDate", children: "Data Fine" }), _jsx("input", { id: "dueDate", type: "date", value: dueDate, onChange: e => setDueDate(e.target.value), required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Assegnato a" }), _jsx("div", { className: "assignee-group", children: users.map(user => (_jsxs("div", { className: "assignee-item", children: [_jsx("input", { type: "checkbox", id: `user-odl-${user.id}`, checked: assignees.includes(user.name), onChange: () => handleAssigneeChange(user.name) }), _jsx("label", { htmlFor: `user-odl-${user.id}`, children: user.name })] }, user.id))) })] }), _jsx("div", { className: "modal-actions", children: _jsx("button", { type: "submit", className: "btn btn-primary", children: "Crea ODL" }) })] }));
};
const SiteForm = ({ onSaveSite, onClose, siteToEdit }) => {
    const isEditing = !!siteToEdit;
    const [name, setName] = useState(siteToEdit?.name || '');
    const [address, setAddress] = useState(siteToEdit?.address || '');
    const [manager, setManager] = useState(siteToEdit?.manager || { name: '', phone: '', email: '' });
    const [contactPerson, setContactPerson] = useState(siteToEdit?.contactPerson || { name: '', phone: '', email: '' });
    const [landline, setLandline] = useState(siteToEdit?.landline || '');
    const [otherContacts, setOtherContacts] = useState(siteToEdit?.otherContacts || []);
    const handleAddContact = () => {
        setOtherContacts([...otherContacts, { id: `c-${Date.now()}`, name: '', phone: '', email: '' }]);
    };
    const handleRemoveContact = (id) => {
        setOtherContacts(otherContacts.filter(c => c.id !== id));
    };
    const handleContactChange = (id, field, value) => {
        setOtherContacts(otherContacts.map(c => c.id === id ? { ...c, [field]: value } : c));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSaveSite({
            id: isEditing ? siteToEdit.id : `site-${Date.now()}`,
            name,
            address,
            manager,
            contactPerson,
            landline,
            otherContacts,
        });
        onClose();
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: isEditing ? 'Modifica Sito' : 'Nuovo Sito' }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "name", children: "Nome Sito" }), _jsx("input", { id: "name", type: "text", value: name, onChange: e => setName(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "address", children: "Indirizzo" }), _jsx("input", { id: "address", type: "text", value: address, onChange: e => setAddress(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "landline", children: "Telefono Fisso Sito" }), _jsx("input", { id: "landline", type: "text", value: landline, onChange: e => setLandline(e.target.value) })] }), _jsxs("div", { className: "form-group-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "manager-name", children: "Responsabile" }), _jsx("input", { id: "manager-name", type: "text", placeholder: "Nome", value: manager.name, onChange: e => setManager(m => ({ ...m, name: e.target.value })) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "manager-phone", style: { opacity: 0 }, children: "Telefono" }), _jsx("input", { id: "manager-phone", type: "text", placeholder: "Telefono", value: manager.phone, onChange: e => setManager(m => ({ ...m, phone: e.target.value })) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "manager-email", style: { opacity: 0 }, children: "Email" }), _jsx("input", { id: "manager-email", type: "email", placeholder: "Email", value: manager.email, onChange: e => setManager(m => ({ ...m, email: e.target.value })) })] })] }), _jsxs("div", { className: "form-group-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "contact-name", children: "Referente" }), _jsx("input", { id: "contact-name", type: "text", placeholder: "Nome", value: contactPerson.name, onChange: e => setContactPerson(c => ({ ...c, name: e.target.value })) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "contact-phone", style: { opacity: 0 }, children: "Telefono" }), _jsx("input", { id: "contact-phone", type: "text", placeholder: "Telefono", value: contactPerson.phone, onChange: e => setContactPerson(c => ({ ...c, phone: e.target.value })) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "contact-email", style: { opacity: 0 }, children: "Email" }), _jsx("input", { id: "contact-email", type: "email", placeholder: "Email", value: contactPerson.email, onChange: e => setContactPerson(c => ({ ...c, email: e.target.value })) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Altri Contatti" }), _jsx("div", { className: "other-contacts-list", children: otherContacts.map((contact) => (_jsxs("div", { className: "contact-row", children: [_jsx("input", { type: "text", placeholder: "Nome", value: contact.name, onChange: (e) => handleContactChange(contact.id, 'name', e.target.value) }), _jsx("input", { type: "text", placeholder: "Telefono", value: contact.phone, onChange: (e) => handleContactChange(contact.id, 'phone', e.target.value) }), _jsx("input", { type: "email", placeholder: "Email", value: contact.email, onChange: (e) => handleContactChange(contact.id, 'email', e.target.value) }), _jsx("button", { type: "button", className: "btn-remove-contact", onClick: () => handleRemoveContact(contact.id), children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("polyline", { points: "3 6 5 6 21 6" }), _jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }), _jsx("line", { x1: "10", y1: "11", x2: "10", y2: "17" }), _jsx("line", { x1: "14", y1: "11", x2: "14", y2: "17" })] }) })] }, contact.id))) }), _jsx("button", { type: "button", onClick: handleAddContact, className: "btn btn-secondary btn-add-contact", children: "Aggiungi Contatto" })] }), _jsx("div", { className: "modal-actions", children: _jsx("button", { type: "submit", className: "btn btn-primary", children: isEditing ? 'Salva Modifiche' : 'Aggiungi Sito' }) })] }));
};
const UserForm = ({ onSaveUser, onClose, userToEdit }) => {
    const isEditing = !!userToEdit;
    const [name, setName] = useState(userToEdit?.name || '');
    const [role, setRole] = useState(userToEdit?.role || '');
    const handleSubmit = (e) => {
        e.preventDefault();
        onSaveUser({
            id: isEditing ? userToEdit.id : `user-${Date.now()}`,
            name,
            role
        });
        onClose();
    };
    return (_jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: isEditing ? 'Modifica Risorsa' : 'Nuova Risorsa' }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "name", children: "Nome e Cognome" }), _jsx("input", { id: "name", type: "text", value: name, onChange: e => setName(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "role", children: "Mansione" }), _jsx("input", { id: "role", type: "text", value: role, onChange: e => setRole(e.target.value), required: true })] }), _jsx("div", { className: "modal-actions", children: _jsx("button", { type: "submit", className: "btn btn-primary", children: isEditing ? 'Salva Modifiche' : 'Aggiungi Risorsa' }) })] }));
};
const TaskDetailsForm = ({ task, sites, users, onUpdateTask, onDeleteTask, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editStatus, setEditStatus] = useState(task.status);
    const [editDescription, setEditDescription] = useState(task.description);
    const [editDueDate, setEditDueDate] = useState(new Date(task.dueDate).toISOString().split('T')[0]);
    const [editAssignees, setEditAssignees] = useState(task.assignees);
    const [editOdlNumber, setEditOdlNumber] = useState(task.odlNumber || '');
    const [editStartDate, setEditStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
    const site = sites.find(s => s.id === task.siteId);
    const handleDelete = () => {
        if (window.confirm('Sei sicuro di voler eliminare questa attività?')) {
            onDeleteTask(task.id);
            onClose();
        }
    };
    const handleSaveChanges = () => {
        const updates = {
            description: editDescription,
            dueDate: new Date(editDueDate),
            assignees: editAssignees,
            status: editStatus,
        };
        if (task.type === 'odl') {
            updates.odlNumber = editOdlNumber;
            updates.startDate = editStartDate ? new Date(editStartDate) : undefined;
        }
        onUpdateTask(task.id, updates);
        setIsEditing(false);
    };
    const handleAssigneeChange = (userName) => {
        setEditAssignees(prev => prev.includes(userName)
            ? prev.filter(name => name !== userName)
            : [...prev, userName]);
    };
    const handleCancelEdit = () => {
        setEditStatus(task.status);
        setEditDescription(task.description);
        setEditDueDate(new Date(task.dueDate).toISOString().split('T')[0]);
        setEditAssignees(task.assignees);
        setEditOdlNumber(task.odlNumber || '');
        setEditStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
        setIsEditing(false);
    };
    if (isEditing) {
        return (_jsxs("div", { children: [_jsxs("div", { className: "modal-header", children: [_jsxs("h2", { children: ["Modifica ", task.type === 'odl' ? 'ODL' : 'Attività'] }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), task.type === 'odl' && (_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "odlNumber-edit", children: "Numero ODL" }), _jsx("input", { id: "odlNumber-edit", type: "text", value: editOdlNumber, onChange: e => setEditOdlNumber(e.target.value) })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "description-edit", children: "Descrizione" }), _jsx("textarea", { id: "description-edit", value: editDescription, onChange: e => setEditDescription(e.target.value) })] }), task.type === 'odl' ? (_jsxs("div", { className: "form-group-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "startDate-edit", children: "Data Inizio" }), _jsx("input", { id: "startDate-edit", type: "date", value: editStartDate, onChange: e => setEditStartDate(e.target.value) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "dueDate-edit", children: "Data Fine" }), _jsx("input", { id: "dueDate-edit", type: "date", value: editDueDate, onChange: e => setEditDueDate(e.target.value) })] })] })) : (_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "dueDate-edit", children: "Scadenza" }), _jsx("input", { id: "dueDate-edit", type: "date", value: editDueDate, onChange: e => setEditDueDate(e.target.value) })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Assegnato a" }), _jsx("div", { className: "assignee-group", children: users.map(user => (_jsxs("div", { className: "assignee-item", children: [_jsx("input", { type: "checkbox", id: `edit-user-${user.id}`, checked: editAssignees.includes(user.name), onChange: () => handleAssigneeChange(user.name) }), _jsx("label", { htmlFor: `edit-user-${user.id}`, children: user.name })] }, user.id))) })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "status-edit", children: "Stato" }), _jsxs("select", { id: "status-edit", value: editStatus, onChange: e => setEditStatus(e.target.value), children: [_jsx("option", { value: "pending", children: "Da fare" }), _jsx("option", { value: "in_progress", children: "In corso" }), _jsx("option", { value: "completed", children: "Completato" })] })] }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", onClick: handleCancelEdit, className: "btn", children: "Annulla" }), _jsx("button", { type: "button", onClick: handleSaveChanges, className: "btn btn-primary", children: "Salva Modifiche" })] })] }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { className: "modal-header", children: [_jsxs("h2", { children: ["Dettagli ", task.type === 'odl' ? 'ODL' : 'Manutenzione'] }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsxs("div", { className: "task-details", children: [task.type === 'odl' && _jsxs("p", { children: [_jsx("strong", { children: "Numero ODL:" }), " ", task.odlNumber] }), _jsxs("p", { children: [_jsx("strong", { children: "Sito:" }), " ", site?.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Indirizzo:" }), " ", site?.address] }), _jsxs("p", { children: [_jsx("strong", { children: "Descrizione:" }), " ", task.description] }), task.type === 'odl' && _jsxs("p", { children: [_jsx("strong", { children: "Data Inizio:" }), " ", task.startDate ? new Date(task.startDate).toLocaleDateString('it-IT') : ''] }), _jsxs("p", { children: [_jsx("strong", { children: "Scadenza / Data Fine:" }), " ", new Date(task.dueDate).toLocaleDateString('it-IT')] }), _jsxs("p", { children: [_jsx("strong", { children: "Assegnato a:" }), " ", task.assignees.join(', ')] }), _jsxs("p", { children: [_jsx("strong", { children: "Stato:" }), "\u00A0", _jsx("span", { className: `task-status-badge status-${task.status}`, children: task.status === 'pending' ? 'Da fare' : task.status === 'in_progress' ? 'In corso' : 'Completato' })] })] }), _jsxs("div", { className: "modal-actions space-between", children: [_jsx("button", { type: "button", onClick: handleDelete, className: "btn btn-danger", children: "Elimina" }), _jsxs("div", { children: [_jsx("button", { type: "button", onClick: onClose, className: "btn btn-secondary", children: "Chiudi" }), _jsx("button", { type: "button", onClick: () => setIsEditing(true), className: "btn btn-primary", children: "Modifica" })] })] })] }));
};
const TaskListModal = ({ title, tasks, sites, onClose, onTaskClick }) => {
    const siteNameMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);
    return (_jsxs("div", { children: [_jsxs("div", { className: "modal-header", children: [_jsx("h2", { children: title }), _jsx("button", { type: "button", className: "close-button", onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: "task-list-modal-content", children: tasks.length > 0 ? (tasks.map(task => (_jsxs("div", { className: "task-list-modal-item", onClick: () => onTaskClick(task), children: [_jsx("span", { className: `status-dot ${task.status}` }), _jsxs("div", { className: "task-list-modal-details", children: [_jsxs("p", { className: "task-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("p", { className: "task-site", children: siteNameMap[task.siteId] })] }), _jsx("span", { className: "history-assignees", children: task.assignees.join(', ') }), _jsx("span", { className: "history-date", children: new Date(task.dueDate).toLocaleDateString('it-IT') })] }, task.id)))) : (_jsx("p", { children: "Nessuna attivit\u00E0 in questa categoria." })) })] }));
};
// --- VISTE PRINCIPALI ---
const Dashboard = ({ tasks, sites, onCardClick, onTaskClick }) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedThisMonth = tasks.filter(t => t.status === 'completed' && new Date(t.dueDate).getMonth() === now.getMonth()).length;
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < todayStart).length;
    const upcomingTasks = tasks
        .filter(t => t.status !== 'completed' && new Date(t.dueDate) >= todayStart)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);
    return (_jsxs("div", { children: [_jsx("div", { className: "header", children: _jsx("h1", { children: "Dashboard" }) }), _jsxs("div", { className: "card-grid", children: [_jsxs("div", { className: "card overdue dashboard-card-clickable", onClick: () => onCardClick('overdue'), children: [_jsx("h3", { children: "Scadute" }), _jsx("div", { className: "value", children: overdueTasks })] }), _jsxs("div", { className: "card dashboard-card-clickable", onClick: () => onCardClick('pending'), children: [_jsx("h3", { children: "Da Fare" }), _jsx("div", { className: "value", children: pendingTasks })] }), _jsxs("div", { className: "card dashboard-card-clickable", onClick: () => onCardClick('in_progress'), children: [_jsx("h3", { children: "In Corso" }), _jsx("div", { className: "value", children: inProgressTasks })] }), _jsxs("div", { className: "card dashboard-card-clickable", onClick: () => onCardClick('completed'), children: [_jsx("h3", { children: "Completate (mese)" }), _jsx("div", { className: "value", children: completedThisMonth })] })] }), _jsxs("div", { className: "upcoming-tasks", children: [_jsx("h2", { children: "Prossime Scadenze" }), upcomingTasks.length > 0 ? (_jsx("ul", { children: upcomingTasks.map(task => {
                            const site = sites.find(s => s.id === task.siteId);
                            return (_jsxs("li", { className: "clickable", onClick: () => onTaskClick(task), children: [_jsx("span", { className: `status-dot ${task.status}` }), _jsx("span", { className: "task-date", children: new Date(task.dueDate).toLocaleDateString('it-IT') }), _jsxs("span", { className: "task-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "task-site", children: site?.name })] }, task.id));
                        }) })) : (_jsx("p", { children: "Nessuna attivit\u00E0 in scadenza." }))] })] }));
};
const SiteList = ({ sites, onAddSiteClick, onSiteClick }) => (_jsxs("div", { children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "Siti" }), _jsx("button", { className: "btn btn-primary", onClick: onAddSiteClick, children: "Aggiungi Sito" })] }), _jsx("div", { className: "card-grid", children: sites.map(site => (_jsxs("div", { className: "card site-card", onClick: () => onSiteClick(site.id), children: [_jsx("h2", { children: site.name }), _jsx("p", { children: site.address })] }, site.id))) })] }));
const Resources = ({ users, onAddUserClick, onUserClick }) => (_jsxs("div", { children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "Risorse" }), _jsx("button", { className: "btn btn-primary", onClick: onAddUserClick, children: "Aggiungi Risorsa" })] }), _jsx("div", { className: "card-grid", children: users.map(user => (_jsxs("div", { className: "card user-card", onClick: () => onUserClick(user), children: [_jsx("h2", { children: user.name }), _jsx("p", { children: user.role })] }, user.id))) })] }));
const ODLView = ({ tasks, sites, onAddODLClick, onTaskClick }) => {
    const odls = tasks.filter(task => task.type === 'odl').sort((a, b) => {
        const dateB = new Date(b.startDate || b.dueDate);
        const dateA = new Date(a.startDate || a.dueDate);
        return dateB.getTime() - dateA.getTime();
    });
    return (_jsxs("div", { children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "Ordini di Lavoro (ODL)" }), _jsx("button", { className: "btn btn-primary", onClick: onAddODLClick, children: "Aggiungi ODL" })] }), _jsx("div", { className: "odl-list", children: odls.length > 0 ? odls.map(odl => {
                    const site = sites.find(s => s.id === odl.siteId);
                    return (_jsxs("div", { className: "history-item", onClick: () => onTaskClick(odl), children: [_jsx("span", { className: `status-dot ${odl.status}` }), _jsxs("span", { className: "odl-item-main", children: [_jsx("span", { className: "odl-number", children: odl.odlNumber }), _jsx("span", { className: "history-desc", children: odl.description }), _jsx("span", { className: "odl-site", children: site?.name })] }), _jsx("span", { className: "history-assignees", children: odl.assignees.join(', ') }), _jsxs("span", { className: "history-date", children: [odl.startDate ? new Date(odl.startDate).toLocaleDateString('it-IT') : '', " - ", new Date(odl.dueDate).toLocaleDateString('it-IT')] })] }, odl.id));
                }) : _jsx("p", { children: "Nessun Ordine di Lavoro presente." }) })] }));
};
const SiteDetail = ({ site, tasks, onTaskClick, onEditSiteClick }) => {
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => task.siteId === site.id)
            .filter(task => typeFilter === 'all' || task.type === typeFilter)
            .filter(task => statusFilter === 'all' || task.status === statusFilter);
    }, [tasks, site.id, typeFilter, statusFilter]);
    const pending = filteredTasks.filter(t => t.status === 'pending');
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress');
    const completed = filteredTasks.filter(t => t.status === 'completed');
    return (_jsxs("div", { children: [_jsxs("div", { className: "site-detail-header", children: [_jsxs("div", { children: [_jsx("h1", { children: site.name }), _jsx("p", { children: site.address })] }), _jsx("button", { className: "btn", onClick: () => onEditSiteClick(site), children: "Modifica Sito" })] }), _jsxs("div", { className: "site-info-grid", children: [_jsxs("div", { className: "site-info-section", children: [_jsx("h3", { children: "Contatti Principali" }), site.landline && _jsxs("p", { children: [_jsx("strong", { children: "Tel. Sito:" }), " ", site.landline] }), site.manager?.name && _jsxs("p", { children: [_jsx("strong", { children: "Responsabile:" }), " ", site.manager.name] }), site.manager?.phone && _jsxs("p", { children: [_jsx("strong", { children: "Tel. Resp.:" }), " ", site.manager.phone] }), site.manager?.email && _jsxs("p", { children: [_jsx("strong", { children: "Email Resp.:" }), " ", site.manager.email] }), site.contactPerson?.name && _jsxs("p", { children: [_jsx("strong", { children: "Referente:" }), " ", site.contactPerson.name] }), site.contactPerson?.phone && _jsxs("p", { children: [_jsx("strong", { children: "Tel. Ref.:" }), " ", site.contactPerson.phone] }), site.contactPerson?.email && _jsxs("p", { children: [_jsx("strong", { children: "Email Ref.:" }), " ", site.contactPerson.email] })] }), site.otherContacts && site.otherContacts.length > 0 && (_jsxs("div", { className: "site-info-section", children: [_jsx("h3", { children: "Altri Contatti" }), _jsx("ul", { children: site.otherContacts.map(contact => (_jsxs("li", { children: [_jsxs("strong", { children: [contact.name, ":"] }), _jsx("span", { children: contact.phone }), contact.email && _jsxs("span", { style: { marginLeft: '8px', color: '#6b7280' }, children: ["(", contact.email, ")"] })] }, contact.id))) })] }))] }), _jsxs("div", { className: "filter-bar", children: [_jsxs("div", { className: "filter-group", children: [_jsx("span", { className: "filter-label", children: "Stato:" }), _jsx("button", { className: `filter-btn ${statusFilter === 'all' ? 'active' : ''}`, onClick: () => setStatusFilter('all'), children: "Tutti" }), _jsx("button", { className: `filter-btn ${statusFilter === 'pending' ? 'active' : ''}`, onClick: () => setStatusFilter('pending'), children: "Da Fare" }), _jsx("button", { className: `filter-btn ${statusFilter === 'in_progress' ? 'active' : ''}`, onClick: () => setStatusFilter('in_progress'), children: "In Corso" }), _jsx("button", { className: `filter-btn ${statusFilter === 'completed' ? 'active' : ''}`, onClick: () => setStatusFilter('completed'), children: "Completato" })] }), _jsxs("div", { className: "filter-group", children: [_jsx("span", { className: "filter-label", children: "Tipo:" }), _jsx("button", { className: `filter-btn ${typeFilter === 'all' ? 'active' : ''}`, onClick: () => setTypeFilter('all'), children: "Tutti" }), _jsx("button", { className: `filter-btn ${typeFilter === 'maintenance' ? 'active' : ''}`, onClick: () => setTypeFilter('maintenance'), children: "Manutenzione" }), _jsx("button", { className: `filter-btn ${typeFilter === 'odl' ? 'active' : ''}`, onClick: () => setTypeFilter('odl'), children: "ODL" })] })] }), _jsx("h2", { children: "Riepilogo Attivit\u00E0" }), _jsxs("div", { className: "odl-summary", children: [_jsxs("div", { className: "odl-column", children: [_jsxs("h3", { children: ["Da Fare (", pending.length, ")"] }), pending.map(task => (_jsxs("div", { className: `task-item ${task.status}`, onClick: () => onTaskClick(task), children: [_jsxs("span", { className: "task-item-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "task-item-assignee", children: task.assignees.join(', ') }), _jsxs("span", { className: "task-item-duedate", children: ["Scadenza: ", new Date(task.dueDate).toLocaleDateString('it-IT')] })] }, task.id)))] }), _jsxs("div", { className: "odl-column", children: [_jsxs("h3", { children: ["In Corso (", inProgress.length, ")"] }), inProgress.map(task => (_jsxs("div", { className: `task-item ${task.status}`, onClick: () => onTaskClick(task), children: [_jsxs("span", { className: "task-item-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "task-item-assignee", children: task.assignees.join(', ') }), _jsxs("span", { className: "task-item-duedate", children: ["Scadenza: ", new Date(task.dueDate).toLocaleDateString('it-IT')] })] }, task.id)))] }), _jsxs("div", { className: "odl-column", children: [_jsxs("h3", { children: ["Completate (", completed.length, ")"] }), completed.map(task => (_jsxs("div", { className: `task-item ${task.status}`, onClick: () => onTaskClick(task), children: [_jsxs("span", { className: "task-item-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "task-item-assignee", children: task.assignees.join(', ') }), _jsxs("span", { className: "task-item-duedate", children: ["Scadenza: ", new Date(task.dueDate).toLocaleDateString('it-IT')] })] }, task.id)))] })] }), _jsxs("div", { className: "history-list", children: [_jsx("h2", { children: "Storico Attivit\u00E0" }), [...filteredTasks].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(task => (_jsxs("div", { className: "history-item", onClick: () => onTaskClick(task), children: [_jsx("span", { className: `status-dot ${task.status}` }), _jsx("span", { className: "history-date", children: new Date(task.dueDate).toLocaleDateString('it-IT') }), _jsxs("span", { className: "history-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "history-assignees", children: task.assignees.join(', ') })] }, task.id)))] })] }));
};
const Schedule = ({ tasks, sites, users, resourceFilter, onResourceFilterChange, onAddTaskClick, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
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
        return tasks.reduce((acc, task) => {
            const dateKey = new Date(task.dueDate).toDateString();
            if (!acc[dateKey])
                acc[dateKey] = [];
            acc[dateKey].push(task);
            return acc;
        }, {});
    }, [tasks]);
    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    return (_jsxs("div", { children: [_jsx("div", { className: "header", children: _jsx("h1", { children: "Pianificazione" }) }), _jsxs("div", { className: "schedule-controls", children: [_jsxs("div", { className: "month-navigator", children: [_jsx("button", { onClick: () => changeMonth(-1), children: "<" }), _jsx("h2", { children: currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' }) }), _jsx("button", { onClick: () => changeMonth(1), children: ">" })] }), _jsxs("div", { className: "resource-filter", children: [_jsx("label", { htmlFor: "resource-filter-schedule", children: "Risorsa:" }), _jsxs("select", { id: "resource-filter-schedule", value: resourceFilter, onChange: (e) => onResourceFilterChange(e.target.value), children: [_jsx("option", { value: "", children: "Tutte le Risorse" }), users.map(user => (_jsx("option", { value: user.name, children: user.name }, user.id)))] })] })] }), _jsxs("div", { className: "calendar-grid", children: [weekDays.map(day => _jsx("div", { className: "calendar-header", children: day }, day)), Array.from({ length: startingDay }).map((_, i) => _jsx("div", { className: "calendar-day other-month" }, `empty-${i}`)), daysInMonth.map(day => {
                        const dateKey = day.toDateString();
                        const dayTasks = tasksByDate[dateKey] || [];
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (_jsxs("div", { className: `calendar-day ${isToday ? 'today' : ''}`, children: [_jsx("div", { className: "day-number", children: day.getDate() }), _jsx("button", { className: "add-task-btn", onClick: () => onAddTaskClick(day), children: "+" }), _jsx("div", { className: "tasks-list", children: dayTasks.map(task => {
                                        const site = sites.find(s => s.id === task.siteId);
                                        return (_jsxs("div", { className: `task-item ${task.status}`, onClick: () => onTaskClick(task), title: `${task.description} - ${site?.name} (${task.assignees.join(', ')})`, children: [_jsxs("span", { className: "task-item-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "task-item-assignee", children: task.assignees.join(', ') })] }, task.id));
                                    }) })] }, dateKey));
                    })] })] }));
};
const MatrixView = ({ tasks, sites, users, resourceFilter, onResourceFilterChange, onTaskClick, onAddTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
        while (date.getMonth() === currentDate.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);
    const tasksBySiteAndDate = useMemo(() => {
        const groupedTasks = {};
        sites.forEach(site => {
            groupedTasks[site.id] = {};
        });
        tasks.forEach(task => {
            const taskDueDate = new Date(task.dueDate);
            if (taskDueDate.getMonth() === currentDate.getMonth() && taskDueDate.getFullYear() === currentDate.getFullYear()) {
                const date = taskDueDate.getDate();
                if (!groupedTasks[task.siteId])
                    groupedTasks[task.siteId] = {};
                if (!groupedTasks[task.siteId][date]) {
                    groupedTasks[task.siteId][date] = [];
                }
                groupedTasks[task.siteId][date].push(task);
            }
        });
        return groupedTasks;
    }, [tasks, sites, currentDate]);
    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    return (_jsxs("div", { style: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsx("div", { className: "header", children: _jsx("h1", { children: "Vista a Matrice" }) }), _jsxs("div", { className: "schedule-controls", children: [_jsxs("div", { className: "month-navigator", children: [_jsx("button", { onClick: () => changeMonth(-1), children: "<" }), _jsx("h2", { children: currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' }) }), _jsx("button", { onClick: () => changeMonth(1), children: ">" })] }), _jsxs("div", { className: "resource-filter", children: [_jsx("label", { htmlFor: "resource-filter-matrix", children: "Risorsa:" }), _jsxs("select", { id: "resource-filter-matrix", value: resourceFilter, onChange: (e) => onResourceFilterChange(e.target.value), children: [_jsx("option", { value: "", children: "Tutte le Risorse" }), users.map(user => (_jsx("option", { value: user.name, children: user.name }, user.id)))] })] })] }), _jsx("div", { className: "matrix-container", children: _jsxs("div", { className: "matrix-grid", style: { gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${daysInMonth.length}, minmax(150px, 1fr))` }, children: [_jsx("div", { className: "matrix-cell matrix-header sticky-top sticky-left", children: "Sito" }), daysInMonth.map(day => (_jsxs("div", { className: `matrix-cell matrix-header sticky-top ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`, children: [_jsx("span", { className: "matrix-day-name", children: day.toLocaleDateString('it-IT', { weekday: 'short' }) }), _jsx("span", { className: "matrix-day-number", children: day.getDate() })] }, `header-${day.getDate()}`))), sites.map(site => (_jsxs(React.Fragment, { children: [_jsx("div", { className: "matrix-cell matrix-site-header sticky-left", children: site.name }), daysInMonth.map(day => {
                                    const dayNumber = day.getDate();
                                    const cellTasks = tasksBySiteAndDate[site.id]?.[dayNumber] || [];
                                    return (_jsxs("div", { className: `matrix-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`, children: [_jsx("button", { className: "add-task-btn", onClick: () => onAddTaskClick(day, site.id), children: "+" }), cellTasks.map(task => (_jsxs("div", { className: `task-item ${task.status}`, onClick: () => onTaskClick(task), title: `${task.description} - ${task.assignees.join(', ')}`, children: [_jsxs("span", { className: "task-item-desc", children: [task.type === 'odl' && `[ODL] `, task.description] }), _jsx("span", { className: "task-item-assignee", children: task.assignees.join(', ') })] }, task.id)))] }, `${site.id}-${dayNumber}`));
                                })] }, site.id)))] }) })] }));
};
const GanttView = ({ tasks, sites, onTaskClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
        while (date.getMonth() === currentDate.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);
    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    const monthStart = daysInMonth[0];
    const monthEnd = daysInMonth[daysInMonth.length - 1];
    const tasksForMonth = useMemo(() => {
        return tasks.filter(task => {
            const { start, end } = getTaskInterval(task);
            return start <= monthEnd && end >= monthStart;
        });
    }, [tasks, monthStart, monthEnd]);
    return (_jsxs("div", { style: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsx("div", { className: "header", children: _jsx("h1", { children: "Gantt" }) }), _jsx("div", { className: "schedule-controls", children: _jsxs("div", { className: "month-navigator", children: [_jsx("button", { onClick: () => changeMonth(-1), children: "<" }), _jsx("h2", { children: currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' }) }), _jsx("button", { onClick: () => changeMonth(1), children: ">" })] }) }), _jsx("div", { className: "gantt-container", children: _jsxs("div", { className: "gantt-grid", style: { gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${daysInMonth.length}, 1fr)` }, children: [_jsx("div", { className: "gantt-cell gantt-header sticky-top sticky-left", children: "Sito" }), daysInMonth.map(day => (_jsxs("div", { className: `gantt-cell gantt-header sticky-top ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`, children: [_jsx("span", { className: "gantt-day-name", children: day.toLocaleDateString('it-IT', { weekday: 'short' }) }), _jsx("span", { className: "gantt-day-number", children: day.getDate() })] }, `header-${day.getDate()}`))), sites.map((site, siteIndex) => (_jsxs(React.Fragment, { children: [_jsx("div", { className: "gantt-cell gantt-site-header sticky-left", style: { gridRow: siteIndex + 2 }, children: site.name }), daysInMonth.map((day, dayIndex) => (_jsx("div", { className: `gantt-cell gantt-row-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`, style: { gridRow: siteIndex + 2, gridColumn: dayIndex + 2 } }, `${site.id}-${day.getDate()}`)))] }, site.id))), tasksForMonth.map(task => {
                            const siteIndex = sites.findIndex(s => s.id === task.siteId);
                            if (siteIndex === -1)
                                return null;
                            const { start, end } = getTaskInterval(task);
                            const startDayOfMonth = start < monthStart ? 1 : start.getDate();
                            const endDayOfMonth = end > monthEnd ? daysInMonth.length : end.getDate();
                            // grid-column is 1-based, our days are 0-indexed. And first column is site names.
                            const gridColumnStart = startDayOfMonth + 1;
                            const gridColumnEnd = endDayOfMonth + 2;
                            return (_jsx("div", { className: `gantt-task ${task.status}`, style: {
                                    gridRow: siteIndex + 2,
                                    gridColumn: `${gridColumnStart} / ${gridColumnEnd}`
                                }, title: `${task.description} (${task.assignees.join(', ')})`, onClick: () => onTaskClick(task), children: _jsxs("span", { className: "gantt-task-label", children: [task.type === 'odl' && `[ODL] `, task.description] }) }, task.id));
                        })] }) })] }));
};
// --- HELPERS ---
const getTaskInterval = (task) => {
    const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    const end = new Date(task.dueDate);
    end.setHours(23, 59, 59, 999); // Normalize to end of day
    return { start, end };
};
const checkAssignmentConflicts = (newAssignees, newTaskInterval, allTasks, currentTaskId) => {
    const conflictingAssignees = new Set();
    const { start: newStart, end: newEnd } = newTaskInterval;
    for (const assignee of newAssignees) {
        const assignedTasks = allTasks.filter(t => t.id !== currentTaskId && t.assignees.includes(assignee));
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
    const [view, setView] = useState('dashboard');
    const [sites, setSites] = useState([]);
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [maintenanceActivities, setMaintenanceActivities] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedSiteId, setSelectedSiteId] = useState(null);
    const [resourceFilter, setResourceFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalConfig, setModalConfig] = useState({ type: null });
    const [installPrompt, setInstallPrompt] = useState(null);
    const [readNotificationIds, setReadNotificationIds] = useState(() => {
        try {
            const item = window.localStorage.getItem('readNotificationIds');
            return item ? new Set(JSON.parse(item)) : new Set();
        }
        catch (error) {
            console.error("Failed to load read notifications from localStorage", error);
            return new Set();
        }
    });
    const selectedSite = useMemo(() => sites.find(s => s.id === selectedSiteId), [sites, selectedSiteId]);
    useEffect(() => {
        try {
            window.localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(readNotificationIds)));
        }
        catch (error) {
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
            }
            catch (err) {
                setError('Impossibile caricare i dati. Riprova più tardi.');
                console.error(err);
            }
            finally {
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
        const generated = [];
        tasks.forEach(task => {
            if (task.status !== 'completed') {
                const dueDate = new Date(task.dueDate);
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
                }
                else if (dueDate >= todayStart && dueDate < imminentEnd) { // Imminent
                    const daysDiff = Math.ceil((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                    let imminentMsg = 'domani';
                    if (daysDiff === 0)
                        imminentMsg = 'oggi';
                    else if (daysDiff > 1)
                        imminentMsg = `tra ${daysDiff} giorni`;
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
        const finalNotifications = generated.sort((a, b) => {
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
        const handleBeforeInstallPrompt = (e) => {
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
        return tasks.filter(task => task.assignees.includes(resourceFilter));
    }, [tasks, resourceFilter]);
    const closeModal = () => setModalConfig({ type: null });
    const handleAddTask = async (taskData) => {
        const { startDate, dueDate, assignees } = taskData;
        const newTaskInterval = {
            start: startDate ? new Date(startDate) : new Date(dueDate),
            end: new Date(dueDate)
        };
        newTaskInterval.start.setHours(0, 0, 0, 0);
        newTaskInterval.end.setHours(23, 59, 59, 999);
        const conflictingAssignees = checkAssignmentConflicts(assignees, newTaskInterval, tasks, null);
        if (conflictingAssignees.length > 0) {
            const proceed = window.confirm(`Attenzione: Le seguenti risorse hanno già impegni concomitanti:\n\n- ${conflictingAssignees.join('\n- ')}\n\nVuoi procedere comunque?`);
            if (!proceed)
                return;
        }
        const savedTask = await api.addTask(taskData);
        setTasks(prevTasks => [...prevTasks, savedTask].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    };
    const handleSaveSite = async (site) => {
        const savedSite = await api.saveSite(site);
        const siteExists = sites.some(s => s.id === savedSite.id);
        if (siteExists) {
            setSites(sites.map(s => s.id === savedSite.id ? savedSite : s));
        }
        else {
            setSites(prevSites => [...prevSites, savedSite]);
        }
    };
    const handleSaveUser = async (user) => {
        const savedUser = await api.saveUser(user);
        const userExists = users.some(u => u.id === savedUser.id);
        if (userExists) {
            setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
        }
        else {
            setUsers(prevUsers => [...prevUsers, savedUser]);
        }
    };
    const handleUpdateTask = async (taskId, updates) => {
        const originalTask = tasks.find(t => t.id === taskId);
        if (!originalTask)
            return;
        const updatedTaskData = { ...originalTask, ...updates };
        const { startDate, dueDate, assignees } = updatedTaskData;
        const updatedTaskInterval = {
            start: startDate ? new Date(startDate) : new Date(dueDate),
            end: new Date(dueDate)
        };
        updatedTaskInterval.start.setHours(0, 0, 0, 0);
        updatedTaskInterval.end.setHours(23, 59, 59, 999);
        const conflictingAssignees = checkAssignmentConflicts(assignees, updatedTaskInterval, tasks, taskId);
        if (conflictingAssignees.length > 0) {
            const proceed = window.confirm(`Attenzione: Aggiornando questa attività si creano conflitti di pianificazione per:\n\n- ${conflictingAssignees.join('\n- ')}\n\nVuoi salvare le modifiche comunque?`);
            if (!proceed)
                return;
        }
        const updatedTask = await api.updateTask(taskId, updates);
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    };
    const handleDeleteTask = async (taskId) => {
        await api.deleteTask(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
    };
    const handleAddTaskClick = (date, siteId) => {
        setModalConfig({ type: 'addTask', data: { selectedDate: date, selectedSiteId: siteId } });
    };
    const handleAddSiteClick = () => {
        setModalConfig({ type: 'siteForm', data: { siteToEdit: null } });
    };
    const handleEditSiteClick = (site) => {
        setModalConfig({ type: 'siteForm', data: { siteToEdit: site } });
    };
    const handleAddUserClick = () => {
        setModalConfig({ type: 'userForm', data: { userToEdit: null } });
    };
    const handleUserClick = (user) => {
        setModalConfig({ type: 'userForm', data: { userToEdit: user } });
    };
    const handleAddODLClick = () => {
        setModalConfig({ type: 'addODL' });
    };
    const handleTaskClick = (task) => {
        setModalConfig({ type: 'taskDetails', data: { taskId: task.id } });
    };
    const handleCardClick = (cardType) => {
        setModalConfig({ type: 'taskList', data: { cardType } });
    };
    const handleSiteClick = (siteId) => {
        setSelectedSiteId(siteId);
        setView('site-detail');
    };
    const handleNotificationClick = (notification) => {
        handleTaskClick(notification.task);
        setReadNotificationIds(prev => new Set(prev).add(notification.id));
    };
    const handleMarkAllAsRead = () => {
        const allCurrentIds = notifications.map(n => n.id);
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
        }
        else {
            console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
    };
    const navigate = (viewName) => {
        setSelectedSiteId(null);
        setView(viewName);
    };
    if (isLoading) {
        return _jsx("div", { className: "loading-container", children: _jsx("div", { className: "loading-spinner" }) });
    }
    if (error) {
        return _jsx("div", { className: "loading-container", children: _jsx("div", { className: "error-message", children: error }) });
    }
    const renderModalContent = () => {
        if (!modalConfig.type)
            return null;
        switch (modalConfig.type) {
            case 'addTask':
                return _jsx(AddTaskForm, { sites: sites, users: users, maintenanceActivities: maintenanceActivities, onAddTask: handleAddTask, onClose: closeModal, selectedDate: modalConfig.data.selectedDate, selectedSiteId: modalConfig.data.selectedSiteId });
            case 'addODL':
                return _jsx(AddODLForm, { sites: sites, users: users, onAddTask: handleAddTask, onClose: closeModal });
            case 'siteForm':
                return _jsx(SiteForm, { onSaveSite: handleSaveSite, onClose: closeModal, siteToEdit: modalConfig.data.siteToEdit });
            case 'userForm':
                return _jsx(UserForm, { onSaveUser: handleSaveUser, onClose: closeModal, userToEdit: modalConfig.data.userToEdit });
            case 'taskDetails': {
                const task = tasks.find(t => t.id === modalConfig.data.taskId);
                if (!task)
                    return null;
                return _jsx(TaskDetailsForm, { task: task, sites: sites, users: users, onUpdateTask: handleUpdateTask, onDeleteTask: handleDeleteTask, onClose: closeModal });
            }
            case 'taskList': {
                const cardType = modalConfig.data.cardType;
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let filtered = [];
                let title = '';
                switch (cardType) {
                    case 'overdue':
                        title = 'Attività Scadute';
                        filtered = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < todayStart);
                        break;
                    case 'pending':
                        title = 'Attività da Fare';
                        filtered = tasks.filter(t => t.status === 'pending');
                        break;
                    case 'in_progress':
                        title = 'Attività in Corso';
                        filtered = tasks.filter(t => t.status === 'in_progress');
                        break;
                    case 'completed':
                        title = 'Completate nel Mese';
                        filtered = tasks.filter(t => t.status === 'completed' && new Date(t.dueDate).getMonth() === now.getMonth());
                        break;
                    default: return null;
                }
                return _jsx(TaskListModal, { title: title, tasks: filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), sites: sites, onClose: closeModal, onTaskClick: handleTaskClick });
            }
            default:
                return null;
        }
    };
    const renderView = () => {
        switch (view) {
            case 'sites':
                return _jsx(SiteList, { sites: sites, onAddSiteClick: handleAddSiteClick, onSiteClick: handleSiteClick });
            case 'schedule':
                return _jsx(Schedule, { tasks: filteredTasks, sites: sites, users: users, resourceFilter: resourceFilter, onResourceFilterChange: setResourceFilter, onAddTaskClick: handleAddTaskClick, onTaskClick: handleTaskClick });
            case 'matrix':
                return _jsx(MatrixView, { tasks: filteredTasks, sites: sites, users: users, resourceFilter: resourceFilter, onResourceFilterChange: setResourceFilter, onTaskClick: handleTaskClick, onAddTaskClick: handleAddTaskClick });
            case 'gantt':
                return _jsx(GanttView, { tasks: filteredTasks, sites: sites, onTaskClick: handleTaskClick });
            case 'risorse':
                return _jsx(Resources, { users: users, onAddUserClick: handleAddUserClick, onUserClick: handleUserClick });
            case 'odl':
                return _jsx(ODLView, { tasks: tasks, sites: sites, onAddODLClick: handleAddODLClick, onTaskClick: handleTaskClick });
            case 'site-detail':
                if (selectedSite) {
                    return _jsx(SiteDetail, { site: selectedSite, tasks: tasks, onTaskClick: handleTaskClick, onEditSiteClick: handleEditSiteClick });
                }
                return null;
            case 'dashboard':
            default:
                return _jsx(Dashboard, { tasks: tasks, sites: sites, onCardClick: handleCardClick, onTaskClick: handleTaskClick });
        }
    };
    return (_jsxs("div", { className: "app-container", children: [_jsxs("aside", { className: "sidebar", children: [_jsx("h1", { className: "sidebar-header", children: "Gestione M." }), _jsxs("ul", { className: "sidebar-nav", children: [_jsx("li", { children: _jsx("button", { className: view === 'dashboard' ? 'active' : '', onClick: () => navigate('dashboard'), children: "Dashboard" }) }), _jsx("li", { children: _jsx("button", { className: view === 'sites' ? 'active' : '', onClick: () => navigate('sites'), children: "Siti" }) }), _jsx("li", { children: _jsx("button", { className: view === 'schedule' ? 'active' : '', onClick: () => navigate('schedule'), children: "Pianificazione" }) }), _jsx("li", { children: _jsx("button", { className: view === 'matrix' ? 'active' : '', onClick: () => navigate('matrix'), children: "Vista a Matrice" }) }), _jsx("li", { children: _jsx("button", { className: view === 'gantt' ? 'active' : '', onClick: () => navigate('gantt'), children: "Gantt" }) }), _jsx("li", { children: _jsx("button", { className: view === 'odl' ? 'active' : '', onClick: () => navigate('odl'), children: "ODL" }) }), _jsx("li", { children: _jsx("button", { className: view === 'risorse' ? 'active' : '', onClick: () => navigate('risorse'), children: "Risorse" }) })] }), installPrompt && (_jsx("div", { className: "sidebar-footer", children: _jsxs("button", { className: "btn-install", onClick: handleInstallClick, children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "7 10 12 15 17 10" }), _jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })] }), _jsx("span", { children: "Installa App" })] }) }))] }), _jsxs("main", { className: "main-content", children: [_jsx(NotificationBell, { notifications: notifications, onNotificationClick: handleNotificationClick, onMarkAllAsRead: handleMarkAllAsRead, sites: sites }), renderView()] }), modalConfig.type && _jsx(Modal, { onClose: closeModal, children: renderModalContent() })] }));
};
const container = document.getElementById('root');
const root = createRoot(container);
root.render(_jsx(App, {}));
