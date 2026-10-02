# Renderer 移行プラン — electron-vite + プレーン Svelte + TypeScript

> 作業ブランチ: `svelte-migration`(`origin/main` から作成)
> 最終更新: 2026-08-17

## 背景と動機

このアプリ自体(Electron 版)に大きな不満はない。移行の目的は **速度でも配布サイズでもなく、renderer の保守性**:

- renderer が **vanilla JS** で、UI が複雑化すると発展性が下がる。
- 実開発で最も悩んだのは **UI 状態が一元化されていない問題** —「片方を変えても別の場所が追従しない」。

### 痛みの正体(調査で特定済み)

- `src/renderer/js/playlistStore.js` は既に subscribe/notify の単一状態源になっており、Svelte の `writable` にほぼそのまま移せる。**状態側は健全。**
- 問題は **描画側**。`src/renderer/js/viewRouter.js` は現在ビューを `style.display !== 'none'`(= DOM)から読み取っている(`isPlaylistView()`)。**DOM が状態の真実になっている**のが desync の元凶。
- `uiManager.js`(710)/`playlistListRenderer.js`(329)/`eventHandler.js`(383)がその手動 DOM 同期層。**ここを「状態 → 宣言的描画」へ置き換えるのが本丸。**

### なぜ WPF でも React でもなく Svelte か

- WPF 全面書き直しは動いている全部(main/IPC/ネイティブ統合)を捨てるため過剰・逆効果。
- 状態非一元化は **TypeScript では直らない**(型は別の障害クラス)。リアクティブな単一状態アーキテクチャが必要。
- Svelte の `writable` ストアは既存 `PlaylistStore`(一元状態 + 購読で自動更新)の発想と 1:1 で一致し、ルーター不要な単一ウィンドウ構成にも無駄がない。
- Electron 相性ルール: **SvelteKit ではなく素の Svelte**、`base:'./'`(相対パス)、ルーター不使用。

## 対象と不変条件

- **対象: renderer のみ。**
- **触らない(不変):**
  - `main.js`、`src/main/*.js`(9 マネージャ)
  - `preload.js` の `electronAPI`(約50 IPC チャンネル)= UI と main の唯一の境界
  - `%APPDATA%` のデータ形式(playlists.json / config.json / メディアフォルダ)
  - electron-builder による NSIS 配布、Zoom 連携 exe(`scripts/ZoomControlManager` 等)
- **原則:** UI は `window.electronAPI` を介してのみ main と会話する。

## 全体戦略

「**ツール入替(electron-vite)**」と「**UI 書換(Svelte)**」を分離して順に検証する。
まず **既存 vanilla renderer のまま** electron-vite で起動確認 → その後 Svelte 化。障害の切り分けを常に一方向にする。

## フェーズ構成

### フェーズ0:準備・安全確保 ✅(このブランチ作成時点で着手済み)
- [x] 移行ブランチ `svelte-migration` を `origin/main` から作成
- [ ] `%APPDATA%\jw-meeting-player` のデータを移行前にバックアップ
- [ ] 要判断①〜④(下記)を確定

### フェーズ1:ツール基盤(挙動は変えない)
- [ ] 依存追加: `electron-vite` `vite` `@sveltejs/vite-plugin-svelte` `svelte` `typescript` `vitest`
- [ ] `electron.vite.config.ts` 作成。**マルチウィンドウ**の renderer エントリを定義:
  - `src/renderer/index.html`(メイン)
  - `src/renderer/playback/playback.html`
  - `src/renderer/tutorial.html`
- [ ] 相性設定: `base:'./'`、ルーター無し、素の Svelte
- [ ] ネイティブ/Node 依存(`music-metadata` `adm-zip` `electron-updater` `marked`)を `externalizeDepsPlugin` で externalize
- [ ] **ゲート:** 既存 vanilla renderer のままビルド&起動し現状どおり動くことを確認(UI 書換の前に「electron-vite が動く」を確定)
- [ ] electron-builder が `out/` を梱包するよう `main` パス等を調整

### フェーズ2:状態アーキテクチャ設計(本丸の中心)
- [ ] `stores/playlists.ts` — 既存 `PlaylistStore` を `writable`+`derived` に移植(add/remove/update/reorder/move)
- [ ] `stores/ui.ts` — **現在 DOM から読んでいるビュー状態を昇格**(現在ビュー playlists/items、オーバーレイ preview/help/webview、アクティブ nav、モーダル)。`viewRouter.js` の `style.display` 操作は全廃
- [ ] `stores/downloads.ts` / `stores/playback.ts` / `stores/displays.ts` — IPC イベントで更新
- [ ] `lib/ipc.ts` — `window.electronAPI` を型付きで薄くラップ。受信イベント→ストア更新の配線を一元化
- [ ] 原則: **コンポーネントは DOM を触らない。UI = f(stores)**

