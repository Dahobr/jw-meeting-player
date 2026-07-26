/**
 * @fileoverview SiteViewManager
 * Manages the embedded browser view (WebContentsView) used for browsing external sites,
 * handling navigation, and integrating site-specific actions like media downloads.
 */

const { ipcMain, WebContentsView, Menu, MenuItem, shell, net } = require('electron');
const path = require('path');
const downloadManager = require('./downloadManager');

class SiteViewManager {
    constructor() {
        this.siteView = null;
        this.mainWindow = null;
        this._gestureStart = null;
        this._gesturePerformed = false;
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
            if (url.includes('wol.jw.org')) {
                this.mainWindow.webContents.send('set-active-nav', 'reunioes');
                this.siteView.webContents.loadURL(url);
            } else if (url.includes('docs.jw.org')) {
                this.mainWindow.webContents.send('set-active-nav', 'esbocos');
                this.siteView.webContents.loadURL(url);
            } else if (url.includes('jw.org/pt/biblioteca/videos/#pt/categories/VODSJJMeetings')) {
                this.mainWindow.webContents.send('set-active-nav', 'cantico');
                this.siteView.webContents.loadURL(url);
            } else if (url.includes('jw.org')) {
                this.mainWindow.webContents.send('set-active-nav', 'videos');
                this.siteView.webContents.loadURL(url);
            } else if (url.includes('jw-cdn.org') || url.includes('akamaihd.net') || /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url)) {
                // Images/media (e.g. clicking an Esboços image) open on a CDN domain,
                // not jw.org — keep them inside the view so they can be added to the playlist.
                this.siteView.webContents.loadURL(url);
            } else {
                shell.openExternal(url);
            }
            return { action: 'deny' };
        });

        // Handle mouse gestures (Right-click drag for back/forward)
        this.siteView.webContents.on('input-event', (event, input) => {
            if (input.type === 'mouseDown' && input.button === 'right') {
                this.siteView.webContents.focus();
                this._gestureStart = { x: input.x, y: input.y };
                this._gesturePerformed = false;
            } else if (input.type === 'mouseUp' && input.button === 'right' && this._gestureStart) {
                const deltaX = input.x - this._gestureStart.x;
                const deltaY = input.y - this._gestureStart.y;
                const threshold = 60;

                // Check if horizontal movement is dominant and exceeds threshold
                if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
                    if (deltaX < 0 && this.siteView.webContents.navigationHistory.canGoBack()) {
                        this.siteView.webContents.navigationHistory.goBack();
                        this._gesturePerformed = true;
                    } else if (deltaX > 0 && this.siteView.webContents.navigationHistory.canGoForward()) {
                        this.siteView.webContents.navigationHistory.goForward();
                        this._gesturePerformed = true;
                    }
                }
                this._gestureStart = null;
            }
        });

        // Handle site-specific styles and behaviors after each load
        this.siteView.webContents.on('did-finish-load', () => {
            const url = this.siteView.webContents.getURL();
            
            // Hide WOL hover preview popups and tooltips
            if (url.includes('wol.jw.org')) {
                this.siteView.webContents.insertCSS('.pnl-preview, .tooltipContainer { display: none !important; }');
            }

            // Ensure zoom is applied correctly based on the current site
            if (url.includes('web.whatsapp.com')) {
                this.siteView.webContents.executeJavaScript("document.body.style.zoom = '80%';");
            } else {
                this.siteView.webContents.executeJavaScript("document.body.style.zoom = '100%';");
            }
        });

        // Sync navigation button state on URL changes
        const updateNavState = () => {
            const url = this.siteView.webContents.getURL();
            if (url.includes('wol.jw.org')) {
                this.mainWindow.webContents.send('set-active-nav', 'reunioes');
            } else if (url.includes('docs.jw.org')) {
                this.mainWindow.webContents.send('set-active-nav', 'esbocos');
            } else if (url.includes('jw.org/pt/biblioteca/videos/#pt/categories/VODSJJMeetings') || url.includes('jw.org/pt/biblioteca/videos/#pt/mediaitems/VODSJJMeetings')) {
                this.mainWindow.webContents.send('set-active-nav', 'cantico');
            } else if (url.includes('jw.org')) {
                this.mainWindow.webContents.send('set-active-nav', 'videos');
            } else if (url.includes('web.whatsapp.com')) {
                this.mainWindow.webContents.send('set-active-nav', 'whatsapp');
            }
        };
        this.siteView.webContents.on('did-navigate', updateNavState);
        this.siteView.webContents.on('did-navigate-in-page', updateNavState);

        this.siteView.webContents.on('context-menu', (event, params) => {
            if (this._gesturePerformed) {
                this._gesturePerformed = false;
                return;
            }
            const menu = new Menu();
            // On Esboços (docs.jw.org) thumbnails are links to a full-size image rather
            // than inline <img> elements, so also treat an image link as addable and
            // prefer its URL to grab the full-size image instead of the thumbnail.
            const linkIsImage = params.linkURL && /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(params.linkURL);
            if (params.mediaType === 'image' || linkIsImage) {
                const imageURL = linkIsImage ? params.linkURL : params.srcURL;
                menu.append(new MenuItem({
                    label: 'Adicionar imagem à playlist',
                    click: () => this.saveImageToPlaylist(imageURL)
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            } else if (params.mediaType === 'video') {
                menu.append(new MenuItem({
                    label: 'Adicionar vídeo à playlist',
                    click: () => this.siteView.webContents.downloadURL(params.srcURL)
                }));
                menu.append(new MenuItem({ type: 'separator' }));
            }

            if (params.editFlags.canPaste) {
                menu.append(new MenuItem({
                    label: 'Colar',
                    click: () => this.siteView.webContents.paste()
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

    /**
     * Fetches an image and adds it to the playlist. Shared by the reunioes and
     * Esboços right-click "Adicionar imagem à playlist" actions.
     *
     * The request is made from the main process via Electron's net module (using
     * the site view's session so cookies apply). Doing it here rather than with a
     * page-context fetch() avoids CORS — Esboços images are served from a separate
     * CDN (cfs*.jw-cdn.org) that does not send CORS headers.
     * @param {string} srcURL - The URL of the image to fetch and save.
     */
    async saveImageToPlaylist(srcURL) {
        try {
            const base64Data = await this.fetchImageAsDataURL(srcURL);
            downloadManager.saveBrowserImage(base64Data, srcURL);
        } catch (err) {
            console.error('[SiteViewManager] Failed to extract image:', err);
        }
    }

    /**
     * Downloads an image URL from the main process and resolves a base64 data URL.
     * @param {string} url
     * @returns {Promise<string>}
     */
    fetchImageAsDataURL(url) {
        return new Promise((resolve, reject) => {
            const request = net.request({
                url,
                session: this.siteView.webContents.session
            });
            request.on('response', (response) => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`Image request failed with status ${response.statusCode}`));
                    return;
                }
                const contentType = response.headers['content-type'];
                const mime = (Array.isArray(contentType) ? contentType[0] : contentType) || 'image/jpeg';
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const base64 = Buffer.concat(chunks).toString('base64');
                    resolve(`data:${mime};base64,${base64}`);
                });
                response.on('error', reject);
            });
            request.on('error', reject);
            request.end();
        });
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
                esbocos: 'https://docs.jw.org/pt/-/pub-s-34mp',
                whatsapp: 'https://web.whatsapp.com'
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
