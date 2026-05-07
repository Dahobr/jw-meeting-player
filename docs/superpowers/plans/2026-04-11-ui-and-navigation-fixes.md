# UI and Navigation Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve playlist icon visibility when active and force `target="_blank"` links to open in the current BrowserView.

**Architecture:** Use `setWindowOpenHandler` on `view.webContents` in `main.js`. Update CSS selectors in `src/renderer/main.css` to handle active states for icons.

**Tech Stack:** Electron (Main), CSS.

---

### Task 1: Update Active Playlist Icon Colors

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Add CSS for active playlist icons**

```css
/* Update src/renderer/main.css */
.playlist-item-card.active .btn-action {
  color: #ffffff; /* White for better visibility on blue background */
}

/* Ensure hover state is also white or very light */
.playlist-item-card.active .btn-action:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/main.css
git commit -m "style: fix active playlist icon visibility"
```

---

### Task 2: Force New Windows to Open in Same View

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Add setWindowOpenHandler to view.webContents**

```javascript
// Inside createMainWindow in main.js, near other view setup
view.webContents.setWindowOpenHandler(({ url }) => {
  view.webContents.loadURL(url);
  return { action: 'deny' };
});
```

- [ ] **Step 2: Commit**

```bash
git add main.js
git commit -m "feat: force target='_blank' links to open in the current BrowserView"
```
