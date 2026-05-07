# Download Error Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement visual error feedback for download failures and unsupported formats, followed by automatic removal from the list after 3 seconds.

**Architecture:** Update `DownloadManager` to notify frontend of unsupported files. Add error handling state to `uiManager.js` to trigger a CSS fade-out animation and remove items after a timeout.

**Tech Stack:** Vanilla JS, CSS.

---

### Task 1: Update UI and CSS for Error Handling

**Files:**
- Modify: `src/renderer/main.css`
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Add CSS for error state**

Add to `src/renderer/main.css`:

```css
.playlist-item-li.error {
    opacity: 1;
    transition: opacity 3s ease;
}

.playlist-item-li.error.fade-out {
    opacity: 0;
}

.item-thumbnail.error-icon::after {
    content: '⚠';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    color: var(--danger-color);
}
```

- [ ] **Step 2: Add `showError` method to `uiManager.js`**

```javascript
    showError(itemId, message) {
        const li = this.itemsList.querySelector(`li[data-id="${itemId}"]`);
        if (!li) return;

        const thumbnail = li.querySelector('.item-thumbnail');
        const titleSpan = li.querySelector('.item-title');
        const typeSpan = li.querySelector('.item-type');

        thumbnail.classList.remove('loading');
        thumbnail.classList.add('error-icon');
        
        titleSpan.textContent = message;
        typeSpan.textContent = 'Erro';
        li.classList.add('error');

        setTimeout(() => {
            li.classList.add('fade-out');
            setTimeout(() => li.remove(), 3000);
        }, 3000);
    }
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/main.css src/renderer/js/uiManager.js
git commit -m "feat: implement download error UI handling"
```

### Task 2: Update DownloadManager to notify on unsupported types

**Files:**
- Modify: `src/main/downloadManager.js`

- [ ] **Step 1: Handle unsupported files**

In `handleDownload`, update the `else` block:

```javascript
        } else {
            this.activeDownloads.delete(downloadId);
            console.warn(`[DownloadManager] Blocked file type: ${finalFilename}`);
            this.mainWindow.webContents.send('download-error', { id: downloadId, message: 'Formato não suportado' });
            item.cancel();
        }
```

- [ ] **Step 2: Update IPC handler in `app.js` (or similar)**

Ensure the renderer listens for `download-error`:

```javascript
// In src/renderer/js/app.js (ensure IPC listener is present)
window.electronAPI.onDownloadError((data) => {
    ui.showError(data.id, data.message);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/main/downloadManager.js src/renderer/js/app.js
git commit -m "feat: notify renderer on unsupported download formats"
```
