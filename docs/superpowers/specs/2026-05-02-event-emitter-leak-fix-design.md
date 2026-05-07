# Event Listener Leak Fix & Initialization Refactoring

**Goal:** Resolve the `MaxListenersExceededWarning` by ensuring global event listeners (IPC, Screen, Session) are registered only once during the application lifecycle.

**Core Problem:** 
Currently, `displayManager.init(mainWindow)` and `downloadManager.init(mainWindow)` are called inside `createMainWindow`. If `createMainWindow` is called multiple times (e.g., during app activation or reconnection), it re-attaches listeners to global emitters like `ipcMain`, `screen`, and `session`.

**Refactoring Strategy:**
1.  **Single-Initialization Pattern:** Split the managers' `init` logic into `initGlobal()` (one-time setup) and `setMainWindow(win)` (updating references).
2.  **Move Global Setup:** Invoke `initGlobal()` early in the app lifecycle (outside `createMainWindow`).
3.  **Dynamic Reference Update:** Use the `setMainWindow` method to keep the managers synced with the current active window without re-registering events.

---

## 1. displayManager.js Refactoring

- **Changes:**
    - Move `screen.on` and `ipcMain.on` calls to a new `initGlobal()` method.
    - Add `setMainWindow(win)` to update the internal reference.
    - Ensure `init()` (if kept for legacy compatibility) doesn't duplicate listeners.

## 2. downloadManager.js Refactoring

- **Changes:**
    - Move `session.on('will-download')` and `ipcMain.handle('open-file-dialog')` to a global setup phase.
    - Update `handleDownload` to always use the current active main window.

## 3. main.js Refactoring

- **Changes:**
    - Call global initialization for all managers before `app.whenReady()`.
    - Update `createMainWindow` to only create the window and update manager references, not re-initialize them.
    - Clean up `setupContextMenu` to avoid redundant IPC listener attachments.

## 4. storageManager.js (Verification)
- It already has some `ipcMain.removeHandler` logic, but I will ensure it follows the same "init once" pattern for consistency.

---

## Success Criteria
- [ ] No `MaxListenersExceededWarning` when starting the app or re-creating windows.
- [ ] Media playback, downloads, and display management still function correctly.
- [ ] IPC communication remains stable.
