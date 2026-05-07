# Playback UI and Logic Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine playback control logic and UI to ensure consistency, improve visual feedback, and streamline the layout according to the design spec.

**Architecture:** Update `App` (logic), `UIManager` (DOM/rendering), and `index.html`/`main.css` (layout). Implement a robust state-driven synchronization between item buttons and footer buttons.

**Tech Stack:** Vanilla JavaScript, HTML5, CSS3.

---

### Task 1: UI Layout Refinement (Footer and Global Elements)

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Clean up the footer and reorder elements**
  - Move `.volume-control` to the left.
  - Move `.transport-buttons` to the center.
  - Remove `btn-prev`, `btn-next`, and `btn-fullscreen`.
  - Add `btn-stop` clearly in the center group.

```html
<!-- src/renderer/index.html - Footer Section -->
<footer class="app-footer">
    <div class="playback-controls">
        <div class="volume-control">
            <span class="volume-icon">🔈</span>
            <input type="range" id="volume-slider" min="0" max="100" value="50">
        </div>

        <div class="transport-buttons">
            <button id="btn-play-pause" title="Play/Pause" class="main-transport-btn">
                <svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
            </button>
            <button id="btn-stop" title="Parar" class="main-transport-btn">
                <svg width="24" height="24" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" fill="currentColor"/></svg>
            </button>
        </div>

        <div class="misc-controls">
            <span id="current-item-info">Nenhum item em reprodução</span>
        </div>
    </div>
</footer>
```

- [ ] **Step 2: Update footer CSS for the new layout**
  - Use Flexbox to position left/center/right.

```css
/* src/renderer/main.css */
.playback-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 100%;
}

.volume-control {
    flex: 1;
    display: flex;
    align-items: center;
}

.transport-buttons {
    flex: 2;
    display: flex;
    justify-content: center;
    gap: 20px;
}

.misc-controls {
    flex: 1;
    text-align: right;
    font-size: 0.9em;
    color: #bbb;
}

.main-transport-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: transparent;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}

.main-transport-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 3: Verify the footer layout visually**
- [ ] **Step 4: Commit**
  - `git add src/renderer/index.html src/renderer/main.css`
  - `git commit -m "ui: refine footer layout and remove obsolete buttons"`

---

### Task 2: Item List UI Improvements (Kebab Menu and Backgrounds)

**Files:**
- Modify: `src/renderer/main.css`
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Add CSS for item states and circular buttons**

```css
/* src/renderer/main.css */
.playlist-item-li.standby {
    background-color: #2d3e50 !important;
    border-left: 4px solid #3498db;
}

.playlist-item-li.playing {
    background-color: #1e3a2a !important;
    border-left: 4px solid #2ecc71;
}

.btn-item-action {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: transparent;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

/* Item Action Menu (Kebab) */
.item-more-actions {
    position: relative;
    padding: 5px;
    cursor: pointer;
    color: #888;
}

.item-dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    background: #333;
    border: 1px solid #444;
    border-radius: 4px;
    z-index: 100;
    display: none;
    min-width: 120px;
}

.item-dropdown.show {
    display: block;
}

.item-dropdown-item {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.9em;
}

