# Task 2: Implement File Import Logic (Main & Preload) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ability to import local movie and image files, as well as .jwplaylist files, copying them to the downloads folder and returning metadata.

**Architecture:** Use Electron's `dialog.showOpenDialog` in the main process, handled via `ipcMain.handle`. For .jwplaylist (which are ZIP files), use `adm-zip` to extract images.

**Tech Stack:** Electron (ipcMain, dialog), adm-zip, fs, path, music-metadata.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install adm-zip**

Run: `npm install adm-zip`
Expected: `adm-zip` added to `dependencies` in `package.json`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add adm-zip dependency"
```

### Task 2: Update main.js imports

**Files:**
- Modify: `C:\Users\Daichi\dev\jw-media-downloader\main.js`

- [ ] **Step 1: Add dialog to electron require**

```javascript
const { app, BrowserWindow, ipcMain, screen, Menu, MenuItem, shell, dialog } = require('electron');
```

- [ ] **Step 2: Add adm-zip require**

```javascript
const AdmZip = require('adm-zip');
```

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: add dialog and adm-zip to main.js"
```

### Task 3: Implement open-file-dialog in main.js

**Files:**
- Modify: `C:\Users\Daichi\dev\jw-media-downloader\main.js`

- [ ] **Step 1: Add ipcMain.handle('open-file-dialog', ...)**

Inside `app.whenReady().then(...)`, after other `ipcMain.handle` or `ipcMain.on` calls.

```javascript
  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media Files', extensions: ['mp4', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'jwplaylist'] },
        { name: 'Movies', extensions: ['mp4'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'] },
        { name: 'JW Playlist', extensions: ['jwplaylist'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const importedItems = [];
    const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

    for (const filePath of result.filePaths) {
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.jwplaylist') {
        try {
          const zip = new AdmZip(filePath);
          const zipEntries = zip.getEntries();
          const playlistName = path.basename(filePath, ext);
          const extractedImages = [];

          for (const entry of zipEntries) {
            const entryExt = path.extname(entry.entryName).toLowerCase();
            if (allowedImageTypes.includes(entryExt)) {
              let finalFileName = entry.entryName;
              let finalFilePath = path.join(downloadDir, finalFileName);
              let counter = 1;
              const fileBase = path.basename(finalFileName, entryExt);

              while (fs.existsSync(finalFilePath)) {
                finalFileName = `${fileBase}(${counter})${entryExt}`;
                finalFilePath = path.join(downloadDir, finalFileName);
                counter++;
              }

              fs.writeFileSync(finalFilePath, entry.getData());
              
              const buffer = fs.readFileSync(finalFilePath);
              let mimeType = 'image/' + entryExt.slice(1);
              if (entryExt === '.jpg') mimeType = 'image/jpeg';
              if (entryExt === '.svg') mimeType = 'image/svg+xml';
              const thumbnailData = `data:${mimeType};base64,${buffer.toString('base64')}`;

              extractedImages.push({
                filename: finalFileName,
                filePath: finalFilePath,
                type: entryExt,
                thumbnailData
              });
            }
          }
          importedItems.push({ type: 'playlist', name: playlistName, items: extractedImages });
        } catch (err) {
          console.error('[Main] JWPlaylist Error:', err);
        }
      } else {
        // Individual movie or image
        let finalFileName = path.basename(filePath);
        const fileExt = path.extname(finalFileName);
        const fileBase = path.basename(finalFileName, fileExt);
        let finalFilePath = path.join(downloadDir, finalFileName);
        let counter = 1;

        while (fs.existsSync(finalFilePath)) {
          finalFileName = `${fileBase}(${counter})${fileExt}`;
          finalFilePath = path.join(downloadDir, finalFileName);
          counter++;
        }

        fs.copyFileSync(filePath, finalFilePath);

        let thumbnailData = null;
        let title = null;

        if (ext === '.mp4') {
          try {
            const metadata = await mm.parseFile(finalFilePath);
            title = metadata.common.title || null;
            const picture = mm.selectCover(metadata.common.picture);
            if (picture) {
              thumbnailData = `data:${picture.format};base64,${picture.data.toString('base64')}`;
            }
          } catch (err) {
            console.error('[Main] Metadata Error:', err);
          }
        } else if (allowedImageTypes.includes(ext)) {
          const buffer = fs.readFileSync(finalFilePath);
          let mimeType = 'image/' + ext.slice(1);
          if (ext === '.jpg') mimeType = 'image/jpeg';
          if (ext === '.svg') mimeType = 'image/svg+xml';
          thumbnailData = `data:${mimeType};base64,${buffer.toString('base64')}`;
        }

        importedItems.push({
          type: 'file',
          filename: finalFileName,
          filePath: finalFilePath,
          mediaType: ext === '.mp4' ? 'video' : 'image',
          title,
          thumbnailData
        });
      }
    }

    return importedItems;
  });
```

- [ ] **Step 2: Commit**

```bash
git add main.js
git commit -m "feat: implement open-file-dialog IPC handler"
```

### Task 4: Update preload.js

**Files:**
- Modify: `C:\Users\Daichi\dev\jw-media-downloader\preload.js`

- [ ] **Step 1: Add openFileDialog to electronAPI**

```javascript
  // File System IPC
  openDownloadFolder: () => ipcRenderer.send('open-download-folder'),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
});
```

- [ ] **Step 2: Commit**

```bash
git add preload.js
git commit -m "feat: expose openFileDialog in preload.js"
```
