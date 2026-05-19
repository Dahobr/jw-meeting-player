# Task 3: Simplify UIManager Logic

## Plan
- Modify `src/renderer/js/uiManager.js`
- Remove `this.menuBlurOverlay` property
- Remove calls to `window.electronAPI.toggleWebView()` in the global click listener
- Remove logic managing `this.menuBlurOverlay.style.display`
- Remove calls to `window.electronAPI.toggleWebView()` in `btnMenu.onclick`
- Remove `this.menuBlurOverlay` related logic in `btnMenu.onclick`

## Implementation
- Implement the requested changes in `src/renderer/js/uiManager.js`

## Verification
- Verify the `btnMenu` toggles the menu without triggering site-view display changes or blur overlays
- Ensure site-view visibility remains intact as required by other app logic
