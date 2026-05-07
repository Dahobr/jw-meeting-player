# Thumbnail Circular Progress Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current bottom progress bar with a centered, circular progress indicator inside the thumbnail.

**Architecture:** Use CSS custom properties (`--progress`) on the `.item-thumbnail` element. Update this property via `uiManager.js` to trigger CSS-based circular progress animations via `conic-gradient`.

**Tech Stack:** Vanilla CSS, JavaScript (DOM manipulation).

---

### Task 1: Update CSS for Circular Progress Indicator

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Define CSS for circular progress**

Add the following to `src/renderer/main.css`:

```css
.item-thumbnail {
    position: relative;
    /* Existing styles */
}

.item-thumbnail.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 30px;
    height: 30px;
    margin: -15px 0 0 -15px;
    border-radius: 50%;
    background: conic-gradient(var(--primary-color) calc(var(--progress) * 1%), #ddd 0);
    mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/main.css
git commit -m "feat: add css for circular progress indicator"
```

### Task 2: Refactor `uiManager.js` to support new progress logic

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Update `renderDownloadItem`**

Update `renderDownloadItem` in `uiManager.js` to add the `loading` class:

```javascript
    renderDownloadItem(itemId, filename) {
        const li = document.createElement('li');
        li.className = 'playlist-item-li downloading';
        li.dataset.id = itemId;
        li.dataset.progress = 0;
        
        li.innerHTML = `
            <div class="item-content">
                <div class="item-thumbnail loading" style="--progress: 0;"></div>
                <div class="item-info">
                    <span class="item-title">${filename} (Baixando...)</span>
                </div>
            </div>
        `;
        this.itemsList.appendChild(li);
    }
```

- [ ] **Step 2: Update `updateDownloadProgress`**

Update `updateDownloadProgress` to remove old `<style>` injection and use `style.setProperty`:

```javascript
    updateDownloadProgress(itemId, percentage, filename) {
        const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (li) {
            li.dataset.progress = percentage;
            const thumbnail = li.querySelector('.item-thumbnail');
            if (thumbnail) {
                thumbnail.style.setProperty('--progress', percentage);
                if (percentage >= 100) {
                    thumbnail.classList.remove('loading');
                }
            }
            
            const titleSpan = li.querySelector('.item-title');
            if (titleSpan) {
                titleSpan.textContent = `${filename} (${percentage}%)`;
            }
        }
    }
```

- [ ] **Step 3: Cleanup old styles**

Remove the logic that handles `style-progress-${itemId}` elements from `updateDownloadProgress` as they are no longer needed.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/js/uiManager.js
git commit -m "feat: update uiManager to use circular progress"
```
