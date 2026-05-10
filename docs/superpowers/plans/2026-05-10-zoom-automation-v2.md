# Zoom連携フロー刷新 実装計画書

**目的:** ユーザーの提示したフローに基づき、Zoom画面共有の全自動化を確実に実現する。

**アーキテクチャ:**
1. アプリ起動時に古い座標データを破棄。
2. 初回再生時はキャプチャモード、2回目以降は監視モードとして動作。
3. C#ヘルパーで背景色の変化を検知し、Zoomウィンドウの開閉を判定。
4. 動画のポーズ・再開をZoomの状態と完全に同期させる。

---

### タスク 1: 起動時の座標クリア

**ファイル:**
- 変更: `src/main/storageManager.js`
- 変更: `main.js`

- [ ] **Step 1: `storageManager.js` に座標削除メソッドを追加**
```javascript
// src/main/storageManager.js
    clearZoomCoords() {
        const appData = app.getPath('userData');
        const coordsPath = path.join(appData, 'JwMeetingPlayer', 'zoom_coords.json');
        if (fs.existsSync(coordsPath)) {
            fs.unlinkSync(coordsPath);
            console.log('[Storage] Zoom coordinates cleared.');
        }
    }
```

- [ ] **Step 2: `main.js` で起動時に呼び出し**
```javascript
// main.js
app.whenReady().then(() => {
    initializeGlobalManagers();
    storageManager.clearZoomCoords(); // 追加
    createMainWindow();
});
```

### タスク 2: C# ヘルパーのロジック刷新

**ファイル:**
- 変更: `scripts/ZoomControlManager/Program.cs`

- [ ] **Step 1: `MonitorShareFlow` のアルゴリズム変更**
```csharp
// scripts/ZoomControlManager/Program.cs

        static void MonitorShareFlow(string cachePath)
        {
            // 1. 座標読み込み
            var cache = ...; // 既存の読み込み処理
            int x = cache["x"];
            int y = cache["y"];

            // 2. ウィンドウが開く前の背景色を取得
            Color initialColor = GetPixelColor(x, y);

            // 3. Alt+S 送信
            SendAltS();

            // 4. 色が変わる（Zoomウィンドウが出現）のを待つ
            bool opened = false;
            for (int i = 0; i < 50; i++) {
                Thread.Sleep(200);
                if (!ColorsAreClose(GetPixelColor(x, y), initialColor, 20)) {
                    opened = true;
                    break;
                }
            }

            if (opened) {
                // 5. 保存された座標でダブルクリック
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);
                Thread.Sleep(100);
                mouse_event(MOUSEEVENTF_LEFTDOWN, x, y, 0, 0);
                mouse_event(MOUSEEVENTF_LEFTUP, x, y, 0, 0);

                // 6. 色が元に戻る（Zoomウィンドウが閉じる）のを待つ
                for (int i = 0; i < 500; i++) {
                    Thread.Sleep(500);
                    if (ColorsAreClose(GetPixelColor(x, y), initialColor, 20)) break;
                }
            }
        }
```

- [ ] **Step 2: C#をビルドして実行ファイルを更新**

### タスク 3: Integration層の分岐処理

**ファイル:**
- 変更: `zoomIntegration.js`

- [ ] **Step 1: 座標ファイルの有無による処理の切り替え**
```javascript
// zoomIntegration.js

function startZoomSharing(mode) {
    if (mode === 'auto') {
        const coordsPath = path.join(app.getPath('userData'), 'JwMeetingPlayer', 'zoom_coords.json');
        
        if (!fs.existsSync(coordsPath)) {
            // 初回：Alt+S送信してキャプチャモード
            sendZoomShortcut();
            spawn(exePath, ['--mode=capture']);
        } else {
            // 2回目以降：監視モード（C#内部でAlt+S送信）
            spawn(exePath, ['--mode=monitor-share']);
        }
    }
}
```

### タスク 4: 動画の自動一時停止と再開

**ファイル:**
- 変更: `src/renderer/js/app.js`

- [ ] **Step 1: 再生開始時にポーズを実行**
```javascript
// src/renderer/js/app.js (goLive)
    if (isAuto && item.mediaType === 'video') {
        this.ui.previewVideo.pause();
        this.status = 'staged';
    }
```

- [ ] **Step 2: 連携終了時に再開を実行**
```javascript
// src/renderer/js/app.js (setupIPCListeners)
    window.electronAPI.onZoomSharingFinished(() => {
        if (this.currentMedia?.mediaType === 'video' && isAuto) {
            this.ui.previewVideo.play();
            this.status = 'playing';
            this.updatePlaybackUI();
        }
    });
```
