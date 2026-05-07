# App Version Update and Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update app version in `package.json` and rebuild the portable executable with the new icon.

**Architecture:** Increment version, update build artifacts using `electron-builder`.

**Tech Stack:** Electron, electron-builder.

---

### Task 1: Update Version and Build

- [ ] **Step 1: Increment version in package.json**

Modify `package.json`:
Change `"version": "1.0.0"` to `"version": "1.0.1"`

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Successfully generates updated portable executable in `dist/` directory.

- [ ] **Step 3: Verification**

Check that `dist/` contains the new executable.
Run: `dir dist`

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 1.0.1 and rebuild with new icon"
```
