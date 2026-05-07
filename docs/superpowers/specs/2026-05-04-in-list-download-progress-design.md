# Design: In-List Download Progress Indicator

## Overview
Integrate download progress directly into the playlist items list (`#playlist-items-ul`). Downloaded items appear as `li` elements at the end of the list while downloading, showing progress via a visual indicator on the bottom border.

## CSS Implementation
- **Progress Container**: A `::after` pseudo-element on the `li.playlist-item-li.downloading` element, positioned absolutely at the bottom.
- **Progress Indicator**: A height of 4px (or similar) that transitions width from 0% to 100% based on the download percentage.
- **Visuals**:
    - `li.downloading`: Slightly dimmed or themed with a specific color during download.
    - `::after`: `background-color: var(--accent-color); transition: width 0.3s ease;`.
- **Completion**: Once finished, remove the `.downloading` class, triggering a transition or immediate state change to a standard item.

## UI Logic (`uiManager.js`)
- `renderDownloadItem(id, progress)`: Dynamically create/update the `li` for the downloading file.
- `updateDownloadProgress(id, percentage)`: Update the `style.width` of the indicator.
- `onDownloadComplete(id, itemData)`: Swap the `li` content from "Downloading..." to the full item render.

## Data Flow
- `ipcClient` receives download progress events from the Main process.
- `app.js` triggers `uiManager.updateDownloadProgress`.

---

Please review this design. If approved, I will proceed to invoke `writing-plans` to outline the implementation.