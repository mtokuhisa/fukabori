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
     * no-speechエラーの処理（役員インタビュー向け高速回復）
     * 人間にとってno-speechはエラーではない
     */
    handleNoSpeechError() {
        console.log('😶 no-speech - 継続的音声認識では正常動作');
        
        // 次のhandleEndイベントを無視するフラグを設定
        this.ignoreNextEnd = true;
        
        // 🚀 役員インタビュー向け最適化：5秒→3秒に短縮（より迅速な回復）
        setTimeout(() => {
            if (this.ignoreNextEnd) {
                console.log('🔧 no-speech回復タイムアウト（3秒）- フラグをリセット');
                this.ignoreNextEnd = false;
            }
        }, 3000);  // 5秒から3秒に短縮
        
        console.log('🔧 no-speech後のhandleEnd無視フラグを設定（3秒後自動リセット）');
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

// =================================================================================
// VOICE SYSTEM INITIALIZATION - 音声システム初期化
// =================================================================================
// 
// 新デザイン要件対応：
// - 統一状態管理システムの初期化
// - VoiceModule + VoiceUIManager の統合
// - 既存システムとの完全互換性
// - エラーハンドリングとフォールバック
// 
// =================================================================================

class VoiceSystemInitializer {
    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
        this.systems = {
            unifiedStateManager: null,
            voiceModule: null,
            voiceUIManager: null,
            legacyFallback: null
        };
        
        console.log('🚀 VoiceSystemInitializer作成 - 新デザイン対応');
    }
    
    // =================================================================================
    // メイン初期化
    // =================================================================================
    
    async initialize() {
        if (this.isInitialized) {
            console.log('✅ 音声システムは既に初期化済み');
            return true;
        }
        
        if (this.initializationPromise) {
            console.log('🔄 初期化処理進行中 - 待機');
            return await this.initializationPromise;
        }
        
        this.initializationPromise = this.performInitialization();
        return await this.initializationPromise;
    }
    
    async performInitialization() {
        try {
            console.log('🔄 音声システム初期化開始 - 新デザイン対応');
            
            // Step 1: 統一状態管理システムの初期化
            const unifiedSuccess = await this.initializeUnifiedStateManager();
            
            if (unifiedSuccess) {
                // Step 2: 音声モジュールの初期化
                const voiceSuccess = await this.initializeVoiceModule();
                
                if (voiceSuccess) {
                    // Step 3: 音声UI管理システムの初期化
                    const uiSuccess = await this.initializeVoiceUIManager();
                    
                    if (uiSuccess) {
                        console.log('✅ 新システム初期化完了');
                        this.isInitialized = true;
                        return true;
                    }
                }
            }
            
            // フォールバック: 既存システムの使用
            console.warn('⚠️ 新システム初期化失敗 - 既存システムにフォールバック');
            return await this.initializeLegacyFallback();
            
        } catch (error) {
            console.error('❌ 音声システム初期化エラー:', error);
            return await this.initializeLegacyFallback();
        } finally {
            this.initializationPromise = null;
        }
    }
    
    // =================================================================================
    // 統一状態管理システム初期化
    // =================================================================================
    
    async initializeUnifiedStateManager() {
        try {
            console.log('🔄 統一状態管理システム初期化');
            
            // 統一状態管理システムのコアが利用可能かチェック
            if (!window.UnifiedStateManagerCore) {
                console.warn('⚠️ UnifiedStateManagerCore が見つかりません');
                return false;
            }
            
            // インスタンス作成
            window.unifiedStateManager = new window.UnifiedStateManagerCore();
            
            // 初期化実行
            const success = await window.unifiedStateManager.initialize();
            
            if (success) {
                this.systems.unifiedStateManager = window.unifiedStateManager;
                console.log('✅ 統一状態管理システム初期化完了');
                return true;
            } else {
                console.warn('⚠️ 統一状態管理システム初期化失敗');
                return false;
            }
            
        } catch (error) {
            console.error('❌ 統一状態管理システム初期化エラー:', error);
            return false;
        }
    }
    
    // =================================================================================
    // 音声モジュール初期化
    // =================================================================================
    
    async initializeVoiceModule() {
        try {
            console.log('🎤 音声モジュール初期化');
            
            if (!this.systems.unifiedStateManager) {
                console.warn('⚠️ 統一状態管理システムが未初期化');
                return false;
            }
            
            // 音声モジュールの取得
            const voiceModule = this.systems.unifiedStateManager.getModule('voice');
            
            if (!voiceModule) {
                console.warn('⚠️ 音声モジュールが見つかりません');
                return false;
            }
            
            // 音声認識制御システムの初期化
            if (window.voiceRecognitionController) {
                const controllerSuccess = await window.voiceRecognitionController.initialize();
                if (!controllerSuccess) {
                    console.warn('⚠️ 音声認識制御システム初期化失敗');
                }
            }
            
            this.systems.voiceModule = voiceModule;
            console.log('✅ 音声モジュール初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 音声モジュール初期化エラー:', error);
            return false;
        }
    }
    
    // =================================================================================
    // 音声UI管理システム初期化
    // =================================================================================
    
    async initializeVoiceUIManager() {
        try {
            console.log('🎨 音声UI管理システム初期化');
            
            if (!window.VoiceUIManager) {
                console.warn('⚠️ VoiceUIManager が見つかりません');
                return false;
}

            // インスタンス作成
            const voiceUIManager = new window.VoiceUIManager();
            
            // 初期化実行
            const success = await voiceUIManager.initialize();
            
            if (success) {
                this.systems.voiceUIManager = voiceUIManager;
                
                // グローバルアクセス用
                window.voiceUIManager = voiceUIManager;
                
                console.log('✅ 音声UI管理システム初期化完了');
                return true;
            } else {
                console.warn('⚠️ 音声UI管理システム初期化失敗');
                return false;
            }
            
        } catch (error) {
            console.error('❌ 音声UI管理システム初期化エラー:', error);
            return false;
        }
    }
    
    // =================================================================================
    // 既存システムフォールバック
    // =================================================================================
    
    async initializeLegacyFallback() {
        try {
            console.log('🔄 既存システムフォールバック初期化');
            
            // 既存のStateManagerの初期化
            if (window.stateManager) {
                console.log('✅ 既存StateManagerを使用');
                this.systems.legacyFallback = window.stateManager;
                return true;
            }
            
            // 既存システムが利用できない場合
            console.warn('⚠️ 既存システムも利用できません');
            return false;
            
        } catch (error) {
            console.error('❌ 既存システムフォールバック初期化エラー:', error);
            return false;
        }
    }
    
    // =================================================================================
    // 統合API
    // =================================================================================
    
    // 音声認識開始
    async startVoiceRecognition() {
        if (this.systems.voiceModule) {
            return await this.systems.voiceModule.startRecognition();
        } else if (this.systems.legacyFallback) {
            return await this.systems.legacyFallback.startRecognition();
        } else {
            console.warn('⚠️ 音声認識システムが利用できません');
            return false;
        }
    }
    
    // 音声認識停止
    async stopVoiceRecognition() {
        if (this.systems.voiceModule) {
            return this.systems.voiceModule.stopRecognition();
        } else if (this.systems.legacyFallback) {
            return await this.systems.legacyFallback.stopRecognition();
        } else {
            console.warn('⚠️ 音声認識システムが利用できません');
            return false;
        }
    }
    
    // 状態取得
    getVoiceState() {
        if (this.systems.voiceModule) {
            return this.systems.voiceModule.getState();
        } else if (this.systems.legacyFallback) {
            return this.systems.legacyFallback.getState();
        } else {
            return { recognitionState: 'unavailable' };
        }
    }
    
    // =================================================================================
    // システム情報
    // =================================================================================
    
    getSystemInfo() {
        return {
            isInitialized: this.isInitialized,
            activeSystem: this.getActiveSystemName(),
            systems: {
                unifiedStateManager: !!this.systems.unifiedStateManager,
                voiceModule: !!this.systems.voiceModule,
                voiceUIManager: !!this.systems.voiceUIManager,
                legacyFallback: !!this.systems.legacyFallback
            }
        };
    }
    
    getActiveSystemName() {
        if (this.systems.voiceModule) return 'unified';
        if (this.systems.legacyFallback) return 'legacy';
        return 'none';
    }
    
    // デバッグ情報
    debugInfo() {
        const info = this.getSystemInfo();
        console.log('🔍 音声システム情報:', info);
        return info;
    }
    
    // システム破棄
    destroy() {
        if (this.systems.voiceUIManager) {
            this.systems.voiceUIManager.destroy();
        }
        
        Object.keys(this.systems).forEach(key => {
            this.systems[key] = null;
        });
        
        this.isInitialized = false;
        console.log('🗑️ 音声システム破棄完了');
    }
}

