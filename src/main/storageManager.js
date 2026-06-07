/**
 * @fileoverview StorageManager
 * Manages persistent application data, including playlists, configuration settings,
 * file system structure, and media directory management.
 */

const { app, ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

class StorageManager {
    constructor() {
        this.userDataPath = app.getPath('userData');
        this.storagePath = path.join(this.userDataPath, 'playlists.json');
        this.configPath = path.join(this.userDataPath, 'config.json');
        
        this.appBaseDir = path.join(this.userDataPath, 'JwMeetingPlayer');
        this.oldBaseDir = path.join(this.userDataPath, 'ElectronPlaylistApp');
        
        this.migrateFolders(this.oldBaseDir, this.appBaseDir);
        
        this.downloadsDir = path.join(this.appBaseDir, 'downloads');
        this.yearVerseDir = path.join(this.appBaseDir, 'Texto do Ano');
        
        this.ensureDirectories();
        
        this.config = {
            yearVersePath: null,
            zoomMode: 'off',
            tutorialSkipped: false
        };
        
        this.loadConfig();
        this.initialized = false;
        console.log(`[StorageManager] JwMeetingPlayer Base: ${this.appBaseDir}`);
    }

    migrateFolders(oldPath, newPath) {
        if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`[StorageManager] Migrated folder name from ${oldPath} to ${newPath}`);
            } catch (err) {
                console.error(`[StorageManager] Migration failed: ${err.message}`);
            }
        }
    }

    ensureDirectories() {
        const dirs = [this.appBaseDir, this.downloadsDir, this.yearVerseDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[StorageManager] Verified/Created directory: ${dir}`);
            }
        });
    }

    init() {
        if (this.initialized) {
            console.log('[StorageManager] Already initialized. Skipping.');
            return;
        }

        this.importYearVerseImage();

        console.log('[StorageManager] Initializing IPC Handlers...');
        
        // Safety: Remove all handlers and listeners first
        const handlers = [
            'load-playlists', 'delete-file', 'open-download-folder', 
            'open-year-verse-folder', 'select-year-verse-image', 
            'load-year-verse-image-path', 'get-year-verse-image'
        ];
        handlers.forEach(h => ipcMain.removeHandler(h));
        ipcMain.removeAllListeners('save-playlists');

        ipcMain.on('save-playlists', (event, data) => this.savePlaylists(data));
        
        ipcMain.handle('load-playlists', () => {
            console.log('[StorageManager] load-playlists called');
            return this.loadPlaylists();
        });

        ipcMain.handle('delete-file', (event, filePath) => {
            console.log(`[StorageManager] delete-file called for: ${filePath}`);
            return this.deleteFile(filePath);
        });
        
        ipcMain.handle('open-download-folder', () => {
            console.log('[StorageManager] Opening downloads folder');
            shell.openPath(this.downloadsDir);
            return true;
        });

        ipcMain.handle('open-year-verse-folder', () => {
            console.log(`[StorageManager] Opening Year Verse folder: ${this.yearVerseDir}`);
            shell.openPath(this.yearVerseDir);
            return true;
        });

        ipcMain.handle('get-year-verse-image', () => {
            return this.getYearVerseImage();
        });

        ipcMain.handle('select-year-verse-image', async (event) => {
            console.log('[StorageManager] select-year-verse-image called');
            const win = require('electron').BrowserWindow.getAllWindows()[0];
            const result = await dialog.showOpenDialog(win, {
                title: 'Selecionar Versículo do Ano',
                properties: ['openFile'],
                filters: [{ name: 'Imagens', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                this.config.yearVersePath = result.filePaths[0];
                this.saveConfig();
                return this.config.yearVersePath;
            }
            return this.config.yearVersePath;
        });

        ipcMain.handle('load-year-verse-image-path', () => {
            if (this.config.yearVersePath && fs.existsSync(this.config.yearVersePath)) {
                return this.config.yearVersePath;
            }
            return this.getYearVerseImage();
        });

        ipcMain.handle('get-config', () => {
            return this.config;
        });

        ipcMain.handle('update-config', (event, newConfig) => {
            this.config = { ...this.config, ...newConfig };
            this.saveConfig();
            return this.config;
        });
        
        this.initialized = true;
        console.log('[StorageManager] All IPC Handlers registered successfully.');
    }

    importYearVerseImage() {
        const assetsDir = path.join(app.getAppPath(), 'assets');
        const fileName = 'texto do ano 2026.png';
        const sourcePath = path.join(assetsDir, fileName);
        const destPath = path.join(this.yearVerseDir, fileName);

        if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
            try {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`[StorageManager] Auto-imported year verse image to: ${destPath}`);
            } catch (err) {
                console.error(`[StorageManager] Failed to auto-import image: ${err.message}`);
            }
        }
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                this.config = { ...this.config, ...JSON.parse(data) };
            }
        } catch (err) {
            console.error(`[StorageManager] Load Config Error: ${err.message}`);
        }
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log(`[StorageManager] Config saved to ${this.configPath}`);
        } catch (err) {
            console.error(`[StorageManager] Save Config Error: ${err.message}`);
        }
    }

    getYearVerseImage() {
        try {
            let image = this._findImageInDir(this.yearVerseDir);
            if (image) return image;
            const oldYearVerseDir = path.join(this.oldBaseDir, 'Texto do Ano');
            image = this._findImageInDir(oldYearVerseDir);
            if (image) return image;
        } catch (err) {
            console.error('[StorageManager] Error reading year verse dir:', err);
        }
        return null;
    }

    _findImageInDir(dirPath) {
        if (!fs.existsSync(dirPath)) return null;
        const files = fs.readdirSync(dirPath);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const imageFile = files.find(file => imageExtensions.includes(path.extname(file).toLowerCase()));
        return imageFile ? path.join(dirPath, imageFile) : null;
    }

    savePlaylists(data) {
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`[StorageManager] Playlists saved.`);
        } catch (err) {
            console.error('[StorageManager] Save Error:', err);
        }
    }

    loadPlaylists() {
        if (fs.existsSync(this.storagePath)) {
            try {
                const data = fs.readFileSync(this.storagePath, 'utf-8');
                const parsed = JSON.parse(data);
                return parsed.playlists ? parsed : { playlists: parsed };
            } catch (err) {
                console.error('[StorageManager] Load Error:', err);
            }
        }
        return { playlists: {} };
    }

    deleteFile(filePath) {
        try {
            const normalizedPath = path.normalize(filePath);
            if (fs.existsSync(normalizedPath)) {
                fs.unlinkSync(normalizedPath);
                console.log(`[StorageManager] File deleted: ${normalizedPath}`);
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    getDownloadsDir() {
        return this.downloadsDir;
    }

    getPlaylistDownloadsDir(playlistId) {
        if (!playlistId) return this.downloadsDir;
        const dir = path.join(this.downloadsDir, playlistId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[StorageManager] Created playlist directory: ${dir}`);
        }
        return dir;
    }
}

module.exports = new StorageManager();
