const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const { getDB } = require('./src/reminders');
const path = require('path');

// Глобальные переменные (чтобы сборщик не удалил ссылки)
let mainWindow = null;
let tray = null;

// Путь к иконке трея (должна быть .ico на Windows, .png на macOS/Linux)
const trayIconPath = path.join(__dirname, 'assets', 'icon.png'); // или .ico


app.whenReady().then(() => {
  createWindow();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // рекомендуется
    }
  });

  mainWindow.loadFile('index.html');

  // Убираем стандартное поведение при закрытии
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      // Если выходим явно — разрешаем закрытие
      mainWindow = null;
    } else {
      // Иначе — сворачиваем в трей
      event.preventDefault();
      mainWindow.hide(); // или mainWindow.minimize(); + hide()
    }
  });

  // Создаём иконку в трее
  createTray();
}

function createTray() {
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Выход',
      click: () => {
        app.quitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Live Reminder');
  tray.setContextMenu(contextMenu);

  // Опционально: показать уведомление при первом запуске
  // tray.displayBalloon({ title: 'Приложение работает', content: 'Свернуто в трей.' }); // только Windows
}

// macOS: если окно закрыто, но приложение всё ещё в трее — можно переоткрыть
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

// Корректный выход из приложения
app.on('before-quit', () => {
  app.quitting = true;
});