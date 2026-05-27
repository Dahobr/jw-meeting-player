# Footer Navigation Buttons Design Specification

## Overview
Implement "Previous" and "Next" navigation buttons in the footer transport control area. These buttons allow users to navigate through the currently selected playlist.

## Navigation Behavior
- **Previous Button**: Loads/plays the previous item in the playlist. If at the first item, loops to the last item.
- **Next Button**: Loads/plays the next item in the playlist. If at the last item, loops to the first item.

## UI Components
- **Location**: `.transport-buttons` container in the footer.
- **Style**: Use the existing `.main-transport-btn` class to match the current Play/Pause button aesthetic.
- **Icons**: Standard "Skip Back" and "Skip Forward" SVGs.

## Implementation Details
1. **CSS**: Define styles for the new buttons in `main.css`.
2. **UI Manager**: Add DOM references (`btnFooterPrev`, `btnFooterNext`) to `UIManager`.
3. **Event Handling**: 
   - Add click listeners to the new buttons.
   - Interact with `playbackManager` (or `app.js`) to update the current playlist index and trigger playback.
4. **State Management**:
   - Buttons should be enabled only when a playlist is active.
   - If the playlist is empty, buttons remain disabled.
