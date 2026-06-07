const { app, clipboard } = require('electron');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const storageManager = require('./storageManager');

class ShareManager {
    constructor() {
        this.tempDir = path.join(app.getPath('temp'), 'jw-meeting-player-export');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Exports a playlist to a .jwmp (ZIP) file and copies it to the clipboard.
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

            // Add image files to ZIP
            for (const item of playlist.items) {
                if (item.mediaType === 'image' && item.filePath && fs.existsSync(item.filePath)) {
                    // Use the filename from the path to avoid directory structure in ZIP
                    const fileName = path.basename(item.filePath);
                    zip.addLocalFile(item.filePath);
                    console.log(`[ShareManager] Added image to ZIP: ${fileName}`);
                }
            }

            const exportFileName = `${playlist.name.replace(/[/\\?%*:|"<>]/g, '-')}.jwmp`;
            const exportFilePath = path.join(this.tempDir, exportFileName);

            // Write ZIP file
            zip.writeZip(exportFilePath);
            console.log(`[ShareManager] Exported to: ${exportFilePath}`);

            // Copy file to clipboard
            // On Windows and macOS, Electron supports copying files via 'filenames'
            clipboard.write({
                filenames: [exportFilePath]
            });

            return { success: true, filePath: exportFilePath };
        } catch (error) {
            console.error('[ShareManager] Export failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Imports a playlist from a .jwmp file.
     * @param {string} filePath - Path to the .jwmp file.
     * @returns {Object} result - Success status and the imported playlist data.
     */
    async importPlaylist(filePath) {
        try {
            console.log(`[ShareManager] Importing playlist from: ${filePath}`);
            const zip = new AdmZip(filePath);
            const zipEntries = zip.getEntries();
            
            const playlistEntry = zipEntries.find(e => e.entryName === 'playlist.json');
            if (!playlistEntry) {
                throw new Error('Invalid .jwmp file: playlist.json not found');
            }

            const playlistData = JSON.parse(playlistEntry.getData().toString('utf8'));
            const playlistId = `playlist-${Date.now()}`;
            const targetDir = storageManager.getPlaylistDownloadsDir(playlistId);

            // Extract images to the playlist folder
            for (const entry of zipEntries) {
                if (entry.entryName !== 'playlist.json') {
                    const destPath = path.join(targetDir, entry.entryName);
                    // Ensure the target directory exists
                    const entryDir = path.dirname(destPath);
                    if (!fs.existsSync(entryDir)) {
                        fs.mkdirSync(entryDir, { recursive: true });
                    }
                    fs.writeFileSync(destPath, entry.getData());
                    console.log(`[ShareManager] Extracted: ${entry.entryName} to ${destPath}`);
                }
            }

            // Update items with their new local filePaths and unique IDs
            playlistData.items = playlistData.items.map((item, index) => {
                const newItem = { ...item };
                if (newItem.mediaType === 'image' && newItem.filePath) {
                    const fileName = path.basename(newItem.filePath);
                    newItem.filePath = path.join(targetDir, fileName);
                }
                // Generate a unique ID for each item
                newItem.id = `item-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
                return newItem;
            });

            playlistData.id = playlistId;

            return { success: true, playlist: playlistData };
        } catch (error) {
            console.error('[ShareManager] Import failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ShareManager();
