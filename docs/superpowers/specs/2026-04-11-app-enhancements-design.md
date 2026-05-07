# App Enhancements Design - 2026-04-11

## Overview
This document outlines the planned enhancements for the Electron playlist application, focusing on UX/UI improvements, content navigation, and playlist management.

## Planned Enhancements
1. **UI/UX Improvements**
   - Refactor bottom control bar: Add padding, replace text buttons with SVG icons (Play/Pause, Prev, Next, Fullscreen).
   - Playlist editor icons: Improve color/contrast for rename/delete actions.
   - BrowserView navigation: Add "Back" and "Forward" buttons above the BrowserView.
2. **BrowserView Behavior**
   - Link behavior: Restrict link clicks to open within the existing BrowserView instead of spawning new windows.
   - Context menu: Implement right-click functionality on images to download them to the existing video download directory.
3. **Playlist Management**
   - Drag-and-drop reordering: Implement visual reordering for playlist items.
   - Persistence: Update `C:\Users\Daichi\AppData\Roaming\Electron\playlists.json` to reflect new order.

## Implementation Plan
- **Phase 1: UI/UX Improvements** (Icons, padding, navigation buttons).
- **Phase 2: BrowserView Control** (Link handling, download integration).
- **Phase 3: Playlist Ordering** (Drag-and-drop, persistence).

## Approval
Status: Pending user approval.
