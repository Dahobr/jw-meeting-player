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
        this.activeDownloads = new Set();
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

        ipcMain.removeAllListeners('download-url');
        ipcMain.on('download-url', (event, url) => {
            if (this.mainWindow) {
                console.log(`[DownloadManager] Triggering download for URL: ${url}`);
                this.mainWindow.webContents.downloadURL(url);
            }
        });

        if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
            this.setupWillDownload(mainWindow.webContents.session);
        }
    }

    setupWillDownload(session) {
        session.removeAllListeners('will-download');
        session.on('will-download', (event, item, webContents) => this.handleDownload(event, item, webContents));
    }

    async saveBrowserImage(base64Data, originalUrl) {
        const ext = '.jpg';
        const filename = `img_${Date.now()}${ext}`;
        const targetDir = storageManager.getPlaylistDownloadsDir(this.activePlaylistId);
        const filePath = path.join(targetDir, filename);

        const base64Image = base64Data.split(';base64,').pop();
        fs.writeFile(filePath, base64Image, { encoding: 'base64' }, async (err) => {
            if (err) {
                console.error('[DownloadManager] Save Image Error:', err);
                return;
            }
            console.log(`[DownloadManager] Image saved: ${filePath}`);
            const { title, thumbnailData } = await this.extractMediaInfo(filePath);
            this.mainWindow.webContents.send('download-complete', {
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

    async handleDownload(event, item, webContents) {
        const filename = item.getFilename();
        const url = item.getURL();
        const downloadId = `${url}-${filename}`;

        if (this.activeDownloads.has(downloadId)) {
            console.log(`[DownloadManager] Skipping duplicate download request: ${filename}`);
            return;
        }
        this.activeDownloads.add(downloadId);

        const targetDir = storageManager.getPlaylistDownloadsDir(this.activePlaylistId);
        let finalFilePath = path.join(targetDir, filename);
        const fileExt = path.extname(filename);
        const fileBase = path.basename(filename, fileExt);
        let counter = 1;

        while (fs.existsSync(finalFilePath)) {
            finalFilePath = path.join(targetDir, `${fileBase}(${counter})${fileExt}`);
            counter++;
        }

        const finalFilename = path.basename(finalFilePath);
        const allowedFileTypes = ['.mp4', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.jwmp'];

        console.log(`[DownloadManager] Download requested: ${filename} -> ${finalFilename}`);

        if (allowedFileTypes.includes(path.extname(finalFilename).toLowerCase())) {
            const isPlaylist = path.extname(finalFilename).toLowerCase() === '.jwmp';
            
            if (isPlaylist) {
                // Download to a temporary location for importing
                const tempPath = path.join(app.getPath('temp'), `import_${Date.now()}.jwmp`);
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

            this.mainWindow.webContents.send('download-started', { filename: finalFilename, id: downloadId });
            item.setSavePath(finalFilePath);
            this.startTimeout(downloadId, item, finalFilename);
            
            item.on('updated', (event, state) => {
                if (state === 'progressing') {
                    const received = item.getReceivedBytes();
                    const total = item.getTotalBytes();
                    const progress = total > 0 ? Math.round((received / total) * 100) : 0;
                    this.mainWindow.webContents.send('download-progress', { id: downloadId, progress, filename });
                    
                    const previousReceived = this.lastReceivedBytes.get(downloadId) || 0;
                    if (received > previousReceived) {
                        this.startTimeout(downloadId, item, finalFilename);
                        this.lastReceivedBytes.set(downloadId, received);
                    }
                }
            });

            item.on('done', async (event, state) => {
                this.activeDownloads.delete(downloadId);
                this.clearTimeout(downloadId);
                this.lastReceivedBytes.delete(downloadId);
                if (state === 'completed') {
                    console.log(`[DownloadManager] Download complete: ${finalFilePath}`);
                    const result = await this.extractMediaInfo(finalFilePath);
                    this.mainWindow.webContents.send('download-complete', { 
                        filename: finalFilename, 
                        filePath: finalFilePath, 
                        type: fileExt,
                        title: result.title,
                        thumbnailData: result.thumbnailData,
                        sourceUrl: url
                    });
                } else {
                    console.error(`[DownloadManager] Download failed: ${state}`);
                    this.mainWindow.webContents.send('download-error', { id: downloadId, message: `Download failed: ${state}`, filename: finalFilename });
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
                { name: 'Media/Playlist Files', extensions: ['mp4', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'jwlplaylist'] }
            ]
        });

        if (result.canceled || result.filePaths.length === 0) return null;

        const importedItems = [];
        const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

        for (const filePath of result.filePaths) {
            const ext = path.extname(filePath).toLowerCase();

            if (ext === '.jwlplaylist') {
                try {
                    const zip = new AdmZip(filePath);
                    const zipEntries = zip.getEntries();
                    const playlistName = path.basename(filePath, ext);
                    const extractedImages = [];

                    for (const entry of zipEntries) {
                        const entryExt = path.extname(entry.entryName).toLowerCase();
                        if (allowedImageTypes.includes(entryExt)) {
                            let finalFileName = entry.entryName;
                            let finalFilePath = path.join(this.downloadDir, finalFileName);
                            let counter = 1;
                            const fileBase = path.basename(finalFileName, entryExt);

                            while (fs.existsSync(finalFilePath)) {
                                finalFileName = `${fileBase}(${counter})${entryExt}`;
                                finalFilePath = path.join(this.downloadDir, finalFileName);
                                counter++;
                            }

                            fs.writeFileSync(finalFilePath, entry.getData());
                            const { title, thumbnailData } = await this.extractMediaInfo(finalFilePath);

                            extractedImages.push({
                                filename: finalFileName,
                                filePath: finalFilePath,
                                type: entryExt,
                                mediaType: 'image',
                                thumbnailData,
                                title: title || path.basename(finalFileName, entryExt)
                            });
                        }
                    }
                    importedItems.push({ type: 'playlist', name: playlistName, items: extractedImages });
                } catch (err) {
                    console.error('[DownloadManager] JWPlaylist Error:', err);
                }
            } else {
                let finalFileName = path.basename(filePath);
                const fileExt = path.extname(finalFileName);
                const fileBase = path.basename(finalFileName, fileExt);
                let finalFilePath = path.join(this.downloadDir, finalFileName);
                let counter = 1;

                while (fs.existsSync(finalFilePath)) {
                    finalFileName = `${fileBase}(${counter})${fileExt}`;
                    finalFilePath = path.join(this.downloadDir, finalFileName);
                    counter++;
                }

                fs.copyFileSync(filePath, finalFilePath);
                const { title, thumbnailData } = await this.extractMediaInfo(finalFilePath);

                importedItems.push({
                    type: 'file',
                    filename: finalFileName,
                    filePath: finalFilePath,
                    mediaType: ext === '.mp4' ? 'video' : 'image',
                    title,
                    thumbnailData
                });
            }
        }

        const responseData = { newPlaylist: null, newItems: [] };
        for (const item of importedItems) {
            if (item.type === 'playlist') {
                responseData.newPlaylist = { id: `playlist-${Date.now()}`, name: item.name, items: item.items };
            } else {
                responseData.newItems.push({
                    id: `item-${Date.now()}`,
                    filename: item.filename,
                    filePath: item.filePath,
                    mediaType: item.mediaType,
                    title: item.title,
                    thumbnailData: item.thumbnailData
                });
            }
        }

        return responseData;
    }
}

module.exports = new DownloadManager();