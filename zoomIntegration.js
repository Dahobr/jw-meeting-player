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
    const mode = storageManager.config ? storageManager.config.zoomMode : 'off';
    console.log(`[Zoom] IPC Request: active=${active}, mode=${mode}, args=${JSON.stringify(args)}`);
    
    if (active) {
      if (mode !== 'off') {
        startZoomSharing(mode, args);
      }
    } else {
      // Always try to stop if mode was not off, 
      // but only send Alt+S if we are actually in a zoom-enabled mode
      stopZoomSharing(mode);
    }
  });
}

function startZoomSharing(mode, extraArgs = []) {
  // Double check mode
  if (mode === 'off') return;

  // Kill any existing process before starting
  if (zoomProcess) {
    console.log('[Zoom] Process already running. Stopping it first.');
    zoomProcess.kill();
    zoomProcess = null;
  }

  console.log(`[Zoom] Starting C# Manager (Mode: ${mode}) Args: ${extraArgs.join(' ')}`);
  const spawnArgs = [`--mode=${mode}`, ...extraArgs];
  zoomProcess = spawn(ZOOM_MANAGER_PATH, spawnArgs);

  let buffer = '';
  zoomProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop(); // Keep partial line in buffer

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      console.log(`[C# Output] ${trimmedLine}`);

      if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send('zoom-proc-stdout', trimmedLine);
        
        if (trimmedLine.includes('[C#] STARTED')) {
          console.log('[Zoom Integration] Signal: STARTED');
          mainWindowRef.webContents.send('zoom-sharing-ready');
        } else if (trimmedLine.includes('[C#] COMPLETED')) {
          console.log('[Zoom Integration] Signal: COMPLETED');
          mainWindowRef.webContents.send('zoom-sharing-finished');
        }
      }
    }
  });

  zoomProcess.on('close', (code) => {
    console.log(`[Zoom] Process exited with code ${code}`);
    zoomProcess = null;
  });
}

function stopZoomSharing(mode) {
  // 1. Kill the monitoring process if it exists
  if (zoomProcess) {
    console.log('[Zoom] Killing monitoring process...');
    zoomProcess.kill();
    zoomProcess = null;
  }

  // 2. Send Alt+S to Zoom to STOP sharing, but only if mode was enabled
  if (mode !== 'off') {
    console.log(`[Zoom] Sending Alt+S to stop sharing (Last Mode: ${mode})...`);
    // Use semi mode to just send Alt+S
    spawn(ZOOM_MANAGER_PATH, ['--mode=semi']);
  }
}

module.exports = { setupZoomIntegration };
