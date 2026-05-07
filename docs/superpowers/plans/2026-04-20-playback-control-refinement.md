# Playback Control Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a centralized state-driven playback system with refined UI for Play/Pause/Stop and "Year Verse" display.

**Architecture:**
- **Central State**: Managed in `app.js` and reflected in `uiManager.js`.
- **IPC Communication**: Enhanced to handle 'stop' and 'year-verse' commands.
- **Physical Layer**: `playback.js` updated to toggle between elements and show the standby image.

**Tech Stack:** Electron (Main/Renderer), HTML5 Video/Img, CSS.

---

### Task 1: Setup Year Verse Logic (Main Process)

**Files:**
- Modify: `main.js`
- Modify: `src/main/storageManager.js`

- [ ] **Step 1: Implement Year Verse selection and storage**
Update `storageManager.js` to handle saving/loading the year verse path.

```javascript
// src/main/storageManager.js
    // Inside init() or as new methods
    async selectYearVerseImage(mainWindow) {
        const { dialog } = require('electron');
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            // Save to settings or similar (reuse playlists.json for simplicity or a new settings.json)
            this.config.yearVersePath = filePath;
            this.saveConfig();
            return filePath;
        }
        return null;
    }
```

- [ ] **Step 2: Connect IPC in main.js**
Replace placeholders in `main.js` with actual manager calls.

```javascript
// main.js
ipcMain.handle('select-year-verse-image', async () => {
    return await storageManager.selectYearVerseImage(mainWindow);
});

ipcMain.handle('load-year-verse-image-path', async () => {
    return storageManager.config.yearVersePath || null;
});
```

- [ ] **Step 3: Commit**
```bash
git add main.js src/main/storageManager.js
git commit -m "feat: implement year verse selection and storage"
```

### Task 2: Enhance Playback Logic (Playback Renderer)

**Files:**
- Modify: `src/renderer/playback/playback.js`
- Modify: `src/renderer/playback/playback.html`

- [ ] **Step 1: Add Year Verse container to HTML**
```html
<!-- src/renderer/playback/playback.html -->
<div id="playback-container">
    <img id="year-verse-viewer" style="display: none;">
    <video id="video-player" style="display: none;"></video>
    <img id="image-viewer" style="display: none;">
    <!-- ... -->
</div>
```

- [ ] **Step 2: Update playback.js to handle Stop and Year Verse**
```javascript
// src/renderer/playback/playback.js
const yearVerseViewer = document.getElementById('year-verse-viewer');

window.electronAPI.onPlaybackCommand(({ action, ...data }) => {
    if (action === 'stop') {
        showYearVerse();
        return;
    }
    // ... existing actions
});

async function showYearVerse() {
    const path = await window.electronAPI.loadYearVerseImagePath();
    if (path) {
        yearVerseViewer.src = `media://${path}`;
        yearVerseViewer.style.display = 'block';
    } else {
        yearVerseViewer.style.display = 'none'; // Fallback to black
    }
    videoPlayer.style.display = 'none';
    imageViewer.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = "";
    updatePlaybackState(false);
}
```

- [ ] **Step 3: Commit**
```bash
git add src/renderer/playback/playback.js src/renderer/playback/playback.html
git commit -m "feat: implement standby (year verse) display in playback window"
```

### Task 3: State Management & Keyboard (Renderer App)

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Add state tracking and Space key listener**
```javascript
// src/renderer/js/app.js
class App {
    constructor() {
        // ...
        this.status = 'stopped'; // 'stopped', 'playing', 'paused'
    }

    async init() {
        // ...
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
                e.preventDefault();
                this.togglePlayback();
            }
        });
    }

    // Update playMedia to set status
    playMedia(item) {
        // ...
        this.status = 'playing';
        this.store.setCurrentMediaId(item.id); // Add this to store if needed
        // ...
    }

    stopMedia() {
        this.ipc.playbackControl({ action: 'stop' });
        this.status = 'stopped';
        this.currentMedia = null;
        this.updatePlaybackUI();
    }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/renderer/js/app.js
git commit -m "feat: add playback status tracking and space key shortcut"
```

### Task 4: UI Refinement (Renderer UI)

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/js/uiManager.js`
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Add Stop button to footer HTML**
```html
<!-- src/renderer/index.html -->
<button id="btn-stop" title="Parar" style="display: none;">
    <svg width="24" height="24" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" fill="currentColor"/></svg>
</button>
```

- [ ] **Step 2: Update uiManager.js to reflect states**
Implement `updatePlaybackUI(state)` to toggle buttons and highlight list items.

```javascript
// src/renderer/js/uiManager.js
    updatePlaybackUI(status, currentMedia, store) {
        // 1. Footer Buttons
        this.btnStop.style.display = status === 'stopped' ? 'none' : 'flex';
        // ... change play/pause icon ...

        // 2. Playlist Highlighting & Item Icons
        // (Iterate through DOM or re-render with state)
    }
```

- [ ] **Step 3: Commit**
```bash
git add src/renderer/js/uiManager.js src/renderer/index.html src/renderer/main.css
git commit -m "style: implement state-driven UI with highlighting and stop button"
```

### Task 5: Final Integration & Test

- [ ] **Step 1: Verify all transitions**
- Stopped -> Play (Video) -> Pause -> Resume -> Stop
- Stopped -> Play (Image) -> Stop
- Space key toggling
- Playlist item highlighting (Blue background)
