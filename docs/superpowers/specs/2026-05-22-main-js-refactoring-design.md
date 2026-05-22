# Design Spec: main.js Refactoring and Modularization

**Date:** 2026-05-22
**Status:** Draft
**Topic:** Modularizing `main.js` to adhere to SRP (Single Responsibility Principle) and SoC (Separation of Concerns).

## 1. Goal
Currently, `main.js` handles too many responsibilities (Protocols, SiteView, Help content, Context Menus, Updates). This refactoring aims to move these into dedicated manager classes, making `main.js` a thin entry point focused on lifecycle and orchestration.

## 2. Architecture Overview
Each responsibility will be moved to a singleton manager in `src/main/`. Each manager will follow the decentralized IPC registration pattern (like the existing `storageManager.js`).

### 2.1 New Modules
| Module | Responsibility |
| :--- | :--- |
| `protocolManager.js` | Handles `media://` protocol registration and path resolution. |
| `siteViewManager.js` | Manages the `WebContentsView` for site browsing, its navigation, and bounds. |
| `menuManager.js` | Centralizes context menu creation for both the playlist and SiteView. |
| `contentManager.js` | Handles reading and parsing `HELP.md` and license files. |
| `updateManager.js` | Manages `electron-updater` logic and events. |

## 3. Detailed Component Design

### 3.1 `protocolManager.js`
- **Method:** `init()`
- Registers `media` scheme as privileged.
- Registers `media` protocol handler for a given session.
- Encapsulates path decoding and normalization logic (currently in `registerMediaProtocol`).

### 3.2 `siteViewManager.js`
- **Method:** `init(mainWindow)`
- Creates and manages the `siteView` (`WebContentsView`).
- Handles IPC: `navigate-site`, `update-view-bounds`, `toggle-webview`, `wol-song-link-clicked`.
- Integrates with `downloadManager` for `will-download` events.

### 3.3 `menuManager.js`
- **Method:** `init()`
- Handles IPC: `show-item-context-menu`.
- Provides a method to trigger the SiteView context menu (called by `siteViewManager`).
- Uses `storageManager` to get playlist data for the "Move to" menu.

### 3.4 `contentManager.js`
- **Method:** `init()`
- Handles IPC: `get-help-content`, `get-about-content`.
- Uses `marked` to parse markdown files.

### 3.5 `updateManager.js`
- **Method:** `init()`
- Sets up `autoUpdater` listeners and triggers check.

## 4. `main.js` (Orchestrator)
The entry point will be simplified to:
1. Import all managers.
2. Register global protocols.
3. On `ready`:
   - Initialize managers (`storageManager`, `protocolManager`, `contentManager`, `updateManager`, `menuManager`).
   - Create `mainWindow`.
   - Initialize `displayManager` and `siteViewManager` with `mainWindow` reference.

## 5. Implementation Strategy
- Create managers one by one.
- Move logic and IPC handlers from `main.js` to the corresponding manager.
- Verify each feature still works after migration.

## 6. Success Criteria
- `main.js` is significantly reduced in size (target < 100 lines).
- No functional regressions in protocol handling, site browsing, or menus.
- Consistent module pattern across the main process.
