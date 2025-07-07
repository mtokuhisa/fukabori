// 深堀くんアプリ - メインスクリプト
// 元ファイル（深堀くんv063.html）準拠の完全版

// =================================================================================
// グローバル変数定義（最優先）
// =================================================================================

// 📊 知見管理システムの状態（グローバル定義）
window.KnowledgeState = {
    currentSession: null,
    categories: [],
    users: [],
    insights: [],
    qualityThreshold: 0.7,
    isInitialized: false
};

// 🎤 音声システムのグローバル変数
window.stateManager = null;

// =================================================================================
// 音声認識システム - 抜本解決版
// =================================================================================

// 🔧 A/Bテスト機能: マイク許可保持戦略の切り替え
const MICROPHONE_STRATEGY = {
    LEGACY: 'legacy',           // 従来システム（完全クリーンアップ）
    LIGHTWEIGHT: 'lightweight', // 軽量リスタート（現在の実装）
    PERSISTENT: 'persistent',   // インスタンス不変戦略（Chrome最適化）
    CONTINUOUS: 'continuous'    // 継続的音声認識（真の解決策）
};

// 🔧 現在の戦略を設定（開発時は動的切り替え可能）
window.CURRENT_MICROPHONE_STRATEGY = MICROPHONE_STRATEGY.CONTINUOUS; // Chrome専用の真の解決策

// 🔧 PermissionManager: voice-core.jsに移動済み
// 新しい音声コアシステムを使用: window.VoiceCore.permission

// 🔧 継続的音声認識: start()を一度だけ呼び、絶対に停止しない戦略
class ContinuousRecognitionManager {
    constructor(permissionManager) {
        this.permissionManager = permissionManager;
        this.state = 'idle'; // idle, starting, active, error
        this.recognition = null;
        this.listeners = new Set();
        this.isStarting = false;
        
        // 結果処理制御
        this.processResults = true;  // 結果を処理するかどうか
        this.pauseReason = null;     // 一時停止理由
        
        // 統計情報
        this.stats = {
            startCount: 0,              // start()呼び出し回数（1回のみが理想）
            microphonePermissionRequests: 0,
            resultProcessedCount: 0,    // 処理された結果数
            resultIgnoredCount: 0,      // 無視された結果数
            pauseCount: 0,              // 一時停止回数
            resumeCount: 0,             // 再開回数
            startTime: Date.now(),
            sessionDuration: 0
        };
        
        // 継続性管理
        this.continuity = {
            neverStopped: false,        // 一度も停止していない
            startedOnce: false,         // 一度開始済み
            forceStop: false            // 強制停止フラグ
        };
        
        // 継続性監視
        this.continuityMonitor = null;  // 監視タイマー
        this.lastResultTime = Date.now(); // 最後の結果処理時刻
        
    }
    
    // 🔧 継続的音声認識開始（一度だけ）
    async start() {
        
        if (this.continuity.startedOnce) {
            return this.resumeProcessing();
        }
        
        if (this.isStarting) {
            return false;
        }
        
        this.isStarting = true;
        
        try {
            // セッション状態確認
            if (!window.AppState?.sessionActive) {
                console.log('🚫 セッション非アクティブ');
                this.isStarting = false;
                return false;
            }
            
            // インスタンス作成（一度だけ）
            if (!this.recognition) {
                this.recognition = this.createRecognition();
                this.setupEventHandlers();
            }
            
            // マイク許可確認（一度だけ）
            if (this.stats.microphonePermissionRequests === 0) {
                const hasPermission = await this.permissionManager.getPermission();
                this.stats.microphonePermissionRequests++;
                
                if (!hasPermission) {
                    console.log('🚫 マイク許可なし');
                    this.isStarting = false;
                    return false;
                }
            }
            
            // 状態更新
            this.state = 'starting';
            this.notifyListeners();
            
            // 継続的音声認識開始（一度だけ）
            this.recognition.start();
            
            this.stats.startCount++;
            this.continuity.startedOnce = true;
            this.continuity.neverStopped = true;
            this.processResults = true;
            
            this.state = 'active';
            this.notifyListeners();
            
            // 🔧 継続性監視開始
            this.startContinuityMonitor();
            
            console.log(`✅ 継続的音声認識開始成功 - start()呼び出し: ${this.stats.startCount}回`);
            return true;
            
        } catch (error) {
            console.error('❌ 継続的音声認識開始エラー:', error);
            this.state = 'error';
            this.notifyListeners();
            return false;
        } finally {
            this.isStarting = false;
        }
    }
    
    // 🔧 結果処理一時停止（音声認識は継続）
    pauseProcessing(reason = 'unknown') {
        console.log(`⏸️ 結果処理一時停止: ${reason}`);
        this.processResults = false;
        this.pauseReason = reason;
        this.stats.pauseCount++;
        
        // 音声認識は継続するが、結果は無視
    }
    
    // 🔧 結果処理再開（音声認識は継続していた）
    resumeProcessing(reason = 'unknown') {
        console.log(`▶️ 結果処理再開: ${reason}`);
        this.processResults = true;
        this.pauseReason = null;
        this.stats.resumeCount++;
        
        return true;
    }
    
    // 🔧 強制停止（セッション終了時のみ）
    async forceStop() {
        
        if (!this.recognition || this.state !== 'active') {
            return true;
        }
        
        try {
            this.continuity.forceStop = true;
            this.processResults = false;
            
            // 🔧 継続性監視停止
            this.stopContinuityMonitor();
            
            // 強制停止（セッション終了時のみ）
            this.recognition.abort();
            this.recognition = null;
            
            this.state = 'idle';
            this.continuity.neverStopped = false;
            this.notifyListeners();
            
            return true;
            
        } catch (error) {
            console.error('❌ 継続的音声認識強制停止エラー:', error);
            return false;
        }
    }
    
    // 🔧 stop()メソッド（結果処理停止のみ）
    async stop() {
        console.log('⏸️ 継続的音声認識 - 結果処理停止のみ');
        return this.pauseProcessing('stop_request');
    }
    
    // SpeechRecognition作成
    createRecognition() {
        let recognition;
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            recognition = new SpeechRecognition();
        } else {
            throw new Error('このブラウザは音声認識に対応していません');
        }
        
        // 🔧 継続的音声認識最適化設定
        recognition.continuous = true;           // 継続的音声認識
        recognition.interimResults = true;       // 中間結果を取得
        recognition.lang = 'ja-JP';             // 日本語
        recognition.maxAlternatives = 1;         // 最大候補数
        
        // 🔧 Chrome専用の継続性強化設定
        if (navigator.userAgent.includes('Chrome')) {
            // Chrome固有の設定があれば追加
        }
        
        return recognition;
    }
    
    // 🔧 継続性監視システム
    startContinuityMonitor() {
        
        // 30秒ごとに継続性をチェック（より頻繁に）
        this.continuityMonitor = setInterval(() => {
            if (this.state === 'active' && window.AppState?.sessionActive && !this.continuity.forceStop) {
                const timeSinceLastResult = Date.now() - this.lastResultTime;
                
                // 最後の結果処理から一定時間経過した場合の予防的再開
                if (timeSinceLastResult > 45000) { // 45秒（Chrome の60秒制限より前）
                    this.preemptiveRestart();
                }
            }
        }, 30000); // 30秒間隔
    }
    
    // 🔧 継続性監視停止
    stopContinuityMonitor() {
        if (this.continuityMonitor) {
            console.log('🛑 継続性監視システム停止');
            clearInterval(this.continuityMonitor);
            this.continuityMonitor = null;
        }
    }
    
    // 🔧 予防的再開
    preemptiveRestart() {
        
        if (this.recognition && this.state === 'active') {
            // 🔧 重要：stop()もstart()も呼ばない - マイク許可アラートの原因
            console.log('🔧 真の継続的音声認識: 予防的再開を防止（マイク許可アラート解決）');
            console.log('💡 継続的音声認識は継続中 - 無理に再開しない');
            
            // stop()とstart()を呼ばないため、統計情報も更新しない
            // this.stats.startCount++; // ← 削除
        }
    }
    
    // イベントハンドラ設定
    setupEventHandlers() {
        if (!this.recognition) return;
        
        // 結果処理（制御可能）
        this.recognition.onresult = (event) => {
            if (this.processResults) {
                // 🔧 継続性監視: 最後の結果時刻を更新
                this.lastResultTime = Date.now();
                this.handleResult(event);
                this.stats.resultProcessedCount++;
            } else {
                this.stats.resultIgnoredCount++;
                console.log(`⏭️ 結果無視 (理由: ${this.pauseReason})`);
            }
        };
        
        // エラー処理
        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };
        
        // 終了処理（自動再開）
        this.recognition.onend = () => {
            this.handleEnd();
        };
        
        // 開始処理
        this.recognition.onstart = () => {
            this.state = 'active';
            this.notifyListeners();
        };
    }
    
    // 結果処理（既存ロジック再利用）
    handleResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalTranscript += result[0].transcript;
            } else {
                interimTranscript += result[0].transcript;
            }
        }

        // 現在の入力中テキストを更新
        const allConfirmedText = AppState.transcriptHistory.join(' ');
        AppState.currentTranscript = allConfirmedText + (allConfirmedText ? ' ' : '') + interimTranscript;
        window.updateTranscriptDisplay();

        if (finalTranscript.trim()) {
            AppState.transcriptHistory.push(finalTranscript.trim());
            const updatedAllText = AppState.transcriptHistory.join(' ');
            AppState.currentTranscript = updatedAllText;
            window.updateTranscriptDisplay();
            processFinalTranscript(finalTranscript.trim());
        }
    }
    
    // 継続的音声認識エラーハンドリング
    handleRecognitionError(event) {
        console.error('😨 継続的音声認識エラー:', event.error);
        
        switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                console.error('🚫 マイク許可エラー - 継続的音声認識停止');
                this.permissionManager.state = 'denied';
                this.state = 'error';
                this.continuity.neverStopped = false;
                this.notifyListeners();
                return;
                
            case 'aborted':
                if (this.continuity.forceStop) {
                    return;
                }
                console.warn('⚠️ 継続的音声認識が意図せず停止 - 再開は行わない（マイク許可アラート防止）');
                console.log('🔧 真の継続的音声認識: abortedエラー時も再開しない');
                return;
                
            case 'no-speech':
                console.log('😶 no-speech - 継続的音声認識では正常動作');
                // 継続的音声認識では、no-speechは正常動作として扱う
                return;
                
            case 'network':
                console.warn('🌐 ネットワークエラー - 再開は行わない（マイク許可アラート防止）');
                console.log('🔧 真の継続的音声認識: ネットワークエラー時も再開しない');
                return;
                
            case 'audio-capture':
                console.warn('🎤 オーディオキャプチャエラー - 再開は行わない（マイク許可アラート防止）');
                console.log('🔧 真の継続的音声認識: オーディオキャプチャエラー時も再開しない');
                return;
                
            default:
                console.warn(`⁉️ 継続的音声認識未知エラー: ${event.error} - 再開は行わない（マイク許可アラート防止）`);
                console.log('🔧 真の継続的音声認識: 未知エラー時も再開しない');
                break;
        }
    }
    
    // 🔧 即座再開メソッド
    immediateRestart() {
        if (this.recognition && window.AppState?.sessionActive && !this.continuity.forceStop) {
            console.log('🚀 継続的音声認識即座再開要求');
            
            // 🔧 重要：start()を呼ばない - マイク許可アラートの原因
            console.log('🔧 真の継続的音声認識: start()再呼び出しを防止（マイク許可アラート解決）');
            
            // start()を呼ばないため、統計情報も更新しない
            // this.stats.startCount++; // ← 削除
            // this.continuity.neverStopped = true; // ← 削除
        }
    }
    
    // 終了イベント処理（真の継続的音声認識）
    handleEnd() {
        
        if (this.continuity.forceStop) {
            console.log('🛑 強制停止中 - 自動再開なし');
            return;
        }
        
        if (!window.AppState?.sessionActive) {
            console.log('🚫 セッション非アクティブ - 自動再開なし');
            return;
        }
        
        // 🔧 重要：真の継続的音声認識では一度も再開しない
        console.log('⚠️ 継続的音声認識が終了 - しかし再開は行わない（マイク許可アラート防止）');
        this.continuity.neverStopped = false; // 一度停止した
        
        // 🚨 重要：start()を呼ばない - これがマイク許可アラートの原因
        console.log('🔧 真の継続的音声認識: start()再呼び出しを防止（マイク許可アラート解決）');
        
        // 代替案：音声認識が終了した場合は、継続性を諦める
        // ユーザーが次回発話時に新しいセッションを開始する
    }
    
    // 継続的音声認識統計情報
    getMicrophonePermissionStats() {
        const sessionDuration = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const efficiency = this.stats.startCount === 1 ? 100 : 
                          Math.round((1 / this.stats.startCount) * 100);
        
        // 🔧 修正：実際のマイク許可要求回数は start() 呼び出し回数と同じ
        const actualMicrophonePermissionRequests = this.stats.startCount;
        
        return {
            strategy: 'continuous',
            startCount: this.stats.startCount,
            microphonePermissionRequests: actualMicrophonePermissionRequests, // 🔧 修正
            resultProcessedCount: this.stats.resultProcessedCount,
            resultIgnoredCount: this.stats.resultIgnoredCount,
            pauseCount: this.stats.pauseCount,
            resumeCount: this.stats.resumeCount,
            sessionDuration: sessionDuration,
            efficiency: efficiency,
            neverStopped: this.continuity.neverStopped,
            continuousRecognition: this.continuity.startedOnce && this.state === 'active',
            // 🔧 追加：デバッグ情報
            debugInfo: {
                originalPermissionRequests: this.stats.microphonePermissionRequests,
                correctedPermissionRequests: actualMicrophonePermissionRequests,
                理由: 'start()呼び出しごとにブラウザがマイク許可確認を実行'
            }
        };
    }

    // 🔧 新機能：統計情報リセット（テスト用）
    resetStats() {
        this.stats = {
            startCount: 0,
            microphonePermissionRequests: 0,
            resultProcessedCount: 0,
            resultIgnoredCount: 0,
            pauseCount: 0,
            resumeCount: 0,
            startTime: Date.now(),
            sessionDuration: 0
        };
        
        this.continuity = {
            neverStopped: false,
            startedOnce: false,
            forceStop: false
        };
        
        // 現在のセッションはそのまま維持し、統計情報のみリセット
        return true;
    }
    
    // リスナー管理
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('継続的音声認識リスナー実行エラー:', error);
            }
        });
    }
}

// 🔧 AudioManager: voice-core.jsに移動済み
// 新しい音声コアシステムを使用: window.VoiceCore.audio

// 🔧 StateManager: 全体状態の一元管理
class StateManager {
    constructor() {
        // 🆕 新しい音声コアシステムを使用
        this.permissionManager = window.VoiceCore?.permission || new PermissionManager();
        
        // 🔧 A/Bテスト: 戦略に基づくRecognitionManager選択
        this.recognitionManager = this.createRecognitionManager();
        
        this.audioManager = window.VoiceCore?.audio || new AudioManager();
        
        // 🔧 許可状態の同期強化
        if (window.VoiceCore?.permission) {
        } else {
        }
        
        this.setupStateSync();
    }
    
    // 🔧 A/Bテスト: RecognitionManager作成
    createRecognitionManager() {
        const strategy = window.CURRENT_MICROPHONE_STRATEGY || MICROPHONE_STRATEGY.CONTINUOUS;
        
        // 🔧 現在は継続的音声認識のみサポート（未使用クラス削除済み）
        return new ContinuousRecognitionManager(this.permissionManager);
    }
    
    // 🔧 A/Bテスト: 戦略切り替え機能
    switchStrategy(newStrategy) {
        if (!Object.values(MICROPHONE_STRATEGY).includes(newStrategy)) {
            console.error(`❌ 無効な戦略: ${newStrategy}`);
            return false;
        }
        
        console.log(`🔄 戦略切り替え: ${window.CURRENT_MICROPHONE_STRATEGY} → ${newStrategy}`);
        
        // 現在のRecognitionManagerを停止
        if (this.recognitionManager) {
            this.recognitionManager.stop();
        }
        
        // 新しい戦略を設定
        window.CURRENT_MICROPHONE_STRATEGY = newStrategy;
        
        // 新しいRecognitionManagerを作成
        this.recognitionManager = this.createRecognitionManager();
        
        // 状態同期を再設定
        this.recognitionManager.addListener((state) => {
            this.updateUI();
        });
        
        return true;
    }
    
    // 状態同期の設定
    setupStateSync() {
        // 許可状態変更時の処理
        this.permissionManager.addListener((state) => {
            this.updateUI();
        });
        
        // 音声認識状態変更時の処理
        this.recognitionManager.addListener((state) => {
            this.updateUI();
        });
        
        // 音声再生状態変更時の処理
        this.audioManager.addListener((audioInfo) => {
            this.updateUI();
        });
    }
    
    // UI更新（状態に応じた表示制御）
    updateUI() {
        const permissionState = this.permissionManager.state;
        const recognitionState = this.recognitionManager.state;
        const audioInfo = this.audioManager.getActiveAudioInfo();
        
        // マイクボタンの状態更新
        this.updateMicrophoneButton(permissionState, recognitionState);
        
        // エラーメッセージの更新
        this.updateErrorMessages(permissionState, recognitionState);
        
        // 進行状況の更新
        this.updateProgress(permissionState, recognitionState, audioInfo);
    }
    
    // マイクボタン更新
    updateMicrophoneButton(permissionState, recognitionState) {
        const micButton = window.UIManager.DOMUtils.get('micButton');
        if (!micButton) return;
        
        let buttonClass = 'mic-button';
        let buttonText = '🎤';
        let isDisabled = false;
        
        switch (permissionState) {
            case 'denied':
                buttonClass += ' error';
                buttonText = '🚫';
                isDisabled = true;
                break;
            case 'requesting':
                buttonClass += ' loading';
                buttonText = '⏳';
                isDisabled = true;
                break;
            case 'granted':
                switch (recognitionState) {
                    case 'active':
                        buttonClass += ' recording';
                        buttonText = '🔴';
                        break;
                    case 'starting':
                    case 'stopping':
                        buttonClass += ' loading';
                        buttonText = '⏳';
                        isDisabled = true;
                        break;
                    case 'error':
                        buttonClass += ' error';
                        buttonText = '⚠️';
                        break;
                    default:
                        buttonClass += ' idle';
                        buttonText = '🎤';
                }
                break;
            default:
                buttonClass += ' idle';
                buttonText = '🎤';
        }
        
        micButton.className = buttonClass;
        micButton.textContent = buttonText;
        micButton.disabled = isDisabled;
    }
    
    // エラーメッセージ更新
    updateErrorMessages(permissionState, recognitionState) {
        if (permissionState === 'denied') {
            window.showMessage('error', 'マイクの使用許可が拒否されています。ブラウザの設定で許可し、ページを再読み込みしてください。');
        } else if (recognitionState === 'error') {
            window.showMessage('warning', '音声認識でエラーが発生しました。しばらく待ってから再試行してください。');
        }
    }
    
    // 進行状況更新
    updateProgress(permissionState, recognitionState, audioInfo) {
        const statusElement = window.UIManager.DOMUtils.get('sessionStatus');
        if (!statusElement) return;
        
        let statusText = '';
        
        if (permissionState === 'denied') {
            statusText = 'マイク許可が必要です';
        } else if (permissionState === 'requesting') {
            statusText = 'マイク許可を確認中...';
        } else if (recognitionState === 'starting') {
            statusText = '音声認識を開始中...';
        } else if (recognitionState === 'active') {
            statusText = '音声認識中...';
        } else if (recognitionState === 'stopping') {
            statusText = '音声認識を停止中...';
        } else if (recognitionState === 'error') {
            statusText = '音声認識エラー';
        } else if (audioInfo.length > 0) {
            statusText = `音声再生中 (${audioInfo.length}件)`;
        } else {
            statusText = '待機中';
        }
        
        statusElement.textContent = statusText;
    }
    
    // 音声認識開始
    async startRecognition() {
        return await this.recognitionManager.start();
    }
    
    // 音声認識停止
    async stopRecognition() {
        console.log('🛑 音声認識停止要求');
        return await this.recognitionManager.stop();
    }
    
    // 音声再生
    async playAudio(audioBlob, speaker) {
        console.log(`🎵 音声再生: ${speaker}`);
        
        const audioElement = new Audio(URL.createObjectURL(audioBlob));
        audioElement.volume = getVoiceSettings(speaker).volume;
        
        const audioId = this.audioManager.registerAudio(audioElement, 'tts', speaker);
        
        try {
            await audioElement.play();
            return audioId;
        } catch (error) {
            console.error('音声再生エラー:', error);
            this.audioManager.unregisterAudio({ id: audioId });
            throw error;
        }
    }
    
    // 全音声停止
    forceStopAllAudio(reason = 'user_request') {
        return this.audioManager.forceStopAllAudio(reason);
    }
    
    // 状態取得
    getState() {
        return {
            permission: this.permissionManager.state,
            recognition: this.recognitionManager.state,
            audio: this.audioManager.getActiveAudioInfo()
        };
    }
}

// =================================================================================
// CONSTANTS & STATE MANAGEMENT
// =================================================================================

const SPEAKERS = {
    NEHORI: 'nehori',
    HAHORI: 'hahori',
    USER: 'user',
    NULL: null
};

// 🔧 PHASES定数は app/phase-manager.js に移動しました
// 後方互換性は window.PHASES で保証

const MIC_STATES = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PROCESSING: 'processing'
};

// State: アプリケーション状態管理
const AppState = {
    apiKey: null,
    currentTheme: '',
    sessionActive: false,
    currentSpeaker: SPEAKERS.NULL,
    phase: 'setup', // PhaseManagerで管理
    microphoneActive: false,
    speechRecognition: null,
    conversationHistory: [],
    extractedKnowledge: [],
    currentPoint: 0,
    participants: [],
    isProcessing: false,
    waitingForPermission: true,
    currentTranscript: '',
    transcriptHistory: [],
    sessionStartTime: null,
    allSessions: [],
    pendingKnowledge: null,
    extractedThemes: [],
    selectedThemes: [],
    currentDocument: null,
    selectedThemeDetails: [],
    documentContext: '',
    themeSummaries: {},
    // 🔧 音声認識安定化: 強化された音声認識状態管理
    voiceRecognitionStability: {
        micPermissionGranted: false,
        permissionRequestInProgress: false,
        consecutiveErrorCount: 0,
        lastErrorTime: null,
        maxConsecutiveErrors: 3,
        errorRecoveryDelay: 2000,
        isRecognitionActive: false,
        lastRestartTime: null,
        minRestartInterval: 1000,
        restartScheduled: false  // 🛡️ 再開スケジュール重複防止フラグ
    },
    // 🔧 新機能: 音声ベース知見評価設定
    knowledgeSettings: {
        autoRecordThreshold: 70,        // 自動記録閾値（初期値70点）
        showAutoRecordNotice: true,     // 自動記録時の音声通知
        showDetailedEvaluation: true,   // 詳細評価の表示
        saveThresholdChanges: true      // 閾値変更の保存
    },
    // 🔧 新機能: セッション統計
    sessionStats: {
        totalKnowledge: 0,              // 抽出された知見総数
        autoRecorded: 0,                // 自動記録された知見数
        manualConfirmed: 0,             // 手動確認された知見数
        rejected: 0,                    // 拒否された知見数
        averageScore: 0                 // 平均評価点
    },
    // 🔧 新機能: 音声認識状態管理
    voiceRecognitionState: {
        isKnowledgeConfirmationMode: false,  // 知見確認モード
        pendingKnowledgeEvaluation: null,    // 保留中の知見評価
        isWaitingForThresholdChange: false   // 閾値変更待機中
    },
    // 🔧 会話フロー制御: 厳格な順序管理
    conversationControl: {
        currentPhase: 'IDLE',  // IDLE, USER_SPEAKING, HAHORI_PROCESSING, KNOWLEDGE_CONFIRMATION, NEHORI_QUESTIONING
        lastSpeaker: null,
        speakingInProgress: false,
        pendingNehoriQuestion: null,
        pendingNehoriAudio: null,
        justPlayedPendingNehori: false,
        // 🔧 Phase C: はほりーの先読み機能追加
        pendingHahoriContent: null,
        pendingHahoriAudio: null,
        justPlayedPendingHahori: false,
        preventNehoriInterruption: false,
        // 🔧 強化された重複防止フラグ
        isExitingKnowledgeConfirmationMode: false,
        isResumeInProgress: false,
        questionGenerationScheduled: false,
        lastQuestionTime: null
    }
};

// 🔧 AppStateとSPEAKERSをグローバルに公開
window.AppState = AppState;
window.SPEAKERS = SPEAKERS;

// VoiceSettings: 音声設定管理
const VoiceSettings = {
    [SPEAKERS.NEHORI]: {
        voice: 'sage',
        speed: 1.2,
        volume: 0.8,
        prompt: ''
    },
    [SPEAKERS.HAHORI]: {
        voice: 'nova',
        speed: 1.1,
        volume: 0.8,
        prompt: ''
    }
};

// 🔧 音声システムPhase2: VoiceOptimization・DualPreemptiveOptimizationは
// app/voice-phase2-manager.js に分離済み
// 完全後方互換性のため、既存参照は window.VoiceOptimization、window.DualPreemptiveOptimization で維持

let currentTheme = 'blue';
let currentGuideStep = 1;

// =================================================================================
// CONVERSATION FLOW CONTROL - 会話フロー制御
// =================================================================================

