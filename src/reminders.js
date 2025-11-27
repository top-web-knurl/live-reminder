const { 
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
} = require('./db');

let db;
function getDB() {
  if (!db) {
    db = initDB();
  }
  return db;
}

async function addReminderToDB(title, text, reminderTime) {
  const database = getDB();
  return await addReminder(database, title, text, reminderTime);
}

async function updateReminderInDB(id, title, text, reminderTime) {
  const database = getDB();
  return await updateReminder(database, id, title, text, reminderTime);
}

async function archiveReminderInDB(id) {
  const database = getDB();
  return await archiveReminder(database, id);
}

async function restoreReminderInDB(id) {
  const database = getDB();
  return await restoreReminder(database, id);
}

async function deleteReminderInDB(id) {
  const database = getDB();
  return await permanentlyDeleteReminder(database, id);
}

async function clearArchiveInDB() {
  const database = getDB();
  return await clearArchive(database);
}

async function togglePinInDB(id) {
  const database = getDB();
  return await togglePin(database, id);
}

async function markAsViewedInDB(id) {
  const database = getDB();
  return await markAsViewed(database, id);
}

async function getNextUpcomingReminderFromDB() {
  const database = getDB();
  return await getNextUpcomingReminder(database);
}

async function markReminderShownInDB(reminderId) {
  const database = getDB();
  return await markReminderShown(database, reminderId);
}

async function getAllRemindersFromDB() {
  const database = getDB();
  return await getAllReminders(database);
}

async function getArchivedRemindersFromDB() {
  const database = getDB();
  return await getArchivedReminders(database);
}

async function getUnviewedCountFromDB() {
  const database = getDB();
  return await getUnviewedCount(database);
}

module.exports = { 
  getDB, 
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
};