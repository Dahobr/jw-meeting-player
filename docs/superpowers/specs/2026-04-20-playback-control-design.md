# Playback Control Refinement Design

**Goal:** Implement a robust state-driven playback system that handles Play, Pause, and Stop (Return to Year Verse) with consistent UI across the footer and playlist items.

## Architecture

### 1. State Management
Introduce a centralized `PlaybackState` to track:
- `status`: `'stopped'`, `'playing'`, `'paused'`
- `currentItemId`: ID of the media currently loaded.
- `mediaType`: `'video'` or `'image'`

### 2. UI Behavior Logic

| State | Footer Buttons | Item List (Active Item) | Screen Content |
|-------|----------------|--------------------------|----------------|
| **Stopped** | `[Play]` | `[Play]` (Normal BG) | Year Verse Image |
| **Playing** | `[Pause]` `[Stop]` | `[Pause]` (for Video) / `[Stop]` (for Image) (Blue BG) | Media (Video/Image) |
| **Paused** | `[Play]` `[Stop]` | `[Play]` (Blue BG) | Frozen Frame (Video) |

### 3. Key Interactions
- **Stop Action**: Clears the current media and displays the "Year Verse" image on the second monitor.
- **Space Key**: Toggles between Play/Pause.
- **Playlist Highlighting**: The active item's row background turns blue.

## Component Changes

### Main Process (`src/main/displayManager.js`)
- Implement `showYearVerse()` to display the待機画面.
- Manage the state of the playback window content.

### Renderer Process
- **`src/renderer/js/app.js`**: Handle keyboard events (Space key) and orchestrate state changes.
- **`src/renderer/js/uiManager.js`**: Update DOM to reflect the three states, including showing/hiding the Stop button and switching background colors.
- **`src/renderer/playback/playback.js`**: Handle the actual transition between Year Verse, Video, and Image.

## Error Handling
- Prevent Play/Pause commands if no media is loaded.
- Handle missing Year Verse image by showing a default black screen.

## Testing Strategy
1. **State Transitions**: Verify footer buttons update correctly when clicking Play on a video vs an image.
2. **Stop Function**: Confirm clicking Stop returns the screen to the Year Verse regardless of the previous media type.
3. **Keyboard**: Test Space key toggling during video playback.