// 🔧 新機能: 中央集権的な会話ゲートキーパー
const ConversationGatekeeper = {
    // ネほりーのの発話許可チェック
    canNehoriSpeak(context = 'unknown') {
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        // 📝 知見確認モード中は絶対にNG
        if (state.isKnowledgeConfirmationMode) {
            console.log(`🚫 知見確認モード中のためねほりーの発話をブロック (${context})`);
            return false;
        }
        
        // 🗣️ 他のAIが発話中はブロック
        if (control.speakingInProgress || AppState.currentSpeaker !== SPEAKERS.NULL) {
            console.log(`🚫 AI発話中のためねほりーの発話をブロック (${context})`);
            return false;
        }
        
        // 📝 知見確認中の割り込み防止
        if (control.preventNehoriInterruption) {
            console.log(`🚫 割り込み防止フラグアクティブのためブロック (${context})`);
            return false;
        }
        
        // 🔄 連続発話防止（強化版）
        if (control.lastSpeaker === SPEAKERS.NEHORI && control.justPlayedPendingNehori) {
            console.log(`🚫 連続発話防止のためブロック (${context})`);
            return false;
        }
        
        // 🔄 知見確認モード終了プロセス中の重複防止
        if (control.isExitingKnowledgeConfirmationMode || control.isResumeInProgress) {
            return false;
        }
        
        // 🔄 質問生成スケジュール済みの重複防止
        if (control.questionGenerationScheduled) {
            return false;
        }
        
        // 🔄 最近の質問からの最小間隔チェック
        if (control.lastQuestionTime && Date.now() - control.lastQuestionTime < 2000) {
            console.log(`🚫 最近の質問から間隔が短いためブロック (${context})`);
            return false;
        }
        
        return true;
    },
    
    // はほりーのの発話許可チェック（Phase C強化版）
    canHahoriSpeak(context = 'unknown') {
        const control = AppState.conversationControl;
        
        // 🗣️ 他のAIが発話中はブロック
        if (control.speakingInProgress || AppState.currentSpeaker !== SPEAKERS.NULL) {
            console.log(`🚫 AI発話中のためはほりーの発話をブロック (${context})`);
            return false;
        }
        
        // 🔄 連続発話防止
        if (control.lastSpeaker === SPEAKERS.HAHORI && control.justPlayedPendingHahori) {
            console.log(`🚫 連続発話防止のためブロック (${context})`);
            return false;
        }
        
        // 📝 知見確認モード中の特別処理
        if (AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
            console.log(`📝 知見確認モード中のはほりーの発話許可 (${context})`);
            return true; // 知見評価のため許可
        }
        
        return true;
    },
    
    // 発話開始を登録（Phase C強化版）
    registerSpeechStart(speaker, context = 'unknown') {
        
        const control = AppState.conversationControl;
        control.speakingInProgress = true;
        control.lastSpeaker = speaker;
        AppState.currentSpeaker = speaker;
        
        // ネほりーの場合の特別処理
        if (speaker === SPEAKERS.NEHORI) {
            control.justPlayedPendingNehori = false;
            control.lastQuestionTime = Date.now();
            control.questionGenerationScheduled = false;
            
                    // 🔧 Phase C: ねほりーの発声開始時にはほりーの先読みを開始（状況適応版）
        if (window.DualPreemptiveOptimization?.phase1.isActive) {
            const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.NEHORI, null);
            const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
            
            if (strategy.trigger !== 'none' && strategy.targetSpeaker === SPEAKERS.HAHORI) {
                setTimeout(() => {
                    window.startHahoriGenerationDuringNehori();
                }, strategy.delay);
            }
        }
        }
        
        // 🔧 Phase C: はほりーの場合の特別処理（状況適応版）
        if (speaker === SPEAKERS.HAHORI) {
            control.justPlayedPendingHahori = false;
            
            // 🔧 Phase C: はほりーの発声開始時にねほりーの先読みを開始（状況適応版）
            if (window.DualPreemptiveOptimization?.phase1.isActive) {
                const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.HAHORI, null);
                const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
                
                if (strategy.trigger !== 'none' && strategy.targetSpeaker === SPEAKERS.NEHORI) {
                    setTimeout(() => {
                        window.startNehoriGenerationDuringHahori();
                    }, strategy.delay);
                }
            }
        }
    },
    
    // 発話終了を登録
    registerSpeechEnd(speaker, context = 'unknown') {
        
        const control = AppState.conversationControl;
        control.speakingInProgress = false;
        AppState.currentSpeaker = SPEAKERS.NULL;
        
        // 知見確認モード中でなければ音声認識を再開
        if (!AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
            setTimeout(() => {
                safeStartSpeechRecognition(`${speaker}SpeechEnd`);
            }, 500);
        }
    },
    
    // 知見確認モードの開始
    enterKnowledgeConfirmationMode(context = 'unknown') {
        
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        state.isKnowledgeConfirmationMode = true;
        control.preventNehoriInterruption = true;
        
        // 進行中のネほりーの生成を停止
        if (VoiceOptimization.phase3.isGeneratingNehori) {
            VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
        }
        
        // 🔧 Phase C: 進行中のはほりーの生成も停止
        if (window.DualPreemptiveOptimization?.phase1.isGeneratingHahori) {
            window.DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
        }
    },
    
    // 知見確認モードの終了（強化版）
    exitKnowledgeConfirmationMode(context = 'unknown') {
        
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        // 重複防止フラグをセット
        control.isExitingKnowledgeConfirmationMode = true;
        
        // 既存の状態をクリア
        state.isKnowledgeConfirmationMode = false;
        state.pendingKnowledgeEvaluation = null;
        control.preventNehoriInterruption = false;
        
        // 少し待ってからPendingのAI応答を再生
        setTimeout(() => {
            // 🔧 Phase C: ねほりーのとはほりーのの両方のPendingをチェック
            this.resumePendingNehoriIfNeeded(context);
            window.playPendingHahoriIfNeeded();
            
            // フラグを解除
            setTimeout(() => {
                control.isExitingKnowledgeConfirmationMode = false;
            }, 100);
        }, 300);
        
    },
    
    // 🔧 最適化版: Pending統一管理システム（強化版）
    resumePendingNehoriIfNeeded(context = 'unknown') {
        const control = AppState.conversationControl;
        
        // 重複実行防止
        if (control.isResumeInProgress) {
            return;
        }
        
        control.isResumeInProgress = true;
        
        try {
            if (!this.canNehoriSpeak(`resumePending_${context}`)) {
                console.log('😴 Pendingネほりーの再生条件未満');
                return;
            }
            
            // 📦 統一Pendingデータ探索（優先度順）
            const pendingSources = this.collectAllPendingData();
            
            if (pendingSources.hasPending) {
                
                // 安全な再生
                this.playUnifiedPendingNehori(pendingSources, context);
            } else {
                
                // 質問生成スケジュールフラグをセット
                if (!control.questionGenerationScheduled) {
                    control.questionGenerationScheduled = true;
                    
                    // Pendingがない場合は新しい質問を生成
                    setTimeout(() => {
                        window.handleNehoriImmediatePlayback().catch(error => {
                            console.error('❌ 新しい質問生成エラー:', error);
                        }).finally(() => {
                            control.questionGenerationScheduled = false;
                        });
                    }, 500);
                }
            }
        } finally {
            // フラグを解除
            setTimeout(() => {
                control.isResumeInProgress = false;
            }, 100);
        }
    },
    
    // 🔧 新機能: 全てのPendingデータを統一収集（Phase C強化版）
    collectAllPendingData() {
        const control = AppState.conversationControl;
        
        // 優先度順: conversationControl > AppState > Phase3 > DualPreemptive
        if (control.pendingNehoriQuestion && control.pendingNehoriAudio) {
            return {
                hasPending: true,
                source: 'conversationControl',
                question: control.pendingNehoriQuestion,
                audio: control.pendingNehoriAudio,
                clearFunction: () => {
                    control.pendingNehoriQuestion = null;
                    control.pendingNehoriAudio = null;
                }
            };
        }
        
        if (AppState.pendingNehoriQuestion && AppState.pendingNehoriAudio) {
            return {
                hasPending: true,
                source: 'AppState',
                question: AppState.pendingNehoriQuestion,
                audio: AppState.pendingNehoriAudio,
                clearFunction: () => {
                    AppState.pendingNehoriQuestion = null;
                    AppState.pendingNehoriAudio = null;
                }
            };
        }
        
        if (VoiceOptimization.phase3.pendingNehoriContent && VoiceOptimization.phase3.pendingNehoriAudio) {
            return {
                hasPending: true,
                source: 'phase3Optimization',
                question: VoiceOptimization.phase3.pendingNehoriContent,
                audio: VoiceOptimization.phase3.pendingNehoriAudio,
                clearFunction: () => {
                    VoiceOptimization.phase3.pendingNehoriContent = null;
                    VoiceOptimization.phase3.pendingNehoriAudio = null;
                    VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
                }
            };
        }
        
        // 🔧 Phase C: はほりーのPendingデータも収集
        if (control.pendingHahoriContent && control.pendingHahoriAudio) {
            return {
                hasPending: true,
                source: 'conversationControlHahori',
                question: control.pendingHahoriContent,
                audio: control.pendingHahoriAudio,
                clearFunction: () => {
                    control.pendingHahoriContent = null;
                    control.pendingHahoriAudio = null;
                }
            };
        }
        
        if (window.DualPreemptiveOptimization?.phase1.pendingHahoriContent && window.DualPreemptiveOptimization.phase1.pendingHahoriAudio) {
            return {
                hasPending: true,
                source: 'dualPreemptiveOptimization',
                question: window.DualPreemptiveOptimization.phase1.pendingHahoriContent,
                audio: window.DualPreemptiveOptimization.phase1.pendingHahoriAudio,
                clearFunction: () => {
                    window.DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
                    window.DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
                    window.DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
                }
            };
        }
        
        return {
            hasPending: false,
            source: 'none'
        };
    },
    
    // 🔧 新機能: 統一Pendingネほりーの安全再生
    async playUnifiedPendingNehori(pendingData, context = 'unknown') {
        const control = AppState.conversationControl;
        
        try {
            this.registerSpeechStart(SPEAKERS.NEHORI, `unified_${pendingData.source}_${context}`);
            
            // メッセージ追加と音声再生
            await addMessageToChat(SPEAKERS.NEHORI, pendingData.question);
            await playPreGeneratedAudio(pendingData.audio, SPEAKERS.NEHORI);
            
            // 統一クリア処理
            pendingData.clearFunction();
            control.justPlayedPendingNehori = true;
            
            this.registerSpeechEnd(SPEAKERS.NEHORI, `unified_${pendingData.source}_${context}`);
            
            // 短時間後にフラグをリセット
            setTimeout(() => { 
                control.justPlayedPendingNehori = false; 
            }, 100);
            
            
        } catch (error) {
            console.error('❌ 統一Pendingネほりーの再生エラー:', error);
            // エラー時もクリア
            pendingData.clearFunction();
            this.registerSpeechEnd(SPEAKERS.NEHORI, `unified_error_${context}`);
        }
    },
    
    // Pendingネほりーの安全な再生
    async playPendingNehoriSafely(context = 'unknown') {
        const control = AppState.conversationControl;
        
        if (!control.pendingNehoriQuestion || !control.pendingNehoriAudio) {
            console.log('⚠️ Pendingデータが不完全です');
            return;
        }
        
        try {
            this.registerSpeechStart(SPEAKERS.NEHORI, `pending_${context}`);
            
            // メッセージ追加と音声再生
            addMessageToChat(SPEAKERS.NEHORI, control.pendingNehoriQuestion);
            await playPreGeneratedAudio(control.pendingNehoriAudio, SPEAKERS.NEHORI);
            
            this.registerSpeechEnd(SPEAKERS.NEHORI, `pending_${context}`);
            
        } catch (error) {
            console.error('❌ Pendingネほりーの再生エラー:', error);
            this.registerSpeechEnd(SPEAKERS.NEHORI, `pending_error_${context}`);
        }
    },
    
    // 🔧 新機能: 重複Pendingデータの完全クリア（Phase C強化版）
    clearAllPendingData(reason = 'cleanup') {
        console.log(`🧹 全Pendingデータをクリア: ${reason}`);
        
        const control = AppState.conversationControl;
        
        // conversationControlのPendingデータをクリア
        control.pendingNehoriQuestion = null;
        control.pendingNehoriAudio = null;
        // 🔧 Phase C: はほりーのPendingデータもクリア
        control.pendingHahoriContent = null;
        control.pendingHahoriAudio = null;
        
        // AppStateのPendingデータをクリア（レガシー対応）
        AppState.pendingNehoriQuestion = null;
        AppState.pendingNehoriAudio = null;
        
        // Phase3最適化のPendingデータをクリア
        VoiceOptimization.phase3.pendingNehoriContent = null;
        VoiceOptimization.phase3.pendingNehoriAudio = null;
        VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
        
        // 🔧 Phase C: 双方向先読み最適化のPendingデータをクリア
                    window.DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
            window.DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
            window.DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
        
    },
    
    // 🔧 新機能: Pendingデータの状態確認（Phase C強化版）
    getPendingStatus() {
        const pendingData = this.collectAllPendingData();
        const control = AppState.conversationControl;
        
        return {
            hasPending: pendingData.hasPending,
            source: pendingData.source,
            canNehoriPlay: this.canNehoriSpeak('statusCheck'),
            canHahoriPlay: this.canHahoriSpeak('statusCheck'),
            isKnowledgeConfirmationMode: AppState.voiceRecognitionState.isKnowledgeConfirmationMode,
            justPlayedPendingNehori: control.justPlayedPendingNehori,
            justPlayedPendingHahori: control.justPlayedPendingHahori
        };
    }
};

// 🔧 グローバルユーティリティ関数: Pendingシステムの緊急クリア
// デバッグや緊急時に使用
function emergencyClearAllPending(reason = 'emergency') {
    console.warn(`🚨 緊急Pendingクリア実行: ${reason}`);
    ConversationGatekeeper.clearAllPendingData(reason);
}

// 🔧 Phase C: グローバル関数公開（テスト・デバッグ用）
// DualPreemptiveOptimizationは app/voice-phase2-manager.js に移動済み
window.startHahoriGenerationDuringNehori = startHahoriGenerationDuringNehori;
window.handleHahoriImmediatePlayback = handleHahoriImmediatePlayback;
window.playPendingHahoriIfNeeded = playPendingHahoriIfNeeded;

// 🔧 Phase C: 双方向先読みテスト機能
window.testDualPreemptiveSystem = async function() {
    
    try {
        // 1. 状況分析テスト
        const situation = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.NEHORI, null);
        
        // 2. 戦略決定テスト
        const strategy = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        console.log('🎯 戦略決定結果:', strategy);
        
        // 3. Pending状態確認
        const pendingStatus = ConversationGatekeeper.getPendingStatus();
        
        // 4. はほりーの先読み生成テスト（条件が満たされている場合のみ）
        if (AppState.phase === 'deepdive' && ConversationGatekeeper.canHahoriSpeak('test')) {
            await startHahoriGenerationDuringNehori();
        } else {
        }
        
        return { success: true, situation, strategy, pendingStatus };
        
    } catch (error) {
        console.error('❌ 双方向先読みシステムテストエラー:', error);
        return { success: false, error: error.message };
    }
};

// 🔧 Phase C: 状況適応システムテスト機能
window.testAdaptiveStrategy = function() {
    
    const testCases = [
        { speaker: SPEAKERS.NEHORI, input: null, expected: 'nehori_speaking' },
        { speaker: SPEAKERS.HAHORI, input: null, expected: 'hahori_speaking' },
        { speaker: SPEAKERS.NULL, input: 'テスト入力', expected: 'user_speaking' },
        { speaker: SPEAKERS.NULL, input: '', expected: 'idle' }
    ];
    
    const results = testCases.map(testCase => {
        const actual = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.analyzeConversationSituation(
            testCase.speaker, 
            testCase.input
        );
        const strategy = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.determinePreemptiveStrategy(actual);
        
        return {
            testCase,
            actual,
            expected: testCase.expected,
            strategy,
            passed: actual === testCase.expected
        };
    });
    
    return results;
};

// 🔧 グローバルユーティリティ関数: Pending状態のデバッグ情報表示
function debugPendingStatus() {
    const status = ConversationGatekeeper.getPendingStatus();
    return status;
}

// 🔧 状態フラグ管理改善: レガシーフラグの統一アクセサ
// マイク状態の統一管理
Object.defineProperty(AppState, 'microphoneActive', {
    get() {
        // 新しい状態管理システムへのマッピング
        return this.voiceRecognitionStability.isRecognitionActive && 
               this.voiceRecognitionStability.micPermissionGranted;
    },
    set(value) {
        console.warn('⚠️ 非推奨: AppState.microphoneActiveの直接設定は非推奨です。ConversationGatekeeperを使用してください。');
        // 互換性のための一時的対応
        if (value) {
            this.voiceRecognitionStability.isRecognitionActive = true;
        } else {
            this.voiceRecognitionStability.isRecognitionActive = false;
        }
    },
    configurable: true
});

// Pendingネほりーフラグの統一管理
Object.defineProperty(AppState, 'justPlayedPendingNehori', {
    get() {
        return this.conversationControl.justPlayedPendingNehori;
    },
    set(value) {
        console.warn('⚠️ 非推奨: AppState.justPlayedPendingNehoriの直接設定は非推奨です。ConversationGatekeeperを使用してください。');
        this.conversationControl.justPlayedPendingNehori = value;
    },
    configurable: true
});

// 🔧 グローバルユーティリティ関数: 統一状態管理のデバッグ情報
function debugStateFlags() {
    const flags = {
        // 音声認識関連
        voiceRecognition: {
            isRecognitionActive: AppState.voiceRecognitionStability.isRecognitionActive,
            micPermissionGranted: AppState.voiceRecognitionStability.micPermissionGranted,
            consecutiveErrorCount: AppState.voiceRecognitionStability.consecutiveErrorCount,
            lastErrorTime: AppState.voiceRecognitionStability.lastErrorTime
        },
        // 会話制御関連
        conversationControl: {
            currentPhase: AppState.conversationControl.currentPhase,
            lastSpeaker: AppState.conversationControl.lastSpeaker,
            speakingInProgress: AppState.conversationControl.speakingInProgress,
            justPlayedPendingNehori: AppState.conversationControl.justPlayedPendingNehori,
            preventNehoriInterruption: AppState.conversationControl.preventNehoriInterruption
        },
        // 知見確認関連
        knowledgeConfirmation: {
            isKnowledgeConfirmationMode: AppState.voiceRecognitionState.isKnowledgeConfirmationMode,
            pendingKnowledgeEvaluation: !!AppState.voiceRecognitionState.pendingKnowledgeEvaluation
        },
        // レガシーフラグ（互換性）
        legacyFlags: {
            microphoneActive: AppState.microphoneActive, // ゲッター経由
            justPlayedPendingNehori: AppState.justPlayedPendingNehori // ゲッター経由
        }
    };
    
    return flags;
}

// 🔧 グローバルユーティリティ関数: レガシーフラグの移行状態確認
function checkLegacyFlagMigration() {
    const issues = [];
    
    // Pendingデータの重複チェック
    const pendingStatus = ConversationGatekeeper.getPendingStatus();
    if (pendingStatus.hasPending && pendingStatus.source !== 'conversationControl') {
        issues.push(`Pendingデータが新システム以外に存在: ${pendingStatus.source}`);
    }
    
    // 直接アクセスのチェック（ランタイムでは検出できないが、ログで確認可能）
    if (AppState.hasOwnProperty('microphoneActive') && 
        typeof AppState.microphoneActive !== 'undefined') {
        // ゲッター/セッターが設定されているか確認
        const descriptor = Object.getOwnPropertyDescriptor(AppState, 'microphoneActive');
        if (!descriptor || !descriptor.get) {
            issues.push('非推奨: AppState.microphoneActiveが直接プロパティとして存在');
        }
    }
    
    if (issues.length > 0) {
        console.warn('⚠️ レガシーフラグ移行の問題が発見されました:', issues);
        return { success: false, issues };
    } else {
        return { success: true, issues: [] };
    }
}

// 🔧 新機能: マイク許可保持統計情報デバッグ
function debugMicrophonePermissionStats() {
    
    const stateManager = window.AppState?.stateManager || window.stateManager;
    if (!stateManager?.recognitionManager) {
        return;
    }
    
    const stats = stateManager.recognitionManager.getMicrophonePermissionStats();
    
    
    // 戦略別の統計表示
    if (stats.strategy === 'continuous') {
        console.log(`  - 戦略: 継続的音声認識（真の解決策）`);
        console.log(`  - start()呼び出し: ${stats.startCount}回`);
        console.log(`  - マイク許可要求: ${stats.microphonePermissionRequests}回`);
        console.log(`  - 結果処理: ${stats.resultProcessedCount}回`);
        console.log(`  - 結果無視: ${stats.resultIgnoredCount}回`);
        console.log(`  - 一時停止: ${stats.pauseCount}回`);
        console.log(`  - 処理再開: ${stats.resumeCount}回`);
        console.log(`  - セッション時間: ${stats.sessionDuration}秒`);
        console.log(`  - 効率性: ${stats.efficiency}%`);
    } else if (stats.strategy === 'persistent') {
        console.log(`  - 戦略: Chrome専用インスタンス不変`);
        console.log(`  - インスタンス作成: ${stats.instanceCreationCount}回`);
        console.log(`  - マイク許可要求: ${stats.microphonePermissionRequests}回`);
        console.log(`  - 音声認識再開: ${stats.restartCount}回`);
        console.log(`  - セッション時間: ${stats.sessionDuration}秒`);
        console.log(`  - 効率性: ${stats.efficiency}%`);
    } else {
        console.log(`  - 戦略: ${stats.strategy || 'lightweight'}`);
        console.log(`  - 完全クリーンアップ: ${stats.completeBefore || 0}回`);
        console.log(`  - 軽量リスタート: ${stats.lightweightCount || 0}回`);
        console.log(`  - 最終処理: ${stats.lastCleanupType || 'unknown'}`);
        console.log(`  - セッション時間: ${stats.sessionDuration}秒`);
        console.log(`  - 効率性: ${stats.efficiency}%`);
    }
    
    // 効率性に基づく推奨事項
    if (stats.strategy === 'continuous') {
        if (stats.startCount === 1 && stats.microphonePermissionRequests === 1) {
            console.log('🎯 完璧: 継続的音声認識が理想的に動作しています');
            console.log('✨ マイク許可アラートは完全に解消されました');
        } else if (stats.startCount <= 3) {
        } else {
            console.log('⚠️ 注意: 継続的音声認識で予期しない再開が発生しています');
            console.log('💡 継続的音声認識トラブルシューティング:');
            console.log('  - 他のタブでマイクを使用していないか確認');
        }
    } else if (stats.efficiency >= 95) {
        console.log('🎯 完璧: マイク許可が完全に保持されています');
    } else if (stats.efficiency >= 80) {
    } else if (stats.efficiency >= 60) {
        console.log('⚠️ 良好: マイク許可保持に若干の改善余地があります');
    } else {
        console.log('❌ 要改善: マイク許可アラートが頻発しています');
        console.log('💡 推奨事項:');
        console.log('  3. 他のタブでマイクを使用していないか確認');
        
        // 継続的音声認識戦略の推奨
        if (stats.strategy !== 'continuous' && navigator.userAgent.includes('Chrome')) {
            console.log('  4. 継続的音声認識戦略に切り替え: switchMicrophoneStrategy("continuous")');
        }
        // Chrome専用戦略の推奨
        else if (stats.strategy !== 'persistent' && navigator.userAgent.includes('Chrome')) {
            console.log('  4. Chrome専用戦略に切り替え: switchMicrophoneStrategy("persistent")');
        }
    }
    
    return stats;
}

// =================================================================================
// VOICE RECOGNITION PATTERNS - 音声認識パターン
// =================================================================================

// 🎤 音声パターンとテンプレートはprompts.jsから読み込み
// (重複定義を避けるため、ここでは削除済み)

// =================================================================================
// UTILITY FUNCTIONS - ユーティリティ関数
// =================================================================================

// DOMUtilsはapp/ui-manager.jsに移動済み

const ErrorHandler = {
    handle: (error, context = '', userMessage = '') => {
        console.error(`❌ ${context}エラー:`, error);
        const message = userMessage || error.message || 'エラーが発生しました';
        window.showMessage('error', message);
    },
    success: (message) => {
        window.showMessage('success', message);
    }
};

// =================================================================================
// CORE FUNCTIONS - 基本機能
// =================================================================================

// showMessage関数はapp/utils.jsに移動しました

// プロンプト取得関数
function getCharacterPrompt(character) {
    // まずprompts.jsから直接読み込みを試行
    if (window.VoicePresets && window.VoicePresets.default && window.VoicePresets.default.settings[character]) {
        const prompt = window.VoicePresets.default.settings[character].prompt;
        if (prompt && prompt.trim()) {
            return prompt;
        }
    }
    
    // フォールバック: VoiceSettingsから取得
    if (VoiceSettings[character] && VoiceSettings[character].prompt) {
        return VoiceSettings[character].prompt;
    }
    
    // デバッグ情報
    console.log(`⚠️ プロンプトが見つかりません (character: ${character})`);
    console.log('window.VoicePresets:', window.VoicePresets);
    
    return '';
}

function getDefaultSystemPrompt(character) {
    if (window.AI_PROMPTS) {
        return character === SPEAKERS.NEHORI ? 
            window.AI_PROMPTS.NEHORI_BASE : 
            window.AI_PROMPTS.HAHORI_BASE;
    }
    return '';
}

// 音声設定初期化
function initializeVoiceSettings() {
    try {
        // まずprompts.jsから基本設定を読み込み
        if (window.VoicePresets && window.VoicePresets.default) {
            Object.assign(VoiceSettings[SPEAKERS.NEHORI], window.VoicePresets.default.settings[SPEAKERS.NEHORI]);
            Object.assign(VoiceSettings[SPEAKERS.HAHORI], window.VoicePresets.default.settings[SPEAKERS.HAHORI]);
        }
        
        // 次にカスタム設定ファイルがあれば読み込み
        if (window.CUSTOM_VOICE_CONFIG) {
            
            if (window.CUSTOM_VOICE_CONFIG.nehori) {
                Object.assign(VoiceSettings[SPEAKERS.NEHORI], window.CUSTOM_VOICE_CONFIG.nehori);
            }
            if (window.CUSTOM_VOICE_CONFIG.hahori) {
                Object.assign(VoiceSettings[SPEAKERS.HAHORI], window.CUSTOM_VOICE_CONFIG.hahori);
            }
            
        }
        
        // 最後にローカルストレージの設定があれば上書き
        const savedConfig = localStorage.getItem('fukabori_voice_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            
            if (config.nehori) {
                Object.assign(VoiceSettings[SPEAKERS.NEHORI], config.nehori);
            }
            if (config.hahori) {
                Object.assign(VoiceSettings[SPEAKERS.HAHORI], config.hahori);
            }
            
        }
        
        
        // 🆕 UIに設定を反映
        window.updateVoiceSettingsUI();
        
    } catch (error) {
        console.error('❌ 音声設定初期化エラー:', error);
    }
}

// 🆕 音声設定UIの更新関数
function updateVoiceSettingsUI() {
    try {
        // prompts.jsの設定を確認
        let nehoriSettings = VoiceSettings[SPEAKERS.NEHORI];
        let hahoriSettings = VoiceSettings[SPEAKERS.HAHORI];
        
        // prompts.jsから再読み込み（優先）
        if (window.VoicePresets && window.VoicePresets.default) {
            nehoriSettings = { ...nehoriSettings, ...window.VoicePresets.default.settings[SPEAKERS.NEHORI] };
            hahoriSettings = { ...hahoriSettings, ...window.VoicePresets.default.settings[SPEAKERS.HAHORI] };
        }
        
        // ねほりーの設定
        const nehoriVoice = window.UIManager.DOMUtils.get('nehoriVoice');
        const nehoriSpeed = window.UIManager.DOMUtils.get('nehoriSpeed');
        const nehoriVolume = window.UIManager.DOMUtils.get('nehoriVolume');
        const nehoriSpeedValue = window.UIManager.DOMUtils.get('nehoriSpeedValue');
        const nehoriVolumeValue = window.UIManager.DOMUtils.get('nehoriVolumeValue');
        
        if (nehoriVoice) nehoriVoice.value = nehoriSettings.voice || 'sage';
        if (nehoriSpeed) nehoriSpeed.value = nehoriSettings.speed || 1.3;
        if (nehoriVolume) nehoriVolume.value = Math.min(nehoriSettings.volume || 0.9, 1.0); // 上限1.0
        if (nehoriSpeedValue) nehoriSpeedValue.textContent = nehoriSpeed?.value || '1.3';
        if (nehoriVolumeValue) nehoriVolumeValue.textContent = nehoriVolume?.value || '0.9';
        
        // はほりーの設定
        const hahoriVoice = window.UIManager.DOMUtils.get('hahoriVoice');
        const hahoriSpeed = window.UIManager.DOMUtils.get('hahoriSpeed');
        const hahoriVolume = window.UIManager.DOMUtils.get('hahoriVolume');
        const hahoriSpeedValue = window.UIManager.DOMUtils.get('hahoriSpeedValue');
        const hahoriVolumeValue = window.UIManager.DOMUtils.get('hahoriVolumeValue');
        
        if (hahoriVoice) hahoriVoice.value = hahoriSettings.voice || 'shimmer';
        if (hahoriSpeed) hahoriSpeed.value = hahoriSettings.speed || 1.3;
        if (hahoriVolume) hahoriVolume.value = Math.min(hahoriSettings.volume || 0.7, 1.0); // 上限1.0
        if (hahoriSpeedValue) hahoriSpeedValue.textContent = hahoriSpeed?.value || '1.3';
        if (hahoriVolumeValue) hahoriVolumeValue.textContent = hahoriVolume?.value || '0.7';
        
        // VoiceSettingsも更新
        VoiceSettings[SPEAKERS.NEHORI] = nehoriSettings;
        VoiceSettings[SPEAKERS.HAHORI] = hahoriSettings;
        
        
    } catch (error) {
        console.error('❌ 音声設定UI更新エラー:', error);
    }
}

// =================================================================================
// LOGIN & AUTHENTICATION - ログイン・認証
// =================================================================================

function loginWithPassword() {
    
    const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
    if (!passwordInput) {
        window.showMessage('error', 'パスワード入力欄が見つかりません');
        return;
    }
    
    const password = passwordInput.value.trim();
    if (!password) {
        window.showMessage('error', 'パスワードを入力してください');
        return;
    }

    try {
        const decryptedKey = window.StorageManager.apiKey.load(password);
        AppState.apiKey = decryptedKey;
        
        // 🔄 新機能: ログイン状態を保存
        saveLoginState(true);
        
        // 🔧 マイク許可拒否状態のリセット（ログイン成功時に再試行を許可）
        localStorage.removeItem('microphonePermissionDenied');
        
        // 🔄 新機能: パスワード入力欄をクリア
        passwordInput.value = '';
        
        // 🔄 新機能: 2ステップUIを更新（従来のボタン制御から変更）
        update2StepUI();
        
        window.showMessage('success', 'ログインに成功しました');
        
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        
        // 🔧 データ復旧を試行
        const recoverySuccess = window.attemptDataRecovery(password);
        
        if (recoverySuccess) {
            try {
                const decryptedKey = window.StorageManager.apiKey.load(password);
                AppState.apiKey = decryptedKey;
                
                saveLoginState(true);
                localStorage.removeItem('microphonePermissionDenied');
                passwordInput.value = '';
                update2StepUI();
                
                window.showMessage('success', 'データ復旧完了！ログインに成功しました');
                return;
            } catch (retryError) {
                console.error('❌ 復旧後ログイン失敗:', retryError);
            }
        }
        
        window.showMessage('error', 'パスワードが間違っているか、保存されたAPIキーがありません');
    }
}

// 🔧 UI最適化Phase1: モーダル管理機能をapp/ui-advanced.jsに移動
// openAdvancedSettings, closeAdvancedSettings, updateAdvancedSettingsDisplay, 
// saveVoicePreset, downloadVoiceConfig, handleEscapeKey

// =================================================================================
// API INTEGRATION - API統合
// =================================================================================

