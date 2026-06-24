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
  getUnviewedCount,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
  toggleTemplatePin
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

async function addTemplateToDB(title, text) {
  const database = getDB();
  return await addTemplate(database, title, text);
}

async function updateTemplateInDB(id, title, text) {
  const database = getDB();
  return await updateTemplate(database, id, title, text);
}

async function deleteTemplateInDB(id) {
  const database = getDB();
  return await deleteTemplate(database, id);
}

async function getAllTemplatesFromDB() {
  const database = getDB();
  return await getAllTemplates(database);
}

async function toggleTemplatePinInDB(id) {
  const database = getDB();
  return await toggleTemplatePin(database, id);
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
  getUnviewedCountFromDB,
  addTemplateToDB,
  updateTemplateInDB,
  deleteTemplateInDB,
  getAllTemplatesFromDB,
  toggleTemplatePinInDB
};