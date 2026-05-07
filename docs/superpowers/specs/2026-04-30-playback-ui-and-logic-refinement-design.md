# Design Spec: Playback UI and Logic Refinement

**Date:** 2026-04-30  
**Topic:** Playback UI and Logic Refinement  
**Status:** Draft (Pending User Review)

## 1. Purpose
Refine the playback control logic to ensure consistency between playlist item controls and footer controls. Improve the user experience by clarifying use cases for video and image media, enhancing visual feedback (item states), and streamlining the UI layout.

## 2. Core Behavior Logic

### 2.1 Video Media
| State | Trigger | Preview (Main) | Slave Display | Controls (Item & Footer) | Item Background |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Standby** | Item Click | Show first frame (Paused) | No change / Standby | **Play** | **Standby Color** (#2d3e50) |
| **2. Playing** | Play Button | Playing | Playing | **Pause** + **Stop** | **Playing Color** (#1e3a2a) |
| **3. Paused** | Pause Button | Paused | Paused | **Play (Resume)** + **Stop** | **Playing Color** |
| **4. Stopped** | Stop Button | Standby (Next Item) | **Bible Text (Standby)** | **Play** | Next Item: **Standby Color** |

### 2.2 Image Media
| State | Trigger | Preview (Main) | Slave Display | Controls (Item & Footer) | Item Background |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Standby** | Item Click | Show Image | No change / Standby | **Play** | **Standby Color** |
| **2. Showing** | Play Button | Show Image | Show Image | **Stop** | **Playing Color** |
| **3. Stopped** | Stop Button | Standby (Next Item) | **Bible Text (Standby)** | **Play** | Next Item: **Standby Color** |

### 2.3 Post-Stop / End of Playback
- **Auto-Standby**: When a media item stops or finishes, the next item in the playlist is automatically staged (Standby mode).
- **End of List**: If the last item in the playlist finishes or is stopped, the preview area is hidden, and the **BrowserView** is restored.
- **Slave Reset**: The slave display always reverts to the Bible Text (Standby) screen when playback stops.

## 3. UI and Layout Changes

### 3.1 Playlist Items
- **Controls**:
    - Use a circular border for Play/Pause/Stop buttons. Ensure the border is consistently visible.
    - Button icons (Play/Pause) must be synchronized with the footer and the actual playback state.
- **Background States**:
    - **Standby**: Soft blue background (`#2d3e50`).
    - **Playing/Paused**: Soft green background (`#1e3a2a`).
- **Item Actions Menu**:
    - Replace separate "Edit" and "Delete" icons with a single **"Vertical Three-Dots (Kebab Menu)"** icon.
    - Clicking the icon opens a dropdown with:
        - Rename
        - Delete

### 3.2 Footer (Global Controls)
- **Layout**:
    - **Left**: Volume Control (Slider + Icon).
    - **Center**: Transport Controls (**Play/Pause**, **Stop**).
    - **Right**: Current Media Info.
- **Removals**:
    - Remove **Next** (`btn-next`) and **Previous** (`btn-prev`) buttons (logic now handles progression via auto-standby).
    - Remove **Fullscreen** (`btn-fullscreen`) button.

### 3.3 Icons & Feedback
- Ensure button icons clearly distinguish between "Play" (Triangle) and "Resume" (Triangle but often in a different context/label).
- The Pause button must be clearly visible during playback.

## 4. Technical Implementation Notes
- **State Synchronization**: `App` class must ensure that `updatePlaybackUI` updates both the footer buttons and the active item's buttons in the list.
- **Interruptive Playback**: Clicking "Play" on Item B while Item A is playing must immediately stop Item A and start Item B (Slave + Preview).
- **Slave Muting**: Maintain current logic where preview audio is muted when playing on slave to avoid echo.

## 5. Compliance with `ui-elements-behavior.md`
- This spec supersedes `ui-elements-behavior.md` regarding the layout of transport controls (removing prev/next/fullscreen) and item action buttons.
- IDs such as `btn-play-pause`, `btn-stop`, `volume-slider`, and `preview-area` remain central but their behavior is refined.
- No changes to Navigation (`btnCantico`, etc.) or Folder/Import buttons.
