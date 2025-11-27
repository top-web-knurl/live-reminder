const { contextBridge, ipcRenderer } = require('electron');

// Expose database API to renderer process
contextBridge.exposeInMainWorld('dbAPI', {
  // Reminder CRUD
  addReminder: (title, text, reminderTime) => ipcRenderer.invoke('add-reminder', title, text, reminderTime),
  updateReminder: (id, title, text, reminderTime) => ipcRenderer.invoke('update-reminder', id, title, text, reminderTime),
  getAllReminders: () => ipcRenderer.invoke('get-all-reminders'),
  
  // Archive operations
  archiveReminder: (id) => ipcRenderer.invoke('archive-reminder', id),
  restoreReminder: (id) => ipcRenderer.invoke('restore-reminder', id),
  deleteReminder: (id) => ipcRenderer.invoke('delete-reminder', id),
  clearArchive: () => ipcRenderer.invoke('clear-archive'),
  getArchivedReminders: () => ipcRenderer.invoke('get-archived-reminders'),
  
  // Pin/favorite operations
  togglePin: (id) => ipcRenderer.invoke('toggle-pin', id),
  
  // Status operations
  markViewed: (id) => ipcRenderer.invoke('mark-viewed', id)
});