const {
  contextBridge, ipcRenderer
} = require('electron')

// contextBridge.exposeInMainWorld('api', {
//   test: (data) => ipcRenderer.invoke('test', data)
// });