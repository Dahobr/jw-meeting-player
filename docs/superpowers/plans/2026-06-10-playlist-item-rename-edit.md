# 編集機能のダブルクリック・全選択実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プレイリスト名とアイテム名をダブルクリックで編集可能にし、編集開始時にテキストを全選択する機能を実装します。

**Architecture:** `PlaylistListRenderer` クラスにおいて、既存の編集トグル関数を呼び出すイベントリスナーをダブルクリックイベントに追加します。全選択処理は編集トグル関数内に統合します。

**Tech Stack:** JavaScript (DOM manipulation)

---

### Task 1: 編集トグル関数の全選択修正

**Files:**
- Modify: `src/renderer/js/playlistListRenderer.js`

- [ ] **Step 1: `togglePlaylistEdit` の修正**
  既存の `togglePlaylistEdit` 関数において、入力フィールドが表示された際に `input.select()` を実行するようにします。

```javascript
    togglePlaylistEdit(id, show = true) {
        const nameSpan = DomUtils.get(`name-${id}`);
        const input = DomUtils.get(`input-${id}`);
        if (nameSpan && input) {
            nameSpan.style.display = show ? 'none' : 'block';
            input.style.display = show ? 'block' : 'none';
            if (show) {
                requestAnimationFrame(() => {
                    input.focus();
                    input.select();
                });
            }
        }
    }
```

- [ ] **Step 2: `toggleItemEdit` の修正**
  既存の `toggleItemEdit` 関数において、入力フィールドが表示された際に `input.select()` を実行するようにします。

```javascript
    toggleItemEdit(id, show = true) {
        const nameSpan = DomUtils.get(`item-name-${id}`);
        const input = DomUtils.get(`item-input-${id}`);
        if (nameSpan && input) {
            nameSpan.style.display = show ? 'none' : 'block';
            input.style.display = show ? 'block' : 'none';
            if (show) {
                requestAnimationFrame(() => {
                    input.focus();
                    input.select();
                });
            }
        }
    }
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/js/playlistListRenderer.js
git commit -m "feat: select all text on edit start"
```

---

### Task 2: ダブルクリックイベントの追加

**Files:**
- Modify: `src/renderer/js/playlistListRenderer.js`

- [ ] **Step 1: プレイリスト名への `dblclick` 追加 (`render` メソッド内)**

```javascript
            // Existing code
            div.innerHTML = `...`; // (既存のHTML)

            // Add this after div creation/population
            DomUtils.query('.playlist-name', div).addEventListener('dblclick', () => {
                this.togglePlaylistEdit(id);
            });
```

- [ ] **Step 2: アイテム名への `dblclick` 追加 (`renderItems` メソッド内)**

```javascript
            // Existing code
            li.innerHTML = `...`; // (既存のHTML)

            // Add this after li creation/population
            DomUtils.query('.item-title', li).addEventListener('dblclick', () => {
                this.toggleItemEdit(item.id);
            });
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/js/playlistListRenderer.js
git commit -m "feat: add dblclick edit functionality"
```
