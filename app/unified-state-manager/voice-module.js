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
        
        // 🔧 自動復旧システム
        this.autoRecovery = {
            enabled: true,
            maxAttempts: 3,
            retryDelay: 1000,
            currentAttempt: 0,
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
        
        // 🔧 新デザイン要件：企業セッション向け最適化設定
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ja-JP';
        this.recognition.maxAlternatives = 1;
        
        // イベントハンドラーの設定
        this.setupEventHandlers();
        
        console.log('🎤 音声認識インスタンス作成完了 - 企業セッション最適化');
    }
    
    setupEventHandlers() {
        // 開始イベント
        this.recognition.onstart = () => {
            console.log('🎤 音声認識開始');
            this.updateState({ 
                recognitionState: 'active',
                isListening: true,
                sessionStartTime: Date.now(),
                lastActivity: Date.now()
            });
            this.resetAutoRecovery();
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
        
        // エラーイベント
        this.recognition.onerror = (event) => {
            console.error('❌ 音声認識エラー:', event.error);
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
    
    // 🔧 新機能：一時停止（トグル機能）
    pauseRecognition() {
        if (this.state.recognitionState === 'active') {
            this.stopRecognition();
        } else if (this.state.recognitionState === 'idle') {
            this.startRecognition();
        }
    }
    
    // 🔧 新機能：再開
    resumeRecognition() {
        if (this.state.recognitionState === 'idle') {
            this.startRecognition();
        }
    }
    
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
        
        // セッション状態確認
        if (!window.AppState?.sessionActive) {
            console.log('🚫 セッション非アクティブ - 再開なし');
            this.updateState({ recognitionState: 'idle' });
            return;
        }
        
        // ユーザーが手動で一時停止した場合は自動復旧しない
        if (window.VoiceUIManager && window.VoiceUIManager.isUserPausedManually()) {
            console.log('🔇 ユーザーが手動で一時停止したため自動復旧を無効化');
            this.updateState({ recognitionState: 'idle' });
            return;
        }
        
        // 🔧 自動復旧機能
        if (this.autoRecovery.enabled) {
            console.log('🔄 自動復旧を試行');
            this.attemptAutoRecovery();
        } else {
            this.updateState({ recognitionState: 'idle' });
        }
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
            
            // ユーザーが手動で一時停止した場合は自動復旧しない
            if (window.VoiceUIManager && window.VoiceUIManager.isUserPausedManually()) {
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
    // 既存システムとの互換性
    // =================================================================================
    
    updateAppStateTranscript(interimTranscript, finalTranscript) {
        if (!window.AppState) return;
        
        // 現在の入力中テキストを更新
        const allConfirmedText = window.AppState.transcriptHistory.join(' ');
        window.AppState.currentTranscript = allConfirmedText + (allConfirmedText ? ' ' : '') + interimTranscript;
        
        // 画面更新
        if (typeof window.updateTranscriptDisplay === 'function') {
            window.updateTranscriptDisplay();
        }
        
        // 最終結果の処理
        if (finalTranscript.trim()) {
            window.AppState.transcriptHistory.push(finalTranscript.trim());
            const updatedAllText = window.AppState.transcriptHistory.join(' ');
            window.AppState.currentTranscript = updatedAllText;
            
            if (typeof window.updateTranscriptDisplay === 'function') {
                window.updateTranscriptDisplay();
            }
            if (typeof window.processFinalTranscript === 'function') {
                window.processFinalTranscript(finalTranscript.trim());
            }
        }
    }
    
    // =================================================================================
    // 状態管理
    // =================================================================================
    
    updateState(updates) {
        const oldState = { ...this.state };
        Object.assign(this.state, updates);
        
        // 統一状態管理システムに通知
        this.stateManager.updateState('voice', this.state);
        
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