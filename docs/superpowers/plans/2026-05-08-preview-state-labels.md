# Preview State Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add neon-style "studio" labels (`PREPARADO` / `NO AR`) to the preview area to clearly show the current media state.

**Architecture:** Use CSS for neon effects and `uiManager.js` to manage label visibility and styling based on the playback state provided by `app.js`.

**Tech Stack:** HTML, CSS, Vanilla JavaScript (Electron Renderer).

---

### Task 1: HTML & CSS Setup

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Add the label element to the preview area**

Insert `<div id="preview-state-label" class="state-label"></div>` into `src/renderer/index.html` inside `#preview-area`, just before the `.preview-media-wrapper`.

```html
<div id="preview-area" class="preview-overlay" style="display: none;">
    <!-- Add this -->
    <div id="preview-state-label" class="state-label"></div>
    
    <div class="preview-media-wrapper">
        <video id="preview-video" muted></video>
        <img id="preview-image" style="display: none;">
    </div>
    ...
</div>
```

- [ ] **Step 2: Add neon styles to main.css**

Add the `.state-label` and its state classes to `src/renderer/main.css`.

```css
/* State Labels for Preview Area */
.state-label {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 16px;
    border-radius: 4px;
    font-weight: 900;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 110;
    display: none;
    pointer-events: none;
}

/* Standby (Amber Neon) */
.state-label.staged {
    display: block;
    color: #f39c12;
    border: 2px solid #f39c12;
    box-shadow: 0 0 15px #f39c12, inset 0 0 5px #f39c12;
    text-shadow: 0 0 5px #f39c12;
}

/* Live (Red Neon) */
.state-label.playing, .state-label.paused {
    display: block;
    color: #e74c3c;
    border: 2px solid #e74c3c;
    box-shadow: 0 0 15px #e74c3c, inset 0 0 5px #e74c3c;
    text-shadow: 0 0 5px #e74c3c;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/index.html src/renderer/main.css
git commit -m "feat: add preview state label element and neon styles"
```

---

### Task 2: UI Logic Implementation

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Initialize the label element in the constructor**

Add `this.stateLabel = document.getElementById('preview-state-label');` to the `UIManager` constructor.

```javascript
// Inside constructor
this.stateLabel = document.getElementById('preview-state-label');
```

- [ ] **Step 2: Update label state in updatePlaybackStateUI**

Modify `updatePlaybackStateUI` in `src/renderer/js/uiManager.js` to update the label's text and classes.

```javascript
updatePlaybackStateUI(status, activeItemId, standbyItemId) {
    // ... existing logic to update list items ...

    // Update Preview Label
    if (this.stateLabel) {
        // Reset
        this.stateLabel.className = 'state-label';
        this.stateLabel.textContent = '';

        if (status === 'playing' || status === 'paused') {
            this.stateLabel.classList.add(status);
            this.stateLabel.textContent = 'NO AR';
        } else if (status === 'staged') {
            this.stateLabel.classList.add('staged');
            this.stateLabel.textContent = 'PREPARADO';
        }
    }
}
```

- [ ] **Step 3: Reset label in hidePreview**

Ensure the label is cleared when the preview is hidden.

```javascript
hidePreview() {
    // ... existing logic ...
    if (this.stateLabel) {
        this.stateLabel.className = 'state-label';
        this.stateLabel.textContent = '';
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/js/uiManager.js
git commit -m "feat: implement preview state label update logic"
```

---

### Task 3: Verification

- [ ] **Step 1: Verify Staged State**
1. Start the app.
2. Select an item from a playlist.
3. Expected: Amber neon label "PREPARADO" appears at the top-center of the preview.

- [ ] **Step 2: Verify Playing State**
1. Click the Play button on the item or the footer.
2. Expected: Label changes to Red neon "NO AR".

- [ ] **Step 3: Verify Stopped State**
1. Click Stop.
2. Expected: Label disappears.

- [ ] **Step 4: Commit and Cleanup**
```bash
# Final check of status
git status
```
