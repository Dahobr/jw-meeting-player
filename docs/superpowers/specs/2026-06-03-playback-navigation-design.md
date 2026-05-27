# Design Document: Implement Playback Navigation Logic (Previous/Next)

## Goal
Implement `onPrevious` and `onNext` navigation in `app.js` to allow users to switch between media items in the current playlist, supporting looping behavior.

## Design
- Modify `src/renderer/js/app.js` to implement the `onPrevious` and `onNext` callbacks for `uiManager`.
- Use the current playlist and `currentMedia` to calculate the next/previous index.
- If no media is currently playing, default to the first or last item depending on direction.
- Support looping: next after the last item goes to the first; previous before the first item goes to the last.
- Logic:
    - Retrieve current playlist ID from `this.store.getState()`.
    - Find index of `this.currentMedia.id` in `playlists[currentPlaylistId].items`.
    - If not found, default to index 0 or length - 1.
    - Calculate new index with modulo operator for looping.
    - Call `this.playbackManager.playMedia(item)` for the new item.

## Plan
1. Research existing `App` and `PlaybackManager` methods to reuse logic.
2. Update `src/renderer/js/app.js` to define the navigation callbacks.
3. Test functionality to ensure correct navigation and looping.

## Verification
- Verify navigation buttons (footer controls) successfully transition between playlist items.
- Ensure correct looping from last to first and vice-versa.
- Verify playback begins automatically for the new item.
