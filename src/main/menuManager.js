/**
 * @fileoverview MenuManager
 * Handles application context menus, global shortcuts, and associated IPC handlers
 * for menu-related interactions.
 */

const { ipcMain, Menu, MenuItem, BrowserWindow, globalShortcut } = require('electron');
const shareManager = require('./shareManager');
const siteViewManager = require('./siteViewManager');

class MenuManager {
    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.setupMenu();
        this.setupIpcHandlers();
        this.setupShortcuts();
    }

    setupMenu() {
        Menu.setApplicationMenu(null);
    }

    setupShortcuts() {
        // Zoom In
        globalShortcut.register('CommandOrControl+=', () => {
            this.adjustZoom(0.1);
        });
        // Zoom Out
        globalShortcut.register('CommandOrControl+-', () => {
            this.adjustZoom(-0.1);
        });
        // Reset Zoom
        globalShortcut.register('CommandOrControl+0', () => {
            this.resetZoom();
        });
        
        globalShortcut.register('F12', () => {
            if (this.mainWindow) {
                this.mainWindow.webContents.toggleDevTools();
            }
        });
    }

    adjustZoom(delta) {
        const view = siteViewManager.getOrInitSiteView();
        // In Electron 31+, getVisible() is used for WebContentsView
        if (view && view.getVisible()) {
            const currentZoom = view.webContents.getZoomFactor();
            view.webContents.setZoomFactor(currentZoom + delta);
        }
    }

    resetZoom() {
        const view = siteViewManager.getOrInitSiteView();
        if (view && view.getVisible()) {
            view.webContents.setZoomFactor(1.0);
        }
    }

    setupIpcHandlers() {
        ipcMain.on('show-playlist-context-menu', (event, playlist) => {
            const menu = new Menu();
            menu.append(new MenuItem({ 
                label: 'Compartilhar', 
                click: async () => {
                    const result = await shareManager.exportPlaylist(playlist);
                    event.sender.send('share-result', result);
                }
            }));
            menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
        });


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
}

module.exports = new MenuManager();
