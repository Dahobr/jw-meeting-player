# Spec: Share App Button Implementation

## Goal
Add a "Share this app" button in the application footer that copies the download URL to the clipboard.

## Components

### Share Button
A heart-shaped icon button placed in the footer (bottom right, above version information).

- **Icon**: Heart (SVG).
- **Behavior**:
    - **Hover**: Color changes to red (`--danger-color`).
    - **Click**:
        1. Copies `https://dahobr.github.io/jw-meeting-player/` to clipboard.
        2. Shows notification "Endereço de download copiado!".

## Design & Layout

### Visual Style
- **Placement**: Bottom right of the footer, above the version text.
- **Interactivity**: 
    - Tooltip on hover: "Compartilhar este aplicativo".
    - Color: Default color (e.g., white or light grey), changes to red on hover.

## Implementation Details

### HTML (`src/renderer/index.html`)
- Insert a `<button id="btn-share-app" class="share-btn" title="Compartilhar este aplicativo">` in the footer.
- Insert the heart SVG icon inside.

### CSS (`src/renderer/main.css`)
- Style the `.share-btn` for positioning (absolute or flex layout), color changes on hover, and cursor pointer.

### JS Logic (`src/renderer/js/eventHandler.js` / `uiManager.js`)
- Attach an `onclick` event listener to `#btn-share-app`.
- Use `navigator.clipboard.writeText('https://dahobr.github.io/jw-meeting-player/')`.
- On success, call `ui.showNotification('Endereço de download copiado!')`.

## Testing
- Verify click copies the URL.
- Verify feedback notification appears.
- Verify hover color change.
