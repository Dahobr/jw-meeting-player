const { ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const storageManager = require('./src/main/storageManager');

const ZOOM_MANAGER_PATH = path.join(__dirname, 'scripts', 'ZoomControlManager', 'ZoomControlManager.exe');

let zoomProcess = null;
let mainWindowRef = null;

function setupZoomIntegration(mainWin) {
  mainWindowRef = mainWin;

  // Listen for explicit Zoom sharing state updates from Renderer
  ipcMain.on('update-zoom-sharing-state', (event, shouldShare, args = []) => {
    console.log(`[Zoom] IPC Event: shouldShare=${shouldShare}, args=${JSON.stringify(args)}`);
    
    if (shouldShare) {
      const mode = storageManager.config ? storageManager.config.zoomMode : 'auto';
      startZoomSharing(mode, args);
    } else {
      stopZoomSharing();
    }
  });
}

function startZoomSharing(mode, extraArgs = []) {
  if (mode === 'off') {
    console.log('[Zoom] Sharing mode is off. Skipping automation.');
    return;
  }

  // If already running, don't start another one unless specifically requested
  if (zoomProcess) {
    console.warn('[Zoom] Process already running. Stopping previous one.');
    stopZoomSharing();
  }

  console.log(`[Zoom] Starting C# Manager (Mode: ${mode})`);
  
  const spawnArgs = [`--mode=${mode}`, ...extraArgs];
  zoomProcess = spawn(ZOOM_MANAGER_PATH, spawnArgs);

  zoomProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[C# Output] ${output}`);

    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      // Send raw output for logging/debugging
      mainWindowRef.webContents.send('zoom-proc-stdout', output);

      // Specific triggers
      if (output.includes('[C#] STARTED')) {
        console.log('[Zoom] Signal: STARTED detected');
        mainWindowRef.webContents.send('zoom-sharing-ready');
      } else if (output.includes('[C#] COMPLETED')) {
        console.log('[Zoom] Signal: COMPLETED detected');
        mainWindowRef.webContents.send('zoom-sharing-finished');
      } else if (output.includes('[C#] COORDS:')) {
        // Coords are handled via stdout log in app.js usually, 
        // but we can make it more explicit if needed.
      }
    }
  });

  zoomProcess.stderr.on('data', (data) => {
    console.error(`[C# Error] ${data.toString()}`);
  });

  zoomProcess.on('close', (code) => {
    console.log(`[Zoom] Process exited with code ${code}`);
    zoomProcess = null;
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send('zoom-sharing-finished');
    }
  });
}

function stopZoomSharing() {
  if (zoomProcess) {
    console.log('[Zoom] Killing C# Process...');
    zoomProcess.kill();
    zoomProcess = null;
  }
}

module.exports = { setupZoomIntegration };
