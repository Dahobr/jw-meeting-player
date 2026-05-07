# In-List Download Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate download progress indicators directly into the playlist items list (`#playlist-items-ul`) with a border-based progress bar.

**Architecture:** Add a dynamic `li` element to the list for active downloads, using a CSS `::after` element on the `li` for the progress visualization. Update this element via IPC events.

**Tech Stack:** JavaScript (Renderer/Main IPC), Vanilla CSS.

---

### Task 1: CSS Updates for Progress Indicator

**Files:**
- Modify: `src/renderer/playback/playback.css` (assuming that's where list item styles live) or `src/renderer/main.css`. Let's assume `main.css`.

- [ ] **Step 1: Add styles for `.downloading` and progress bar**

```css
/* src/renderer/main.css */

.playlist-item-li.downloading {
    position: relative;
    border-bottom: 4px solid #ddd; /* Background track */
}

.playlist-item-li.downloading::after {
    content: '';
    position: absolute;
    bottom: -4px; /* Align with border-bottom */
    left: 0;
    height: 4px;
    background-color: var(--accent-color, #007bff);
    width: 0%;
    transition: width 0.3s ease;
    z-index: 10;
}
```

### Task 2: Update UIManager to handle downloading state

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Implement `renderDownloadItem`**

```javascript
// src/renderer/js/uiManager.js (add to UIManager class)

renderDownloadItem(itemId, filename) {
    const li = document.createElement('li');
    li.className = 'playlist-item-li downloading';
    li.dataset.id = itemId;
    li.dataset.progress = 0;
    
    li.innerHTML = `
        <div class="item-content">
            <div class="item-info">
                <span class="item-title">${filename} (Baixando...)</span>
            </div>
        </div>
    `;
    this.itemsList.appendChild(li);
}
```

- [ ] **Step 2: Implement `updateDownloadProgress`**

```javascript
// src/renderer/js/uiManager.js (add to UIManager class)

updateDownloadProgress(itemId, percentage) {
    const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
    if (li) {
        li.dataset.progress = percentage;
        li.style.setProperty('--progress-width', `${percentage}%`);
        // Update the pseudo-element style via CSS variable
        li.style.cssText += `--progress-width: ${percentage}%;`;
        // Or update width directly if not using variable
        li.querySelector('.item-title').textContent = `Baixando... ${percentage}%`;
        
        // Manual style update if not using variables
        const afterStyle = document.createElement('style');
        afterStyle.innerHTML = `li[data-id="${itemId}"].downloading::after { width: ${percentage}% !important; }`;
        document.head.appendChild(afterStyle);
    }
}
```

### Task 3: Handle Completion

- [ ] **Step 1: Implement `onDownloadComplete` in UIManager**

```javascript
// src/renderer/js/uiManager.js (add to UIManager class)

onDownloadComplete(itemId, newItemData) {
    const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
    if (li) {
        li.classList.remove('downloading');
        // Re-render the full item properly
        // Or trigger a refresh of the list
    }
}
```

---

I'm using the writing-plans skill to create the implementation plan. Plan complete and saved to `docs/superpowers/plans/2026-05-04-in-list-download-progress.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
