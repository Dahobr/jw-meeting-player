/**
 * @fileoverview UpdateManager
 * Handles application auto-updates using electron-updater.
 */

const { autoUpdater } = require('electron-updater');

function init() {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', (info) => {
        console.log('[AutoUpdater] Update available:', info.version);
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log('[AutoUpdater] No update available.');
    });

    autoUpdater.on('error', (err) => {
        console.log('[AutoUpdater] Update error:', err);
    });
}

module.exports = { init };
