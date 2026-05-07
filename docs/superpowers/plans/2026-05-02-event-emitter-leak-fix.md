# Event Listener Leak Fix & Initialization Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the `MaxListenersExceededWarning` by refactoring the main process to ensure global event listeners (IPC, Screen, Session) are registered only once.

**Architecture:** 
1. Move global event registrations to `initGlobal()` methods in each manager.
2. Call `initGlobal()` once at app startup.
3. Update `mainWindow` references dynamically via `setMainWindow()` when windows are created or recreated.
4. Add a verification script to detect potential listener leaks automatically.

**Tech Stack:** JavaScript (Electron Main Process), Node.js EventEmitter

---

### Task 1: Create Listener Leak Verification Script

**Files:**
- Create: `scripts/verify-listeners.js`

- [ ] **Step 1: Write the verification script**
This script will use a mock EventEmitter to simulate the problem and verify our detection logic, or it will be a tool we can use to inspect the live app if needed. For now, we will create a script that checks for multiple identical listeners on an object.

```javascript
const { EventEmitter } = require('events');

function checkLeaks(emitter, eventName, limit = 10) {
    const listeners = emitter.listeners(eventName);
    if (listeners.length > limit) {
        console.error(`[LEAK DETECTED] Event "${eventName}" has ${listeners.length} listeners (limit: ${limit})`);
        return false;
    }
    console.log(`[OK] Event "${eventName}" has ${listeners.length} listeners.`);
    return true;
}

// Example usage / test
const emitter = new EventEmitter();
for (let i = 0; i < 11; i++) {
    emitter.on('test', () => {});
}
checkLeaks(emitter, 'test');
```

- [ ] **Step 2: Commit**

```bash
git add scripts/verify-listeners.js
git commit -m "test: add listener leak verification helper"
```

### Task 2: Refactor storageManager.js

**Files:**
- Modify: `src/main/storageManager.js`

- [ ] **Step 1: Ensure listeners are added only once**
Refactor `init` to be idempotent or separate global IPC registration.

```javascript
    init() {
        if (this.initialized) return; // Prevent multiple initializations
        console.log('[StorageManager] Initializing IPC Handlers...');
        
        // Use .handle once. If it already exists, Electron will throw unless we remove it.
        const handlers = [
            'load-playlists', 'delete-file', 'open-download-folder', 
            'open-year-verse-folder', 'select-year-verse-image', 
            'load-year-verse-image-path', 'get-year-verse-image'
        ];
        handlers.forEach(h => ipcMain.removeHandler(h));

        // Use .on but ensure we don't stack them
        ipcMain.removeAllListeners('save-playlists');
        ipcMain.on('save-playlists', (event, data) => this.savePlaylists(data));
        
        // ... (rest of handles)
        this.initialized = true;
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/storageManager.js
git commit -m "fix: make storageManager initialization idempotent"
```

### Task 3: Refactor downloadManager.js

**Files:**
- Modify: `src/main/downloadManager.js`

- [ ] **Step 1: Separate global session listener from window-specific init**

```javascript
    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.downloadDir = storageManager.getDownloadsDir();

        if (!fs.existsSync(this.downloadDir)) {
            fs.mkdirSync(this.downloadDir, { recursive: true });
        }

        // Global IPC handlers (move to initGlobal if needed, but here we use removeHandler for safety)
        ipcMain.removeHandler('open-file-dialog');
        ipcMain.handle('open-file-dialog', () => this.handleOpenFile());

        // We will call setupWillDownload separately or ensure it's not duplicated
    }

    setupWillDownload(session) {
        // Prevent stacking on the same session
        session.removeAllListeners('will-download');
        session.on('will-download', (event, item) => this.handleDownload(event, item));
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/downloadManager.js
git commit -m "fix: prevent multiple will-download listeners on session"
```

### Task 4: Refactor displayManager.js

**Files:**
- Modify: `src/main/displayManager.js`

- [ ] **Step 1: Split init into global and window-specific parts**

```javascript
    initGlobal() {
        if (this.globalInitialized) return;

        // Screen event listeners (Global)
        screen.removeAllListeners('display-added');
        screen.removeAllListeners('display-removed');
        screen.removeAllListeners('display-metrics-changed');
        
        screen.on('display-added', () => this.onDisplaysChanged());
        screen.on('display-removed', () => this.onDisplaysChanged());
        screen.on('display-metrics-changed', () => this.onDisplaysChanged());

        // IPC Handlers (Global)
        ipcMain.removeHandler('get-displays');
        ipcMain.handle('get-displays', () => this.getDisplays());
        
        ipcMain.removeAllListeners('set-target-display');
        ipcMain.on('set-target-display', (event, displayId) => {
            this.targetDisplayId = displayId;
            console.log(`[DisplayManager] Target display set to: ${displayId}`);
        });

        ipcMain.removeHandler('request-display-status');
        ipcMain.handle('request-display-status', () => {
            const isConnected = screen.getAllDisplays().length > 1;
            return isConnected ? 'connected' : 'waiting';
        });

        ipcMain.removeAllListeners('playback-ready');
        ipcMain.on('playback-ready', (event) => {
            this.loadStandbyImage();
        });

        ipcMain.removeAllListeners('load-media');
        ipcMain.on('load-media', (event, data) => this.loadMedia(data.mediaPath, data.mediaType));
        
        ipcMain.removeAllListeners('playback-control');
        ipcMain.on('playback-control', (event, { action, ...data }) => {
            if (this.playbackWin) {
                this.playbackWin.webContents.send('playback-command', { action, ...data });
            }
            if (this.mainWindow) {
                this.mainWindow.webContents.send('playback-command', { action, ...data });
            }
        });

        this.globalInitialized = true;
    }

    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
        this.checkDisplayStatus();
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/main/displayManager.js
git commit -m "fix: separate global and window-specific initialization in displayManager"
```

### Task 5: Update main.js to use new initialization flow

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Call global inits and refactor createMainWindow**

```javascript
// Before app.whenReady() or inside it once
function initializeGlobalManagers() {
    storageManager.init(); // This sets up IPC
    displayManager.initGlobal();
    // downloadManager global parts if any
}

function createMainWindow() {
    mainWindow = new BrowserWindow({ ... });
    
    // Update references instead of full init
    displayManager.setMainWindow(mainWindow);
    downloadManager.init(mainWindow); // Refactor this to be safe
    
    // ...
}
```

- [ ] **Step 2: Commit**

```bash
git add main.js
git commit -m "refactor: implement single-initialization flow in main process"
```

### Task 3: Automatic Testing / Verification

**Files:**
- Create: `tests/main/initialization.test.js` (Conceptual, using a script if real testing framework isn't setup)

- [ ] **Step 1: Write a script to verify no duplicate listeners are present on live objects**

```javascript
// This can be added to a debug menu or run via a specific flag
function verifyNoLeaks() {
    const { ipcMain, screen } = require('electron');
    const eventsToCheck = ['save-playlists', 'set-target-display', 'playback-ready'];
    
    eventsToCheck.forEach(evt => {
        const count = ipcMain.listenerCount(evt);
        if (count > 1) console.error(`[TEST FAIL] ${evt} has ${count} listeners!`);
        else console.log(`[TEST PASS] ${evt} has ${count} listener.`);
    });
}
```

- [ ] **Step 2: Run verification manually or via CLI**
Since we are in a dev environment, we will verify by restarting the app and checking the console logs for the warning.

- [ ] **Step 3: Commit final cleanup**

```bash
git add .
git commit -m "chore: complete event listener leak fix and verification"
```
