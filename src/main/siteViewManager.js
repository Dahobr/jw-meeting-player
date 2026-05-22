const { ipcMain, WebContentsView, Menu, MenuItem } = require('electron');
const path = require('path');
const downloadManager = require('./downloadManager');

class SiteViewManager {
    constructor() {
        this.siteView = null;
        this.mainWindow = null;
    }

    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.setupIpcHandlers();
        // Export view so main.js can still use it for now if needed, though this should be minimized
        this.getOrInitSiteView(); 
        this.mainWindow.contentView.addChildView(this.siteView);
    }

    getOrInitSiteView() {
        if (this.siteView) return this.siteView;
        if (!this.mainWindow) return null;

        this.siteView = new WebContentsView({
            webPreferences: {
                partition: 'persist:jw_session',
                preload: path.join(__dirname, '../../preload.js'),
                contextIsolation: true,
                backgroundThrottling: false,
                devTools: true
            }
        });

        this.siteView.webContents.session.on('will-download', (event, item, webContents) => {
            downloadManager.handleDownload(event, item, webContents);
        });

        this.siteView.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");

        this.siteView.webContents.setWindowOpenHandler(({ url }) => {
            this.siteView.webContents.loadURL(url);
            return { action: 'deny' };
        });

        this.siteView.webContents.on('context-menu', (event, params) => {
            const menu = new Menu();
            if (params.mediaType === 'image') {
                menu.append(new MenuItem({
                    label: 'Adicionar imagem à playlist',
                    click: async () => {
                        try {
                            const base64Data = await this.siteView.webContents.executeJavaScript(`
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
                            downloadManager.saveBrowserImage(base64Data, params.srcURL);
                        } catch (err) {
                            console.error('[SiteViewManager] Failed to extract image:', err);
                        }
                    }
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            } else if (params.mediaType === 'video') {
                menu.append(new MenuItem({
                    label: 'Adicionar vídeo à playlist',
                    click: () => this.siteView.webContents.downloadURL(params.srcURL)
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            }
            menu.append(new MenuItem({ 
                label: 'Voltar', 
                enabled: this.siteView.webContents.navigationHistory.canGoBack(), 
                click: () => this.siteView.webContents.navigationHistory.goBack() 
            }));
            menu.append(new MenuItem({ 
                label: 'Avançar', 
                enabled: this.siteView.webContents.navigationHistory.canGoForward(), 
                click: () => this.siteView.webContents.navigationHistory.goForward() 
            }));
            menu.append(new MenuItem({ label: 'Recarregar', click: () => this.siteView.webContents.reload() }));
            menu.popup();
        });

        this.siteView.setVisible(false);
        this.mainWindow.contentView.addChildView(this.siteView);

        return this.siteView;
    }

    setupIpcHandlers() {
        ipcMain.on('navigate-site', (event, key) => {
            const view = this.getOrInitSiteView();
            if (!view) return;
            
            view.setVisible(true);
            
            const navUrls = {
                cantico: 'https://www.jw.org/pt/biblioteca/videos/#pt/categories/VODSJJMeetings',
                reunioes: 'https://wol.jw.org/pt/wol/meetings/r5/lp-t/',
                videos: 'https://www.jw.org/pt/biblioteca/videos/#pt/home',
                esbocos: 'https://docs.jw.org/pt/-/pub-s-34mp'
            };
            const url = navUrls[key];
            if (url) {
                view.webContents.loadURL(url);
            }
        });

        ipcMain.on('update-view-bounds', (event, bounds) => {
            if (this.siteView && this.mainWindow) {
                this.siteView.setBounds({
                    x: bounds.x,
                    y: bounds.y + 1,
                    width: bounds.width,
                    height: bounds.height - 1
                });
            }
        });

        ipcMain.on('toggle-webview', (event, visible) => {
            const view = this.getOrInitSiteView();
            if (!view || !this.mainWindow) return;
            
            view.setVisible(visible);
            if (visible) {
                view.webContents.focus();
            }
        });

        ipcMain.on('wol-song-link-clicked', (event, songId) => {
            const view = this.getOrInitSiteView();
            if (view) {
                view.webContents.loadURL('https://www.jw.org/pt/biblioteca/videos/#pt/mediaitems/VODSJJMeetings/pub-sjjm_' + songId + '_VIDEO');
            }
        });
    }
}

module.exports = new SiteViewManager();
