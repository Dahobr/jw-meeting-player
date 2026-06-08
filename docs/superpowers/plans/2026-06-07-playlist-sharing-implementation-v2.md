# Playlist Sharing System Implementation Plan (V2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement playlist sharing via WhatsApp, including smart export (.jwmp), automatic import, and folder restructuring.

**Architecture:**
1.  **Restructure Storage:** Move media to `downloads/[Playlist_ID]/`.
2.  **UI Integration:** Add WhatsApp button to header; load WhatsApp Web in the app's `WebContentsView`.
3.  **Smart Export:** Create `.jwmp` (ZIP) with images and source URLs for videos. Copy to clipboard.
4.  **Auto Import:** Intercept downloads in `WebContentsView` to handle `.jwmp` and media files.

**Tech Stack:** Electron, Node.js, JavaScript, AdmZip.

---

### Task 1: Data Model & Storage Refactoring

**Files:**
- Modify: `src/main/storageManager.js`
- Modify: `src/renderer/js/playlistStore.js`
- Modify: `src/main/downloadManager.js`

- [ ] **Step 1: Update data model in `PlaylistStore.js`**
  Add `sourceUrl` and `playlistId` support in `addItem` and `updateItem`.
- [ ] **Step 2: Update folder logic in `StorageManager.js`**
  Modify `getDownloadsDir` to accept a `playlistId` or add a helper to resolve playlist-specific paths.
- [ ] **Step 3: Update `DownloadManager.js` to use playlist-specific folders**
  Ensure downloads are saved in `downloads/[playlistId]/`.

### Task 2: WhatsApp UI Integration

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/js/uiManager.js`
- Modify: `src/main/siteViewManager.js`
- Modify: `preload.js`

- [ ] **Step 1: Add WhatsApp button to `index.html`**
  Place it next to `Esboços` in the `navigation-buttons` area. Use the custom SVG icon.
- [ ] **Step 2: Add WhatsApp navigation to `SiteViewManager.js`**
  Register `whatsapp: 'https://web.whatsapp.com'` in `navUrls`.
- [ ] **Step 3: Wire button click in `UIManager.js`**
  Call `window.electronAPI.navigateSite('whatsapp')` on click.

### Task 3: Smart Export Logic (`.jwmp`)

**Files:**
- Create: `src/main/shareManager.js`
- Modify: `src/main/menuManager.js`
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Implement `ShareManager.js`**
  Create a ZIP containing `playlist.json` (metadata). Include image files but only URLs for videos.
- [ ] **Step 2: Implement clipboard copy**
  Copy the generated `.jwmp` file path or buffer to the clipboard.
- [ ] **Step 3: Add "Share" to playlist context menu**
  Update `menuManager.js` to trigger the export.
- [ ] **Step 4: Show user guide in `App.js`**
  Display a notification/modal: "Copied! Paste (Ctrl+V) in WhatsApp."

### Task 4: Automatic Import & Download Monitoring

**Files:**
- Modify: `src/main/downloadManager.js`
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Intercept `.jwmp` downloads**
  In `handleDownload`, detect `.jwmp` extension and trigger import logic.
- [ ] **Step 2: Automatic media addition**
  When regular media is downloaded in WhatsApp view, automatically add it to the current playlist.
- [ ] **Step 3: Background video re-download**
  When importing a playlist, if a video has a `sourceUrl` but no local file, start a background download.
