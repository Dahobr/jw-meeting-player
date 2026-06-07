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
app.commandLine.appendSwitch('disable-audio-track-processing');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Import Managers
const protocolManager = require('./src/main/protocolManager');

// Register privileged schemes early
protocolManager.init();

// Measure startup performance
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
let globalManagersInitialized = false;

function initializeGlobalManagers(window) {
    if (globalManagersInitialized) return;
    protocolManager.initSessions();
    storageManager.init();
    displayManager.initGlobal();
    menuManager.init(window); 
    contentManager.init();
    globalManagersInitialized = true;
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

    initializeGlobalManagers(mainWindow);

    mainWindow.loadFile('src/renderer/index.html');
    mainWindow.webContents.openDevTools();
    // mainWindow.webContents.openDevTools();
    mainWindow.setMenuBarVisibility(false); // Hide menu bar by default

    // Auto-open tutorial
    mainWindow.webContents.once('did-finish-load', () => {
        if (storageManager.config.tutorialSkipped) {
            console.log('[Main] Tutorial skipped based on config.');
            return;
        }

        const bounds = mainWindow.getBounds();
        const tutorialWidth = Math.floor(bounds.width * 0.7);
        const tutorialHeight = Math.floor(bounds.height * 0.7);
        const x = bounds.x + Math.floor((bounds.width - tutorialWidth) / 2);
        const y = bounds.y + Math.floor((bounds.height - tutorialHeight) / 2);

        let tutorialWindow = new BrowserWindow({
            parent: mainWindow,
            width: tutorialWidth,
            height: tutorialHeight,
            x: x,
            y: y,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                enableRemoteModule: false,
            },
        });
        tutorialWindow.loadFile('src/renderer/tutorial.html');
    });

    // Initialize SiteView and ContextMenu
    siteViewManager.init(mainWindow);

    // --- App Closure & Reminders (Main Process Interception) ---
    let forceClose = false;
    mainWindow.on('close', (e) => {
        if (forceClose) return;
        e.preventDefault();
        mainWindow.webContents.send('confirm-close');
    });

    ipcMain.on('ready-to-close', () => {
        forceClose = true;
        if (mainWindow) mainWindow.close();
    });
    // -----------------------------------------------------------

    // Update references for managers
    displayManager.setMainWindow(mainWindow);
    downloadManager.init(mainWindow);
    
    // Zoom Integration
    setupZoomIntegration(mainWindow, () => displayManager.getPlaybackWindow());

    // Tutorial Window
    ipcMain.handle('show-tutorial', () => {
        const bounds = mainWindow.getBounds();
        const tutorialWidth = Math.floor(bounds.width * 0.7);
        const tutorialHeight = Math.floor(bounds.height * 0.7);
        const x = bounds.x + Math.floor((bounds.width - tutorialWidth) / 2);
        const y = bounds.y + Math.floor((bounds.height - tutorialHeight) / 2);

        let tutorialWindow = new BrowserWindow({
            parent: mainWindow,
            width: tutorialWidth,
            height: tutorialHeight,
            x: x,
            y: y,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                enableRemoteModule: false,
            },
        });
        tutorialWindow.loadFile('src/renderer/tutorial.html');
        // tutorialWindow.webContents.openDevTools();
        return { success: true };
    });

    ipcMain.on('show-tutorial-requested', () => {
        ipcMain.emit('show-tutorial');
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

    // Register global IPC handlers
    ipcMain.handle('get-app-version', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        return pkg.version;
    });

    ipcMain.handle('open-zoom-settings', () => {
        const { spawnSync } = require('child_process');
        
        // パッケージングされているかどうかでパスを切り替える
        const scriptPath = app.isPackaged
            ? path.join(process.resourcesPath, 'bin', 'ZoomSettingsOpener.exe')
            : path.join(__dirname, 'scripts', 'ZoomSettingsOpener', 'ZoomSettingsOpener.exe');
            
        console.log(`[Main] ZoomSettingsOpener path: ${scriptPath}`);

        if (fs.existsSync(scriptPath)) {
            const result = spawnSync(scriptPath);
            const output = result.stdout.toString();
            console.log('[Main] ZoomSettingsOpener output:', output);
            if (output.includes('successfully')) {
                return { success: true };
            } else {
                return { success: false, message: 'Settings button not found.' };
            }
        } else {
            return { success: false, message: `Opener executable not found at: ${scriptPath}` };
        }
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
