const { ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const storageManager = require('./src/main/storageManager');

const ZOOM_MANAGER_PATH = path.join(__dirname, 'scripts', 'ZoomControlManager', 'ZoomControlManager.exe');

let zoomProcess = null;
let mainWindowRef = null;
let isSharing = false;

function setupZoomIntegration(mainWin) {
  mainWindowRef = mainWin;

  ipcMain.on('set-zoom-sharing', (event, active, args = []) => {
    const mode = storageManager.config ? storageManager.config.zoomMode : 'off';
    console.log(`[Zoom] IPC Request: active=${active}, mode=${mode}, isSharing=${isSharing}`);
    
    if (active) {
      if (mode !== 'off') {
        isSharing = true;
        startZoomSharing(mode, args);
      }
    } else {
      stopZoomSharing(mode);
    }
  });
}

function startZoomSharing(mode, extraArgs = []) {
  if (mode === 'off') return;

  if (zoomProcess) {
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
    buffer = lines.pop(); 

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      console.log(`[C# Output] ${trimmedLine}`);

      if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send('zoom-proc-stdout', trimmedLine);
        
        if (trimmedLine.includes('[C#] STARTED')) {
          mainWindowRef.webContents.send('zoom-sharing-ready');
        } else if (trimmedLine.includes('[C#] COMPLETED')) {
          console.log('[Zoom] Signal: COMPLETED');
          mainWindowRef.webContents.send('zoom-sharing-finished');
          isSharing = false;
        }
      }
    }
  });

  zoomProcess.on('close', (code) => {
    console.log(`[Zoom] Process exited with code ${code}`);
    zoomProcess = null;
    isSharing = false;
  });
}

function stopZoomSharing(mode) {
  if (zoomProcess) {
    zoomProcess.kill();
    zoomProcess = null;
  }

  if (isSharing && mode !== 'off') {
    console.log(`[Zoom] Sending Alt+S to stop sharing (Last Mode: ${mode})...`);
    spawn(ZOOM_MANAGER_PATH, ['--mode=semi']);
  }
  isSharing = false;
}

module.exports = { setupZoomIntegration };
