const initDB = require('./db');

// Инициализируем БД один раз
let db;
function getDB() {
  if (!db) {
    db = initDB();
  }
  return db;
}