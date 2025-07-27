// =================================================================================
// UNIFIED STATE MANAGER - 統一状態管理システム
// =================================================================================
// 
// 【目的】Single Source of Truth の実装
// - AppState, ConversationGatekeeper, ContinuousRecognitionManager の統一
// - 状態の透明性向上とUI連携強化
// - 企業利用での長時間セッション安定化
// 
// 【設計原則】
// - 中央集権的状態管理
// - リアクティブな状態更新
// - 完全な後方互換性
// - 透明性の高いエラーハンドリング
// 
// =================================================================================

class UnifiedStateManager {
    constructor() {
        this.initialized = false;
        this.listeners = new Set();
        
        // 中央集権的状態オブジェクト
        this.state = {
            // === システム基本状態 ===
            system: {
                initialized: false,
                currentPhase: 'setup', // setup, warmup, deepdive, summary, completed
                sessionActive: false,
                sessionStartTime: null,
                currentTheme: '',
                apiKey: null
            },
            
            // === 音声認識状態 ===
            voice: {
                // 許可状態
                microphonePermissionGranted: false,
                permissionRequestInProgress: false,
                
                // 認識状態
                isRecognitionActive: false,
                recognitionState: 'idle', // idle, starting, active, paused, stopping, error
                
                // エラー管理
                consecutiveErrorCount: 0,
                lastErrorTime: null,
                lastErrorType: null,
                
                // 継続性管理
                continuityStartedOnce: false,
                lastResultTime: null,
                silenceDuration: 0,
                
                // 処理制御
                processResults: true,
                pauseReason: null
            },
            
            // === 会話フロー状態 ===
            conversation: {
                // 発話制御
                currentSpeaker: null, // null, 'nehori', 'hahori', 'user'
                speakingInProgress: false,
                lastSpeaker: null,
                
                // フェーズ制御
                conversationPhase: 'IDLE', // IDLE, USER_SPEAKING, HAHORI_PROCESSING, KNOWLEDGE_CONFIRMATION, NEHORI_QUESTIONING
                
                // 知見確認モード
                isKnowledgeConfirmationMode: false,
                pendingKnowledgeEvaluation: null,
                
                // 割り込み制御
                preventNehoriInterruption: false,
                questionGenerationScheduled: false,
                lastQuestionTime: null
            },
            
            // === UI状態 ===
            ui: {
                // 表示状態
                currentScreen: 'setup', // setup, chat, settings
                
                // 入力状態
                currentTranscript: '',
                transcriptHistory: [],
                
                // 処理状態
                isProcessing: false,
                waitingForPermission: true,
                
                // エラー表示
                errorMessage: null,
                errorType: null, // 'permission', 'network', 'api', 'recognition'
                
                // 進行状況
                progressMessage: null,
                progressPercentage: 0
            },
            
            // === ネットワーク状態 ===
            network: {
                isOnline: navigator.onLine,
                apiConnectionStatus: 'unknown', // unknown, connected, disconnected, error
                lastApiCall: null,
                apiCallsInProgress: 0
            },
            
            // === 知見管理状態 ===
            knowledge: {
                extractedKnowledge: [],
                currentPoint: 0,
                sessionStats: {
                    totalKnowledge: 0,
                    autoRecorded: 0,
                    manualConfirmed: 0,
                    rejected: 0,
                    averageScore: 0
                },
                settings: {
                    autoRecordThreshold: 70,
                    showAutoRecordNotice: true,
                    showDetailedEvaluation: true
                }
            }
        };
        
        this.setupNetworkMonitoring();
        this.setupCompatibilityLayer();
    }
    
    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        if (this.initialized) return;
        
        console.log('🔄 統一状態管理システム初期化開始');
        
        // 既存システムからの状態移行
        await this.migrateFromLegacySystems();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        this.initialized = true;
        this.state.system.initialized = true;
        
