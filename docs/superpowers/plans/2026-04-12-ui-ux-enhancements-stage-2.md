# UI/UX Enhancements Stage 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement drag-and-drop sorting for playlist items, physical file deletion upon item/playlist removal, and automatic file name suffixing to avoid download conflicts.

**Architecture:** 
- **Renderer:** Implement HTML5 Drag and Drop API in `main.js`. Update deletion logic to call a new Electron API for file removal.
- **Preload:** Expose `deleteFile` IPC invoker.
- **Main:** Implement `delete-file` IPC handler. Update `handleDownload` to check for existing files and append numeric suffixes.

**Tech Stack:** Electron, Node.js (fs), JavaScript, HTML5 Drag & Drop.

---

### Task 1: Implement File Name Duplication Avoidance (Main)

**Files:**
- Modify: `main.js`

- [x] **Step 1: Implement unique filename logic in `handleDownload`**

```javascript
// Inside handleDownload in main.js
const downloadDir = path.join(app.getPath('userData'), 'ElectronPlaylistApp', 'downloads');
let currentFilename = item.getFilename();
let filePath = path.join(downloadDir, currentFilename);
const ext = path.extname(currentFilename);
const base = path.basename(currentFilename, ext);

let counter = 1;
while (fs.existsSync(filePath)) {
    filePath = path.join(downloadDir, `${base}(${counter})${ext}`);
    counter++;
}
item.setSavePath(filePath);
```

- [x] **Step 2: Commit**

```bash
git add main.js
git commit -m "feat: avoid download filename conflicts by adding numeric suffixes"
```

---

### Task 2: Implement Physical File Deletion (Main & Preload)

**Files:**
- Modify: `main.js`
- Modify: `preload.js`

- [ ] **Step 1: Add `delete-file` IPC handler in `main.js`**

```javascript
// In main.js, inside app.whenReady()
ipcMain.handle('delete-file', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Main] File deleted: ${filePath}`);
            return { success: true };
        }
        return { success: true }; // Consider success if file already doesn't exist
    } catch (err) {
        console.error('[Main] File Delete Error:', err);
        return { success: false, error: err.code || err.message };
    }
});
```

- [ ] **Step 2: Expose `deleteFile` in `preload.js`**

```javascript
// In preload.js, add to contextBridge
deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
```

- [ ] **Step 3: Commit**

```bash
git add main.js preload.js
git commit -m "feat: implement file deletion IPC"
```

---

### Task 3: Update Deletion Logic with File Removal (Renderer)

**Files:**
- Modify: `src/renderer/main.js`

- [ ] **Step 1: Update `removeItemFromPlaylist` to delete physical file**

```javascript
async function removeItemFromPlaylist(itemId) {
    if (!currentPlaylistId) return;
    const item = playlists[currentPlaylistId].items.find(i => i.id === itemId);
    if (!item) return;

    if (item.filePath) {
        const result = await window.electronAPI.deleteFile(item.filePath);
        if (!result.success && (result.error === 'EBUSY' || result.error === 'EPERM')) {
            alert('再生中はその操作を行えません');
            return;
        }
    }

    playlists[currentPlaylistId].items = playlists[currentPlaylistId].items.filter(i => i.id !== itemId);
    renderPlaylistItems();
    renderPlaylists();
    saveAppData();
}
```

- [ ] **Step 2: Update `deletePlaylist` to delete all contained files**

```javascript
async function deletePlaylist(id) {
    const playlist = playlists[id];
    if (confirm(`Deseja excluir a playlist "${playlist.name}"?`)) {
        // Collect all items to delete
        for (const item of playlist.items) {
            if (item.filePath) {
                await window.electronAPI.deleteFile(item.filePath);
            }
        }
        delete playlists[id];
        if (currentPlaylistId === id) {
            currentPlaylistId = Object.keys(playlists)[0] || null;
        }
        renderPlaylists();
        saveAppData();
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/main.js
git commit -m "feat: delete physical files when items or playlists are removed"
```

---

### Task 4: Implement Drag-and-Drop Sorting (Renderer)

**Files:**
- Modify: `src/renderer/main.js`

- [ ] **Step 1: Add drag attributes and events in `renderPlaylistItems`**

```javascript
// In src/renderer/main.js, update renderPlaylistItems function
playlists[currentPlaylistId].items.forEach((item, index) => {
    const li = document.createElement('li');
    li.dataset.itemId = item.id;
    li.draggable = true;

    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', index);
        li.style.opacity = '0.5';
    });

    li.addEventListener('dragend', () => {
        li.style.opacity = '1';
    });

    li.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    li.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;
        
        if (fromIndex === toIndex) return;

        const items = playlists[currentPlaylistId].items;
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);
        
        renderPlaylistItems();
        saveAppData();
    });
    // ... rest of li content setup ...
});
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/main.js
git commit -m "feat: implement drag-and-drop sorting for playlist items"
```
