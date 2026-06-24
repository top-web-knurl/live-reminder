// Global state
let currentTab = 'reminders';
let editingReminderId = null;
let confirmCallback = null;
let remindersList = [];
let templatesList = [];
let currentSearchQuery = '';
let editingTemplateId = null;
let currentEditorTarget = 'reminder';

const ICONS = {
  pin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11l-4 4h14l-4-4"/><path d="M15 3.5L9.5 9 15 11l-3 3"/></svg>',
  pinFilled: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 11l-4 4h14l-4-4"/><path d="M15 3.5L9.5 9 15 11l-3 3"/></svg>',
  star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFilled: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  archive: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  restore: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
  checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
  eyeOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
  code: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  braces: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Page loaded, initializing...');
  initializeTabSwitching();
  initializeModal();
  initializeTemplateModal();
  initializeEditor();
  initializeCodeBlockModal();
  initializeConfirmDialog();
  initializeClearArchiveButton();
  initializeSearch();
  initializeThemeToggle();
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
  } else if (tab === 'templates') {
    document.getElementById('templatesTab').classList.add('active');
    await loadTemplates();
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
  document.getElementById('reminderText').innerHTML = '';
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
  document.getElementById('reminderText').innerHTML = reminder.text || '';
  
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
  document.getElementById('reminderText').innerHTML = '';
  editingReminderId = null;
}

// Template Modal
function initializeTemplateModal() {
  const openBtn = document.getElementById('openTemplateModalBtn');
  const closeBtn = document.getElementById('closeTemplateModalBtn');
  const cancelBtn = document.getElementById('cancelTemplateBtn');
  const overlay = document.getElementById('templateModalOverlay');
  const form = document.getElementById('templateForm');

  openBtn.addEventListener('click', () => openCreateTemplateModal());
  closeBtn.addEventListener('click', closeTemplateModal);
  cancelBtn.addEventListener('click', closeTemplateModal);
  overlay.addEventListener('click', closeTemplateModal);
  form.addEventListener('submit', handleTemplateSubmit);
}

function openCreateTemplateModal() {
  editingTemplateId = null;
  document.getElementById('templateModalTitle').textContent = 'Новый шаблон';
  document.getElementById('saveTemplateBtn').textContent = 'Сохранить';
  document.getElementById('templateForm').reset();
  document.getElementById('templateText').innerHTML = '';
  document.getElementById('templateId').value = '';
  document.getElementById('templateModal').classList.add('active');
}

function openEditTemplateModal(template) {
  editingTemplateId = template.id;
  document.getElementById('templateModalTitle').textContent = 'Редактировать шаблон';
  document.getElementById('saveTemplateBtn').textContent = 'Обновить';
  document.getElementById('templateId').value = template.id;
  document.getElementById('templateTitle').value = template.title;
  document.getElementById('templateText').innerHTML = template.text || '';
  document.getElementById('templateModal').classList.add('active');
}

function closeTemplateModal() {
  document.getElementById('templateModal').classList.remove('active');
  document.getElementById('templateForm').reset();
  document.getElementById('templateText').innerHTML = '';
  editingTemplateId = null;
}

async function handleTemplateSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('templateTitle').value.trim();
  const editorEl = document.getElementById('templateText');
  const html = editorEl.innerHTML.trim();
  const text = (!html || html === '<br>' || html === '<p><br></p>') ? '' : html;

  if (!title) {
    showMessage('Введите название шаблона', 'error');
    return;
  }

  try {
    let result;
    if (editingTemplateId) {
      result = await window.dbAPI.updateTemplate(editingTemplateId, title, text);
    } else {
      result = await window.dbAPI.addTemplate(title, text);
    }

    if (result.success) {
      showMessage(editingTemplateId ? 'Шаблон обновлён!' : 'Шаблон создан!', 'success');
      closeTemplateModal();
      await loadTemplates();
    } else {
      showMessage('Ошибка: ' + result.message, 'error');
    }
  } catch (error) {
    console.error('Error saving template:', error);
    showMessage('Ошибка: ' + error.message, 'error');
  }
}

