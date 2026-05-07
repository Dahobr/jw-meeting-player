# UI/UX Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the application UI/UX by updating the control bar, adding navigation, and improving visual feedback.

**Architecture:** Modify `src/renderer/index.html` and `src/renderer/main.css` to update layout and styles. Update `src/renderer/main.js` to hook up navigation logic.

**Tech Stack:** HTML5, CSS3, Vanilla JS, Electron IPC.

---

### Task 1: Update Control Bar UI and Playlist Editor Icons

**Files:**
- Modify: `src/renderer/main.css`
- Modify: `src/renderer/index.html`

- [x] **Step 1: Replace text buttons in control bar with SVG icons**
  (Note: Need to add SVG code in `index.html` or external icons)

```html
<!-- Example for Play button -->
<button id="btn-play-pause" title="Play/Pause">
  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
</button>
```

- [x] **Step 2: Add padding and adjust layout in `main.css`**

```css
.playback-controls {
    padding: 10px 20px;
    display: flex;
    gap: 15px;
    align-items: center;
}
```

- [x] **Step 3: Update playlist editor icon colors**

```css
.playlist-edit-btn, .playlist-delete-btn {
    color: #007bff; /* Use a distinct, accessible blue */
}
```

- [x] **Step 4: Commit**
```bash
git add src/renderer/index.html src/renderer/main.css
git commit -m "feat: refactor control bar to icons and improve icon contrast"
```

---

### Task 2: Implement BrowserView Navigation

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/main.js`

- [x] **Step 1: Add navigation buttons to BrowserView container**

```html
<div class="webview-navigation">
    <button id="btn-back">←</button>
    <button id="btn-forward">→</button>
</div>
```

- [x] **Step 2: Hook up navigation in `main.js`**

```javascript
document.getElementById('btn-back').addEventListener('click', () => {
    window.electronAPI.goBack();
});
document.getElementById('btn-forward').addEventListener('click', () => {
    window.electronAPI.goForward();
});
```

- [x] **Step 3: Ensure `preload.js` exposes these methods**
  (Check `preload.js` and add if missing)

- [x] **Step 4: Commit**
```bash
git add src/renderer/index.html src/renderer/main.js
git commit -m "feat: add navigation controls for BrowserView"
```
