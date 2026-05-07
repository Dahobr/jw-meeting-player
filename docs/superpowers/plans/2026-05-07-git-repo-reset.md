# Git Repository Reset and Cleanup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-initialize the Git repository to remove any corruption and ensure `node_modules`, `dist`, and `build` folders are not tracked, making the repository suitable for hosting on GitHub.

**Architecture:** We will backup the current (corrupted) `.git` directory, initialize a new repository, apply the `.gitignore` rules, and create a clean initial commit.

**Tech Stack:** Git.

---

### Task 1: Repository Reset

**Files:**
- Backup: `.git/` to `.git_backup/`
- Create: New `.git/`

- [ ] **Step 1: Backup and remove corrupted .git directory**

Run: `Rename-Item .git .git_backup ; git init`
Expected: "Initialized empty Git repository"

- [ ] **Step 2: Verify .gitignore covers large directories**

Check that `.gitignore` contains:
```text
node_modules/
dist/
build/
out/
```

- [ ] **Step 3: Add all files except ignored ones**

Run: `git add .`
Expected: Only source files are staged. Check with `git status`.

- [ ] **Step 4: Create initial commit**

Run: `git commit -m "initial commit: clean repository setup"`

---

### Task 2: GitHub Preparation

**Files:**
- None

- [ ] **Step 1: Check repository size**

Run: `du -sh .git` (or equivalent) to ensure the `.git` folder is small.

- [ ] **Step 2: (Optional) Set up remote and push**

*Note: This requires the user to have created a repository on GitHub.*
Run: `git remote add origin <github-url> ; git push -u origin main`

---
