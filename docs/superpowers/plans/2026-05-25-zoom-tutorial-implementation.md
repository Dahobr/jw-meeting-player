# Zoom設定チュートリアル実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zoom初回起動時に、設定手順をガイドするオーバーレイチュートリアルを実装し、Zoom設定（Configurações）の自動表示とAlt+Sショートカット設定をサポートする。

**Architecture:** 
- `renderer/js/uiManager.js` にチュートリアル状態管理を統合。
- オーバーレイUIコンポーネント（HTML/CSS）を新規作成。
- Zoom連携用ネイティブ実行ファイル（`ZoomControlManager.exe`）を `main.js` のIPC経由で呼び出し。

**Tech Stack:** Electron (Node.js), Vanilla JS, Vanilla CSS.

---

### Task 1: チュートリアル用オーバーレイUIの作成

- [ ] **Step 1: `renderer/playback/tutorial.html` を作成**
- [ ] **Step 2: `renderer/playback/tutorial.css` を作成**
- [ ] **Step 3: `renderer/js/tutorialManager.js` を作成し、状態管理ロジックを実装**

### Task 2: Zoom連携機能の実装

- [ ] **Step 1: `main.js` に `openZoomSettings` 用のIPCハンドラーを追加**
- [ ] **Step 2: `main.js` から `ZoomControlManager.exe` を実行するロジックを実装**

### Task 3: チュートリアルフローの統合

- [ ] **Step 1: `renderer/js/uiManager.js` にチュートリアル表示の初期化処理を追加**
- [ ] **Step 2: 各ステップ（モード説明、Zoom設定、Alt+S、操作ガイド）の遷移ロジック実装**
- [ ] **Step 3: 「今後表示しない」チェックボックスの保存処理を `storageManager.js` と連携**

---

### Task 1 詳細: UIコンポーネント作成

- [ ] **Step 1: `tutorial.html`**

```html
<div id="tutorial-overlay" class="hidden">
    <div id="tutorial-card">
        <h2 id="tutorial-title"></h2>
        <div id="tutorial-content"></div>
        <button id="tutorial-action-btn" class="hidden"></button>
        <div class="controls">
            <button id="btn-prev">戻る</button>
            <button id="btn-next">次へ</button>
            <button id="btn-skip">スキップ</button>
        </div>
        <label><input type="checkbox" id="check-no-show"> 今後表示しない</label>
    </div>
</div>
```

- [ ] **Step 2: `tutorial.css`**

```css
#tutorial-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:999; }
#tutorial-card { background:white; margin:10% auto; padding:20px; width:500px; border-radius:8px; }
.hidden { display: none; }
```

### Task 2 詳細: ネイティブ連携

- [ ] **Step 1: `main.js` IPC追加**

```javascript
ipcMain.handle('open-zoom-settings', () => {
    const { exec } = require('child_process');
    exec('path/to/ZoomControlManager.exe');
});
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-25-zoom-tutorial-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**