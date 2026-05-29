const { ipcMain, Menu, MenuItem, BrowserWindow, globalShortcut } = require('electron');

class MenuManager {
    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.setupMenu();
        this.setupIpcHandlers();
        this.setupShortcuts();
    }

    setupMenu() {
        // Menu bar is hidden by default in main.js. 
        // We set application menu to null to avoid the default Electron menu if needed,
        // or just don't set it at all.
        Menu.setApplicationMenu(null);
    }

    setupShortcuts() {
        globalShortcut.register('F12', () => {
            if (this.mainWindow) {
                this.mainWindow.webContents.toggleDevTools();
            }
        });
    }

    setupIpcHandlers() {
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
