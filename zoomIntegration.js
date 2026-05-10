const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const storageManager = require('./src/main/storageManager');

const ZOOM_MANAGER_PATH = path.join(__dirname, 'scripts', 'ZoomControlManager', 'ZoomControlManager.exe');

let isSharingWindowOpen = false;
let mainWindowRef = null;

function setupZoomIntegration(mainWin) {
  mainWindowRef = mainWin;
// Listen for explicit Zoom sharing state updates
ipcMain.on('update-zoom-sharing-state', (event, shouldShare) => {
  console.log(`[Zoom] IPC Event Received: shouldShare=${shouldShare}`);
  const mode = storageManager.config ? storageManager.config.zoomMode : 'auto';

  if (shouldShare && !isSharingWindowOpen) {
    startZoomSharing(mode);
  } else if (!shouldShare && isSharingWindowOpen) {
    isSharingWindowOpen = false;
  }
});
}

function startZoomSharing(mode) {
  if (mode === 'off') {
    console.log('[Zoom] Sharing mode is off. Skipping automation.');
    return;
  }

  console.log(`[Zoom] Starting sharing flow (Mode: ${mode})`);
  isSharingWindowOpen = true;

  // Delegate EVERYTHING to C# (Alt+S + Logic)
  // C# will handle: Key Press -> Capture/Monitor -> Window Close
  const proc = spawn(ZOOM_MANAGER_PATH, [`--mode=${mode}`]);

  proc.on('close', (code) => {
    console.log(`[Zoom] Automation finished with code ${code}`);
    isSharingWindowOpen = false;
    if (mainWindowRef) {
      mainWindowRef.webContents.send('zoom-sharing-finished');
    }
  });
}

module.exports = { setupZoomIntegration };