// =================================================================================
// グローバル初期化関数
// =================================================================================

// メイン初期化関数
async function initializeVoiceSystem() {
    console.log('🚀 音声システム初期化開始 - 新デザイン対応');
    
    try {
        // 初期化システムのインスタンス作成
        if (!window.voiceSystemInitializer) {
            window.voiceSystemInitializer = new VoiceSystemInitializer();
        }
        
        // 初期化実行
        const success = await window.voiceSystemInitializer.initialize();
        
        if (success) {
            console.log('✅ 音声システム初期化完了');
            
            // デバッグ情報表示
            window.voiceSystemInitializer.debugInfo();
            
            return true;
        } else {
            console.error('❌ 音声システム初期化失敗');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 音声システム初期化エラー:', error);
        return false;
    }
}

// 後方互換性のための関数
async function initializeMicrophoneRecording(forceRecheck = false) {
    console.log('🔄 initializeMicrophoneRecording呼び出し - 新システムに移行');
    return await initializeVoiceSystem();
}

// 音声認識開始（統合API）
async function startVoiceRecognition() {
    if (window.voiceSystemInitializer) {
        return await window.voiceSystemInitializer.startVoiceRecognition();
    } else {
        console.warn('⚠️ 音声システムが初期化されていません');
        return false;
    }
}

// 音声認識停止（統合API）
async function stopVoiceRecognition() {
    if (window.voiceSystemInitializer) {
        return await window.voiceSystemInitializer.stopVoiceRecognition();
    } else {
        console.warn('⚠️ 音声システムが初期化されていません');
        return false;
    }
}

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

window.VoiceSystemInitializer = VoiceSystemInitializer;
window.initializeVoiceSystem = initializeVoiceSystem;
window.initializeMicrophoneRecording = initializeMicrophoneRecording;
window.startVoiceRecognition = startVoiceRecognition;
window.stopVoiceRecognition = stopVoiceRecognition;

console.log('✅ VoiceSystemInitializer 読み込み完了 - 新デザイン要件対応');
console.log('🚀 主要機能:');
console.log('  - 統一状態管理システム初期化');
console.log('  - 音声モジュール + UI管理システム統合');
console.log('  - 既存システムとの完全互換性');
console.log('  - エラーハンドリングとフォールバック'); 