        console.log('✅ 統一状態管理システム初期化完了');
        this.notifyListeners('system_initialized');
    }
    
    // =================================================================================
    // イベントリスナー設定
    // =================================================================================
    
    setupEventListeners() {
        console.log('🔧 統一状態管理システム: イベントリスナー設定開始');
        
        // ブラウザイベントの監視
        if (typeof window !== 'undefined') {
            // ページ離脱時の処理
            window.addEventListener('beforeunload', () => {
                this.updateSystemState({ sessionActive: false });
            });
            
            // オンライン/オフライン状態の監視
            window.addEventListener('online', () => {
                this.updateNetworkState({ isOnline: true });
            });
            
            window.addEventListener('offline', () => {
                this.updateNetworkState({ isOnline: false });
            });
        }
        
        console.log('✅ 統一状態管理システム: イベントリスナー設定完了');
    }
    
    // =================================================================================
    // 状態更新メソッド
    // =================================================================================
    
    // システム状態の更新
    updateSystemState(updates) {
        const oldState = { ...this.state.system };
        Object.assign(this.state.system, updates);
        
        console.log('🔄 システム状態更新:', { old: oldState, new: this.state.system });
        this.notifyListeners('system_state_changed', { old: oldState, new: this.state.system });
    }
    
    // 音声認識状態の更新
    updateVoiceState(updates) {
        const oldState = { ...this.state.voice };
        Object.assign(this.state.voice, updates);
        
        console.log('🎤 音声認識状態更新:', { old: oldState, new: this.state.voice });
        this.notifyListeners('voice_state_changed', { old: oldState, new: this.state.voice });
        
        // UI更新のトリガー
        this.updateUIFromVoiceState();
    }
    
    // 会話フロー状態の更新
    updateConversationState(updates) {
        const oldState = { ...this.state.conversation };
        Object.assign(this.state.conversation, updates);
        
        console.log('💬 会話フロー状態更新:', { old: oldState, new: this.state.conversation });
        this.notifyListeners('conversation_state_changed', { old: oldState, new: this.state.conversation });
    }
    
    // UI状態の更新
    updateUIState(updates) {
        const oldState = { ...this.state.ui };
        Object.assign(this.state.ui, updates);
        
        console.log('🖥️ UI状態更新:', { old: oldState, new: this.state.ui });
        this.notifyListeners('ui_state_changed', { old: oldState, new: this.state.ui });
    }
    
    // ネットワーク状態の更新
    updateNetworkState(updates) {
        const oldState = { ...this.state.network };
        Object.assign(this.state.network, updates);
        
        console.log('🌐 ネットワーク状態更新:', { old: oldState, new: this.state.network });
        this.notifyListeners('network_state_changed', { old: oldState, new: this.state.network });
    }
    
    // =================================================================================
    // 状態取得メソッド
    // =================================================================================
    
    getState() {
        return JSON.parse(JSON.stringify(this.state)); // Deep copy
    }
    
    getSystemState() {
        return { ...this.state.system };
    }
    
    getVoiceState() {
        return { ...this.state.voice };
    }
    
    getConversationState() {
        return { ...this.state.conversation };
    }
    
    getUIState() {
        return { ...this.state.ui };
    }
    
    getNetworkState() {
        return { ...this.state.network };
    }
    
    // =================================================================================
    // 高レベル状態管理メソッド
    // =================================================================================
    
    // セッション開始
    async startSession(theme) {
        console.log('🚀 セッション開始:', theme);
        
        this.updateSystemState({
            sessionActive: true,
            sessionStartTime: new Date(),
            currentTheme: theme,
            currentPhase: 'warmup'
        });
        
        this.updateConversationState({
            conversationPhase: 'IDLE'
        });
        
        this.updateUIState({
            currentScreen: 'chat',
            progressMessage: 'セッションを開始しています...'
        });
        
        this.notifyListeners('session_started', { theme });
    }
    
    // 音声認識開始
    async startVoiceRecognition() {
        console.log('🎤 音声認識開始要求');
        
        if (!this.state.voice.microphonePermissionGranted) {
            console.log('🚫 マイク許可が必要');
            this.updateUIState({
                errorMessage: 'マイクの許可が必要です',
                errorType: 'permission'
            });
            return false;
        }
        
        this.updateVoiceState({
            recognitionState: 'starting',
            isRecognitionActive: true
        });
        
        this.updateUIState({
            progressMessage: '音声認識を開始しています...'
        });
        
        return true;
    }
    
    // 発話開始の登録
    registerSpeechStart(speaker, context = 'unknown') {
        console.log(`🎤 ${speaker}発話開始登録 (${context})`);
        
        this.updateConversationState({
            currentSpeaker: speaker,
            speakingInProgress: true,
            lastSpeaker: speaker
        });
        
        this.updateUIState({
            progressMessage: `${speaker}が発話中...`
        });
        
        this.notifyListeners('speech_started', { speaker, context });
    }
    
    // 発話終了の登録
    registerSpeechEnd(speaker, context = 'unknown') {
        console.log(`🎤 ${speaker}発話終了登録 (${context})`);
        
        this.updateConversationState({
            currentSpeaker: null,
            speakingInProgress: false
        });
        
        this.updateUIState({
            progressMessage: null
        });
        
        this.notifyListeners('speech_ended', { speaker, context });
    }
    
    // エラー状態の設定
    setErrorState(errorType, message, details = null) {
        console.error(`❌ エラー状態設定: ${errorType} - ${message}`);
        
        this.updateUIState({
            errorMessage: message,
            errorType: errorType
        });
        
        // 音声認識エラーの場合
        if (errorType === 'recognition') {
            this.updateVoiceState({
                recognitionState: 'error',
                lastErrorType: errorType,
                lastErrorTime: Date.now(),
                consecutiveErrorCount: this.state.voice.consecutiveErrorCount + 1
            });
        }
        
        this.notifyListeners('error_occurred', { errorType, message, details });
    }
    
    // エラー状態のクリア
    clearErrorState() {
        console.log('✅ エラー状態クリア');
        
        this.updateUIState({
            errorMessage: null,
            errorType: null
        });
        
        this.notifyListeners('error_cleared');
    }
    
    // =================================================================================
    // 互換性レイヤー
    // =================================================================================
    
    setupCompatibilityLayer() {
        // AppStateとの互換性
        if (typeof window !== 'undefined' && window.AppState) {
            this.migrateAppState();
        }
        
        // ConversationGatekeeperとの互換性
        this.setupConversationGatekeeperCompatibility();
    }
    
    migrateAppState() {
        const appState = window.AppState;
        
        // AppStateからの初期状態移行
        this.state.system.sessionActive = appState.sessionActive || false;
        this.state.system.currentTheme = appState.currentTheme || '';
        this.state.system.apiKey = appState.apiKey || null;
        this.state.voice.microphonePermissionGranted = appState.voiceRecognitionStability?.micPermissionGranted || false;
        this.state.conversation.currentSpeaker = appState.currentSpeaker || null;
        this.state.ui.currentTranscript = appState.currentTranscript || '';
        this.state.ui.transcriptHistory = appState.transcriptHistory || [];
        
        console.log('🔄 AppStateからの状態移行完了');
    }
    
    setupConversationGatekeeperCompatibility() {
        // ConversationGatekeeperのメソッドを統一システムに統合
        this.canNehoriSpeak = (context = 'unknown') => {
            const conversation = this.state.conversation;
            const voice = this.state.voice;
            
            // 知見確認モード中は絶対にNG
            if (conversation.isKnowledgeConfirmationMode) {
                console.log(`🚫 知見確認モード中のためねほりーの発話をブロック (${context})`);
                return false;
            }
            
            // 他のAIが発話中はブロック
            if (conversation.speakingInProgress || conversation.currentSpeaker !== null) {
                console.log(`🚫 AI発話中のためねほりーの発話をブロック (${context})`);
                return false;
            }
            
            // 割り込み防止
            if (conversation.preventNehoriInterruption) {
                console.log(`🚫 割り込み防止フラグアクティブのためブロック (${context})`);
                return false;
            }
            
            console.log(`✅ ねほりーの発話許可 (${context})`);
            return true;
        };
        
        this.canHahoriSpeak = (context = 'unknown') => {
            const conversation = this.state.conversation;
            
            // 他のAIが発話中はブロック
            if (conversation.speakingInProgress || conversation.currentSpeaker !== null) {
                console.log(`🚫 AI発話中のためはほりーの発話をブロック (${context})`);
                return false;
            }
            
            console.log(`✅ はほりーの発話許可 (${context})`);
            return true;
        };
    }
    
    // =================================================================================
    // UI連携メソッド
    // =================================================================================
    
    updateUIFromVoiceState() {
        const voice = this.state.voice;
        const ui = this.state.ui;
        
        // マイクボタンの状態更新
        this.updateMicrophoneButton();
        
        // 進行状況の更新
        if (voice.recognitionState === 'starting') {
            this.updateUIState({
                progressMessage: '音声認識を開始しています...',
                progressPercentage: 25
            });
        } else if (voice.recognitionState === 'active') {
            this.updateUIState({
                progressMessage: '聞いています...',
                progressPercentage: 100
            });
        } else if (voice.recognitionState === 'paused') {
            this.updateUIState({
                progressMessage: '音声認識を一時停止中...',
                progressPercentage: 50
            });
        } else if (voice.recognitionState === 'error') {
            this.updateUIState({
                progressMessage: null,
                progressPercentage: 0
            });
        }
    }
    
    updateMicrophoneButton() {
        const voice = this.state.voice;
        const micButton = document.getElementById('microphoneButton');
        
        if (!micButton) return;
        
        // ボタンの状態クラスを更新
        micButton.classList.remove('mic-idle', 'mic-active', 'mic-error', 'mic-disabled');
        
        if (!voice.microphonePermissionGranted) {
            micButton.classList.add('mic-disabled');
            micButton.title = 'マイクの許可が必要です';
        } else if (voice.recognitionState === 'error') {
            micButton.classList.add('mic-error');
            micButton.title = `エラー: ${voice.lastErrorType}`;
        } else if (voice.isRecognitionActive) {
            micButton.classList.add('mic-active');
            micButton.title = '音声認識中...';
        } else {
            micButton.classList.add('mic-idle');
            micButton.title = '音声認識を開始';
        }
    }
    
    // =================================================================================
    // イベント管理
    // =================================================================================
    
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    notifyListeners(eventType, data = null) {
        this.listeners.forEach(callback => {
            try {
                callback(eventType, data, this.getState());
            } catch (error) {
                console.error('❌ リスナーエラー:', error);
            }
        });
    }
    
    // =================================================================================
    // ネットワーク監視
    // =================================================================================
    
    setupNetworkMonitoring() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.updateNetworkState({ isOnline: true });
            });
            
            window.addEventListener('offline', () => {
                this.updateNetworkState({ isOnline: false });
            });
        }
    }
    
    // =================================================================================
    // レガシーシステムからの移行
    // =================================================================================
    
    async migrateFromLegacySystems() {
        console.log('🔄 レガシーシステムからの状態移行開始');
        
        // AppStateからの移行
        if (typeof window !== 'undefined' && window.AppState) {
            this.migrateAppState();
        }
        
        // ConversationGatekeeperからの移行
        if (typeof window !== 'undefined' && window.ConversationGatekeeper) {
            // 既存の状態を統一システムに移行
            console.log('🔄 ConversationGatekeeperからの移行');
        }
        
        console.log('✅ レガシーシステムからの状態移行完了');
    }
    
    // =================================================================================
    // デバッグメソッド
    // =================================================================================
    
    debugState() {
        console.log('🔍 統一状態管理システム - 現在の状態:', this.getState());
        return this.getState();
    }
    
    debugVoiceState() {
        console.log('🎤 音声認識状態:', this.getVoiceState());
        return this.getVoiceState();
    }
    
    debugConversationState() {
        console.log('💬 会話フロー状態:', this.getConversationState());
        return this.getConversationState();
    }
    
    // =================================================================================
    // 🔧 Phase 1A修正: バックアップ・復元機能
    // =================================================================================
    
    /**
     * 完全状態取得 - EmergencySystemManager用
     * @returns {Object} 深いコピーされた完全状態
     */
    getCompleteState() {
        try {
            // 深いコピーを作成して返す
            const completeState = JSON.parse(JSON.stringify(this.state));
            console.log('📊 統一状態管理: 完全状態取得成功');
            return completeState;
        } catch (error) {
            console.error('❌ 統一状態管理: 完全状態取得エラー:', error.message);
            // エラー時は現在の状態の浅いコピーを返す
            return { ...this.state };
        }
    }
    
    /**
     * 完全状態復元 - EmergencySystemManager用
     * @param {Object} backupState 復元する状態
     * @returns {boolean} 復元成功フラグ
     */
    restoreCompleteState(backupState) {
        try {
            if (!backupState || typeof backupState !== 'object') {
                console.warn('⚠️ 統一状態管理: 無効なバックアップ状態');
                return false;
            }
            
            // 状態を深いコピーで復元
            this.state = JSON.parse(JSON.stringify(backupState));
            
            // 状態変更通知
            this.notifyListeners('state_restored', this.state);
            
            console.log('✅ 統一状態管理: 完全状態復元成功');
            return true;
        } catch (error) {
            console.error('❌ 統一状態管理: 完全状態復元エラー:', error.message);
            return false;
        }
    }
    
    /**
     * 状態の健全性チェック
     * @returns {Object} チェック結果
     */
    validateState() {
        const validation = {
            isValid: true,
            issues: [],
            timestamp: Date.now()
        };
        
        try {
            // 必須プロパティの存在確認
            const requiredSections = ['system', 'voice', 'conversation', 'ui', 'network', 'knowledge'];
            requiredSections.forEach(section => {
                if (!this.state[section]) {
                    validation.isValid = false;
                    validation.issues.push(`Missing state section: ${section}`);
                }
            });
            
            // JSON化可能性チェック
            JSON.stringify(this.state);
            
        } catch (error) {
            validation.isValid = false;
            validation.issues.push(`State serialization error: ${error.message}`);
        }
        
        if (!validation.isValid) {
            console.warn('⚠️ 統一状態管理: 状態の健全性に問題があります', validation);
        }
        
        return validation;
    }
}

// =================================================================================
// グローバル初期化
// =================================================================================

// 統一状態管理システムのインスタンス作成
if (typeof window !== 'undefined') {
    window.UnifiedStateManager = new UnifiedStateManager();
    
    // 初期化の実行
    window.UnifiedStateManager.initialize().then(() => {
        console.log('✅ 統一状態管理システムが利用可能になりました');
        
        // グローバルアクセス用のショートカット
        window.getUnifiedState = () => window.UnifiedStateManager.getState();
        window.debugUnifiedState = () => window.UnifiedStateManager.debugState();
    });
}

// CommonJS/ESモジュール対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedStateManager;
} 