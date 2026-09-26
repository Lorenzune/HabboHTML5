import { app, BrowserWindow, Menu, ipcMain, session } from 'electron';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  canUseDeveloperTools,
  createNativeRemoteOrigins,
  isAllowedNativeRemoteRequest,
  isDeveloperToolsShortcut,
  parseNativeSession,
} from './Session.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const entry = pathToFileURL(path.join(root, 'client/habbo-air/index.html')).href;
let window;

app.setName('Habbo Classic');
app.on('window-all-closed', () => app.quit());

export async function startNativeClient() {
  const hotels = JSON.parse(await readFile(path.join(root, 'Hotels.json'), 'utf8'));
  const login = parseNativeSession(process.argv.slice(app.isPackaged ? 1 : 2), hotels);
  const developerToolsEnabled = canUseDeveloperTools(login.server);
  await app.whenReady();
  Menu.setApplicationMenu(null);

  const clientSession = session.fromPartition('persist:classic');
  const isNativeClipboardRequest = (contents, permission, requestingUrl, isMainFrame) =>
    contents === window?.webContents &&
    isMainFrame &&
    requestingUrl === entry &&
    ['clipboard-read', 'clipboard-sanitized-write'].includes(permission);
  clientSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    callback(isNativeClipboardRequest(contents, permission, details.requestingUrl, details.isMainFrame));
  });
  clientSession.setPermissionCheckHandler((contents, permission, _requestingOrigin, details) =>
    isNativeClipboardRequest(contents, permission, details.requestingUrl, details.isMainFrame));
  clientSession.on('will-download', (event) => event.preventDefault());
  const payloadPrefix = pathToFileURL(path.join(root, 'client') + path.sep).href;
  const remoteOrigins = createNativeRemoteOrigins(login.websiteUrl, login.websocketUrl);

  clientSession.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    const local = url.protocol === 'file:' && url.href.startsWith(payloadPrefix);
    const data = ['data:', 'blob:'].includes(url.protocol);
    const developerTools = developerToolsEnabled && url.protocol === 'devtools:';
    const remote = isAllowedNativeRemoteRequest(details.url, details.resourceType, remoteOrigins);
    const cancel = !(local || data || developerTools || remote);

    if (url.protocol !== 'devtools:' && !url.href.startsWith('data:')) {
      const type = (details.resourceType || 'other').toUpperCase();
      const statusTag = cancel ? '[BLOCKED]' : '[OK]';
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] ${statusTag} [${details.method}] (${type}) ${details.url}`);
    }

    callback({ cancel });
  });

  clientSession.webRequest.onCompleted((details) => {
    if (details.url.startsWith('http') || details.url.startsWith('ws')) {
      const time = new Date().toLocaleTimeString();
      console.log(`[${time}] [RESP ${details.statusCode}] ${details.url}`);
    }
  });

  clientSession.webRequest.onErrorOccurred((details) => {
    if (details.url.startsWith('http') || details.url.startsWith('ws')) {
      const time = new Date().toLocaleTimeString();
      console.error(`[${time}] [ERR ${details.error}] ${details.url}`);
    }
  });

  ipcMain.on('classic-session', (event) => {
    event.returnValue = event.sender === window?.webContents && event.senderFrame === event.sender.mainFrame &&
      event.senderFrame.url === entry ? login : null;
  });
  window = new BrowserWindow({
    title: 'Habbo', width: 1465, height: 768, show: false, autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      session: clientSession, preload: path.join(root, 'Preload.cjs'),
      nodeIntegration: false, contextIsolation: true, sandbox: true, webviewTag: false,
      webSecurity: false, allowRunningInsecureContent: true,
      backgroundThrottling: false, spellcheck: false,
      devTools: developerToolsEnabled,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== entry) event.preventDefault();
  });
  window.webContents.on('will-redirect', (event) => event.preventDefault());
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());
  window.webContents.on('render-process-gone', () => app.exit(1));
  window.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER:${level}] ${message} (${sourceId}:${line})`);
  });
  await window.loadURL(entry);
  window.maximize();
  window.show();
  if (developerToolsEnabled) {
    window.webContents.openDevTools({ mode: 'right' });
    window.webContents.on('before-input-event', (event, input) => {
      if (isDeveloperToolsShortcut(input, process.platform)) {
        event.preventDefault();
        window.webContents.toggleDevTools();
      }
    });
  }
  return window;
}

export const nativeClientReady = startNativeClient().catch((error) => {
  console.error(error.message);
  app.exit(1);
  throw error;
});
