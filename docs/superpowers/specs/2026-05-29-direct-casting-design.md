# Direct Casting (Mirroring) Design

## Goal
Enable real-time mirroring of the Site View (browser) content to a second monitor, allowing users to present web-based media directly to an audience (e.g., via Zoom) without using the playlist system.

## UI/UX Design
- **Toggle:** A toggle switch located in the header, between the Site View button and Zoom settings.
- **Direct Cast Controls (Active only when Toggle is ON):**
  - **URL Display:** Shows the current URL (read-only).
  - **Zoom Factor:** Slider/buttons for adjusting magnification.
  - **Device Emulation:** Icon to toggle between Desktop/Mobile view.
- **Overlay:** A transparent overlay `WebContentsView` placed on top of the Site View to indicate the projection area (aspect ratio) on the second monitor.

## Architecture & Conflict Resolution
- **Toggle Control:** Enabled when Site View is active.
- **Projection Trigger:**
    - If Playlist is playing, Direct Cast action (playback) stops playlist, switches to Direct Cast, and continues Zoom sharing.
    - If Direct Cast is active, clicking a playlist item does NOT stop Direct Cast. Pressing Play starts playlist playback, and Zoom sharing continues (no Alt+S sent).
- **Mode Switching:**
    - Toggle OFF: Restores Playlist mode, sets second monitor to standby image, and if Zoom sharing was active, triggers Alt+S to stop it.
- **IPC Communication:**
    - `SiteViewManager` handles mirroring navigation, scrolling, and device emulation state.
    - `DisplayManager` manages the `PlaybackWindow` and syncs states.
- **Zoom Integration:** Automatic trigger of the Zoom sharing shortcut (Alt+S) via `ZoomControlManager` upon triggering a playback action in Direct Cast mode.

## Implementation Strategy
- **Overlay Feasibility:** Use a transparent overlay `WebContentsView` stacked on top of the main Site View, controlled via IPC to draw the aspect ratio frame dynamically.
- **Synchronization:** Sync URL navigation, scroll position, zoom factor, and device emulation (mobile view) from `SiteView` to `PlaybackWindow`.

## Testing Strategy
- Verify synchronization of URL, scroll position, and viewport state between `SiteView` and `PlaybackWindow`.
- Confirm Zoom sharing behavior in various conflict scenarios (Direct Cast -> Playlist vs Playlist -> Direct Cast).
- Test mobile view emulation and zoom factor synchronization.
- Verify the projection area overlay accurately represents the second monitor's aspect ratio.
