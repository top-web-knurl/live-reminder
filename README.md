# Live Reminder — Напоминалка

Десктопное приложение-напоминальщик для оптимизации рабочего времени. Построено на Electron.

## Возможности

- Создание и редактирование напоминаний с датой и временем
- Архивирование и восстановление напоминаний
- Закрепление напоминаний (автоповтор каждые 15 минут)
- Поиск по напоминаниям
- Бейдж в трее и на таскбаре с количеством непросмотренных
- Системные уведомления

## Стек

- **Electron 39** + **Electron Forge 7**
- **SQLite3** (локальная БД)
- **Vanilla JS** + HTML + CSS

## Быстрый старт

```bash
npm install
npm start
```

## Команды

| Команда | Описание |
|---|---|
| `npm start` | Запуск в dev режиме |
| `npm run package` | Сборка в папку `out/` |
| `npm run make` | Создание инсталлятора |

## Структура проекта

```
main.js           → Main process (окно, треей, IPC, уведомления)
preload.js        → Мост IPC (window.dbAPI)
renderer.js       → Логика UI (vanilla JS)
index.html        → Разметка
style.css         → Стили
src/db.js         → SQLite запросы
src/reminders.js  → Обёртка над БД
assets/           → Иконки
forge.config.js   → Конфиг Electron Forge
```

## Архитектура

Renderer (browser) не имеет доступа к Node.js. Вся коммуникация с БД идёт через IPC:

```
renderer.js → window.dbAPI.* → ipcRenderer.invoke() → ipcMain.handle() → src/reminders.js → src/db.js → SQLite
```

БД хранится в `app.getPath('userData')/reminders.db`.

## Лицензия

ISC
