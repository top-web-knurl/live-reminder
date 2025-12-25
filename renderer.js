// Global state
let currentTab = 'reminders';
let editingReminderId = null;
let confirmCallback = null;
let remindersList = [];
let currentSearchQuery = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Page loaded, initializing...');
  initializeTabSwitching();
  initializeModal();
  initializeConfirmDialog();
  initializeClearArchiveButton();
  initializeSearch();
  await loadReminders();
});

// Tab switching
function initializeTabSwitching() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      switchTab(tab);
    });
  });
}

async function switchTab(tab) {
  currentTab = tab;
  
  // Update menu
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  if (tab === 'reminders') {
    document.getElementById('remindersTab').classList.add('active');
    await loadReminders();
  } else if (tab === 'archive') {
    document.getElementById('archiveTab').classList.add('active');
    await loadArchivedReminders();
  }
}

// Modal functionality
function initializeModal() {
  const modal = document.getElementById('reminderModal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const overlay = document.getElementById('modalOverlay');
  const form = document.getElementById('reminderForm');

  openBtn.addEventListener('click', () => openCreateModal());
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  form.addEventListener('submit', handleReminderSubmit);
}

function openCreateModal() {
  editingReminderId = null;
  document.getElementById('modalTitle').textContent = 'Новое напоминание';
  document.getElementById('saveBtn').textContent = 'Сохранить';
  document.getElementById('reminderForm').reset();
  document.getElementById('reminderId').value = '';
  
  const now = new Date();
  document.getElementById('reminderDate').valueAsDate = now;
  document.getElementById('reminderTime').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  document.getElementById('reminderModal').classList.add('active');
}

function openEditModal(reminder) {
  editingReminderId = reminder.id;
  document.getElementById('modalTitle').textContent = 'Редактировать напоминание';
  document.getElementById('saveBtn').textContent = 'Обновить';
  document.getElementById('reminderId').value = reminder.id;
  document.getElementById('reminderTitle').value = reminder.title;
  document.getElementById('reminderText').value = reminder.text || '';
  
  if (reminder.reminder_time) {
    const dt = new Date(reminder.reminder_time);
    document.getElementById('reminderDate').valueAsDate = dt;
    document.getElementById('reminderTime').value = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  }
  
  document.getElementById('reminderModal').classList.add('active');
}

function closeModal() {
  document.getElementById('reminderModal').classList.remove('active');
  document.getElementById('reminderForm').reset();
  editingReminderId = null;
}

// Handle form submission
async function handleReminderSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('reminderTitle').value.trim();
  const text = document.getElementById('reminderText').value.trim();
  const date = document.getElementById('reminderDate').value;
  const time = document.getElementById('reminderTime').value;

  if (!title || !date || !time) {
    showMessage('Заполните все обязательные поля', 'error');
    return;
  }

  const reminderDateTime = new Date(`${date}T${time}`);
  const now = new Date();

  if (reminderDateTime <= now) {
    showMessage('Время напоминания должно быть в будущем', 'error');
    return;
  }

  const reminderTimeISO = reminderDateTime.toISOString();

  try {
    let result;
    if (editingReminderId) {
      result = await window.dbAPI.updateReminder(editingReminderId, title, text, reminderTimeISO);
    } else {
      result = await window.dbAPI.addReminder(title, text, reminderTimeISO);
    }

    if (result.success) {
      showMessage(editingReminderId ? 'Напоминание обновлено!' : 'Напоминание создано!', 'success');
      closeModal();
      await loadReminders();
    } else {
      showMessage('Ошибка: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error saving reminder:', error);
    showMessage('Ошибка: ' + error.message, 'error');
  }
}

// Load reminders
async function loadReminders() {
  const container = document.getElementById('remindersContainer');
  
  try {
    const result = await window.dbAPI.getAllReminders();
    
    if (result.success && result.reminders) {
      remindersList = result.reminders;
      const filtered = filterReminders(remindersList, currentSearchQuery);
      
      if (remindersList.length === 0) {
        container.innerHTML = '<p class="no-reminders">Нет напоминаний. Создайте первое!</p>';
      } else if (filtered.length === 0) {
        container.innerHTML = '<p class="no-reminders">Ничего не найдено</p>';
      } else {
        container.innerHTML = filtered.map(reminder => createReminderCard(reminder)).join('');
        attachReminderEventListeners();
      }
    } else {
      container.innerHTML = '<p class="error">Ошибка загрузки</p>';
    }
  } catch (error) {
    console.error('Load reminders error:', error);
    container.innerHTML = '<p class="error">Ошибка: ' + error.message + '</p>';
  }
  
  updateOverdueBadge();
}

// Load archived reminders
async function loadArchivedReminders() {
  const container = document.getElementById('archiveContainer');
  
  try {
    const result = await window.dbAPI.getArchivedReminders();
    
    if (result.success && result.reminders) {
      const filtered = filterReminders(result.reminders, currentSearchQuery);
      
      if (result.reminders.length === 0) {
        container.innerHTML = '<p class="no-reminders">Архив пуст</p>';
      } else if (filtered.length === 0) {
        container.innerHTML = '<p class="no-reminders">Ничего не найдено в архиве</p>';
      } else {
        container.innerHTML = filtered.map(reminder => createArchivedReminderCard(reminder)).join('');
        attachArchiveEventListeners();
      }
    } else {
      container.innerHTML = '<p class="error">Ошибка загрузки архива</p>';
    }
  } catch (error) {
    console.error('Load archived reminders error:', error);
    container.innerHTML = '<p class="error">Ошибка: ' + error.message + '</p>';
    showMessage('Ошибка загрузки архива', 'error');
  }
}

async function markViewed(id) {
  try {
    const result = await window.dbAPI.markViewed(id);
    if (result.success) {
      await loadReminders();
    }
  } catch (error) {
    console.error('Mark viewed error:', error);
  }
}

// Update overdue badge count
function updateOverdueBadge() {
  const badge = document.getElementById('overdueCount');
  if (!badge) return;
  
  const now = new Date();
  const overdueCount = remindersList.filter(reminder => {
    return new Date(reminder.reminder_time) < now && !reminder.is_viewed;
  }).length;
  
  if (overdueCount > 0) {
    badge.textContent = overdueCount;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// Confirmation dialog
function initializeConfirmDialog() {
  const overlay = document.getElementById('confirmOverlay');
  const cancelBtn = document.getElementById('confirmCancel');
  const okBtn = document.getElementById('confirmOk');

  overlay.addEventListener('click', closeConfirm);
  cancelBtn.addEventListener('click', closeConfirm);
  okBtn.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });
}

function showConfirm(title, message, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = callback;
  document.getElementById('confirmDialog').classList.add('active');
}

function closeConfirm() {
  document.getElementById('confirmDialog').classList.remove('active');
  confirmCallback = null;
}

// Clear Archive Button
function initializeClearArchiveButton() {
  const clearArchiveBtn = document.getElementById('clearArchiveBtn');
  
  if (clearArchiveBtn) {
    clearArchiveBtn.addEventListener('click', () => {
      showConfirm('Очистить архив?', 'Все архивные напоминания будут удалены навсегда. Это действие нельзя отменить.', async () => {
        try {
          const result = await window.dbAPI.clearArchive();
          if (result.success) {
            showMessage('Архив очищен', 'success');
            await loadArchivedReminders();
          } else {
            showMessage('Ошибка при очистке архива: ' + result.message, 'error');
          }
        } catch (error) {
          console.error('Clear archive error:', error);
          showMessage('Ошибка при очистке архива', 'error');
        }
      });
    });
  }
}

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  
  if (!searchInput || !clearBtn) return;
  
  // Debounced search handler
  const debouncedSearch = debounce((query) => {
    currentSearchQuery = query.toLowerCase().trim();
    
    // Show/hide clear button
    if (currentSearchQuery) {
      clearBtn.style.display = 'flex';
    } else {
      clearBtn.style.display = 'none';
    }
    
    // Reload current tab with search
    if (currentTab === 'reminders') {
      loadReminders();
    } else if (currentTab === 'archive') {
      loadArchivedReminders();
    }
  }, 300);
  
  // Input event
  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
  
  // Clear button
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearBtn.style.display = 'none';
    
    if (currentTab === 'reminders') {
      loadReminders();
    } else if (currentTab === 'archive') {
      loadArchivedReminders();
    }
  });
  
  // Clear on Escape key
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      currentSearchQuery = '';
      clearBtn.style.display = 'none';
      
      if (currentTab === 'reminders') {
        loadReminders();
      } else if (currentTab === 'archive') {
        loadArchivedReminders();
      }
    }
  });
}

