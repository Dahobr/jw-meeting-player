# Download Timeout Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a timeout mechanism for ongoing downloads to prevent them from getting stuck indefinitely.

**Architecture:** Utilize `setTimeout` and `clearTimeout` in `downloadManager.js` to track download progress. A timeout will trigger `item.cancel()` and send an error notification to the renderer.

**Tech Stack:** JavaScript (Node.js/Electron Main Process).

---

### Task 1: Implement Timeout Logic in `downloadManager.js`

**Files:**
- Modify: `src/main/downloadManager.js`

- [ ] **Step 1: Initialize timeout storage and constant**

Add the following at the beginning of the `DownloadManager` class (e.g., after `constructor`):

```javascript
    timeoutMap = new Map();
    DOWNLOAD_TIMEOUT_MS = 60000; // 60 seconds
```

- [ ] **Step 2: Implement `startTimeout` method**

Add the following method to the `DownloadManager` class:

```javascript
    startTimeout(downloadId, item, filename) {
        this.clearTimeout(downloadId); // Clear any existing timeout
        this.timeoutMap.set(downloadId, setTimeout(() => {
            console.warn(`[DownloadManager] Download timed out for ${filename} (ID: ${downloadId})`);
            item.cancel(); // Cancel the Electron DownloadItem
            this.mainWindow.webContents.send('download-error', { 
                id: downloadId, 
                message: 'Download timed out', 
                filename: filename 
            });
            this.activeDownloads.delete(downloadId); // Clean up active downloads
            this.clearTimeout(downloadId); // Clear timeout after handling
        }, this.DOWNLOAD_TIMEOUT_MS));
    }
```

- [ ] **Step 3: Implement `clearTimeout` method**

Add the following method to the `DownloadManager` class:

```javascript
    clearTimeout(downloadId) {
        if (this.timeoutMap.has(downloadId)) {
            clearTimeout(this.timeoutMap.get(downloadId));
            this.timeoutMap.delete(downloadId);
        }
    }
```

- [ ] **Step 4: Integrate timeout in `handleDownload` (Start)**

In `handleDownload`, when `allowedFileTypes` check passes, call `startTimeout` **after** `this.mainWindow.webContents.send('download-started', ...)`:

```javascript
        if (allowedFileTypes.includes(path.extname(finalFilename).toLowerCase())) {
            this.mainWindow.webContents.send('download-started', { filename: finalFilename, id: downloadId });
            item.setSavePath(finalFilePath);
            this.startTimeout(downloadId, item, finalFilename); // Start timeout here
            
            item.on('updated', (event, state) => {
                if (state === 'progressing') {
                    const received = item.getReceivedBytes();
                    const total = item.getTotalBytes();
                    const progress = total > 0 ? Math.round((received / total) * 100) : 0;
                    console.log(`[DownloadManager] Progressing: ${downloadId} -> ${progress}%`);
                    this.mainWindow.webContents.send('download-progress', { id: downloadId, progress, filename });
                    // Reset timeout on progress
                    this.startTimeout(downloadId, item, finalFilename); 
                }
            });
```

- [ ] **Step 5: Integrate timeout in `handleDownload` (Completion/Error)**

In `handleDownload`, inside `item.on('done', ...)` callback, call `clearTimeout` for both `completed` and `else` (failed) cases:

```javascript
            item.on('done', async (event, state) => {
                this.activeDownloads.delete(downloadId);
                this.clearTimeout(downloadId); // Clear timeout on done
                if (state === 'completed') {
                    // ... existing logic ...
                } else {
                    // ... existing logic ...
                }
            });
```

- [ ] **Step 6: Commit**

```bash
git add src/main/downloadManager.js
git commit -m "feat: implement download timeout mechanism"
```
