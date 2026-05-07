const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const storageManager = require('./storageManager');

class DisplayManager {
    constructor() {
        this.playbackWin = null;
        this.mainWindow = null;
        this.targetDisplayId = null;
        this.globalInitialized = false;
    }

    initGlobal() {
        console.log('[DisplayManager] initGlobal called');
        if (this.globalInitialized) return;

        // Screen event listeners
        screen.removeAllListeners('display-added');
        screen.removeAllListeners('display-removed');
        screen.removeAllListeners('display-metrics-changed');

        screen.on('display-added', () => this.onDisplaysChanged());
        screen.on('display-removed', () => this.onDisplaysChanged());
        screen.on('display-metrics-changed', () => this.onDisplaysChanged());

        // IPC Handlers
        ipcMain.removeHandler('get-displays');
        ipcMain.handle('get-displays', () => this.getDisplays());

        ipcMain.removeAllListeners('set-target-display');
        ipcMain.on('set-target-display', (event, displayId) => {
            this.targetDisplayId = displayId;
            console.log(`[DisplayManager] Target display set to: ${displayId}`);
        });

        ipcMain.removeHandler('request-display-status');
        ipcMain.handle('request-display-status', () => {
            const isConnected = screen.getAllDisplays().length > 1;
            return isConnected ? 'connected' : 'waiting';
        });

        ipcMain.removeAllListeners('playback-ready');
        ipcMain.on('playback-ready', (event) => {
            console.log('[DisplayManager] Playback window is ready. Sending standby image.');
            this.loadStandbyImage();
        });

        ipcMain.removeAllListeners('load-media');
        ipcMain.on('load-media', (event, data) => {
            console.log('[DisplayManager] IPC load-media received:', data);
            this.loadMedia(data);
        });

        ipcMain.removeAllListeners('playback-control');
        ipcMain.on('playback-control', (event, { action, ...data }) => {
            if (this.playbackWin) {
                this.playbackWin.webContents.send('playback-command', { action, ...data });
            }
            // Broadcast back to main window to keep UI in sync
            if (this.mainWindow) {
                this.mainWindow.webContents.send('playback-command', { action, ...data });
            }
        });

        this.globalInitialized = true;
    }

    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
        this.checkDisplayStatus();
        // Trigger window creation on startup if secondary display exists
        this.createPlaybackWindowIfPossible();
    }

    init(mainWindow) {
        this.initGlobal();
        this.setMainWindow(mainWindow);

        // Initial setup
        this.createPlaybackWindowIfPossible();
    }

    onDisplaysChanged() {
        console.log('[DisplayManager] Display configuration changed.');
        if (this.mainWindow) {
            this.mainWindow.webContents.send('displays-changed');
        }
        this.createPlaybackWindowIfPossible();
        this.checkDisplayStatus();
    }

    getDisplays() {
        return screen.getAllDisplays().map(d => ({
            id: d.id,
            label: d.label || `Display ${d.id}`,
            bounds: d.bounds,
            isPrimary: d.id === screen.getPrimaryDisplay().id
        }));
    }

    createPlaybackWindow() {
        if (this.playbackWin) {
            return this.playbackWin;
        }
        const displays = screen.getAllDisplays();
        let targetDisplay;

        if (this.targetDisplayId) {
            targetDisplay = displays.find(d => d.id.toString() === this.targetDisplayId.toString());
        }

        if (!targetDisplay) {
            targetDisplay = displays.find(d => d.id !== screen.getPrimaryDisplay().id);
        }

        if (!targetDisplay) {
            console.warn('[DisplayManager] No secondary display detected.');
            return null;
        }

        const winOptions = {
            x: targetDisplay.bounds.x,
            y: targetDisplay.bounds.y,
            width: targetDisplay.bounds.width,
            height: targetDisplay.bounds.height,
            frame: false,
            fullscreen: true,
            alwaysOnTop: true,
            show: true, 
            backgroundColor: '#000000',
            webPreferences: {
                partition: 'persist:jw_session',
                preload: path.join(__dirname, '..', '..', 'preload.js'),
                contextIsolation: true,
                enableRemoteModule: false,
                webviewTag: true,
            }
        };

        try {
            this.playbackWin = new BrowserWindow(winOptions);
            this.playbackWin.once('ready-to-show', () => {
                this.playbackWin.show();
                if (process.platform === 'win32') {
                    this.playbackWin.setAlwaysOnTop(true, 'screen-saver');
                }
            });

            this.playbackWin.loadFile(path.join(__dirname, '..', 'renderer', 'playback', 'playback.html'));

            this.playbackWin.on('closed', () => {
                this.playbackWin = null;
            });

            this.setupPlaybackWindowListeners();
        } catch (err) {
            console.error('[DisplayManager] Error creating window:', err);
        }

        return this.playbackWin;
    }

    loadStandbyImage() {
        const standbyPath = storageManager.getYearVerseImage();
        if (standbyPath && this.playbackWin) {
            console.log(`[DisplayManager] Loading standby image: ${standbyPath}`);
            this.playbackWin.webContents.send('load-media', { mediaPath: standbyPath, mediaType: 'image/jpeg' });
        }
    }

    createPlaybackWindowIfPossible() {
        const displays = screen.getAllDisplays();
        if (displays.length > 1 && !this.playbackWin) {
            this.createPlaybackWindow();
        } else if (displays.length <= 1 && this.playbackWin) {
            this.closePlaybackWindow();
        }
    }

    closePlaybackWindow() {
        if (this.playbackWin) {
            this.playbackWin.close();
            this.playbackWin = null;
        }
    }

    loadMedia(data) {
        console.log(`[DisplayManager] loadMedia called with data:`, data);
        if (!this.playbackWin) {
            const win = this.createPlaybackWindow();
            if (!win) return;
        }
        
        const send = () => {
            if (this.playbackWin && !this.playbackWin.isDestroyed()) {
                this.playbackWin.webContents.send('load-media', data);
            }
        };

        if (this.playbackWin.webContents.isLoading()) {
            this.playbackWin.webContents.once('did-finish-load', send);
        } else {
            send();
        }
    }

    setupPlaybackWindowListeners() {
        if (!this.playbackWin || !this.mainWindow) return;

        this.playbackWin.webContents.on('ipc-message', (event, channel) => {
            if (channel === 'media-started-playing') {
                this.mainWindow.webContents.send('media-playback-state-change', true);
            } else if (channel === 'media-stopped-playing') {
                this.mainWindow.webContents.send('media-playback-state-change', false);
            }
        });
    }

    checkDisplayStatus() {
        if (!this.mainWindow) return;
        const isConnected = screen.getAllDisplays().length > 1;
        const status = isConnected ? 'connected' : 'waiting';
        this.mainWindow.webContents.send('display-status', status);
    }

    getPlaybackWindow() {
        return this.playbackWin;
    }
}

module.exports = new DisplayManager();
