# Playback UI and Logic Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the playback logic to support automatic standby of the next item when the current item stops or ends, and ensure the UI correctly reflects these states.

**Architecture:** Update `App.stopMedia` to identify the next item in the playlist and stage it using `prepareStagingMedia`. Update `updatePlaybackUI` to synchronize the standby state with the UI.

**Tech Stack:** JavaScript (Electron Renderer)

---

### Task 1: Update stopMedia in app.js

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Implement refined stopMedia logic**

```javascript
    stopMedia(reason = 'unknown') {
        console.log(`[App] stopMedia called. Reason: ${reason}`);
        
        // 1. Capture the ID of the item that is currently active or was in standby
        const lastMediaId = this.currentMedia?.id;
        
        // 2. Stop actual playback
        this.ipc.playbackControl({ action: 'stop' });
        this.status = 'stopped';
        this.currentMedia = null;
        this.standbyItemId = null;
        this.isPlayingOnSlave = false;
        this.ui.updateCurrentItemInfo('Nenhum item em reprodução');
        
        // 3. Find the next item for Auto-Standby
        const { playlists, currentPlaylistId } = this.store.getState();
        if (currentPlaylistId && playlists[currentPlaylistId] && lastMediaId) {
            const items = playlists[currentPlaylistId].items;
            const lastIdx = items.findIndex(i => i.id === lastMediaId);
            
            if (lastIdx !== -1 && lastIdx < items.length - 1) {
                const nextItem = items[lastIdx + 1];
                console.log(`[App] Auto-standby for next item: ${nextItem.title || nextItem.filename}`);
                this.prepareStagingMedia(nextItem);
                return; // skip hidePreview
            }
        }

        // 4. End of list or no active item: hide preview
        this.ui.hidePreview();
        this.updatePlaybackUI();
    }
```

- [ ] **Step 2: Commit changes**

```bash
git add src/renderer/js/app.js
git commit -m "feat: implement auto-standby logic in stopMedia"
```

### Task 2: Update updatePlaybackUI in app.js

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Pass standbyItemId to uiManager**

```javascript
    updatePlaybackUI() {
        const isPaused = this.status === 'paused';
        const isPlaying = this.status === 'playing';
        const isVideo = this.currentMedia?.mediaType?.includes('video');
        
        const playIcon = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
        const pauseIcon = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';
        
        const showPlayIcon = !isPlaying || !this.isPlayingOnSlave;
        this.ui.btnPlayPause.innerHTML = showPlayIcon ? playIcon : pauseIcon;

        if (isPaused && this.isPlayingOnSlave) {
            this.ui.btnPlayPause.classList.add('btn-paused-highlight');
        } else {
            this.ui.btnPlayPause.classList.remove('btn-paused-highlight');
        }

        if (this.ui.btnStop) {
            this.ui.btnStop.style.display = this.status === 'stopped' ? 'none' : 'flex';
        }

        // Update call to include standbyItemId
        this.ui.updatePlaybackStateUI(this.status, this.currentMedia?.id, this.standbyItemId);
    }
```

- [ ] **Step 2: Commit changes**

```bash
git add src/renderer/js/app.js
git commit -m "feat: synchronize standby state with UI"
```

### Task 3: Refine togglePlayback in app.js

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Handle Image media in togglePlayback**

```javascript
    togglePlayback() {
        if (this.status === 'stopped') {
            if (this.currentMedia) this.goLive();
            return;
        }
        
        if (this.currentMedia && !this.isPlayingOnSlave) {
            this.goLive();
            return;
        }

        const isVideo = this.currentMedia?.mediaType?.includes('video');
        if (isVideo) {
            if (this.ui.previewVideo.paused) {
                this.ui.previewVideo.play().catch(e => { if(e.name !== 'AbortError') console.error(e); });
                this.ipc.playbackControl({ action: 'play' });
            } else {
                this.ui.previewVideo.pause();
                this.ipc.playbackControl({ action: 'pause' });
            }
        } else {
            // It's an image. If it's already "playing", stop it.
            // Images don't have a "pause" state in the remote display.
            this.stopMedia('toggle click on image');
        }
    }
```

- [ ] **Step 2: Commit changes**

```bash
git add src/renderer/js/app.js
git commit -m "feat: handle image media in togglePlayback"
```

### Task 4: Final Verification and Commit

**Files:**
- Modify: `src/renderer/js/uiManager.js` (Verify it's already updated as per prompt context)

- [ ] **Step 1: Verify uiManager.js already has updatePlaybackStateUI with standbyItemId**

(Checked in research: Yes, it already accepts `standbyItemId` and handles it)

- [ ] **Step 2: Final Git cleanup**

```bash
git add src/renderer/js/app.js src/renderer/js/uiManager.js
git commit -m "feat: implement refined playback logic and state synchronization"
```
