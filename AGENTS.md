# AGENTS.md — Инструкция для AI-ассистентов

## Краткое описание проекта

**Live Reminder** ("Напоминалка") — десктопное приложение-напоминальщик для оптимизации рабочего времени. Построено на **Electron** (несмотря на папку `tauri/` в пути — это чистый Electron-проект).

## Стек технологий

| Компонент | Технология |
|---|---|
| Рантайм | Electron 39.x |
| Сборка/пакетирование | Electron Forge 7.x |
| БД | SQLite3 (`sqlite3` npm пакет) |
| Трей-иконка (badge) | `canvas` npm пакет (рисование бейджей программно) |
| Frontend | Vanilla JS + HTML + CSS (без фреймворков) |
| Безопасность | Context Isolation + Preload script, CSP заголовки |

## Архитектура

```
┌─────────────────────────────────────────────┐
│  Main Process (main.js)                     │
│  ├── IPC handlers (ipcMain.handle)          │
│  ├── Tray + Badge (nativeImage + canvas)    │
│  ├── Notification scheduling (setTimeout)   │
│  └── App lifecycle (createWindow, quit)     │
├─────────────────────────────────────────────┤
│  preload.js                                 │
│  └── contextBridge → window.dbAPI           │
├─────────────────────────────────────────────┤
│  Renderer Process (renderer.js + index.html)│
│  ├── Vanilla JS DOM манипуляции             │
│  ├── UI: табы (Напоминания / Шаблоны / Архив) │
│  ├── Модалки создания/редактирования        │
│  └── CRUD через window.dbAPI.*              │
└─────────────────────────────────────────────┘
         ↕ IPC (invoke/handle)
┌─────────────────────────────────────────────┐
│  src/reminders.js  (обёртка над db.js)      │
│  src/db.js         (SQLite запросы)         │
│  └── БД: reminders.db в userData папке      │
└─────────────────────────────────────────────┘
```

## Структура файлов

```
├── main.js              # Main process: окно, треей, IPC, уведомления
├── preload.js           # Мост IPC → renderer (window.dbAPI)
├── renderer.js          # Вся логика UI + редактор (~620 строк, vanilla JS)
├── index.html           # Разметка приложения + тулбар редактора
├── style.css            # Стили + редактор (~830 строк, CSS переменные)
├── forge.config.js      # Конфиг Electron Forge (мейкеры, fuses)
├── package.json         # Зависимости и скрипты
├── src/
│   ├── db.js            # SQLite: инициализация, CRUD, миграции
│   ├── reminders.js     # Обёртка: ленивая инициализация БД + делегирование
│   └── bd/              # Пустая папка (артефакт)
├── assets/
│   ├── icon.png         # Иконка приложения и трея
│   └── reservicon.jpeg  # Резервная иконка
└── out/                 # Собранные билды (не коммитить)
```

## Схема БД

### Таблица `reminders`

