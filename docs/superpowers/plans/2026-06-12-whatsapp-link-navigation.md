# WhatsAppリンク遷移の自動ナビゲーション実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WhatsApp等の外部サイト内でJW.org関連のリンクをクリックした際、ドメインに基づいて自動的にアプリ内の適切なセクションへ遷移させ、それ以外は外部ブラウザで開く機能を実装します。

**Architecture:** 
- `SiteViewManager` の `setWindowOpenHandler` を修正し、遷移先URLのドメインを解析する。
- 適切な遷移先に合わせてIPCメッセージを送信し、フロントエンド側の `uiManager.js` 等で対応するボタンをアクティブにする。
- JW.org以外は `shell.openExternal` で外部ブラウザを起動する。

**Tech Stack:** Electron (IPC, `shell` module, `WebContentsView`)

---

### Task 1: SiteViewManager のリンク遷移ロジック修正

**Files:**
- Modify: `src/main/siteViewManager.js`

- [ ] **Step 1: `setWindowOpenHandler` にドメイン判定ロジックを追加**

```javascript
const { ipcMain, WebContentsView, Menu, MenuItem, shell } = require('electron'); // shellを追加

// ...

this.siteView.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('wol.jw.org')) {
        this.mainWindow.webContents.send('set-active-nav', 'reunioes');
        this.siteView.webContents.loadURL(url);
    } else if (url.includes('docs.jw.org')) {
        this.mainWindow.webContents.send('set-active-nav', 'esbocos');
        this.siteView.webContents.loadURL(url);
    } else if (url.includes('jw.org')) {
        this.mainWindow.webContents.send('set-active-nav', 'videos');
        this.siteView.webContents.loadURL(url);
    } else {
        shell.openExternal(url);
    }
    return { action: 'deny' };
});
```

- [ ] **Step 2: 変更のコミット**

```bash
git add src/main/siteViewManager.js
git commit -m "feat: implement automatic navigation based on clicked link domain"
```

### Task 2: フロントエンドのIPCハンドラ実装

**Files:**
- Modify: `src/renderer/js/uiManager.js` (Assuming this handles button states)

- [ ] **Step 1: `ipcRenderer` で `set-active-nav` を受け取りボタンをアクティブにするロジックを追加**

```javascript
// uiManager.js への追加例 (実際の実装を確認して記述)
window.ipcRenderer.on('set-active-nav', (event, key) => {
    // 既存のボタンアクティブ化関数を呼び出す
    // 例: activateButton(key);
});
```

- [ ] **Step 2: 変更のコミット**

```bash
git add src/renderer/js/uiManager.js
git commit -m "feat: handle set-active-nav IPC message in UI"
```
---
プラン完了です。`docs/superpowers/plans/2026-06-12-whatsapp-link-navigation.md` に保存しました。

実行アプローチを選択してください：

1. **Subagent-Driven (推奨)** - 各タスクごとにサブエージェントを派遣し、タスク間にレビューを挟みます。反復が高速です。

2. **Inline Execution** - このセッション内で `executing-plans` スキルを使用して、チェックポイントを設けてバッチ実行します。

どちらのアプローチにしますか？
