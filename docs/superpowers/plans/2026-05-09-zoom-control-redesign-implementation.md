# Zoom自動化リデザイン Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zoom画面共有自動化をPython依存からC#ネイティブ（ピクセル監視・座標記憶型）へ移行し、メディア再生と完全に同期させる。

**Architecture:** 既存の `ZoomKeySender.exe` を発展させた統合型C#ツール (`ZoomControlManager.exe`) を作成。Electron側はこれと同期的に通信し、プロセス終了をトリガーに動画再生を制御する。

**Tech Stack:** C#, Electron (Node.js), .NET (Windows native)

---

### Task 1: 不要資産のクリーンアップ

**Files:**
- Remove: `scripts/zoom_automate.py`
- Remove: `assets/zoom/*.png` (全ての画像素材)
- Modify: `zoomIntegration.js` (Python呼び出しロジックの削除)

- [ ] **Step 1: Pythonスクリプトおよび画像素材の削除**
- [ ] **Step 2: `zoomIntegration.js` のクリーンアップ** (Zoom連携に関連する古いPython呼び出しロジックをコメントアウトまたは削除し、新規実装用の空枠を作る)

### Task 2: ZoomControlManager.exe の実装

**Files:**
- Create: `scripts/ZoomControlManager/Program.cs` (C#ソリューション)

- [ ] **Step 1: 座標記憶とピクセル監視を行う基本機能の実装** (RGB差分検知ロジックを含む)
- [ ] **Step 2: コマンドライン引数 (`--mode=sendkey`, `--mode=monitor-share`) のパーサー実装**
- [ ] **Step 3: コンパイルとビルド** (ZoomControlManager.exe の作成)

### Task 3: Electron側の呼び出しロジック実装

**Files:**
- Modify: `zoomIntegration.js`

- [ ] **Step 1: `ZoomControlManager.exe` を非同期プロセスとして呼び出す機能の実装**
- [ ] **Step 2: 共有完了信号を待機し、メディアタイプに応じた再生再開処理を実装** (動画: `.play()`, 画像: なし)

### Task 4: 動作検証

- [ ] **Step 1: 動画での画面共有テスト** (再生の一時停止・再開が確実に行われるか)
- [ ] **Step 2: 画像での画面共有テスト** (一時停止解除などの誤動作がないか)

---
## セルフチェック
1. [ ] 各タスクは独立しており、逐次実行可能か。
2. [ ] 削除予定のファイルは完全に削除可能か。
3. [ ] C#側でウィンドウの閉鎖検知のしきい値調整が可能か。
