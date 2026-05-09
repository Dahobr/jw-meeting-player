const { globalShortcut, app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const storageManager = require('./src/main/storageManager');

let robot;
try {
  // We'll try to use Nut.js if available, but for now keeping the structure.
  // In a real scenario, we'd require @nut-tree/nut-js
  // robot = require('robotjs'); 
} catch (e) {
  console.warn("Automation library not found. Nut.js features will be limited.");
}

let zoomSharingActive = false;
let mainWindowRef = null;
let getPbWinRef = null;

function setupZoomIntegration(mainWin, getPbWin) {
  mainWindowRef = mainWin;
  getPbWinRef = getPbWin;

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
    runPythonSequence(true);
  }
  zoomSharingActive = true;
}

function stopZoomSharing(mode) {
  console.log(`[Zoom] Stopping sharing (Mode: ${mode})`);
  if (mode === 'script') {
    sendZoomShortcut();
  } else if (mode === 'auto') {
    runPythonSequence(false);
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

/**
 * Python sequence via PyAutoGUI
 */
async function runPythonSequence(isStarting) {
  console.log(`[Zoom] Python sequence for ${isStarting ? 'START' : 'STOP'}`);

  if (isStarting) {
    // 1. Send Alt+S to open dialog
    sendZoomShortcut(); 

    // 2. Call Python script
    const { spawn } = require('child_process');
    const isPackaged = app.isPackaged;
    const exePath = isPackaged 
        ? path.join(process.resourcesPath, 'bin', 'zoom_automate.exe')
        : path.join(__dirname, 'dist', 'bin', 'zoom_automate.exe'); // Use the compiled EXE even in dev for consistency

    console.log(`[Zoom] Spawning automation: ${exePath}`);
    const pythonProcess = spawn(exePath, [
        storageManager.zoomAssetsDir
    ]);

    pythonProcess.stdout.on('data', (data) => console.log(`[Python] ${data}`));
    pythonProcess.stderr.on('data', (data) => console.error(`[Python Error] ${data}`));
    
    // Automation complete notification
    pythonProcess.on('close', (code) => {
        console.log(`[Zoom] Python automation finished with code ${code}`);
        if (mainWindowRef) {
            mainWindowRef.webContents.send('zoom-sharing-ready');
        }
    });

    pythonProcess.stdout.on('data', (data) => console.log(`[Python] ${data}`));
    pythonProcess.stderr.on('data', (data) => console.error(`[Python Error] ${data}`));

  } else {
    sendZoomShortcut(); // Toggle to stop
  }
}

function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

module.exports = { setupZoomIntegration, unregisterShortcuts };
