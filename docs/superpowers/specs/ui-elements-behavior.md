# UI要素と挙動のドキュメント

このドキュメントは、アプリケーションのUI要素とそのID、関連するJavaScriptコード、およびそれらが担う挙動をま
       とめたものです。これにより、UI要素の機能と意図を常に参照し、コードの保守性と一貫性を高めます。

## 1. ナビゲーションボタン群

### ID: `btnCantico`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内 `this.ui.btnCantico.onclick`)
*   **挙動**: クリックされると、`ipcClient.js` を介してメインプロセスに 'cantico'
       サイトへのナビゲーションを指示します。

### ID: `btnReunioes`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内 `this.ui.btnReunioes.onclick`)
*   **挙動**: クリックされると、`ipcClient.js` を介してメインプロセスに 'reunioes'
       サイトへのナビゲーションを指示します。

### ID: `btnVideos`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内 `this.ui.btnVideos.onclick`)
*   **挙動**: クリックされると、`ipcClient.js` を介してメインプロセスに 'videos'
       サイトへのナビゲーションを指示します。

## 2. フォルダ・インポート関連ボタン

### ID: `btnOpenYearVerseFolder`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内
       `this.ui.btnOpenYearVerseFolder.onclick`)
*   **挙動**: クリックされると、`window.electronAPI`
       を介してメインプロセスに「年の聖句フォルダを開く」処理を依頼します。

### ID: `btnOpenFolder`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内 `this.ui.btnOpenFolder.onclick`)   
*   **挙動**: クリックされると、`ipcClient.js`
       を介してメインプロセスにダウンロードフォルダを開く処理を依頼します。

### ID: `btnImportFile`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内 `this.ui.btnImportFile.onclick`)   
*   **挙動**: クリックされると、`app.js` の `handleImport()`
       メソッドが実行され、ファイル選択ダイアログを開いてインポート処理を開始します。

## 3. プレイリスト管理関連

### ID: `new-playlist-name`
*   **要素タイプ**: `input type="text"`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内 `keydown`
       イベントリスナー、`handleCreatePlaylist()`)
*   **挙動**: 新しいプレイリストの名前を入力するためのテキストフィールドです。Enter
       キーを押すと、入力された名前でプレイリストが作成されます。

### ID: `btn-create-playlist`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/app.js` (`setupUICallbacks` 内
       `this.ui.btnCreatePlaylist.onclick`)
*   **挙動**: クリックされると、`app.js` の `handleCreatePlaylist()`
       メソッドが実行され、`new-playlist-name` 入力フィールドの値を使って新しいプレイリストを作成します。

### ID: `playlist-list`
*   **要素タイプ**: `div`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylists()`)、`app.js`
       (`handleStoreChange()` で `renderPlaylists()` を呼び出し)
*   **挙動**: アプリケーションに存在するプレイリストのリストを表示するコンテナです。

### ID: `view-playlists`
*   **要素タイプ**: `section`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`switchView()`)、`app.js` (`init()`,
       `handleStoreChange()`)
*   **挙動**: プレイリストのリストを表示するメインセクションです。`switchView('playlists')`
       によって表示されます。

### ID: `view-items`
*   **要素タイプ**: `section`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`switchView()`)、`app.js` (`handleStoreChange()` で
       `switchView('items')` が呼ばれる際)
*   **挙動**:
       現在選択されているプレイリスト内のアイテムリストを表示するメインセクションです。`switchView('items')`      
       によって表示されます。

### ID: `current-playlist-title`
*   **要素タイプ**: `h2`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`)、`app.js`
       (`handleStoreChange()` で `renderPlaylistItems()` が呼ばれる際)
*   **挙動**: 現在選択されているプレイリストの名前を表示します。

### ID: `playlist-items-ul`
*   **要素タイプ**: `ul`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`)
*   **挙動**:
       現在選択されているプレイリスト内のアイテム（動画や画像ファイル）のリストを表示するコンテナです。

## 4. プレイリストアイテム関連

### ID: `item-name-${item.id}`
*   **要素タイプ**: `span`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`) で動的に生成。`app.js`    
       (`handleStoreChange()`) で更新。
*   **挙動**: 各アイテムのタイトルを表示します。編集モード時には `edit-item-input` が表示されます。        