// 🎭 音声用テキスト短縮機能
function shortenForSpeech(text, maxLength = 200) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    // 句読点での区切りを優先
    const sentences = text.split(/[。！？]/);
    let shortened = '';
    
    for (const sentence of sentences) {
        const candidate = shortened + sentence + (sentence.endsWith('。') || sentence.endsWith('！') || sentence.endsWith('？') ? '' : '。');
        if (candidate.length <= maxLength) {
            shortened = candidate;
        } else {
            break;
        }
    }
    
    // まだ長い場合は強制的に切る
    if (shortened.length > maxLength) {
        shortened = text.substring(0, maxLength - 3) + '...';
    }
    
    return shortened || text.substring(0, maxLength - 3) + '...';
}

// 🎭 表示と発声を分離した統合メッセージ処理
async function addMessageToChatWithSpeech(speaker, displayText, speechText = null) {
    // チャット表示（長いテキスト）
    await addMessageToChat(speaker, displayText);
    
    // 🆕 コンテキスト連携短縮システムを使用
    let textForSpeech;
    if (speechText) {
        textForSpeech = speechText;
    } else if (window.SpeechShorteningEngine && window.SpeechShorteningEngine.enabled) {
        // コンテキスト情報を取得
        const context = window.SpeechShorteningEngine.getCurrentContext();
        
        // AI要約が有効な場合は非同期処理
        if (window.SpeechShorteningEngine.settings.features.aiSummary) {
            textForSpeech = await window.SpeechShorteningEngine.shortenTextWithContext(displayText, context);
        } else {
            textForSpeech = window.SpeechShorteningEngine.shortenText(displayText, context);
        }
    } else {
        // フォールバック: 従来の簡易短縮
        textForSpeech = shortenForSpeech(displayText);
    }
    
    // 短縮が発生した場合のログ
    if (displayText.length > textForSpeech.length) {
        const reductionRate = Math.round((1 - textForSpeech.length / displayText.length) * 100);
        console.log(`🔊 発声: ${textForSpeech}`);
    } else {
        console.log('📝 音声短縮なし（元テキストをそのまま使用）');
        console.log(`📄 テキスト: ${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}`);
    }
    
    try {
        const audioBlob = await ttsTextToAudioBlob(textForSpeech, speaker);
        await playPreGeneratedAudio(audioBlob, speaker);
    } catch (error) {
        console.error('❌ 音声生成エラー:', error);
        window.showMessage('error', '音声の生成に失敗しました');
    }
}

async function ttsTextToAudioBlob(text, character) {
    if (!AppState.apiKey) {
        throw new Error('APIキーが設定されていません');
    }

    // 🎯 Phase 1: 音声生成前に短縮エンジンを適用
    let textForSpeech = text;
    try {
        // SpeechShorteningManagerを使用して短縮処理
        if (window.SpeechShorteningManager && window.SpeechShorteningManager.settings.enabled) {
            const originalLength = text.length;
            textForSpeech = await window.SpeechShorteningManager.processTextWithShortening(text, character);
            
            if (originalLength !== textForSpeech.length) {
                const reduction = Math.round((1 - textForSpeech.length / originalLength) * 100);
                console.log(`🎯 TTS短縮適用: ${originalLength}→${textForSpeech.length}文字 (${reduction}%短縮)`);
            }
        }
    } catch (error) {
        console.warn('⚠️ TTS短縮エンジン適用エラー:', error);
        textForSpeech = text; // エラー時は元のテキストを使用
    }

    const voiceSettings = getVoiceSettings(character);
    
    try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-tts',
                input: textForSpeech, // 短縮されたテキストを使用
                voice: voiceSettings.voice,
                speed: voiceSettings.speed,
                response_format: 'mp3',
                instructions: `${voiceSettings.voice}音声で、深堀インタビューAIとして親しみやすく、聞き手に寄り添うように話してください。`
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`TTS API Error: ${errorData.error?.message || response.statusText}`);
        }

        return await response.blob();
    } catch (error) {
        console.error('TTS API呼び出しエラー:', error);
        throw error;
    }
}

async function gptMessagesToCharacterResponse(messages, character) {
    console.warn('⚠️ gptMessagesToCharacterResponse は非推奨です。AIManager.sendToCharacter を使用してください');
    
    // AIManagerが利用可能かチェック
    if (window.AIManager && window.AIManager.isInitialized) {
        try {
            return await window.AIManager.sendToCharacter(messages, character);
        } catch (error) {
            console.error('❌ AIManager.sendToCharacter実行エラー:', error);
            // フォールバック処理へ
        }
    }
    
    // フォールバック実装（AIManager未使用時）
    console.warn('⚠️ AIManagerが未初期化のため、レガシー実装を使用します');
    
    if (!AppState.apiKey) {
        throw new Error('APIキーが設定されていません');
    }

    let characterPrompt;
    // Knowledge DNAシステム等のシステム呼び出し対応
    if (character === 'system' || !VoiceSettings || !VoiceSettings[character]) {
        characterPrompt = 'あなたは深堀くんの知見分析を担当するAIアシスタントです。正確で有用な分析を提供してください。';
    } else if (VoiceSettings[character] && VoiceSettings[character].prompt && VoiceSettings[character].prompt.trim()) {
        characterPrompt = VoiceSettings[character].prompt;
    } else {
        characterPrompt = getDefaultSystemPrompt(character);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: characterPrompt },
                    ...messages
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GPT API Error: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error('GPT API呼び出しエラー:', error);
        throw error;
    }
}

// =================================================================================
// AUDIO MANAGEMENT - 音声管理
// =================================================================================

// 🔧 改善版: 安定したマイク初期化関数（マイク許可は一回だけルール遵守）
async function initializeMicrophoneRecording(forceRecheck = false) {
    
    // 🛡️ 重複リクエスト防止（絶対ルール）
    if (AppState.voiceRecognitionStability.permissionRequestInProgress) {
        console.log('🚫 マイク許可リクエストが既に進行中 - 重複防止');
        return AppState.voiceRecognitionStability.micPermissionGranted;
    }
    
    // 🛡️ 既に許可取得済みの場合は絶対に再取得しない
    if (AppState.voiceRecognitionStability.micPermissionGranted && !forceRecheck) {
        await initializeSpeechRecognition();
        return true;
    }
    
    AppState.voiceRecognitionStability.permissionRequestInProgress = true;
    
    try {
        // 🛡️ 保存された許可状態を最優先で確認
        const storedPermission = localStorage.getItem('microphonePermissionGranted');
        const hasStoredPermission = storedPermission === 'true';
        
        if (hasStoredPermission && !forceRecheck) {
            AppState.voiceRecognitionStability.micPermissionGranted = true;
        } else {
            // 🛡️ マイク許可は一回だけ - 絶対ルール
            
            // 🛡️ 許可状態を事前チェック
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
            if (permissionStatus && permissionStatus.state === 'granted') {
                localStorage.setItem('microphonePermissionGranted', 'true');
                AppState.voiceRecognitionStability.micPermissionGranted = true;
            } else {
                // 🛡️ 一回だけの許可取得
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                
                if (stream) {
                    // ストリームを即座に停止（許可のみが目的）
                    stream.getTracks().forEach(track => track.stop());
                    
                    localStorage.setItem('microphonePermissionGranted', 'true');
                    AppState.voiceRecognitionStability.micPermissionGranted = true;
                }
            }
        }
        
        // SpeechRecognitionの初期化（許可が取れた場合のみ）
        if (AppState.voiceRecognitionStability.micPermissionGranted) {
            await initializeSpeechRecognition();
        }
        
        AppState.voiceRecognitionStability.permissionRequestInProgress = false;
        return AppState.voiceRecognitionStability.micPermissionGranted;
        
    } catch (error) {
        console.error('❌ マイク初期化エラー:', error);
        
        AppState.voiceRecognitionStability.micPermissionGranted = false;
        AppState.voiceRecognitionStability.permissionRequestInProgress = false;
        
        // 🛡️ 許可拒否の場合は保存した許可も削除し、二度と要求しない
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            localStorage.removeItem('microphonePermissionGranted');
            localStorage.setItem('microphonePermissionDenied', 'true'); // 拒否状態を記録
            window.showMessage('error', 'マイクの使用許可が拒否されました。ブラウザの設定で許可し、ページを再読み込みしてください。');
        } else {
            window.showMessage('error', 'マイクの初期化に失敗しました。ページを再読み込みしてください。');
        }
        
        return false;
    }
}

// 🔧 新関数: SpeechRecognitionの安定した初期化
// 🗑️ 旧システム削除: initializeSpeechRecognition関数は新システムに置き換え済み

// 🗑️ 旧システム削除: handleRealtimeSpeechResult関数は新システムに置き換え済み

// 🗑️ 旧システム削除: handleImprovedSpeechError関数は新システムに置き換え済み

// 🗑️ 旧システム削除: scheduleRecognitionRestart関数の残り部分は新システムに置き換え済み

// 🗑️ 旧システム削除: handleImprovedSpeechEnd関数は新システムに置き換え済み

// 🗑️ 旧システム削除: handleSpeechStart関数は新システムに置き換え済み

// 🔧 統合版: 音声認識開始関数（新旧システム統合）
function safeStartSpeechRecognition(reason = 'unknown') {
    
    // 🛡️ 統合システムを使用
    if (window.stateManager && window.stateManager.recognitionManager) {
        return window.stateManager.startRecognition();
    }
    
    console.error('❌ 統合音声システムが未初期化です');
    return false;
}

// 🔧 新関数: 音声認識を安全に停止
function safeStopSpeechRecognition(reason = 'unknown') {
    console.log(`🛑 音声認識停止: ${reason}`);
    
    const stability = AppState.voiceRecognitionStability;
    
    if (!AppState.speechRecognition || !stability.isRecognitionActive) {
        return true;
    }
    
    try {
        AppState.speechRecognition.abort();
        stability.isRecognitionActive = false;
        return true;
        
    } catch (error) {
        console.error('😨 音声認識停止エラー:', error);
        stability.isRecognitionActive = false; // 強制リセット
        return false;
    }
}

function restartSpeechRecognition() {
    
    // AI発言終了後に音声認識を確実に再開する関数
    const stability = AppState.voiceRecognitionStability;
    
    // 🔧 新システムの許可状態も確認
    const newSystemPermission = window.stateManager?.permissionManager?.state === 'granted';
    const legacyPermission = stability.micPermissionGranted;
    
    if (!legacyPermission && !newSystemPermission) {
        console.log('📵 マイク許可未取得のため再開をスキップ');
        return;
    }
    
    if (newSystemPermission && !legacyPermission) {
        stability.micPermissionGranted = true;
    }
    
    // 🔧 重要: マイク許可保持を優先した戦略別再開処理
    if (window.stateManager && window.stateManager.recognitionManager) {
        const recognitionManager = window.stateManager.recognitionManager;
        const currentState = recognitionManager.state;
        const strategy = window.CURRENT_MICROPHONE_STRATEGY;
        
        
        // 🔄 継続的音声認識戦略: 結果処理再開のみ
        if (strategy === MICROPHONE_STRATEGY.CONTINUOUS) {
            
            if (recognitionManager.resumeProcessing) {
                recognitionManager.resumeProcessing('AI応答終了');
            } else {
                console.warn('⚠️ 継続的音声認識Manager未対応 - フォールバック');
                // フォールバックとして通常の開始処理
                recognitionManager.start();
            }
            return;
        }
        
        // 🔧 その他の戦略: 軽量リスタート優先（マイク許可保持）
        if (recognitionManager.microphonePermissionManager?.canPerformLightweightRestart) {
            
            // 現在の状態に応じて処理
            if (currentState === 'active') {
                // 軽量リスタート実行
                recognitionManager.performLightweightRestart();
            } else if (currentState === 'idle') {
                // 直接開始（軽量クリーンアップ適用）
                recognitionManager.start();
            } else {
                // 停止完了を待機してから軽量リスタート
                setTimeout(() => {
                    if (recognitionManager.state === 'idle') {
                        recognitionManager.start();
                    }
                }, 300); // 短時間待機
            }
            return;
        }
        
        // 🔧 フォールバック: 従来の処理（完全クリーンアップ）
        console.log('⚠️ 軽量リスタート不可 - 従来処理で再開');
        
        if (currentState !== 'idle') {
            console.log('🛑 現在の音声認識を停止中...');
            window.stateManager.stopRecognition();
            
            // 停止完了を待機してから再開
            setTimeout(() => {
                if (stability.micPermissionGranted) {
                    safeStartSpeechRecognition('restartSpeechRecognition');
                } else {
                    console.log('🚫 再開時の許可チェックでNG - スキップ');
                }
            }, 800); // 停止時間を800msに延長
        } else {
            // 既にidleの場合は即座に再開
            setTimeout(() => {
                console.log('✨ 音声認識即座再開');
                if (stability.micPermissionGranted) {
                    safeStartSpeechRecognition('restartSpeechRecognition');
                } else {
                    console.log('🚫 再開時の許可チェックでNG - スキップ');
                }
            }, 200);
        }
    } else {
        // 統合システムが利用できない場合のフォールバック
        console.warn('⚠️ 統合システム未初期化 - レガシー再開処理');
        setTimeout(() => {
            if (stability.micPermissionGranted) {
                safeStartSpeechRecognition('restartSpeechRecognition');
            } else {
                console.log('🚫 再開時の許可チェックでNG - スキップ');
            }
        }, 500);
    }
}

function updateTranscriptDisplay() {
    const transcriptDisplay = window.UIManager.DOMUtils.get('transcriptDisplay');
    if (transcriptDisplay) {
        if (AppState.currentTranscript) {
            // リアルタイム文字起こし（確定済み + 入力中）を表示
            transcriptDisplay.textContent = AppState.currentTranscript;
        } else if (AppState.transcriptHistory.length > 0) {
            // 確定済みの文字起こしのみを表示
            const allText = AppState.transcriptHistory.join(' ');
            transcriptDisplay.textContent = allText;
        } else {
            // 現在の状態に応じたメッセージを表示
            if (AppState.currentSpeaker !== SPEAKERS.NULL) {
                transcriptDisplay.textContent = 'AI応答中...音声認識は一時停止中です';
            } else if (AppState.sessionActive) {
                transcriptDisplay.textContent = '音声認識待機中...（「どうぞ」と言うとAIが応答します）';
            } else {
                transcriptDisplay.textContent = 'セッション未開始';
            }
        }
    }
}

async function processFinalTranscript(text) {
    if (AppState.currentSpeaker !== SPEAKERS.NULL) {
        return;
    }

    // 🔧 Phase B: 音声認識訂正機能（「どうぞ」は除外）
    // 特別なコマンド（どうぞ、テーマ変更等）を先に処理
    if (text.includes('どうぞ') || text.includes('ドウゾ') || text.includes('どーぞ') ||
        text.includes('テーマ変更') || text.includes('テーマを変え') ||
        text.includes('質問変更') || text.includes('質問を変え') || text.includes('別の質問') ||
        text.includes('終了して') || text.includes('おわりして') || text.includes('セッション終了')) {
        // 特別コマンドは訂正処理をスキップして従来処理へ
        console.log('🎯 特別コマンド検出、訂正処理をスキップ:', text);
    } else {
        // 通常の音声訂正機能
        const correctionCommand = SpeechCorrectionSystem.detectCorrectionCommand(text);
        
        if (correctionCommand.type === 'deletion' || correctionCommand.type === 'replacement') {
            console.log('🔧 音声訂正コマンド検出:', correctionCommand);
            
            // 現在の入力を設定（累積された文字起こし）
            const currentInput = AppState.transcriptHistory.join(' ');
            SpeechCorrectionSystem.setCurrentInput(currentInput);
            
            // 訂正コマンドを実行
            const result = await SpeechCorrectionSystem.executeCorrectionCommand(correctionCommand);
            
            if (result.success) {
                // 訂正結果を反映
                const correctedText = SpeechCorrectionSystem.getCurrentInput();
                AppState.transcriptHistory = correctedText ? [correctedText] : [];
                AppState.currentTranscript = correctedText || '';
                window.updateTranscriptDisplay();
                
                // 成功時の音声フィードバック
                await provideCorrectionFeedback(result.feedback);
                return;
            } else {
                // 失敗時のフィードバック
                await provideCorrectionFeedback(result.message);
                return;
            }
        }
    }

    // 従来の文字削除コマンド（下位互換性のため維持）
    if (text.includes('文字消して') || text.includes('もじけして') || text.includes('クリアして')) {
        AppState.transcriptHistory = [];
        AppState.currentTranscript = '';
        SpeechCorrectionSystem.setCurrentInput('');
        window.updateTranscriptDisplay();
        await provideCorrectionFeedback('文字を削除しました');
        return;
    }

    if (text.includes('テーマ変更') || text.includes('テーマを変え')) {
        await handleThemeChange();
        return;
    }

    if (text.includes('質問変更') || text.includes('質問を変え') || text.includes('別の質問')) {
        await handleQuestionChange();
        return;
    }

    if (text.includes('終了して') || text.includes('おわりして') || text.includes('セッション終了')) {
        await handleSessionEnd();
        return;
    }

    const hasPermission = text.includes('どうぞ') || text.includes('ドウゾ') || text.includes('どーぞ');
    
    if (hasPermission) {
        AppState.waitingForPermission = false;
        const fullText = AppState.transcriptHistory.join(' ');
        // 🔧 Phase B: 現在の入力を訂正システムに設定
        SpeechCorrectionSystem.setCurrentInput(fullText);
        await handleUserTextInput(fullText);
    } else if (!AppState.waitingForPermission) {
        const fullText = AppState.transcriptHistory.join(' ');
        // 🔧 Phase B: 現在の入力を訂正システムに設定
        SpeechCorrectionSystem.setCurrentInput(fullText);
        await handleUserTextInput(fullText);
    } else {
        console.log('「どうぞ」を待機中 - 文字起こし蓄積:', text);
        console.log('現在の累積文字起こし:', AppState.transcriptHistory.join(' '));
    }
}

// 🔧 Phase B: 音声訂正フィードバック
async function provideCorrectionFeedback(message) {
    console.log('🔧 音声訂正フィードバック:', message);
    
    try {
        // はほりーのによる簡潔なフィードバック
        const audioBlob = await ttsTextToAudioBlob(message, SPEAKERS.HAHORI);
        await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
        
        // 画面にもメッセージ表示
        window.showMessage('info', message);
        
    } catch (error) {
        console.error('❌ 音声訂正フィードバックエラー:', error);
        window.showMessage('info', message);
    }
}

async function handleUserTextInput(text) {
    if (!text || AppState.currentSpeaker !== SPEAKERS.NULL) return;

    await addMessageToChat(SPEAKERS.USER, text);
    
    // 会話欄に反映後、文字起こし欄をクリア
    AppState.transcriptHistory = [];
    AppState.currentTranscript = '';
    window.updateTranscriptDisplay();
    
    try {
        // 🎤 知見確認モード優先: 音声ベース知見評価の応答処理
        if (AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
            await processKnowledgeConfirmation(text);
            return;
        }
        
        switch (AppState.phase) {
            case 'warmup':
                await processWarmupUserResponse(text);
                break;
            case 'deepdive':
                await processDeepdiveUserResponse(text);
                break;
            case 'summary':
                await processSummaryUserResponse(text);
                break;
            case 'knowledge_confirmation':
                await processKnowledgeConfirmation(text);
                break;
        }
    } catch (error) {
        window.showMessage('error', `応答処理でエラーが発生しました: ${error.message}`);
    }
}

async function processWarmupUserResponse(text) {
    const confirmation = `ありがとうございます。それでは「${AppState.currentTheme}」について深く掘り下げていきましょう。ねほりーのから質問させていただきます。`;
    
    const [, audioBlob] = await Promise.all([
        addMessageToChat(SPEAKERS.HAHORI, confirmation),
        ttsTextToAudioBlob(confirmation, SPEAKERS.HAHORI)
    ]);
    
    await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);

    // フェーズ遷移はPhaseManagerに委譲
    if (window.PhaseManager) {
        await window.PhaseManager.transitionToPhase('deepdive', { theme: AppState.currentTheme });
    } else {
        AppState.phase = 'deepdive';
    }
    AppState.waitingForPermission = true;
    await startDeepdivePhase();
}

async function startDeepdivePhase() {
    updateSessionStatus('深掘り中', AppState.currentTheme);
    
    try {
        if (!window.AI_PROMPTS || !window.AI_PROMPTS.DEEPDIVE_FIRST) {
            console.error('❌ AI_PROMPTS.DEEPDIVE_FIRST が読み込まれていません');
            window.showMessage('error', 'プロンプト設定の読み込みに失敗しました。ページを再読み込みしてください。');
            return;
        }
        
        const prompt = window.AI_PROMPTS.DEEPDIVE_FIRST(
            AppState.currentTheme,
            AppState.selectedThemeDetails,
            AppState.themeSummaries
        );

        const firstQuestion = await gptMessagesToCharacterResponse([
            { role: 'user', content: prompt }
        ], SPEAKERS.NEHORI);
        
        await addMessageToChat(SPEAKERS.NEHORI, firstQuestion);
        const audio = await ttsTextToAudioBlob(firstQuestion, SPEAKERS.NEHORI);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
        
        AppState.waitingForPermission = true;
        
    } catch (error) {
        window.showMessage('error', `深掘りフェーズでエラーが発生しました: ${error.message}`);
    }
}

async function processDeepdiveUserResponse(text) {
    try {
        if (text.length > 50) {
            // 🎯 新機能: 音声ベース知見評価システムを使用
            const conversationContext = AppState.conversationHistory.slice(-3)
                .map(msg => `${msg.speaker}: ${msg.content}`)
                .join('\n');
            
            const voiceResult = await VoiceKnowledgeSystem.processKnowledgeWithVoiceEvaluation(text, conversationContext);
            
            // voiceResultがnullの場合は手動確認待機中（音声応答待ち）
            if (voiceResult === null) {
                // 左ペインの音声コマンド表示を更新
                updateVoiceCommandsDisplay();
                // 右ペインの統計表示を更新
                updateKnowledgeSettingsDisplay();
                // 🚫 重要: 知見確認待機中はねほりーのの次の質問を生成しない
                AppState.waitingForPermission = true;
                return;
            }
            
            if (voiceResult.accepted) {
                // ✅ 知見が承認された場合（自動または手動）
                const summary = voiceResult.summary || voiceResult.evaluation?.summary || text.substring(0, 50) + '...';
                
                // 🔄 従来システムとの互換性: extractedKnowledgeに追加
                AppState.extractedKnowledge.push({
                    content: text,
                    summary: summary,
                    timestamp: new Date(),
                    point: AppState.currentPoint,
                    // 🆕 新機能: 品質評価データを追加
                    quality_evaluation: voiceResult.evaluation,
                    acceptance_reason: voiceResult.reason,
                    score: Math.round(voiceResult.evaluation.overall * 100)
                });
                
                // 🔄 新機能: 知見ファイル管理システムと連携
                if (window.KnowledgeState.currentSession) {
                    KnowledgeFileManager.addInsight(
                        text,
                        {
                            situation: conversationContext,
                            related_conversation: AppState.conversationHistory.slice(-2)
                        },
                        voiceResult.evaluation
                    );
                }
                
                window.updateKnowledgeDisplay();
                updateKnowledgeSettingsDisplay();
                
                // 次の質問へ
                await askNextQuestionInDeepDive();
                
            } else {
                // ❌ 知見が却下された場合
                const reason = voiceResult?.reason || 'unknown_error';
                const details = voiceResult?.details || '';
                
                console.log(`❌ 知見却下: ${reason}${details ? ' - ' + details : ''}`);
                
                // エラーの種類に応じた処理
                if (reason === 'prerequisites_not_met') {
                    window.showMessage('warning', `知見評価の前提条件エラー: ${details}`);
                } else if (reason === 'process_error') {
                    window.showMessage('error', `知見評価処理エラー: ${details}`);
                } else if (reason === 'manual_fallback_error') {
                    window.showMessage('error', '知見評価システムが利用できません。後でもう一度お試しください。');
                } else if (reason === 'manual_rejection') {
                    window.showMessage('info', '知見は保存されませんでした。');
                } else {
                    console.log(`❌ 知見却下: ${reason}`);
                }
                
                updateKnowledgeSettingsDisplay();
                
                // 次の質問へ
                await askNextQuestionInDeepDive();
            }
            
            AppState.waitingForPermission = true;
            
        } else {
            // 短い回答の場合：はほりーの発声なし、ねほりーの即座生成・発声
            if (VoiceOptimization.phase3.isActive) {
                await generateAndPlayNehoriImmediately();
            } else {
                // フォールバック: 従来の処理
                const prompt = window.AI_PROMPTS.DEEPDIVE_FOLLOWUP ? 
                    window.AI_PROMPTS.DEEPDIVE_FOLLOWUP(text, '') :
                    `回答「${text}」について、さらに深く掘り下げる質問をしてください。具体的なエピソード、感情、学び、背景などをより詳細に引き出してください。`;

                const followUp = await gptMessagesToCharacterResponse([
                    { role: 'user', content: prompt }
                ], SPEAKERS.NEHORI);

                await addMessageToChat(SPEAKERS.NEHORI, followUp);
                const audio = await ttsTextToAudioBlob(followUp, SPEAKERS.NEHORI);
                await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
            }
            
            AppState.waitingForPermission = true;
        }
        
    } catch (error) {
        window.showMessage('error', `深掘り応答処理でエラーが発生しました: ${error.message}`);
    }
}

async function askNextQuestionInDeepDive() {
    if (AppState.justPlayedPendingNehori) {
        return;
    }
    const isConfirmation = AppState.voiceRecognitionState.isKnowledgeConfirmationMode;
    try {
        const recentConversation = AppState.conversationHistory
            .slice(-6)
            .map(msg => `${msg.sender}: ${msg.content}`)
            .join('\n');
        const knowledgeContext = AppState.extractedKnowledge
            .map((knowledge, index) => `知見${index + 1}: ${knowledge.summary}`)
            .join('\n');
        if (!window.AI_PROMPTS || !window.AI_PROMPTS.DEEPDIVE_NEXT) {
            console.error('❌ AI_PROMPTS.DEEPDIVE_NEXT が読み込まれていません');
            window.showMessage('error', 'プロンプト設定の読み込みに失敗しました。ページを再読み込みしてください。');
            return;
        }
        const nextQuestionPrompt = window.AI_PROMPTS.DEEPDIVE_NEXT(
            AppState.currentTheme,
            recentConversation,
            knowledgeContext,
            AppState.selectedThemeDetails,
            AppState.themeSummaries
        );
        const nextQuestion = await gptMessagesToCharacterResponse([
            { role: 'user', content: nextQuestionPrompt }
        ], SPEAKERS.NEHORI);
        const audio = await ttsTextToAudioBlob(nextQuestion, SPEAKERS.NEHORI);
        if (isConfirmation) {
            AppState.pendingNehoriQuestion = nextQuestion;
            AppState.pendingNehoriAudio = audio;
            return;
        }
        await addMessageToChat(SPEAKERS.NEHORI, nextQuestion);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
    } catch (error) {
        window.showMessage('error', `次の質問生成でエラーが発生しました: ${error.message}`);
    }
}

async function processSummaryUserResponse(text) {
    // まとめフェーズの処理
    console.log('まとめフェーズの応答:', text);
}

async function processKnowledgeConfirmation(text) {
    
    if (!AppState.voiceRecognitionState.pendingKnowledgeEvaluation) {
        console.warn('⚠️ 保留中の知見評価がありません');
        return;
    }
    
    const evaluation = AppState.voiceRecognitionState.pendingKnowledgeEvaluation;
    const userInput = text.toLowerCase().trim();
    
    // 閾値変更コマンドの確認
    if (await handleThresholdChangeCommand(userInput)) {
        return;
    }
    
    // 設定確認コマンドの確認
    if (handleSettingsInquiry(userInput)) {
        return;
    }
    
    // 詳細説明要求の確認
    if (VoicePatterns.DETAIL_PATTERNS.some(pattern => userInput.includes(pattern))) {
        await handleDetailedExplanation(evaluation);
        return;
    }
    
    // 承認パターンの確認
    if (VoicePatterns.APPROVAL_PATTERNS.some(pattern => userInput.includes(pattern))) {
        await handleKnowledgeApproval(evaluation);
        return;
    }
    
    // 拒否パターンの確認
    if (VoicePatterns.REJECTION_PATTERNS.some(pattern => userInput.includes(pattern))) {
        await handleKnowledgeRejection();
        return;
    }
    
    // 認識できない場合
    await handleUnrecognizedResponse();
}

// =================================================================================
// SESSION MANAGEMENT - セッション管理
// =================================================================================

// 🔧 セッション開始処理は app/session-start-manager.js に移動しました
// 後方互換性は window.startSession で保証

// 🔧 ウォームアップフェーズ開始処理は app/session-start-manager.js に移動しました
// 後方互換性は window.startWarmupPhase で保証





