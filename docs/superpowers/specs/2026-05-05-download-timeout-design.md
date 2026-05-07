# Design Specification: Download Timeout Feature

## Overview
Implement a timeout mechanism for ongoing downloads to prevent items from getting stuck indefinitely in the "downloading" state due to network issues or unresponsive servers. Downloads will automatically be cancelled if no progress is made within a specified duration.

## Design
- **Timeout Trigger**:
  - A timer will be initiated when a download begins.
  - The timer will reset whenever significant progress is reported (i.e., `getReceivedBytes()` increases).
  - If the timer expires (defaulting to 60 seconds) without any progress update, the download is considered timed out.
- **Error Handling**:
  - Upon timeout, the download `DownloadItem` will be programmatically cancelled.
  - An error notification (`download-error` IPC event) with a specific "Download timed out" message will be sent to the renderer process.
  - The UI will display this error similar to other download failures (warning icon, error message for 4 seconds, then automatic removal from the list).

## Implementation Details
- **`downloadManager.js`**:
  - Introduce a `Map` or `Object` to store timeout IDs for each active download.
  - When `handleDownload` is called and the file type is allowed, start a `setTimeout` for the `downloadId`.
  - In the `item.on('updated', ...)` callback (for `progressing` state), clear the existing timeout and set a new one.
  - If the `item.on('done', ...)` callback is reached (either `completed` or `interrupted`), clear the timeout.
  - If the timeout expires, call `item.cancel()` and send a `download-error` IPC message.
- **UI (Renderer Process)**:
  - No specific UI changes needed beyond the existing error handling logic in `uiManager.js` and `app.js`, as it already handles `download-error` events.

## Review Criteria
- Downloads do not get stuck indefinitely.
- Timed-out downloads are correctly cancelled.
- UI correctly displays "Download timed out" and removes the item after 4 seconds.
- No memory leaks (timers are cleared when downloads complete, are cancelled, or time out).
