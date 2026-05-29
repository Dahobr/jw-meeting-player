/**
 * @fileoverview ContentManager
 * Handles the loading and IPC providing of help documentation and license information.
 */

const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');

const contentManager = {
    init() {
        ipcMain.handle('get-help-content', async () => {
            try {
                const helpPath = path.join(__dirname, '..', '..', 'HELP.md');
                if (fs.existsSync(helpPath)) {
                    const mdContent = fs.readFileSync(helpPath, 'utf8');
                    return marked.parse(mdContent);
                }
                return '<h1>Erro</h1><p>Arquivo HELP.md não encontrado.</p>';
            } catch (err) {
                console.error('[ContentManager] Error reading HELP.md:', err);
                return `<h1>Erro</h1><p>${err.message}</p>`;
            }
        });

        ipcMain.handle('get-about-content', async () => {
            try {
                const licensePath = path.join(__dirname, '..', '..', 'LICENSE');
                const thirdPartyPath = path.join(__dirname, '..', '..', 'LICENSE-THIRD-PARTY.md');
                
                let content = '<h1>Sobre</h1>';
                if (fs.existsSync(licensePath)) {
                    content += '<h2>Licença</h2><pre>' + fs.readFileSync(licensePath, 'utf8') + '</pre>';
                }
                if (fs.existsSync(thirdPartyPath)) {
                    content += '<h2>Licenças de Terceiros</h2>' + marked.parse(fs.readFileSync(thirdPartyPath, 'utf8'));
                }
                return content;
            } catch (err) {
                console.error('[ContentManager] Error reading license files:', err);
                return `<h1>Erro</h1><p>${err.message}</p>`;
            }
        });
    }
};

module.exports = contentManager;