// =================================================================================
// UI MANAGEMENT - UI管理
// =================================================================================





async function addMessageToChat(speaker, message) {
    // 🚫 知見確認モード中はねほりーののメッセージ表示を絶対に行わない
    if (speaker === SPEAKERS.NEHORI && AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
        return;
    }
    const messagesContainer = window.UIManager.DOMUtils.get('messagesContainer');
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${speaker}`;
        
        const speakerName = {
            [SPEAKERS.NEHORI]: 'ねほりーの',
            [SPEAKERS.HAHORI]: 'はほりーの',
            [SPEAKERS.USER]: 'あなた'
        }[speaker];
        
        messageDiv.innerHTML = `
            <div class="message-header">${speakerName}</div>
            <div class="message-content">${message}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 会話履歴に追加
        AppState.conversationHistory.push({
            sender: speaker,
            content: message,
            timestamp: new Date()
        });
        
    }
    // メッセージ追加後にAI応答中表示を制御
    if (speaker === SPEAKERS.NEHORI || speaker === SPEAKERS.HAHORI) {
        setTimeout(() => {
            AppState.currentSpeaker = SPEAKERS.NULL;
            window.updateTranscriptDisplay();
        }, 100);
    }
}

// 🔧 Phase B: 音声制御管理システム
const AudioControlManager = {
    // 現在再生中の音声を追跡
    activeAudioSources: new Set(),
    
    // 音声登録
    registerAudio(audioElement, source, speaker) {
        const audioData = {
            audio: audioElement,
            source: source,
            speaker: speaker,
            startTime: Date.now(),
            id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.activeAudioSources.add(audioData);
        
        // 音声終了時の自動削除
        audioElement.addEventListener('ended', () => {
            this.unregisterAudio(audioData);
        });
        
        audioElement.addEventListener('error', () => {
            this.unregisterAudio(audioData);
        });
        
        return audioData.id;
    },
    
    // 音声登録解除
    unregisterAudio(audioData) {
        this.activeAudioSources.delete(audioData);
    },
    
    // 全音声強制停止
    forceStopAllAudio(reason = 'user_request') {
        
        let stoppedCount = 0;
        this.activeAudioSources.forEach(audioData => {
            try {
                audioData.audio.pause();
                audioData.audio.currentTime = 0;
                URL.revokeObjectURL(audioData.audio.src);
                stoppedCount++;
                console.log(`🔇 停止: ${audioData.speaker} (再生時間: ${Date.now() - audioData.startTime}ms)`);
            } catch (error) {
                console.warn(`⚠️ 音声停止エラー (${audioData.speaker}):`, error);
            }
        });
        
        this.activeAudioSources.clear();
        AppState.currentSpeaker = SPEAKERS.NULL;
        
        
        // ユーザー向けメッセージ
        if (stoppedCount > 0 && reason === 'user_request') {
            window.showMessage('info', `${stoppedCount}件の音声再生を停止しました`);
        }
        
        return stoppedCount;
    },
    
    // 特定話者の音声停止
    stopSpeakerAudio(speaker, reason = 'speaker_control') {
        let stoppedCount = 0;
        const audioToStop = Array.from(this.activeAudioSources).filter(audioData => audioData.speaker === speaker);
        
        audioToStop.forEach(audioData => {
            try {
                audioData.audio.pause();
                audioData.audio.currentTime = 0;
                URL.revokeObjectURL(audioData.audio.src);
                this.activeAudioSources.delete(audioData);
                stoppedCount++;
                console.log(`🔇 ${speaker}音声停止: ${audioData.id}`);
            } catch (error) {
                console.warn(`⚠️ ${speaker}音声停止エラー:`, error);
            }
        });
        
        if (AppState.currentSpeaker === speaker) {
            AppState.currentSpeaker = SPEAKERS.NULL;
        }
        
        return stoppedCount;
    },
    
    // アクティブな音声情報取得
    getActiveAudioInfo() {
        return Array.from(this.activeAudioSources).map(audioData => ({
            speaker: audioData.speaker,
            source: audioData.source,
            duration: Date.now() - audioData.startTime,
            id: audioData.id
        }));
    }
};

async function playPreGeneratedAudio(audioBlob, speaker) {
    // 🚫 知見確認モード中はねほりーのの音声再生を絶対に行わない
    if (speaker === SPEAKERS.NEHORI && AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
        return;
    }
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(audioBlob);
        
        // 🔧 Phase B: 音声管理システムに登録
        const audioId = AudioControlManager.registerAudio(audio, 'tts_generated', speaker);
        
        // 音量設定を適用
        const voiceSettings = getVoiceSettings(speaker);
        audio.volume = voiceSettings.volume;
        
        AppState.currentSpeaker = speaker;
        
        // Phase 3: はほりーの発声開始時にねほりーの生成を開始
        if (speaker === SPEAKERS.HAHORI && VoiceOptimization.phase3.isActive) {
            VoiceOptimization.phase3.hahoriSpeechStartTime = Date.now();
            startNehoriGenerationDuringHahori();
        }
        
        audio.onended = async () => {
            AppState.currentSpeaker = SPEAKERS.NULL;
            URL.revokeObjectURL(audio.src);
            
            // Phase 3: はほりーの発声終了後、ねほりーのを即座に再生
            if (speaker === SPEAKERS.HAHORI && VoiceOptimization.phase3.shouldPlayNehoriImmediately) {
                await handleNehoriImmediatePlayback();
            }
            
            // AI発言終了後、音声認識を確実に再開
            restartSpeechRecognition();
            
            resolve();
        };
        
        audio.onerror = (error) => {
            AppState.currentSpeaker = SPEAKERS.NULL;
            URL.revokeObjectURL(audio.src);
            reject(error);
        };
        
        audio.play().catch(reject);
    });
}

// =================================================================================
// VOICE OPTIMIZATION PHASE 3 - 音声最適化 Phase 3
// =================================================================================

// 🔧 改善版: ゲートキーパー対応のねほりーの質問生成
// 🔧 ねほりー関数群: startNehoriGenerationDuringHahori は app/voice-phase2-manager.js に分離済み
// 完全後方互換性のため、既存参照は window.startNehoriGenerationDuringHahori で維持

// 🔧 改善版: ゲートキーパー対応のねほりーの即座再生
// 🔧 ねほりー関数群: 以下の関数は app/voice-phase2-manager.js に分離済み
// - handleNehoriImmediatePlayback
// - generateAndPlayNehoriImmediately  
// - playPendingNehoriIfNeeded
// 完全後方互換性のため、既存参照は window.* で維持

// 🔧 はほりー関数群: 以下の関数は app/voice-phase2-manager.js に分離済み
// - startHahoriGenerationDuringNehori
// - handleHahoriImmediatePlayback
// - playPendingHahoriIfNeeded
// 完全後方互換性のため、既存参照は window.* で維持

// =================================================================================
// DATA EXPORT - データエクスポート
// =================================================================================

function downloadMarkdownReport() {
    
    try {
        const markdown = generateMarkdownReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `深堀セッション_${timestamp}.md`;
        
        downloadTextFile(markdown, filename);
        
        window.showMessage('success', 'レポートをダウンロードしました');
        
    } catch (error) {
        console.error('❌ レポートダウンロードエラー:', error);
        window.showMessage('error', 'レポートダウンロードに失敗しました');
    }
}

// =================================================================================
// KNOWLEDGE PERSISTENCE SYSTEM - 知見永続化システム
// =================================================================================

// 🧬 全知見永続化データベース管理 - knowledge-management.jsに移動

// 🧬 全知見ダウンロード機能 - knowledge-management.jsに移動

// AI整理による全知見の拡張処理 - knowledge-management.jsに移動
// 全知見アーカイブファイル内容構築 - knowledge-management.jsに移動

// 🔄 互換性のためのラッパー関数（exportAllData → downloadAllKnowledge）
async function exportAllData() {
    await downloadAllKnowledge();
}

function generateMarkdownReport() {
    let markdown = `# 深堀セッション レポート\n\n`;
    markdown += `**テーマ:** ${AppState.currentTheme}\n`;
    markdown += `**開始時刻:** ${AppState.sessionStartTime ? AppState.sessionStartTime.toLocaleString('ja-JP') : '不明'}\n`;
    markdown += `**生成時刻:** ${new Date().toLocaleString('ja-JP')}\n\n`;
    
    if (AppState.conversationHistory.length > 0) {
        markdown += `## 会話履歴\n\n`;
        AppState.conversationHistory.forEach((msg, index) => {
            const senderName = {
                [SPEAKERS.NEHORI]: 'ねほりーの',
                [SPEAKERS.HAHORI]: 'はほりーの',
                [SPEAKERS.USER]: 'あなた'
            }[msg.sender];
            
            markdown += `### ${index + 1}. ${senderName}\n`;
            markdown += `${msg.content}\n\n`;
        });
    }
    
    if (AppState.extractedKnowledge.length > 0) {
        markdown += `## 抽出された知見\n\n`;
        AppState.extractedKnowledge.forEach((knowledge, index) => {
            markdown += `### 知見 ${index + 1}\n`;
            markdown += `**要約:** ${knowledge.summary}\n\n`;
            markdown += `**詳細:**\n${knowledge.content}\n\n`;
            if (knowledge.timestamp) {
                markdown += `**記録時刻:** ${knowledge.timestamp.toLocaleString('ja-JP')}\n\n`;
            }
            markdown += `---\n\n`;
        });
    }
    
    return markdown;
}

// downloadTextFile関数はapp/utils.jsに移動しました

// =================================================================================
// CRYPTO UTILITIES - 暗号化ユーティリティ
// =================================================================================

// LocalStorage操作関数はapp/storage-manager.jsに移動済み

// 🔧 2ステップ状態評価は app/session-start-manager.js に移動しました
// 後方互換性は window.evaluate2StepStatus で保証

// 🔧 2ステップUI更新機能は app/session-start-manager.js に移動しました
// 後方互換性は window.update2StepUI で保証

// 🔧 フォーカス制御関数は app/session-start-manager.js に移動しました
// 後方互換性は window.focusPasswordInput、window.focusThemeInput で保証

// 🔧 ログイン状態クリア処理は app/session-start-manager.js に移動しました
// 後方互換性は window.handleLogout で保証

// 🔧 テーマクリア処理は app/session-start-manager.js に移動しました
// 後方互換性は window.handleThemeClear で保証

// 🔧 セッション開始ボタンの状態更新は app/session-start-manager.js に移動しました
// 後方互換性は window.updateSessionStartButton で保証

// 🔄 アプリケーション状態復元機能
async function restoreApplicationState() {
    try {
        
        // 1. ログイン状態の復元
        const isLoggedIn = loadLoginState();
        if (isLoggedIn) {
            // 保存されたAPIキーがあるかチェック
            const savedHashes = getPasswordHashList();
            if (savedHashes.length > 0) {
                // APIキーは既に暗号化されているので、ここでは状態のみ設定
                // 注意: AppState.apiKeyは実際のパスワード入力時に設定される
            } else {
                // 保存されたAPIキーがない場合はログイン状態をクリア
                clearLoginState();
            }
        }
        
        // 2. テーマ入力状態の復元
        const savedTheme = loadThemeInputState();
        if (savedTheme) {
            const themeInput = window.UIManager.DOMUtils.get('themeInput');
            if (themeInput) {
                themeInput.value = savedTheme;
            }
        }
        
        // 3. 音声ベース知見評価設定の復元
        loadKnowledgeSettings();
        updateKnowledgeSettingsDisplay();
        
        // 4. 2ステップUIの初期更新
        update2StepUI();
        
        // 5. ファイル入力の初期状態設定
        setTimeout(() => {
            updateFileInputDisplay();
        }, 100);
        
        
    } catch (error) {
        console.error('❌ 状態復元エラー:', error);
        // エラーが発生した場合は状態をクリア
        clearLoginState();
        clearThemeInputState();
        update2StepUI();
    }
}

// =================================================================================
// API KEY MANAGEMENT - APIキー管理
// =================================================================================

async function setupApiKey() {
    
    const elements = window.UIManager.DOMUtils.getAll(['apiKeyInput', 'apiPasswordInput', 'testApiButton', 'startButton']);
    
    if (!elements.apiKeyInput || !elements.apiPasswordInput) {
        window.showMessage('error', '入力欄が見つかりません');
        return;
    }
    
    const apiKey = elements.apiKeyInput.value.trim();
    const password = elements.apiPasswordInput.value.trim();
    
    if (!password) {
        window.showMessage('error', 'パスワードを入力してください');
        return;
    }
    
    if (apiKey && !apiKey.startsWith('sk-')) {
        window.showMessage('error', '正しいOpenAI APIキーを入力してください (sk-...で始まる)');
        return;
    }
    
    try {
        if (apiKey) {
            
            if (hasApiKeyForPassword(password)) {
                const overwrite = confirm(`このパスワードには既にAPIキーが保存されています。\n上書きしますか？`);
                if (!overwrite) {
                    window.showMessage('info', 'APIキーの設定をキャンセルしました');
                    return;
                }
            }
            
            window.showMessage('info', 'APIキー接続テスト中...');
            
            AppState.apiKey = apiKey;
            const isValid = await testApiConnection();
            
            if (isValid) {
                saveEncryptedApiKey(apiKey, password);
                window.showMessage('success', '✅ APIキー接続テスト成功！暗号化保存されました');
                elements.apiKeyInput.value = '';
                
                updateApiKeyStatusDisplay();
                
                if (elements.startButton) {
                    elements.startButton.disabled = false;
                }
            } else {
                AppState.apiKey = null;
                window.showMessage('error', '❌ APIキーが無効です。正しいキーを入力してください');
                
                if (elements.startButton) {
                    elements.startButton.disabled = true;
                }
                return;
            }
        } else {
            window.showMessage('info', '保存済みAPIキーの接続テスト中...');
            
            const decryptedKey = loadEncryptedApiKey(password);
            AppState.apiKey = decryptedKey;
            
            const isValid = await testApiConnection();
            
            if (isValid) {
                window.showMessage('success', '✅ 保存されたAPIキーを読み込みました（接続確認済み）');
                
                if (elements.startButton) {
                    elements.startButton.disabled = false;
                }
            } else {
                AppState.apiKey = null;
                window.showMessage('error', '❌ 保存されたAPIキーが無効です。新しいキーを設定してください');
                
                clearSavedApiKey(password);
                console.log('🗑️ 無効なAPIキーを削除しました');
                
                if (elements.startButton) {
                    elements.startButton.disabled = true;
                }
                return;
            }
        }
        
        elements.apiPasswordInput.value = '';
        
        if (elements.testApiButton) {
            elements.testApiButton.disabled = false;
        }
        
        
    } catch (error) {
        AppState.apiKey = null;
        
        if (elements.startButton) {
            elements.startButton.disabled = true;
        }
        
        console.error('❌ APIキー設定エラー:', error);
        window.showMessage('error', 'APIキー設定に失敗しました');
    }
}

async function testApiConnection() {
    
    if (!AppState.apiKey) {
        return false;
    }
    
    try {
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5
            })
        });
        
        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            console.error('❌ API接続テスト失敗:', errorData);
            return false;
        }
    } catch (error) {
        console.error('❌ API接続テストエラー:', error);
        return false;
    }
}

async function testApiKey() {
    
    if (!AppState.apiKey) {
        window.showMessage('error', 'APIキーが設定されていません');
        return;
    }
    
    window.showMessage('info', 'API接続テスト中...');
    const isValid = await testApiConnection();
    
    if (isValid) {
        window.showMessage('success', 'API接続テスト成功！キーは有効です');
        
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.disabled = false;
        }
    } else {
        window.showMessage('error', 'API接続失敗：キーが無効です');
        
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.disabled = true;
        }
    }
}


function clearSavedApiKey(password = null) {
    if (password) {
        const passwordHash = window.hashPassword(password);
        const keyId = `fukabori_encrypted_key_${passwordHash}`;
        const timestampId = `fukabori_key_timestamp_${passwordHash}`;
        
        localStorage.removeItem(keyId);
        localStorage.removeItem(timestampId);
        
        console.log(`🗑️ APIキーを削除しました (パスワードID: ${passwordHash})`);
    }
}

/**
 * APIキー削除機能（UIボタン用）
 */
function clearApiKey() {
    try {
        
        const passwordInput = document.getElementById('apiPasswordInput');
        if (!passwordInput) {
            window.showMessage('error', 'パスワード入力フィールドが見つかりません');
            return;
        }
        
        const password = passwordInput.value.trim();
        if (!password) {
            window.showMessage('error', 'パスワードを入力してからAPIキーを削除してください');
            return;
        }
        
        // 該当するAPIキーが存在するかチェック
        if (!hasApiKeyForPassword(password)) {
            window.showMessage('error', 'そのパスワードに対応するAPIキーは見つかりませんでした');
            return;
        }
        
        // 確認ダイアログ
        if (confirm('保存されたAPIキーを削除しますか？\nこの操作は取り消せません。')) {
            // APIキーを削除
            clearSavedApiKey(password);
            
            // パスワードハッシュリストからも削除
            const passwordHash = window.hashPassword(password);
            const hashList = getPasswordHashList();
            const updatedList = hashList.filter(hash => hash !== passwordHash);
            localStorage.setItem('fukabori_password_hashes', JSON.stringify(updatedList));
            
            // 入力フィールドをクリア
            passwordInput.value = '';
            
            // 現在ログインしているAPIキーが削除された場合の処理
            if (AppState.apiKey && loadEncryptedApiKey(password) === AppState.apiKey) {
                AppState.apiKey = '';
                AppState.sessionActive = false;
                // ログイン状態をクリア
                clearLoginState();
            }
            
            // Step0の表示状態を更新
            if (typeof updateStep0Visibility === 'function') {
                updateStep0Visibility();
            }
            
            // UI更新
            updateApiKeyStatusDisplay();
            update2StepUI();
            
            window.showMessage('success', 'APIキーを削除しました');
        }
        
    } catch (error) {
        console.error('❌ APIキー削除エラー:', error);
        window.showMessage('error', 'APIキーの削除に失敗しました: ' + error.message);
    }
}

/**
 * パスワード変更機能
 */
function changePassword() {
    try {
        
        const passwordInput = document.getElementById('apiPasswordInput');
        if (!passwordInput) {
            window.showMessage('error', 'パスワード入力フィールドが見つかりません');
            return;
        }
        
        const currentPassword = passwordInput.value.trim();
        if (!currentPassword) {
            window.showMessage('error', '現在のパスワードを入力してください');
            return;
        }
        
        // 現在のパスワードでAPIキーが存在するかチェック
        if (!hasApiKeyForPassword(currentPassword)) {
            window.showMessage('error', '現在のパスワードに対応するAPIキーが見つかりません');
            return;
        }
        
        // 現在のAPIキーを読み込み
        const currentApiKey = loadEncryptedApiKey(currentPassword);
        if (!currentApiKey) {
            window.showMessage('error', '現在のパスワードでAPIキーを復号できませんでした');
            return;
        }
        
        // 新しいパスワードの入力
        const newPassword = prompt('新しいパスワードを入力してください:');
        if (!newPassword) {
            return; // キャンセルされた
        }
        
        if (newPassword.length < 4) {
            window.showMessage('error', 'パスワードは4文字以上で入力してください');
            return;
        }
        
        // パスワード確認
        const confirmPassword = prompt('新しいパスワードを再入力してください:');
        if (newPassword !== confirmPassword) {
            window.showMessage('error', 'パスワードが一致しません');
            return;
        }
        
        // 新しいパスワードで既にAPIキーが存在するかチェック
        if (hasApiKeyForPassword(newPassword)) {
            window.showMessage('error', 'そのパスワードは既に使用されています');
            return;
        }
        
        // 古いAPIキーを削除
        clearSavedApiKey(currentPassword);
        
        // 古いパスワードハッシュをリストから削除
        const oldPasswordHash = window.hashPassword(currentPassword);
        const hashList = getPasswordHashList();
        const filteredList = hashList.filter(hash => hash !== oldPasswordHash);
        
        // 新しいパスワードで保存
        saveEncryptedApiKey(currentApiKey, newPassword);
        
        // パスワード入力フィールドを新しいパスワードに更新
        passwordInput.value = newPassword;
        
        // UI更新
        updateApiKeyStatusDisplay();
        
        window.showMessage('success', 'パスワードを変更しました');
        
    } catch (error) {
        console.error('❌ パスワード変更エラー:', error);
        window.showMessage('error', 'パスワードの変更に失敗しました: ' + error.message);
    }
}

// =================================================================================
// ADDITIONAL FUNCTIONS - 追加機能
// =================================================================================

function handleModalBackgroundClick(event) {
    if (event.target === event.currentTarget) {
        closeAdvancedSettings();
    }
}

function toggleMicrophone() {
    
    if (!stateManager) {
        console.error('❌ StateManagerが未初期化');
        return;
    }
    
    const state = stateManager.getState();
    
    if (state.recognition === 'active') {
        stateManager.stopRecognition();
    } else {
        stateManager.startRecognition();
    }
}

function startRealtimeRecognition() {
    
    if (!stateManager) {
        console.error('❌ StateManagerが未初期化');
        return;
    }
    
    stateManager.startRecognition();
}

function stopRealtimeRecognition() {
    
    if (!stateManager) {
        console.error('❌ StateManagerが未初期化');
        return;
    }
    
    stateManager.stopRecognition();
}


function forceStopAllActivity() {
    
    // 音声認識停止
    if (AppState.speechRecognition) {
        try {
            AppState.speechRecognition.stop();
        } catch (error) {
            console.log('音声認識停止エラー:', error);
        }
    }
    
    // 🔧 Phase B: 音声再生強制停止
    const stoppedAudioCount = AudioControlManager.forceStopAllAudio('force_stop_activity');
    
    AppState.currentSpeaker = SPEAKERS.NULL;
    AppState.microphoneActive = false;
    
    window.updateMicrophoneButton();
    window.showMessage('info', `全ての活動を強制停止しました（音声${stoppedAudioCount}件停止）`);
    
    // 少し待ってから音声認識を再開（許可状態をチェックしてから）
    setTimeout(() => {
        const permissionDenied = localStorage.getItem('microphonePermissionDenied') === 'true';
        if (!permissionDenied && AppState.voiceRecognitionStability.micPermissionGranted) {
            restartSpeechRecognition();
        } else {
            console.log('🚫 強制停止後の再開条件未満 - スキップ');
        }
    }, 2000);
}

// =================================================================================
// SESSION MANAGEMENT - セッション管理システム
// =================================================================================

// 🔧 セッション終了システムは app/session-manager.js に移動しました
// 以下の関数群は新モジュールに統合されています:
// - generateFinalSummary()     → SessionEndManager.generateFinalSummary()
// - generateFinalGreeting()    → SessionEndManager.generateFinalGreeting()
// - handleSessionEnd()         → SessionEndManager.handleSessionEndCommand()
// - endConversationSession()   → SessionEndManager.endSession()
// - returnToLogin()            → SessionEndManager.returnToLogin()

// 後方互換性は window.endConversationSession 等のラッパー関数で保証



// =================================================================================
// MISSING FUNCTIONS - 不足していた関数
// =================================================================================

async function testCharacterVoice(character) {
    
    if (!AppState.apiKey) {
        window.showMessage('error', 'まずAPIキーを設定してください');
        return;
    }

    try {
        
        let testMessage;
        if (window.AI_PROMPTS && window.AI_PROMPTS.TEST_MESSAGES) {
            testMessage = window.AI_PROMPTS.TEST_MESSAGES[character];
        } else {
            testMessage = character === SPEAKERS.NEHORI ? 
                'こんにちは！ねほりーのです。今の音声設定はいかがでしょうか？' :
                'はほりーのと申します。この音声設定で進行させていただきます。';
        }
        
        console.log('テストメッセージ:', testMessage);
        
        const audioBlob = await ttsTextToAudioBlob(testMessage, character);
        await playPreGeneratedAudio(audioBlob, character);
        
        window.showMessage('success', `${character}の音声テストが完了しました`);
    } catch (error) {
        console.error('音声テストエラー:', error);
        window.showMessage('error', `音声テストに失敗しました: ${error.message}`);
    }
}

function changeTheme(newTheme) {
    
    if (newTheme && newTheme !== currentTheme) {
        currentTheme = newTheme;
        
        // テーマ適用
        document.body.className = `theme-${newTheme}`;
        
        // テーマ設定を保存
        localStorage.setItem('fukabori_theme', newTheme);
        
        window.showMessage('success', `テーマを「${newTheme}」に変更しました`);
    }
}

async function handleThemeChange() {
    const themeChangeMessage = `テーマの変更をご希望ですね。新しいテーマを教えてください。「新しいテーマは○○です、どうぞ」とおっしゃってください。`;
    
    const [, audioBlob] = await Promise.all([
        addMessageToChat(SPEAKERS.HAHORI, themeChangeMessage),
        ttsTextToAudioBlob(themeChangeMessage, SPEAKERS.HAHORI)
    ]);
    
    await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
    AppState.waitingForPermission = true;
}

async function handleQuestionChange() {
    const questionChangeMessage = `質問を変更いたします。新しい角度から質問させていただきますね。`;
    
    const [, audioBlob] = await Promise.all([
        addMessageToChat(SPEAKERS.HAHORI, questionChangeMessage),
        ttsTextToAudioBlob(questionChangeMessage, SPEAKERS.HAHORI)
    ]);
    
    await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
    await askNextQuestion();
}

async function askNextQuestion() {
    
    if (window.AI_PROMPTS && window.AI_PROMPTS.DEEPDIVE_NEXT) {
        const conversationContext = AppState.conversationHistory.map(msg => msg.content).join(' ');
        const knowledgeContext = AppState.extractedKnowledge.map(k => k.summary).join(' ');
        
        const prompt = window.AI_PROMPTS.DEEPDIVE_NEXT(
            AppState.currentTheme,
            conversationContext,
            knowledgeContext,
            AppState.selectedThemeDetails,
            AppState.themeSummaries
        );
        
        const question = await gptMessagesToCharacterResponse([
            { role: 'user', content: prompt }
        ], SPEAKERS.NEHORI);
        
        await addMessageToChat(SPEAKERS.NEHORI, question);
        const audio = await ttsTextToAudioBlob(question, SPEAKERS.NEHORI);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
    }
}

function loadSavedTheme() {
    const savedTheme = window.StorageManager.theme.loadSaved();
    if (savedTheme) {
        currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;
    }
}

// =================================================================================
// FILE HANDLING FUNCTIONS - ファイル処理機能
// =================================================================================

// 🛡️ ファイル選択前のログインチェック
// =============================
// 5678行目 - 7218行目
// ファイル処理関連の全関数は
// app/file-processing.jsに移動しました
// =============================

// =================================================================================
// GLOBAL FUNCTIONS - グローバル関数公開
// =================================================================================

// HTMLから呼び出される関数をグローバルに公開
window.loginWithPassword = loginWithPassword;
window.openAdvancedSettings = openAdvancedSettings;
window.closeAdvancedSettings = closeAdvancedSettings;
window.setupApiKey = setupApiKey;
window.testApiKey = testApiKey;
window.handleModalBackgroundClick = handleModalBackgroundClick;
window.startSession = startSession;
window.toggleMicrophone = toggleMicrophone;
window.forceStopAllActivity = forceStopAllActivity;
window.endConversationSession = endConversationSession;
window.downloadMarkdownReport = downloadMarkdownReport;
window.downloadKnowledgeFile = downloadKnowledgeFile;
window.downloadAllKnowledge = downloadAllKnowledge;
window.FukaboriKnowledgeDatabase = FukaboriKnowledgeDatabase;
window.exportAllData = exportAllData;
window.returnToLogin = returnToLogin;
window.testCharacterVoice = testCharacterVoice;
window.changeTheme = changeTheme;

// セッション終了関数を公開
window.handleSessionEnd = handleSessionEnd;

// 🔧 Phase B: 音声制御機能を公開
window.AudioControlManager = AudioControlManager;
window.stopAllAudio = () => AudioControlManager.forceStopAllAudio('user_request');
window.stopSpeakerAudio = (speaker) => AudioControlManager.stopSpeakerAudio(speaker, 'user_request');
window.getActiveAudioInfo = () => AudioControlManager.getActiveAudioInfo();

