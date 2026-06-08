# Playlist Sharing Task 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor data model and storage logic to support playlist-specific download folders and source URLs.

**Architecture:** Update `PlaylistStore` to handle new metadata. Update `StorageManager` to provide playlist-specific paths. Update `DownloadManager` to save files in subfolders.

**Tech Stack:** JavaScript (Node.js/Electron), Jest (for testing).

---

### Task 1: Update PlaylistStore.js

**Files:**
- Modify: `src/renderer/js/playlistStore.js`
- Test: `tests/renderer/playlistStore.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/renderer/playlistStore.test.js
const fs = require('fs');
const path = require('path');

// Mock window before requiring the store
global.window = {};
require('../../src/renderer/js/playlistStore.js');
const playlistStore = window.PlaylistStore;

describe('PlaylistStore', () => {
    beforeEach(() => {
        playlistStore.init({ playlists: {} });
    });

    test('addItem should store sourceUrl and playlistId if provided', () => {
        const playlistId = 'test-playlist-1';
        playlistStore.addPlaylist('Test Playlist');
        const realId = playlistStore.currentPlaylistId;
        
        const item = {
            title: 'Test Item',
            sourceUrl: 'https://example.com/video.mp4',
            playlistId: realId
        };
        
        playlistStore.addItem(realId, item);
        const storedItem = playlistStore.getItem(realId, item.id);
        
        expect(storedItem.sourceUrl).toBe('https://example.com/video.mp4');
        expect(storedItem.playlistId).toBe(realId);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/renderer/playlistStore.test.js`
Expected: FAIL

- [ ] **Step 3: Update addItem in PlaylistStore.js**

```javascript
  addItem(playlistId, item) {
    const targetId = playlistId || this.currentPlaylistId;
    if (this.playlists[targetId]) {
      if (!item.id) {
        item.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      // Ensure sourceUrl and playlistId are handled if present in the item object
      // or set if not present but relevant.
      if (!item.playlistId) {
          item.playlistId = targetId;
      }
      this.playlists[targetId].items.push(item);
      this._notify();
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/renderer/playlistStore.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/js/playlistStore.js tests/renderer/playlistStore.test.js
git commit -m "feat: update PlaylistStore to support sourceUrl and playlistId in items"
```

---

### Task 2: Update StorageManager.js

**Files:**
- Modify: `src/main/storageManager.js`
- Test: `tests/main/storageManager.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/main/storageManager.test.js
const storageManager = require('../../src/main/storageManager');
const path = require('path');
const fs = require('fs');

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn().mockReturnValue('mock-user-data'),
        getAppPath: jest.fn().mockReturnValue('mock-app-path')
    },
    ipcMain: {
        on: jest.fn(),
        handle: jest.fn(),
        removeHandler: jest.fn(),
        removeAllListeners: jest.fn()
    },
    shell: { openPath: jest.fn() },
    dialog: { showOpenDialog: jest.fn() }
}));

describe('StorageManager', () => {
    test('getPlaylistDownloadsDir should return path with playlistId', () => {
        const playlistId = 'playlist-123';
        const expectedPath = path.join(storageManager.downloadsDir, playlistId);
        expect(storageManager.getPlaylistDownloadsDir(playlistId)).toBe(expectedPath);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/main/storageManager.test.js`
Expected: FAIL (method not found)

- [ ] **Step 3: Add getPlaylistDownloadsDir to StorageManager.js**

```javascript
    getPlaylistDownloadsDir(playlistId) {
        if (!playlistId) return this.downloadsDir;
        const dir = path.join(this.downloadsDir, playlistId);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/main/storageManager.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/storageManager.js tests/main/storageManager.test.js
git commit -m "feat: add getPlaylistDownloadsDir to StorageManager"
```

---

### Task 3: Update DownloadManager.js

**Files:**
- Modify: `src/main/downloadManager.js`
- Test: `tests/main/downloadManager.test.js`

- [ ] **Step 1: Update saveBrowserImage and handleDownload to use playlist-specific folder**

Modify `saveBrowserImage` to accept `playlistId`.
Modify `handleDownload` to determine `playlistId` (passing it via renderer).

- [ ] **Step 2: Implement logic to pass playlistId from renderer**

In `src/renderer/js/ipcClient.js` (or similar), ensure `save-browser-image` sends `playlistId`.
For `will-download`, use a temporary state in `DownloadManager` or a query parameter in the URL.

*Note: For simplicity, I will first update the methods to accept/use playlistId.*

- [ ] **Step 3: Write tests and implement changes in DownloadManager.js**

(Detailed steps in Task 3 during execution)

- [ ] **Step 4: Commit**

```bash
git add src/main/downloadManager.js
git commit -m "feat: use playlist-specific folders for downloads in DownloadManager"
```
