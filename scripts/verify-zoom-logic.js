/**
 * Zoom連携再生ロジック検証スクリプト
 * 
 * 使い方:
 * 1. アプリを起動する
 * 2. Ctrl+Shift+I でデベロッパーツールを開く
 * 3. このスクリプトの内容を Console に貼り付けて Enter
 */

(async function verifyZoomLogic() {
    console.log('%c--- Zoom再生ロジック検証開始 ---', 'color: blue; font-weight: bold;');

    const app = window.app;
    if (!app) {
        console.error('Appインスタンスが見つかりません。');
        return;
    }

    // モックのアイテム作成
    const mockVideoItem = {
        id: 'test-video',
        title: 'Test Video',
        filePath: 'media://test.mp4',
        mediaType: 'video'
    };

    // --- テスト1: 動画再生開始時の待機状態チェック ---
    console.log('\nテスト1: 動画再生開始時のポーズ待機チェック...');
    
    // Zoomモードを'auto'に設定
    if (app.ui.zoomModeSelect) app.ui.zoomModeSelect.value = 'auto';
    
    // 再生実行
    app.playMedia(mockVideoItem);

    // 期待値: statusが'paused'であること
    setTimeout(() => {
        if (app.status === 'paused') {
            console.log('✅ 成功: ステータスが "paused" (NO AR) で待機しています。');
        } else {
            console.error('❌ 失敗: ステータスが ' + app.status + ' です。paused を期待しています。');
        }

        // --- テスト2: 信号受信による再開チェック ---
        console.log('\nテスト2: Zoom信号(STARTED)受信による再開チェック...');

        // STARTED信号を模倣（ElectronのIPC経由で届くイベントをシミュレート）
        // app.setupIPCListeners で登録したコールバックを直接叩くか、イベントを発火させる
        // 今回は実装した resumePlayback を信号受信時に呼ぶロジックを検証
        
        console.log('信号 [C#] STARTED をシミュレート中...');
        
        // 直接 resumePlayback を呼ぶ（信号受信時の挙動）
        app.resumePlayback();

        setTimeout(() => {
            if (app.status === 'playing') {
                console.log('✅ 成功: 信号受信後にステータスが "playing" に遷移しました。');
            } else {
                console.error('❌ 失敗: ステータスが ' + app.status + ' です。playing を期待しています。');
            }

            // --- テスト3: 停止時のクリーンアップ ---
            console.log('\nテスト3: 停止時の状態リセットチェック...');
            app.stopMedia('test cleanup');

            if (app.status === 'stopped' && app.currentMedia === null) {
                console.log('✅ 成功: 停止後に状態がリセットされました。');
            } else {
                console.error('❌ 失敗: 停止後の状態が不正です。');
            }

            console.log('\n%c--- 検証完了 ---', 'color: blue; font-weight: bold;');
        }, 500);
    }, 500);
})();
