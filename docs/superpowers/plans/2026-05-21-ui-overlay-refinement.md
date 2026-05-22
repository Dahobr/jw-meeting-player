# UI Overlay Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize and refine the visibility logic for UI overlays (Help, Guide, WebView) and the Preview area, ensuring the app transitions back to the Preview screen on media actions.

**Architecture:** 
- Centralize overlay visibility in `UIManager.updateMainOverlay(mode)`.
- mode can be `'preview'`, `'guide'`, `'help'`, or `'webview'`.
- Add `UIManager.ensurePreviewVisible()` as a convenience method for media actions.
- Unify `updatePlaybackUI` logic in `App` and delegate overlay management to `UIManager`.

**Tech Stack:** Vanilla JS, Electron IPC.

---

### Task 1: Refactor UIManager for Centralized Overlay Management

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Add `updateMainOverlay(mode)` to UIManager**

```javascript
    /**
     * Centralized method to manage main content overlays.
     * @param {string} mode - The view mode to display: 'preview', 'guide', 'help', or 'webview'.
     */
    updateMainOverlay(mode) {
        console.log(`[UI] updateMainOverlay: ${mode}`);
        const isPlaylist = this.isPlaylistView();

        // 1. Hide everything by default
        this.previewArea.style.display = 'none';
        this.operationGuide.style.display = 'none';
        this.helpView.style.display = 'none';
        
        // Native WebView visibility
        let webViewVisible = false;

        if (isPlaylist) {
            // In Playlist View, Preview is ALWAYS hidden.
            // One of the overlays MUST be shown.
            switch (mode) {
                case 'help':
                    this.helpView.style.display = 'flex';
                    break;
                case 'webview':
                    webViewVisible = true;
                    break;
                case 'guide':
                case 'preview': // Fallback to guide in playlist view
                default:
                    this.operationGuide.style.display = 'flex';
                    this.previewMediaWrapper.style.display = 'none';
                    this.previewControls.style.display = 'none';
                    if (this.stateLabel) this.stateLabel.style.display = 'none';
                    this.renderOperationGuide(this.zoomModeSelect ? this.zoomModeSelect.value : 'auto');
                    break;
            }
        } else {
            // In Item View, Preview is the base.
            // Overlays can be shown on top or replace it.
            this.previewArea.style.display = 'flex';
            this.previewMediaWrapper.style.display = 'flex';
            this.previewControls.style.display = 'flex';
            if (this.stateLabel) this.stateLabel.style.display = 'block';

            switch (mode) {
                case 'help':
                    this.helpView.style.display = 'flex';
                    this.previewArea.style.display = 'none';
                    break;
                case 'guide':
                    this.operationGuide.style.display = 'flex';
                    this.previewArea.style.display = 'none';
                    this.renderOperationGuide(this.zoomModeSelect ? this.zoomModeSelect.value : 'auto');
                    break;
                case 'webview':
                    webViewVisible = true;
                    this.previewArea.style.display = 'none';
                    break;
                case 'preview':
                default:
                    // Keep previewArea flex (already set above)
                    break;
            }
        }

        if (window.electronAPI && window.electronAPI.toggleWebView) {
            window.electronAPI.toggleWebView(webViewVisible);
        }
    }
```

- [ ] **Step 2: Add `ensurePreviewVisible()` to UIManager**

```javascript
    /**
     * Resets the UI to show the preview area, hiding all overlays.
     */
    ensurePreviewVisible() {
        if (this.isPlaylistView()) return; // Do nothing if in playlist list
        this.updateMainOverlay('preview');
    }
```

- [ ] **Step 3: Update existing methods to use `updateMainOverlay`**

Modify `showHelp`, `showOperationGuide`, `hidePreview`, `switchView` in `uiManager.js` to use `updateMainOverlay`.

### Task 2: Unify updatePlaybackUI in App and PlaybackManager

**Files:**
- Modify: `src/renderer/js/app.js`
- Modify: `src/renderer/js/playbackManager.js`

- [ ] **Step 1: Refactor `app.updatePlaybackUI()`**
Remove the old `if (isStopped && !hasMedia ...)` block and delegate to `ui.updateMainOverlay`.

- [ ] **Step 2: Remove duplicate `updatePlaybackUI` in `playbackManager.js`**
Ensure `PlaybackManager` uses `this.app.updatePlaybackUI()` instead of its own implementation.

### Task 3: Trigger Preview Return on Actions

**Files:**
- Modify: `src/renderer/js/playbackManager.js`
- Modify: `src/renderer/js/eventHandler.js`
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Update `PlaybackManager` actions**
In `prepareStagingMedia`, `playMedia`, `resumePlayback`, `stopMedia`, call `this.ui.ensurePreviewVisible()`.

- [ ] **Step 2: Update `EventHandler` actions**
In `onItemSelect`, `onItemPlay`, and footer button clicks, ensure `ui.ensurePreviewVisible()` is called.

- [ ] **Step 3: Update `App.handleImport()`**
Call `ui.ensurePreviewVisible()` after successfully importing items.

---
