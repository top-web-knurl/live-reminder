const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas'); // for tray badge

// Set proper app name for Windows notifications
app.setName('Напоминалка');
app.setAppUserModelId('web-samurai.ru[Напоминалка]');

const {
  addReminderToDB,
  updateReminderInDB,
  archiveReminderInDB,
  restoreReminderInDB,
  deleteReminderInDB,
  clearArchiveInDB,
  togglePinInDB,
  markAsViewedInDB,
  getNextUpcomingReminderFromDB,
  markReminderShownInDB,
  getAllRemindersFromDB,
  getArchivedRemindersFromDB,
  getUnviewedCountFromDB
} = require('./src/reminders');

let mainWindow = null;
let tray = null;
let reminderTimer = null;
const recurringTimers = new Map(); // reminderId -> timeout

const trayIconPath = path.join(__dirname, 'assets', 'icon.png');

// ---------------- IPC HANDLERS ---------------- //
ipcMain.handle('add-reminder', async (event, title, text, reminderTime) => {
  try {
    const result = await addReminderToDB(title, text, reminderTime);
    scheduleNextReminder();
    return result;
  } catch (e) {
    console.error('IPC add-reminder error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('update-reminder', async (event, id, title, text, reminderTime) => {
  try {
    const result = await updateReminderInDB(id, title, text, reminderTime);
    scheduleNextReminder();
    return result;
  } catch (e) {
    console.error('IPC update-reminder error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('get-all-reminders', async () => {
  try {
    const reminders = await getAllRemindersFromDB();
    return { success: true, reminders };
  } catch (e) {
    console.error('IPC get-all-reminders error:', e);
    return { success: false, message: e.message, reminders: [] };
  }
});

ipcMain.handle('archive-reminder', async (event, id) => {
  try {
    stopRecurringReminder(id);
    const result = await archiveReminderInDB(id);
    scheduleNextReminder();
    await updateTrayBadge();
    return result;
  } catch (e) {
    console.error('IPC archive-reminder error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('restore-reminder', async (event, id) => {
  try {
    const result = await restoreReminderInDB(id);
    scheduleNextReminder();
    return result;
  } catch (e) {
    console.error('IPC restore-reminder error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('delete-reminder', async (event, id) => {
  try {
    stopRecurringReminder(id);
    const result = await deleteReminderInDB(id);
    await updateTrayBadge();
    return result;
  } catch (e) {
    console.error('IPC delete-reminder error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('clear-archive', async () => {
  try {
    const result = await clearArchiveInDB();
    return result;
  } catch (e) {
    console.error('IPC clear-archive error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('toggle-pin', async (event, id) => {
  try {
    const result = await togglePinInDB(id);
    if (!result.isPinned) stopRecurringReminder(id);
    return result;
  } catch (e) {
    console.error('IPC toggle-pin error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('mark-viewed', async (event, id) => {
  try {
    stopRecurringReminder(id);
    const result = await markAsViewedInDB(id);
    await updateTrayBadge();
    return result;
  } catch (e) {
    console.error('IPC mark-viewed error:', e);
    return { success: false, message: e.message };
  }
});

ipcMain.handle('get-archived-reminders', async () => {
  try {
    const reminders = await getArchivedRemindersFromDB();
    return { success: true, reminders };
  } catch (e) {
    console.error('IPC get-archived-reminders error:', e);
    return { success: false, message: e.message, reminders: [] };
  }
});

ipcMain.handle('get-unviewed-count', async () => {
  try {
    const count = await getUnviewedCountFromDB();
    return count;
  } catch (e) {
    console.error('IPC get-unviewed-count error:', e);
    return 0;
  }
});

// ---------------- TRAY BADGE & TASKBAR OVERLAY ---------------- //
async function updateTrayBadge() {
  try {
    const count = await getUnviewedCountFromDB();
    console.log('Updating badges. Count:', count);
    
    if (!tray) return;

    if (count > 0) {
      const countStr = count > 9 ? '9+' : count.toString();

      // --- 1. Taskbar Overlay (Badge only) ---
      if (mainWindow) {
        try {
          // Create a small canvas for the overlay icon (usually 16x16 or 32x32 is good for overlay)
          const overlaySize = 32;
          const overlayCanvas = createCanvas(overlaySize, overlaySize);
          const oCtx = overlayCanvas.getContext('2d');

          // Draw red circle filling the canvas
          oCtx.fillStyle = '#ff0000';
          oCtx.beginPath();
          oCtx.arc(overlaySize / 2, overlaySize / 2, overlaySize / 2, 0, Math.PI * 2);
          oCtx.fill();

          // Draw white text
          oCtx.fillStyle = '#ffffff';
          oCtx.font = `bold ${overlaySize * 0.6}px Arial`; // 60% of size
          oCtx.textAlign = 'center';
          oCtx.textBaseline = 'middle';
          // Slight Y adjustment for vertical centering
          oCtx.fillText(countStr, overlaySize / 2, overlaySize / 2 + (overlaySize * 0.05));

          const overlayBuffer = overlayCanvas.toBuffer('image/png');
          const overlayImg = nativeImage.createFromBuffer(overlayBuffer);
          mainWindow.setOverlayIcon(overlayImg, countStr);
        } catch (err) {
          console.error('Error setting taskbar overlay:', err);
        }
      }

      // --- 2. Tray Icon (Icon + Badge) ---
      let img;
      try {
        if (fs.existsSync(trayIconPath)) {
          const buffer = fs.readFileSync(trayIconPath);
          img = await loadImage(buffer);
        } else {
          tray.setImage(trayIconPath);
          return;
        }
      } catch (err) {
        console.error('Error loading tray icon:', err);
        tray.setImage(trayIconPath);
        return;
      }

      // Resize to 128x128 for high DPI
      const size = 128;
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Draw original icon
      ctx.drawImage(img, 0, 0, size, size);
      
      // Draw Badge
      // Use 45% of size for the badge circle
      const badgeSize = size * 0.45; 
      const badgeX = size - badgeSize;
      const badgeY = 0;
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      // Font size: 75% of badge size
      ctx.font = `bold ${badgeSize * 0.75}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Center text in the badge circle
      ctx.fillText(countStr, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + (size * 0.03));
      
      const buffer = canvas.toBuffer('image/png');
      const icon = nativeImage.createFromBuffer(buffer);
      tray.setImage(icon);

    } else {
      // Clear badges if count is 0
      tray.setImage(trayIconPath);
      if (mainWindow) {
        mainWindow.setOverlayIcon(null, '');
      }
    }
  } catch (e) {
    console.error('Error updating badges:', e);
    if (tray) tray.setImage(trayIconPath);
  }
}

// ---------------- SCHEDULING ---------------- //
async function scheduleNextReminder() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
  try {
    const next = await getNextUpcomingReminderFromDB();
    if (!next) {
      console.log('No upcoming reminders to schedule');
      return;
    }
    const now = new Date();
    const reminderTime = new Date(next.reminder_time);
    const delay = reminderTime - now;
    console.log(`Next reminder "${next.title}" scheduled for ${reminderTime.toLocaleString('ru-RU')}`);
    if (delay <= 0) {
      showReminderNotification(next);
    } else {
      reminderTimer = setTimeout(() => showReminderNotification(next), delay);
    }
  } catch (e) {
    console.error('Error scheduling next reminder:', e);
  }
}

async function showReminderNotification(reminder) {
  console.log('Showing notification for reminder:', reminder.title);
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: 'Напоминалка',
      body: reminder.title,
      icon: trayIconPath,
      silent: false
    });
    notif.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    notif.show();
  } else if (process.platform === 'win32' && tray) {
    tray.displayBalloon({
      title: 'Напоминалка',
      content: reminder.title,
      icon: nativeImage.createFromPath(trayIconPath)
    });
  }
  try {
    await markReminderShownInDB(reminder.id);
    await updateTrayBadge();
    if (reminder.is_pinned === 1) {
      scheduleRecurringReminder(reminder);
    }
  } catch (e) {
    console.error('Error after showing reminder:', e);
  }
  scheduleNextReminder();
}

function scheduleRecurringReminder(reminder) {
  // Only schedule if still unviewed
  const timerId = setTimeout(async () => {
    const all = await getAllRemindersFromDB();
    const current = all.find(r => r.id === reminder.id);
    if (current && current.is_shown === 1 && current.is_viewed === 0 && current.is_pinned === 1) {
      console.log('Recurring reminder for', reminder.title);
      showReminderNotification(current);
    } else {
      stopRecurringReminder(reminder.id);
    }
  }, 15 * 60 * 1000);
  recurringTimers.set(reminder.id, timerId);
}

function stopRecurringReminder(id) {
  if (recurringTimers.has(id)) {
    clearTimeout(recurringTimers.get(id));
    recurringTimers.delete(id);
    console.log('Stopped recurring timer for', id);
  }
}

// ---------------- APP LIFECYCLE ---------------- //
app.whenReady().then(() => {
  createWindow();
  scheduleNextReminder();
  updateTrayBadge();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: trayIconPath, // Set window/taskbar icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('close', (e) => {
    if (app.quitting) {
      mainWindow = null;
    } else {
      e.preventDefault();
      mainWindow.hide();
    }
  });
  createTray();
}

function createTray() {
  tray = new Tray(trayIconPath);
  const menu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'Выход', click: () => { app.quitting = true; app.quit(); } }
  ]);
  tray.setToolTip('Напоминалка');
  tray.setContextMenu(menu);
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else if (mainWindow) mainWindow.show();
});

app.on('before-quit', () => {
  app.quitting = true;
  if (reminderTimer) clearTimeout(reminderTimer);
  recurringTimers.forEach(t => clearTimeout(t));
  recurringTimers.clear();
});