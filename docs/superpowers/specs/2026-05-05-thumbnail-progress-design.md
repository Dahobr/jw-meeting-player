# Design Specification: Circular Thumbnail Progress Indicator

## Overview
Replaces the existing 4px bottom progress bar with a centered, CSS-based circular progress indicator within the `.item-thumbnail` element. This improves aesthetic consistency and provides a more intuitive loading state.

## Design
- **Component**: Circular progress ring centered in `.item-thumbnail`.
- **Styling**:
  - Track: Thin circular border with semi-transparent background (e.g., `rgba(255, 255, 255, 0.2)`).
  - Progress: Solid `conic-gradient` using the primary theme color (`--primary-color`).
- **Transition**:
  - Loading: Circular indicator visible and animated.
  - Complete: Indicator fades out/hides, revealing the actual thumbnail or a placeholder file icon.

## Implementation Details
- **UI Changes**:
  - Add/Update CSS classes for `.item-thumbnail` to handle the `conic-gradient` logic based on a CSS custom property (e.g., `--progress`).
  - Modify `uiManager.js` to update the `--progress` variable on the thumbnail element instead of creating `<style>` tags.
- **Dependency**: Vanilla CSS, JS `style.setProperty`.

## Review Criteria
- The progress indicator is centered and clearly visible.
- No artifacts left behind after completion.
- Consistent look across all playlist items.
