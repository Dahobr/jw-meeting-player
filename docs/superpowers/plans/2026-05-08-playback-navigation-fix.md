# Playback Stop on Navigation Implementation Plan

**Goal:** Implement a confirmation dialog when navigating back to the playlist list while media is playing, stop playback upon confirmation, and restore the previous preview area state (Webview visibility).

**Architecture:**
- Modify `app.js` to override `btnBackToPlaylists.onclick`.
- Use existing `this.showCustomConfirm()` for user interaction.
- If user confirms stop, call `this.stopMedia('navigation')`, which handles resetting the preview area and restoring Webview visibility.

---

### Task 1: Implement Navigation Stop & State Restoration

**Files:**
- Modify: `src/renderer/js/app.js`

- [ ] **Step 1: Update `btnBackToPlaylists.onclick` logic**

```javascript
this.ui.btnBackToPlaylists.onclick = async () => {
    if (this.status === 'playing' || this.status === 'paused') {
        const confirm = await this.showCustomConfirm('A reprodução será interrompida. Deseja continuar?');
        if (confirm) {
            // stopMedia already triggers ui.hidePreview() which handles Webview restoration
            this.stopMedia('navigation to playlists');
            this.ui.switchView('playlists');
        }
    } else {
        // If not playing, just switch view
        this.ui.switchView('playlists');
    }
};
```

- [ ] **Step 2: Commit changes**

```bash
git add src/renderer/js/app.js
git commit -m "fix: stop playback and restore preview state on navigation"
```

---

### Task 2: Verification

- [ ] **Step 1: Test Navigation (Playing)**
1. Start playback (Webview should be hidden/Preview visible).
2. Click "Back" button.
3. Expected: Confirmation dialog appears. Clicking OK stops playback, hides Preview, and restores the Webview/Site content.

- [ ] **Step 2: Test Navigation (Stopped)**
1. Ensure playback is stopped.
2. Click "Back" button.
3. Expected: Navigation happens immediately.

- [ ] **Step 3: Push and create PR**
```bash
git push -u origin fix/playback-navigation-behavior
# (Then manually create PR in GitHub)
```
