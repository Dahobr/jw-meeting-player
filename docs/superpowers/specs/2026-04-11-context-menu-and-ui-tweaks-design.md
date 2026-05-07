# コンテキストメニュー実装とUI改善 設計書

**目標:** BrowserViewでの操作性向上（右クリックメニューによるナビゲーションとダウンロード）および、プレイリスト操作アイコンの視認性改善。不要なナビゲーションボタンの削除。

## 変更内容

### 1. プレイリスト操作アイコンのスタイル改善
- **目的**: プレイリスト一覧の「編集」と「削除」ボタンを常時カラー表示し、ユーザーが操作を見つけやすくする。
- **実装**: `src/renderer/main.css`
  - `.btn-edit` のデフォルト色を `#3498db` (青) に設定。
  - `.btn-delete` のデフォルト色を `#e74c3c` (赤) に設定。
  - `.playlist-actions` の `opacity: 0` を削除し、常時表示（または高めの透過度）にする。

### 2. BrowserView コンテキストメニューの実装
- **目的**: BrowserView上で右クリックした際に、ブラウザ標準に近い操作（戻る、進む、再読み込み、画像保存）を提供し、ナビゲーションボタンなしで操作を完結させる。
- **実装**: `main.js`
  - `view.webContents.on('context-menu', (event, params) => { ... })` を実装。
  - **メニュー項目**:
    - **戻る (Back)**: `view.webContents.canGoBack()` が true の場合のみ表示。
    - **進む (Forward)**: `view.webContents.canGoForward()` が true の場合のみ表示。
    - **再読み込み (Reload)**: 常に表示。
    - **区切り線 (Separator)**
    - **画像を保存 (Save Image As...)**: `params.mediaType === 'image'` の場合のみ表示。
      - 選択時、`view.webContents.downloadURL(params.srcURL)` を実行。
      - 既存の `will-download` 処理によって、保存先選択（自動）およびプレイリストへの追加が行われる。

### 3. 不要なナビゲーションUIの削除
- **目的**: 右クリックメニューでナビゲーションが完結するため、不具合の原因となっていたHTML上のボタンを削除してUIをクリーンにする。
- **実装**:
  - `src/renderer/index.html`: `webview-navigation` divとその中身（戻る・進むボタン）を削除。
  - `src/renderer/main.js`: `btn-back`, `btn-forward` の取得およびイベントリスナーを削除。
  - `preload.js`: `goBack`, `goForward` の露出は削除。

## 成功基準
1. BrowserView上で右クリックすると、履歴に応じた「戻る」「進む」メニューが表示され、正常に動作すること。
2. 画像を右クリックして「画像を保存」を選択すると、これまで通りダウンロードが開始され、プレイリストに追加されること。
3. プレイリストの編集・削除アイコンが、マウスを重ねなくてもはっきり見えること。
4. HTML上の古いナビゲーションボタンが消え、レイアウトが崩れないこと。
