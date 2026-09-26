const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__HABBO_AIR_HOST_MODE__', 'electron');
contextBridge.exposeInMainWorld('__HABBO_CLASSIC_SESSION__', ipcRenderer.sendSync('classic-session'));