.item-dropdown-item:hover {
    background-color: #444;
}
```

- [ ] **Step 2: Update `renderPlaylistItems` in `uiManager.js`**
  - Replace Edit/Delete icons with Kebab menu.
  - Apply `btn-item-action` class to the Play button.

```javascript
// src/renderer/js/uiManager.js -> renderPlaylistItems
// Inside the loop:
li.innerHTML = `
    <div class="item-content">
        <div class="item-thumbnail">...</div>
        <div class="item-info">
            <span class="item-title" id="item-name-${item.id}">...</span>
            <input type="text" class="edit-item-input" id="item-input-${item.id}" ...>
            <span class="item-type">${item.mediaType}</span>
        </div>
        <div class="item-actions">
            <button class="btn-play-item btn-item-action" title="Reproduzir">${this.icons.play}</button>
            <div class="item-more-actions" data-id="${item.id}">
                ⋮
                <div class="item-dropdown" id="dropdown-${item.id}">
                    <div class="item-dropdown-item btn-edit-item">Renomear</div>
                    <div class="item-dropdown-item btn-delete-item">Excluir</div>
                </div>
            </div>
        </div>
    </div>
`;
```

- [ ] **Step 3: Implement Dropdown Toggle logic in `uiManager.js`**
  - Handle clicks on the kebab menu to show/hide the dropdown.
  - Close dropdown when clicking elsewhere.

- [ ] **Step 4: Commit**
  - `git add src/renderer/main.css src/renderer/js/uiManager.js`
  - `git commit -m "ui: add item background states and kebab menu for actions"`

---

### Task 3: Refined Playback Logic (State & Synchronization)

**Files:**
- Modify: `src/renderer/js/app.js`
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Update `updatePlaybackStateUI` in `uiManager.js`**
  - Apply `.standby` and `.playing` classes based on the new logic.
  - Ensure item buttons are updated to Stop icon if it's a "Playing" image or a "Paused" video.

```javascript
// src/renderer/js/uiManager.js -> updatePlaybackStateUI(status, activeItemId, standbyItemId)
updatePlaybackStateUI(status, activeItemId, standbyItemId) {
    const items = this.itemsList.querySelectorAll('.playlist-item-li');
    items.forEach(li => {
        const itemId = li.dataset.id;
        const btnPlay = li.querySelector('.btn-play-item');
        
        li.classList.remove('playing', 'standby');
        
        if (itemId == activeItemId && status !== 'stopped') {
            li.classList.add('playing');
            // Logic for Stop/Pause icons...
        } else if (itemId == standbyItemId) {
            li.classList.add('standby');
        }
    });
}
```

- [ ] **Step 2: Update `App` class state and transition logic**
  - Add `standbyItemId` to `App` state.
  - Modify `onItemSelect` to set `standbyItemId` and clear `currentMedia` if not live.
  - Modify `stopMedia` to trigger "Auto-Standby" logic.

- [ ] **Step 3: Implement Auto-Standby logic in `app.js`**

```javascript
// src/renderer/js/app.js -> stopMedia
stopMedia(reason = 'unknown') {
    // ... current stop logic ...
    
    // Auto-Standby Logic
    const { playlists, currentPlaylistId } = this.store.getState();
    const items = playlists[currentPlaylistId].items;
    const currentIndex = items.findIndex(i => i.id === lastActiveId);
    
    if (currentIndex !== -1 && currentIndex < items.length - 1) {
        const nextItem = items[currentIndex + 1];
        this.prepareStagingMedia(nextItem);
    } else {
        this.ui.hidePreview(); // End of list
    }
}
```

- [ ] **Step 4: Synchronize Footer and Item Buttons**
  - Ensure `updatePlaybackUI` in `app.js` calls `ui.updatePlaybackStateUI` with all needed IDs.

- [ ] **Step 5: Verify all state transitions (Video: Play->Pause->Stop, Image: Play->Stop)**
- [ ] **Step 6: Commit**
  - `git add src/renderer/js/app.js src/renderer/js/uiManager.js`
  - `git commit -m "feat: implement refined playback logic and state synchronization"`

---

### Task 4: Final Polish and UI Fixes

**Files:**
- Modify: `src/renderer/main.css`
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Fix Circular Border visibility**
  - Ensure `border` and `background` are defined explicitly for `.btn-item-action` and `.main-transport-btn`.
  - Check if any global CSS was overriding these.

- [ ] **Step 2: Remove Fullscreen and Prev/Next logic from `App`**
  - Clean up `setupUICallbacks` and remove `playNext`, `playPrevious` if they are no longer needed as global commands.

- [ ] **Step 3: Test "End of List" behavior**
  - Verify that stopping the last item restores the BrowserView.

- [ ] **Step 4: Final verification and Commit**
  - `git commit -m "ui: finalize circular borders and clean up obsolete logic"`
