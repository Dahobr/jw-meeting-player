# Refactoring and Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the JW Media Downloader into a modular, maintainable architecture without adding new features.

**Architecture:** Separation of concerns into Main Process managers, Renderer Data Store, UI Manager, and IPC Client.

**Tech Stack:** Electron, Vanilla JS, CSS.

---

### Task 1: Infrastructure & IPC Stabilization

**Files:**
- Create: `src/main/.gitkeep`, `src/renderer/js/.gitkeep`, `src/renderer/playback/.gitkeep`
- Modify: `preload.js`

- [ ] **Step 1: Create directory structure**
```bash
mkdir -p src/main src/renderer/js src/renderer/playback
touch src/main/.gitkeep src/renderer/js/.gitkeep src/renderer/playback/.gitkeep
```

- [ ] **Step 2: Rewrite preload.js with all required APIs**
Ensure every IPC channel used by the current app is included and properly named.

- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "refactor: setup directory structure and stabilize preload.js"
```

### Task 2: Implement Renderer Data Layer (playlistStore.js)

**Files:**
- Create: `src/renderer/js/playlistStore.js`

- [ ] **Step 1: Create playlistStore.js**
Define a class or object to hold the `playlists` state and `currentPlaylistId`.
Include methods: `init(data)`, `addPlaylist(name)`, `deletePlaylist(id)`, `renamePlaylist(id, newName)`, `addItem(playlistId, item)`, `removeItem(playlistId, itemId)`, `moveItem(itemId, targetId)`.

- [ ] **Step 2: Commit**
```bash
git add src/renderer/js/playlistStore.js
git commit -m "refactor: implement renderer data layer"
```

### Task 3: Implement Main Process Managers

**Files:**
- Create: `src/main/storageManager.js`, `src/main/displayManager.js`, `src/main/downloadManager.js`

- [ ] **Step 1: Create storageManager.js**
Extract logic for reading/writing `playlists.json`.

- [ ] **Step 2: Create displayManager.js**
Extract screen monitoring and playback window management.

- [ ] **Step 3: Create downloadManager.js**
Extract `will-download` logic and metadata extraction.

- [ ] **Step 4: Commit**
```bash
git add src/main/*.js
git commit -m "refactor: implement main process managers"
```

### Task 4: Implement UI Layer & IPC Client

**Files:**
- Create: `src/renderer/js/uiManager.js`, `src/renderer/js/ipcClient.js`
- Modify: `src/renderer/index.html`, `src/renderer/main.css`

- [ ] **Step 1: Create ipcClient.js**
Abstract `window.electronAPI` calls.

- [ ] **Step 2: Create uiManager.js**
Centralize all DOM selection and manipulation. Implement `renderPlaylists()` and `renderPlaylistItems()` templates.

- [ ] **Step 3: Rewrite index.html**
Clean, single-nested structure. Ensure correct IDs for all buttons and containers.

- [ ] **Step 4: Commit**
```bash
git add src/renderer/js/*.js src/renderer/index.html src/renderer/main.css
git commit -m "refactor: implement ui layer and ipc client"
```

### Task 5: Integration & Cleanup

**Files:**
- Create: `src/renderer/js/app.js`
- Modify: `main.js`, `src/renderer/index.html`
- Delete: `playbackWindow.js` (logic moved to displayManager), `src/renderer/main.js` (logic moved to app.js/uiManager)

- [ ] **Step 1: Implement src/renderer/js/app.js**
Entry point for renderer. Connects `playlistStore`, `uiManager`, and `ipcClient`.

- [ ] **Step 2: Update main.js**
Clean entry point. Initializes managers from `src/main/`.

- [ ] **Step 3: Migrate Playback Window files**
Move `playback.html/css/js` to `src/renderer/playback/`.

- [ ] **Step 4: Cleanup redundant files**
Remove `playbackWindow.js` and the old `src/renderer/main.js`.

- [ ] **Step 5: Final Verification**
Run the app and verify all existing features.

- [ ] **Step 6: Commit**
```bash
git add .
git commit -m "refactor: complete modularization and cleanup"
```
