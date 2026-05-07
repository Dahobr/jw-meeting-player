# Second Display Functionality Implementation Plan (Revised)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automatic second display detection for playback. If a second monitor is detected, automatically show a borderless, fullscreen playback window. If not, show a "Waiting for second monitor" status in the main window.

**Architecture:**
- **Main Process (`playbackWindow.js`):** Monitor screen connection events. Open/close the borderless playback window automatically when a second display is added/removed.
- **Renderer Process:** Main window listens to playback window status and displays connection status if needed.
- **IPC:** Communicate display status updates between main and renderer.

---

### Task 1: Refactor playbackWindow.js for Automatic Detection

**Files:**
- Modify: `playbackWindow.js`
- Modify: `main.js`

- [ ] **Step 1: Implement automatic detection in playbackWindow.js**

```javascript
// playbackWindow.js
function handleDisplayEvents() {
  screen.on('display-added', createPlaybackWindowIfPossible);
  screen.on('display-removed', closePlaybackWindow);
  createPlaybackWindowIfPossible(); // Initial check
}
```

- [ ] **Step 2: Cleanup createPlaybackWindow**

Ensure the window is borderless, fullscreen, and lacks UI controls. Remove always-on-top interval logic if it's no longer needed for the simplified design.

- [ ] **Step 3: Commit**

```bash
git add playbackWindow.js main.js
git commit -m "feat: implement automatic second display detection"
```

### Task 2: Simplify Playback Window UI

**Files:**
- Modify: `playback.html`
- Modify: `playback.css`
- Modify: `playback.js`

- [ ] **Step 1: Remove unnecessary UI elements from playback.html**

Keep only the media containers.

- [ ] **Step 2: Simplify CSS for fullscreen playback**

```css
body { background: black; margin: 0; overflow: hidden; }
#video-player, #image-viewer { width: 100vw; height: 100vh; object-fit: contain; }
```

- [ ] **Step 3: Remove unnecessary UI logic from playback.js**

- [ ] **Step 4: Commit**

```bash
git add playback.html playback.css playback.js
git commit -m "feat: simplify playback window UI"
```

### Task 3: Status Notification in Main Window

**Files:**
- Modify: `src/renderer/main.js`
- Modify: `main.js`

- [ ] **Step 1: Add IPC notification for display status**

- [ ] **Step 2: Add status indicator to index.html/main.js**

- [ ] **Step 3: Commit**

```bash
git add src/renderer/main.js main.js
git commit -m "feat: add second display status notification"
```