### フェーズ3:コンポーネント移行(ビュー単位で増分的に)
- [ ] `index.html`(198行)を Svelte 分解: `App` / `Header`(ハンバーガー+nav+Zoom)/ `Sidebar`(master-detail: `PlaylistList` ⇄ `ItemList`)/ `PreviewArea` / `Footer`(トランスポート)/ `Modal` / `HelpView`
- [ ] `main.css`(1188行)は当面グローバル1枚で取り込み → 徐々に scoped 化。**pt-BR 文言はそのまま踏襲**
- [ ] 命令的 `viewRouter/uiManager` を `{#if $ui.view === 'items'}` 等のリアクティブ描画へ置換
- [ ] 並べ替え: `sortablejs` を Svelte action(`use:sortable`)化。`Sortable.min.js` 直読み廃止

### フェーズ4:サブウィンドウ(playback / tutorial)
- [ ] playback(html+js+css 約310行)/ tutorial を Svelte 化(**後回し可**。まずメイン画面を優先。マルチエントリで vanilla と共存できる)

### フェーズ5:TypeScript 化の締め
- [ ] `Playlist` / `Item`(status/progress 等)/ IPC ペイロードの型定義
- [ ] ストアと `ipc.ts` を厳格化、コンポーネントは `<script lang="ts">`
- [ ] `tsconfig` はゆるめ開始 → 段階 strict

### フェーズ6:テスト・ビルド・パリティ確認
- [ ] `jest` → `vitest`。ストア(`playlists`/`ui`)単体テストを移植・拡充
- [ ] `electron-builder --win` で NSIS が従来どおり生成されることを確認
- [ ] 現行 `main` と機能パリティの手動確認(閲覧/DL横取り/右クリック/再生/共有/Zoom)
- [ ] `%APPDATA%` 読み書き互換を実機確認

### フェーズ7:片付けと切替
- [ ] 旧 vanilla renderer 削除(`app.js` `uiManager.js` `eventHandler.js` `viewRouter.js` `playlistListRenderer.js` `Sortable.min.js` 等)
- [ ] ドキュメント更新、`main` へマージ

## 要判断ポイント(着手前に決める)

1. **electron-vite の適用範囲** — ① main+preload+renderer 全部(推奨・DX統一・main も TS/HMR、ただしネイティブ依存 externalize が要る)/ ② renderer だけ Vite(変更最小だが DX 分断)。**推奨①**
2. **サブウィンドウ** — playback/tutorial を同時 Svelte 化するか後回しか。**推奨: 後回し**
3. **CSS 方針** — 当面グローバル1枚 →段階 scoped(推奨)/ 最初から全部 scoped
4. **TS 厳格度** — strict 開始 / ゆるめ開始(**推奨: ゆるめ→段階強化**)

## リスクと勘所

- **ネイティブ依存の externalize**(`music-metadata` 等):誤ると本番ビルドで壊れる。フェーズ1ゲートで潰す
- **electron-builder 接続**:`main` エントリが `out/main/…` に変わる。定番だが要確認
- **preload の click ハンドラ**(preload.js 95–118、wol Cântico リンク横取り)は BrowserView 用。renderer 書換の影響外だが preload は現状維持で温存
- **本丸の成否は「DOM を状態源にしない」の徹底**。`viewRouter` 的な DOM 読み取りを1つでも残すと同じ痛みが再発。レビュー観点として明文化

## 規模感

- renderer JS 約4,000行 → Svelte コンポーネント + ストアに再構成
- 消える主対象: `uiManager`(710)/`app.js`(709)/`eventHandler`(383)/`playlistListRenderer`(329)/`viewRouter`(126)
- 移植元 `playlistStore.js`(285)はロジック流用率が高い

## IPC 境界(preload.js の `electronAPI`)

renderer が使える面。Svelte 側は `lib/ipc.ts` でこれを型付きラップする。主なグループ:
Navigation / Downloads / Playback Control / Zoom Automation / Playback Events /
UI & View State / Storage / File System Dialogs / Displays / App Closure / Config。
(詳細は `preload.js` 参照。約50チャンネル。**このシグネチャは変えない**。)

## 参考:過去の .NET 実験からの学び

`..\jw-meeting-player`(.NET/WPF/Blazor Hybrid、コミット `55d3cf9` で停止)で得た教訓:
- WebView2 = Chromium なので Electron より軽くはならない(Blazor Hybrid で Chromium が2つになる)。
- .NET Core の `AppStore`(Dispatch(reducer) + StateChanged)は **まさに欲しかった単一状態パターン**。今回 Svelte ストアで同じ発想を renderer に持ち込む。
- UI パリティ/右クリック仕様/WhatsApp 非永続化などの仕様メモは当時の作業で確定済み(この Electron 版が一次資料)。