// 🎨 Phase B: スマート音声操作パネル管理システム
const SmartVoicePanelManager = {
    isExpanded: false,
    
    // 折りたたみ/展開切り替え
    toggle() {
        this.isExpanded = !this.isExpanded;
        this.updateDisplay();
    },
    
    // 表示更新
    updateDisplay() {
        const compactPanel = document.getElementById('smartVoiceCompact');
        const expandedPanel = document.getElementById('smartVoiceExpanded');
        const toggleIcon = document.getElementById('smartVoiceToggle');
        
        if (this.isExpanded) {
            // 展開表示
            if (compactPanel) compactPanel.classList.add('hidden');
            if (expandedPanel) expandedPanel.classList.remove('hidden');
            if (toggleIcon) toggleIcon.textContent = '[▲]';
        } else {
            // 簡易表示
            if (compactPanel) compactPanel.classList.remove('hidden');
            if (expandedPanel) expandedPanel.classList.add('hidden');
            if (toggleIcon) toggleIcon.textContent = '[▼]';
        }
        
    },
    
    // 利用可能コマンドの動的更新
    updateAvailableCommands(commands) {
        const availableCommandsElement = document.getElementById('availableCommands');
        if (availableCommandsElement) {
            const commandText = Array.isArray(commands) ? commands.join('、') : commands;
            availableCommandsElement.textContent = `現在利用可能: ${commandText}`;
        }
    },
    
    // セッション状況に応じたコマンド判定
    getContextualCommands() {
        const commands = [];
        
        // 基本コマンド
        if (AppState.sessionActive) {
            if (AppState.waitingForPermission) {
                commands.push('どうぞ');
            }
            commands.push('終了して');
        }
        
        // 文字訂正コマンド（常に利用可能）
        commands.push('削除');
        commands.push('置換');
        
        // セッション状況に応じて追加
        if (AppState.sessionActive) {
            commands.push('質問変更');
            
            if (AppState.currentTheme) {
                commands.push('テーマ変更');
            }
        }
        
        // 知見確認モードの場合
        if (AppState.voiceRecognitionState?.isKnowledgeConfirmationMode) {
            commands.push('はい/いいえ');
            commands.push('詳しく');
        }
        
        return commands;
    },
    
    // 自動更新
    autoUpdate() {
        const contextualCommands = this.getContextualCommands();
        this.updateAvailableCommands(contextualCommands);
        
        // 知見確認モードの表示制御
        const knowledgeCommands = document.getElementById('knowledgeCommands');
        if (knowledgeCommands) {
            if (AppState.voiceRecognitionState?.isKnowledgeConfirmationMode) {
                knowledgeCommands.classList.remove('hidden');
            } else {
                knowledgeCommands.classList.add('hidden');
            }
        }
    },
    
    // 初期化
    init() {
        this.updateDisplay();
        this.autoUpdate();
        
        // 定期的な自動更新（5秒間隔）
        setInterval(() => {
            this.autoUpdate();
        }, 5000);
        
    }
};

// 🧪 音声コマンドテストモード
async function testVoiceCommands() {
    
    const testCommands = [
        { command: 'どうぞ', description: '発話許可コマンド' },
        { command: '3文字削除', description: '部分削除コマンド' },
        { command: '車内を社内にして', description: '基本置換コマンド' },
        { command: '車内は会社の社内にして', description: '文脈置換コマンド' },
        { command: '削除', description: '全削除コマンド' }
    ];
    
    let testResults = [];
    
    for (const test of testCommands) {
        try {
            if (test.command === 'どうぞ') {
                // 特別コマンドのテスト
                testResults.push({
                    command: test.command,
                    result: '✅ 特別コマンド（従来処理）',
                    description: test.description
                });
            } else {
                // 音声訂正コマンドのテスト
                const result = SpeechCorrectionSystem.detectCorrectionCommand(test.command);
                testResults.push({
                    command: test.command,
                    result: result.type !== 'normal' ? `✅ ${result.type}` : '❌ 認識失敗',
                    description: test.description
                });
            }
        } catch (error) {
            testResults.push({
                command: test.command,
                result: '❌ エラー',
                description: test.description
            });
        }
    }
    
    // テスト結果表示
    const resultMessage = testResults.map(test => 
        `${test.result} ${test.command} (${test.description})`
    ).join('\n');
    
    
    // ユーザーフィードバック
    window.showMessage('info', `音声コマンドテスト完了: ${testResults.length}件中${testResults.filter(t => t.result.includes('✅')).length}件成功`);
    
    // 詳細をコンソールに出力
    console.table(testResults);
}

// 📖 音声コマンドヘルプ表示
function showVoiceCommandHelp() {
    const helpContent = `
📖 **音声コマンド使い方ガイド**

🎯 **基本的な使い方**
1. マイクボタンが青色の時に音声で話しかけてください
2. コマンドは日本語で自然に話してください
3. 「どうぞ」でAIの応答を開始できます

✏️ **文字訂正機能 (NEW!)**
• 全削除: 「削除」「クリア」
• 部分削除: 「3文字削除」「最後の5文字削除」
• 置換: 「AをBにして」
• 文脈置換: 「AはBのCにして」

📝 **実用例**
• 「車内を社内にして」→ 車内が社内に変更
• 「車内は会社の社内にして」→ 文脈を理解して変更
• 「最後の3文字削除」→ 末尾3文字を削除

🎤 **音声認識のコツ**
• ゆっくりはっきりと話す
• 雑音の少ない環境で使用
• マイクに近づきすぎない

🧪 **デバッグ機能**
• ブラウザのコンソール(F12)で詳細確認可能
• window.testCorrectionCommand('テストテキスト')でテスト可能
`;
    
    console.log(helpContent);
    alert(helpContent.replace(/\*\*/g, '').replace(/•/g, '・'));
    
    window.showMessage('info', '音声コマンドヘルプをコンソールに表示しました（F12で確認）');
}

// グローバル関数として公開
window.toggleSmartVoicePanel = () => SmartVoicePanelManager.toggle();
window.testVoiceCommands = testVoiceCommands;
window.showVoiceCommandHelp = showVoiceCommandHelp;
window.SmartVoicePanelManager = SmartVoicePanelManager;

// 🔧 Phase B: 音声認識訂正システム
const SpeechCorrectionSystem = {
    // 削除コマンドパターン
    deletionPatterns: [
        '削除', '消して', '文字消して', 'クリア',
        '間違い', 'やり直し', 'リセット', '文字削除',
        '消去', '文字消去', '全部削除', '全部消して'
    ],
    
    // 部分削除パターン（正規表現）
    partialDeletionPatterns: [
        /最後の(\d+)文字?削除/,
        /最後の(\d+)文字?消して/,
        /(\d+)文字?削除/,
        /(\d+)文字?消して/,
        /「(.+?)」削除/,
        /「(.+?)」消して/,
        /「(.+?)」を削除/,
        /「(.+?)」を消して/
    ],
    
    // 置換パターン
    replacementPatterns: [
        /^(.+?)は(.+?)の(.+?)にして$/,
        /^(.+?)を(.+?)にして$/,
        /^(.+?)は(.+?)にして$/,
        /^(.+?)を(.+?)に変えて$/,
        /^(.+?)を(.+?)に置き換えて$/
    ],
    
    // 現在の入力履歴
    currentInput: '',
    
    // 訂正コマンド検出
    detectCorrectionCommand(text) {
        const cleanText = text.trim();
        
        // 1. 削除コマンドチェック
        const deletionResult = this.checkDeletionCommand(cleanText);
        if (deletionResult) {
            return { type: 'deletion', ...deletionResult };
        }
        
        // 2. 置換コマンドチェック
        const replacementResult = this.checkReplacementCommand(cleanText);
        if (replacementResult) {
            return { type: 'replacement', ...replacementResult };
        }
        
        // 3. 通常の入力として処理
        return { type: 'normal', text: cleanText };
    },
    
    // 削除コマンド検出
    checkDeletionCommand(text) {
        // 完全削除
        if (this.deletionPatterns.some(pattern => text.includes(pattern))) {
            return { action: 'clear_all' };
        }
        
        // 部分削除
        for (const pattern of this.partialDeletionPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[1] && !isNaN(match[1])) {
                    // 数字指定削除
                    return { 
                        action: 'delete_characters', 
                        count: parseInt(match[1])
                    };
                } else if (match[1]) {
                    // 指定文字列削除
                    return { 
                        action: 'delete_string', 
                        target: match[1]
                    };
                }
            }
        }
        
        return null;
    },
    
    // 置換コマンド検出
    checkReplacementCommand(text) {
        for (const pattern of this.replacementPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match.length === 4) {
                    // 「AはBのCにして」パターン
                    return {
                        action: 'replace_text',
                        target: match[1],
                        replacement: match[3],
                        context: match[2]
                    };
                } else if (match.length === 3) {
                    // 「AをBにして」パターン  
                    return {
                        action: 'replace_text',
                        target: match[1],
                        replacement: match[2]
                    };
                }
            }
        }
        
        return null;
    },
    
    // 訂正処理の実行
    async executeCorrectionCommand(command) {
        
        switch (command.action) {
            case 'clear_all':
                return this.clearAllText();
                
            case 'delete_characters':
                return this.deleteLastCharacters(command.count);
                
            case 'delete_string':
                return this.deleteSpecificString(command.target);
                
            case 'replace_text':
                return this.replaceText(command.target, command.replacement, command.context);
                
            default:
                return { success: false, message: '不明な訂正コマンドです' };
        }
    },
    
    // 全文削除
    clearAllText() {
        this.currentInput = '';
        this.updateInputDisplay();
        return { 
            success: true, 
            message: '全ての文字を削除しました',
            feedback: '全て削除しました'
        };
    },
    
    // 最後のN文字削除
    deleteLastCharacters(count) {
        if (count <= 0) return { success: false, message: '削除する文字数が不正です' };
        
        const originalLength = this.currentInput.length;
        const deleteCount = Math.min(count, originalLength);
        
        this.currentInput = this.currentInput.slice(0, -deleteCount);
        this.updateInputDisplay();
        
        return { 
            success: true, 
            message: `最後の${deleteCount}文字を削除しました`,
            feedback: `${deleteCount}文字削除しました`
        };
    },
    
    // 指定文字列削除
    deleteSpecificString(target) {
        if (!this.currentInput.includes(target)) {
            return { 
                success: false, 
                message: `「${target}」が見つかりません`,
                feedback: `「${target}」が見つかりません`
            };
        }
        
        this.currentInput = this.currentInput.replace(target, '');
        this.updateInputDisplay();
        
        return { 
            success: true, 
            message: `「${target}」を削除しました`,
            feedback: `「${target}」を削除しました`
        };
    },
    
    // 文字列置換
    replaceText(target, replacement, context = null) {
        if (!this.currentInput.includes(target)) {
            return { 
                success: false, 
                message: `「${target}」が見つかりません`,
                feedback: `「${target}」が見つかりません`
            };
        }
        
        this.currentInput = this.currentInput.replace(target, replacement);
        this.updateInputDisplay();
        
        const contextMsg = context ? `（${context}の意味で）` : '';
        return { 
            success: true, 
            message: `「${target}」を「${replacement}」に置き換えました${contextMsg}`,
            feedback: `「${target}」を「${replacement}」に変更しました`
        };
    },
    
    // 入力表示更新
    updateInputDisplay() {
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.value = this.currentInput;
        }
        
        // 音声認識結果表示も更新
        const transcriptDisplay = document.getElementById('transcriptDisplay');
        if (transcriptDisplay) {
            transcriptDisplay.textContent = this.currentInput;
        }
    },
    
    // 入力内容設定
    setCurrentInput(text) {
        this.currentInput = text;
        this.updateInputDisplay();
    },
    
    // 入力内容取得
    getCurrentInput() {
        return this.currentInput;
    }
};

// 🔧 Phase B: 音声認識訂正機能を公開
window.SpeechCorrectionSystem = SpeechCorrectionSystem;
window.testCorrectionCommand = (text) => SpeechCorrectionSystem.detectCorrectionCommand(text);
window.executeCorrectionCommand = (command) => SpeechCorrectionSystem.executeCorrectionCommand(command);
window.provideCorrectionFeedback = provideCorrectionFeedback;

// ヘルプガイド切り替え関数
// 🔧 UI最適化Phase1: ヘルプガイド管理機能をapp/ui-advanced.jsに移動
// toggleVoiceGuide

// 🎯 新機能: 音声ベース知見評価関数を公開
window.updateThresholdFromInput = updateThresholdFromInput;

// セッション進行状況を更新する関数

// 音声設定スライダーのイベントリスナーを設定
function initializeVoiceSliders() {
    // ねほりーの設定
    const nehoriSpeed = window.UIManager.DOMUtils.get('nehoriSpeed');
    const nehoriVolume = window.UIManager.DOMUtils.get('nehoriVolume');
    const nehoriSpeedValue = window.UIManager.DOMUtils.get('nehoriSpeedValue');
    const nehoriVolumeValue = window.UIManager.DOMUtils.get('nehoriVolumeValue');
    
    if (nehoriSpeed && nehoriSpeedValue) {
        nehoriSpeed.addEventListener('input', function() {
            nehoriSpeedValue.textContent = this.value;
            console.log(`ねほりーの速度: ${this.value}`);
        });
    }
    
    if (nehoriVolume && nehoriVolumeValue) {
        nehoriVolume.addEventListener('input', function() {
            nehoriVolumeValue.textContent = this.value;
            console.log(`ねほりーの音量: ${this.value}`);
        });
    }
    
    // はほりーの設定
    const hahoriSpeed = window.UIManager.DOMUtils.get('hahoriSpeed');
    const hahoriVolume = window.UIManager.DOMUtils.get('hahoriVolume');
    const hahoriSpeedValue = window.UIManager.DOMUtils.get('hahoriSpeedValue');
    const hahoriVolumeValue = window.UIManager.DOMUtils.get('hahoriVolumeValue');
    
    if (hahoriSpeed && hahoriSpeedValue) {
        hahoriSpeed.addEventListener('input', function() {
            hahoriSpeedValue.textContent = this.value;
            console.log(`はほりーの速度: ${this.value}`);
        });
    }
    
    if (hahoriVolume && hahoriVolumeValue) {
        hahoriVolume.addEventListener('input', function() {
            hahoriVolumeValue.textContent = this.value;
            console.log(`はほりーの音量: ${this.value}`);
        });
    }
    
}

// 現在の音声設定を取得する関数
function getVoiceSettings(speaker) {
    if (speaker === SPEAKERS.NEHORI) {
        const speedElement = window.UIManager.DOMUtils.get('nehoriSpeed');
        const volumeElement = window.UIManager.DOMUtils.get('nehoriVolume');
        const voiceElement = window.UIManager.DOMUtils.get('nehoriVoice');
        
        return {
            voice: voiceElement?.value || VoiceSettings[SPEAKERS.NEHORI].voice || 'sage',
            speed: parseFloat(speedElement?.value || VoiceSettings[SPEAKERS.NEHORI].speed || '1.3'),
            volume: Math.min(parseFloat(volumeElement?.value || VoiceSettings[SPEAKERS.NEHORI].volume || '0.9'), 1.0) // 上限1.0
        };
    } else if (speaker === SPEAKERS.HAHORI) {
        const speedElement = window.UIManager.DOMUtils.get('hahoriSpeed');
        const volumeElement = window.UIManager.DOMUtils.get('hahoriVolume');
        const voiceElement = window.UIManager.DOMUtils.get('hahoriVoice');
        
        return {
            voice: voiceElement?.value || VoiceSettings[SPEAKERS.HAHORI].voice || 'shimmer',
            speed: parseFloat(speedElement?.value || VoiceSettings[SPEAKERS.HAHORI].speed || '1.3'),
            volume: Math.min(parseFloat(volumeElement?.value || VoiceSettings[SPEAKERS.HAHORI].volume || '0.7'), 1.0) // 上限1.0
        };
    }
    
    // デフォルト設定
    return {
        voice: 'sage',
        speed: 1.0,
        volume: 0.8
    };
}

