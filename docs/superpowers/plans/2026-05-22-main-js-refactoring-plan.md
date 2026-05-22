# main.js Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modularize `main.js` by delegating responsibilities to dedicated manager modules (`protocol`, `siteView`, `menu`, `content`, `update`).

**Architecture:** Use the existing decentralized IPC pattern (`manager.init()`) to maintain consistency and SRP.

**Tech Stack:** Electron (Node.js/JavaScript).

---

### Task 1: Create and Implement `protocolManager.js`

**Files:**
- Create: `src/main/protocolManager.js`
- Modify: `main.js`

- [ ] **Step 1: Create `src/main/protocolManager.js`**

```javascript
const { protocol, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class ProtocolManager {
    init() {
        protocol.registerSchemesAsPrivileged([
            { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
        ]);

        this.registerMediaProtocol(session.defaultSession);
        this.registerMediaProtocol(session.fromPartition('persist:jw_session'));

        app.on('session-created', (ses) => {
            this.registerMediaProtocol(ses);
        });
    }

    registerMediaProtocol(ses) {
        ses.protocol.registerFileProtocol('media', (request, callback) => {
            let rawPath = request.url.substring(8);
            if (rawPath.startsWith('app/')) rawPath = rawPath.substring(4);
            
            try {
                let decodedPath = decodeURIComponent(rawPath);
                decodedPath = decodedPath.replace(/^\/([a-zA-Z]:)/, '$1');
                if (decodedPath.match(/^[a-zA-Z][\\\/]/)) decodedPath = decodedPath[0] + ':' + decodedPath.substring(1);
                
                let absolutePath = path.normalize(decodedPath);
                if (!path.isAbsolute(absolutePath) && !/^[a-zA-Z]:/.test(absolutePath)) {
                    const baseDir = path.join(app.getPath('userData'), '..');
                    absolutePath = path.resolve(baseDir, absolutePath);
                }

                if (fs.existsSync(absolutePath)) return callback(absolutePath);
                
                const fileName = path.basename(absolutePath);
                const newPath = path.join(app.getPath('userData'), 'JwMeetingPlayer', 'downloads', fileName);
                if (fs.existsSync(newPath)) return callback(newPath);
                
                return callback(-6);
            } catch (error) {
                return callback(-2);
            }
        });
    }
}

module.exports = new ProtocolManager();
```

- [ ] **Step 2: Update `main.js` to use `protocolManager`**

Remove the `protocol.registerSchemesAsPrivileged` call and `registerMediaProtocol` function from `main.js`, and add `const protocolManager = require('./src/main/protocolManager');`. Inside `app.whenReady()`, replace the old protocol calls with `protocolManager.init()`.

- [ ] **Step 3: Commit**
`git add src/main/protocolManager.js main.js`
`git commit -m "refactor: extract protocol management to protocolManager"`

### Task 2: Create and Implement `contentManager.js`

**Files:**
- Create: `src/main/contentManager.js`
- Modify: `main.js`

- [ ] **Step 1: Create `src/main/contentManager.js`**

```javascript
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');

class ContentManager {
    init() {
        ipcMain.handle('get-help-content', () => {
            try {
                const helpPath = path.join(process.resourcesPath, 'HELP.md'); // Adjust for packaging
                // Check local development path as fallback
                const localPath = path.join(__dirname, '..', '..', 'HELP.md');
                const p = fs.existsSync(helpPath) ? helpPath : localPath;
                return marked.parse(fs.readFileSync(p, 'utf8'));
            } catch (err) {
                return '<h1>Error</h1>';
            }
        });

        ipcMain.handle('get-about-content', () => {
            // Similar logic for LICENSE files
        });
    }
}

module.exports = new ContentManager();
```

- [ ] **Step 2: Update `main.js` to use `contentManager`**

Remove `ipcMain.handle('get-help-content', ...)` and `ipcMain.handle('get-about-content', ...)` from `main.js`, and call `contentManager.init()` in `app.whenReady()`.

- [ ] **Step 3: Commit**
`git add src/main/contentManager.js main.js`
`git commit -m "refactor: extract content management to contentManager"`

### Task 3: Create `siteViewManager.js` and `menuManager.js`

**Files:**
- Create: `src/main/siteViewManager.js`
- Create: `src/main/menuManager.js`
- Modify: `main.js`

- [ ] **Step 1: Create `siteViewManager.js`**

Extract `getOrInitSiteView`, `setupSiteView` (renamed to `init`), and related IPC handlers. Needs `mainWindow` as a parameter.

- [ ] **Step 2: Create `menuManager.js`**

Extract `setupContextMenu` logic and handlers.

- [ ] **Step 3: Update `main.js`**

Remove the logic moved to these modules and initialize them.

- [ ] **Step 4: Commit**
`git add src/main/siteViewManager.js src/main/menuManager.js main.js`
`git commit -m "refactor: extract SiteView and Menu management"`

### Task 4: Create `updateManager.js` and Final Cleanup

**Files:**
- Create: `src/main/updateManager.js`
- Modify: `main.js`

- [ ] **Step 1: Create `updateManager.js`**

Extract `autoUpdater` code.

- [ ] **Step 2: Cleanup `main.js`**

Remove the remaining logic and leave only the orchestration code.

- [ ] **Step 3: Commit**
`git add src/main/updateManager.js main.js`
`git commit -m "refactor: extract update management and finalize cleanup"`
