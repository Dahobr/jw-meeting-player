# Semi-Auto Mode Wait-for-Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the wait-for-zoom behavior (pausing playback until Zoom sharing is ready) to include "semi-auto" (script) mode.

**Architecture:** Update the `shouldWaitZoom` condition in `src/renderer/js/app.js` to check for both 'auto' and 'script' modes.

**Tech Stack:** JavaScript (Electron Renderer Process)

---

### Task 1: Update Wait-for-Zoom Condition

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Identify all occurrences of `shouldWaitZoom` condition**
    Search for `const shouldWaitZoom` in `src/renderer/js/app.js`.

- [ ] **Step 2: Update the condition in `playMedia` method**
    Replace `this.ui.zoomModeSelect.value === 'auto'` with `['auto', 'script'].includes(this.ui.zoomModeSelect.value)`.

    ```javascript
    // src/renderer/js/app.js
    const shouldWaitZoom = (this.ui.zoomModeSelect && ['auto', 'script'].includes(this.ui.zoomModeSelect.value));
    ```

- [ ] **Step 3: Update the condition in `goLive` method**
    Apply the same change to the `goLive` method's `shouldWaitZoom` definition.

    ```javascript
    // src/renderer/js/app.js
    const shouldWaitZoom = (this.ui.zoomModeSelect && ['auto', 'script'].includes(this.ui.zoomModeSelect.value));
    ```

- [ ] **Step 4: Update the condition in `ipc.onLoadMedia` listener**
    Apply the same change to the `ipc.onLoadMedia` handler's `shouldWaitZoom` definition.

    ```javascript
    // src/renderer/js/app.js
    const shouldWaitZoom = (this.ui.zoomModeSelect && ['auto', 'script'].includes(this.ui.zoomModeSelect.value));
    ```

- [ ] **Step 5: Verify the change**
    1. Select "Zoom: Semiautomático" in the UI.
    2. Play a video.
    3. Verify that the video stays paused until Zoom sharing is signaled (or until manual override).

- [ ] **Step 6: Commit**

```bash
git add src/renderer/js/app.js
git commit -m "feat: enable wait-for-zoom behavior in semi-auto mode"
```
