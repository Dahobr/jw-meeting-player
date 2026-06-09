# Share App Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Share this app" button (heart icon) to the footer that copies the app URL to the clipboard.

**Architecture:** 
1. Add button to `src/renderer/index.html` inside the footer's right section.
2. Add CSS styles in `src/renderer/main.css` for button appearance and hover effects.
3. Attach click event listener in `src/renderer/js/eventHandler.js` to perform clipboard copy and show notification.

**Tech Stack:** HTML5, CSS3, Vanilla JS.

---

### Task 1: Add Share Button to HTML

**Files:**
- Modify: `src/renderer/index.html`

- [ ] **Step 1: Insert Share Button HTML**

Locate the `app-version-info` div in `footer.app-footer` and insert the share button just before it:

```html
                <div class="app-version-info">
                    <button id="btn-share-app" class="share-btn" title="Compartilhar este aplicativo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <span id="app-version">v0.0.0</span>
                </div>
```

- [ ] **Step 2: Commit HTML changes**

```bash
git add src/renderer/index.html
git commit -m "feat: add share button to footer"
```

### Task 2: Style Share Button

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Add CSS for Share Button**

Add these styles to `src/renderer/main.css`:

```css
.share-btn {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    margin-bottom: 5px;
}

.share-btn:hover {
    color: var(--danger-color);
    transform: scale(1.1);
}
```

- [ ] **Step 2: Commit CSS changes**

```bash
git add src/renderer/main.css
git commit -m "style: add styles for share button"
```

### Task 3: Implement Share Logic

**Files:**
- Modify: `src/renderer/js/eventHandler.js`

- [ ] **Step 1: Add event listener**

Inside `setupUICallbacks()` in `src/renderer/js/eventHandler.js`:

```javascript
        this.ui.btnShareApp = document.getElementById('btn-share-app');
        if (this.ui.btnShareApp) {
            this.ui.btnShareApp.onclick = async () => {
                try {
                    await navigator.clipboard.writeText('https://dahobr.github.io/jw-meeting-player/');
                    this.ui.showNotification('Endereço de download copiado!');
                } catch (err) {
                    this.ui.showNotification('Erro ao copiar endereço', 'error');
                }
            };
        }
```

- [ ] **Step 2: Commit JS changes**

```bash
git add src/renderer/js/eventHandler.js
git commit -m "feat: implement share button click handler"
```

### Task 4: Final Verification

- [ ] **Step 1: Launch and test**

- Click the heart button.
- Check clipboard for the URL.
- Check for notification in UI.
- Verify hover color change (to red).

- [ ] **Step 2: Final Commit**

```bash
git add .
git commit -m "style: final check and commit for share button"
```
