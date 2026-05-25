/**
 * main.js
 * Main Process Entry Point - Modular and Clean.
 */

const { app, BrowserWindow, ipcMain, Menu, MenuItem, WebContentsView, protocol, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { spawn } = require('child_process');
const { marked } = require('marked');

// Disable HTTP/2 to fix ERR_HTTP2_PROTOCOL_ERROR
app.commandLine.appendSwitch('disable-http2');

// --- Audio Quality Optimization: Revert to simplest working state ---
// The user said it was best when it only had basic processing disabled.
app.commandLine.appendSwitch('disable-audio-track-processing');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Import Managers
const protocolManager = require('./src/main/protocolManager');

// Register privileged schemes early
protocolManager.init();

// 起動時間の計測
const startTime = Date.now();
app.on('ready', () => {
    console.log(`[Perf] Time to Ready: ${Date.now() - startTime}ms`);
});

// Import Managers
const storageManager = require('./src/main/storageManager');
const displayManager = require('./src/main/displayManager');
const downloadManager = require('./src/main/downloadManager');
const contentManager = require('./src/main/contentManager');
const updateManager = require('./src/main/updateManager');
const siteViewManager = require('./src/main/siteViewManager');
const menuManager = require('./src/main/menuManager');
const { setupZoomIntegration } = require('./zoomIntegration');

let mainWindow;
let mainView; // The UI Layer

function initializeGlobalManagers() {
    protocolManager.initSessions();
    storageManager.init();
    displayManager.initGlobal();
    menuManager.init();
    contentManager.init();
}

function createMainWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        x: 0,
        y: 0,
        width: Math.floor(width / 2),
        height: height,
        webPreferences: {
            partition: 'persist:jw_session',
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('src/renderer/index.html');
    mainWindow.setMenuBarVisibility(false);

    // Initialize SiteView and ContextMenu
    siteViewManager.init(mainWindow);

    // Update references for managers
    displayManager.setMainWindow(mainWindow);
    downloadManager.init(mainWindow);
    
    // Zoom Integration
    setupZoomIntegration(mainWindow, () => displayManager.getPlaybackWindow());

    // Zoom設定起動用IPCハンドラー
    ipcMain.handle('open-zoom-settings', () => {
        const { exec } = require('child_process');
        const scriptPath = path.join(__dirname, 'scripts', 'ZoomSettingsOpener', 'ZoomSettingsOpener.exe');
        if (fs.existsSync(scriptPath)) {
            exec(scriptPath);
        } else {
            console.error('ZoomSettingsOpener.exe not found at:', scriptPath);
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        // Close playback window if it exists
        const pbWin = displayManager.getPlaybackWindow();
        if (pbWin) {
            pbWin.close();
        }
    });

    return mainWindow;
}

// App Lifecycle
app.whenReady().then(() => {
    updateManager.init();

    initializeGlobalManagers();
    createMainWindow();

    // Register will-download handler globally for all sessions once app is ready
    session.defaultSession.on('will-download', (event, item, webContents) => {
        downloadManager.handleDownload(event, item, webContents);
    });

    app.on('session-created', (ses) => {
        ses.on('will-download', (event, item, webContents) => {
            downloadManager.handleDownload(event, item, webContents);
        });
    });
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