// =================================================================================
// INITIALIZATION - 初期化処理
// =================================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 深堀くんアプリが起動しました');
    
    try {
        // 🔄 新機能: 知見データ管理システムの初期化（最初に実行）
        await initializeKnowledgeManagement();
        
        // 🎤 新システム: StateManager初期化
        if (!initializeVoiceSystem()) {
            console.error('❌ 音声システム初期化失敗');
            window.showMessage('error', '音声システムの初期化に失敗しました。ページを再読み込みしてください。');
            return;
        }
        
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        window.showMessage('error', 'アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }
    
    // 初期化処理
    initializeVoiceSliders();
    loadSavedTheme();
    updateSessionStatus('準備中...', '未設定');
    window.updateKnowledgeDisplay();
    
    // 🎯 新機能: 音声ベース知見評価設定初期化
    loadKnowledgeSettings();
    updateKnowledgeSettingsDisplay();
    
    // 🔄 新機能: 状態復元処理
    await restoreApplicationState();
    
    // パスワード入力のEnterキー対応
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginWithPassword();
            }
        });
    }
    
    // 🔄 新機能: テーマ入力監視
    const themeInput = document.getElementById('themeInput');
    if (themeInput) {
        // テーマ入力の変更監視
        themeInput.addEventListener('input', function() {
            const themeText = themeInput.value.trim();
            saveThemeInputState(themeText);
            update2StepUI();
        });
        
        // Enterキーでセッション開始
        themeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const status = evaluate2StepStatus();
                if (status.allComplete) {
                    startSession();
                } else {
                    if (!status.loginComplete) {
                        focusPasswordInput();
                    }
                }
            }
        });
    }
    
    // Escキーでモーダルを閉じる（ui-advanced.jsから参照）
    if (window.UIAdvanced && window.UIAdvanced.Modal && window.UIAdvanced.Modal.handleEscapeKey) {
        document.addEventListener('keydown', window.UIAdvanced.Modal.handleEscapeKey);
    } else {
        // フォールバック: 基本的なEscapeキーハンドラー
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if (window.closeAdvancedSettings) {
                    window.closeAdvancedSettings();
                }
            }
        });
    }
    
    // 🎯 SessionController初期化
    if (typeof SessionController !== 'undefined') {
        try {
            SessionController.init();
        } catch (error) {
            console.error('❌ SessionController初期化エラー:', error);
        }
    }
    
    // 📊 Phase 2-2: DataManager初期化
    if (typeof window.initializeDataManager === 'function') {
        try {
            await window.initializeDataManager();
        } catch (error) {
            console.error('❌ DataManager初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ DataManager が利用できません');
    }
    
    // 📄 Phase 2-3: FileManager初期化
    if (typeof window.initializeFileManager === 'function') {
        try {
            await window.initializeFileManager();
        } catch (error) {
            console.error('❌ FileManager初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ FileManager が利用できません');
    }
    
    // 🤖 Phase 2-4: AIManager初期化
    if (typeof window.initializeAIManager === 'function') {
        try {
            await window.initializeAIManager();
        } catch (error) {
            console.error('❌ AIManager初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ AIManager が利用できません');
    }
    
    // 🎤 Phase B: スマート音声操作パネルの初期化
    if (typeof SmartVoicePanelManager !== 'undefined') {
        SmartVoicePanelManager.init();
    }
    
});

// =================================================================================
// KNOWLEDGE MANAGEMENT SYSTEM - 知見データ管理システム
// =================================================================================

// 📂 CSV管理システム - knowledge-management.jsに移動
// 🏷️ カテゴリー管理システム - knowledge-management.jsに移動
// 👤 ユーザー名管理システム - knowledge-management.jsに移動

// 📄 知見ファイル管理システム
const KnowledgeFileManager = {
    // 依存関係インターフェース
    interface: null,
    
    // インターフェース初期化
    _ensureInterface() {
        if (!this.interface) {
            this.interface = window.KnowledgeFileManagerInterface;
            if (!this.interface) {
                throw new Error('KnowledgeFileManagerInterface が見つかりません');
            }
        }
        return this.interface;
    },

    // セッション管理機能はSessionControllerに移動されました
    // 後方互換性のための転送メソッド
    async createSessionFile(sessionMeta) {
        console.warn('⚠️ KnowledgeFileManager.createSessionFile は非推奨です。SessionController.createSessionFile を使用してください');
        if (!window.SessionController) {
            throw new Error('SessionController が見つかりません');
        }
        return await window.SessionController.createSessionFile(sessionMeta);
    },

    // 後方互換性のための転送メソッド
    formatTimestamp(date) {
        console.warn('⚠️ KnowledgeFileManager.formatTimestamp は非推奨です。SessionController.formatTimestamp を使用してください');
        if (!window.SessionController) {
            // フォールバック実装
            const yy = String(date.getFullYear()).slice(2);
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            return `${yy}${mm}${dd}-${hh}${min}${ss}`;
        }
        return window.SessionController.formatTimestamp(date);
    },

    // 後方互換性のための転送メソッド
    generateTitleSummary(theme) {
        console.warn('⚠️ KnowledgeFileManager.generateTitleSummary は非推奨です。SessionController.generateTitleSummary を使用してください');
        if (!window.SessionController) {
            // フォールバック実装
            if (!theme) return 'セッション記録';
            let summary = theme.replace(/[「」]/g, '').trim();
            if (summary.length > 20) {
                summary = summary.substring(0, 17) + '...';
            }
            return summary;
        }
        return window.SessionController.generateTitleSummary(theme);
    },

    // 知見の追加（DataManagerに移譲）
    addInsight(insight, context, quality) {
        console.warn('⚠️ KnowledgeFileManager.addInsight は非推奨です。DataManager.addInsight を使用してください');
        
        // DataManagerが利用可能かチェック
        if (window.DataManager && window.DataManager.isInitialized()) {
            try {
                return window.DataManager.addInsight(insight, context, quality);
            } catch (error) {
                console.error('❌ DataManager.addInsight実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（DataManager未使用時）
        const iface = this._ensureInterface();
        
        const currentSession = iface.state.getCurrentSession();
        if (!currentSession) {
            console.warn('⚠️ アクティブなセッションがありません');
            return false;
        }

        const insightEntry = {
            id: `insight_${Date.now()}`,
            content: insight,
            context: context,
            quality_scores: quality,
            timestamp: new Date().toISOString(),
            conversation_context: context.related_conversation || []
        };

        // インターフェース経由で知見を追加
        const success = iface.state.addInsightToSession(insightEntry);
        if (!success) {
            console.error('❌ 知見の追加に失敗しました');
            return false;
        }
        
        
        return true;
    },

    // ファイル生成（FileManagerに移譲）
    async generateKnowledgeFile(sessionData = null) {
        console.warn('⚠️ KnowledgeFileManager.generateKnowledgeFile は非推奨です。FileManager.generateKnowledgeFile を使用してください');
        
        // FileManagerが利用可能かチェック
        if (window.FileManager) {
            try {
                return await window.FileManager.generateKnowledgeFile(sessionData);
            } catch (error) {
                console.error('❌ FileManager.generateKnowledgeFile実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（FileManager未使用時）
        const iface = this._ensureInterface();
        
        const session = sessionData || iface.state.getCurrentSession();
        
        if (!session) {
            console.warn('⚠️ アクティブなセッションがありません');
            return null;
        }

        const content = this.buildFileContent(session);
        
        // ファイル名の生成（Knowledge DNA統合の場合は特別なプレフィックス）
        const timestamp = this.formatTimestamp(new Date());
        const dnaPrefix = session.knowledge_graph ? 'KnowledgeDNA_' : '知見_';
        const filename = `${dnaPrefix}${session.meta.title}_${timestamp}.md`;
        
        // インターフェース経由でファイルダウンロード
        const success = iface.file.downloadFile(content, filename);
        if (!success) {
            console.error('❌ ファイルダウンロードに失敗しました');
            return null;
        }
        
        return filename;
    },

    // ファイル内容の構築（FileManagerに移譲）
    buildFileContent(session) {
        console.warn('⚠️ KnowledgeFileManager.buildFileContent は非推奨です。FileManager.buildFileContent を使用してください');
        
        // FileManagerが利用可能かチェック
        if (window.FileManager) {
            try {
                return window.FileManager.buildFileContent(session);
            } catch (error) {
                console.error('❌ FileManager.buildFileContent実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（FileManager未使用時）
        const meta = session.meta;
        const insights = session.insights;
        
        let content = '---\n';
        content += '# メタデータ\n';
        content += `meta:\n`;
        content += `  session_id: "${meta.session_id}"\n`;
        content += `  date: "${meta.date}"\n`;
        content += `  category: "${meta.category}"\n`;
        content += `  title: "${meta.title}"\n`;
        content += `  participant: "${meta.participant}"\n`;
        content += `  participant_role: "${meta.participant_role}"\n`;
        content += `  theme: "${meta.theme}"\n`;
        content += `  knowledge_dna_version: "1.0"\n`;
        content += '\n';
        
        content += '# セッション概要\n';
        content += `summary:\n`;
        content += `  overview: "${meta.theme}について深掘りセッションを実施"\n`;
        content += `  insights_count: ${insights.length}\n`;
        content += `  enhanced_by_ai: true\n`;
        content += '\n';
        
        content += '# 抽出された知見（生データ）\n';
        content += `raw_insights:\n`;
        
        insights.forEach((insight, index) => {
            content += `  - id: "${insight.id}"\n`;
            content += `    content: "${insight.content}"\n`;
            content += `    timestamp: "${insight.timestamp}"\n`;
            if (insight.quality_scores) {
                content += `    quality_scores:\n`;
                content += `      confidence: ${insight.quality_scores.confidence || 0.5}\n`;
                content += `      importance: ${insight.quality_scores.importance || 0.5}\n`;
            }
            content += '\n';
        });
        
        content += '---\n\n';
        content += `# ${meta.title}\n\n`;
        content += `**参加者**: ${meta.participant}\n`;
        content += `**日時**: ${new Date(meta.date).toLocaleString('ja-JP')}\n`;
        content += `**カテゴリー**: ${meta.category}\n`;
        content += `**テーマ**: ${meta.theme}\n\n`;
        
        // AI整理された知見セクション
        content += '## 🧬 Knowledge DNA - AI整理された知見\n\n';
        content += '> 以下の知見は、深堀くんのKnowledge DNAシステムによって整理・リライトされた内容です。\n\n';

        // 構造化された知見を表示
        insights.forEach((insight, index) => {
            content += `### 📘 知見 ${index + 1}\n\n`;
            
            // AI整理された内容を表示（利用可能な場合）
            if (insight.enhanced_content && insight.dna_enhanced) {
                content += `**📝 AI整理された内容**\n`;
                
                // enhanced_content が JSON文字列の場合は解析を試行
                let enhancedText = insight.enhanced_content;
                if (typeof enhancedText === 'string' && enhancedText.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(enhancedText);
                        if (parsed.enhanced) {
                            enhancedText = parsed.enhanced;
                        }
                    } catch (e) {
                        // JSON解析失敗時はそのまま使用
                        console.warn('Enhanced content JSON解析失敗:', e);
                    }
                }
                
                content += `${enhancedText}\n\n`;
                
                if (insight.summary && insight.summary !== 'AI整理済み') {
                    content += `**📋 要約**\n`;
                    content += `${insight.summary}\n\n`;
                }
                
                if (insight.background && insight.background.trim()) {
                    content += `**🔍 背景・前提**\n`;
                    content += `${insight.background}\n\n`;
                }
                
                if (insight.actionable_points && insight.actionable_points.length > 0) {
                    content += `**💡 実行可能なポイント**\n`;
                    insight.actionable_points.forEach(point => {
                        content += `- ${point}\n`;
                    });
                    content += `\n`;
                }
                
                if (insight.keywords && insight.keywords.length > 0) {
                    content += `**🏷️ キーワード**\n`;
                    content += `${insight.keywords.join(', ')}\n\n`;
                }
                
                if (insight.related_concepts && insight.related_concepts.length > 0) {
                    content += `**🔗 関連概念**\n`;
                    content += `${insight.related_concepts.join(', ')}\n\n`;
                }
                
            } else {
                // 従来の表示形式
                content += `**📝 内容**\n`;
                content += `${insight.content}\n\n`;
                
            if (insight.context) {
                    content += `**🔍 背景・状況**\n`;
                    content += `${insight.context.situation || '詳細な背景情報が記録されています'}\n\n`;
                }
            }
            
            // Knowledge DNA情報
            content += `**🧬 Knowledge DNA**\n`;
            content += `- 🏷️ カテゴリー: ${meta.category}\n`;
            if (insight.categories && insight.categories.length > 0) {
                content += `- 🎯 AI分析カテゴリー: ${insight.categories.join(', ')}\n`;
            }
            content += `- ⭐ 重要度: ${insight.quality_scores?.importance ? Math.round(insight.quality_scores.importance * 100) : 50}%\n`;
            content += `- 🎯 信頼度: ${insight.quality_scores?.confidence ? Math.round(insight.quality_scores.confidence * 100) : 50}%\n`;
            content += `- 🔗 セッションID: ${meta.session_id}\n`;
            content += `- 📅 抽出日時: ${insight.timestamp}\n`;
            content += `- 🤖 AI整理: ${insight.dna_enhanced ? '✅ 完了' : '❌ 未実行'}\n`;
            
            content += `\n---\n\n`;
        });

        // ナレッジグラフ情報（AI分析結果）
        content += '## 🕸️ Knowledge Graph（ナレッジグラフ）\n\n';
        content += '> Knowledge DNAシステムによる知見間の関係性分析\n\n';
        
        // セッション統計
        content += `**📊 セッション統計**\n`;
        content += `- 総知見数: ${insights.length}\n`;
        content += `- 平均重要度: ${this.calculateAverageImportance(insights)}%\n`;
        content += `- AI整理済み: ${insights.filter(i => i.dna_enhanced).length}/${insights.length}\n`;
        content += `- テーマカテゴリー: ${meta.category}\n`;
        content += `- 参加者: ${meta.participant}\n\n`;
        
        // 知見クラスター分析
        if (session.knowledge_graph && session.knowledge_graph.clusters && session.knowledge_graph.clusters.length > 0) {
            content += `**🔗 知見クラスター分析**\n`;
            session.knowledge_graph.clusters.forEach((cluster, index) => {
                content += `${index + 1}. **${cluster.theme}**\n`;
                content += `   - 対象知見: ${cluster.insights.map(i => i + 1).join(', ')}\n`;
                content += `   - 説明: ${cluster.description}\n\n`;
            });
        } else {
            content += `**🔗 知見クラスター分析**\n`;
            if (insights.length < 2) {
                content += `- 単一の知見のため、クラスター分析は実行されませんでした\n\n`;
            } else {
                content += `- 関係性分析中、またはAIによる自動分析が完了していません\n`;
                content += `- 今後のバージョンで高度な知見クラスタリングが利用可能になります\n\n`;
            }
        }
        
        // 知見間関係性
        if (session.knowledge_graph && session.knowledge_graph.relationships && session.knowledge_graph.relationships.length > 0) {
            content += `**🔄 知見間関係性**\n`;
            session.knowledge_graph.relationships.forEach((rel, index) => {
                content += `${index + 1}. 知見${rel.from + 1} → 知見${rel.to + 1} (${rel.type})\n`;
                content += `   - ${rel.description}\n\n`;
            });
        } else {
            content += `**🔄 知見間関係性**\n`;
            if (insights.length < 2) {
                content += `- 単一の知見のため、関係性分析は実行されませんでした\n\n`;
            } else {
                content += `- 現在分析中、または関係性が検出されませんでした\n`;
                content += `- より多くの知見が蓄積されると、知見間の因果関係・補完関係が抽出されます\n\n`;
            }
        }
        
        // 共通テーマ
        if (session.knowledge_graph && session.knowledge_graph.themes && session.knowledge_graph.themes.length > 0) {
            content += `**🎯 共通テーマ分析**\n`;
            session.knowledge_graph.themes.forEach((theme, index) => {
                content += `${index + 1}. **${theme.name}** (出現頻度: ${theme.frequency})\n`;
                content += `   - ${theme.description}\n\n`;
            });
        } else {
            content += `**🎯 共通テーマ分析**\n`;
            // 知見のキーワードから共通テーマを手動生成
            const allKeywords = insights.flatMap(i => i.keywords || []);
            const keywordFreq = {};
            allKeywords.forEach(keyword => {
                keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
            });
            
            const commonKeywords = Object.entries(keywordFreq)
                .filter(([_, freq]) => freq > 1)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            if (commonKeywords.length > 0) {
                content += `- 自動検出された共通テーマ:\n`;
                commonKeywords.forEach(([keyword, freq], index) => {
                    content += `  ${index + 1}. **${keyword}** (出現: ${freq}回)\n`;
                });
                content += `\n`;
            } else {
                content += `- メインテーマ: ${meta.theme}\n`;
                content += `- このセッションの知見は多様性に富んでおり、特定の共通テーマは検出されませんでした\n`;
                content += `- より多くの知見が蓄積されると、詳細なテーマ分析が可能になります\n\n`;
            }
        }
        
        // 知見継承DNA
        content += `**🧬 知見継承DNA**\n`;
        content += `- 知見系統: ${meta.theme} > ${meta.category}\n`;
        content += `- 継承可能性: ${insights.filter(i => i.dna_enhanced).length > 0 ? '高（AI整理済み）' : '中（基本構造化済み）'}\n`;
        content += `- AI学習適用: ${insights.filter(i => i.dna_enhanced).length > 0 ? '✅ 適用済み' : '⏳ 準備中'}\n`;
        content += `- 組織知化レベル: ${insights.length >= 3 ? '高' : insights.length >= 2 ? '中' : '低'}\n`;
        const uniqueKeywords = [...new Set(insights.flatMap(i => i.keywords || []))];
        if (uniqueKeywords.length > 0) {
            content += `- 知見キーワード: ${uniqueKeywords.slice(0, 10).join(', ')}${uniqueKeywords.length > 10 ? '...' : ''}\n`;
        }
        content += `\n`;
        
        return content;
    },

    // 平均重要度計算（FileManagerに移譲）
    calculateAverageImportance(insights) {
        console.warn('⚠️ KnowledgeFileManager.calculateAverageImportance は非推奨です。FileManager.calculateAverageImportance を使用してください');
        
        // FileManagerが利用可能かチェック
        if (window.FileManager) {
            try {
                return window.FileManager.calculateAverageImportance(insights);
            } catch (error) {
                console.error('❌ FileManager.calculateAverageImportance実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（FileManager未使用時）
        if (insights.length === 0) return 0;
        
        const total = insights.reduce((sum, insight) => {
            return sum + (insight.quality_scores?.importance || 0.5);
        }, 0);
        
        return Math.round((total / insights.length) * 100);
    },

    // AI知見整理システム（AIManagerに移譲）
    async enhanceKnowledgeWithAI(session, showProgress = true) {
        console.warn('⚠️ KnowledgeFileManager.enhanceKnowledgeWithAI は非推奨です。AIManager.enhanceKnowledgeWithAI を使用してください');
        
        // AIManagerが利用可能かチェック
        if (window.AIManager && window.AIManager.isInitialized) {
            try {
                return await window.AIManager.enhanceKnowledgeWithAI(session, showProgress);
            } catch (error) {
                console.error('❌ AIManager.enhanceKnowledgeWithAI実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（AIManager未使用時）
        console.warn('⚠️ AIManagerが未初期化のため、基本実装を使用します');
        
        try {
            // APIキーの確認
            if (!window.AppState?.apiKey) {
                console.warn('⚠️ API key not available for knowledge enhancement');
                return session;
            }
            
            
            if (showProgress && window.showMessage) {
                window.showMessage('info', '🧬 Knowledge DNAシステムによる知見整理中...');
            }
            
            // 基本的な知見整理のみ実行
            const enhancedSession = { ...session };
            enhancedSession.insights = session.insights.map(insight => ({
                ...insight,
                enhanced_content: insight.content,
                summary: insight.content.substring(0, 100) + (insight.content.length > 100 ? '...' : ''),
                dna_enhanced: false,
                categories: [],
                keywords: []
            }));
            
            if (showProgress && window.showMessage) {
                window.showMessage('success', '基本的な知見整理が完了しました');
            }
            
            return enhancedSession;
            
        } catch (error) {
            console.error('❌ AI知見整理エラー（フォールバック）:', error);
            if (showProgress && window.showMessage) {
                window.showMessage('warning', 'AI整理でエラーが発生しましたが、基本の知見は保存されます');
            }
            return session;
        }
    }
};

// 🔧 KnowledgeFileManagerをグローバル公開
window.KnowledgeFileManager = KnowledgeFileManager;

// 🎯 知見管理システムの初期化
async function initializeKnowledgeManagement() {
    try {
        
        // CSV データの読み込み
        await CategoryManager.loadCategories();
        await UserManager.loadUsers();
        
        window.KnowledgeState.isInitialized = true;
        
    } catch (error) {
        console.error('❌ 知見管理システム初期化エラー:', error);
        window.KnowledgeState.isInitialized = false;
    }
}

// 🔧 知見セッション初期化処理は app/session-start-manager.js に移動しました
// 後方互換性は window.initializeKnowledgeSession で保証

// 👤 ユーザー識別プロンプト
async function promptUserIdentification() {
    try {
        // 簡易的な入力（後でより良いUIに改良）
        const nickname = prompt('あなたのお名前を教えてください（ニックネームでも結構です）:') || 'ゲスト';
        
        const user = await UserManager.confirmUser(nickname);
        if (user) {
            return user;
        }
        
        // フォールバック
        return {
            nickname: nickname,
            formal_name: nickname,
            role: '参加者',
            department: '未設定'
        };
        
    } catch (error) {
        console.error('❌ ユーザー識別エラー:', error);
        return {
            nickname: 'ゲスト',
            formal_name: 'ゲストユーザー',
            role: '参加者',
            department: '未設定'
        };
    }
}

// 🏷️ カテゴリー選択プロンプト  
async function promptCategorySelection() {
    try {
        const categories = window.KnowledgeState.categories;
        if (categories.length === 0) {
            return 'その他';
        }
        
        // 簡易的な選択（後でより良いUIに改良）
        const categoryNames = categories.map(cat => cat.category_name);
        const options = categoryNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
        
        const selection = prompt(`知見のカテゴリーを選択してください:\n${options}\n\n番号を入力してください (1-${categoryNames.length}):`);
        const index = parseInt(selection) - 1;
        
        if (index >= 0 && index < categoryNames.length) {
            return categoryNames[index];
        }
        
        // デフォルト選択
        return categoryNames[0];
        
    } catch (error) {
        console.error('❌ カテゴリー選択エラー:', error);
        return 'その他';
    }
}

// =================================================================================
// KNOWLEDGE DNA SYSTEM - 知見DNAシステム - knowledge-management.jsに移動
// =================================================================================

// =================================================================================
// QUALITY ASSESSMENT SYSTEM - 品質評価システム - knowledge-management.jsに移動
// =================================================================================

// =================================================================================
// VOICE-BASED KNOWLEDGE EVALUATION SYSTEM - 音声ベース知見評価システム
// =================================================================================

const VoiceKnowledgeSystem = {
    // 🎯 メイン処理: 音声ベース知見評価
    async processKnowledgeWithVoiceEvaluation(insightText, conversationContext) {
        try {
            
            // 1. 前提条件の確認
            const prerequisites = await this._checkEvaluationPrerequisites();
            if (!prerequisites.canProceed) {
                console.warn('⚠️ 知見評価の前提条件が満たされていません:', prerequisites.reason);
                return { accepted: false, reason: 'prerequisites_not_met', details: prerequisites.reason };
            }
            
            // 2. はほりーのによる品質評価（AIManager統一）
            let qualityEvaluation = null;
            
            // AIManagerによる統一評価処理
            if (window.AIManager) {
                try {
                    
                    // 初期化完了を待機（タイムアウト付き）
                    await window.AIManager.waitForInitialization(10000);
                    
                    // 品質評価実行
                    qualityEvaluation = await window.AIManager.evaluateInsightQuality(insightText, conversationContext);
                    
                } catch (error) {
                    console.error('❌ AIManager評価エラー:', error);
                    
                    // エラーの詳細をログに記録
                    if (error.message?.includes('初期化')) {
                        console.warn('⚠️ AIManager初期化エラー - 手動評価に移行');
                    } else if (error.message?.includes('API')) {
                        console.warn('⚠️ API通信エラー - 手動評価に移行');
                    } else {
                        console.warn('⚠️ 予期しないエラー - 手動評価に移行');
                    }
                }
            } else {
                console.warn('⚠️ AIManagerが未定義 - 手動評価に移行');
            }
            
            // AI評価失敗時は手動評価
            if (!qualityEvaluation) {
                return await this._handleManualEvaluationFallback(insightText, conversationContext);
            }
            
            // 統計更新
            AppState.sessionStats.totalKnowledge++;
            this.updateAverageScore(qualityEvaluation.overall);
            
            const totalScore = Math.round(qualityEvaluation.overall * 100);
            const threshold = AppState.knowledgeSettings.autoRecordThreshold;
            
            // 3. 閾値による自動判定
            if (totalScore >= threshold) {
                return await this.handleAutoRecord(qualityEvaluation, insightText, totalScore);
            } else {
                return await this.handleManualConfirmation(qualityEvaluation, insightText, totalScore);
            }
            
        } catch (error) {
            console.error('❌ 音声ベース知見評価エラー:', error);
            return { accepted: false, reason: 'process_error', details: error.message };
        }
    },
    
    // 🤖 自動記録処理
    async handleAutoRecord(evaluation, insightText, totalScore) {
        
        // 統計更新
        AppState.sessionStats.autoRecorded++;
        
        // 音声通知
        if (AppState.knowledgeSettings.showAutoRecordNotice) {
            const message = VoiceTemplates.AUTO_RECORD(evaluation.summary, totalScore);
            await this.speakAsHahori(message);
        }
        
        // 右ペインに詳細表示
        this.updateDetailedEvaluation(evaluation, totalScore, 'auto');
        
        return {
            accepted: true,
            reason: 'auto_accept',
            evaluation: evaluation,
            summary: evaluation.summary
        };
    },
    
    // 🎤 手動確認処理
    async handleManualConfirmation(evaluation, insightText, totalScore) {
        console.log('🤔 中程度品質: 音声確認実施');
        
        // 詳細表示版で確認要求
        await this.speakKnowledgeEvaluation(evaluation, totalScore);
        
        // 右ペインに詳細表示
        this.updateDetailedEvaluation(evaluation, totalScore, 'pending');
        
        // 🔧 改善版: ゲートキーパーシステムで知見確認モード開始
        ConversationGatekeeper.enterKnowledgeConfirmationMode('manualConfirmation');
        
        // 保留中の知見評価を設定
        AppState.voiceRecognitionState.pendingKnowledgeEvaluation = {
            ...evaluation,
            insightText: insightText,
            totalScore: totalScore
        };
        
        // 音声認識の再開を確実に行う
        restartSpeechRecognition();
        
        // この時点では結果を返さず、音声応答を待つ
        return null;
    },
    
    // 🎵 はほりーのの音声発話（知見評価時は詳細表示版）
    async speakAsHahori(message) {
        try {
            await addMessageToChat(SPEAKERS.HAHORI, message);
            const audioBlob = await ttsTextToAudioBlob(message, SPEAKERS.HAHORI);
            await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
        } catch (error) {
            console.error('❌ はほりーの音声発話エラー:', error);
        }
    },
    
    // 🎵 はほりーの知見評価発話（詳細表示版）
    async speakKnowledgeEvaluation(evaluation, totalScore) {
        try {
            // 音声用のシンプルなメッセージ
            const voiceMessage = VoiceTemplates.CONFIRMATION_REQUEST(evaluation.summary, totalScore);
            
            // 会話欄用の詳細表示メッセージ
            const detailedMessage = this.createDetailedEvaluationMessage(evaluation, totalScore);
            
            // 詳細版を会話欄に表示
            await addMessageToChat(SPEAKERS.HAHORI, detailedMessage);
            
            // シンプル版を音声で発話
            const audioBlob = await ttsTextToAudioBlob(voiceMessage, SPEAKERS.HAHORI);
            await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
        } catch (error) {
            console.error('❌ はほりーの知見評価発話エラー:', error);
        }
    },
    
    // 📊 詳細評価メッセージ作成
    createDetailedEvaluationMessage(evaluation, totalScore) {
        const getStars = (score) => {
            const starCount = Math.round(score * 5);
            return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
        };
        
        const confidenceScore = Math.round(evaluation.confidence * 100);
        const importanceScore = Math.round(evaluation.importance * 100);
        const actionabilityScore = Math.round(evaluation.actionability * 100);
        
        return `「${evaluation.summary}」という知見を抽出しました。評価は${totalScore}点です。

📊 詳細評価:
• 信頼性: ${confidenceScore}点 ${getStars(evaluation.confidence)}
• 重要性: ${importanceScore}点 ${getStars(evaluation.importance)}  
• 実行性: ${actionabilityScore}点 ${getStars(evaluation.actionability)}

この知見を記録しますか？「はい」または「いいえ」でお答えください。`;
    },
    
    // 📊 右ペイン詳細評価表示
    updateDetailedEvaluation(evaluation, totalScore, status) {
        if (!AppState.knowledgeSettings.showDetailedEvaluation) return;
        
        // 既存の知見表示を更新（詳細情報付き）
        const extractedKnowledge = window.UIManager.DOMUtils.get('extractedKnowledge');
        if (!extractedKnowledge) return;
        
        const statusIcon = {
            'auto': '✅',
            'pending': '⏳',
            'approved': '👍',
            'rejected': '❌'
        }[status] || '📊';
        
        const evaluationHtml = `
            <div style="padding: 8px 10px; margin-bottom: 6px; background: rgba(255, 255, 255, 0.15); border-radius: 8px; font-size: 11px; border-left: 3px solid #06b6d4;">
                <div style="font-weight: 600; color: #06b6d4; line-height: 1.4; margin-bottom: 4px;">
                    ${statusIcon} ${evaluation.summary}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #999;">
                    <span>信頼性:${Math.round(evaluation.confidence * 100)}%</span>
                    <span>重要性:${Math.round(evaluation.importance * 100)}%</span>
                    <span>実行性:${Math.round(evaluation.actionability * 100)}%</span>
                </div>
                <div style="text-align: center; margin-top: 2px; font-weight: 600; color: ${totalScore >= AppState.knowledgeSettings.autoRecordThreshold ? '#4caf50' : '#ffa500'};">
                    総合: ${totalScore}点
                </div>
            </div>
        `;
        
        if (status === 'pending') {
            // 保留中の場合は一時的に表示
            extractedKnowledge.innerHTML = evaluationHtml + extractedKnowledge.innerHTML;
        }
    },
    
    // 📈 平均スコア更新
    updateAverageScore(newScore) {
        const total = AppState.sessionStats.totalKnowledge;
        const currentAvg = AppState.sessionStats.averageScore;
        AppState.sessionStats.averageScore = ((currentAvg * (total - 1)) + newScore) / total;
    },
    
    // 🔧 知見評価前提条件チェック
    async _checkEvaluationPrerequisites() {
        const issues = [];
        
        // APIキーの確認
        if (!window.AppState?.apiKey) {
            issues.push('APIキーが設定されていません');
        }
        
        // 入力テキストの確認
        if (!window.AppState?.voiceRecognitionState?.pendingKnowledgeEvaluation?.insightText) {
            // 実際の評価実行時に再チェック
        }
        
        // AIManagerの存在確認
        if (!window.AIManager) {
            issues.push('AIManagerが読み込まれていません');
        }
        
        // QualityAssessmentSystemの確認
        if (!window.QualityAssessmentSystem) {
            issues.push('QualityAssessmentSystemが読み込まれていません');
        }
        
        // AI_PROMPTSの確認
        if (!window.AI_PROMPTS) {
            issues.push('AI_PROMPTSが読み込まれていません');
        }
        
        return {
            canProceed: issues.length === 0,
            reason: issues.length > 0 ? issues.join(', ') : null,
            issues: issues
        };
    },
    
    // 🔧 手動評価フォールバック処理（改善版）
    async _handleManualEvaluationFallback(insightText, conversationContext) {
        try {
            
            // はほりーのによる音声説明
            const explanationMessage = `AI評価システムが一時的に利用できません。手動で評価させていただきます。`;
            await this.speakAsHahori(explanationMessage);
            
            // 知見内容の確認
            const knowledgePreview = insightText.length > 100 ? 
                insightText.substring(0, 100) + '...' : insightText;
            
            const confirmationMessage = `「${knowledgePreview}」という知見が抽出されました。この知見を保存しますか？「はい」または「いいえ」でお答えください。`;
            await this.speakAsHahori(confirmationMessage);
            
            // 手動確認モードに入る
            ConversationGatekeeper.enterKnowledgeConfirmationMode('manualFallback');
            
            // 手動評価用の評価データを準備
            const manualEvaluation = {
                confidence: 0.75,
                importance: 0.75,
                actionability: 0.75,
                overall: 0.75,
                summary: knowledgePreview,
                reason: 'AI評価システム利用不可のため手動評価',
                recommendation: 'MANUAL_CONFIRM'
            };
            
            // 保留中の知見評価を設定（音声応答を待つ）
            AppState.voiceRecognitionState.pendingKnowledgeEvaluation = {
                ...manualEvaluation,
                insightText: insightText,
                totalScore: 75, // 中間値として75点
                isManualFallback: true
            };
            
            // 音声認識の再開
            restartSpeechRecognition();
            
            // この時点では結果を返さず、音声応答を待つ
            return null;
            
        } catch (error) {
            console.error('❌ 手動評価フォールバックエラー:', error);
            
            // エラー時の緊急処理
            const errorMessage = `評価処理でエラーが発生しました。知見を保存せずに続行します。`;
            if (window.showMessage) {
                window.showMessage('error', errorMessage);
            }
            
            return {
                accepted: false,
                reason: 'manual_fallback_error',
                evaluation: null,
                summary: 'フォールバック処理でエラー発生'
            };
        }
    },
    
    // 🧪 Phase 4: システム健全性チェック機能
    async performSystemHealthCheck() {
        
        const healthReport = {
            timestamp: new Date().toISOString(),
            aiManager: false,
            apiConnection: false,
            voiceSystem: false,
            overall: false,
            errors: [],
            recommendations: []
        };
        
        try {
            // 1. AIManager健全性チェック
            if (window.AIManager) {
                try {
                    await window.AIManager.waitForInitialization(5000);
                    if (window.AIManager.isInitialized) {
                        healthReport.aiManager = true;
                    } else {
                        healthReport.errors.push('AIManager初期化未完了');
                        healthReport.recommendations.push('ページを再読み込みしてください');
                    }
                } catch (error) {
                    healthReport.errors.push(`AIManager初期化エラー: ${error.message}`);
                    healthReport.recommendations.push('AIManager初期化を手動実行してください');
                }
            } else {
                healthReport.errors.push('AIManagerが未定義');
                healthReport.recommendations.push('AIManagerモジュールの読み込みを確認してください');
            }
            
            // 2. API接続チェック（軽量）
            if (window.AppState?.apiKey) {
                healthReport.apiConnection = true;
            } else {
                healthReport.errors.push('APIキーが未設定');
                healthReport.recommendations.push('APIキーを設定してください');
            }
            
            // 3. 音声認識システムチェック
            if (window.stateManager?.recognitionManager) {
                const voiceState = window.stateManager.recognitionManager.state;
                if (voiceState === 'idle' || voiceState === 'active') {
                    healthReport.voiceSystem = true;
                } else {
                    healthReport.errors.push(`音声認識状態異常: ${voiceState}`);
                    healthReport.recommendations.push('音声認識を再開してください');
                }
            } else {
                healthReport.errors.push('音声認識システムが未初期化');
                healthReport.recommendations.push('音声システムを再初期化してください');
            }
            
            // 4. 総合判定
            healthReport.overall = healthReport.aiManager && healthReport.apiConnection && healthReport.voiceSystem;
            
            console.log('📊 健全性チェック結果:', {
                overall: healthReport.overall ? '✅ 正常' : '❌ 問題あり',
                components: {
                    aiManager: healthReport.aiManager ? '✅' : '❌',
                    apiConnection: healthReport.apiConnection ? '✅' : '❌',  
                    voiceSystem: healthReport.voiceSystem ? '✅' : '❌'
                },
                errors: healthReport.errors.length,
                recommendations: healthReport.recommendations.length
            });
            
            return healthReport;
            
        } catch (error) {
            console.error('❌ 健全性チェックエラー:', error);
            healthReport.errors.push(`健全性チェック実行エラー: ${error.message}`);
            healthReport.recommendations.push('システムを再起動してください');
            return healthReport;
        }
    },
    
    // 🔧 Phase 4: 自動回復処理
    async performAutoRecovery() {
        
        const recoveryReport = {
            timestamp: new Date().toISOString(),
            attempted: [],
            successful: [],
            failed: [],
            overall: false
        };
        
        try {
            // 1. AIManager回復試行
            if (!window.AIManager?.isInitialized) {
                recoveryReport.attempted.push('AIManager初期化');
                try {
                    if (typeof initializeAIManager === 'function') {
                        await initializeAIManager();
                        recoveryReport.successful.push('AIManager初期化成功');
                    } else {
                        recoveryReport.failed.push('initializeAIManager関数が見つからない');
                    }
                } catch (error) {
                    recoveryReport.failed.push(`AIManager初期化失敗: ${error.message}`);
                }
            }
            
            // 2. 音声認識回復試行
            if (!window.stateManager?.recognitionManager || 
                window.stateManager.recognitionManager.state === 'error') {
                recoveryReport.attempted.push('音声認識システム回復');
                try {
                    if (window.stateManager) {
                        await window.stateManager.recognitionManager.stop();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await window.stateManager.startRecognition();
                        recoveryReport.successful.push('音声認識システム回復成功');
                    } else {
                        recoveryReport.failed.push('StateManagerが未初期化');
                    }
                } catch (error) {
                    recoveryReport.failed.push(`音声認識回復失敗: ${error.message}`);
                }
            }
            
            // 3. 回復結果判定
            recoveryReport.overall = recoveryReport.failed.length === 0 && recoveryReport.attempted.length > 0;
            
            console.log('🚑 自動回復結果:', {
                overall: recoveryReport.overall ? '✅ 成功' : (recoveryReport.attempted.length === 0 ? '📝 不要' : '❌ 失敗'),
                attempted: recoveryReport.attempted.length,
                successful: recoveryReport.successful.length,
                failed: recoveryReport.failed.length
            });
            
            return recoveryReport;
            
        } catch (error) {
            console.error('❌ 自動回復エラー:', error);
            recoveryReport.failed.push(`自動回復実行エラー: ${error.message}`);
            return recoveryReport;
        }
    },
    
    // 🧪 Phase 4: 知見評価テスト機能
    async testInsightEvaluation(testInsight = null) {
        
        const testData = testInsight || {
            text: 'これはテスト用の知見です。AIマネージャーの動作確認のために使用されます。',
            context: { phase: 'test', user: 'system' }
        };
        
        const testReport = {
            timestamp: new Date().toISOString(),
            testInput: testData,
            healthCheck: null,
            evaluationResult: null,
            duration: 0,
            success: false,
            errors: []
        };
        
        const startTime = Date.now();
        
        try {
            // 1. 事前健全性チェック
            testReport.healthCheck = await this.performSystemHealthCheck();
            
            if (!testReport.healthCheck.overall) {
                console.log('⚠️ システム健全性に問題があります。自動回復を試行...');
                const recoveryResult = await this.performAutoRecovery();
                
                if (!recoveryResult.overall && recoveryResult.attempted.length > 0) {
                    throw new Error('システム回復に失敗しました');
                }
                
                // 回復後再チェック
                testReport.healthCheck = await this.performSystemHealthCheck();
            }
            
            // 2. 実際の知見評価テスト（非破壊的）
            if (testReport.healthCheck.overall) {
                
                // テスト用に評価のみ実行（実際の保存はしない）
                if (window.AIManager && window.AIManager.isInitialized) {
                    const evaluation = await window.AIManager.evaluateInsightQuality(
                        testData.text, 
                        testData.context
                    );
                    
                    testReport.evaluationResult = evaluation;
                    testReport.success = evaluation !== null && evaluation.overall !== undefined;
                } else {
                    testReport.evaluationResult = 'AIManager利用不可';
                    testReport.success = false;
                }
                
            } else {
                throw new Error('システム健全性チェックに失敗');
            }
            
        } catch (error) {
            console.error('❌ 知見評価テストエラー:', error);
            testReport.errors.push(error.message);
            testReport.success = false;
        } finally {
            testReport.duration = Date.now() - startTime;
        }
        
        console.log('🧪 テスト結果サマリー:', {
            success: testReport.success ? '✅ 成功' : '❌ 失敗',
            duration: `${testReport.duration}ms`,
            healthStatus: testReport.healthCheck?.overall ? '✅ 正常' : '❌ 問題あり',
            evaluationCompleted: testReport.evaluationResult ? '✅ 完了' : '❌ 失敗',
            errors: testReport.errors.length
        });
        
        return testReport;
    }
};

// 🎤 音声コマンドハンドラー関数群
async function handleThresholdChangeCommand(userInput) {
    for (const pattern of VoicePatterns.THRESHOLD_PATTERNS) {
        const match = userInput.match(pattern);
        if (match) {
            const newThreshold = parseInt(match[1]);
            if (newThreshold >= 0 && newThreshold <= 100) {
                AppState.knowledgeSettings.autoRecordThreshold = newThreshold;
                
                // 設定保存
                if (AppState.knowledgeSettings.saveThresholdChanges) {
                    saveKnowledgeSettings();
                }
                
                // 音声確認
                const message = VoiceTemplates.THRESHOLD_CHANGE(newThreshold);
                await VoiceKnowledgeSystem.speakAsHahori(message);
                
                // 右ペイン設定表示更新
                updateKnowledgeSettingsDisplay();
                
                // 知見確認モード終了
                resetKnowledgeConfirmationMode();
                
                return true;
            }
        }
    }
    return false;
}

function handleSettingsInquiry(userInput) {
    if (VoicePatterns.SETTINGS_INQUIRY_PATTERNS.some(pattern => userInput.includes(pattern))) {
        const threshold = AppState.knowledgeSettings.autoRecordThreshold;
        const message = VoiceTemplates.CURRENT_SETTINGS(threshold);
        VoiceKnowledgeSystem.speakAsHahori(message);
        return true;
    }
    
    if (VoicePatterns.DEFAULT_RESET_PATTERNS.some(pattern => userInput.includes(pattern))) {
        AppState.knowledgeSettings.autoRecordThreshold = 70;
        saveKnowledgeSettings();
        const message = VoiceTemplates.THRESHOLD_CHANGE(70);
        VoiceKnowledgeSystem.speakAsHahori(message);
        updateKnowledgeSettingsDisplay();
        resetKnowledgeConfirmationMode();
        return true;
    }
    
    if (VoicePatterns.AUTO_RECORD_OFF_PATTERNS.some(pattern => userInput.includes(pattern))) {
        AppState.knowledgeSettings.autoRecordThreshold = 0;
        saveKnowledgeSettings();
        const message = `承知いたしました。今後は全ての知見を手動確認いたします。`;
        VoiceKnowledgeSystem.speakAsHahori(message);
        updateKnowledgeSettingsDisplay();
        resetKnowledgeConfirmationMode();
        return true;
    }
    
    return false;
}

async function handleDetailedExplanation(evaluation) {
    const message = VoiceTemplates.DETAILED_EXPLANATION(evaluation);
    await VoiceKnowledgeSystem.speakAsHahori(message);
    
    // 詳細説明後、再度確認を求める
    const confirmMessage = `改めてお伺いします。この知見を記録しますか？`;
    await VoiceKnowledgeSystem.speakAsHahori(confirmMessage);
}

async function handleKnowledgeApproval(evaluation) {
    
    // 統計更新
    AppState.sessionStats.manualConfirmed++;
    
    // 知見を記録
    AppState.extractedKnowledge.push({
        summary: evaluation.summary,
        timestamp: new Date(),
        score: evaluation.totalScore,
        evaluation: evaluation,
        method: 'manual_approved'
    });
    
    // 表示更新
    window.updateKnowledgeDisplay();
    VoiceKnowledgeSystem.updateDetailedEvaluation(evaluation, evaluation.totalScore, 'approved');
    
    // 確認モード終了
    resetKnowledgeConfirmationMode();
    
    // 次の質問へ
    await askNextQuestionInDeepDive();
}

async function handleKnowledgeRejection() {
    console.log('❌ ユーザー拒否: 知見記録せず');
    
    // 統計更新
    AppState.sessionStats.rejected++;
    
    // 音声確認
    const message = VoiceTemplates.KNOWLEDGE_REJECTED();
    await VoiceKnowledgeSystem.speakAsHahori(message);
    
    // 確認モード終了
    resetKnowledgeConfirmationMode();
    
    // 次の質問へ
    await askNextQuestionInDeepDive();
}

async function handleUnrecognizedResponse() {
    console.warn('⚠️ 音声認識できず: 再確認');
    
    const message = VoiceTemplates.RECOGNITION_ERROR();
    await VoiceKnowledgeSystem.speakAsHahori(message);
    
    // 🔧 修正: 統合音声認識システムで再開（知見確認モード対応）
    if (window.stateManager?.recognitionManager) {
        // 短時間待機後に再開（はほりーの発話終了を待つ）
        setTimeout(() => {
            window.stateManager.recognitionManager.start();
        }, 1000);
    } else {
        // フォールバック: 旧システムで再開
        restartSpeechRecognition();
    }
}

// 🔧 ユーティリティ関数
// 🔧 改善版: ゲートキーパー対応の知見確認モードリセット
function resetKnowledgeConfirmationMode() {
    
    // ゲートキーパーシステムを通じて安全にモードを終了
    ConversationGatekeeper.exitKnowledgeConfirmationMode('resetFunction');
    
    // レガシー状態もクリア（互換性のため）
    AppState.waitingForPermission = true;
    
}

// 知見設定保存（StorageManager経由）
function saveKnowledgeSettings() {
    try {
        window.StorageManager.knowledge.save(AppState.knowledgeSettings);
    } catch (error) {
        console.error('❌ 知見設定保存エラー:', error);
    }
}

// 知見設定読み込み（StorageManager経由）
function loadKnowledgeSettings() {
    try {
        const settings = window.StorageManager.knowledge.load();
        if (settings) {
            Object.assign(AppState.knowledgeSettings, settings);
        }
    } catch (error) {
        console.error('❌ 知見設定読み込みエラー:', error);
    }
}

// 🎯 右ペイン設定表示更新
function updateKnowledgeSettingsDisplay() {
    const thresholdInput = window.UIManager.DOMUtils.get('thresholdInput');
    const autoRecordCount = window.UIManager.DOMUtils.get('autoRecordCount');
    const manualConfirmCount = window.UIManager.DOMUtils.get('manualConfirmCount');
    const rejectedCount = window.UIManager.DOMUtils.get('rejectedCount');
    
    if (thresholdInput) {
        thresholdInput.value = AppState.knowledgeSettings.autoRecordThreshold;
    }
    
    if (autoRecordCount) {
        autoRecordCount.textContent = AppState.sessionStats.autoRecorded;
    }
    
    if (manualConfirmCount) {
        manualConfirmCount.textContent = AppState.sessionStats.manualConfirmed;
    }
    
    if (rejectedCount) {
        rejectedCount.textContent = AppState.sessionStats.rejected;
    }
    
}

// 🎯 HTML入力による閾値変更
function updateThresholdFromInput() {
    const thresholdInput = window.UIManager.DOMUtils.get('thresholdInput');
    if (!thresholdInput) return;
    
    const newThreshold = parseInt(thresholdInput.value);
    if (newThreshold >= 0 && newThreshold <= 100) {
        AppState.knowledgeSettings.autoRecordThreshold = newThreshold;
        
        if (AppState.knowledgeSettings.saveThresholdChanges) {
            saveKnowledgeSettings();
        }
        
        
        // 音声通知（セッション中のみ）
        if (AppState.sessionActive) {
            const message = VoiceTemplates.THRESHOLD_CHANGE(newThreshold);
            VoiceKnowledgeSystem.speakAsHahori(message);
        }
    } else {
        // 無効な値の場合は元に戻す
        thresholdInput.value = AppState.knowledgeSettings.autoRecordThreshold;
        window.showMessage('error', '閾値は0-100の範囲で入力してください');
    }
}

// 🎯 左ペイン音声コマンド表示制御

    // 📥 知見ファイルダウンロード機能（Knowledge DNA統合）
async function downloadKnowledgeFile() {
    try {
        // 🔧 Phase A修正: 手動保存知見統合チェック
        const sessionInsights = window.KnowledgeState.currentSession ? window.KnowledgeState.currentSession.insights : [];
        const manualInsights = AppState.extractedKnowledge || [];
        
        
        if (sessionInsights.length === 0 && manualInsights.length === 0) {
            window.showMessage('warning', '知見データがありません。セッション中に抽出された知見があるときにダウンロードできます。');
            return;
        }

        window.showMessage('info', '🧬 Knowledge DNAシステムによる知見ファイル生成中...');

        // 🔧 Phase A修正: 手動保存された知見をセッションに統合
        let workingSession;
        if (!window.KnowledgeState.currentSession) {
            // セッションが存在しない場合は手動知見のみで作成
            workingSession = {
                meta: {
                    session_id: `manual_${Date.now()}`,
                    theme: AppState.currentTheme || '手動保存知見',
                    timestamp: new Date().toISOString(),
                    participant: 'ユーザー',
                    category: 'その他'
                },
                insights: []
            };
        } else {
            workingSession = { ...window.KnowledgeState.currentSession };
        }

        // 手動保存知見の統合処理
        const manualInsightsConverted = manualInsights.map((insight, index) => ({
            id: `manual_${index}`,
            content: insight.summary || insight.content || '内容不明',
            timestamp: insight.timestamp || new Date(),
            context: 'manual_approval',
            importance: insight.score || 70,
            source: 'manual_confirmed',
            method: insight.method || 'manual_approved',
            evaluation: insight.evaluation || null,
            // 🔧 手動保存済みフラグを設定（リライト処理は通常通り実行）
            is_manually_approved: true
        }));

        // セッション知見と手動知見の統合
        workingSession.insights = [...workingSession.insights, ...manualInsightsConverted];
        

        // Phase 1: Knowledge DNAによる知見整理（手動保存知見も通常処理を適用）
        const enhancedSession = await KnowledgeFileManager.enhanceKnowledgeWithAI(
            workingSession, 
            true // プログレス表示ON
        );

        // Phase 2: 拡張されたセッションでファイル生成
        window.showMessage('info', '📄 構造化ファイルを生成中...');
        const filename = await KnowledgeFileManager.generateKnowledgeFile(enhancedSession);
        
        if (filename) {
            window.showMessage('success', `🎉 Knowledge DNA統合知見ファイル「${filename}」をダウンロードしました！`);
            
            // 🔧 Phase A修正: 統計情報の改良
            const stats = {
                total_insights: enhancedSession.insights.length,
                session_insights: sessionInsights.length,
                manual_insights: manualInsights.length,
                ai_enhanced: enhancedSession.insights.filter(i => i.dna_enhanced).length,
                manually_approved: enhancedSession.insights.filter(i => i.is_manually_approved).length,
                has_relationships: enhancedSession.knowledge_graph?.relationships?.length > 0,
                has_clusters: enhancedSession.knowledge_graph?.clusters?.length > 0
            };
            
        } else {
            window.showMessage('error', '知見ファイルの生成に失敗しました。');
        }

    } catch (error) {
        console.error('❌ Knowledge DNA知見ファイルダウンロードエラー:', error);
        window.showMessage('error', `知見ファイルのダウンロードでエラーが発生しました: ${error.message}`);
    }
}

// =================================================================================
// SAFETY BACKUP SYSTEM - 既存機能保護システム
// =================================================================================
// 注意: SafetyBackupシステムは独立ファイル config/safety_backup.js に移行済み
// ここでは削除されています

// =================================================================================
// GLOBAL EXPORTS - グローバル関数公開
// =================================================================================

// HTMLから直接呼び出される関数をwindowオブジェクトに公開
window.loginWithPassword = loginWithPassword;
window.openAdvancedSettings = openAdvancedSettings;
window.closeAdvancedSettings = closeAdvancedSettings;
window.setupApiKey = setupApiKey;
window.testApiKey = testApiKey;
window.startSession = startSession;
window.toggleMicrophone = toggleMicrophone;
window.handleUserTextInput = handleUserTextInput;
window.update2StepUI = update2StepUI;
window.handleLogout = handleLogout;
window.handleThemeClear = handleThemeClear;
window.saveVoicePreset = saveVoicePreset;
window.testCharacterVoice = testCharacterVoice;
window.checkLoginBeforeFileSelect = checkLoginBeforeFileSelect;
window.triggerFileInput = triggerFileInput;
window.downloadMarkdownReport = downloadMarkdownReport;
window.exportAllData = exportAllData;
window.handleModalBackgroundClick = handleModalBackgroundClick;
window.closeFileErrorModal = closeFileErrorModal;
window.returnToLoginFromError = returnToLoginFromError;
window.closeThemeSelection = closeThemeSelection;
window.selectAllThemes = selectAllThemes;
window.deselectAllThemes = deselectAllThemes;
window.confirmThemeSelection = confirmThemeSelection;
window.toggleVoiceGuide = toggleVoiceGuide;
window.updateThresholdFromInput = updateThresholdFromInput;
window.downloadKnowledgeFile = downloadKnowledgeFile;
window.downloadAllKnowledge = downloadAllKnowledge;
window.FukaboriKnowledgeDatabase = FukaboriKnowledgeDatabase;

// =================================================================================
// PHASE 1: SPEECH SHORTENING INTEGRATION - 発声短縮統合システム
// =================================================================================

// 🔧 Phase 1: 発声短縮設定管理
const SpeechShorteningManager = {
    // 設定状態
    settings: {
        enabled: false,
        level: 3,
        maxCharacters: 150,
        options: {
            shortenGreetings: true,
            shortenHonorific: true,
            shortenThemes: true,
            removeRedundancy: true
        }
    },

    // 初期化
    init() {
        this.loadSettings();
        
        // UI更新はui-advanced.jsのUIAdvancedに委譲
        if (window.UIAdvanced && window.UIAdvanced.SpeechShorteningUI) {
            window.UIAdvanced.SpeechShorteningUI.updateUI();
        } else {
            console.warn('⚠️ UIAdvanced.SpeechShorteningUIが利用できません - UI更新をスキップ');
        }
        
    },

    // 設定の保存
    saveSettings() {
        try {
            localStorage.setItem('speechShorteningSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('❌ 発声短縮設定の保存に失敗:', error);
        }
    },

    // 設定の読み込み
    loadSettings() {
        try {
            const saved = localStorage.getItem('speechShorteningSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (error) {
            console.error('❌ 発声短縮設定の読み込みに失敗:', error);
            // デフォルト設定を使用
        }
    },

    // UI更新
    // 🔧 UI最適化Phase1: UI関連メソッドをapp/ui-advanced.jsに移動
    // updateUI, toggleEnabled, updateLevel, updateMaxCharacters, resetSettings
    
    // 統合処理: 発声短縮エンジンとの連携
    async processTextWithShortening(originalText, speaker) {
        if (!this.settings.enabled) {
            console.log('🚫 Phase 1: 発声短縮無効のため元テキストを返却');
            return originalText; // 無効時は元のテキストをそのまま返す
        }

        console.log('🔧 Phase 1: 発声短縮処理開始', {
            enabled: this.settings.enabled,
            level: this.settings.level,
            maxCharacters: this.settings.maxCharacters,
            options: this.settings.options
        });

        try {
            // Phase 0で実装した発声短縮エンジンを使用
            if (window.SpeechShorteningEngine) {
                // 🔧 強制設定同期（毎回実行して確実に同期）
                window.SpeechShorteningEngine.enabled = this.settings.enabled;
                window.SpeechShorteningEngine.settings.level = this.settings.level;
                window.SpeechShorteningEngine.settings.maxLength = this.settings.maxCharacters;
                
                // 個別オプションの強制同期
                if (this.settings.options) {
                    const options = this.settings.options;
                    window.SpeechShorteningEngine.settings.features.greetingShortening = options.shortenGreetings !== false;
                    window.SpeechShorteningEngine.settings.features.politeSimplification = options.shortenHonorific !== false;
                    window.SpeechShorteningEngine.settings.features.themeShortening = options.shortenThemes !== false;
                    window.SpeechShorteningEngine.settings.features.redundancyRemoval = options.removeRedundancy !== false;
                    window.SpeechShorteningEngine.settings.features.characterLimit = true;
                }

                console.log('🔄 Phase 1→Phase 0 設定強制同期完了', {
                    engineEnabled: window.SpeechShorteningEngine.enabled,
                    engineLevel: window.SpeechShorteningEngine.settings.level,
                    engineMaxLength: window.SpeechShorteningEngine.settings.maxLength,
                    engineFeatures: window.SpeechShorteningEngine.settings.features
                });

                // Phase 0エンジンの呼び出し（引数を修正）
                const shortenedText = window.SpeechShorteningEngine.shortenText(originalText);

                // ログ出力（常に表示）
                const reductionRate = Math.round((1 - shortenedText.length / originalText.length) * 100);
                console.log(`📝 元文字数: ${originalText.length}文字`);
                console.log(`🔊 短縮後: ${shortenedText.length}文字`);
                console.log(`📉 短縮率: ${reductionRate}%`);

                if (reductionRate === 0) {
                    console.warn('⚠️ 短縮率0% - Phase 0エンジンの設定または短縮ルールを確認してください');
                }

                return shortenedText;
            } else {
                console.log('📝 発声短縮エンジンが利用できません - 内蔵短縮機能を使用');
                return shortenForSpeech(originalText, this.settings.maxCharacters);
            }
        } catch (error) {
            console.error('❌ 発声短縮処理エラー:', error);
            // エラー時は既存の短縮処理を使用（フォールバック）
            return shortenForSpeech(originalText, this.settings.maxCharacters);
        }
    },

    // UI関連メソッド（app/ui-advanced.jsから呼び出し）
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        this.saveSettings();
        
        const status = this.settings.enabled ? '有効' : '無効';
        window.showMessage('success', `発声短縮機能を${status}にしました`);
    },

    updateLevel(level) {
        this.settings.level = parseInt(level);
        this.saveSettings();
    },

    updateMaxCharacters(maxChars) {
        this.settings.maxCharacters = parseInt(maxChars);
        this.saveSettings();
        console.log(`📏 最大文字数: ${this.settings.maxCharacters}`);
    },

    resetSettings() {
        this.settings = {
            enabled: false,
            level: 3,
            maxCharacters: 150,
            options: {
                shortenGreetings: true,
                shortenHonorific: true,
                shortenThemes: true,
                removeRedundancy: true
            }
        };
        this.saveSettings();
        window.showMessage('success', '発声短縮設定をリセットしました');
    }
};

// 🔧 Phase 1: 統合発話処理の改良版
async function addMessageToChatWithSmartShortening(speaker, displayText, speechText = null) {
    console.log('🚀 Phase 1: 統合発話処理開始', { 
        speaker, 
        displayLength: displayText.length,
        customSpeech: !!speechText 
    });

    // チャット表示（長いテキスト）
    await addMessageToChat(speaker, displayText);
    
    try {
        // 音声用テキストの決定
        let textForSpeech;
        
        if (speechText) {
            // カスタム音声テキストが指定されている場合
            textForSpeech = speechText;
            console.log('📝 カスタム音声テキストを使用');
        } else {
            // Phase 1: 発声短縮システムを使用
            textForSpeech = await SpeechShorteningManager.processTextWithShortening(displayText, speaker);
        }
        
        // 短縮統計の表示
        if (displayText.length > textForSpeech.length) {
            const reduction = Math.round((1 - textForSpeech.length / displayText.length) * 100);
        }

        // 音声生成・再生
        const audioBlob = await ttsTextToAudioBlob(textForSpeech, speaker);
        await playPreGeneratedAudio(audioBlob, speaker);
        
        
    } catch (error) {
        console.error('❌ Phase 1: 統合発話処理エラー:', error);
        window.showMessage('error', '音声の生成に失敗しました');
        
        // 緊急フォールバック: 安全システムを使用
        if (window.FukaboriSafetySystem) {
            await window.FukaboriSafetySystem.fallbackTextToSpeech(displayText, speaker);
        }
    }
}

// =================================================================================
// PHASE 1: UI EVENT HANDLERS - UI イベントハンドラー
// =================================================================================

// 🔧 UI最適化Phase1: 発声短縮UI関数をapp/ui-advanced.jsに移動
// toggleSpeechShortening, updateShorteningLevel, updateMaxCharacters, 
// resetShorteningSettings, testSpeechShortening

// =================================================================================
// PHASE 1: INITIALIZATION - Phase 1 初期化
// =================================================================================

// グローバル公開
window.SpeechShorteningManager = SpeechShorteningManager;

// DOMContentLoadedイベントでPhase 1システムを初期化
document.addEventListener('DOMContentLoaded', function() {
    // Phase 1システムの初期化（安全システム初期化後に実行）
    setTimeout(() => {
        if (typeof SpeechShorteningManager !== 'undefined') {
            SpeechShorteningManager.init();
        }
    }, 100);
});


// =================================================================================
// PHASE 1: デバッグ・修復UI機能
// =================================================================================

// 設定同期状況確認
window.checkShorteningSync = function() {
    const debugInfo = document.getElementById('debugInfoContent');
    const debugDisplay = document.getElementById('shorteningDebugInfo');
    
    const info = {
        timestamp: new Date().toLocaleString(),
        phase1: {
            enabled: SpeechShorteningManager.settings.enabled,
            level: SpeechShorteningManager.settings.level,
            maxCharacters: SpeechShorteningManager.settings.maxCharacters,
            options: SpeechShorteningManager.settings.options
        },
        phase0: {
            available: !!window.SpeechShorteningEngine,
            enabled: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.enabled : 'N/A',
            level: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.settings.level : 'N/A',
            maxLength: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.settings.maxLength : 'N/A',
            features: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.settings.features : 'N/A'
        },
        syncStatus: 'チェック中...'
    };
    
    // 同期状況判定
    if (!window.SpeechShorteningEngine) {
        info.syncStatus = '❌ Phase 0エンジンが利用できません';
    } else if (info.phase1.enabled !== info.phase0.enabled) {
        info.syncStatus = '⚠️ 有効状態が不一致';
    } else if (info.phase1.enabled && info.phase0.enabled && info.phase1.level !== info.phase0.level) {
        info.syncStatus = '⚠️ 短縮レベルが不一致';
    } else if (info.phase1.enabled && info.phase0.enabled) {
        info.syncStatus = '✅ 同期済み（短縮が動作しない場合は強制同期を実行）';
    } else {
        info.syncStatus = '🔄 両方とも無効状態';
    }
    
    debugInfo.textContent = JSON.stringify(info, null, 2);
    debugDisplay.style.display = 'block';
    
    window.showMessage('info', '設定同期状況を確認しました。下記のデバッグ情報を確認してください。');
};

// 強制同期修復
window.forceShorteningSync = function() {
    if (!window.SpeechShorteningEngine) {
        window.showMessage('error', 'Phase 0エンジンが利用できません。ページを再読み込みしてください。');
        return;
    }
    
    try {
        // Phase 1の設定をPhase 0に強制同期
        window.SpeechShorteningEngine.enabled = SpeechShorteningManager.settings.enabled;
        window.SpeechShorteningEngine.settings.level = SpeechShorteningManager.settings.level;
        window.SpeechShorteningEngine.settings.maxLength = SpeechShorteningManager.settings.maxCharacters;
        
        // 個別オプションの同期
        if (SpeechShorteningManager.settings.options) {
            const options = SpeechShorteningManager.settings.options;
            window.SpeechShorteningEngine.settings.features.greetingShortening = options.shortenGreetings || true;
            window.SpeechShorteningEngine.settings.features.politeSimplification = options.shortenHonorific || true;
            window.SpeechShorteningEngine.settings.features.themeShortening = options.shortenThemes || true;
            window.SpeechShorteningEngine.settings.features.redundancyRemoval = options.removeRedundancy || true;
            window.SpeechShorteningEngine.settings.features.characterLimit = true;
        }
        
        console.log('Phase 1 enabled:', SpeechShorteningManager.settings.enabled);
        console.log('Phase 0 enabled:', window.SpeechShorteningEngine.enabled);
        console.log('Phase 1 level:', SpeechShorteningManager.settings.level);
        console.log('Phase 0 level:', window.SpeechShorteningEngine.settings.level);
        
        window.showMessage('success', '設定同期修復が完了しました。再度テストを実行してください。');
        
        // 同期後の状況確認
        setTimeout(() => {
            window.checkShorteningSync();
        }, 500);
        
    } catch (error) {
        console.error('❌ 強制同期エラー:', error);
        window.showMessage('error', '同期修復に失敗しました: ' + error.message);
    }
};

// エンジン直接テスト
window.directShorteningTest = function() {
    if (!window.SpeechShorteningEngine) {
        window.showMessage('error', 'Phase 0エンジンが利用できません。');
        return;
    }
    
    const testText = 'こんにちは、私は深堀AIアシスタントのねほりーのです。本日はお忙しい中、貴重なお時間をいただき、誠にありがとうございます。';
    
    try {
        // エンジンを強制有効化してテスト
        const originalEnabled = window.SpeechShorteningEngine.enabled;
        window.SpeechShorteningEngine.enabled = true;
        
        const result = window.SpeechShorteningEngine.shortenText(testText);
        
        // 結果をデバッグ表示に出力
        const debugInfo = document.getElementById('debugInfoContent');
        const debugDisplay = document.getElementById('shorteningDebugInfo');
        
        const testResult = {
            timestamp: new Date().toLocaleString(),
            engineStatus: '✅ Phase 0エンジン直接テスト',
            originalText: testText,
            originalLength: testText.length,
            shortenedText: result,
            shortenedLength: result.length,
            reductionRate: Math.round((1 - result.length / testText.length) * 100) + '%',
            engineEnabled: window.SpeechShorteningEngine.enabled,
            engineLevel: window.SpeechShorteningEngine.settings.level,
            features: window.SpeechShorteningEngine.settings.features
        };
        
        debugInfo.textContent = JSON.stringify(testResult, null, 2);
        debugDisplay.style.display = 'block';
        
        // 元の設定に戻す
        window.SpeechShorteningEngine.enabled = originalEnabled;
        
        if (result === testText) {
            window.showMessage('warning', 'エンジンは動作していますが短縮されませんでした。短縮ルールの設定を確認してください。');
        } else {
            window.showMessage('success', `エンジン直接テスト完了: ${testResult.reductionRate}短縮されました。`);
        }
        
    } catch (error) {
        console.error('❌ 直接テストエラー:', error);
        window.showMessage('error', '直接テストに失敗しました: ' + error.message);
    }
};

// キャッシュクリア
window.clearShorteningCache = function() {
    try {
        // localStorage クリア
        localStorage.removeItem('speechShorteningEnabled');
        localStorage.removeItem('speechShorteningSettings');
        localStorage.removeItem('speechShorteningEmergencyDisabled');
        
        // Phase 1設定をデフォルトにリセット
        SpeechShorteningManager.settings = {
            enabled: false,
            level: 3,
            maxCharacters: 150,
            options: {
                shortenGreetings: true,
                shortenHonorific: true,
                shortenThemes: true,
                removeRedundancy: true
            }
        };
        
        // Phase 0設定をデフォルトにリセット
        if (window.SpeechShorteningEngine) {
            window.SpeechShorteningEngine.enabled = false;
            window.SpeechShorteningEngine.settings.level = 1;
            window.SpeechShorteningEngine.settings.maxLength = 200;
        }
        
        // UI更新
        SpeechShorteningManager.updateUI();
        
        // デバッグ表示をクリア
        const debugDisplay = document.getElementById('shorteningDebugInfo');
        if (debugDisplay) {
            debugDisplay.style.display = 'none';
        }
        
        window.showMessage('success', 'キャッシュをクリアしました。設定をリセットしてから再度有効化してください。');
        
    } catch (error) {
        console.error('❌ キャッシュクリアエラー:', error);
        window.showMessage('error', 'キャッシュクリアに失敗しました: ' + error.message);
    }
};

console.log('🔧 デバッグ・修復UI機能を追加しました');




window.clearApiKey = clearApiKey;
window.changePassword = changePassword;
window.updateSessionStartButton = updateSessionStartButton;
window.update2StepUI = update2StepUI;

// LocalStorage操作関数はapp/storage-manager.jsに移動済み


// =================================================================================
// 新音声システム初期化処理
// =================================================================================

// StateManagerの初期化
function initializeVoiceSystem() {
    
    try {
        // StateManagerクラスが定義されているかチェック
        if (typeof StateManager === 'undefined') {
            console.error('❌ StateManagerクラスが未定義です');
            return false;
        }
        
        // グローバル変数として初期化
        window.stateManager = new StateManager();
        
        return true;
    } catch (error) {
        console.error('❌ 音声システム初期化エラー:', error);
        window.showMessage('error', '音声システムの初期化に失敗しました');
        return false;
    }
}

// 既存の初期化関数を置き換え
function initializeMicrophoneRecording(forceRecheck = false) {
    
    // StateManagerが定義されているかチェック
    if (typeof window.stateManager === 'undefined') {
        console.error('❌ StateManagerが未定義です');
        return Promise.resolve(false);
    }
    
    if (!window.stateManager) {
        console.error('❌ StateManagerが未初期化');
        // 初期化を試行
        if (initializeVoiceSystem()) {
        } else {
            console.error('❌ StateManager初期化失敗');
            return Promise.resolve(false);
        }
    }
    
    return window.stateManager.permissionManager.getPermission();
}

function initializeSpeechRecognition() {
    
    // StateManagerが定義されているかチェック
    if (typeof window.stateManager === 'undefined') {
        console.error('❌ StateManagerが未定義です');
        return Promise.resolve();
    }
    
    if (!window.stateManager) {
        console.error('❌ StateManagerが未初期化');
        return Promise.resolve();
    }
    
    return window.stateManager.startRecognition();
}

// グローバル関数として公開
window.initializeVoiceSystem = initializeVoiceSystem;
window.initializeKnowledgeManagement = initializeKnowledgeManagement;
window.initializeKnowledgeSession = initializeKnowledgeSession;

// 🧪 Phase 4: テスト・検証機能をグローバル公開
window.testInsightEvaluation = () => VoiceKnowledgeSystem.testInsightEvaluation();
window.performSystemHealthCheck = () => VoiceKnowledgeSystem.performSystemHealthCheck();
window.performAutoRecovery = () => VoiceKnowledgeSystem.performAutoRecovery();

// 🛠️ デバッグ用コンソール機能
window.debugInsightEvaluation = async function() {
    
    try {
        // 1. 健全性チェック
        console.log('1. システム健全性チェック');
        const healthReport = await VoiceKnowledgeSystem.performSystemHealthCheck();
        
        // 2. 必要に応じて自動回復
        if (!healthReport.overall) {
            console.log('2. 自動回復試行');
            const recoveryReport = await VoiceKnowledgeSystem.performAutoRecovery();
            console.log('回復結果:', recoveryReport);
        }
        
        // 3. テスト実行
        const testReport = await VoiceKnowledgeSystem.testInsightEvaluation();
        
        // 4. 結果まとめ
        console.log('📊 デバッグ結果まとめ:', {
            健全性チェック: healthReport.overall ? '✅ 正常' : '❌ 問題あり',
            テスト実行: testReport.success ? '✅ 成功' : '❌ 失敗',
            実行時間: `${testReport.duration}ms`,
            エラー数: testReport.errors.length
        });
        
        if (testReport.success) {
            console.log('🎉 知見評価システムは正常に動作しています！');
        } else {
            console.log('⚠️ 知見評価システムに問題があります。詳細を確認してください。');
            console.log('エラー詳細:', testReport.errors);
            if (healthReport.recommendations.length > 0) {
                console.log('推奨対処法:', healthReport.recommendations);
            }
        }
        
        return {
            健全性: healthReport,
            テスト結果: testReport
        };
        
    } catch (error) {
        console.error('❌ デバッグ実行エラー:', error);
        return { error: error.message };
    }
};

// DataManager初期化
async function initializeDataManager() {
    
    try {
        if (window.DataManager) {
            const success = await window.DataManager.initialize();
            if (success) {
            } else {
                console.error('❌ DataManager 初期化に失敗しました');
            }
        } else {
            console.error('❌ DataManager が見つかりません');
        }
    } catch (error) {
        console.error('❌ DataManager 初期化エラー:', error);
    }
}

// FileManager初期化
async function initializeFileManager() {
    
    try {
        if (window.FileManager) {
            const success = await window.FileManager.initialize();
            if (success) {
            } else {
                console.error('❌ FileManager 初期化に失敗しました');
            }
        } else {
            console.error('❌ FileManager が見つかりません');
        }
    } catch (error) {
        console.error('❌ FileManager 初期化エラー:', error);
    }
}

// 音声システムの自動初期化
document.addEventListener('DOMContentLoaded', function() {
    // 少し遅延させて他のシステムの初期化を待つ
    setTimeout(() => {
        const initialized = initializeVoiceSystem();
        if (initialized) {
        } else {
            console.error('❌ 音声システム自動初期化失敗');
        }
    }, 50);
    
    // AIManagerの初期化
    setTimeout(async () => {
        if (typeof initializeAIManager === 'function') {
            try {
                const initialized = await initializeAIManager();
                if (initialized) {
                } else {
                    console.error('❌ AIManager自動初期化失敗');
                }
            } catch (error) {
                console.error('❌ AIManager自動初期化エラー:', error);
            }
        } else {
            console.error('❌ initializeAIManager関数が見つかりません');
        }
    }, 100);
});


// =================================================================================
// CHROME専用デバッグ機能 - A/Bテスト・マイク許可最適化
// =================================================================================

// 🔧 Chrome専用: ブラウザ判定と最適化
function detectBrowserAndOptimize() {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edge');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');
    const isEdge = userAgent.includes('Edge');
    
    
    // Chrome専用最適化の自動適用
    if (isChrome && window.CURRENT_MICROPHONE_STRATEGY !== MICROPHONE_STRATEGY.CONTINUOUS) {
        console.log('🎯 Chrome検出 - 継続的音声認識推奨（真の解決策）');
        console.log('💡 継続的音声認識に切り替えるには: switchMicrophoneStrategy("continuous")');
    }
    
    return {
        isChrome,
        isSafari,
        isFirefox,
        isEdge,
        userAgent,
        recommendation: isChrome ? 'continuous' : 'lightweight'
    };
}

// 🔧 A/Bテスト: 戦略切り替え関数（グローバル）
function switchMicrophoneStrategy(strategy) {
    const stateManager = window.AppState?.stateManager || window.stateManager;
    
    if (!stateManager) {
        console.error('❌ StateManagerが初期化されていません');
        return false;
    }
    
    const validStrategies = Object.values(MICROPHONE_STRATEGY);
    if (!validStrategies.includes(strategy)) {
        console.error(`❌ 無効な戦略: ${strategy}`);
        console.log(`💡 有効な戦略: ${validStrategies.join(', ')}`);
        return false;
    }
    
    const success = stateManager.switchStrategy(strategy);
    if (success) {
        console.log(`✅ 戦略切り替え成功: ${strategy}`);
        console.log('💡 効果を確認するには: debugMicrophonePermissionStats()');
    }
    
    return success;
}

// 🔧 A/Bテスト: 現在の戦略表示
function showCurrentStrategy() {
    const strategy = window.CURRENT_MICROPHONE_STRATEGY || 'unknown';
    const browserInfo = detectBrowserAndOptimize();
    
    console.log('🎯 現在のマイク許可戦略:');
    console.log(`  - 戦略: ${strategy}`);
    console.log(`  - ブラウザ: ${browserInfo.userAgent}`);
    console.log(`  - 推奨戦略: ${browserInfo.recommendation}`);
    
    if (strategy !== browserInfo.recommendation) {
        console.log(`💡 推奨戦略に切り替え: switchMicrophoneStrategy("${browserInfo.recommendation}")`);
    }
    
    return { strategy, browserInfo };
}

// 🔧 Chrome専用: 統計リセット機能
function resetMicrophoneStats() {
    const stateManager = window.AppState?.stateManager || window.stateManager;
    
    if (!stateManager?.recognitionManager) {
        console.error('❌ 音声認識システムが初期化されていません');
        return false;
    }
    
    const manager = stateManager.recognitionManager;
    
    // PersistentRecognitionManagerの場合
    if (manager.stats) {
        manager.stats.restartCount = 0;
        manager.stats.abortCount = 0;
        manager.stats.startTime = Date.now();
        manager.stats.lastRestartTime = 0;
    }
    // 従来のRecognitionManagerの場合
    else if (manager.microphonePermissionManager) {
        manager.microphonePermissionManager.completeBefore = 0;
        manager.microphonePermissionManager.lightweightCount = 0;
        manager.microphonePermissionManager.sessionStartTime = Date.now();
    }
    
    return true;
}

// 🔧 新機能：簡単テスト用統計リセット
function quickResetStats() {
    
    // 継続的音声認識の場合
    if (window.stateManager?.recognitionManager?.resetStats) {
        const success = window.stateManager.recognitionManager.resetStats();
        if (success) {
            return true;
        }
    }
    
    // 従来の方法もサポート
    const legacySuccess = resetMicrophoneStats();
    if (legacySuccess) {
        return true;
    }
    
    console.log('❌ 統計リセット失敗');
    return false;
}

// 🔧 Chrome専用: 包括的デバッグ機能
function debugChromeOptimization() {
    console.log('🎯 Chrome専用マイク許可最適化デバッグ:');
    
    // ブラウザ判定
    const browserInfo = detectBrowserAndOptimize();
    console.log('');
    
    // 現在の戦略表示
    const strategyInfo = showCurrentStrategy();
    console.log('');
    
    // 統計情報表示
    const stats = debugMicrophonePermissionStats();
    console.log('');
    
    // 推奨事項
    console.log('🎯 最適化推奨事項:');
    if (browserInfo.isChrome && strategyInfo.strategy !== 'persistent') {
        console.log('  1. Chrome専用戦略に切り替え: switchMicrophoneStrategy("persistent")');
    }
    if (stats && stats.efficiency < 80) {
        console.log('  2. 統計をリセット: resetMicrophoneStats()');
    }
    if (browserInfo.isChrome && strategyInfo.strategy === 'persistent') {
    }
    
    return {
        browser: browserInfo,
        strategy: strategyInfo,
        stats: stats
    };
}

// 🔧 Chrome専用: 自動最適化機能
function autoOptimizeChromeStrategy() {
    const browserInfo = detectBrowserAndOptimize();
    
    if (browserInfo.isChrome && window.CURRENT_MICROPHONE_STRATEGY !== MICROPHONE_STRATEGY.CONTINUOUS) {
        console.log('🎯 Chrome検出 - 継続的音声認識自動適用（真の解決策）');
        const success = switchMicrophoneStrategy('continuous');
        
        if (success) {
            console.log('💡 効果を確認するには: debugMicrophonePermissionStats()');
            console.log('🎯 これでマイク許可アラートは完全に解消されます');
        }
        
        return success;
    }
    
    console.log('⚠️ Chrome以外のブラウザまたは既に最適化済み');
    return false;
}

// グローバル公開
window.detectBrowserAndOptimize = detectBrowserAndOptimize;
window.switchMicrophoneStrategy = switchMicrophoneStrategy;
window.showCurrentStrategy = showCurrentStrategy;
window.resetMicrophoneStats = resetMicrophoneStats;
window.quickResetStats = quickResetStats;
window.debugChromeOptimization = debugChromeOptimization;
window.autoOptimizeChromeStrategy = autoOptimizeChromeStrategy;

console.log('🎯 Chrome専用デバッグ機能を公開しました');
console.log('💡 Chrome最適化: autoOptimizeChromeStrategy() | 包括デバッグ: debugChromeOptimization()');
console.log('🚀 簡単テスト: quickResetStats() | 統計確認: debugMicrophonePermissionStats()');

// Chrome自動最適化
if (navigator.userAgent.includes('Chrome')) {
    console.log('🎯 Chrome検出 - 自動最適化を提案します');
}

// =================================================================================
// 🧪 自動テスト・監視システム - ユーザーテスト負荷軽減
// =================================================================================

// 🧪 継続的音声認識自動テストシステム
class ContinuousRecognitionTester {
    constructor() {
        this.isRunning = false;
        this.testResults = [];
        this.testInterval = null;
        this.startTime = null;
        this.testDuration = 300000; // 5分間テスト
        this.alertThreshold = {
            startCount: 3,           // start()呼び出し3回以上で警告
            efficiency: 70,          // 効率性70%未満で警告
            permissionRequests: 2    // マイク許可要求2回以上で警告
        };
        
    }
    
    // 🧪 自動テスト開始
    startAutoTest(duration = 300000) {
        if (this.isRunning) {
            return false;
        }
        
        this.isRunning = true;
        this.startTime = Date.now();
        this.testDuration = duration;
        this.testResults = [];
        
        // 初期状態記録
        this.recordTestResult('TEST_START', this.getCurrentStats());
        
        // 10秒間隔で監視
        this.testInterval = setInterval(() => {
            this.monitorSystem();
        }, 10000);
        
        // テスト終了タイマー
        setTimeout(() => {
            this.stopAutoTest();
        }, duration);
        
        // ユーザーへの通知
        this.showTestNotification('テスト開始', `${duration/1000}秒間の自動監視を開始しました`);
        return true;
    }
    
    // 🧪 自動テスト停止
    stopAutoTest() {
        if (!this.isRunning) {
            return false;
        }
        
        this.isRunning = false;
        
        if (this.testInterval) {
            clearInterval(this.testInterval);
            this.testInterval = null;
        }
        
        // 最終状態記録
        this.recordTestResult('TEST_END', this.getCurrentStats());
        
        // テスト結果分析
        const analysis = this.analyzeTestResults();
        this.showTestReport(analysis);
        
        return true;
    }
    
    // 🧪 システム監視
    monitorSystem() {
        if (!this.isRunning) return;
        
        const stats = this.getCurrentStats();
        const alerts = this.checkAlerts(stats);
        
        this.recordTestResult('MONITOR', stats, alerts);
        
        if (alerts.length > 0) {
            console.warn('🚨 自動テストアラート:', alerts);
            this.showTestNotification('品質警告', `${alerts.length}件の問題を検出`);
        }
        
        // 実行時間表示
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const remaining = Math.floor((this.testDuration - (Date.now() - this.startTime)) / 1000);
    }
    
    // 🧪 現在の統計取得
    getCurrentStats() {
        // セッション状態チェック
        const sessionActive = window.AppState?.sessionActive;
        const recognitionManager = window.stateManager?.recognitionManager;
        
        if (!sessionActive) {
            return { 
                error: 'Session not active',
                sessionActive: false,
                message: '会話セッションが開始されていません'
            };
        }
        
        if (!recognitionManager || !recognitionManager.getMicrophonePermissionStats) {
            return { 
                error: 'RecognitionManager unavailable',
                sessionActive: sessionActive,
                message: '音声認識システムが初期化されていません'
            };
        }
        
        const stats = recognitionManager.getMicrophonePermissionStats();
        return {
            ...stats,
            sessionActive: sessionActive,
            timestamp: Date.now(),
            testElapsed: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0
        };
    }
    
    // 🧪 アラートチェック
    checkAlerts(stats) {
        const alerts = [];
        
        // セッション未開始の場合は特別な警告
        if (!stats.sessionActive) {
            alerts.push({
                type: 'SESSION_NOT_ACTIVE',
                message: '会話セッションが開始されていません',
                severity: 'CRITICAL'
            });
            return alerts; // セッション未開始の場合は他のチェックをスキップ
        }
        
        // エラーがある場合は警告
        if (stats.error) {
            alerts.push({
                type: 'SYSTEM_ERROR',
                message: stats.message || stats.error,
                severity: 'HIGH'
            });
            return alerts;
        }
        
        if (stats.startCount > this.alertThreshold.startCount) {
            alerts.push({
                type: 'START_COUNT_HIGH',
                message: `start()呼び出しが${stats.startCount}回 (閾値: ${this.alertThreshold.startCount})`,
                severity: 'HIGH'
            });
        }
        
        if (stats.efficiency < this.alertThreshold.efficiency && stats.efficiency !== Infinity) {
            alerts.push({
                type: 'EFFICIENCY_LOW',
                message: `効率性が${stats.efficiency}% (閾値: ${this.alertThreshold.efficiency}%)`,
                severity: 'MEDIUM'
            });
        }
        
        if (stats.microphonePermissionRequests > this.alertThreshold.permissionRequests) {
            alerts.push({
                type: 'PERMISSION_REQUESTS_HIGH',
                message: `マイク許可要求が${stats.microphonePermissionRequests}回 (閾値: ${this.alertThreshold.permissionRequests})`,
                severity: 'HIGH'
            });
        }
        
        if (!stats.continuousRecognition && stats.strategy === 'continuous') {
            alerts.push({
                type: 'CONTINUITY_BROKEN',
                message: '継続的音声認識が停止',
                severity: 'CRITICAL'
            });
        }
        
        return alerts;
    }
    
    // 🧪 テスト結果記録
    recordTestResult(event, stats, alerts = []) {
        this.testResults.push({
            event,
            stats,
            alerts,
            timestamp: Date.now()
        });
    }
    
    // 🧪 テスト結果分析
    analyzeTestResults() {
        if (this.testResults.length === 0) {
            return { error: 'No test data available' };
        }
        
        const startResult = this.testResults.find(r => r.event === 'TEST_START');
        const endResult = this.testResults.find(r => r.event === 'TEST_END');
        const monitorResults = this.testResults.filter(r => r.event === 'MONITOR');
        
        const allAlerts = this.testResults.flatMap(r => r.alerts || []);
        const criticalAlerts = allAlerts.filter(a => a.severity === 'CRITICAL');
        const highAlerts = allAlerts.filter(a => a.severity === 'HIGH');
        const mediumAlerts = allAlerts.filter(a => a.severity === 'MEDIUM');
        
        const finalStats = endResult?.stats || monitorResults[monitorResults.length - 1]?.stats;
        
        return {
            duration: Math.floor((Date.now() - this.startTime) / 1000),
            totalAlerts: allAlerts.length,
            criticalAlerts: criticalAlerts.length,
            highAlerts: highAlerts.length,
            mediumAlerts: mediumAlerts.length,
            finalStats,
            passed: criticalAlerts.length === 0 && highAlerts.length === 0,
            grade: this.calculateGrade(finalStats, allAlerts)
        };
    }
    
    // 🧪 品質グレード計算
    calculateGrade(stats, alerts) {
        if (!stats) return 'N/A';
        
        let score = 100;
        
        // 効率性評価
        if (stats.efficiency >= 95) score += 10;
        else if (stats.efficiency >= 80) score += 5;
        else if (stats.efficiency < 50) score -= 20;
        
        // start()回数評価
        if (stats.startCount === 1) score += 15;
        else if (stats.startCount <= 2) score += 10;
        else if (stats.startCount >= 5) score -= 25;
        
        // アラート評価
        score -= alerts.filter(a => a.severity === 'CRITICAL').length * 30;
        score -= alerts.filter(a => a.severity === 'HIGH').length * 15;
        score -= alerts.filter(a => a.severity === 'MEDIUM').length * 5;
        
        if (score >= 95) return 'A+ (優秀)';
        if (score >= 85) return 'A (良好)';
        if (score >= 70) return 'B (普通)';
        if (score >= 50) return 'C (要改善)';
        return 'D (問題あり)';
    }
    
    // 🧪 テスト通知表示
    showTestNotification(title, message) {
        
        // UI通知（利用可能な場合）
        if (typeof showMessage === 'function') {
            showMessage('info', `${title}: ${message}`);
        }
    }
    
    // 🧪 テストレポート表示
    showTestReport(analysis) {
        console.log(`🎯 品質グレード: ${analysis.grade}`);
        console.log(`🚨 アラート総数: ${analysis.totalAlerts}件`);
        
        if (analysis.criticalAlerts > 0) {
            console.log(`🔴 重大アラート: ${analysis.criticalAlerts}件`);
        }
        if (analysis.highAlerts > 0) {
            console.log(`🟠 高優先度アラート: ${analysis.highAlerts}件`);
        }
        if (analysis.mediumAlerts > 0) {
            console.log(`🟡 中優先度アラート: ${analysis.mediumAlerts}件`);
        }
        
        if (analysis.finalStats) {
            const stats = analysis.finalStats;
            console.log('📈 最終統計:');
            console.log(`  - start()呼び出し: ${stats.startCount}回`);
            console.log(`  - マイク許可要求: ${stats.microphonePermissionRequests}回`);
            console.log(`  - 効率性: ${stats.efficiency}%`);
        }
        
        // 推奨事項
        this.showRecommendations(analysis);
        
        // UI通知
        const status = analysis.passed ? '✅ 合格' : '❌ 不合格';
        this.showTestNotification('テスト完了', `${status} - グレード: ${analysis.grade}`);
    }
    
    // 🧪 推奨事項表示
    showRecommendations(analysis) {
        console.log('💡 推奨事項:');
        
        if (analysis.passed) {
            if (analysis.finalStats?.efficiency === 100) {
                console.log('  🎯 完璧な効率性を達成しました！');
            }
        } else {
            if (analysis.criticalAlerts > 0) {
                console.log('  🔴 重大な問題があります - システム再起動を推奨');
            }
            if (analysis.finalStats?.startCount > 3) {
            }
            if (analysis.finalStats?.efficiency < 70) {
            }
        }
    }
    
    // 🧪 テスト結果エクスポート
    exportTestResults() {
        const data = {
            testInfo: {
                startTime: this.startTime,
                duration: this.testDuration,
                timestamp: new Date().toISOString()
            },
            results: this.testResults,
            analysis: this.analyzeTestResults()
        };
        
        return data;
    }
}

// 🧪 グローバルテストインスタンス
window.continuousRecognitionTester = new ContinuousRecognitionTester();

// 🧪 セッション状態チェック関数
function checkSessionStatus() {
    const sessionActive = window.AppState?.sessionActive;
    const recognitionManager = window.stateManager?.recognitionManager;
    
    
    if (!sessionActive) {
        return false;
    }
    
    if (!recognitionManager) {
        return false;
    }
    
    return true;
}

// 🧪 便利関数: 簡単テスト開始（セッション状態チェック付き）
function testContinuousRecognition(durationMinutes = 5) {
    if (!checkSessionStatus()) {
        return false;
    }
    const duration = durationMinutes * 60 * 1000;
    return window.continuousRecognitionTester.startAutoTest(duration);
}

// 🧪 便利関数: テスト停止
function stopContinuousRecognitionTest() {
    return window.continuousRecognitionTester.stopAutoTest();
}

// 🧪 便利関数: クイックチェック（30秒）
function quickTestContinuousRecognition() {
    if (!checkSessionStatus()) {
        return false;
    }
    return window.continuousRecognitionTester.startAutoTest(30000);
}

// 🧪 便利関数: 超短時間テスト（10秒）
function ultraQuickTest() {
    if (!checkSessionStatus()) {
        return false;
    }
    return window.continuousRecognitionTester.startAutoTest(10000);
}

// 🧪 グローバル公開
window.checkSessionStatus = checkSessionStatus;
window.testContinuousRecognition = testContinuousRecognition;
window.stopContinuousRecognitionTest = stopContinuousRecognitionTest;
window.quickTestContinuousRecognition = quickTestContinuousRecognition;
window.ultraQuickTest = ultraQuickTest;

console.log('💡 クイックテスト: quickTestContinuousRecognition() | 超短時間テスト: ultraQuickTest()');
console.log('💡 テスト停止: stopContinuousRecognitionTest()');

// =================================================================================
// 🔄 自動ロールバック・品質監視システム
// =================================================================================

// 🔄 品質監視とロールバック機能
class QualityMonitor {
    constructor() {
        this.isMonitoring = false;
        this.monitorInterval = null;
        this.qualityHistory = [];
        this.thresholds = {
            criticalEfficiency: 30,  // 30%未満で緊急ロールバック
            minEfficiency: 50,       // 50%未満で警告
            maxStartCount: 10,       // 10回以上で警告
            maxPermissionRequests: 5  // 5回以上で警告
        };
        
    }
    
    // 🔄 品質監視開始
    startMonitoring(interval = 30000) {
        if (this.isMonitoring) {
            return false;
        }
        
        this.isMonitoring = true;
        this.qualityHistory = [];
        
        this.monitorInterval = setInterval(() => {
            this.checkQuality();
        }, interval);
        
        return true;
    }
    
    // 🔄 品質監視停止
    stopMonitoring() {
        if (!this.isMonitoring) {
            return false;
        }
        
        this.isMonitoring = false;
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        return true;
    }
    
    // 🔄 品質チェック
    checkQuality() {
        if (!this.isMonitoring) return;
        
        const sessionActive = window.AppState?.sessionActive;
        if (!sessionActive) {
            console.warn('🔄 品質監視: セッション未開始 - 監視を一時停止');
            return;
        }
        
        const recognitionManager = window.stateManager?.recognitionManager;
        if (!recognitionManager || !recognitionManager.getMicrophonePermissionStats) {
            console.warn('🔄 品質監視: RecognitionManager利用不可');
            return;
        }
        
        const stats = recognitionManager.getMicrophonePermissionStats();
        const quality = this.evaluateQuality(stats);
        
        this.qualityHistory.push({
            timestamp: Date.now(),
            stats,
            quality
        });
        
        // 履歴の上限管理（最新100件）
        if (this.qualityHistory.length > 100) {
            this.qualityHistory.shift();
        }
        
        // 品質レベルに基づく処理
        if (quality.level === 'CRITICAL') {
            this.handleCriticalQuality(stats, quality);
        } else if (quality.level === 'WARNING') {
            this.handleWarningQuality(stats, quality);
        }
        
        console.log(`🔄 品質チェック: ${quality.level} (効率性: ${stats.efficiency}%)`);
    }
    
    // 🔄 品質評価
    evaluateQuality(stats) {
        const issues = [];
        
        if (stats.efficiency < this.thresholds.criticalEfficiency) {
            issues.push('効率性が極めて低い');
        } else if (stats.efficiency < this.thresholds.minEfficiency) {
            issues.push('効率性が低い');
        }
        
        if (stats.startCount > this.thresholds.maxStartCount) {
            issues.push('start()呼び出しが多すぎる');
        }
        
        if (stats.microphonePermissionRequests > this.thresholds.maxPermissionRequests) {
            issues.push('マイク許可要求が多すぎる');
        }
        
        let level = 'GOOD';
        if (stats.efficiency < this.thresholds.criticalEfficiency) {
            level = 'CRITICAL';
        } else if (issues.length > 0) {
            level = 'WARNING';
        }
        
        return {
            level,
            issues,
            score: Math.max(0, 100 - issues.length * 20)
        };
    }
    
    // 🔄 重大品質問題への対応
    handleCriticalQuality(stats, quality) {
        console.error('🔴 重大品質問題検出 - 緊急対応開始');
        console.error('🔴 問題:', quality.issues);
        
        // 自動ロールバック実行
        this.performEmergencyRollback(stats);
        
        // ユーザーへの通知
        if (typeof showMessage === 'function') {
            showMessage('error', '重大品質問題を検出しました。システムを最適化しています。');
        }
    }
    
    // 🔄 警告レベル品質問題への対応
    handleWarningQuality(stats, quality) {
        console.warn('🟠 品質警告:', quality.issues);
        
        // 軽微な最適化実行
        this.performLightOptimization(stats);
    }
    
    // 🔄 緊急ロールバック実行
    performEmergencyRollback(stats) {
        
        // 1. 統計リセット
        if (typeof resetMicrophoneStats === 'function') {
            resetMicrophoneStats();
        }
        
        // 2. 戦略最適化
        if (typeof autoOptimizeChromeStrategy === 'function') {
            autoOptimizeChromeStrategy();
        }
        
        // 3. 必要に応じてページリロード推奨
        if (stats.efficiency < 10) {
            if (typeof showMessage === 'function') {
                showMessage('warning', 'システムの完全リセットのためページリロードを推奨します。');
            }
        }
    }
    
    // 🔄 軽微な最適化実行
    performLightOptimization(stats) {
        
        // Chrome最適化の自動実行
        if (typeof autoOptimizeChromeStrategy === 'function') {
            autoOptimizeChromeStrategy();
        }
    }
    
    // 🔄 品質レポート生成
    generateQualityReport() {
        if (this.qualityHistory.length === 0) {
            return { error: 'No quality data available' };
        }
        
        const recent = this.qualityHistory.slice(-10);
        const avgScore = recent.reduce((sum, item) => sum + item.quality.score, 0) / recent.length;
        const criticalCount = recent.filter(item => item.quality.level === 'CRITICAL').length;
        const warningCount = recent.filter(item => item.quality.level === 'WARNING').length;
        
        return {
            averageScore: Math.round(avgScore),
            criticalEvents: criticalCount,
            warningEvents: warningCount,
            totalChecks: recent.length,
            currentStatus: recent[recent.length - 1]?.quality.level || 'UNKNOWN'
        };
    }
}

// 🔄 グローバル品質監視インスタンス
window.qualityMonitor = new QualityMonitor();

// 🔄 便利関数: 品質監視開始（セッション状態チェック付き）
function startQualityMonitoring(intervalSeconds = 30) {
    const sessionActive = window.AppState?.sessionActive;
    if (!sessionActive) {
        console.warn('⚠️ 品質監視: セッション未開始 - 監視を開始できません');
        return false;
    }
    return window.qualityMonitor.startMonitoring(intervalSeconds * 1000);
}

// 🔄 便利関数: 品質監視停止
function stopQualityMonitoring() {
    return window.qualityMonitor.stopMonitoring();
}

// 🔄 便利関数: 品質レポート表示
function showQualityReport() {
    const report = window.qualityMonitor.generateQualityReport();
    return report;
}

// 🔄 グローバル公開
window.startQualityMonitoring = startQualityMonitoring;
window.stopQualityMonitoring = stopQualityMonitoring;
window.showQualityReport = showQualityReport;


// =================================================================================
// 🚀 ワンクリック総合テストシステム
// =================================================================================

// 🚀 総合テスト実行
async function runComprehensiveTest() {
    
    // 0. セッション状態チェック
    if (!checkSessionStatus()) {
        return false;
    }
    
    // 1. 品質監視開始
    startQualityMonitoring(10); // 10秒間隔
    
    // 2. 継続的音声認識テスト開始
    quickTestContinuousRecognition(); // 30秒テスト
    
    // 3. Chrome最適化実行
    if (typeof autoOptimizeChromeStrategy === 'function') {
        autoOptimizeChromeStrategy();
    }
    
    // 4. 初期統計表示
    if (typeof debugMicrophonePermissionStats === 'function') {
        debugMicrophonePermissionStats();
    }
    
    // 5. 40秒後に結果表示
    setTimeout(() => {
        console.log('🚀 ===== 総合テスト結果 =====');
        
        // 品質レポート
        const qualityReport = showQualityReport();
        
        // 最終統計
        if (typeof debugMicrophonePermissionStats === 'function') {
            debugMicrophonePermissionStats();
        }
        
        // 監視停止
        stopQualityMonitoring();
        
        console.log('💡 詳細な分析: debugChromeOptimization()');
        
    }, 40000);
    
    return true;
}

// 🚀 グローバル公開
window.runComprehensiveTest = runComprehensiveTest;

console.log('🚀 ワンクリック総合テストシステムを公開しました');
console.log('🎯 これで手動テストの負荷が大幅に軽減されます！');
