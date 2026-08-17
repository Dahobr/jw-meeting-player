# JW Meeting Player (Electron)

集会用メディアの閲覧・ダウンロード・プレイリスト管理・再生を行う Electron アプリ。
UI 文言はポルトガル語(pt-BR)。ユーザーデータは `%APPDATA%\jw-meeting-player`
(`playlists.json` / `config.json` / メディアフォルダ)。

## 進行中のプロジェクト:renderer の Svelte 移行

**renderer を electron-vite + プレーン Svelte + TypeScript へ書き換える作業中。**
計画と進捗チェックリストは **[docs/SVELTE_MIGRATION_PLAN.md](docs/SVELTE_MIGRATION_PLAN.md) を必ず参照**
(完了したらチェックを更新すること)。作業ブランチ: `svelte-migration`。

- 目的は速度ではなく **保守性**。特に「UI 状態が一元化されておらず、片方を変えても
  別が追従しない」問題の解消。→ 単一状態源(Svelte ストア)+ 宣言的描画で直す。
- **本丸:** `viewRouter.js` 等が DOM を状態源にしている(`style.display` を読む)のをやめ、
  ビュー状態を `stores/ui.ts` に昇格させる。
- 現状: フェーズ0(ブランチ作成)まで完了。フェーズ1(ツール基盤)から着手する。
  着手前に「要判断①〜④」(プラン参照)を確定すること。

### 移行の不変条件(壊さない)

- **main プロセスは触らない:** `main.js`、`src/main/*.js`(9 マネージャ)。
- **IPC 境界を変えない:** `preload.js` の `electronAPI`(約50チャンネル)が UI と main の唯一の接点。
- `%APPDATA%` のデータ形式(playlists.json / config.json)と read/write 互換を維持。
- electron-builder(NSIS)配布と Zoom 連携 exe(`scripts/`)を壊さない。
- **相性ルール:** SvelteKit ではなく素の Svelte / `base:'./'` / ルーター不使用。

## コマンド

- 起動: `npm start`(= `electron main.js`)
- ビルド(配布): `npm run build`(= `electron-builder --win`)
- テスト: `npx jest`(移行後は Vitest を追加予定)
- ※ electron-vite 導入後は起動/ビルドの手順が変わる。プランのフェーズ1参照。

## 作業規約(GEMINI.md 準拠)

- **対話は日本語。** Git コミットメッセージとソースコード内コメントは**英語**。
- **バグ修正・実装の前に、原因の候補と修正プランを説明し、ユーザーの確認を得てから着手する。**
- **新規作業の前に、現在のブランチから feature ブランチを切る。**

## アーキテクチャ(移行後の指針)

- 状態は Svelte ストア(`stores/*.ts`)に一元化。**コンポーネントは DOM を直接操作しない(UI = f(stores))。**
- `window.electronAPI` は `lib/ipc.ts` で型付きラップし、受信 IPC イベント→ストア更新を一元配線。
- UI 非依存ロジックには Vitest テストを付ける。

## 補足

- 過去に .NET/WPF/Blazor Hybrid で書き直す実験(別リポジトリ)を行ったが、
  WebView2=Chromium で軽くならず停止。その `AppStore`(Dispatch+StateChanged)の
  発想を Svelte ストアとして引き継ぐ。機能仕様で迷ったら**この Electron 版が一次資料**。
