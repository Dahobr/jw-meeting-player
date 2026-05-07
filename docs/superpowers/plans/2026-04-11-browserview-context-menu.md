# Implement BrowserView Context Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a native context menu for the BrowserView in `main.js` with navigation and image download options.

**Architecture:** Use Electron's `Menu` and `MenuItem` modules to create a popup menu triggered by the `context-menu` event on the BrowserView's `webContents`.

**Tech Stack:** Electron

---

### Task 1: Update Imports and Add Context Menu Listener

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Update imports in `main.js`**

Modify line 2 of `main.js` to include `Menu` and `MenuItem`.

- [ ] **Step 2: Add `context-menu` event listener to `view.webContents` in `createMainWindow`**

Insert the context menu logic after `mainWindow.setBrowserView(view);` in `main.js`.

- [ ] **Step 3: Verify the changes**

Since I cannot run the Electron app interactively, I will check the syntax and ensure the logic matches the requirements.

- [ ] **Step 4: Commit the changes**

```bash
git add main.js
git commit -m "feat: implement native context menu for BrowserView"
```
