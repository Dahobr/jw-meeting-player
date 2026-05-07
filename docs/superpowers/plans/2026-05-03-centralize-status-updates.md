# Centralize Status Display Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize the footer status display updates in `updatePlaybackUI()` to ensure consistency across different playback states.

**Architecture:** Update `updatePlaybackUI()` to generate and display status text based on `this.status` and `this.currentMedia`. Remove manual calls to `this.ui.updateCurrentItemInfo()` from other state-changing methods.

**Tech Stack:** JavaScript (Electron Renderer)

---

### Task 1: Create Feature Branch

- [ ] **Step 1: Create and switch to a new branch**

Run: `git checkout -b feat/centralize-status-updates`

### Task 2: Update `updatePlaybackUI` in `src/renderer/js/app.js`

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Add status text generation logic at the beginning of `updatePlaybackUI()`**

```javascript
    updatePlaybackUI() {
        const isStaged = this.status === 'staged';
        const isPlaying = this.status === 'playing';
        const isPaused = this.status === 'paused';
        const isStopped = this.status === 'stopped';
        const isVideo = this.currentMedia?.mediaType?.includes('video');

        // --- Update Status Text ---
        let statusText = 'Parado: Nenhum item';
        if (this.currentMedia) {
            const fileName = this.currentMedia.title || this.currentMedia.filename;
            if (isPlaying) statusText = `Reproduzindo: ${fileName}`;
            else if (isPaused) statusText = `Pausado: ${fileName}`;
            else if (isStaged) statusText = `Preparado: ${fileName}`;
        }
        this.ui.updateCurrentItemInfo(statusText);

        const playIcon = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
```

### Task 3: Remove Redundant Calls in `src/renderer/js/app.js`

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Remove `updateCurrentItemInfo` from `prepareStagingMedia`**

Old:
```javascript
        this.ui.showPreview(fullType, item.filePath, false);
        this.ui.updateCurrentItemInfo(`Preparado: ${item.title || item.filename}`);
        
        this.status = 'staged'; // Use 'staged' for standby
```

New:
```javascript
        this.ui.showPreview(fullType, item.filePath, false);
        
        this.status = 'staged'; // Use 'staged' for standby
```

- [ ] **Step 2: Remove redundant (and buggy) call from `togglePlayback`**

Old:
```javascript
            this.updatePlaybackUI();
            if (this.currentMedia) this.updateCurrentItemInfo(this.currentMedia.title || this.currentMedia.filename);
        } else {
```

New:
```javascript
            this.updatePlaybackUI();
        } else {
```

- [ ] **Step 3: Remove `updateCurrentItemInfo` from `stopMedia`**

Old:
```javascript
            this.currentMedia = null;
            this.standbyItemId = null;
            this.isPlayingOnSlave = false;
            this.ui.updateCurrentItemInfo('Parado: Nenhum item');
            
            // 2. Handle Auto-Standby logic
```

New:
```javascript
            this.currentMedia = null;
            this.standbyItemId = null;
            this.isPlayingOnSlave = false;
            
            // 2. Handle Auto-Standby logic
```

### Task 4: Verification and Commit

- [ ] **Step 1: Verify syntax and basic logic**
- [ ] **Step 2: Commit changes**

Run: `git add src/renderer/js/app.js`
Run: `git commit -m "feat: centralize status display updates in updatePlaybackUI"`
