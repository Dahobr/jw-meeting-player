const { ipcMain, Menu, MenuItem, BrowserWindow } = require('electron');

class MenuManager {
    init() {
        this.setupIpcHandlers();
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