### ID: `item-input-${item.id}`
*   **要素タイプ**: `input type="text"`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`)
       で動的に生成。`toggleItemEdit()` 関数で表示/非表示が切り替わります。
*   **挙動**: アイテムのタイトルを編集するためのテキストフィールドです。Enter
       キーまたはフォーカスアウトで編集が確定します。

### ID: `btn-play-item`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`) で動的に生成。`app.js`    
       (`handleItemButtonClick` / `playMedia`, `togglePlayback` など) から間接的に操作されます。
*   **挙動**: アイテムの再生/一時停止、またはライブ送出（`goLive`）を開始します。

### ID: `btn-edit-item`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`)
       で動的に生成。`toggleItemEdit()` 関数で表示/非表示が切り替わります。
*   **挙動**: アイテムのタイトル編集モードに切り替えます。

### ID: `btn-delete-item`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `src/renderer/js/uiManager.js` (`renderPlaylistItems()`)
       で動的に生成。`onItemRemove` コールバック（`app.js` から `uiManager` 経由で呼び出される）が実行されます。  
*   **挙動**: アイテムの削除確認ダイアログを表示し、削除処理を実行します。

## 5. プレビュー関連

### ID: `preview-area`
*   **要素タイプ**: `div`
*   **関連コード箇所**: `uiManager.js` (`showPreview()`, `hidePreview()`)、`app.js`
       (`prepareStagingMedia()`, `goLive()`, `stopMedia()`)
*   **挙動**: 動画または画像プレビューを表示・非表示するためのコンテナです。`toggleWebView(false/true)`    
       と連携して BrowserView の表示も制御します。

### ID: `preview-video`
*   **要素タイプ**: `video`
*   **関連コード箇所**: `app.js` (`setupPreviewListeners`, `prepareStagingMedia`, `goLive`,
       `togglePlayback`, `stopMedia`)、`uiManager.js` (`showPreview`)
*   **挙動**: プレビューとして動画を再生・一時停止・シークします。`currentTime`, `readyState`, `duration`  
       などのプロパT`y` が操作・参照されます。

### ID: `preview-image`
*   **要素タイプ**: `img`
*   **関連コード箇所**: `uiManager.js` (`showPreview()`) で `src` が設定されます。
*   **挙動**: プレビューとして静止画像を表示します。

### ID: `preview-seeker`
*   **要素タイプ**: `input type="range"`
*   **関連コード箇所**: `uiManager.js` (`updateSeeker()`, `updateSeekerLabels()`)、`app.js`
       (`setupPreviewListeners()` でイベントリスナー登録、`currentTime` 設定、IPC 通信)
*   **挙動**:
       動画の再生位置を示し、ドラッグ操作により動画の任意の位置にシーク（ジャンプ）させることができます。

### ID: `preview-time-current`
*   **要素タイプ**: `span`
*   **関連コード箇所**: `uiManager.js` (`updateSeekerLabels()`)
*   **挙動**: 動画の現在の再生時間を「分:秒」形式で表示します。

### ID: `preview-time-total`
*   **要素タイプ**: `span`
*   **関連コード箇所**: `uiManager.js` (`updateSeekerLabels()`)
*   **挙動**: 動画の総時間を「分:秒」形式で表示します。

## 6. 再生コントロールボタン群

### ID: `btn-prev`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `app.js` (`setupUICallbacks` で `onclick` を `playPrevious` に設定)
*   **挙動**: 現在のプレイリストの前のアイテムに移動し、再生を開始します。

### ID: `btn-play-pause`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `app.js` (`setupUICallbacks` で `onclick` を `togglePlayback`
       に設定)。`updatePlaybackUI()` でアイコン（再生/一時停止）が切り替わります。
*   **挙動**: 動画の再生/一時停止を切り替えます。

### ID: `btn-stop`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `app.js` (`setupUICallbacks` で `onclick` を `stopMedia`
       に設定)。`updatePlaybackUI()` で表示/非表示が制御されます。
*   **挙動**: 現在のメディア再生を停止し、スタンバイ画面に戻ります。

### ID: `btn-next`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `app.js` (`setupUICallbacks` で `onclick` を `playNext` に設定)
*   **挙動**: 現在のプレイリストの次のアイテムに移動し、再生を開始します。

### ID: `btn-fullscreen`
*   **要素タイプ**: `button`
*   **関連コード箇所**: `app.js` (`setupUICallbacks` で `onclick` を `ipc.playbackControl({ action:        
       'toggle-fullscreen' })` に設定)
