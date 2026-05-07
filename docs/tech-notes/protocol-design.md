# プロトコル実装の設計指針 (media://)

*   **目的:** ローカルのメディアファイル（ダウンロード済み動画・画像）をセキュアに読み込む。
*   **実装方式:** `protocol.registerFileProtocol` を使用。
    *   *理由:* `protocol.handle` + `net.fetch` では、動画ストリーミングに必要な Range リクエスト（ファイルの一部読み込み）が正しく処理されないため。Electron v41 環境においては、`registerFileProtocol` が最も安定して動作する。
*   **戻り値:** 必ず**パス文字列（string）**を返すこと。オブジェクト形式 `{path: '...'}` で返すと、Chromium がリソースを未検出と判断する。
*   **パス解決:** Windows のドライブレターやプレフィックス（media://app/）の処理は `main.js` で一元管理し、Node.js の `path` モジュールで正規化すること。
