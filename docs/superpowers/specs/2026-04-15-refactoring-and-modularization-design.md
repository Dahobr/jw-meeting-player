# Refactoring and Modularization Design Specification

**Date:** 2026-04-15
**Goal:** Transition the JW Media Downloader from a "Fat File" architecture to a modular structure to improve maintainability, reduce regressions during feature additions, and stabilize the UI/IPC logic.

---

## 1. Architecture Overview

The application will follow a strict separation of concerns between the **Main Process (System)** and the **Renderer Process (UI)**, with a dedicated **Data Layer** in the renderer to manage state.

### High-Level Layers
- **Main Layer:** OS-level operations (file I/O, display monitoring, window management).
- **Renderer UI Layer:** DOM manipulation and user event handling.
- **Renderer Data Layer:** Local state management for playlists and items.
- **Communication Layer (IPC):** Defined via `preload.js` and abstracted via `ipcClient.js`.

---

## 2. Component Breakdown

### 2.1 Main Process (`src/main/`)
- **`displayManager.js`**: Handles `screen` events, manages the creation/destruction of the secondary playback window, and ensures "always-on-top" behavior.
- **`downloadManager.js`**: Handles `will-download` events, manages file paths (avoiding duplicates), and extracts metadata (titles/thumbnails) using `music-metadata`.
- **`storageManager.js`**: Pure JSON file I/O for `playlists.json`.
- **`main.js`**: Entry point. Initializes the managers and routes IPC calls to the appropriate module.

### 2.2 Renderer Process (`src/renderer/js/`)
- **`app.js`**: The entry point for the UI. Orchestrates initialization: loads data, sets up display monitoring, and initializes UI event listeners.
- **`uiManager.js`**: Functions for rendering playlists, items, and status messages. Handles all `document.getElementById` calls and DOM updates.
- **`playlistStore.js`**: Manages the `playlists` object. Provides methods like `addPlaylist()`, `moveItem()`, and `getPlaylists()`. Triggers UI refreshes when data changes.
- **`ipcClient.js`**: A wrapper around `window.electronAPI`. Centralizes all calls to the Main process to keep UI logic clean.

### 2.3 Playback Window (`src/renderer/playback/`)
- **`playback.html/css/js`**: Minimalist implementation for full-screen media display. Logic is kept isolated from the main window.

---

## 3. Data and Event Flow

### 3.1 Initialization Flow
1. `main.js` starts -> `displayManager` starts monitoring.
2. `app.js` (Renderer) starts -> calls `storageManager` (via IPC) to load data.
3. `playlistStore` is populated with loaded data.
4. `uiManager` renders the initial playlist view.

### 3.2 Feature Execution (e.g., Import)
1. User clicks "Import" -> `uiManager` catches event.
2. `ipcClient` calls `open-file-dialog`.
3. `main.js` routes to `downloadManager`.
4. `downloadManager` returns metadata.
5. `app.js` updates `playlistStore`, which triggers `uiManager` to refresh the list.

---

## 4. Error Handling & Stability
- **Null Guards:** Every DOM access in `uiManager` must check for element existence to avoid `TypeError: Cannot read properties of null`.
- **IPC Validation:** All data returned from Main via IPC must be validated before being added to `playlistStore`.
- **HTML Integrity:** Templates for playlists and items will be centralized in `uiManager` to prevent broken tags or duplicated IDs.

---

## 5. Transition Strategy (Step-by-Step)
1. **Infrastructure:** Create the directory structure.
2. **Preload Stabilization:** Rewrite `preload.js` once with all required APIs.
3. **Data Layer:** Extract playlist logic into `playlistStore.js`.
4. **System Layer:** Move Main process logic into specialized managers.
5. **UI Layer:** Rewrite `index.html` and move DOM logic into `uiManager.js`.
6. **Integration:** Connect all parts in `app.js` and `main.js`.

---

## 6. Testing & Validation
- **Manual Verification:**
    - Secondary monitor detection and auto-open.
    - Playlist persistence (Save/Load).
    - Media playback and fullscreen mode.
- **Regression Check:** Ensure existing "Move Item" and "Rename" features still function in the new architecture.
