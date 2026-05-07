# App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the `jwmp-icon.svg` as the application's icon for desktop and taskbar in the Electron application.

**Architecture:** The application icon will be set in the main Electron process (`main.js`) using the `icon` option of the `BrowserWindow` constructor. The SVG will be used directly, and Electron's build process will handle conversion to platform-specific formats.

**Tech Stack:** Electron, Node.js, SVG

---

### Task 1: Update `main.js` to set the application icon

**Files:**
- Modify: `main.js`

- [ ] **Step 1: Locate `main.js` and identify the `BrowserWindow` creation.**

- [ ] **Step 2: Add `path` module import.**
    The `path` module will be used to construct the absolute path to the icon file.

    ```javascript
    // In main.js, near other imports
    const path = require('path');
    ```

- [ ] **Step 3: Define the icon path.**
    Add a constant for the icon path, making sure it points to the `jwmp-icon.svg` file.

    ```javascript
    // In main.js, after other constants
    const APP_ICON_PATH = path.join(__dirname, 'jwmp-icon.svg');
    ```

- [ ] **Step 4: Update `BrowserWindow` options with the icon path.**
    Modify the `BrowserWindow` constructor options to include the `icon` property.

    ```javascript
    // In main.js, inside createWindow function or where BrowserWindow is initialized
    const mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: APP_ICON_PATH, // Add this line
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false,
        webviewTag: true,
      },
    });
    ```

- [ ] **Step 5: Test the application icon.**
    Run the Electron application to verify that the new icon appears correctly on the window frame and the taskbar/dock.

    Run: `npm start`
    Expected: The application window and taskbar entry should display the new `jwmp-icon.svg`.

- [ ] **Step 6: Commit**

```bash
git add main.js
git commit -m "feat: Configure application icon in main.js"
```

### Task 2: (Optional but recommended) Update `package.json` for build tools

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Locate `package.json` and identify `build` configuration if present.**
    This step is dependent on whether `electron-builder` or a similar tool is configured.

- [ ] **Step 2: Add or update the `icon` property in the `build` configuration.**
    If a `build` section exists, ensure it points to the `jwmp-icon.svg` file. This helps build tools generate platform-specific icon formats correctly.

    ```json
    // In package.json, within the "build" section (if it exists)
    "build": {
      "productName": "JW Media Downloader",
      "appId": "com.example.jwmediadownloader",
      "icon": "jwmp-icon.svg", // Add or update this line
      "directories": {
        "output": "dist"
      },
      "files": [
        "**/*",
        "!node_modules/*/{CHANGELOG.md,README.md,README,.github,package-lock.json}/**"
      ]
    },
    ```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: Update package.json build configuration for app icon"
```
