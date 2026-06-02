/**
 * @fileoverview UpdateManager
 * Handles application auto-updates using electron-updater.
 */

const { autoUpdater } = require('electron-updater');
const { dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');

// Log file path in the user data directory
const logFile = path.join(app.getPath('userData'), 'update.log');

/**
 * Simple logger that writes to both console and a file.
 * @param {string} message 
 */
function log(message) {
    const timestamp = new Date().toISOString();
    const fullMessage = `[${timestamp}] [AutoUpdater] ${message}\n`;
    console.log(fullMessage.trim());
    try {
        fs.appendFileSync(logFile, fullMessage);
    } catch (err) {
        console.error('Failed to write to update log:', err);
    }
}

function init() {
    log('Initializing UpdateManager...');

    // 1. Register listeners BEFORE checking for updates to ensure no events are missed.
    autoUpdater.on('checking-for-update', () => {
        log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        log(`Update available: ${info.version}`);
    });

    autoUpdater.on('update-not-available', (info) => {
        log('No update available.');
    });

    autoUpdater.on('error', (err) => {
        log(`Update error: ${err}`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let logMsg = `Download speed: ${progressObj.bytesPerSecond}`;
        logMsg += ` - Downloaded ${progressObj.percent}%`;
        logMsg += ` (${progressObj.transferred}/${progressObj.total})`;
        log(logMsg);
    });

    autoUpdater.on('update-downloaded', (info) => {
        log(`Update downloaded: ${info.version}. Ready to install.`);
        
        // Notify the user that the update is ready.
        dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: `A new version (${info.version}) has been downloaded and is ready to be installed. Would you like to restart now?`,
            buttons: ['Later', 'Restart Now'],
            defaultId: 1
        }).then((result) => {
            if (result.response === 1) {
                log('User chose to install update now.');
                autoUpdater.quitAndInstall();
            } else {
                log('User chose to install update later.');
            }
        });
    });

    // 2. Now start the check
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
        log(`Check for updates failed: ${err}`);
    });
}

module.exports = { init };
