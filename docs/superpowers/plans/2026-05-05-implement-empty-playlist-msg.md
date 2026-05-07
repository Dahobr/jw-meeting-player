# Empty Playlist Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate an "Nenhum item" message in the playlist item list when a selected playlist contains no items.

**Architecture:** Modify `UIManager.renderPlaylistItems` in `src/renderer/js/uiManager.js` to detect an empty list and inject an `<li>` element with a custom CSS class for styling.

**Tech Stack:** JavaScript (DOM manipulation), CSS

---

### Task 1: Add CSS for Empty Playlist Message

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Add `.playlist-empty-msg` class to `src/renderer/main.css`**

```css
.playlist-empty-msg {
    padding: 15px;
    color: #666;
    font-style: italic;
    text-align: left;
    list-style: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/main.css
git commit -m "style: add empty playlist message styling"
```

### Task 2: Implement Empty Message Rendering Logic

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Update `renderPlaylistItems` to handle empty playlist**

Modify the beginning of `renderPlaylistItems(id, playlist)` in `src/renderer/js/uiManager.js`:

```javascript
renderPlaylistItems(id, playlist) {
    this.currentPlaylistTitle.textContent = playlist.name;
    this.itemsList.innerHTML = '';
    
    if (playlist.items.length === 0) {
        const li = document.createElement('li');
        li.className = 'playlist-empty-msg';
        li.textContent = 'Nenhum item';
        this.itemsList.appendChild(li);
        return;
    }

    playlist.items.forEach((item, index) => {
        // ... (existing rendering logic)
```

- [ ] **Step 2: Run verification**
    1. Select a playlist with no items.
    2. Check if "Nenhum item" appears in the item list area.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/js/uiManager.js
git commit -m "feat: show empty playlist message when no items exist"
```
