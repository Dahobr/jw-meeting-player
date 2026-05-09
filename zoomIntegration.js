const { globalShortcut, app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const storageManager = require('./src/main/storageManager');

let zoomSharingActive = false;
let mainWindowRef = null;

function setupZoomIntegration(mainWin) {
  mainWindowRef = mainWin;

  // Listen for explicit Zoom sharing state updates
  ipcMain.on('update-zoom-sharing-state', (event, isSharing) => {
    const mode = storageManager.config.zoomMode;
    if (mode === 'off') return;

    if (isSharing && !zoomSharingActive) {
      startZoomSharing(mode);
    } else if (!isSharing && zoomSharingActive) {
      stopZoomSharing(mode);
    }
  });
}

function startZoomSharing(mode) {
  console.log(`[Zoom] Starting sharing (Mode: ${mode})`);
  if (mode === 'script') {
    sendZoomShortcut();
  } else if (mode === 'auto') {
    const { spawn } = require('child_process');
    const exePath = path.join(__dirname, 'scripts', 'ZoomControlManager', 'ZoomControlManager.exe');
    
    console.log(`[Zoom] Spawning monitor: ${exePath}`);
    const monitor = spawn(exePath, ['--mode=monitor-share']);

    monitor.on('error', (err) => {
      console.error(`[Zoom] [CRITICAL] Failed to start monitor: ${err.message}`);
    });

    monitor.stderr.on('data', (data) => {
      console.error(`[Zoom] Monitor Error Output: ${data}`);
    });

    monitor.on('close', (code) => {
      console.log(`[Zoom] Monitor finished with code ${code}`);
      zoomSharingActive = false;
      if (mainWindowRef) {
        mainWindowRef.webContents.send('zoom-sharing-finished');
      }
    });
  } else {
    console.log(`[Zoom] Unknown mode: ${mode}`);
  }
  zoomSharingActive = true;
}

function stopZoomSharing(mode) {
  console.log(`[Zoom] Stopping sharing (Mode: ${mode})`);
  if (mode === 'script') {
    sendZoomShortcut();
  } else if (mode === 'auto') {
    // Already handled by monitor process exit
  }
  zoomSharingActive = false;
}

/**
 * Send Alt+S using the lightweight C# executable (Windows)
 */
function sendZoomShortcut() {
  if (process.platform !== 'win32') {
    console.warn("[Zoom] Script mode is currently only implemented for Windows.");
    return;
  }

  const exePath = path.join(__dirname, 'scripts', 'ZoomKeySender.exe');

  exec(exePath, (error) => {
    if (error) {
      console.error(`[Zoom] KeySender Error: ${error}`);
    } else {
      console.log("[Zoom] Alt+S sent via KeySender.exe.");
    }
  });
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { setupZoomIntegration, unregisterShortcuts };