// Debounce helper
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Filter reminders by search query
function filterReminders(reminders, query) {
  if (!query) return reminders;
  
  return reminders.filter(reminder => {
    const titleMatch = reminder.title.toLowerCase().includes(query);
    const textMatch = reminder.text && reminder.text.toLowerCase().includes(query);
    return titleMatch || textMatch;
  });
}

// Helper functions
function showMessage(message, type = 'info') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Сегодня в ${timeStr}`;
  } else if (isTomorrow) {
    return `Завтра в ${timeStr}`;
  } else {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

function createReminderCard(reminder) {
  const isOverdue = new Date(reminder.reminder_time) < new Date() && !reminder.is_viewed;
  const dateStr = formatDateTime(reminder.reminder_time);
  
  return `
    <div class="reminder-card ${reminder.is_pinned ? 'pinned' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${reminder.id}">
      <div class="reminder-card__header">
        <h3 class="reminder-card__title">${escapeHtml(reminder.title)}</h3>
        <div class="reminder-card__actions">
          <button class="btn-icon pin-btn" title="${reminder.is_pinned ? 'Открепить' : 'Закрепить'}">
            ${reminder.is_pinned ? '★' : '☆'}
          </button>
          <button class="btn-icon edit-btn" title="Редактировать">✎</button>
          <button class="btn-icon archive-btn" title="В архив">📥</button>
        </div>
      </div>
      <div class="reminder-card__time">${dateStr}</div>
      ${reminder.text ? `<div class="reminder-card__text">${escapeHtml(reminder.text)}</div>` : ''}
      ${reminder.is_shown && !reminder.is_viewed ? `
        <div class="reminder-card__footer">
          <button class="btn btn-small btn-primary view-btn">Закрыть напоминание</button>
        </div>
      ` : ''}
    </div>
  `;
}

function createArchivedReminderCard(reminder) {
  const dateStr = formatDateTime(reminder.reminder_time);
  
  return `
    <div class="reminder-card archived" data-id="${reminder.id}">
      <div class="reminder-card__header">
        <h3 class="reminder-card__title">${escapeHtml(reminder.title)}</h3>
        <div class="reminder-card__actions">
          <button class="btn-icon restore-btn" title="Восстановить">↺</button>
          <button class="btn-icon delete-btn" title="Удалить навсегда">🗑</button>
        </div>
      </div>
      <div class="reminder-card__time">${dateStr}</div>
      ${reminder.text ? `<div class="reminder-card__text">${escapeHtml(reminder.text)}</div>` : ''}
    </div>
  `;
}

function attachReminderEventListeners() {
  document.querySelectorAll('.reminder-card:not(.archived)').forEach(card => {
    const id = parseInt(card.dataset.id);
    
    // Pin
    card.querySelector('.pin-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.dbAPI.togglePin(id);
      await loadReminders();
    });
    
    // Edit
    card.querySelector('.edit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const reminder = remindersList.find(r => r.id === id);
      if (reminder) {
        openEditModal(reminder);
      }
    });
    
    // Archive
    card.querySelector('.archive-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.dbAPI.archiveReminder(id);
      await loadReminders();
    });
    
    // Mark Viewed
    card.querySelector('.view-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await markViewed(id);
    });
  });
}

function attachArchiveEventListeners() {
  document.querySelectorAll('.reminder-card.archived').forEach(card => {
    const id = parseInt(card.dataset.id);
    
    // Restore
    card.querySelector('.restore-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.dbAPI.restoreReminder(id);
      await loadArchivedReminders();
    });
    
    // Delete
    card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirm('Удалить напоминание?', 'Это действие нельзя отменить.', async () => {
        await window.dbAPI.deleteReminder(id);
        await loadArchivedReminders();
      });
    });
  });
}