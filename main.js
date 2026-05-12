/**
 * main.js
 * Main Process Entry Point - Modular and Clean.
 */

const { app, BrowserWindow, ipcMain, Menu, MenuItem, WebContentsView, protocol, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { spawn } = require('child_process');
const { marked } = require('marked');

// Register 'media' as a standard and secure protocol before app is ready
// This is global and affects all sessions
protocol.registerSchemesAsPrivileged([
    { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
]);

// Disable HTTP/2 to fix ERR_HTTP2_PROTOCOL_ERROR
app.commandLine.appendSwitch('disable-http2');

// --- Audio Quality Optimization: Revert to simplest working state ---
// The user said it was best when it only had basic processing disabled.
app.commandLine.appendSwitch('disable-audio-track-processing');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// 起動時間の計測
const startTime = Date.now();
app.on('ready', () => {
    console.log(`[Perf] Time to Ready: ${Date.now() - startTime}ms`);
});

// Helper to register the media protocol on a specific session
function registerMediaProtocol(ses) {
    const sesName = ses === session.defaultSession ? 'default' : 'persist:jw_session';
    console.log(`[Main] Registering 'media' protocol for session: ${sesName}`);

    ses.protocol.registerFileProtocol('media', (request, callback) => {
        // 1. Extract the path from the URL
        // media://app/C:/path... -> app/C:/path...
        // media://C:/path... -> C:/path...
        let rawPath = request.url.substring(8); // Skip 'media://'
        if (rawPath.startsWith('app/')) {
            rawPath = rawPath.substring(4); // Skip 'app/'
        }
        
        try {
            // 2. Decode URL encoding (e.g., %20 -> space)
            let decodedPath = decodeURIComponent(rawPath);
            
            // 3. Fix Windows drive letters: '/C:/Users' or 'C/Users'
            decodedPath = decodedPath.replace(/^\/([a-zA-Z]:)/, '$1'); // Remove leading slash before drive
            if (decodedPath.match(/^[a-zA-Z][\\\/]/)) {
                decodedPath = decodedPath[0] + ':' + decodedPath.substring(1);
            }
            
            // 4. Normalize and resolve
            let absolutePath = path.normalize(decodedPath);
            
            // If it's not absolute, try to resolve it relative to the app's parent dir
            if (!path.isAbsolute(absolutePath) && !/^[a-zA-Z]:/.test(absolutePath)) {
                const baseDir = path.join(app.getPath('userData'), '..');
                absolutePath = path.resolve(baseDir, absolutePath);
            }

            // 5. Check existence and fallback
            if (fs.existsSync(absolutePath)) {
                // console.log(`[Main] Protocol serving: ${absolutePath}`);
                return callback(absolutePath);
            } else {
                console.warn(`[Main] Protocol file NOT FOUND: ${absolutePath}`);
                const fileName = path.basename(absolutePath);
                const newPath = path.join(app.getPath('userData'), 'JwMeetingPlayer', 'downloads', fileName);
                const oldPath = path.join(app.getPath('userData'), 'ElectronPlaylistApp', 'downloads', fileName);
                
                if (fs.existsSync(newPath)) {
                    return callback(newPath);
                }
                if (fs.existsSync(oldPath)) {
                    return callback(oldPath);
                }
                
                // Per design guidelines: MUST return a string, or an error code number.
                // return callback({ error: -6 }); // net::ERR_FILE_NOT_FOUND (Object return is discouraged)
                return callback(-6); // Return error code number directly
            }
        } catch (error) {
            console.error('[Main] Protocol Handler Error:', error, 'for URL:', request.url);
            return callback(-2); // net::ERR_FAILED
        }
    });
}




// Import Managers
const storageManager = require('./src/main/storageManager');
const displayManager = require('./src/main/displayManager');
const downloadManager = require('./src/main/downloadManager');
const { setupZoomIntegration } = require('./zoomIntegration');

let mainWindow;
let siteView;
let mainView; // The UI Layer

function initializeGlobalManagers() {
    storageManager.init();
    displayManager.initGlobal();
}

function createMainWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        x: 0,
        y: 0,
        width: Math.floor(width / 2),
        height: height,
        webPreferences: {
            partition: 'persist:jw_session',
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadFile('src/renderer/index.html');
    mainWindow.setMenuBarVisibility(false);

    // Setup Site View (WebContentsView) - Embedded
    setupSiteView();
    getOrInitSiteView(); 
    mainWindow.contentView.addChildView(siteView);

    // Update references for managers
    displayManager.setMainWindow(mainWindow);
    downloadManager.init(mainWindow);
    
    // Zoom Integration
    setupZoomIntegration(mainWindow, () => displayManager.getPlaybackWindow());

    // Context Menu for Playlist Items
    setupContextMenu();

    mainWindow.on('closed', () => {
        mainWindow = null;
        siteView = null;
        // Close playback window if it exists
        const pbWin = displayManager.getPlaybackWindow();
        if (pbWin) {
            pbWin.close();
        }
    });

    return mainWindow;
}

function getOrInitSiteView() {
    if (siteView) return siteView;
    if (!mainWindow) return null;

    siteView = new WebContentsView({
        webPreferences: {
            partition: 'persist:jw_session',
            contextIsolation: true,
            backgroundThrottling: false
        }
    });

    siteView.webContents.session.on('will-download', (event, item, webContents) => {
        downloadManager.handleDownload(event, item, webContents);
    });

    siteView.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");

    siteView.webContents.setWindowOpenHandler(({ url }) => {
        siteView.webContents.loadURL(url);
        return { action: 'deny' };
    });

    // SiteView Context Menu
    siteView.webContents.on('context-menu', (event, params) => {
        const menu = new Menu();
        if (params.mediaType === 'image') {
            menu.append(new MenuItem({
                label: 'Adicionar imagem à playlist',
                click: async () => {
                    try {
                        console.log(`[Main] Context Menu: Extracting image from SiteView context: ${params.srcURL}`);
                        // Execute script inside SiteView to get base64 data
                        const base64Data = await siteView.webContents.executeJavaScript(`
                            (async () => {
                                const response = await fetch("${params.srcURL}");
                                const blob = await response.blob();
                                return new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                            })()
                        `);
                        console.log(`[Main] Image data extracted successfully. Length: ${base64Data.length}`);
                        downloadManager.saveBrowserImage(base64Data, params.srcURL);
                    } catch (err) {
                        console.error('[Main] Failed to extract image from SiteView:', err);
                    }
                }
            }));
            menu.append(new MenuItem({ type: 'separator' }));
        } else if (params.mediaType === 'video') {
            menu.append(new MenuItem({
                label: 'Adicionar vídeo à playlist',
                click: () => siteView.webContents.downloadURL(params.srcURL)
            }));
            menu.append(new MenuItem({ type: 'separator' }));
        }
        menu.append(new MenuItem({ 
            label: 'Voltar', 
            enabled: siteView.webContents.navigationHistory.canGoBack(), 
            click: () => siteView.webContents.navigationHistory.goBack() 
        }));
        menu.append(new MenuItem({ 
            label: 'Avançar', 
            enabled: siteView.webContents.navigationHistory.canGoForward(), 
            click: () => siteView.webContents.navigationHistory.goForward() 
        }));
        menu.append(new MenuItem({ label: 'Recarregar', click: () => siteView.webContents.reload() }));
        menu.popup();
    });

    // Initially hidden
    siteView.setVisible(false);
    mainWindow.contentView.addChildView(siteView);

    return siteView;
}

function setupSiteView() {
    ipcMain.on('navigate-site', (event, key) => {
        const view = getOrInitSiteView();
        if (!view) return;
        
        view.setVisible(true);
        
        const navUrls = {
            cantico: 'https://www.jw.org/pt/biblioteca/videos/#pt/categories/VODSJJMeetings',
            reunioes: 'https://wol.jw.org/pt/wol/meetings/r5/lp-t/',
            videos: 'https://www.jw.org/pt/biblioteca/videos/#pt/home'
        };
        const url = navUrls[key];
        if (url) {
            console.log(`[Main] Navigating SiteView to: ${url}`);
            view.webContents.loadURL(url);
        }
    });

    ipcMain.on('update-view-bounds', (event, bounds) => {
        if (siteView && mainWindow) {
            siteView.setBounds({
                x: bounds.x,
                y: bounds.y + 1,
                width: bounds.width,
                height: bounds.height - 1
            });
        }
    });

    ipcMain.on('toggle-webview', (event, visible) => {
        const view = getOrInitSiteView();
        if (!view || !mainWindow) return;
        
        console.log(`[Main] toggle-webview: ${visible}`);
        view.setVisible(visible);
        if (visible) {
            view.webContents.focus();
        }
    });
}

function setupContextMenu() {
    ipcMain.on('show-item-context-menu', (event, { itemId, playlists }) => {
        const menu = new Menu();
        const moveSubmenu = new Menu();
        playlists.forEach(p => {
            moveSubmenu.append(new MenuItem({
                label: p.name,
                click: () => event.sender.send('move-item', { itemId, targetPlaylistId: p.id })
            }));
        });
        if (playlists.length > 0) moveSubmenu.append(new MenuItem({ type: 'separator' }));
        moveSubmenu.append(new MenuItem({
            label: 'Criar nova playlist',
            click: () => event.sender.send('move-item', { itemId, targetPlaylistId: 'new' })
        }));
        menu.append(new MenuItem({ label: 'Mover para', submenu: moveSubmenu }));
        menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
    });
}

ipcMain.handle('select-year-verse-image', async () => {
    return await storageManager.selectYearVerseImage(mainWindow);
});

ipcMain.handle('get-help-content', async () => {
    try {
        const helpPath = path.join(__dirname, 'HELP.md');
        if (fs.existsSync(helpPath)) {
            const mdContent = fs.readFileSync(helpPath, 'utf8');
            return marked.parse(mdContent);
        }
        return '<h1>Erro</h1><p>Arquivo HELP.md não encontrado.</p>';
    } catch (err) {
        console.error('[Main] Error reading HELP.md:', err);
        return `<h1>Erro</h1><p>${err.message}</p>`;
    }
});

// App Lifecycle
app.whenReady().then(() => {
    // Register for the default session
    registerMediaProtocol(session.defaultSession);
    
    // Register for our custom session
    registerMediaProtocol(session.fromPartition('persist:jw_session'));
    
    // Ensure any future sessions also get the protocol
    app.on('session-created', (ses) => {
        registerMediaProtocol(ses);
    });

    initializeGlobalManagers();
    storageManager.clearZoomCoords();
    createMainWindow();

    // Register will-download handler globally for all sessions once app is ready
    session.defaultSession.on('will-download', (event, item, webContents) => {
        downloadManager.handleDownload(event, item, webContents);
    });

    app.on('session-created', (ses) => {
        ses.on('will-download', (event, item, webContents) => {
            downloadManager.handleDownload(event, item, webContents);
        });
    });
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
