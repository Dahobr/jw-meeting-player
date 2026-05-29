# Navigation Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `onPrevious` and `onNext` navigation buttons in `app.js` to allow looping navigation between playlist items.

**Architecture:** Extend the `App` class in `app.js` to implement `onPrevious` and `onNext` callbacks that interact with `this.playbackManager.playMedia(item)`. Loop through playlist items using index manipulation.

**Tech Stack:** JavaScript (ES6+).

---

### Task 1: Implement Navigation Logic in `App`

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Implement navigation helper methods**

Add the following logic inside the `App` class in `src/renderer/js/app.js` (e.g., after `togglePlayback` or before `handleImport`):

```javascript
    onPrevious() {
        const { playlists, currentPlaylistId } = this.store.getState();
        const playlist = playlists[currentPlaylistId];
        if (!playlist || playlist.items.length === 0) return;

        const items = playlist.items;
        let currentIndex = this.currentMedia ? items.findIndex(i => i.id === this.currentMedia.id) : -1;
        
        // If current media not in playlist or not set, default to last item
        let nextIndex = (currentIndex <= 0) ? items.length - 1 : currentIndex - 1;
        
        this.playbackManager.playMedia(items[nextIndex]);
    }

    onNext() {
        const { playlists, currentPlaylistId } = this.store.getState();
        const playlist = playlists[currentPlaylistId];
        if (!playlist || playlist.items.length === 0) return;

        const items = playlist.items;
        let currentIndex = this.currentMedia ? items.findIndex(i => i.id === this.currentMedia.id) : -1;
        
        // If current media not in playlist or not set, default to first item
        let nextIndex = (currentIndex === -1 || currentIndex >= items.length - 1) ? 0 : currentIndex + 1;
        
        this.playbackManager.playMedia(items[nextIndex]);
    }
```

- [ ] **Step 2: Assign callbacks to `uiManager`**

Modify `init()` method in `App` class to assign these callbacks to `uiManager`:

```javascript
    // In init() method, add:
    this.ui.onPrevious = () => this.onPrevious();
    this.ui.onNext = () => this.onNext();
```

- [ ] **Step 3: Commit changes**

```bash
git add src/renderer/js/app.js
git commit -m "feat: implement navigation button logic with loop support"
```
