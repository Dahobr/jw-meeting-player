# Empty Playlist Message Specification (2026-05-05)

## 1. Introduction
This specification defines the UI behavior when a selected playlist contains no items. In such cases, the application will display an "Nenhum item" message in the location where the first item would typically appear.

## 2. Design Requirements
- **Trigger:** When a playlist is selected and `playlist.items.length === 0`.
- **Content:** The text "Nenhum item".
- **Positioning:** Must appear at the starting position of the item list (the same position as the first item).
- **Styling:** The message should share styling consistent with existing playlist items to maintain a cohesive look.

## 3. Implementation Details
- **Logic:** Modify `UIManager.renderPlaylistItems` in `src/renderer/js/uiManager.js`.
- **Condition:** Add a check for `playlist.items.length === 0`.
- **Rendering:**
  - Create a new list element (`<li>` or similar matching the existing list container).
  - Apply a class `.playlist-empty-msg` to this element for specific styling if needed.
  - Set the text content to "Nenhum item".
  - Append this element to `this.itemsList`.

## 4. CSS Additions
Add the following style to `src/renderer/main.css`:
```css
.playlist-empty-msg {
    padding: 15px;
    color: #666;
    font-style: italic;
    text-align: left;
    list-style: none;
}
```

---