async function loadTemplates() {
  const container = document.getElementById('templatesContainer');
  
  try {
    const result = await window.dbAPI.getAllTemplates();
    
    if (result.success && result.templates) {
      templatesList = result.templates;
      const filtered = filterReminders(templatesList, currentSearchQuery);
      
      if (templatesList.length === 0) {
        container.innerHTML = '<p class="no-reminders">Нет шаблонов. Создайте первый!</p>';
      } else if (filtered.length === 0) {
        container.innerHTML = '<p class="no-reminders">Ничего не найдено</p>';
      } else {
        container.innerHTML = filtered.map(t => createTemplateCard(t)).join('');
        applySyntaxHighlighting(container);
        attachTemplateEventListeners();
      }
    } else {
      container.innerHTML = '<p class="error">Ошибка загрузки</p>';
    }
  } catch (error) {
    console.error('Load templates error:', error);
    container.innerHTML = '<p class="error">Ошибка: ' + error.message + '</p>';
  }
}

function createTemplateCard(template) {
  const dateStr = template.created_at ? formatDateTime(template.created_at) : '';
  
  return `
    <div class="reminder-card ${template.is_pinned ? 'pinned' : ''}" data-id="${template.id}">
      <div class="reminder-card__header">
        <h3 class="reminder-card__title">${escapeHtml(template.title)}</h3>
        <div class="reminder-card__actions">
          <button class="btn-icon pin-btn" title="${template.is_pinned ? 'Открепить' : 'Закрепить'}">
            ${template.is_pinned ? ICONS.starFilled : ICONS.star}
          </button>
          <button class="btn-icon edit-btn" title="Редактировать">${ICONS.edit}</button>
          <button class="btn-icon delete-btn" title="Удалить">${ICONS.trash}</button>
        </div>
      </div>
      ${dateStr ? `<div class="reminder-card__time">${dateStr}</div>` : ''}
      ${template.text ? `<div class="reminder-card__text">${template.text}</div>` : ''}
    </div>
  `;
}

function attachTemplateEventListeners() {
  document.querySelectorAll('#templatesContainer .reminder-card').forEach(card => {
    const id = parseInt(card.dataset.id);
    
    card.querySelector('.pin-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.dbAPI.toggleTemplatePin(id);
      await loadTemplates();
    });
    
    card.querySelector('.edit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const template = templatesList.find(t => t.id === id);
      if (template) {
        openEditTemplateModal(template);
      }
    });
    
    card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirm('Удалить шаблон?', 'Это действие нельзя отменить.', async () => {
        await window.dbAPI.deleteTemplate(id);
        await loadTemplates();
      });
    });
  });
}

