# Direct Casting (Mirroring) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement "Direct Casting" functionality to mirror Site View content to a second monitor with Zoom integration, including conflict resolution logic.

**Architecture:** Add a toggle in the header. ON activates an overlay (`WebContentsView`) on Site View and syncs navigation/state to `PlaybackWindow` when a playback action occurs. Zoom sharing (Alt+S) is triggered automatically on sync.

**Tech Stack:** Electron (IPC, `WebContentsView`), CSS.

---

### Task 1: UI Implementation (Toggle, Controls, Overlay)

**Files:**
- Modify: `src/renderer/index.html` (Add toggle and control bar container)
- Modify: `src/renderer/main.css` (Style controls bar)
- Modify: `src/renderer/js/uiManager.js` (Toggle logic and controls visibility)
- Create: `src/renderer/overlay.html` (Transparent overlay HTML)

- [ ] **Step 1: Add HTML toggle container, control bar (URL, Zoom, Mobile), and overlay container in header**
- [ ] **Step 2: Implement toggle switch CSS and control bar visibility logic (only when ON)**
- [ ] **Step 3: Update `uiManager.js` to enable/disable toggle based on view state**
- [ ] **Step 4: Create transparent overlay HTML with CSS frame**
- [ ] **Step 5: Commit**

### Task 2: Backend Logic and Overlay Management

**Files:**
- Modify: `src/main/siteViewManager.js` (Add Overlay `WebContentsView`, Mirroring IPC handlers)
- Modify: `src/main/displayManager.js` (Receive sync commands, handle playback/standby)

- [ ] **Step 1: Update `SiteViewManager` to manage transparent `WebContentsView` overlay**
- [ ] **Step 2: Implement IPC handler to update overlay bounds/frame size on `SiteView` resize**
- [ ] **Step 3: Update `DisplayManager` to accept mirroring commands (URL, scroll, zoom, device emulation)**
- [ ] **Step 4: Commit**

### Task 3: Mirroring, Zoom Sync, and Conflict Resolution

**Files:**
- Modify: `src/main/siteViewManager.js` (Sync navigation/scrolling)
- Modify: `src/main/displayManager.js` (Handle playback/standby logic)
- Modify: `src/renderer/js/eventHandler.js` (Trigger sync on user action, enforce conflict rules)

- [ ] **Step 1: Implement IPC broadcast for URL/Scroll/Zoom/Device Emulation from `SiteView` to `PlaybackWindow`**
- [ ] **Step 2: Update `DisplayManager` to handle Direct Cast vs Playlist conflict rules**
- [ ] **Step 3: Add Zoom activation (`Alt+S`) logic on "Direct Cast" sync trigger**
- [ ] **Step 4: Add logic to restore Playlist mode and Zoom stop (`Alt+S`) on Toggle OFF**
- [ ] **Step 5: Commit**
