# Kebab Menu Design Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the item kebab menu to match the app's clean light-mode aesthetic (Plan A) and add icons for "Rename" and "Delete" actions.

**Architecture:** Update CSS for `.item-dropdown` and modify HTML generation in `uiManager.js` to include SVG icons.

**Tech Stack:** Vanilla CSS, JavaScript.

---

### Task 1: Update Dropdown CSS for Plan A

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Replace item-dropdown styles**

Replace the existing `.item-dropdown` styles in `main.css`:

```css
.item-dropdown {
    position: absolute;
    right: 0;
    top: 100%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    z-index: 1000;
    display: none;
    min-width: 140px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    overflow: hidden;
    padding: 4px 0;
}

.item-dropdown.show {
    display: block;
}

.item-dropdown-item {
    padding: 10px 15px;
    cursor: pointer;
    font-size: 0.9em;
    color: var(--text-color);
    text-align: left;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.item-dropdown-item:hover {
    background-color: #e3f2fd;
    color: var(--primary-color);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/main.css
git commit -m "style: update kebab menu to clean light-mode"
```

### Task 2: Add icons to Kebab Menu in `uiManager.js`

**Files:**
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Update `renderPlaylistItems` dropdown generation**

Locate the `renderPlaylistItems` method and update the dropdown innerHTML:

```javascript
<div class="item-dropdown" id="dropdown-${item.id}">
    <div class="item-dropdown-item btn-edit-item">${this.icons.edit} Renomear</div>
    <div class="item-dropdown-item btn-delete-item">${this.icons.trash} Excluir</div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/js/uiManager.js
git commit -m "feat: add icons to kebab menu options"
```