// Handle form submission
async function handleReminderSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('reminderTitle').value.trim();
  const text = getEditorContent();
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
        applySyntaxHighlighting(container);
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
        applySyntaxHighlighting(container);
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
    } else if (currentTab === 'templates') {
      loadTemplates();
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
    } else if (currentTab === 'templates') {
      loadTemplates();
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
      } else if (currentTab === 'templates') {
        loadTemplates();
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

function initializeThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.innerHTML = theme === 'light' ? ICONS.moon : ICONS.sun;
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
            ${reminder.is_pinned ? ICONS.starFilled : ICONS.star}
          </button>
          <button class="btn-icon edit-btn" title="Редактировать">${ICONS.edit}</button>
          <button class="btn-icon archive-btn" title="В архив">${ICONS.archive}</button>
        </div>
      </div>
      <div class="reminder-card__time">${dateStr}</div>
      ${reminder.text ? `<div class="reminder-card__text">${reminder.text}</div>` : ''}
      ${!reminder.is_viewed && (isOverdue || reminder.is_shown) ? `
        <div class="reminder-card__footer">
          <button class="btn btn-small btn-primary view-btn">${ICONS.checkCircle} Закрыть</button>
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
          <button class="btn-icon restore-btn" title="Восстановить">${ICONS.restore}</button>
          <button class="btn-icon delete-btn" title="Удалить навсегда">${ICONS.trash}</button>
        </div>
      </div>
      <div class="reminder-card__time">${dateStr}</div>
      ${reminder.text ? `<div class="reminder-card__text">${reminder.text}</div>` : ''}
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
    
    card.querySelector('.restore-btn')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await window.dbAPI.restoreReminder(id);
      await loadArchivedReminders();
    });
    
    card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirm('Удалить напоминание?', 'Это действие нельзя отменить.', async () => {
        await window.dbAPI.deleteReminder(id);
        await loadArchivedReminders();
      });
    });
  });
}

function initializeEditor() {
  const toolbar = document.getElementById('editorToolbar');
  const editor = document.getElementById('reminderText');
  
  if (!toolbar || !editor) return;
  
  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.toolbar-btn');
    if (!btn) return;
    
    const command = btn.dataset.command;
    const value = btn.dataset.value || null;
    currentEditorTarget = 'reminder';
    editor.focus();
    
    if (command === 'insertCode') {
      insertInlineCode();
    } else if (command === 'insertCodeBlock') {
      openCodeBlockModal();
    } else if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, value);
    } else {
      document.execCommand(command, false, value);
    }
    
    updateToolbarState();
  });
  
  editor.addEventListener('keyup', updateToolbarState);
  editor.addEventListener('mouseup', updateToolbarState);
  
  editor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });
  
  editor.addEventListener('blur', () => {
    if (editor.innerHTML === '<br>') {
      editor.innerHTML = '';
    }
  });

  const templateToolbar = document.getElementById('templateEditorToolbar');
  const templateEditor = document.getElementById('templateText');
  
  if (!templateToolbar || !templateEditor) return;
  
  templateToolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.toolbar-btn');
    if (!btn) return;
    
    const command = btn.dataset.command;
    const value = btn.dataset.value || null;
    currentEditorTarget = 'template';
    templateEditor.focus();
    
    if (command === 'insertCode') {
      insertInlineCode();
    } else if (command === 'insertCodeBlock') {
      openCodeBlockModal();
    } else if (command === 'formatBlock') {
      document.execCommand('formatBlock', false, value);
    } else {
      document.execCommand(command, false, value);
    }
    
    updateToolbarState();
  });
  
  templateEditor.addEventListener('keyup', updateToolbarState);
  templateEditor.addEventListener('mouseup', updateToolbarState);
  
  templateEditor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  });
  
  templateEditor.addEventListener('blur', () => {
    if (templateEditor.innerHTML === '<br>') {
      templateEditor.innerHTML = '';
    }
  });
}

function updateToolbarState() {
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    const command = btn.dataset.command;
    if (command === 'bold') {
      btn.classList.toggle('active', document.queryCommandState('bold'));
    } else if (command === 'italic') {
      btn.classList.toggle('active', document.queryCommandState('italic'));
    } else if (command === 'underline') {
      btn.classList.toggle('active', document.queryCommandState('underline'));
    } else if (command === 'strikeThrough') {
      btn.classList.toggle('active', document.queryCommandState('strikeThrough'));
    } else if (command === 'insertUnorderedList') {
      btn.classList.toggle('active', document.queryCommandState('insertUnorderedList'));
    } else if (command === 'insertOrderedList') {
      btn.classList.toggle('active', document.queryCommandState('insertOrderedList'));
    }
  });
}

function insertInlineCode() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  
  if (selectedText) {
    const code = document.createElement('code');
    code.textContent = selectedText;
    range.deleteContents();
    range.insertNode(code);
    
    range.setStartAfter(code);
    range.setEndAfter(code);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    const code = document.createElement('code');
    code.textContent = 'код';
    range.insertNode(code);
    
    range.setStart(code.firstChild, 0);
    range.setEnd(code.firstChild, 3);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

let savedCodeRange = null;

function openCodeBlockModal() {
  const selection = window.getSelection();
  if (selection.rangeCount) {
    savedCodeRange = selection.getRangeAt(0).cloneRange();
  }
  
  document.getElementById('codeBlockModal').classList.add('active');
  document.getElementById('codeContent').value = '';
  document.getElementById('codeLanguage').value = '';
  document.getElementById('codeContent').focus();
}

function closeCodeBlockModal() {
  document.getElementById('codeBlockModal').classList.remove('active');
  savedCodeRange = null;
}

function insertCodeBlockFromModal() {
  const code = document.getElementById('codeContent').value;
  const language = document.getElementById('codeLanguage').value;
  
  if (!code.trim()) {
    closeCodeBlockModal();
    return;
  }
  
  const editorId = currentEditorTarget === 'template' ? 'templateText' : 'reminderText';
  const editor = document.getElementById(editorId);
  editor.focus();
  
  if (savedCodeRange) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedCodeRange);
  }
  
  const pre = document.createElement('pre');
  const codeEl = document.createElement('code');
  if (language) {
    codeEl.className = `language-${language}`;
  }
  codeEl.textContent = code;
  pre.appendChild(codeEl);
  
  const range = window.getSelection().getRangeAt(0);
  range.deleteContents();
  range.insertNode(pre);
  
  range.setStartAfter(pre);
  range.setEndAfter(pre);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  
  closeCodeBlockModal();
}

function initializeCodeBlockModal() {
  document.getElementById('closeCodeBlockBtn').addEventListener('click', closeCodeBlockModal);
  document.getElementById('codeBlockOverlay').addEventListener('click', closeCodeBlockModal);
  document.getElementById('cancelCodeBlockBtn').addEventListener('click', closeCodeBlockModal);
  document.getElementById('insertCodeBlockBtn').addEventListener('click', insertCodeBlockFromModal);
  
  document.getElementById('codeContent').addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  });
}

function getEditorContent() {
  const editor = document.getElementById('reminderText');
  const html = editor.innerHTML.trim();
  
  if (!html || html === '<br>' || html === '<p><br></p>') {
    return '';
  }
  
  return html;
}

function highlightCode(code, language) {
  if (!language || language === 'plaintext') {
    return escapeHtml(code);
  }
  
  let escaped = escapeHtml(code);
  
  if (language === 'javascript' || language === 'js') {
    escaped = highlightJS(escaped);
  } else if (language === 'python' || language === 'py') {
    escaped = highlightPython(escaped);
  } else if (language === 'html') {
    escaped = highlightHTML(escaped);
  } else if (language === 'css') {
    escaped = highlightCSS(escaped);
  } else if (language === 'json') {
    escaped = highlightJSON(escaped);
  } else if (language === 'sql') {
    escaped = highlightSQL(escaped);
  } else if (language === 'bash' || language === 'shell') {
    escaped = highlightBash(escaped);
  }
  
  return escaped;
}

function highlightJS(code) {
  code = code.replace(/(\/\/.*$)/gm, '<span class="token comment">$1</span>');
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
  code = code.replace(/(&#39;(?:[^&#39;]|\\.)*&#39;|&quot;(?:[^&quot;]|\\.)*&quot;|`(?:[^`]|\\.)*`)/g, '<span class="token string">$1</span>');
  code = code.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/gi, '<span class="token number">$1</span>');
  const keywords = ['async','await','break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','finally','for','from','function','if','import','in','instanceof','let','new','of','return','super','switch','this','throw','try','typeof','var','void','while','with','yield'];
  code = code.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="token keyword">$1</span>');
  const builtins = ['console','document','window','Math','JSON','Promise','Array','Object','String','Number','Boolean','Date','RegExp','Error','null','undefined','true','false','NaN','Infinity'];
  code = code.replace(new RegExp(`\\b(${builtins.join('|')})\\b`, 'g'), '<span class="token builtin">$1</span>');
  return code;
}

