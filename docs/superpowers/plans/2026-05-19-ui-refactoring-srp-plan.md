# UI Refactoring Plan: Applying Single Responsibility Principle

**Goal:** Improve code maintainability by decoupling DOM manipulation, template generation, and business logic between `app.js` and `uiManager.js`.

---

### Task 1: Decouple HTML Templates
**Files:**
- Create: `src/renderer/js/templates.js`
- Modify: `src/renderer/js/uiManager.js`

- [ ] **Step 1: Create `templates.js`**
  Move the `renderOperationGuide` method from `uiManager.js` to `templates.js`. Ensure it is exported (e.g., `window.templates = { renderOperationGuide }`).
- [ ] **Step 2: Update `uiManager.js`**
  Refactor `showOperationGuide` to call `window.templates.renderOperationGuide(zoomMode)`.
- [ ] **Step 3: Commit**
  `git add src/renderer/js/templates.js src/renderer/js/uiManager.js; git commit -m "refactor: extract HTML templates to templates.js"`

---

### Task 2: Encapsulate DOM Manipulation
**Files:**
- Modify: `src/renderer/js/uiManager.js`, `src/renderer/js/app.js`

- [ ] **Step 1: Hide DOM elements in UIManager**
  Create helper methods in `uiManager.js` for common UI tasks (e.g., `showModal(message)`, `hideModal()`, `setWebViewVisibility(visible)`).
- [ ] **Step 2: Refactor `app.js`**
  Replace all direct `document.getElementById` and style manipulations in `app.js` with calls to the new `uiManager` helper methods.
- [ ] **Step 3: Commit**
  `git add src/renderer/js/app.js src/renderer/js/uiManager.js; git commit -m "refactor: encapsulate DOM manipulation in UIManager"`

---

### Task 3: Centralize UI Display Logic
**Files:**
- Modify: `src/renderer/js/app.js`, `src/renderer/js/uiManager.js`

- [ ] **Step 1: Move state-based UI logic to `app.js`**
  Refactor `uiManager.js`'s `updateFooterPlaybackUI` and `updatePlaybackStateUI`. These should accept simple data structures (e.g., `playbackStatus: { isPlaying, isVideo, ... }`) rather than calculating those statuses internally.
- [ ] **Step 2: Update `app.js`**
  Update `updatePlaybackUI` in `app.js` to perform the logic checks and pass the calculated state to `uiManager`.
- [ ] **Step 3: Commit**
  `git add src/renderer/js/app.js src/renderer/js/uiManager.js; git commit -m "refactor: move display logic to app.js"`

---

### Task 4: Final Verification
- [ ] **Step 1: Verify all functionality**
  Check that the UI behaves exactly as before: playback controls, menu, modal, and operation guide.
