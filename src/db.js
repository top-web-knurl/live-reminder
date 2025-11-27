const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'reminders.db');
  console.log('Database path:', dbPath);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Database opened successfully');
    }
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        text TEXT,
        image_path TEXT,
        reminder_time DATETIME,
        is_shown INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0,
        is_viewed INTEGER DEFAULT 0,
        is_pinned INTEGER DEFAULT 0,
        pin_order INTEGER DEFAULT 0,
        last_reminded_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      } else {
        console.log('Reminders table ready');
        
        db.all("PRAGMA table_info(reminders)", (err, columns) => {
          if (err) {
            console.error('Error checking table structure:', err);
            return;
          }
          
          const columnNames = columns.map(col => col.name);
          const newColumns = [
            { name: 'reminder_time', type: 'DATETIME' },
            { name: 'is_shown', type: 'INTEGER DEFAULT 0' },
            { name: 'is_archived', type: 'INTEGER DEFAULT 0' },
            { name: 'is_viewed', type: 'INTEGER DEFAULT 0' },
            { name: 'is_pinned', type: 'INTEGER DEFAULT 0' },
            { name: 'pin_order', type: 'INTEGER DEFAULT 0' },
            { name: 'last_reminded_at', type: 'DATETIME' }
          ];
          
          newColumns.forEach(col => {
            if (!columnNames.includes(col.name)) {
              db.run(`ALTER TABLE reminders ADD COLUMN ${col.name} ${col.type}`, (err) => {
                if (err) console.error(`Error adding ${col.name} column:`, err);
                else console.log(`Added ${col.name} column`);
              });
            }
          });
        });
      }
    });
  });

  return db;
}

function addReminder(db, title, text, reminderTime) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO reminders (title, text, reminder_time, is_shown, is_archived) VALUES (?, ?, ?, 0, 0)',
      [title, text, reminderTime],
      function(err) {
        if (err) {
          console.error('Error adding reminder:', err);
          reject(err);
        } else {
          console.log('Reminder added with ID:', this.lastID);
          resolve({ success: true, id: this.lastID, message: 'Reminder added successfully!' });
        }
      }
    );
  });
}

function updateReminder(db, id, title, text, reminderTime) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE reminders SET title = ?, text = ?, reminder_time = ?, is_shown = 0 WHERE id = ?',
      [title, text, reminderTime, id],
      function(err) {
        if (err) {
          console.error('Error updating reminder:', err);
          reject(err);
        } else {
          console.log('Reminder updated:', id);
          resolve({ success: true, message: 'Reminder updated successfully!' });
        }
      }
    );
  });
}

function archiveReminder(db, id) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE reminders SET is_archived = 1 WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Error archiving reminder:', err);
          reject(err);
        } else {
          console.log('Reminder archived:', id);
          resolve({ success: true, message: 'Reminder archived!' });
        }
      }
    );
  });
}

function restoreReminder(db, id) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE reminders SET is_archived = 0, is_shown = 0 WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Error restoring reminder:', err);
          reject(err);
        } else {
          console.log('Reminder restored:', id);
          resolve({ success: true, message: 'Reminder restored!' });
        }
      }
    );
  });
}

function permanentlyDeleteReminder(db, id) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM reminders WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Error deleting reminder:', err);
          reject(err);
        } else {
          console.log('Reminder permanently deleted:', id);
          resolve({ success: true, message: 'Reminder deleted permanently!' });
        }
      }
    );
  });
}

function clearArchive(db) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM reminders WHERE is_archived = 1',
      function(err) {
        if (err) {
          console.error('Error clearing archive:', err);
          reject(err);
        } else {
          console.log('Archive cleared, deleted', this.changes, 'reminders');
          resolve({ success: true, count: this.changes, message: 'Archive cleared!' });
        }
      }
    );
  });
}

function togglePin(db, id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT is_pinned FROM reminders WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      const newPinStatus = row.is_pinned === 1 ? 0 : 1;
      
      db.run(
        'UPDATE reminders SET is_pinned = ? WHERE id = ?',
        [newPinStatus, id],
        function(err) {
          if (err) {
            console.error('Error toggling pin:', err);
            reject(err);
          } else {
            console.log('Reminder pin toggled:', id, 'to', newPinStatus);
            resolve({ success: true, isPinned: newPinStatus === 1 });
          }
        }
      );
    });
  });
}

function markAsViewed(db, id) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE reminders SET is_viewed = 1 WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Error marking as viewed:', err);
          reject(err);
        } else {
          console.log('Reminder marked as viewed:', id);
          resolve({ success: true });
        }
      }
    );
  });
}

function markReminderShown(db, reminderId) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.run(
      'UPDATE reminders SET is_shown = 1, last_reminded_at = ? WHERE id = ?',
      [now, reminderId],
      function(err) {
        if (err) {
          console.error('Error marking reminder as shown:', err);
          reject(err);
        } else {
          console.log('Reminder marked as shown:', reminderId);
          resolve({ success: true });
        }
      }
    );
  });
}

function getNextUpcomingReminder(db) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    db.get(
      `SELECT * FROM reminders 
       WHERE reminder_time IS NOT NULL 
       AND reminder_time > ? 
       AND is_shown = 0 
       AND is_archived = 0
       ORDER BY reminder_time ASC 
       LIMIT 1`,
      [now],
      (err, row) => {
        if (err) {
          console.error('Error fetching next reminder:', err);
          reject(err);
        } else {
          if (row) {
            console.log('Next upcoming reminder:', row);
          } else {
            console.log('No upcoming reminders');
          }
          resolve(row || null);
        }
      }
    );
  });
}

function getAllReminders(db) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM reminders 
       WHERE is_archived = 0 
       ORDER BY is_pinned DESC, pin_order ASC, created_at DESC`,
      (err, rows) => {
        if (err) {
          console.error('Error fetching reminders:', err);
          reject(err);
        } else {
          console.log(`Fetched ${rows.length} active reminders`);
          resolve(rows);
        }
      }
    );
  });
}

function getArchivedReminders(db) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM reminders WHERE is_archived = 1 ORDER BY created_at DESC',
      (err, rows) => {
        if (err) {
          console.error('Error fetching archived reminders:', err);
          reject(err);
        } else {
          console.log(`Fetched ${rows.length} archived reminders`);
          resolve(rows);
        }
      }
    );
  });
}

// Get count of unviewed reminders
function getUnviewedCount(db) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM reminders WHERE is_shown = 1 AND is_viewed = 0 AND is_archived = 0',
      (err, row) => {
        if (err) {
          console.error('Error getting unviewed count:', err);
          reject(err);
        } else {
          resolve(row.count);
        }
      }
    );
  });
}

module.exports = { 
  initDB, 
  addReminder,
  updateReminder,
  archiveReminder,
  restoreReminder,
  permanentlyDeleteReminder,
  clearArchive,
  togglePin,
  markAsViewed,
  markReminderShown,
  getNextUpcomingReminder,
  getAllReminders,
  getArchivedReminders,
  getUnviewedCount
};