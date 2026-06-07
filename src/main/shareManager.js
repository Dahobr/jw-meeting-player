const { app, clipboard } = require('electron');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

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
}

module.exports = new ShareManager();
