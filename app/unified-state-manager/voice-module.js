/**
 * 統一状態管理システム - 音声モジュール
 * 
 * 🎯 Phase 1B新機能: 編集保護メカニズム
 * - 編集中の音声認識による上書き防止
 * - 状態競合回避システム
 * - 安全な音声更新制御
 * 
 * @version 0.7.5-phase1b
 * @author AI Assistant  
 * @updated 2025-01-26
 */

// =================================================================================
// Phase 1B: 編集保護メカニズム
// =================================================================================

/**
 * 文字起こし保護管理クラス - 編集中の音声更新を防ぐ
 */
class TranscriptProtectionManager {
    constructor() {
        this.protectedSources = new Set();
        this.protectionStartTime = null;
        this.maxProtectionDuration = 10000; // 10秒の自動保護解除
    }
    
    /**
     * 編集中かどうかを確認
     */
    static isEditInProgress() {
        return window.transcriptEditManager?.isEditing || false;
    }
    
    /**
     * 保護が必要かどうかを判定
     */
    static shouldPreventVoiceUpdate(source) {
        const instance = window.TranscriptProtectionManager;
        if (!instance) return false;
        
        // 編集中の場合は更新をブロック
        if (this.isEditInProgress()) {
            instance.logProtection(`🛡️ 編集中のため音声更新をブロック: ${source}`);
            return true;
        }
        
        // 手動保護が設定されている場合
        if (instance.protectedSources.has(source)) {
            // 保護時間の自動解除チェック
            if (instance.protectionStartTime && 
                Date.now() - instance.protectionStartTime > instance.maxProtectionDuration) {
                instance.clearProtection();
                return false;
            }
            
            instance.logProtection(`🛡️ 手動保護中のため音声更新をブロック: ${source}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * 保護開始
     */
    static startProtection(source, duration = null) {
        const instance = window.TranscriptProtectionManager;
        if (!instance) return;
        
        instance.protectedSources.add(source);
        instance.protectionStartTime = Date.now();
        
        if (duration) {
            setTimeout(() => {
                instance.protectedSources.delete(source);
                instance.logProtection(`⏰ 保護自動解除: ${source}`);
            }, duration);
        }
        
        instance.logProtection(`🛡️ 保護開始: ${source}`);
    }
    
    /**
     * 保護解除
     */
    static clearProtection() {
        const instance = window.TranscriptProtectionManager;
        if (!instance) return;
        
        instance.protectedSources.clear();
        instance.protectionStartTime = null;
        instance.logProtection('🔓 全保護解除');
    }
    
    /**
     * 特定ソースの保護解除
     */
    static clearSourceProtection(source) {
        const instance = window.TranscriptProtectionManager;
        if (!instance) return;
        
        instance.protectedSources.delete(source);
        instance.logProtection(`🔓 保護解除: ${source}`);
    }
    
    /**
     * 保護ログ記録
     */
    logProtection(message) {
        console.log(`[TranscriptProtection] ${message}`);
        
        // StateUpdateControllerにもログを記録
        if (window.StateUpdateController) {
            window.StateUpdateController.logDebug(message);
        }
    }
    
    /**
     * 保護状態取得
     */
    getProtectionStatus() {
        return {
            isEditInProgress: TranscriptProtectionManager.isEditInProgress(),
            protectedSources: Array.from(this.protectedSources),
            protectionStartTime: this.protectionStartTime,
            currentTime: Date.now()
        };
    }
}

// グローバルインスタンス作成
window.TranscriptProtectionManager = new TranscriptProtectionManager();

// =================================================================================
// 既存のVoiceModuleクラス拡張
// =================================================================================

/**
 * 音声認識モジュール - 統一状態管理システム
 * 深堀アプリ専用：企業セッション向けシンプル音声認識
 * 新デザイン要件対応：6つの音声認識状態 + 自動復旧
 */

class VoiceModule {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.recognition = null;
        this.isInitialized = false;
        
        // 🎤 新デザイン要件：6つの音声認識状態
        this.state = {
            // 基本状態（6つの状態）
            recognitionState: 'idle', // idle, starting, active, stopping, error, network-error, permission-denied
            isListening: false,
            microphonePermissionGranted: false,
            
            // 音声データ
            currentTranscript: '',
            finalTranscript: '',
            confidence: 0,
            
            // エラー情報
            lastError: null,
            errorCount: 0,
            autoRecoveryAttempts: 0,
            
            // 統計情報
            sessionStartTime: null,
            totalListeningTime: 0,
            recognitionCount: 0,
            lastActivity: Date.now()
        };
        
        // 🔧 設計思想: 「無音は正常」- 自動復旧システム完全無効化
        this.autoRecovery = {
            enabled: false,  // 無音時間監視廃止
            maxAttempts: 0,
            retryDelay: 0,
            currentAttempt: 0,
        };
        
        // 🚫 Electron環境でのネットワークエラー再試行制御
        this.electronRetryControl = {
            maxRetries: 3,              // 最大再試行回数
            currentRetryCount: 0,       // 現在の再試行回数
            retryDelay: 2000,          // 初期待機時間（2秒）
            maxRetryDelay: 30000,      // 最大待機時間（30秒）
            backoffMultiplier: 2,      // 待機時間の倍率
            lastRetryTime: 0,          // 最後の再試行時刻
            consecutiveErrors: 0,      // 連続エラー回数
            isInCooldown: false,       // クールダウン中フラグ
            cooldownDuration: 60000,   // クールダウン時間（1分）
            lastAttemptTime: null
        };
        
        // イベントリスナー
        this.listeners = new Set();
        
        console.log('🎤 VoiceModule初期化完了 - 新デザイン対応');
    }
    
    // =================================================================================
    // 初期化・設定
    // =================================================================================
    
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            console.log('🔄 音声認識モジュール初期化開始');
            
            // Web Speech API の可用性チェック
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Web Speech API がサポートされていません');
            }
            
            // 音声認識インスタンスの作成
            this.createRecognitionInstance();
            
            // マイク許可の確認
            await this.checkMicrophonePermission();
            
            this.isInitialized = true;
            console.log('✅ 音声認識モジュール初期化完了');
            
            return true;
        } catch (error) {
            console.error('❌ 音声認識モジュール初期化エラー:', error);
            this.updateState({ 
                recognitionState: 'error', 
                lastError: error.message 
            });
            return false;
        }
    }
    
    createRecognitionInstance() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // 🔧 新デザイン要件：企業セッション向け最適化設定（役員インタビュー対応）
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ja-JP';
        this.recognition.maxAlternatives = 3;  // 1→3に変更：音声認識精度向上
        
        // イベントハンドラーの設定
        this.setupEventHandlers();
        
        console.log('🎤 音声認識インスタンス作成完了 - 企業セッション最適化');
    }
    
    setupEventHandlers() {
        // 開始イベント（Electron再試行制御リセット付き）
        this.recognition.onstart = () => {
            console.log('🎤 音声認識開始');
            this.updateState({ 
                recognitionState: 'active',
                isListening: true,
                sessionStartTime: Date.now(),
                lastActivity: Date.now()
            });
            this.resetAutoRecovery();
            
            // Electron環境での再試行制御をリセット（成功時）
            if (navigator.userAgent.toLowerCase().indexOf('electron') > -1) {
                this.electronRetryControl.currentRetryCount = 0;
                this.electronRetryControl.consecutiveErrors = 0;
                console.log('✅ Electron環境: 音声認識成功 - 再試行制御をリセット');
            }
        };
        
        // 結果イベント
        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };
        
        // 終了イベント
        this.recognition.onend = () => {
            console.log('🎤 音声認識終了');
            this.handleEnd();
        };
        
        // エラーイベント（Electron対応 - 無限ループ防止）
        this.recognition.onerror = (event) => {
            console.error('❌ 音声認識エラー:', event.error);
            
            // Electron環境でのネットワークエラー対応（制御付き）
            if (event.error === 'network' && navigator.userAgent.toLowerCase().indexOf('electron') > -1) {
                this.handleElectronNetworkError();
                return;
            }
            
            this.handleError(event);
        };
        
        // 音声検出イベント
        this.recognition.onspeechstart = () => {
            console.log('🗣️ 音声検出開始');
            this.updateState({ 
                isListening: true,
                lastActivity: Date.now()
            });
        };
        
        this.recognition.onspeechend = () => {
            console.log('🤐 音声検出終了');
            this.updateState({ 
                isListening: false,
                lastActivity: Date.now()
            });
        };
    }
    
    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            
            this.updateState({ microphonePermissionGranted: true });
            console.log('✅ マイク許可確認完了');
            return true;
        } catch (error) {
            console.warn('⚠️ マイク許可が必要です:', error);
            this.updateState({ 
                microphonePermissionGranted: false,
                recognitionState: 'permission-denied',
                lastError: 'マイク許可が必要です'
            });
            return false;
        }
    }
    
    // =================================================================================
    // 音声認識制御（新デザイン要件対応）
    // =================================================================================
    
    async startRecognition() {
        if (!this.isInitialized) {
            console.warn('⚠️ 音声認識モジュールが初期化されていません');
            return false;
        }
        
        if (this.state.recognitionState === 'active') {
            console.log('🎤 音声認識は既に開始されています');
            return true;
        }
        
        try {
            console.log('🔄 音声認識開始処理');
            this.updateState({ recognitionState: 'starting' });
            
            // マイク許可の再確認
            if (!this.state.microphonePermissionGranted) {
                const permitted = await this.checkMicrophonePermission();
                if (!permitted) {
                    throw new Error('マイク許可が必要です');
                }
            }
            
            this.recognition.start();
            return true;
            
        } catch (error) {
            console.error('❌ 音声認識開始エラー:', error);
            this.updateState({ 
                recognitionState: 'error',
                lastError: error.message 
            });
            
            // 🔧 自動復旧試行
            this.attemptAutoRecovery();
            return false;
        }
    }
    
    stopRecognition() {
        if (this.state.recognitionState !== 'active') {
            console.log('🎤 音声認識は開始されていません');
            return;
        }
        
        try {
            console.log('🛑 音声認識停止処理');
            this.updateState({ recognitionState: 'stopping' });
            this.recognition.stop();
            
        } catch (error) {
            console.error('❌ 音声認識停止エラー:', error);
            this.updateState({ 
                recognitionState: 'error',
                lastError: error.message 
            });
        }
    }
    
    /**
     * 手動一時停止（透明継続を無効化）
     */
    pauseRecognition() {
        if (this.state.recognitionState === 'active') {
            console.log('⏸️ 手動一時停止実行');
            this.updateState({ recognitionState: 'paused' });
            this.recognition.stop();
        } else {
            console.log('⏸️ 音声認識は動作していません');
        }
    }
    
    /**
     * 手動再開（一時停止からの復帰）
     */
    resumeRecognition() {
        if (this.state.recognitionState === 'paused' || this.state.recognitionState === 'idle') {
            console.log('▶️ 手動再開実行');
            this.startRecognition();
        } else {
            console.log('▶️ 音声認識は既に動作中です');
        }
    }
    
    // 🔧 レガシー機能削除完了 - 新しい手動一時停止システムに移行済み
    
    // 🔧 継続的音声認識用：結果処理再開
    resumeProcessing(reason = 'unknown') {
        console.log(`🔄 音声認識結果処理再開: ${reason}`);
        
        // 継続的音声認識では音声認識自体は停止せずに結果処理のみ再開
        if (this.state.recognitionState === 'active') {
            console.log('✅ 継続的音声認識は既にアクティブ - 結果処理継続');
            return true;
        }
        
        // 停止中の場合は通常の再開処理
        return this.resumeRecognition();
    }
    
    // =================================================================================
    // イベント処理
    // =================================================================================
    
    handleResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
                console.log('📝 最終結果:', transcript, `(信頼度: ${confidence})`);
            } else {
                interimTranscript += transcript;
            }
        }
        
        this.updateState({
            currentTranscript: interimTranscript,
            finalTranscript: finalTranscript,
            confidence: event.results[event.results.length - 1][0].confidence || 0,
            recognitionCount: this.state.recognitionCount + (finalTranscript ? 1 : 0),
            lastActivity: Date.now()
        });
        
        // 🔧 既存システムとの互換性：AppStateの更新
        this.updateAppStateTranscript(interimTranscript, finalTranscript);
        
        // 🎨 新機能: リアルタイム音声認識表示の更新
        const displayTranscript = interimTranscript || finalTranscript;
        if (displayTranscript && window.updateRealtimeTranscript) {
            window.updateRealtimeTranscript(displayTranscript);
        }
        
        // 最終結果の場合、外部に通知
        if (finalTranscript) {
            this.notifyListeners('finalResult', {
                transcript: finalTranscript,
                confidence: event.results[event.results.length - 1][0].confidence || 0
            });
        }
    }
    
    handleEnd() {
        console.log('🏁 音声認識終了イベント');
        
        // 手動停止の場合は状態をそのまま維持
        if (this.state.recognitionState === 'stopping') {
            this.updateState({ 
                recognitionState: 'idle',
                isListening: false 
            });
            return;
        }
        
        // 🔧 透明な継続システム: ブラウザAPI無音終了を隠蔽して継続
        if (this.shouldContinueTransparently()) {
            console.log('🔄 透明継続: 無音終了を隠蔽して音声認識を継続');
            this.performTransparentContinuation();
        } else {
            console.log('✅ 音声認識終了 - セッション終了またはエラー状態');
            this.updateState({ recognitionState: 'idle' });
        }
    }
    
    /**
     * 透明継続の条件判定
     * セッションアクティブかつエラー状態でない場合に継続
     */
    shouldContinueTransparently() {
        // セッション状態確認
        if (!window.AppState?.sessionActive) {
            console.log('🚫 セッション非アクティブ - 透明継続なし');
            return false;
        }
        
        // エラー状態確認（no-speechエラーは除外）
        if (this.state.recognitionState === 'error') {
            // 🔧 no-speechエラーは「無音は正常」として透明継続を許可
            if (this.state.lastError && this.state.lastError.includes('no-speech')) {
                console.log('🤫 no-speechエラー - 無音正常として透明継続実行');
                return true;
            }
            console.log('🚫 エラー状態 - 透明継続なし');
            return false;
        }
        
        // 手動一時停止確認（一時停止ボタンが押された場合）
        if (this.state.recognitionState === 'paused') {
            console.log('⏸️ 手動一時停止中 - 透明継続なし');
            return false;
        }
        
        return true;
    }
    
    /**
     * 透明継続の実行
     * ユーザーに見えない形で音声認識を自動再開
     * 注意: 既存のstartRecognition()をバイパスして直接再開
     */
    async performTransparentContinuation() {
        try {
            // 短時間待機してからシームレス再開
            await new Promise(resolve => setTimeout(resolve, 100));
            
            console.log('🎤 透明継続実行: 音声認識自動再開');
            
            // 🔧 透明継続専用: 状態チェックをバイパスして直接再開
            await this.forceRestartRecognition();
            
        } catch (error) {
            console.error('❌ 透明継続エラー:', error);
            
            // 透明継続に失敗した場合は手動復旧モードに
            this.updateState({ 
                recognitionState: 'error',
                errorMessage: '音声認識の継続に失敗しました。再開ボタンを押してください。'
            });
        }
    }

    /**
     * 強制的な音声認識再開（透明継続専用）
     * 既存の状態チェックをバイパスして新しいrecognitionインスタンスを作成
     */
    async forceRestartRecognition() {
        try {
            console.log('🔄 強制再開: 新しい音声認識インスタンス作成');
            
            // 既存のrecognitionインスタンスを完全にクリーンアップ
            if (this.recognition) {
                this.recognition.onstart = null;
                this.recognition.onend = null;
                this.recognition.onerror = null;
                this.recognition.onresult = null;
                this.recognition.onspeechstart = null;
                this.recognition.onspeechend = null;
                this.recognition = null;
            }
            
            // マイク許可の確認
            if (!this.state.microphonePermissionGranted) {
                const permitted = await this.checkMicrophonePermission();
                if (!permitted) {
                    throw new Error('マイク許可が必要です');
                }
            }
            
            // 新しいrecognitionインスタンスを作成
            this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'ja-JP';
            this.recognition.maxAlternatives = 1;
            
            // 🔧 既存のsetupEventHandlers()メソッドを再利用（安全な方法）
            this.setupEventHandlers();
            
            // 音声認識開始
            console.log('🎤 強制再開: 音声認識開始');
            this.recognition.start();
            
            // 状態更新（activeのまま維持して透明性を保つ）
            this.updateState({ 
                isListening: true,
                sessionStartTime: Date.now(),
                lastActivity: Date.now()
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ 強制再開エラー:', error);
            throw error;
        }
    }
    
    /**
     * Electron環境でのネットワークエラー専用処理（無限ループ防止）
     */
    handleElectronNetworkError() {
        const now = Date.now();
        const retryControl = this.electronRetryControl;
        
        // クールダウン中の場合は処理をスキップ
        if (retryControl.isInCooldown) {
            const remainingCooldown = Math.ceil((retryControl.lastRetryTime + retryControl.cooldownDuration - now) / 1000);
            console.log(`🚫 Electron環境: クールダウン中（残り${remainingCooldown}秒） - 再試行をスキップ`);
            return;
        }
        
        // 連続エラー数を増加
        retryControl.consecutiveErrors++;
        
        // 最大再試行回数に達した場合
        if (retryControl.currentRetryCount >= retryControl.maxRetries) {
            console.error(`🚫 Electron環境: 最大再試行回数(${retryControl.maxRetries})に達しました`);
            console.log(`⏰ Electron環境: ${retryControl.cooldownDuration / 1000}秒のクールダウンを開始`);
            
            // クールダウン開始
            retryControl.isInCooldown = true;
            retryControl.lastRetryTime = now;
            retryControl.currentRetryCount = 0;
            
            // クールダウン終了のタイマー設定
            setTimeout(() => {
                retryControl.isInCooldown = false;
                retryControl.consecutiveErrors = 0;
                console.log('✅ Electron環境: クールダウン終了 - 再試行が可能になりました');
            }, retryControl.cooldownDuration);
            
            return;
        }
        
        // 再試行回数を増加
        retryControl.currentRetryCount++;
        
        // 指数バックオフで待機時間を計算
        const currentDelay = Math.min(
            retryControl.retryDelay * Math.pow(retryControl.backoffMultiplier, retryControl.currentRetryCount - 1),
            retryControl.maxRetryDelay
        );
        
        console.log(`⚠️ Electron環境: ネットワークエラー (${retryControl.currentRetryCount}/${retryControl.maxRetries})`);
        console.log(`⏰ Electron環境: ${currentDelay / 1000}秒後に再試行します`);
        
        // 指数バックオフで再試行
        setTimeout(() => {
            if (this.isActive) {
                console.log(`🔄 Electron環境: 音声認識を再開します (試行 ${retryControl.currentRetryCount}/${retryControl.maxRetries})`);
                this.start();
            } else {
                console.log('🚫 Electron環境: 音声認識が非アクティブのため再試行をスキップ');
            }
        }, currentDelay);
    }
    
    handleError(event) {
        const errorType = event.error;
        let recognitionState = 'error';
        let errorMessage = '音声認識エラーが発生しました';
        
        // 🔧 新デザイン要件：エラータイプ別の状態管理
        switch (errorType) {
            case 'network':
                recognitionState = 'network-error';
                errorMessage = 'ネットワークエラーが発生しました';
                break;
            case 'not-allowed':
                recognitionState = 'permission-denied';
                errorMessage = 'マイクの許可が必要です';
                break;
            case 'aborted':
                recognitionState = 'error';
                errorMessage = '音声認識が中断されました';
                break;
            default:
                recognitionState = 'error';
                errorMessage = `音声認識エラー: ${errorType}`;
        }
        
        this.updateState({
            recognitionState,
            lastError: errorMessage,
            errorCount: this.state.errorCount + 1
        });
        
        // 🔧 自動復旧試行（permission-denied以外）
        if (recognitionState !== 'permission-denied') {
            this.attemptAutoRecovery();
        }
    }
    
    // =================================================================================
    // 自動復旧システム
    // =================================================================================
    
    attemptAutoRecovery() {
        if (!this.autoRecovery.enabled) return;
        
        if (this.autoRecovery.currentAttempt >= this.autoRecovery.maxAttempts) {
            console.warn('⚠️ 自動復旧試行回数上限に達しました');
            return;
        }
        
        this.autoRecovery.currentAttempt++;
        this.autoRecovery.lastAttemptTime = Date.now();
        
        console.log(`🔄 自動復旧試行 ${this.autoRecovery.currentAttempt}/${this.autoRecovery.maxAttempts}`);
        
        // 遅延後に再開
        setTimeout(() => {
            this.performAutoRecovery();
        }, this.autoRecovery.retryDelay);
    }
    
    async performAutoRecovery() {
        try {
            console.log('🚀 自動復旧実行');
            
            // セッション状態確認
            if (!window.AppState?.sessionActive) {
                console.log('🚫 セッション非アクティブ - 自動復旧中止');
                return;
            }
            
            // 🔧 手動一時停止の確認（統一状態管理システム使用）
            if (this.state.recognitionState === 'paused') {
                console.log('⏸️ 手動一時停止中のため自動復旧をスキップ');
                return;
            }
            
            // 音声認識再開
            await this.startRecognition();
            
        } catch (error) {
            console.error('❌ 自動復旧エラー:', error);
            
            // 次回試行
            if (this.autoRecovery.currentAttempt < this.autoRecovery.maxAttempts) {
                this.attemptAutoRecovery();
            }
        }
    }
    
    resetAutoRecovery() {
        this.autoRecovery.currentAttempt = 0;
        this.autoRecovery.lastAttemptTime = null;
    }
    
    // =================================================================================
    // 既存システムとの互換性 - Phase 1B拡張
    // =================================================================================
    
    updateAppStateTranscript(interimTranscript, finalTranscript) {
        // 🎯 Phase 1B: 編集保護チェック
        if (TranscriptProtectionManager.shouldPreventVoiceUpdate('voice-module')) {
            console.log('🛡️ 編集保護中 - 音声更新をスキップ');
            return;
        }
        
        if (!window.AppState) return;
        
        // 🎯 Phase 1B: StateUpdateControllerによる安全な更新
        window.StateUpdateController?.preventCircularUpdate('voice', 'updateAppStateTranscript', () => {
            // 現在の入力中テキストを更新
            const allConfirmedText = window.AppState.transcriptHistory.join(' ');
            window.AppState.currentTranscript = allConfirmedText + (allConfirmedText ? ' ' : '') + interimTranscript;
            
            // 画面更新
            if (typeof window.updateTranscriptDisplay === 'function') {
                window.updateTranscriptDisplay();
            }
            
            // 最終結果の処理
            if (finalTranscript.trim()) {
                // 🛡️ 最終結果処理前の再保護チェック
                if (TranscriptProtectionManager.shouldPreventVoiceUpdate('voice-module-final')) {
                    console.log('🛡️ 編集保護中 - 最終結果処理をスキップ');
                    return;
                }
                
                window.AppState.transcriptHistory.push(finalTranscript.trim());
                const updatedAllText = window.AppState.transcriptHistory.join(' ');
                window.AppState.currentTranscript = updatedAllText;
                
                if (typeof window.updateTranscriptDisplay === 'function') {
                    window.updateTranscriptDisplay();
                }
                if (typeof window.processFinalTranscript === 'function') {
                    window.processFinalTranscript(finalTranscript.trim());
                }
                
                console.log('🔄 音声認識結果反映完了 (Phase 1B保護下)');
            }
        });
    }
    
    // =================================================================================
    // 状態管理
    // =================================================================================
    
    updateState(updates) {
        const oldState = { ...this.state };
        Object.assign(this.state, updates);
        
        // 統一状態管理システムに通知
        this.stateManager.updateState('voice', this.state);
        
        // 🎨 新機能: 音声状態表示の更新
        if (updates.recognitionState && window.updateVoiceStateDisplay) {
            window.updateVoiceStateDisplay(updates.recognitionState);
        }
        
        // 状態変更をリスナーに通知
        this.notifyListeners('stateChange', {
            oldState,
            newState: this.state,
            changes: updates
        });
        
        console.log(`📊 音声認識状態更新:`, updates);
    }
    
    getState() {
        return { ...this.state };
    }
    
    // =================================================================================
    // 新デザイン要件：ユーザー向け状態情報
    // =================================================================================
    
    getUserStatus() {
        const status = {
            currentState: this.state.recognitionState,
            isListening: this.state.isListening,
            canStart: this.state.recognitionState === 'idle' && this.state.microphonePermissionGranted,
            canStop: this.state.recognitionState === 'active',
            canToggle: this.state.microphonePermissionGranted,
            needsPermission: !this.state.microphonePermissionGranted,
            errorMessage: this.state.lastError,
            isAutoRecovering: this.autoRecovery.currentAttempt > 0
        };
        
        // 🎤 新デザイン要件：状態表示メッセージ
        const stateMessages = {
            'starting': '認識を開始中...',
            'active': '認識中',
            'stopping': '認識を一時停止中 - →で再開',
            'error': '認識エラー - 自動再開試行中',
            'network-error': 'エラー - 自動再開試行中',
            'permission-denied': 'マイクの許可が必要です',
            'idle': '待機中'
        };
        
        // 🎨 新デザイン要件：状態色
        const stateColors = {
            'starting': 'gray',
            'active': 'green',
            'stopping': 'yellow',
            'error': 'red',
            'network-error': 'red',
            'permission-denied': 'red',
            'idle': 'gray'
        };
        
        status.userMessage = stateMessages[status.currentState] || '不明な状態';
        status.stateColor = stateColors[status.currentState] || 'gray';
        
        // ユーザー向けアクション
        if (status.needsPermission) {
            status.userAction = 'マイクボタンをクリックして許可してください';
        } else if (status.currentState === 'active') {
            status.userAction = '一時停止するには一時停止ボタンをクリック';
        } else if (status.currentState === 'idle') {
            status.userAction = '開始するにはマイクボタンをクリック';
        } else if (status.currentState === 'stopping') {
            status.userAction = '再開するには再開ボタンをクリック';
        } else if (status.isAutoRecovering) {
            status.userAction = '自動復旧中...';
        } else {
            status.userAction = '再試行するにはマイクボタンをクリック';
        }
        
        return status;
    }
    
    // =================================================================================
    // リスナー管理
    // =================================================================================
    
    addEventListener(callback) {
        this.listeners.add(callback);
    }
    
    removeEventListener(callback) {
        this.listeners.delete(callback);
    }
    
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('❌ リスナー通知エラー:', error);
            }
        });
    }
    
    // =================================================================================
    // デバッグ・統計情報
    // =================================================================================
    
    getDebugInfo() {
        return {
            state: this.state,
            autoRecovery: this.autoRecovery,
            isInitialized: this.isInitialized,
            listenerCount: this.listeners.size
        };
    }
    
    getStatistics() {
        return {
            recognitionCount: this.state.recognitionCount,
            errorCount: this.state.errorCount,
            autoRecoveryAttempts: this.state.autoRecoveryAttempts,
            sessionDuration: this.state.sessionStartTime ? Date.now() - this.state.sessionStartTime : 0,
            lastActivity: this.state.lastActivity
        };
    }
}

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

window.VoiceModule = VoiceModule;

console.log('✅ VoiceModule 読み込み完了 - 新デザイン要件対応');
console.log('🎤 主要機能:');
console.log('  - 6つの音声認識状態管理');
console.log('  - 自動復旧システム');
console.log('  - 企業セッション最適化');
console.log('  - 既存システム互換性'); 