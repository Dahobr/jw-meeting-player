/**
 * @fileoverview DownloadManager
 * Manages media file downloads, download state tracking, file saving, 
 * and media metadata extraction (thumbnails/titles).
 */

const { app, ipcMain, shell, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const AdmZip = require('adm-zip');
const storageManager = require('./storageManager');
const shareManager = require('./shareManager');

class DownloadManager {
    constructor() {
        this.mainWindow = null;
        this.activeDownloads = new Map();
        this.timeoutMap = new Map();
        this.DOWNLOAD_TIMEOUT_MS = 60000;
        this.lastReceivedBytes = new Map();
        this.activePlaylistId = null;
    }

    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.downloadDir = storageManager.getDownloadsDir();

        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }

        ipcMain.removeHandler('open-file-dialog');
        ipcMain.handle('open-file-dialog', () => this.handleOpenFile());
        
        ipcMain.removeAllListeners('save-browser-image');
        ipcMain.on('save-browser-image', (event, base64Data, originalUrl) => this.saveBrowserImage(base64Data, originalUrl));

        ipcMain.removeAllListeners('set-active-playlist');
        ipcMain.on('set-active-playlist', (event, playlistId) => {
            this.activePlaylistId = playlistId;
            console.log(`[DownloadManager] Active playlist set to: ${playlistId}`);
        });

        this.pendingDownloadIds = new Map();

        ipcMain.removeAllListeners('download-url');
        ipcMain.on('download-url', (event, { url, id }) => {
            if (this.mainWindow) {
                console.log(`[DownloadManager] Triggering download for URL: ${url} (ID: ${id})`);
                this.pendingDownloadIds.set(url, id);
                this.mainWindow.webContents.downloadURL(url);
            }
        });

        ipcMain.removeHandler('cancel-download');
        ipcMain.handle('cancel-download', (event, downloadId) => this.cancelDownload(downloadId));

        if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
            this.setupWillDownload(mainWindow.webContents.session);
        }
    }

    setupWillDownload(session) {
        session.removeAllListeners('will-download');
        session.on('will-download', (event, item, webContents) => this.handleDownload(event, item, webContents));
    }

    /**
     * Ensures an active playlist ID exists, creating and synchronizing a fallback if necessary.
     * @param {boolean} createIfMissing - Whether to create a fallback playlist if none exist.
     * @returns {string|null} The active playlist ID, or null if not found/created.
     */
    _getSafeActivePlaylistId(createIfMissing = true) {
        if (this.activePlaylistId) return this.activePlaylistId;
        
        if (!createIfMissing) return null;

        const fallbackId = `playlist-${Date.now()}`;
        this.activePlaylistId = fallbackId;
        
        // Notify Renderer to create this fallback playlist in the store
        if (this.mainWindow) {
            this.mainWindow.webContents.send('playlist-imported', {
                id: fallbackId,
                name: 'Minha Playlist',
                items: []
            });
        }
        
        console.warn(`[DownloadManager] No active playlist ID found. Created fallback: ${fallbackId}`);
        return fallbackId;
    }

    async saveBrowserImage(base64Data, originalUrl) {
        const ext = '.jpg';
        const filename = `img_${Date.now()}${ext}`;
        const downloadId = `img_${Date.now()}`; // Generate a unique ID
        
        // Use safe active playlist ID
        const targetPlaylistId = this._getSafeActivePlaylistId();
        const targetDir = storageManager.getPlaylistDownloadsDir(targetPlaylistId);
        const filePath = path.join(targetDir, filename);

        // Notify download started
        this.mainWindow.webContents.send('download-started', { filename, id: downloadId });

        const base64Image = base64Data.split(';base64,').pop();
        fs.writeFile(filePath, base64Image, { encoding: 'base64' }, async (err) => {
            if (err) {
                console.error('[DownloadManager] Save Image Error:', err);
                return;
            }
            console.log(`[DownloadManager] Image saved: ${filePath}`);
            const { title, thumbnailData } = await this.extractMediaInfo(filePath);
            this.mainWindow.webContents.send('download-complete', {
                id: downloadId,
                filename,
                filePath,
                type: ext,
                title,
                thumbnailData,
                sourceUrl: originalUrl
            });
        });
    }

    startTimeout(downloadId, item, filename) {
        this.clearTimeout(downloadId);
        this.timeoutMap.set(downloadId, setTimeout(() => {
            console.warn(`[DownloadManager] Download timed out for ${filename} (ID: ${downloadId})`);
            item.cancel();
            this.mainWindow.webContents.send('download-error', { 
                id: downloadId, 
                message: 'Download timed out', 
                filename: filename 
            });
            this.activeDownloads.delete(downloadId);
            this.clearTimeout(downloadId);
            this.lastReceivedBytes.delete(downloadId);
        }, this.DOWNLOAD_TIMEOUT_MS));
    }

    clearTimeout(downloadId) {
        if (this.timeoutMap.has(downloadId)) {
            clearTimeout(this.timeoutMap.get(downloadId));
            this.timeoutMap.delete(downloadId);
            this.lastReceivedBytes.delete(downloadId);
        }
    }
    cancelDownload(downloadId) {
        if (this.activeDownloads.has(downloadId)) {
            console.log(`[DownloadManager] Cancelling download for ID: ${downloadId}`);
            const item = this.activeDownloads.get(downloadId);
            if (item && typeof item.cancel === 'function') {
                item.cancel();
            }
            // Cleanup will be handled by the 'done' event listener in handleDownload
            return true;
        }
        return false;
    }

    async handleDownload(event, item, webContents) {
        const filename = item.getFilename();
        const url = item.getURL();

        // Get item ID from map if available
        const itemId = this.pendingDownloadIds.get(url);
        this.pendingDownloadIds.delete(url);

        const downloadId = itemId || `${url}-${filename}`;
        item.downloadId = downloadId; // Set ID on the item object
        console.log(`[DownloadManager] Generating Download ID: ${downloadId}`);

        if (this.activeDownloads.has(downloadId)) {
            console.log(`[DownloadManager] Skipping duplicate download request: ${filename}`);
            return;
        }
        this.activeDownloads.set(downloadId, item);

        // Ensure we use a specific directory, never the root
        const targetPlaylistId = this._getSafeActivePlaylistId();
        const targetDir = storageManager.getPlaylistDownloadsDir(targetPlaylistId);
        
        let finalFilePath = path.join(targetDir, filename);
        const fileExt = path.extname(filename);
        const fileBase = path.basename(filename, fileExt);
        let counter = 1;

        while (fs.existsSync(finalFilePath)) {
            finalFilePath = path.join(targetDir, `${fileBase}(${counter})${fileExt}`);
            counter++;
        }

        const finalFilename = path.basename(finalFilePath);
        const allowedFileTypes = ['.mp4', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.jwmp', '.zip', '.jwlplaylist'];

        console.log(`[DownloadManager] Download requested: ${filename} -> ${finalFilename}`);

        if (allowedFileTypes.includes(path.extname(finalFilename).toLowerCase())) {
            const ext = path.extname(finalFilename).toLowerCase();
            const isPlaylist = ext === '.jwmp' || ext === '.zip' || ext === '.jwlplaylist';
            
            if (isPlaylist) {
                // Download to a temporary location for importing
                const tempPath = path.join(app.getPath('temp'), `import_${Date.now()}${ext}`);
                item.setSavePath(tempPath);
                
                item.on('done', async (event, state) => {
                    this.activeDownloads.delete(downloadId);
                    this.clearTimeout(downloadId);
                    this.lastReceivedBytes.delete(downloadId);
                    
                    if (state === 'completed') {
                        console.log(`[DownloadManager] Playlist download complete: ${tempPath}`);
                        const result = await shareManager.importPlaylist(tempPath);
                        if (result.success) {
                            this.mainWindow.webContents.send('playlist-imported', result.playlist);
                        } else {
                            this.mainWindow.webContents.send('download-error', { 
                                id: downloadId, 
                                message: `Falha ao importar playlist: ${result.error}`, 
                                filename: finalFilename 
                            });
                        }
                        // Cleanup temp file
                        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e) {}
                    } else {
                        console.error(`[DownloadManager] Playlist download failed: ${state}`);
                        this.mainWindow.webContents.send('download-error', { id: downloadId, message: `Download failed: ${state}`, filename: finalFilename });
                    }
                });
                return;
            }

            this.mainWindow.webContents.send('download-started', { filename: finalFilename, id: item.downloadId });
            item.setSavePath(finalFilePath);
            this.startTimeout(item.downloadId, item, finalFilename);
            
            item.on('updated', (event, state) => {
                if (state === 'progressing') {
                    const received = item.getReceivedBytes();
                    const total = item.getTotalBytes();
                    const progress = total > 0 ? Math.round((received / total) * 100) : 0;
                    this.mainWindow.webContents.send('download-progress', { id: item.downloadId, progress, filename });
                    
                    const previousReceived = this.lastReceivedBytes.get(item.downloadId) || 0;
                    if (received > previousReceived) {
                        this.startTimeout(item.downloadId, item, finalFilename);
                        this.lastReceivedBytes.set(item.downloadId, received);
                    }
                }
            });

            item.on('done', async (event, state) => {
                this.activeDownloads.delete(item.downloadId);
                this.clearTimeout(item.downloadId);
                this.lastReceivedBytes.delete(item.downloadId);
                if (state === 'completed') {
                    console.log(`[DownloadManager] Download complete: ${finalFilePath}`);
                    const result = await this.extractMediaInfo(finalFilePath);
                    this.mainWindow.webContents.send('download-complete', { 
                        id: item.downloadId,
                        filename: finalFilename, 
                        filePath: finalFilePath, 
                        type: fileExt,
                        title: result.title,
                        thumbnailData: result.thumbnailData,
                        sourceUrl: url
                    });
                } else {
                    console.error(`[DownloadManager] Download failed: ${state}`);
                    this.mainWindow.webContents.send('download-error', { id: item.downloadId, message: `Download failed: ${state}`, filename: finalFilename });
                }
            });
        } else {
            this.activeDownloads.delete(downloadId);
            console.warn(`[DownloadManager] Blocked file type: ${finalFilename}`);
            this.mainWindow.webContents.send('download-error', { 
                id: `err-${Date.now()}`, 
                message: 'Formato não suportado', 
                filename: finalFilename 
            });
            item.cancel();
        }
    }

    async extractMediaInfo(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        let thumbnailData = null;
        let title = null;

        if (ext === '.mp4') {
            try {
                const metadata = await mm.parseFile(filePath);
                title = metadata.common.title || null;
                const picture = mm.selectCover(metadata.common.picture);
                if (picture) {
                    const dataBuffer = Buffer.from(picture.data);
                    thumbnailData = `data:${picture.format};base64,${dataBuffer.toString('base64')}`;
                }
            } catch (err) {
                console.error('[DownloadManager] Metadata Extraction Error:', err.message);
            }
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) {
            try {
                const buffer = fs.readFileSync(filePath);
                let mimeType = 'image/' + ext.slice(1);
                if (ext === '.jpg') mimeType = 'image/jpeg';
                if (ext === '.svg') mimeType = 'image/svg+xml';
                thumbnailData = `data:${mimeType};base64,${buffer.toString('base64')}`;
            } catch (err) {
                console.error('[DownloadManager] Image Thumbnail Error:', err.message);
            }
        }

        return { title, thumbnailData };
    }

    async handleOpenFile() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Media/Playlist Files', extensions: ['mp4', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'jwlplaylist', 'jwmp'] }
            ]
        });

        if (result.canceled || result.filePaths.length === 0) return null;

        const responseData = { newPlaylist: null, newItems: [] };
        
        // We don't ensure a playlist here anymore because some files might be .jwmp/.jwlplaylist
        // which create their own playlists.
        let targetPlaylistId = this._getSafeActivePlaylistId(false);

        for (const filePath of result.filePaths) {
            const ext = path.extname(filePath).toLowerCase();

            if (ext === '.jwmp' || ext === '.jwlplaylist') {
                try {
                    const result = await shareManager.importPlaylist(filePath);
                    if (result.success) {
                        // Notify renderer about the new playlist
                        this.mainWindow.webContents.send('playlist-imported', result.playlist);
                    } else {
                        console.error(`[DownloadManager] ${ext} Import Error:`, result.error);
                    }
                } catch (err) {
                    console.error(`[DownloadManager] ${ext} Import Error:`, err);
                }
            } else {
                // Individual file import
                try {
                    // Now we definitely need a playlist, create one if still missing
                    if (!targetPlaylistId) {
                        targetPlaylistId = this._getSafeActivePlaylistId(true);
                    }
                    
                    const newItem = await shareManager.importSingleFile(filePath, targetPlaylistId);
                    responseData.newItems.push(newItem);
                } catch (err) {
                    console.error('[DownloadManager] File Import Error:', err);
                }
            }
        }

        return responseData;
    }
}

module.exports = new DownloadManager();