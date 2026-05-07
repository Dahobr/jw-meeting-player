# Context Menu and UI Tweaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a native context menu for BrowserView navigation/downloads, remove obsolete navigation buttons, and improve playlist icon visibility.

**Architecture:** Add a `context-menu` event listener in `main.js` using Electron's `Menu` and `MenuItem`. Update `src/renderer/main.css` for persistent icon coloring. Remove button elements from `src/renderer/index.html` and clean up associated logic in `src/renderer/main.js` and `preload.js`.

**Tech Stack:** Electron (Main/Renderer), JavaScript, CSS.

---

### Task 1: Update Playlist Action Icons Visibility and Color

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Make playlist actions always visible and set default colors**

```css
/* Update these sections in src/renderer/main.css */
.playlist-actions {
  display: flex;
  gap: 10px;
  opacity: 1; /* Always visible */
  transition: opacity 0.2s;
}

.btn-edit {
  color: #3498db; /* Default blue */
}

.btn-delete {
  color: #e74c3c; /* Default red */
}

.btn-edit:hover {
  color: #2980b9; /* Darker blue on hover */
}

.btn-delete:hover {
  color: #c0392b; /* Darker red on hover */
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/main.css
git commit -m "style: make playlist action icons always visible with distinct colors"
```

---

### Task 2: Implement BrowserView Context Menu

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Import Menu and MenuItem in `main.js`**

```javascript
const { app, BrowserWindow, ipcMain, screen, Menu, MenuItem } = require('electron');
```

- [ ] **Step 2: Add context-menu event listener to BrowserView**

```javascript
// Inside createMainWindow function, after view initialization
view.webContents.on('context-menu', (event, params) => {
  const menu = new Menu();

  // Navigation items
  menu.append(new MenuItem({
    label: 'Voltar',
    enabled: view.webContents.canGoBack(),
    click: () => view.webContents.goBack()
  }));

  menu.append(new MenuItem({
    label: 'Avançar',
    enabled: view.webContents.canGoForward(),
    click: () => view.webContents.goForward()
  }));

  menu.append(new MenuItem({
    label: 'Recarregar',
    click: () => view.webContents.reload()
  }));

  menu.append(new MenuItem({ type: 'separator' }));

  // Download item (only if right-clicked on an image)
  if (params.mediaType === 'image') {
    menu.append(new MenuItem({
      label: 'Salvar imagem como...',
      click: () => {
        view.webContents.downloadURL(params.srcURL);
      }
    }));
  }

  menu.popup({ window: mainWindow });
});
```

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat: implement native context menu for BrowserView"
```

---

### Task 3: Remove Obsolete Navigation UI and Logic

**Files:**
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/main.js`
- Modify: `preload.js`
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Remove navigation buttons from `index.html`**

```html
/* Remove .webview-navigation from src/renderer/index.html */
```

- [ ] **Step 2: Clean up logic in `src/renderer/main.js`**

```javascript
/* Remove btnBack, btnForward logic */
```

- [ ] **Step 3: Remove navigation methods from `preload.js`**

```javascript
/* Remove goBack and goForward from electronAPI */
```

- [ ] **Step 4: Remove CSS for navigation buttons in `src/renderer/main.css`**

```css
/* Remove .webview-navigation related styles */
```

- [ ] **Step 5: Commit**

```bash
git add src/renderer/index.html src/renderer/main.js src/renderer/main.css preload.js
git commit -m "cleanup: remove obsolete navigation buttons and logic"
```
