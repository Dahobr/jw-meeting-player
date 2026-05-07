# UI視認性向上とリンク遷移修正 設計書

**目標:** 選択中プレイリストのアイコン視認性改善、および `target="_blank"` リンクを現在のBrowserViewで開くように修正。

## 変更内容

### 1. 選択中プレイリストのアイコン色修正
- **目的**: プレイリストが選択状態（青背景）のとき、アイコン（✎, 🗑）が同系色で埋もれてしまう問題を解決するため、アイコンの色を白にする。
- **実装**: `src/renderer/main.css`
  - `.playlist-item-card.active .btn-action` セレクタを追加。
  - `color: #ffffff;` を設定。

### 2. BrowserView のリンク遷移制御 (`target="_blank"` 対応)
- **目的**: 新しいウィンドウを開こうとするリンク（`target="_blank"`）をクリックした際、別ウィンドウを作らずに現在のBrowserView内でページを遷移させる。
- **実装**: `main.js`
  - `view.webContents.setWindowOpenHandler` を使用。
  - `details.url` を取得し、`view.webContents.loadURL(details.url)` を呼び出して現在のビューで読み込む。
  - `{ action: 'deny' }` を返して新しいウィンドウの生成を阻止する。

## 成功基準
1. プレイリストを選択した際、背景が青くなり、その中の「編集」と「削除」アイコンが白色でくっきりと表示されること。
2. BrowserView内の `target="_blank"` が指定されたリンクをクリックした際、新しいウィンドウが開かずに現在のビュー内でページが切り替わること。
