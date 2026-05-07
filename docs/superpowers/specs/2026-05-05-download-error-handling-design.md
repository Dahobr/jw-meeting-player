# Design Specification: Download Error Handling

## Overview
Handle download failures and unsupported file formats by displaying a temporary error state followed by automatic removal of the item from the playlist.

## Design
- **Error State**:
  - Thumbnail: Display a warning icon (`⚠`) instead of the loading ring.
  - Text: Display "Erro" or "Formato não suportado" for 3 seconds.
- **Transition**:
  - The item fades out (opacity 1 -> 0) over 3 seconds.
  - After the transition, the item is removed from the DOM.

## Implementation Details
- **UI Changes**:
  - Add a CSS class `.error` that handles the fade-out transition.
  - Update `uiManager.js` to trigger the error state and handle the timeout/removal.
- **Backend Changes**:
  - Update `downloadManager.js` to notify the renderer about unsupported file formats via IPC.

## Review Criteria
- Items with errors are clearly marked.
- Items disappear from the list after 3 seconds of error display.
- No memory leaks (event listeners cleaned up).
