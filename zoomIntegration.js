const { ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const storageManager = require('./src/main/storageManager');

const ZOOM_MANAGER_PATH = path.join(__dirname, 'scripts', 'ZoomControlManager', 'ZoomControlManager.exe');

let zoomProcess = null;
let mainWindowRef = null;

function setupZoomIntegration(mainWin) {
  mainWindowRef = mainWin;

  // Listen for explicit Zoom sharing state requests from Renderer
  ipcMain.on('set-zoom-sharing', (event, active, args = []) => {
    console.log(`[Zoom] IPC Request: active=${active}, args=${JSON.stringify(args)}`);
    
    if (active) {
      const mode = storageManager.config ? storageManager.config.zoomMode : 'auto';
      startZoomSharing(mode, args);
    } else {
      stopZoomSharing();
    }
  });
}

function startZoomSharing(mode, extraArgs = []) {
  if (mode === 'off') {
    console.log('[Zoom] Sharing mode is off. Skipping.');
    return;
  }

  // Kill any existing process before starting
  if (zoomProcess) {
    console.log('[Zoom] Process already running. Stopping it first.');
    zoomProcess.kill();
    zoomProcess = null;
  }

  console.log(`[Zoom] Starting C# Manager (Mode: ${mode})`);
  const spawnArgs = [`--mode=${mode}`, ...extraArgs];
  zoomProcess = spawn(ZOOM_MANAGER_PATH, spawnArgs);

  // ... (stdout/stderr listeners remain same) ...
  zoomProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send('zoom-proc-stdout', output);
      if (output.includes('[C#] STARTED')) {
        mainWindowRef.webContents.send('zoom-sharing-ready');
      } else if (output.includes('[C#] COMPLETED')) {
        mainWindowRef.webContents.send('zoom-sharing-finished');
      }
    }
  });

  zoomProcess.on('close', (code) => {
    console.log(`[Zoom] Process exited with code ${code}`);
    zoomProcess = null;
  });
}

function stopZoomSharing() {
  // 1. Kill the monitoring process if it exists
  if (zoomProcess) {
    console.log('[Zoom] Killing monitoring process...');
    zoomProcess.kill();
    zoomProcess = null;
  }

  // 2. IMPORTANT: Send Alt+S to Zoom to STOP sharing
  // We do this by launching the C# manager in 'semi' mode which just sends Alt+S and exits.
  console.log('[Zoom] Sending Alt+S to stop sharing...');
  spawn(ZOOM_MANAGER_PATH, ['--mode=semi']);
}

module.exports = { setupZoomIntegration };
