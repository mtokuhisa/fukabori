/**
 * 音声認識エラーハンドラー
 * no-speech後の不正終了対策とエラー回復機能
 */
class VoiceErrorHandler {
    constructor(recognitionManager) {
        this.recognitionManager = recognitionManager;
        this.ignoreNextEnd = false;
        this.errorCount = 0;
        this.lastErrorTime = 0;
        this.errorTypes = {
            NO_SPEECH: 'no-speech',
            ABORTED: 'aborted',
            NETWORK: 'network',
            AUDIO_CAPTURE: 'audio-capture',
            NOT_ALLOWED: 'not-allowed'
        };
    }

    /**
     * no-speechエラーの処理
     * 人間にとってno-speechはエラーではない
     */
    handleNoSpeechError() {
        console.log('😶 no-speech - 継続的音声認識では正常動作');
        
        // 次のhandleEndイベントを無視するフラグを設定
        this.ignoreNextEnd = true;
        
        console.log('🔧 no-speech後のhandleEnd無視フラグを設定');
        return true; // 正常処理として扱う
    }

    /**
     * handleEndイベントの処理判定
     * no-speech後の不正終了を防ぐ
     */
    shouldIgnoreEndEvent() {
        if (this.ignoreNextEnd) {
            console.log('🔧 no-speech後の終了イベント - 無視して継続');
            this.ignoreNextEnd = false; // フラグをリセット
            return true;
        }
        return false;
    }

    /**
     * abortedエラーの処理
     * 「音声認識が中断されました」→「音声認識が予期せず停止しました」
     */
    handleAbortedError() {
        console.log('⚠️ aborted - 音声認識が予期せず停止しました');
        
        // 適切なエラー処理
        this.recordError(this.errorTypes.ABORTED);
        
        // エラー状態に移行
        this.setErrorState('音声認識が予期せず停止しました');
        return false;
    }

    /**
     * ネットワークエラーの処理
     */
    handleNetworkError() {
        console.log('🌐 network - ネットワーク接続を確認してください');
        
        this.recordError(this.errorTypes.NETWORK);
        this.setErrorState('ネットワーク接続を確認してください');
        return false;
    }

    /**
     * オーディオキャプチャエラーの処理
     */
    handleAudioCaptureError() {
        console.log('🎤 audio-capture - マイクへのアクセスに問題があります');
        
        this.recordError(this.errorTypes.AUDIO_CAPTURE);
        this.setErrorState('マイクへのアクセスに問題があります');
        return false;
    }

    /**
     * マイク許可エラーの処理
     */
    handleNotAllowedError() {
        console.log('🚫 not-allowed - マイクの使用許可が必要です');
        
        this.recordError(this.errorTypes.NOT_ALLOWED);
        this.setErrorState('マイクの使用許可が必要です');
        return false;
    }

    /**
     * エラーの記録
     */
    recordError(errorType) {
        this.errorCount++;
        this.lastErrorTime = Date.now();
        
        console.log(`📊 エラー記録: ${errorType} (累計: ${this.errorCount}回)`);
    }

    /**
     * エラー状態の設定
     */
    setErrorState(message) {
        console.log(`🔄 エラー状態移行: ${message}`);
        
        // 継続性監視を停止
        if (this.recognitionManager.stopContinuityMonitor) {
            this.recognitionManager.stopContinuityMonitor();
        }
        
        // 音声認識オブジェクトを無効化
        this.recognitionManager.recognition = null;
        this.recognitionManager.state = 'error';
        this.recognitionManager.continuity.neverStopped = false;
        this.recognitionManager.continuity.startedOnce = false;
        
        // UI更新通知
        if (this.recognitionManager.notifyListeners) {
            this.recognitionManager.notifyListeners();
        }
    }

    /**
     * エラー回復時の統計リセット
     */
    resetStatsOnRecovery() {
        if (this.recognitionManager.state === 'error') {
            console.log('🔄 エラー状態からの再開 - 統計情報をリセット');
            
            // start()呼び出し回数をリセット
            this.recognitionManager.stats.startCount = 0;
            this.recognitionManager.stats.microphonePermissionRequests = 0;
            
            console.log('✅ 統計情報リセット完了');
        }
    }

    /**
     * 統合エラーハンドラー
     * 既存のhandleRecognitionErrorと統合
     */
    handleError(event) {
        console.log(`😨 継続的音声認識エラー: ${event.error}`);
        
        switch (event.error) {
            case this.errorTypes.NO_SPEECH:
                return this.handleNoSpeechError();
                
            case this.errorTypes.ABORTED:
                return this.handleAbortedError();
                
            case this.errorTypes.NETWORK:
                return this.handleNetworkError();
                
            case this.errorTypes.AUDIO_CAPTURE:
                return this.handleAudioCaptureError();
                
            case this.errorTypes.NOT_ALLOWED:
                return this.handleNotAllowedError();
                
            default:
                console.warn(`⁉️ 未知のエラー: ${event.error}`);
                this.recordError(event.error);
                this.setErrorState(`未知のエラーが発生しました: ${event.error}`);
                return false;
        }
    }

    /**
     * エラー統計の取得
     */
    getErrorStats() {
        return {
            errorCount: this.errorCount,
            lastErrorTime: this.lastErrorTime,
            lastErrorType: this.lastErrorType,
            ignoreNextEnd: this.ignoreNextEnd
        };
    }

    /**
     * デバッグ情報の表示
     */
    debugInfo() {
        console.log('🔍 VoiceErrorHandler Debug Info:', {
            errorCount: this.errorCount,
            lastErrorTime: this.lastErrorTime,
            ignoreNextEnd: this.ignoreNextEnd,
            recognitionState: this.recognitionManager.state
        });
    }
}

// グローバル利用のためのエクスポート
if (typeof window !== 'undefined') {
    window.VoiceErrorHandler = VoiceErrorHandler;
}

// モジュールエクスポート（将来的なモジュール化対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceErrorHandler;
} 