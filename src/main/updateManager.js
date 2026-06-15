/**
 * @fileoverview UpdateManager
 * Handles application auto-updates using electron-updater.
 */

const { autoUpdater } = require('electron-updater');
const { dialog, app, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// Log file path in the user data directory
const logFile = path.join(app.getPath('userData'), 'update-manager.log');

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

    // Assign detailed logger
    autoUpdater.logger = {
        info: (msg) => log(`[INFO] ${msg}`),
        warn: (msg) => log(`[WARN] ${msg}`),
        error: (msg) => log(`[ERROR] ${msg}`)
    };


    // Enable testing in development mode if dev-app-update.yml exists in the project root
    // if (!app.isPackaged) {
    //     // Look for the config file in the project root (two levels up from src/main)
    //     const devConfigPath = path.join(__dirname, '..', '..', 'dev-app-update.yml');
    //     if (fs.existsSync(devConfigPath)) {
    //         log(`Development config found at: ${devConfigPath}. Enabling forceDevUpdateConfig.`);
    //         autoUpdater.forceDevUpdateConfig = true;
            
    //         try {
    //             const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    //             const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    //             autoUpdater.currentVersion = pkg.version;
    //             log(`Dev Mode: Forcing version to ${pkg.version}`);
    //         } catch (e) {
    //             log(`Dev Mode: Version force failed: ${e.message}`);
    //         }
    //     } else {
    //         log(`Dev Mode: dev-app-update.yml not found at ${devConfigPath}. Update check will be skipped.`);
    //     }
    // }

    // 1. Register listeners
    autoUpdater.on('checking-for-update', () => {
        log('Event: Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
        log(`Event: Update available: ${info.version}`);
    });

    autoUpdater.on('update-not-available', (info) => {
        log('Event: No update available.');
    });

    autoUpdater.on('error', (err) => {
        log(`Event: Error! ${err.stack || err}`);
        
        // If it's a code signing error or other critical update error, 
        // we can notify the user and offer a manual download link.
        if (err.message.includes('signature') || err.message.includes('sha512')) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'Erro na Atualização Automática',
                message: 'Não foi possível validar a segurança da atualização automática. Por favor, baixe a nova versão manualmente no site oficial.',
                buttons: ['OK', 'Abrir Site de Download'],
                defaultId: 1
            }).then((result) => {
                if (result.response === 1) {
                    shell.openExternal('https://dahobr.github.io/jw-meeting-player/');
                }
            });
        }
    });

    autoUpdater.on('download-progress', (progressObj) => {
        // Log progress every 20% to avoid log bloat
        const percent = Math.round(progressObj.percent);
        if (percent % 20 === 0) {
            log(`Event: Download Progress ${percent}%`);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        log(`Event: Update downloaded: ${info.version}.`);
        
        dialog.showMessageBox({
            type: 'info',
            title: 'Atualização Disponível',
            message: `Uma nova versão (${info.version}) foi baixada e está pronta para ser instalada. Deseja reiniciar agora?`,
            buttons: ['Mais tarde', 'Reiniciar Agora'],
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

    // 2. Start the check with explicit tracking
    log('Calling autoUpdater.checkForUpdatesAndNotify()...');
    const updatePromise = autoUpdater.checkForUpdatesAndNotify();

    if (updatePromise && typeof updatePromise.then === 'function') {
        updatePromise.then((result) => {
            // result が null の場合（更新なし）も明確に記録
            if (result) {
                log(`checkForUpdatesAndNotify Promise resolved: Update found (v${result.updateInfo.version})`);
            } else {
                log('checkForUpdatesAndNotify Promise resolved: No update found (up to date).');
            }
        }).catch(err => {
            log(`checkForUpdatesAndNotify Promise REJECTED: ${err.stack || err}`);
        });
    } else {
        log('Warning: checkForUpdatesAndNotify did not return a valid promise.');
    }
}

module.exports = { init };