```sql
CREATE TABLE reminders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  text            TEXT,
  image_path      TEXT,
  reminder_time   DATETIME,
  is_shown        INTEGER DEFAULT 0,   -- было ли показано уведомление
  is_archived     INTEGER DEFAULT 0,   -- в архиве ли
  is_viewed       INTEGER DEFAULT 0,   -- помечено как просмотренное
  is_pinned       INTEGER DEFAULT 0,   -- закреплено ли
  pin_order       INTEGER DEFAULT 0,   -- порядок закрепления
  last_reminded_at DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица `templates`

```sql
CREATE TABLE templates (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  text            TEXT,
  is_pinned       INTEGER DEFAULT 0,
  pin_order       INTEGER DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## IPC API (preload → main)

Все вызовы через `window.dbAPI.*` (renderer) → `ipcMain.handle` (main):

| Метод | Описание |
|---|---|
| `addReminder(title, text, reminderTime)` | Создать напоминание |
| `updateReminder(id, title, text, reminderTime)` | Обновить напоминание |
| `getAllReminders()` | Все активные (не архивные) |
| `archiveReminder(id)` | Архивировать |
| `restoreReminder(id)` | Восстановить из архива |
| `deleteReminder(id)` | Удалить навсегда |
| `clearArchive()` | Очистить весь архив |
| `togglePin(id)` | Закрепить/открепить |
| `markViewed(id)` | Пометить как просмотренное |
| `getArchivedReminders()` | Все архивные |
| `getUnviewedCount()` | Кол-во непросмотренных |
| `addTemplate(title, text)` | Создать шаблон |
| `updateTemplate(id, title, text)` | Обновить шаблон |
| `deleteTemplate(id)` | Удалить шаблон |
| `getAllTemplates()` | Все шаблоны |
| `toggleTemplatePin(id)` | Закрепить/открепить шаблон |

## Ключевые особенности

1. **Трей с бейджем**: иконка в трее рисуется программно через `canvas` — красный кружок с числом непросмотренных.
2. **Рекуррентные напоминания**: закреплённые (`is_pinned`) напоминания повторяются каждые 15 минут.
3. **Планировщик**: работает через `setTimeout` — планирует только следующее по времени напоминание.
4. **Локальная БД**: SQLite хранится в `app.getPath('userData')/reminders.db`.
5. **Миграции**: при инициализации БД проверяются и добавляются недостающие колонки через `ALTER TABLE`.
6. **Редактор описания**: `contenteditable` div с тулбаром — Bold/Italic/Underline/Strikethrough, заголовки, списки, цитаты, разделители, инлайн-код, блоки кода с выбором языка. Подсветка синтаксиса (JS, Python, HTML, CSS, JSON, SQL, Bash). HTML сохраняется в БД (`text` колонка), рендерится напрямую в карточках. Paste handler strip-ит HTML до plain text.
7. **Шаблоны**: отдельная вкладка для хранения фрагментов кода и текста — CRUD, закрепление, поиск, тот же rich-text редактор с подсветкой кода, но без напоминаний/дат.

## Команды

```bash
npm start          # Запуск в dev режиме
npm run package    # Сборка в папку out/
npm run make       # Создание инсталлятора
```

## Правила при работе с кодом

1. **Не добавляй фреймворки** — проект на vanilla JS, не ломай конвенцию.
2. **IPC через preload** — никогда не используй `nodeIntegration: true`, все вызовы через `window.dbAPI`.
3. **БД в main process** — SQLite доступен только из main process, renderer общается через IPC.
4. **CSS переменные** — используй существующие `--primary-color`, `--error-color` и т.д. из `:root`.
5. **Без комментариев в коде** — проект без комментариев, не добавляй.
6. **Бейджи рисуются через `canvas`** — не используй внешние изображения для бейджей.
7. **Не трогай forge.config.js** без необходимости — там настроены fuses безопасности.
8. **Именование**: приложение называется "Напоминалка", `productName` в package.json.
9. **Локализация**: весь UI на русском языке.
10. **Обновляй AGENTS.md** при любых архитектурных изменениях — добавлении IPC методов, колонок БД, новой логики.

## Код-стайл и конвенции

### JavaScript

**Форматирование:**
- Отступы: **2 пробела**, табуляция не используется
- Строка: до ~100 символов (разумный предел, не строгий лимит)
- Пустая строка между функциями/блоками

**Переменные:**
- `const` по умолчанию, `let` только при необходимости переназначения
- `var` не используется нигде
- Именование: `camelCase` для переменных и функций (`reminderTime`, `loadReminders`)
- Булевы: `is_` префикс в БД-колонках (`is_pinned`, `is_viewed`), но `isPinned`/`isViewed` в JS

**Функции:**
- Объявления функций через `function` (не стрелочные) для именованных функций
- Стрелочные `() =>` для коротких колбэков и анонимных функций
- Async/await для асинхронного кода (не `.then()` цепочки)

**Импорты/экспорты:**
- `require()` / `module.exports` (CommonJS, не ESM)
- Деструктуризация при импорте: `const { app, BrowserWindow } = require('electron')`
- Импорты в начале файла, grouped: сначала внешние пакеты, потом локальные модули

**Строки:**
- Одинарные кавычки `'text'`
- Template literals для интерполяции: `` `${variable}` ``
- Экранирование HTML через `escapeHtml()` для title; поле `text` хранит HTML и рендерится напрямую

**Обработка ошибок:**
- `try/catch` в каждом IPC handler и async функции
- `console.error()` с описательным сообщением
- Возврат `{ success: false, message: e.message }` — не throw вверх

**Шаблоны кода:**

IPC handler в main.js:
```js
ipcMain.handle('action-name', async (event, ...args) => {
  try {
    const result = await someFunctionInDB(...args);
    return result;
  } catch (e) {
    console.error('IPC action-name error:', e);
    return { success: false, message: e.message };
  }
});
```

Функция БД в src/db.js:
```js
function actionName(db, id) {
  return new Promise((resolve, reject) => {
    db.run('SQL_QUERY WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error doing something:', err);
        reject(err);
      } else {
        resolve({ success: true, message: 'Done!' });
      }
    });
  });
}
```

Обёртка в src/reminders.js:
```js
async function actionNameInDB(id) {
  const database = getDB();
  return await actionName(database, id);
}
```

### CSS

**Методология: BEM**
- Блок: `.reminder-card`, `.modal`, `.btn`
- Элемент: `.reminder-card__header`, `.reminder-card__title`
- Модификатор: `.reminder-card.pinned`, `.btn-primary`

**CSS-переменные** — определены в `:root` (светлая тема) и `[data-theme="dark"]` (тёмная тема):
```css
/* Светлая тема */
--primary-color: #7C4DFF;      /* основной фиолетовый */
--primary-hover: #651FFF;      /* hover фиолетовый */
--success-color: #4FC3F7;      /* информационный голубой */
--error-color: #f44336;        /* ошибка/опасность красный */
--warning-color: #ff9800;      /* предупреждение оранжевый */
--pin-color: #FF6B9D;          /* закреплённые розовый */
--bg-color: #f5f5f8;           /* фон страницы */
--card-bg: #ffffff;            /* фон карточек */
--text-color: #333;            /* основной текст */
--text-secondary: #666;        /* вторичный текст */
--border-color: #e0e0e6;       /* рамки */
--overlay-color: rgba(0, 0, 0, 0.5); /* оверлей модалок */
--toolbar-bg: #f8f8fa;         /* фон тулбара */
--input-bg: #ffffff;           /* фон инпутов */
--sidebar-hover: #f0f0f5;      /* hover сайдбара */

/* Тёмная тема — все переменные переопределяются через [data-theme="dark"] */
```

**Темы**: Кнопка переключения `.theme-toggle` в хедере. Выбор сохраняется в `localStorage`. Переключение через `data-theme` атрибут на `<html>`. Все элементы используют CSS-переменные для адаптации.

**Layout:** Flexbox для основной раскладки, Grid для форм (`.form-row`).

**Анимации:** CSS transition на hover (0.2s), `@keyframes` для pulse и slideIn.

**Новые стили** добавляются в `style.css` в конец файла, перед существующими блоками по логической группировке.

**Стили редактора** — `.editor`, `.editor-toolbar`, `.toolbar-btn`, `.editor-content`, `.toolbar-separator`. Стили кода в редакторе и карточках: `.editor-content code`, `.editor-content pre`, `.reminder-card__text code`, `.reminder-card__text pre`.

### HTML

- Минималистичная разметка, без лишних обёрток
- CSP meta теги: `default-src 'self'; script-src 'self'`
- Русскоязычные label и placeholder
- `data-*` атрибуты для привязки JS-событий

### Архитектурные паттерны

**Рендеринг карточек** — HTML генерируется в renderer.js через template literals:
```js
function createReminderCard(reminder) {
  return `<div class="reminder-card ..." data-id="${reminder.id}">...</div>`;
}
```
После вставки через `innerHTML` — навешивание обработчиков через `attachReminderEventListeners()`.

**Редактор описания** — `contenteditable` div с тулбаром:
```html
<div class="editor">
  <div class="editor-toolbar" id="editorToolbar">
    <button data-command="bold">B</button>
    <button data-command="italic">I</button>
    <button data-command="underline">U</button>
    <button data-command="strikeThrough">S</button>
    <button data-command="formatBlock" data-value="H2">H</button>
    <button data-command="insertUnorderedList">•</button>
    <button data-command="insertOrderedList">1.</button>
    <button data-command="formatBlock" data-value="BLOCKQUOTE">"</button>
    <button data-command="insertHorizontalRule">—</button>
    <button data-command="insertCode">&lt;/&gt;</button>
    <button data-command="insertCodeBlock">{ }</button>
  </div>
  <div id="reminderText" class="editor-content" contenteditable="true"></div>
</div>
```
Форматирование через `document.execCommand` (работает в Electron Chromium). Код — через `insertInlineCode()` / модалку `openCodeBlockModal()` с выбором языка. Подсветка синтаксиса — `highlightCode()` с функциями для JS/Python/HTML/CSS/JSON/SQL/Bash. Поле `text` в БД хранит HTML. Paste обработчик вставляет только plain text.

**Секции в main.js** разделены комментариями:
```js
// ---------------- SECTION NAME ---------------- //
```

**Состояние renderer.js** — глобальные переменные в начале файла:
```js
let currentTab = 'reminders';
let editingReminderId = null;
let remindersList = [];
let templatesList = [];
let editingTemplateId = null;
let currentEditorTarget = 'reminder';
```

**Поиск** — debounced (300ms), фильтрация на стороне renderer через `filterReminders()`.

### Чек-лист перед коммитом

- [ ] Код без комментариев (кроме секционных разделителей)
- [ ] `require` импорты в начале файла
- [ ] IPC handler возвращает `{ success, message }` объект
- [ ] БД-функция обёрнута в `new Promise()`
- [ ] CSS классы в формате BEM
- [ ] Используются существующие CSS-переменные
- [ ] UI тексты на русском языке
- [ ] Новые IPC-методы добавлены в `preload.js` и `AGENTS.md`
- [ ] Новые колонки БД добавлены в миграцию в `src/db.js`
- [ ] Поле `text` хранит HTML — рендерить через `innerHTML`, title через `escapeHtml()`
- [ ] Поле `text` хранит HTML — рендерить через `innerHTML`, title через `escapeHtml()`
