# Physical File Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement physical file deletion functionality to allow users to remove media files from the disk.

**Architecture:** Use Electron's IPC (Inter-Process Communication) to send a deletion request from the renderer process to the main process. The main process will use Node.js `fs.unlinkSync` to perform the actual deletion and return a success/error status.

**Tech Stack:** Electron (IPC), Node.js (fs module)

---

### Task 1: Implement IPC Handler in Main Process

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Add 'delete-file' IPC handler**

In `main.js`, inside `app.whenReady().then(() => { ... })`, add the following handler:

```javascript
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Main] File deleted: ${filePath}`);
        return { success: true };
      } else {
        console.warn(`[Main] Delete failed: File not found - ${filePath}`);
        return { success: false, error: 'File not found' };
      }
    } catch (err) {
      console.error(`[Main] Delete Error: ${err.message}`);
      return { success: false, error: err.message };
    }
  });
```

- [ ] **Step 2: Verify syntax and placement**
Ensure it's placed within the `app.whenReady()` block, ideally near other `ipcMain` handlers.

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: implement delete-file IPC handler in main process"
```

### Task 2: Expose Deletion Method in Preload Script

**Files:**
- Modify: `preload.js`

- [ ] **Step 1: Add deleteFile to electronAPI**

In `preload.js`, add `deleteFile` to the `contextBridge.exposeInMainWorld('electronAPI', { ... })` object:

```javascript
  // File Deletion IPC
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
```

- [ ] **Step 2: Commit**

```bash
git add preload.js
git commit -m "feat: expose deleteFile method in preload script"
```

### Task 3: Verification (Optional but Recommended)

Since this is a CLI environment without a running GUI, we can't easily "run" the app to test. However, we can verify the code changes.

- [ ] **Step 1: Verify main.js changes**
- [ ] **Step 2: Verify preload.js changes**

### Task 4: Final Commit (as requested)

The user requested a specific commit message for the combined changes.

- [ ] **Step 1: Combine and commit**

If tasks were committed separately, this step is for the final state. If not, commit all changes now with:
`feat: implement file deletion IPC`
