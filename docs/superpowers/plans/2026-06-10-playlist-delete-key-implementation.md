# Deleteキーによる削除機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プレイリストおよびアイテムが選択されている状態で、キーボードの「Delete」キーを押下することで、確認モーダルを経て削除処理を行う。

**Architecture:** 
- レンダラープロセスの `eventHandler.js` (または `app.js`) に `keydown` イベントリスナーを追加する。
- 選択状態（`.active` クラス）を判別し、適切な削除コールバックを呼び出す。
- `UIManager.showConfirmModal` を経由して削除を確認する。

**Tech Stack:** Electron (Renderer), JavaScript

---

### Task 1: Deleteキーイベントリスナーの追加

**Files:**
- Modify: `src/renderer/js/eventHandler.js`

- [ ] **Step 1: `keydown` イベントリスナーの追加**

`src/renderer/js/eventHandler.js` 内の初期化処理（constructor等）で `keydown` リスナーを登録する。

```javascript
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete') {
        this.handleDeleteAction();
    }
});
```

- [ ] **Step 2: `handleDeleteAction` メソッドの実装**

`src/renderer/js/eventHandler.js` に `handleDeleteAction` を追加する。

```javascript
handleDeleteAction() {
    // プレイリストが選択されているか確認
    const activePlaylist = document.querySelector('.playlist-item.active');
    if (activePlaylist) {
        const id = activePlaylist.querySelector('.item-more-actions')?.dataset.id;
        if (id) {
            this.ui.showConfirmModal('本当にこのプレイリストを削除しますか？', () => {
                this.onPlaylistDelete(id);
            });
        }
        return;
    }

    // アイテムが選択されているか確認
    const activeItem = document.querySelector('.playlist-item-li.active');
    if (activeItem) {
        const id = activeItem.dataset.id;
        // プレイリストIDも必要（既存のonItemRemoveは第1引数にプレイリストIDを取る）
        // アイテムのデータ構造から取得できるようにするか、現在のプレイリストIDを状態から取得する
        const playlistId = this.store.currentPlaylistId; 
        if (id && playlistId) {
            this.ui.showConfirmModal('本当にこのアイテムを削除しますか？', () => {
                this.onItemRemove(playlistId, id);
            });
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/js/eventHandler.js
git commit -m "feat: add delete key support for playlist and item deletion"
```
