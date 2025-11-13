const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'reminders.db');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        text TEXT,
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  return db;
}

module.exports = initDB;