*   **挙動**: クリックされると、動画プレイヤーのフルスクリーン表示を切り替えます。

## 7. ボリュームコントロール

### ID: `volume-slider`
*   **要素タイプ**: `input type="range"`
*   **関連コード箇所**: `app.js` (`setupUICallbacks` で `oninput` を `(e) => this.ipc.playbackControl({    
       action: 'set-volume', volume: e.target.value / 100 })` に設定)
*   **挙動**:
       スライダーを操作することで、動画の音量レベル（0から100%）を調整し、メインプロセスに通知します。

## 8. 情報表示・その他

### ID: `current-item-info`
*   **要素タイプ**: `span`
*   **関連コード箇所**: `app.js` (`updateCurrentItemInfo()`, `updateDisplayStatus()`)、`uiManager.js`      
       (`updateCurrentItemInfo()`, `updateDisplayStatus()`)
*   **挙動**:
       現在再生中またはスタンバイ中のアイテム情報（タイトルなど）や、セカンドモニターの接続状態（警告表示）を表示 
       します。

### ID: `webview-container`
*   **要素タイプ**: `section`
*   **関連コード箇所**: `app.js` (`startBoundsMonitoring()`)、`main.js` (`update-view-bounds` IPC)
*   **挙動**: Web
       コンテンツ（`BrowserView`）が表示される領域のコンテナです。ウィンドウリサイズ時に、このコンテナのサイズに合
       わせて `BrowserView` のサイズも調整されます。

## 9. プレビューシーカーの更新ロジック (詳細調査結果)

### ID: `preview-seeker` (再掲)
*   **挙動の更新**:
    *   **更新関数**: `uiManager.js` の `updateSeeker(current, total)` および `updateSeekerLabels(current, total)` が `previewSeeker` の値と視覚的状態 (`backgroundSize`) を更新する役割を担います。
    *   **更新トリガー**:
        *   `app.js` の `setupPreviewListeners()` 内の `video.ontimeupdate` イベントリスナーは、動画再生中に `uiManager.js` の更新関数を呼び出し、プレビューシーカーを現在の再生時間に同期させます。
        *   動画のメタデータロード時 (`video.onloadedmetadata`) や、ユーザーがプレビューシーカーを直接操作した際 (`seeker.oninput`, `seeker.onmouseup`) にも、`uiManager.js` の更新関数が `app.js` から呼び出されます。
    *   **現在の問題点**:
        *   セカンドモニターで再生中にシーク操作が行われた場合、そのシーク完了を通知するIPCメッセージを `app.js` が受信し、それに応じて `uiManager.js` の更新関数を呼び出して `previewSeeker` を同期させるための明確なリスナーや処理が見当たりません。
        *   `app.js` の `ipc.onMediaPlaybackStateChange` リスナーは再生状態の変更（再生中/一時停止）を検知しますが、シーク操作後の正確な `currentTime` を取得して `previewSeeker` を更新するまでには至っていません。
        *   結果として、セカンドモニターでのシーク操作は `playback.js` で正しく反映されますが、メインウィンドウの `previewSeeker` は同期せず、古い位置や不正確な位置を示し続ける、またはリセットされてしまう可能性があります。
*   **関連コード箇所**:
    *   **更新処理**: `src/renderer/js/uiManager.js` (`updateSeeker`, `updateSeekerLabels`)
    *   **更新呼び出し**: `src/renderer/js/app.js` (`setupPreviewListeners` の `video.ontimeupdate`, `seeker.oninput`, `seeker.onmouseup`, `prepareStagingMedia`, `goLive`, `stopMedia`)
    *   **IPC受信・状態更新**: `src/renderer/js/app.js` (`setupIPCListeners` 内の `ipc.onMediaPlaybackStateChange`, `ipc.onLoadMedia`)
    *   **IPC送信（セカンドモニターへのseek）**: `src/renderer/js/app.js` (`seeker.onmouseup` 内 `this.ipc.playbackControl({ action: 'seek', time: time });`)
    *   **IPC受信（セカンドモニターからのseek実行）**: `src/renderer/playback/playback.js` (`window.electronAPI.onPlaybackCommand` で `'seek'` アクションを処理)
*   **課題**: セカンドモニターでのシーク操作後に、メインウィンドウの `previewSeeker` を正確な再生時間で更新するための、IPCメッセージ受信から `uiManager.js` の更新関数呼び出しまでの一連の処理を実装する必要があります。