function highlightPython(code) {
  code = code.replace(/(#.*$)/gm, '<span class="token comment">$1</span>');
  code = code.replace(/(&#39;&#39;&#39;[\s\S]*?&#39;&#39;&#39;|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, '<span class="token comment">$1</span>');
  code = code.replace(/(&#39;(?:[^&#39;]|\\.)*&#39;|&quot;(?:[^&quot;]|\\.)*&quot;)/g, '<span class="token string">$1</span>');
  code = code.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/gi, '<span class="token number">$1</span>');
  const keywords = ['and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield'];
  code = code.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="token keyword">$1</span>');
  const builtins = ['True','False','None','print','range','len','int','str','float','list','dict','set','tuple','type','self'];
  code = code.replace(new RegExp(`\\b(${builtins.join('|')})\\b`, 'g'), '<span class="token builtin">$1</span>');
  return code;
}

function highlightHTML(code) {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const commentStart = code.indexOf('&lt;!--', i);
    const tagStart = code.indexOf('&lt;', i);

    if (commentStart !== -1 && (tagStart === -1 || commentStart <= tagStart)) {
      result += code.substring(i, commentStart);
      const commentEnd = code.indexOf('--&gt;', commentStart + 7);
      if (commentEnd === -1) {
        result += '<span class="token comment">' + code.substring(commentStart) + '</span>';
        return result;
      }
      result += '<span class="token comment">' + code.substring(commentStart, commentEnd + 6) + '</span>';
      i = commentEnd + 6;
      continue;
    }

    if (tagStart !== -1) {
      result += code.substring(i, tagStart);
      const tagEnd = code.indexOf('&gt;', tagStart + 4);
      if (tagEnd === -1) {
        result += code.substring(tagStart);
        return result;
      }
      const inner = code.substring(tagStart + 4, tagEnd);
      result += highlightHTMLTag(inner);
      i = tagEnd + 4;
      continue;
    }

    result += code.substring(i);
    return result;
  }

  return result;
}

function highlightHTMLTag(inner) {
  let isClosing = inner.startsWith('/');
  let rest = isClosing ? inner.substring(1) : inner;
  const tagMatch = rest.match(/^([\w-]+)([\s\S]*)/);
  if (!tagMatch) return '<span class="token tag">&lt;' + inner + '&gt;</span>';

  const tagName = tagMatch[1];
  let attrs = tagMatch[2];
  let highlighted = '&lt;' + (isClosing ? '/' : '');
  highlighted += '<span class="token tag">' + tagName + '</span>';

  const attrRegex = /([\w-]+)(=)(&quot;[^&quot;]*&quot;|&#39;[^&#39;]*&#39;)/g;
  let lastIdx = 0;
  let attrResult = '';
  let m;
  while ((m = attrRegex.exec(attrs)) !== null) {
    attrResult += attrs.substring(lastIdx, m.index);
    attrResult += '<span class="token attr-name">' + m[1] + '</span>=';
    attrResult += '<span class="token string">' + m[3] + '</span>';
    lastIdx = attrRegex.lastIndex;
  }
  attrResult += attrs.substring(lastIdx);

  highlighted += attrResult + '&gt;';
  return highlighted;
}

function highlightCSS(code) {
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
  code = code.replace(/(&#39;(?:[^&#39;]|\\.)*&#39;|&quot;(?:[^&quot;]|\\.)*&quot;)/g, '<span class="token string">$1</span>');
  code = code.replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="token number">$1</span>');
  code = code.replace(/\b(\d+\.?\d*(?:px|em|rem|%|vh|vw|s|ms)?)\b/g, '<span class="token number">$1</span>');
  code = code.replace(/(:[\w-]+(?=\s*\{))/g, '<span class="token keyword">$1</span>');
  code = code.replace(/\b([\w-]+)(?=\s*:)/g, '<span class="token property">$1</span>');
  return code;
}

function highlightJSON(code) {
  code = code.replace(/(&quot;(?:[^&quot;]|\\.)*&quot;)\s*(?=:)/g, '<span class="token property">$1</span>');
  code = code.replace(/:(\s*)&quot;(?:[^&quot;]|\\.)*&quot;/g, ':$1<span class="token string">$&</span>');
  code = code.replace(/\b(true|false|null)\b/g, '<span class="token keyword">$1</span>');
  code = code.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/gi, '<span class="token number">$1</span>');
  return code;
}

function highlightSQL(code) {
  code = code.replace(/(--.*$)/gm, '<span class="token comment">$1</span>');
  code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
  code = code.replace(/(&#39;(?:[^&#39;]|\\.)*&#39;)/g, '<span class="token string">$1</span>');
  code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="token number">$1</span>');
  const keywords = ['SELECT','FROM','WHERE','INSERT','INTO','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','INDEX','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AND','OR','NOT','IN','IS','NULL','LIKE','BETWEEN','EXISTS','HAVING','GROUP','BY','ORDER','ASC','DESC','LIMIT','OFFSET','AS','DISTINCT','COUNT','SUM','AVG','MAX','MIN','CASE','WHEN','THEN','ELSE','END','PRIMARY','KEY','FOREIGN','REFERENCES','CONSTRAINT','DEFAULT','AUTO_INCREMENT','INTEGER','TEXT','VARCHAR','BOOLEAN','DATE','DATETIME','TIMESTAMP'];
  code = code.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi'), '<span class="token keyword">$1</span>');
  return code;
}

function highlightBash(code) {
  code = code.replace(/(#.*$)/gm, '<span class="token comment">$1</span>');
  code = code.replace(/(&#39;(?:[^&#39;]|\\.)*&#39;|&quot;(?:[^&quot;]|\\.)*&quot;)/g, '<span class="token string">$1</span>');
  code = code.replace(/\b(\d+)\b/g, '<span class="token number">$1</span>');
  const keywords = ['if','then','else','elif','fi','for','do','done','while','until','case','esac','function','return','exit','export','source','alias','unalias','cd','ls','grep','awk','sed','find','sort','uniq','wc','cat','echo','mkdir','rm','cp','mv','chmod','chown','sudo','apt','npm','git','docker'];
  code = code.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="token keyword">$1</span>');
  code = code.replace(/(\$\w+)/g, '<span class="token variable">$1</span>');
  return code;
}

function applySyntaxHighlighting(container) {
  container.querySelectorAll('pre code[class^="language-"]').forEach(codeEl => {
    const lang = codeEl.className.replace('language-', '');
    const originalCode = codeEl.textContent;
    codeEl.innerHTML = highlightCode(originalCode, lang);
  });
}