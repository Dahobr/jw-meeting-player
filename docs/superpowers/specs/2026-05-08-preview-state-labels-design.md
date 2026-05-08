# Preview State Labels Design Specification

This document details the implementation of "studio-style" neon labels in the preview area to clearly distinguish between "Standby" (Staged) and "Live" (Playing) states.

## 1. Goal
Improve visual feedback in the preview area by adding a clear, high-contrast label at the top-center, indicating the current state of the media being previewed.

## 2. Design Details (Neon Style)
The labels will use a "Neon Sign" aesthetic with glowing borders and text shadows, optimized for the dark background of the preview area.

### 2.1. States & Visuals
- **Standby (Staged):**
  - Text: `PREPARADO`
  - Color: Amber (`#f39c12`)
  - Style: Neon glow (border and text shadow)
- **Live (Playing/Paused):**
  - Text: `NO AR`
  - Color: Red (`#e74c3c`)
  - Style: Neon glow (border and text shadow)
- **Stopped:**
  - Label is hidden.

### 2.2. Placement
- **Location:** Top-center of the `.preview-overlay`.
- **Z-Index:** Must be higher than the video/image elements but lower than any global modal overlays.

## 3. Technical Implementation

### 3.1. HTML Structure
Add a new container for the label inside `src/renderer/index.html` within the `#preview-area`.

```html
<div id="preview-area" class="preview-overlay" style="display: none;">
    <!-- New Label Element -->
    <div id="preview-state-label" class="state-label"></div>
    
    <div class="preview-media-wrapper">
        <video id="preview-video" muted></video>
        <img id="preview-image" style="display: none;">
    </div>
    ...
</div>
```

### 3.2. CSS Styling (`src/renderer/main.css`)
Implement the neon effect using `box-shadow` and `text-shadow`.

```css
.state-label {
    position: absolute;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 16px;
    border-radius: 4px;
    font-weight: 900;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 110;
    display: none; /* Hidden by default */
    pointer-events: none; /* Don't block clicks */
}

/* Standby (Amber) */
.state-label.staged {
    display: block;
    color: #f39c12;
    border: 2px solid #f39c12;
    box-shadow: 0 0 15px #f39c12, inset 0 0 5px #f39c12;
    text-shadow: 0 0 5px #f39c12;
}

/* Live (Red) */
.state-label.playing, .state-label.paused {
    display: block;
    color: #e74c3c;
    border: 2px solid #e74c3c;
    box-shadow: 0 0 15px #e74c3c, inset 0 0 5px #e74c3c;
    text-shadow: 0 0 5px #e74c3c;
}
```

### 3.3. JavaScript Logic (`src/renderer/js/uiManager.js`)
Update `UIManager` to handle the label's visibility and classes.

- Update `updatePlaybackStateUI(status, activeItemId, standbyItemId)` to toggle classes on the `#preview-state-label` element.
- Ensure `hidePreview()` removes all state classes from the label.

## 4. Verification Plan
- **Manual Verification:**
  - Select an item: Label should appear as "PREPARADO" (Amber neon).
  - Play the item: Label should change to "NO AR" (Red neon).
  - Pause the item: Label should remain "NO AR" (Red neon).
  - Stop/Clear item: Label should disappear.
  - Verify layout remains centered on window resize.
