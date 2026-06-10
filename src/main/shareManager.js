const { app } = require('electron');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const storageManager = require('./storageManager');

class ShareManager {
    constructor() {
    }

    /**
     * Exports a playlist to a .jwmp (ZIP) file.
     * @param {Object} playlist - The playlist object containing name and items.
     * @returns {Object} result - Success status and the export file path.
     */
    async exportPlaylist(playlist) {
        try {
            console.log(`[ShareManager] Exporting playlist: ${playlist.name}`);
            const zip = new AdmZip();

            // Prepare playlist metadata for export
            // We create a copy to avoid modifying the original
            const exportData = {
                name: playlist.name,
                items: playlist.items.map(item => {
                    const newItem = { ...item };
                    // If it's a video, we don't include the file
                    if (item.mediaType === 'video') {
                        // Ensure sourceUrl is present
                        if (!newItem.sourceUrl) {
                            console.warn(`[ShareManager] Video item "${item.title}" missing sourceUrl during export.`);
                        }
                    }
                    return newItem;
                })
            };

            // Add playlist.json to ZIP
            zip.addFile('playlist.json', Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8'));

            // Add image and video files to ZIP
            for (const item of playlist.items) {
                // 画像は常に添付、動画は sourceUrl がない場合のみ添付（ある場合はインポート後に自動ダウンロード）
                const shouldIncludeFile = 
                    (item.mediaType === 'image') || 
                    (item.mediaType === 'video' && !item.sourceUrl);

                if (shouldIncludeFile && item.filePath && fs.existsSync(item.filePath)) {
                    // Use the filename from the path to avoid directory structure in ZIP
                    const fileName = path.basename(item.filePath);
                    zip.addLocalFile(item.filePath);
                    console.log(`[ShareManager] Added ${item.mediaType} to ZIP: ${fileName}`);
                }
            }

            const exportFileName = `${playlist.name.replace(/[/\\?%*:|"<>]/g, '-')}.jwmp`;
            const exportFilePath = path.join(app.getPath('downloads'), exportFileName);

            // Write ZIP file
            zip.writeZip(exportFilePath);
            console.log(`[ShareManager] Exported to: ${exportFilePath}`);

            return { success: true, filePath: exportFilePath };
        } catch (error) {
            console.error('[ShareManager] Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Imports a single media file into a playlist folder.
     * @param {string} sourcePath - Current path of the file.
     * @param {string} playlistId - Target playlist ID.
     * @returns {Object} item - The imported item data.
     */
    async importSingleFile(sourcePath, playlistId) {
        const targetDir = storageManager.getPlaylistDownloadsDir(playlistId);
        let fileName = path.basename(sourcePath);
        const ext = path.extname(fileName).toLowerCase();
        const fileBase = path.basename(fileName, ext);
        
        let finalPath = path.join(targetDir, fileName);
        let counter = 1;
        while (fs.existsSync(finalPath)) {
            fileName = `${fileBase}(${counter})${ext}`;
            finalPath = path.join(targetDir, fileName);
            counter++;
        }

        fs.copyFileSync(sourcePath, finalPath);
        
        const downloadManager = require('./downloadManager');
        const { title, thumbnailData } = await downloadManager.extractMediaInfo(finalPath);

        return {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            filename: fileName,
            filePath: finalPath,
            mediaType: ext === '.mp4' ? 'video' : 'image',
            title: title || fileBase,
            thumbnailData
        };
    }

    /**
     * Imports a playlist from a .jwmp or .jwlplaylist file.
     * @param {string} filePath - Path to the file.
     * @returns {Object} result - Success status and the imported playlist data.
     */
    async importPlaylist(filePath) {
        try {
            console.log(`[ShareManager] Importing playlist from: ${filePath}`);
            const zip = new AdmZip(filePath);
            const zipEntries = zip.getEntries();
            
            const jwmpEntry = zipEntries.find(e => e.entryName === 'playlist.json');
            const jwlEntry = zipEntries.find(e => e.entryName === 'manifest.json');

            if (!jwmpEntry && !jwlEntry) {
                throw new Error('Invalid file: Neither playlist.json nor manifest.json found');
            }

            const playlistId = `playlist-${Date.now()}`;
            const targetDir = storageManager.getPlaylistDownloadsDir(playlistId);
            let playlistData = {};

            if (jwmpEntry) {
                // Handle .jwmp (our custom format)
                playlistData = JSON.parse(jwmpEntry.getData().toString('utf8'));
            } else if (jwlEntry) {
                // Handle .jwlplaylist (JW Library format)
                const manifest = JSON.parse(jwlEntry.getData().toString('utf8'));
                // Use manifest name (usually ends with .jwlplaylist) as playlist name, or fallback to file name
                let name = manifest.name || path.basename(filePath, path.extname(filePath));
                name = name.replace('.jwlplaylist', '').trim();
                
                playlistData = {
                    name: name,
                    items: []
                };

                // Add all images found in the ZIP
                const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
                for (const entry of zipEntries) {
                    const ext = path.extname(entry.entryName).toLowerCase();
                    if (allowedImageTypes.includes(ext)) {
                        playlistData.items.push({
                            title: path.basename(entry.entryName, ext),
                            mediaType: 'image',
                            filePath: entry.entryName // Will be updated after extraction
                        });
                    }
                }
            }

            // Extract media files to the playlist folder
            const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
            for (const entry of zipEntries) {
                const ext = path.extname(entry.entryName).toLowerCase();
                const isMediaFile = jwmpEntry ? (entry.entryName !== 'playlist.json') : allowedImageTypes.includes(ext);

                if (isMediaFile) {
                    const destPath = path.join(targetDir, entry.entryName);
                    const entryDir = path.dirname(destPath);
                    if (!fs.existsSync(entryDir)) {
                        fs.mkdirSync(entryDir, { recursive: true });
                    }
                    fs.writeFileSync(destPath, entry.getData());
                    console.log(`[ShareManager] Extracted: ${entry.entryName} to ${destPath}`);
                }
            }

            // Update items with their new local filePaths and unique IDs
            // Note: We use global require here or a shared utility if possible, 
            // but for now we'll require downloadManager to get extractMediaInfo.
            const downloadManager = require('./downloadManager');

            const updatedItems = [];
            for (let i = 0; i < playlistData.items.length; i++) {
                const item = playlistData.items[i];
                const newItem = { ...item };
                
                if (newItem.filePath) {
                    const fileName = path.basename(newItem.filePath);
                    const finalPath = path.join(targetDir, fileName);
                    
                    if (fs.existsSync(finalPath)) {
                        newItem.filePath = finalPath;
                        const { title, thumbnailData } = await downloadManager.extractMediaInfo(finalPath);
                        newItem.thumbnailData = thumbnailData;
                        // Use extracted title if not already present (especially for .jwlplaylist)
                        if (!newItem.title) newItem.title = title || path.basename(fileName, path.extname(fileName));
                    } else if (newItem.mediaType === 'video') {
                        newItem.filePath = null; // Mark as missing so App can trigger download
                    }
                }
                
                newItem.id = `item-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`;
                updatedItems.push(newItem);
            }

            playlistData.items = updatedItems;
            playlistData.id = playlistId;

            return { success: true, playlist: playlistData };
        } catch (error) {
            console.error('[ShareManager] Import failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ShareManager();
