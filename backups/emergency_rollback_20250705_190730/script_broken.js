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

// 🔧 PermissionManager: マイク許可の一元管理
class PermissionManager {
    constructor() {
        this.state = 'unknown'; // unknown, granted, denied, requesting
        this.listeners = new Set();
        this.requestQueue = [];
        this.isRequesting = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 5000; // 5秒間隔制限
    }
    
    // 許可状態の取得（非同期）
    async getPermission() {
        console.log('🔍 許可状態確認:', this.state);
        
        if (this.state === 'granted') {
            console.log('✅ 許可済み - 即座に返却');
            return true;
        }
        
        if (this.state === 'denied') {
            console.log('🚫 拒否済み - 即座に返却');
            return false;
        }
        
        // 時間間隔チェック
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            console.log('⏰ 要求間隔不足 - 待機');
            return new Promise((resolve) => {
                this.requestQueue.push(resolve);
            });
        }
        
        return this.requestPermission();
    }
    
    // 許可要求（重複防止・一回だけルール）
    async requestPermission() {
        if (this.isRequesting) {
            console.log('🔄 要求進行中 - キューに追加');
            return new Promise((resolve) => {
                this.requestQueue.push(resolve);
            });
        }
        
        console.log('🎤 マイク許可要求開始（一回だけルール）');
        this.isRequesting = true;
        this.state = 'requesting';
        this.lastRequestTime = Date.now();
        
        try {
            // ブラウザレベルでの許可状態確認
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
            
            if (permissionStatus && permissionStatus.state === 'granted') {
                console.log('✅ ブラウザレベルで許可済み');
                this.state = 'granted';
                this.notifyListeners();
                this.processQueue(true);
                return true;
            }
            
            // 一回だけの許可取得
            console.log('🔄 getUserMediaによる許可取得');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // ストリームを即座に停止（許可のみが目的）
            stream.getTracks().forEach(track => track.stop());
            
            console.log('✅ マイク許可取得成功');
            this.state = 'granted';
            this.notifyListeners();
            this.processQueue(true);
            return true;
            
        } catch (error) {
            console.error('❌ マイク許可取得失敗:', error);
            this.state = 'denied';
            this.notifyListeners();
            this.processQueue(false);
            return false;
        } finally {
            this.isRequesting = false;
        }
    }
    
    // キュー処理
    processQueue(result) {
        while (this.requestQueue.length > 0) {
            const resolve = this.requestQueue.shift();
            resolve(result);
        }
    }
    
    // リスナー登録
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    // リスナー削除
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    // 状態通知
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('リスナー実行エラー:', error);
            }
        });
    }
    
    // 状態リセット（テスト用）
    reset() {
        this.state = 'unknown';
        this.isRequesting = false;
        this.requestQueue = [];
        this.notifyListeners();
    }
}

// 🔧 RecognitionManager: 音声認識の一元管理（新旧統合版）
class RecognitionManager {
    constructor(permissionManager) {
        this.permissionManager = permissionManager;
        this.state = 'idle'; // idle, starting, active, stopping, error
        this.recognition = null;
        this.errorCount = 0;
        this.maxErrors = 3;
        this.listeners = new Set();
        this.isStarting = false;
        this.isStopping = false;
        this.preemptiveRestartTimer = null; // 🔧 新機能: プリエンプティブ再開タイマー
        
        // 🔄 旧システム統合: 安定性管理（指数バックオフ対応）
        this.stability = {
            consecutiveErrorCount: 0,
            maxConsecutiveErrors: 5, // 🔧 エラー許容回数を増加
            lastRestartTime: 0,
            minRestartInterval: 2000,
            isRecognitionActive: false,
            lastErrorTime: 0,
            // 🔧 新機能: 指数バックオフアルゴリズム
            exponentialBackoff: {
                baseDelay: 1000,        // 基本待機時間（1秒）
                maxDelay: 30000,        // 最大待機時間（30秒）
                multiplier: 2,          // 倍率
                jitter: 0.1,           // ランダムな変動幅（10%）
                resetSuccessCount: 2    // 成功回数でリセット
            },
            successfulStartCount: 0,    // 連続成功回数
            currentBackoffDelay: 0      // 現在の待機時間
        };
        
        // 🔄 旧システム統合: 会話制御
        this.conversationControl = {
            speakingInProgress: false,
            isKnowledgeConfirmationMode: false
        };
        
        // 🔄 統合フラグ
        this.isUnifiedSystem = true;
        
        console.log('✅ 統合音声認識マネージャー初期化完了');
    }
    
    // 🔄 統合メソッド: セッション状態の同期
    syncWithAppState() {
        if (window.AppState) {
            // 旧システムの状態を新システムに同期
            this.conversationControl.speakingInProgress = window.AppState.conversationControl?.speakingInProgress || false;
            this.conversationControl.isKnowledgeConfirmationMode = window.AppState.voiceRecognitionState?.isKnowledgeConfirmationMode || false;
            
            // 新システムの状態を旧システムに同期
            if (window.AppState.voiceRecognitionStability) {
                window.AppState.voiceRecognitionStability.isRecognitionActive = this.stability.isRecognitionActive;
            }
        }
    }
    
    // 音声認識開始（統合版）
    async start() {
        console.log('🎤 統合音声認識開始要求:', this.state);
        
        if (this.state !== 'idle') {
            console.log(`🚫 状態がidleでないため開始不可 (現在の状態: ${this.state})`);
            return false;
        }
        
        if (this.isStarting) {
            console.log('🔄 開始処理進行中 - スキップ');
            return false;
        }
        
        this.isStarting = true;
        
        try {
            // 🔄 統合チェック: セッション状態
            this.syncWithAppState();
            
            // セッション状態の詳細確認
            // AppStateの初期化確認（フォールバック削除）
            if (!window.AppState) {
                console.error('❌ AppStateが未初期化 - 音声認識開始不可');
                this.isStarting = false;
                return false;
            }
            
            const sessionActive = window.AppState?.sessionActive;
            const hasTheme = window.AppState?.currentTheme?.trim();
            const isWarmupPhase = window.AppState?.phase === 'WARMUP';
            
            console.log('📊 セッション状態詳細:', {
                sessionActive,
                hasTheme: !!hasTheme,
                themeValue: hasTheme,
                phase: window.AppState?.phase,
                isWarmupPhase,
                AppState: !!window.AppState,
                緊急フォールバック: !window.AppState ? '実行済み' : '不要'
            });
            
            // セッション状態の柔軟な判定（テーマがあれば基本的にOK）
            const canStart = sessionActive || hasTheme || isWarmupPhase;
            
            console.log('🔍 セッション開始判定:', {
                canStart,
                sessionActive,
                hasTheme: !!hasTheme,
                isWarmupPhase,
                判定結果: canStart ? '✅ 開始可能' : '❌ 開始不可'
            });
            
            if (!canStart) {
                console.log('😴 セッション開始条件が満たされていません');
                this.isStarting = false;
                return false;
            }
            
            console.log('✅ セッション開始条件OK - 音声認識を開始します');
            
            // 🔄 統合チェック: 会話制御
            if (this.conversationControl.speakingInProgress) {
                console.log('🗣️ AIが発話中のためスキップ');
                this.isStarting = false;
                return false;
            }
            
            // 🔧 修正: 知見確認モード中でも音声認識は必要（ユーザーの回答を聞くため）
            // AI発話中のみブロック、ユーザーの回答待ちでは音声認識を有効化
            if (this.conversationControl.isKnowledgeConfirmationMode && 
                window.AppState.currentSpeaker !== window.SPEAKERS?.NULL &&
                (window.AppState.currentSpeaker === window.SPEAKERS?.HAHORI || 
                 window.AppState.currentSpeaker === window.SPEAKERS?.NEHORI)) {
                console.log('📝 知見確認モード中のAI発話のためスキップ');
                this.isStarting = false;
                return false;
            }
            
            // 🔄 統合チェック: 再開間隔制御
            const now = Date.now();
            const timeSinceLastRestart = now - this.stability.lastRestartTime;
            if (timeSinceLastRestart < this.stability.minRestartInterval) {
                const waitTime = this.stability.minRestartInterval - timeSinceLastRestart;
                console.log(`⏱️ 再開間隔不足 - ${waitTime}ms後に再試行`);
                this.isStarting = false;
                
                setTimeout(() => {
                    if (this.state === 'idle') {
                        this.start();
                    }
                }, waitTime);
                return false;
            }
            
            // 🔄 統合チェック: 連続エラー制御
            if (this.stability.consecutiveErrorCount >= this.stability.maxConsecutiveErrors) {
                console.warn(`🚫 連続エラーが${this.stability.maxConsecutiveErrors}回を超えたため一時停止`);
                this.isStarting = false;
                return false;
            }
            
            // 🔧 完全クリーンアップ
            await this.performCompleteCleanup();
            
            // 許可確認
            const hasPermission = await this.permissionManager.getPermission();
            if (!hasPermission) {
                console.log('🚫 マイク許可なし - 開始不可');
                this.isStarting = false;
                return false;
            }
            
            this.state = 'starting';
            this.notifyListeners();
            
            // SpeechRecognition作成
            this.recognition = this.createRecognition();
            this.setupEventHandlers();
            
            // 開始実行
            console.log('🚀 統合音声認識開始実行');
            this.recognition.start();
            
            this.state = 'active';
            this.stability.isRecognitionActive = true;
            this.stability.lastRestartTime = now;
            this.stability.consecutiveErrorCount = 0; // 成功時はリセット
            this.errorCount = 0; // 従来のエラーカウントもリセット
            
            // 🔧 新機能: 指数バックオフリセット処理
            this.resetExponentialBackoff();
            
            this.notifyListeners();
            this.syncWithAppState();
            
            // 🔧 新機能: プリエンプティブ再開をスケジュール
            this.schedulePreemptiveRestart();
            
            console.log('✅ 統合音声認識開始成功');
            return true;
            
        } catch (error) {
            console.error('❌ 統合音声認識開始エラー:', error);
            this.handleStartError(error);
            return false;
        } finally {
            this.isStarting = false;
        }
    }
    
    // 🔧 完全クリーンアップメソッド（強化版）
    async performCompleteCleanup() {
        console.log('🧹 完全クリーンアップ開始');
        
        // 既存の新システムインスタンスを停止
        if (this.recognition) {
            try {
                this.recognition.abort();
                this.recognition = null;
                console.log('🛑 既存の新システムインスタンス停止');
            } catch (error) {
                console.warn('⚠️ 新システムインスタンス停止エラー:', error);
            }
        }
        
        // 旧システムインスタンスを停止
        if (window.AppState?.speechRecognition) {
            try {
                window.AppState.speechRecognition.abort();
                window.AppState.speechRecognition = null;
                console.log('🛑 旧システムインスタンス停止');
            } catch (error) {
                console.warn('⚠️ 旧システムインスタンス停止エラー:', error);
            }
        }
        
        // 🔧 グローバルに残存している可能性のあるインスタンスもクリア
        if (window.speechRecognition) {
            try {
                window.speechRecognition.abort();
                window.speechRecognition = null;
                console.log('🛑 グローバルインスタンス停止');
            } catch (error) {
                console.warn('⚠️ グローバルインスタンス停止エラー:', error);
            }
        }
        
        // 🔧 状態リセット
        this.state = 'idle';
        this.stability.isRecognitionActive = false;
        
        // 長めの待機時間（ブラウザの内部状態完全安定化）
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('✅ 完全クリーンアップ完了');
    }
    
    // 🔧 開始エラーハンドリング
    handleStartError(error) {
        this.state = 'error';
        this.stability.isRecognitionActive = false;
        this.stability.consecutiveErrorCount++;
        this.stability.lastErrorTime = Date.now();
        this.notifyListeners();
        this.syncWithAppState();
        
        // 許可関連エラーの場合は永続的に停止
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            console.error('🚫 許可関連エラー - 永続停止');
            this.permissionManager.state = 'denied';
            this.permissionManager.notifyListeners();
            return;
        }
        
        // 一定時間後にidleに戻す
        setTimeout(() => {
            if (this.state === 'error') {
                this.state = 'idle';
                this.notifyListeners();
            }
        }, 2000);
    }
    
    // 音声認識停止
    async stop() {
        console.log('🛑 音声認識停止要求:', this.state);
        
        if (this.state !== 'active') {
            console.log('🚫 状態がactiveでないため停止不可');
            return false;
        }
        
        if (this.isStopping) {
            console.log('🔄 停止処理進行中 - スキップ');
            return false;
        }
        
        this.isStopping = true;
        
        try {
            this.state = 'stopping';
            this.notifyListeners();
            
            // 🔧 新機能: プリエンプティブ再開タイマーをクリア
            if (this.preemptiveRestartTimer) {
                clearTimeout(this.preemptiveRestartTimer);
                this.preemptiveRestartTimer = null;
            }
            
            if (this.recognition) {
                this.recognition.stop();
            }
            
            this.state = 'idle';
            this.notifyListeners();
            
            console.log('✅ 音声認識停止成功');
            return true;
            
        } catch (error) {
            console.error('❌ 音声認識停止エラー:', error);
            this.handleError(error);
            return false;
        } finally {
            this.isStopping = false;
        }
    }
    
    // SpeechRecognition作成
    createRecognition() {
        if ('webkitSpeechRecognition' in window) {
            return new webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
            return new SpeechRecognition();
        } else {
            throw new Error('このブラウザは音声認識に対応していません');
        }
    }
    
    // イベントハンドラ設定
    setupEventHandlers() {
        if (!this.recognition) return;
        
        // 設定
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ja-JP';
        this.recognition.maxAlternatives = 1;
        
        // イベントハンドラ
        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };
        
        this.recognition.onend = () => {
            this.handleEnd();
        };
        
        this.recognition.onstart = () => {
            console.log('🎬 音声認識開始イベント');
        };
    }
    
    // 結果処理
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
    
    // エラーハンドリング（統合版）
    handleRecognitionError(event) {
        console.error('😨 統合音声認識エラー:', event.error);
        
        switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                console.error('🚫 マイク許可エラー');
                this.permissionManager.state = 'denied';
                this.permissionManager.notifyListeners();
                this.stability.isRecognitionActive = false;
                this.syncWithAppState();
                break;
                
            case 'no-speech':
                console.log('😶 音声が検出されませんでした');
                // no-speechはエラーカウントに含めない
                return;
                
            case 'aborted':
                console.warn('🔄 音声認識が中断されました - 統合システムで安定化');
                // 統合システムでの安定化処理
                this.handleAbortedError();
                return;
                
            // 🔧 新機能: networkエラーの専用処理
            case 'network':
                console.warn('🌐 ネットワークエラー - 長時間セッション制限に対応');
                this.handleNetworkError();
                return;
                
            default:
                console.warn(`⁉️ 未知のエラー: ${event.error}`);
                break;
        }
        
        this.handleError(new Error(event.error));
    }
    
    // 🔧 新機能: networkエラーの専用処理
    handleNetworkError() {
        console.log('🔧 networkエラーの専用処理開始');
        
        // 状態を安全にリセット
        this.state = 'idle';
        this.stability.isRecognitionActive = false;
        this.stability.lastErrorTime = Date.now();
        
        // networkエラーは通常のエラーカウントに含めない
        // （セッション時間制限に起因するため）
        
        // 認識インスタンスをクリア
        if (this.recognition) {
            this.recognition = null;
        }
        
        // 状態を同期
        this.syncWithAppState();
        this.notifyListeners();
        
        // 🔧 networkエラー固有の対応
        const timeSinceStart = Date.now() - this.stability.lastRestartTime;
        const isLongSession = timeSinceStart > 60000; // 60秒以上の長時間セッション
        
        if (isLongSession) {
            console.log('⏰ 長時間セッション検出 - セッション分割モードで再開');
            window.showMessage('info', '長時間セッションにより再開します...');
            
            // 長時間セッション用の短い間隔で再開
            setTimeout(() => {
                if (this.state === 'idle' && 
                    window.AppState?.sessionActive && 
                    !this.conversationControl.speakingInProgress) {
                    console.log('🔄 セッション分割モードで自動再開');
                    this.start();
                }
            }, 500); // 500ms後に即座に再開
        } else {
            console.log('🔄 通常の再開処理');
            setTimeout(() => {
                if (this.state === 'idle' && 
                    window.AppState?.sessionActive && 
                    !this.conversationControl.speakingInProgress) {
                    console.log('🔄 networkエラー回復のため自動再開');
                    this.start();
                }
            }, 2000); // 2秒後に再開
        }
        
        // 🔧 プリエンプティブ再開の設定
        this.schedulePreemptiveRestart();
    }
    
    // 🔧 新機能: プリエンプティブ再開スケジューラ
    schedulePreemptiveRestart() {
        // 既存のタイマーをクリア
        if (this.preemptiveRestartTimer) {
            clearTimeout(this.preemptiveRestartTimer);
        }
        
        // 50秒後に予防的再開をスケジュール
        this.preemptiveRestartTimer = setTimeout(() => {
            if (this.state === 'active' && 
                window.AppState?.sessionActive && 
                !this.conversationControl.speakingInProgress) {
                console.log('🔄 予防的再開実行（network エラー防止）');
                this.performPreemptiveRestart();
            }
        }, 50000); // 50秒後（制限時間より前）
    }
    
    // 🔧 新機能: 予防的再開処理（軽量版）
    async performPreemptiveRestart() {
        console.log('🔄 予防的再開処理開始（軽量版）');
        
        try {
            // 🔧 修正: 軽量リスタート - マイク許可を保持
            if (this.recognition && this.state === 'active') {
                console.log('🔄 軽量リスタート: 認識インスタンスのみ再作成');
                
                // 現在の認識を停止（abort使用でマイク許可保持）
                this.recognition.abort();
                this.recognition = null;
                
                // 短時間待機後に新しい認識インスタンスを作成
                setTimeout(() => {
                    if (window.AppState?.sessionActive && this.state !== 'stopping') {
                        console.log('🔄 軽量再開実行');
                        this.performLightweightRestart();
                    }
                }, 100); // 100msの短時間待機
            }
            
        } catch (error) {
            console.error('⚠️ 予防的再開エラー:', error);
            // エラーが発生した場合は通常の再開処理
            this.start();
        }
    }
    
    // 🔧 新機能: 軽量再開（マイク許可保持）
    async performLightweightRestart() {
        try {
            console.log('🔄 軽量再開開始');
            
            // 状態を一時的にstartingに
            this.state = 'starting';
            this.notifyListeners();
            
            // 新しい認識インスタンスを作成
            this.recognition = this.createRecognition();
            this.setupEventHandlers();
            
            // 認識開始（マイク許可は既に取得済み）
            this.recognition.start();
            
            // 状態をactiveに
            this.state = 'active';
            this.stability.isRecognitionActive = true;
            this.stability.lastRestartTime = Date.now();
            this.notifyListeners();
            this.syncWithAppState();
            
            // 次回の予防的再開をスケジュール
            this.schedulePreemptiveRestart();
            
            console.log('✅ 軽量再開完了（マイク許可保持）');
            
        } catch (error) {
            console.error('❌ 軽量再開エラー:', error);
            // 軽量再開に失敗した場合は通常の開始処理
            this.state = 'idle';
            this.notifyListeners();
            this.start();
        }
    }
    
    // 🔧 新機能: 指数バックオフアルゴリズム
    calculateExponentialBackoff() {
        const backoff = this.stability.exponentialBackoff;
        const errorCount = this.stability.consecutiveErrorCount;
        
        if (errorCount === 0) {
            this.stability.currentBackoffDelay = 0;
            return 0;
        }
        
        // 指数バックオフ計算: baseDelay * (multiplier ^ errorCount)
        let delay = backoff.baseDelay * Math.pow(backoff.multiplier, errorCount - 1);
        
        // 最大待機時間を超えないよう制限
        delay = Math.min(delay, backoff.maxDelay);
        
        // ジッター（ランダムな変動）を追加
        const jitterRange = delay * backoff.jitter;
        const jitter = (Math.random() - 0.5) * 2 * jitterRange;
        delay = Math.max(1000, delay + jitter); // 最低1秒は待機
        
        this.stability.currentBackoffDelay = delay;
        
        console.log(`📊 指数バックオフ計算: エラー${errorCount}回 → 待機${Math.round(delay)}ms`);
        return delay;
    }
    
    // 🔧 新機能: 成功時の指数バックオフリセット
    resetExponentialBackoff() {
        this.stability.successfulStartCount++;
        
        // 連続成功回数が設定値に達したらエラーカウントをリセット
        if (this.stability.successfulStartCount >= this.stability.exponentialBackoff.resetSuccessCount) {
            console.log(`🔄 指数バックオフリセット: 連続成功${this.stability.successfulStartCount}回`);
            this.stability.consecutiveErrorCount = Math.max(0, this.stability.consecutiveErrorCount - 1);
            this.stability.successfulStartCount = 0;
            this.stability.currentBackoffDelay = 0;
        }
    }
    
    // 🔧 新機能: エラー時の指数バックオフ適用
    applyExponentialBackoff(callback, context = 'unknown') {
        const delay = this.calculateExponentialBackoff();
        
        if (delay === 0) {
            // 即座に実行
            callback();
            return;
        }
        
        console.log(`⏱️ 指数バックオフ適用: ${Math.round(delay)}ms待機後に再試行 (${context})`);
        
        // ユーザーへの通知
        if (delay > 5000) {
            const seconds = Math.round(delay / 1000);
            window.showMessage('info', `音声認識の安定化のため${seconds}秒待機します...`);
        }
        
        setTimeout(() => {
            callback();
        }, delay);
    }
    
    // abortedエラーの統合処理
    handleAbortedError() {
        console.log('🔧 abortedエラーの統合処理開始');
        
        // 状態を安全にリセット
        this.state = 'idle';
        this.stability.isRecognitionActive = false;
        this.stability.consecutiveErrorCount++;
        this.stability.lastErrorTime = Date.now();
        
        // 🔧 新機能: プリエンプティブ再開タイマーをクリア
        if (this.preemptiveRestartTimer) {
            clearTimeout(this.preemptiveRestartTimer);
            this.preemptiveRestartTimer = null;
        }
        
        // 認識インスタンスをクリア
        if (this.recognition) {
            this.recognition = null;
        }
        
        // 状態を同期
        this.syncWithAppState();
        this.notifyListeners();
        
        // 連続エラー制限チェック
        if (this.stability.consecutiveErrorCount >= this.stability.maxConsecutiveErrors) {
            console.warn(`🚫 連続エラーが${this.stability.maxConsecutiveErrors}回を超えました - 自動再開を停止`);
            return;
        }
        
        // 🔧 新機能: 指数バックオフを適用した自動再開
        this.applyExponentialBackoff(() => {
            if (this.state === 'idle' && 
                window.AppState?.sessionActive && 
                !this.conversationControl.speakingInProgress) {
                console.log('🔄 abortedエラー回復のため自動再開（指数バックオフ適用）');
                this.start();
            }
        }, 'aborted_error_recovery');
    }
    
    // 🗑️ 旧メソッド削除: 統合システムでは不要
    
    // 終了処理
    handleEnd() {
        console.log('🏁 音声認識終了');
        
        if (this.state === 'stopping') {
            // 正常終了
            this.state = 'idle';
            this.notifyListeners();
            return;
        }
        
        // 異常終了の場合は自動再開を検討
        if (this.state === 'active' && AppState.sessionActive) {
            console.log('🔄 異常終了 - 状態をリセットして自動再開を検討');
            // 🔧 修正: 異常終了時も状態を即座にidleに戻す
            this.state = 'idle';
            
            // 🔧 新機能: プリエンプティブ再開タイマーをクリア
            if (this.preemptiveRestartTimer) {
                clearTimeout(this.preemptiveRestartTimer);
                this.preemptiveRestartTimer = null;
            }
            
            this.notifyListeners();
            
            setTimeout(() => {
                if (this.state === 'idle' && AppState.sessionActive) {
                    console.log('🔄 自動再開実行');
                    this.start();
                }
            }, 1000);
        }
    }
    
    // エラーハンドリング（状態リセット）
    handleError(error) {
        console.error('❌ 音声認識エラー処理:', error);
        
        this.errorCount++;
        this.stability.consecutiveErrorCount++;
        this.stability.lastErrorTime = Date.now();
        this.state = 'error';
        this.notifyListeners();
        
        if (this.errorCount >= this.maxErrors || 
            this.stability.consecutiveErrorCount >= this.stability.maxConsecutiveErrors) {
            console.error(`🚫 エラー上限到達 (従来: ${this.maxErrors}回, 統合: ${this.stability.maxConsecutiveErrors}回) - 状態リセット`);
            this.resetToIdle();
        } else {
            // 🔧 新機能: 指数バックオフを適用した状態復旧
            this.applyExponentialBackoff(() => {
                if (this.state === 'error') {
                    this.state = 'idle';
                    this.notifyListeners();
                    
                    // 自動再開も検討
                    if (window.AppState?.sessionActive && 
                        !this.conversationControl.speakingInProgress) {
                        console.log('🔄 エラー回復後の自動再開（指数バックオフ適用）');
                        this.start();
                    }
                }
            }, 'general_error_recovery');
        }
    }
    
    // 安全な状態リセット
    resetToIdle() {
        console.log('🔄 状態リセット実行');
        this.state = 'idle';
        this.errorCount = 0;
        this.recognition = null;
        this.notifyListeners();
    }
    
    // リスナー登録
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    // リスナー削除
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    // 状態通知
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('リスナー実行エラー:', error);
            }
        });
    }
}

// 🔧 AudioManager: 音声再生の一元管理
class AudioManager {
    constructor() {
        this.activeAudioSources = new Set();
        this.listeners = new Set();
    }
    
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
        console.log(`🎵 音声登録: ${speaker} (ID: ${audioData.id})`);
        
        // 音声終了時の自動削除
        audioElement.addEventListener('ended', () => {
            this.unregisterAudio(audioData);
        });
        
        audioElement.addEventListener('error', () => {
            this.unregisterAudio(audioData);
        });
        
        this.notifyListeners();
        return audioData.id;
    }
    
    // 音声登録解除
    unregisterAudio(audioData) {
        this.activeAudioSources.delete(audioData);
        console.log(`🔇 音声登録解除: ${audioData.speaker} (ID: ${audioData.id})`);
        this.notifyListeners();
    }
    
    // 全音声強制停止
    forceStopAllAudio(reason = 'user_request') {
        console.log(`🛑 全音声強制停止開始: ${reason} (対象: ${this.activeAudioSources.size}件)`);
        
        let stoppedCount = 0;
        this.activeAudioSources.forEach(audioData => {
            try {
                audioData.audio.pause();
                audioData.audio.currentTime = 0;
                stoppedCount++;
            } catch (error) {
                console.error('音声停止エラー:', error);
            }
        });
        
        this.activeAudioSources.clear();
        this.notifyListeners();
        
        console.log(`✅ 全音声停止完了: ${stoppedCount}件`);
        return stoppedCount;
    }
    
    // 特定スピーカーの音声停止
    stopSpeakerAudio(speaker, reason = 'speaker_control') {
        console.log(`🛑 ${speaker}の音声停止: ${reason}`);
        
        let stoppedCount = 0;
        this.activeAudioSources.forEach(audioData => {
            if (audioData.speaker === speaker) {
                try {
                    audioData.audio.pause();
                    audioData.audio.currentTime = 0;
                    stoppedCount++;
                } catch (error) {
                    console.error('音声停止エラー:', error);
                }
            }
        });
        
        // 停止した音声を登録解除
        this.activeAudioSources.forEach(audioData => {
            if (audioData.speaker === speaker) {
                this.unregisterAudio(audioData);
            }
        });
        
        console.log(`✅ ${speaker}音声停止完了: ${stoppedCount}件`);
        return stoppedCount;
    }
    
    // アクティブ音声情報取得
    getActiveAudioInfo() {
        return Array.from(this.activeAudioSources).map(audioData => ({
            speaker: audioData.speaker,
            source: audioData.source,
            id: audioData.id,
            duration: Date.now() - audioData.startTime
        }));
    }
    
    // リスナー登録
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    // リスナー削除
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    // 状態通知
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getActiveAudioInfo());
            } catch (error) {
                console.error('リスナー実行エラー:', error);
            }
        });
    }
}

// 🔧 StateManager: 全体状態の一元管理
class StateManager {
    constructor() {
        this.permissionManager = new PermissionManager();
        this.recognitionManager = new RecognitionManager(this.permissionManager);
        this.audioManager = new AudioManager();
        
        this.setupStateSync();
        console.log('✅ StateManager初期化完了');
    }
    
    // 状態同期の設定
    setupStateSync() {
        // 許可状態変更時の処理
        this.permissionManager.addListener((state) => {
            console.log('🔄 許可状態変更:', state);
            this.updateUI();
        });
        
        // 音声認識状態変更時の処理
        this.recognitionManager.addListener((state) => {
            console.log('🔄 音声認識状態変更:', state);
            this.updateUI();
        });
        
        // 音声再生状態変更時の処理
        this.audioManager.addListener((audioInfo) => {
            console.log('🔄 音声再生状態変更:', audioInfo.length, '件');
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
        console.log('🎤 音声認識開始要求');
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

const PHASES = {
    SETUP: 'setup',
    WARMUP: 'warmup',
    DEEPDIVE: 'deepdive',
    SUMMARY: 'summary',
    CLOSING: 'closing'
};

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
    phase: PHASES.SETUP,
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

// 🔧 AppStateをグローバルに公開
window.AppState = AppState;

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

// Voice Optimization Phase 3: はほりーの発声中にねほりーの生成
const VoiceOptimization = {
    phase3: {
        isActive: true,
        pendingNehoriContent: null,
        pendingNehoriAudio: null,
        isGeneratingNehori: false,
        hahoriSpeechStartTime: null,
        shouldPlayNehoriImmediately: false
    }
};

// 🔧 Phase C: 双方向先読み最適化システム
const DualPreemptiveOptimization = {
    phase1: {
        isActive: true,
        // はほりーの先読み管理
        pendingHahoriContent: null,
        pendingHahoriAudio: null,
        isGeneratingHahori: false,
        nehoriSpeechStartTime: null,
        shouldPlayHahoriImmediately: false,
        // 状況適応管理
        adaptiveStrategy: {
            nehoriSpeaking: { trigger: 'immediate', priority: 'high', context: 'knowledge_evaluation' },
            hahoriSpeaking: { trigger: 'delayed', priority: 'medium', context: 'next_question' },
            userSpeaking: { trigger: 'smart', priority: 'adaptive', context: 'response_preparation' }
        },
        // 🔧 Phase 2: 状況適応システム
        situationAnalyzer: {
            // 会話状況を分析
            analyzeConversationSituation(currentSpeaker, userInput) {
                const recentMessages = AppState.conversationHistory.slice(-3);
                const hasUserInput = userInput && userInput.trim().length > 0;
                const isKnowledgeConfirmation = AppState.voiceRecognitionState.isKnowledgeConfirmationMode;
                
                if (isKnowledgeConfirmation) {
                    return 'knowledge_confirmation';
                } else if (currentSpeaker === SPEAKERS.NEHORI) {
                    return 'nehori_speaking';
                } else if (currentSpeaker === SPEAKERS.HAHORI) {
                    return 'hahori_speaking';
                } else if (hasUserInput) {
                    return 'user_speaking';
                } else {
                    return 'idle';
                }
            },
            
            // 状況に応じた先読み戦略を決定
            determinePreemptiveStrategy(situation) {
                const strategies = {
                    nehori_speaking: {
                        trigger: 'immediate',
                        priority: 'high',
                        context: 'knowledge_evaluation',
                        delay: 1000,
                        targetSpeaker: SPEAKERS.HAHORI
                    },
                    hahori_speaking: {
                        trigger: 'delayed',
                        priority: 'medium',
                        context: 'next_question',
                        delay: 2000,
                        targetSpeaker: SPEAKERS.NEHORI
                    },
                    user_speaking: {
                        trigger: 'smart',
                        priority: 'adaptive',
                        context: 'response_preparation',
                        delay: 1500,
                        targetSpeaker: 'both'
                    },
                    knowledge_confirmation: {
                        trigger: 'none',
                        priority: 'none',
                        context: 'none',
                        delay: 0,
                        targetSpeaker: 'none'
                    },
                    idle: {
                        trigger: 'none',
                        priority: 'none',
                        context: 'none',
                        delay: 0,
                        targetSpeaker: 'none'
                    }
                };
                
                return strategies[situation] || strategies.idle;
            }
        }
    }
};

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
            console.log(`🚫 知見確認モード終了処理中のためブロック (${context})`);
            return false;
        }
        
        // 🔄 質問生成スケジュール済みの重複防止
        if (control.questionGenerationScheduled) {
            console.log(`🚫 質問生成スケジュール中のためブロック (${context})`);
            return false;
        }
        
        // 🔄 最近の質問からの最小間隔チェック
        if (control.lastQuestionTime && Date.now() - control.lastQuestionTime < 2000) {
            console.log(`🚫 最近の質問から間隔が短いためブロック (${context})`);
            return false;
        }
        
        console.log(`✅ ねほりーの発話許可 (${context})`);
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
        
        console.log(`✅ はほりーの発話許可 (${context})`);
        return true;
    },
    
    // 発話開始を登録（Phase C強化版）
    registerSpeechStart(speaker, context = 'unknown') {
        console.log(`🎤 ${speaker}発話開始を登録 (${context})`);
        
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
        if (DualPreemptiveOptimization.phase1.isActive) {
            const situation = DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.NEHORI, null);
            const strategy = DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
            
            if (strategy.trigger !== 'none' && strategy.targetSpeaker === SPEAKERS.HAHORI) {
                setTimeout(() => {
                    startHahoriGenerationDuringNehori();
                }, strategy.delay);
            }
        }
        }
        
        // 🔧 Phase C: はほりーの場合の特別処理（状況適応版）
        if (speaker === SPEAKERS.HAHORI) {
            control.justPlayedPendingHahori = false;
            
            // 🔧 Phase C: はほりーの発声開始時にねほりーの先読みを開始（状況適応版）
            if (DualPreemptiveOptimization.phase1.isActive) {
                const situation = DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.HAHORI, null);
                const strategy = DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
                
                if (strategy.trigger !== 'none' && strategy.targetSpeaker === SPEAKERS.NEHORI) {
                    setTimeout(() => {
                        startNehoriGenerationDuringHahori();
                    }, strategy.delay);
                }
            }
        }
    },
    
    // 発話終了を登録
    registerSpeechEnd(speaker, context = 'unknown') {
        console.log(`🏁 ${speaker}発話終了を登録 (${context})`);
        
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
        console.log(`📝 知見確認モード開始 (${context})`);
        
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        state.isKnowledgeConfirmationMode = true;
        control.preventNehoriInterruption = true;
        
        // 進行中のネほりーの生成を停止
        if (VoiceOptimization.phase3.isGeneratingNehori) {
            console.log('🛑 進行中のネほりーの生成を停止');
            VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
        }
        
        // 🔧 Phase C: 進行中のはほりーの生成も停止
        if (DualPreemptiveOptimization.phase1.isGeneratingHahori) {
            console.log('🛑 進行中のはほりーの生成を停止');
            DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
        }
    },
    
    // 知見確認モードの終了（強化版）
    exitKnowledgeConfirmationMode(context = 'unknown') {
        console.log(`🏁 知見確認モード終了開始 (${context})`);
        
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
            playPendingHahoriIfNeeded();
            
            // フラグを解除
            setTimeout(() => {
                control.isExitingKnowledgeConfirmationMode = false;
            }, 100);
        }, 300);
        
        console.log(`🏁 知見確認モード終了処理完了 (${context})`);
    },
    
    // 🔧 最適化版: Pending統一管理システム（強化版）
    resumePendingNehoriIfNeeded(context = 'unknown') {
        const control = AppState.conversationControl;
        
        // 重複実行防止
        if (control.isResumeInProgress) {
            console.log('🔄 resumePendingNehoriIfNeeded 実行中のためスキップ');
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
                console.log(`🔄 Pendingネほりーを統一管理で再生 (${context}): ${pendingSources.source}`);
                
                // 安全な再生
                this.playUnifiedPendingNehori(pendingSources, context);
            } else {
                console.log('📝 Pendingデータがないため新しい質問を生成');
                
                // 質問生成スケジュールフラグをセット
                if (!control.questionGenerationScheduled) {
                    control.questionGenerationScheduled = true;
                    
                    // Pendingがない場合は新しい質問を生成
                    setTimeout(() => {
                        handleNehoriImmediatePlayback().catch(error => {
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
        
        if (DualPreemptiveOptimization.phase1.pendingHahoriContent && DualPreemptiveOptimization.phase1.pendingHahoriAudio) {
            return {
                hasPending: true,
                source: 'dualPreemptiveOptimization',
                question: DualPreemptiveOptimization.phase1.pendingHahoriContent,
                audio: DualPreemptiveOptimization.phase1.pendingHahoriAudio,
                clearFunction: () => {
                    DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
                    DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
                    DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
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
            
            console.log(`✅ 統一Pendingネほりーの再生が完了: ${pendingData.source}`);
            
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
        DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
        DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
        DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
        
        console.log('✅ 全Pendingデータのクリアが完了');
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
window.DualPreemptiveOptimization = DualPreemptiveOptimization;
window.startHahoriGenerationDuringNehori = startHahoriGenerationDuringNehori;
window.handleHahoriImmediatePlayback = handleHahoriImmediatePlayback;
window.playPendingHahoriIfNeeded = playPendingHahoriIfNeeded;

// 🔧 Phase C: 双方向先読みテスト機能
window.testDualPreemptiveSystem = async function() {
    console.log('🧪 双方向先読みシステムテスト開始');
    
    try {
        // 1. 状況分析テスト
        const situation = DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.NEHORI, null);
        console.log('📊 状況分析結果:', situation);
        
        // 2. 戦略決定テスト
        const strategy = DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        console.log('🎯 戦略決定結果:', strategy);
        
        // 3. Pending状態確認
        const pendingStatus = ConversationGatekeeper.getPendingStatus();
        console.log('📋 Pending状態:', pendingStatus);
        
        // 4. はほりーの先読み生成テスト（条件が満たされている場合のみ）
        if (AppState.phase === PHASES.DEEPDIVE && ConversationGatekeeper.canHahoriSpeak('test')) {
            console.log('🔄 はほりーの先読み生成テスト実行');
            await startHahoriGenerationDuringNehori();
        } else {
            console.log('⏸️ はほりーの先読み生成テストスキップ（条件未満）');
        }
        
        console.log('✅ 双方向先読みシステムテスト完了');
        return { success: true, situation, strategy, pendingStatus };
        
    } catch (error) {
        console.error('❌ 双方向先読みシステムテストエラー:', error);
        return { success: false, error: error.message };
    }
};

// 🔧 Phase C: 状況適応システムテスト機能
window.testAdaptiveStrategy = function() {
    console.log('🧪 状況適応システムテスト開始');
    
    const testCases = [
        { speaker: SPEAKERS.NEHORI, input: null, expected: 'nehori_speaking' },
        { speaker: SPEAKERS.HAHORI, input: null, expected: 'hahori_speaking' },
        { speaker: SPEAKERS.NULL, input: 'テスト入力', expected: 'user_speaking' },
        { speaker: SPEAKERS.NULL, input: '', expected: 'idle' }
    ];
    
    const results = testCases.map(testCase => {
        const actual = DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(
            testCase.speaker, 
            testCase.input
        );
        const strategy = DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(actual);
        
        return {
            testCase,
            actual,
            expected: testCase.expected,
            strategy,
            passed: actual === testCase.expected
        };
    });
    
    console.log('📊 状況適応システムテスト結果:', results);
    return results;
};

// 🔧 グローバルユーティリティ関数: Pending状態のデバッグ情報表示
function debugPendingStatus() {
    const status = ConversationGatekeeper.getPendingStatus();
    console.log('🔍 Pendingシステムデバッグ情報:', status);
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
    
    console.log('🔍 統一状態管理デバッグ情報:', flags);
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
        console.log('✅ レガシーフラグの移行が正常に完了しています');
        return { success: true, issues: [] };
    }
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
        console.log(`✅ ${message}`);
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
            console.log('✅ prompts.jsから音声設定を読み込みました');
        }
        
        // 次にカスタム設定ファイルがあれば読み込み
        if (window.CUSTOM_VOICE_CONFIG) {
            console.log('📄 カスタム音声設定ファイルを検出:', window.CUSTOM_VOICE_CONFIG);
            
            if (window.CUSTOM_VOICE_CONFIG.nehori) {
                Object.assign(VoiceSettings[SPEAKERS.NEHORI], window.CUSTOM_VOICE_CONFIG.nehori);
            }
            if (window.CUSTOM_VOICE_CONFIG.hahori) {
                Object.assign(VoiceSettings[SPEAKERS.HAHORI], window.CUSTOM_VOICE_CONFIG.hahori);
            }
            
            console.log('✅ カスタム音声設定ファイルを適用しました');
        }
        
        // 最後にローカルストレージの設定があれば上書き
        const savedConfig = localStorage.getItem('fukabori_voice_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('📄 ローカルストレージの音声設定を検出:', config);
            
            if (config.nehori) {
                Object.assign(VoiceSettings[SPEAKERS.NEHORI], config.nehori);
            }
            if (config.hahori) {
                Object.assign(VoiceSettings[SPEAKERS.HAHORI], config.hahori);
            }
            
            console.log('✅ ローカルストレージの音声設定を適用しました');
        }
        
        console.log('🎵 最終的な音声設定:', VoiceSettings);
        
        // 🆕 UIに設定を反映
        window.updateVoiceSettingsUI();
        
    } catch (error) {
        console.error('❌ 音声設定初期化エラー:', error);
    }
}

// 🆕 音声設定UIの更新関数

// =================================================================================
// LOGIN & AUTHENTICATION - ログイン・認証
// =================================================================================

function loginWithPassword() {
    console.log('💡 loginWithPassword が実行されました');
    
    const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
    if (!passwordInput) {
        ErrorHandler.handle(new Error('パスワード入力欄が見つかりません'), 'ログイン');
        return;
    }
    
    const password = passwordInput.value.trim();
    if (!password) {
        ErrorHandler.handle(new Error('パスワード未入力'), 'ログイン', 'パスワードを入力してください');
        return;
    }

    try {
        const decryptedKey = window.StorageManager.apiKey.load(password);
        AppState.apiKey = decryptedKey;
        
        // 🔄 新機能: ログイン状態を保存
        saveLoginState(true);
        
        // 🔧 マイク許可拒否状態のリセット（ログイン成功時に再試行を許可）
        localStorage.removeItem('microphonePermissionDenied');
        console.log('🎤 マイク許可拒否状態をリセットしました（再試行可能）');
        
        // 🔄 新機能: パスワード入力欄をクリア
        passwordInput.value = '';
        
        // 🔄 新機能: 2ステップUIを更新（従来のボタン制御から変更）
        update2StepUI();
        
        ErrorHandler.success('ログインに成功しました');
        console.log('✅ ログイン完了 - 状態を保存しました');
        
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        
        // 🔧 データ復旧を試行
        console.log('🔄 データ復旧を試行します...');
        const recoverySuccess = window.attemptDataRecovery(password);
        
        if (recoverySuccess) {
            console.log('✅ データ復旧成功 - 再度ログインを試行します');
            try {
                const decryptedKey = window.StorageManager.apiKey.load(password);
                AppState.apiKey = decryptedKey;
                
                saveLoginState(true);
                localStorage.removeItem('microphonePermissionDenied');
                passwordInput.value = '';
                update2StepUI();
                
                ErrorHandler.success('データ復旧完了！ログインに成功しました');
                console.log('✅ 復旧後ログイン完了');
                return;
            } catch (retryError) {
                console.error('❌ 復旧後ログイン失敗:', retryError);
            }
        }
        
        ErrorHandler.handle(error, 'ログイン', 'パスワードが間違っているか、保存されたAPIキーがありません');
    }
}

function openAdvancedSettings() {
    console.log('💡 openAdvancedSettings が実行されました');
    
    const modal = window.UIManager.DOMUtils.get('advancedSettingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        updateAdvancedSettingsDisplay();
        document.addEventListener('keydown', handleEscapeKey);
        console.log('✅ その他設定モーダルを開きました');
    } else {
        console.error('❌ モーダル要素が見つかりません');
    }
}

function closeAdvancedSettings() {
    console.log('💡 closeAdvancedSettings が実行されました');
    
    const modal = window.UIManager.DOMUtils.get('advancedSettingsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.removeEventListener('keydown', handleEscapeKey);
        console.log('✅ その他設定モーダルを閉じました');
    }
}


function saveVoicePreset() {
    try {
        console.log('💾 音声設定を保存中...');
        
        // 設定画面からプロンプトを取得
        const nehoriPrompt = window.UIManager.DOMUtils.get('nehoriPrompt');
        const hahoriPrompt = window.UIManager.DOMUtils.get('hahoriPrompt');
        
        if (!nehoriPrompt || !hahoriPrompt) {
            window.showMessage('error', 'プロンプト入力欄が見つかりません');
            return;
        }
        
        // VoiceSettingsを更新
        VoiceSettings[SPEAKERS.NEHORI].prompt = nehoriPrompt.value || '';
        VoiceSettings[SPEAKERS.HAHORI].prompt = hahoriPrompt.value || '';
        
        // ローカルストレージに保存
        const voiceConfig = {
            nehori: {
                ...VoiceSettings[SPEAKERS.NEHORI]
            },
            hahori: {
                ...VoiceSettings[SPEAKERS.HAHORI]
            },
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('fukabori_voice_config', JSON.stringify(voiceConfig));
        
        // configフォルダ用の設定ファイルも生成してダウンロード
        downloadVoiceConfig(voiceConfig);
        
        console.log('✅ 音声設定を保存しました');
        window.showMessage('success', '音声設定を保存しました（voice_config.jsファイルもダウンロードされました）');
        
    } catch (error) {
        console.error('❌ 音声設定保存エラー:', error);
        window.showMessage('error', '音声設定の保存に失敗しました');
    }
}

function downloadVoiceConfig(config) {
    try {
        // JavaScriptファイル形式で出力
        const jsContent = `// 深堀くん - カスタム音声設定
// 生成日時: ${config.lastUpdated}

window.CUSTOM_VOICE_CONFIG = ${JSON.stringify(config, null, 2)};

// 設定の自動適用
if (typeof window !== 'undefined' && window.VoiceSettings) {
    Object.assign(window.VoiceSettings.nehori, window.CUSTOM_VOICE_CONFIG.nehori);
    Object.assign(window.VoiceSettings.hahori, window.CUSTOM_VOICE_CONFIG.hahori);
    console.log('✅ カスタム音声設定を適用しました');
}
`;

        const blob = new Blob([jsContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'voice_config.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('📁 voice_config.jsファイルをダウンロードしました');
        
    } catch (error) {
        console.error('❌ 設定ファイルダウンロードエラー:', error);
    }
}

function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeAdvancedSettings();
    }
}

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
        console.log(`🎤 音声短縮実行: ${displayText.length}文字 → ${textForSpeech.length}文字 (${reductionRate}%短縮)`);
        console.log(`📝 表示: ${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}`);
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
    console.log('🎤 マイク初期化開始', { forceRecheck });
    
    // 🛡️ 重複リクエスト防止（絶対ルール）
    if (AppState.voiceRecognitionStability.permissionRequestInProgress) {
        console.log('🚫 マイク許可リクエストが既に進行中 - 重複防止');
        return AppState.voiceRecognitionStability.micPermissionGranted;
    }
    
    // 🛡️ 既に許可取得済みの場合は絶対に再取得しない
    if (AppState.voiceRecognitionStability.micPermissionGranted && !forceRecheck) {
        console.log('✅ マイク許可は既に取得済み - 再取得はしません');
        await initializeSpeechRecognition();
        return true;
    }
    
    AppState.voiceRecognitionStability.permissionRequestInProgress = true;
    
    try {
        // 🛡️ 保存された許可状態を最優先で確認
        const storedPermission = localStorage.getItem('microphonePermissionGranted');
        const hasStoredPermission = storedPermission === 'true';
        
        if (hasStoredPermission && !forceRecheck) {
            console.log('✅ 保存されたマイク許可を使用 - 新たな許可要求はしません');
            AppState.voiceRecognitionStability.micPermissionGranted = true;
        } else {
            // 🛡️ マイク許可は一回だけ - 絶対ルール
            console.log('🔄 マイク許可を一回だけ取得します（絶対ルール遵守）');
            
            // 🛡️ 許可状態を事前チェック
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
            if (permissionStatus && permissionStatus.state === 'granted') {
                console.log('✅ ブラウザレベルでマイク許可済み');
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
                    console.log('✅ マイク許可を一回だけ取得し、永続保存しました');
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
    console.log(`🔍 統合音声認識開始試行: ${reason}`);
    
    // 🛡️ 統合システムを使用
    if (window.stateManager && window.stateManager.recognitionManager) {
        console.log('✅ 統合システムで開始');
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
        console.log('✅ 音声認識は既に停止しています');
        return true;
    }
    
    try {
        AppState.speechRecognition.abort();
        stability.isRecognitionActive = false;
        console.log('✅ 音声認識を停止しました');
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
    
    // 🛡️ マイク許可状態の厳格チェック
    const permissionDenied = localStorage.getItem('microphonePermissionDenied') === 'true';
    if (permissionDenied) {
        console.log('🚫 マイク許可が拒否済み - 再開をスキップ');
        return;
    }
    
    // 🔧 新システムの許可状態も確認
    const newSystemPermission = window.stateManager?.permissionManager?.state === 'granted';
    const legacyPermission = stability.micPermissionGranted;
    
    if (!legacyPermission && !newSystemPermission) {
        console.log('📵 マイク許可未取得のため再開をスキップ');
        return;
    }
    
    if (newSystemPermission && !legacyPermission) {
        console.log('🔄 新システムの許可状態を旧システムに同期');
        stability.micPermissionGranted = true;
    }
    
    setTimeout(() => {
        // 🛡️ 再開時にも許可状態を再確認
        const currentPermissionDenied = localStorage.getItem('microphonePermissionDenied') === 'true';
        if (stability.micPermissionGranted && !currentPermissionDenied) {
            safeStartSpeechRecognition('restartSpeechRecognition');
        } else {
            console.log('🚫 再開時の許可チェックでNG - スキップ');
        }
    }, 500);
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
        console.log('✅ 文字起こしをクリアしました');
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
            case PHASES.WARMUP:
                await processWarmupUserResponse(text);
                break;
            case PHASES.DEEPDIVE:
                await processDeepdiveUserResponse(text);
                break;
            case PHASES.SUMMARY:
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

    AppState.phase = PHASES.DEEPDIVE;
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
            
            console.log('🔍 音声ベース知見評価システム開始...');
            const voiceResult = await VoiceKnowledgeSystem.processKnowledgeWithVoiceEvaluation(text, conversationContext);
            
            // voiceResultがnullの場合は手動確認待機中（音声応答待ち）
            if (voiceResult === null) {
                // 左ペインの音声コマンド表示を更新
                updateVoiceCommandsDisplay();
                // 右ペインの統計表示を更新
                updateKnowledgeSettingsDisplay();
                // 🚫 重要: 知見確認待機中はねほりーのの次の質問を生成しない
                console.log('🔄 知見確認待機中 - ねほりーのの質問生成を停止');
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
                    console.log('✅ 知見ファイルシステムに保存完了');
                }
                
                window.updateKnowledgeDisplay();
                updateKnowledgeSettingsDisplay();
                
                // 次の質問へ
                await askNextQuestionInDeepDive();
                
            } else {
                // ❌ 知見が却下された場合
                console.log(`❌ 知見却下: ${voiceResult.reason}`);
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
    console.log('🎤 音声ベース知見確認:', text);
    
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

async function startSession() {
    console.log('💡 startSession が実行されました');
    
    // 🛡️ マイク許可の事前チェック（絶対ルール）
    const permissionDenied = localStorage.getItem('microphonePermissionDenied') === 'true';
    if (permissionDenied) {
        window.showMessage('error', 'マイクの使用許可が拒否されています。ブラウザの設定で許可し、ページを再読み込みしてください。');
        return;
    }
    
    // 🔄 新機能: 2ステップ完了確認
    const status = evaluate2StepStatus();
    if (!status.allComplete) {
        if (!status.loginComplete) {
            window.showMessage('error', 'ログインを完了してください');
            focusPasswordInput();
        } else {
            window.showMessage('error', 'テーマを入力してください');
            focusThemeInput();
        }
        return;
    }
    
    if (!AppState.apiKey) {
        window.showMessage('error', 'APIキーを設定してください');
        return;
    }

    const themeInput = window.UIManager.DOMUtils.get('themeInput');
    if (!themeInput) {
        window.showMessage('error', 'テーマ入力欄が見つかりません');
        return;
    }

    const theme = themeInput.value;
    if (!theme.trim()) {
        window.showMessage('error', 'テーマを入力してください');
        return;
    }

    // 🔧 AppState初期化を最優先で実行
    AppState.currentTheme = theme.trim();
    AppState.sessionActive = true;
    AppState.phase = PHASES.WARMUP;
    AppState.sessionStartTime = new Date();
    
    console.log('✅ セッション状態を有効化:', {
        sessionActive: AppState.sessionActive,
        phase: AppState.phase,
        currentTheme: AppState.currentTheme
    });

    // 🔄 知見管理システムとの連携
    await initializeKnowledgeSession(theme.trim());

    const setupPanel = window.UIManager.DOMUtils.get('setupPanel');
    const chatArea = window.UIManager.DOMUtils.get('chatArea');
    
    if (setupPanel) {
        setupPanel.classList.add('hidden');
    }
    if (chatArea) {
        chatArea.classList.remove('hidden');
    }
    
    updateSessionStatus('ウォームアップ中', AppState.currentTheme);
    window.updateKnowledgeDisplay();
    
    // 🛡️ マイク初期化（AppState初期化後に実行）
    const micInitialized = await initializeMicrophoneRecording();
    if (!micInitialized) {
        window.showMessage('error', 'マイクの初期化に失敗しました。音声機能を使用できません。');
        return;
    }
    
    await startWarmupPhase();
}

async function startWarmupPhase() {
    updateSessionStatus('ウォームアップ中', AppState.currentTheme);
    AppState.transcriptHistory = [];
    AppState.currentTranscript = '';
    window.updateTranscriptDisplay();
    try {
        // 🎤 新システム: セッション開始時の音声認識初期化
        if (window.stateManager) {
            const started = await window.stateManager.startRecognition();
            if (started) {
                console.log('✅ セッション開始時に音声認識を開始しました（新システム）');
            } else {
                console.log('⚠️ セッション開始時の音声認識開始に失敗（新システム）');
            }
        } else {
            console.error('❌ StateManagerが未初期化');
        }
        const hahoriGreeting = `私は進行役の「はほりーの」です。本日は貴重なお時間をいただき、ありがとうございます。ねほりーのと一緒に、あなたの経験から価値ある知見を抽出させていただきます。`;
        const nehoriGreeting = `こんにちは！深掘りAI「ねほりーの」です。今日は「${AppState.currentTheme}」について、深く掘り下げてお話を聞かせていただきたいと思います。まず、簡単に自己紹介をお願いできますか？`;
        await addMessageToChat(SPEAKERS.HAHORI, hahoriGreeting);
        const [hahoriAudio, nehoriAudio] = await Promise.all([
            ttsTextToAudioBlob(hahoriGreeting, SPEAKERS.HAHORI),
            ttsTextToAudioBlob(nehoriGreeting, SPEAKERS.NEHORI)
        ]);
        await playPreGeneratedAudio(hahoriAudio, SPEAKERS.HAHORI);
        await addMessageToChat(SPEAKERS.NEHORI, nehoriGreeting);
        await playPreGeneratedAudio(nehoriAudio, SPEAKERS.NEHORI);
        // 🎤 新システム: 挨拶後の音声認識開始
        if (window.stateManager) {
            await window.stateManager.startRecognition();
            console.log('✅ 挨拶後の音声認識開始完了（新システム）');
        } else {
            console.error('❌ StateManagerが未初期化');
        }
    } catch (error) {
        console.error('❌ ウォームアップ質問生成エラー:', error);
        window.showMessage('error', '質問の生成に失敗しました');
    }
}





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
        
        console.log(`✅ メッセージ追加: ${speakerName} - ${message.substring(0, 50)}...`);
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
        console.log(`🎵 音声登録: ${speaker} (ID: ${audioData.id})`);
        
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
        console.log(`🔇 音声登録解除: ${audioData.speaker} (ID: ${audioData.id})`);
    },
    
    // 全音声強制停止
    forceStopAllAudio(reason = 'user_request') {
        console.log(`🛑 全音声強制停止開始: ${reason} (対象: ${this.activeAudioSources.size}件)`);
        
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
        
        console.log(`✅ 全音声停止完了: ${stoppedCount}件停止 (理由: ${reason})`);
        
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
        
        console.log(`✅ ${speaker}音声停止完了: ${stoppedCount}件 (理由: ${reason})`);
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
async function startNehoriGenerationDuringHahori() {
    // 🛡️ 初期条件チェック
    if (VoiceOptimization.phase3.isGeneratingNehori || AppState.phase !== PHASES.DEEPDIVE) {
        return;
    }
    
    // 🛡️ ゲートキーパーチェック - 生成前の許可確認
    if (!ConversationGatekeeper.canNehoriSpeak('generationStart')) {
        console.log('🚫 ねほりーの質問生成をゲートキーパーがブロック');
        return;
    }
    
    const control = AppState.conversationControl;
    VoiceOptimization.phase3.isGeneratingNehori = true;
    VoiceOptimization.phase3.shouldPlayNehoriImmediately = true;
    
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
        
        const nehoriContent = await gptMessagesToCharacterResponse([
            { role: 'user', content: nextQuestionPrompt }
        ], SPEAKERS.NEHORI);
        const nehoriAudio = await ttsTextToAudioBlob(nehoriContent, SPEAKERS.NEHORI);
        
        VoiceOptimization.phase3.pendingNehoriContent = nehoriContent;
        VoiceOptimization.phase3.pendingNehoriAudio = nehoriAudio;
        VoiceOptimization.phase3.isGeneratingNehori = false;
        
        // 🛡️ 生成完了後の再チェック - 状態が変わった可能性
        if (!ConversationGatekeeper.canNehoriSpeak('generationComplete')) {
            console.log('🔄 生成完了後にPendingに保存（知見確認モード等）');
            control.pendingNehoriQuestion = nehoriContent;
            control.pendingNehoriAudio = nehoriAudio;
            return;
        }
        
        // ✅ 安全な再生
        await handleNehoriImmediatePlayback();
        
    } catch (error) {
        console.error('❌ ねほりーの質問生成エラー:', error);
        VoiceOptimization.phase3.isGeneratingNehori = false;
        VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
    }
}

// 🔧 改善版: ゲートキーパー対応のねほりーの即座再生
async function handleNehoriImmediatePlayback() {
    // 🛡️ ゲートキーパーチェック - 再生前の許可確認
    if (!ConversationGatekeeper.canNehoriSpeak('immediatePlayback')) {
        console.log('🚫 ねほりーの即座再生をゲートキーパーがブロック');
        return;
    }
    
    const control = AppState.conversationControl;
    
    try {
        // 📋 AppState.pendingからの再生（レガシー対応）
        if (AppState.pendingNehoriQuestion && AppState.pendingNehoriAudio) {
            console.log('🔄 AppState.pendingからねほりーのを再生');
            
            ConversationGatekeeper.registerSpeechStart(SPEAKERS.NEHORI, 'appStatePending');
            
            await addMessageToChat(SPEAKERS.NEHORI, AppState.pendingNehoriQuestion);
            await playPreGeneratedAudio(AppState.pendingNehoriAudio, SPEAKERS.NEHORI);
            
            // クリアアップ
            AppState.pendingNehoriQuestion = null;
            AppState.pendingNehoriAudio = null;
            control.justPlayedPendingNehori = true;
            
            ConversationGatekeeper.registerSpeechEnd(SPEAKERS.NEHORI, 'appStatePending');
            
            // 短時間後にフラグをリセット
            setTimeout(() => { control.justPlayedPendingNehori = false; }, 100);
            return;
        }
        
        // 📋 conversationControlからの再生（新システム）
        if (control.pendingNehoriQuestion && control.pendingNehoriAudio) {
            console.log('🔄 conversationControlからねほりーのを再生');
            
            ConversationGatekeeper.registerSpeechStart(SPEAKERS.NEHORI, 'controlPending');
            
            await addMessageToChat(SPEAKERS.NEHORI, control.pendingNehoriQuestion);
            await playPreGeneratedAudio(control.pendingNehoriAudio, SPEAKERS.NEHORI);
            
            // クリアアップ
            control.pendingNehoriQuestion = null;
            control.pendingNehoriAudio = null;
            control.justPlayedPendingNehori = true;
            
            ConversationGatekeeper.registerSpeechEnd(SPEAKERS.NEHORI, 'controlPending');
            
            // 短時間後にフラグをリセット
            setTimeout(() => { control.justPlayedPendingNehori = false; }, 100);
            return;
        }
        
        // 📋 Phase3最適化からの再生
        if (VoiceOptimization.phase3.pendingNehoriContent && VoiceOptimization.phase3.pendingNehoriAudio) {
            console.log('🔄 Phase3最適化からねほりーのを再生');
            
            ConversationGatekeeper.registerSpeechStart(SPEAKERS.NEHORI, 'phase3Optimization');
            
            await addMessageToChat(SPEAKERS.NEHORI, VoiceOptimization.phase3.pendingNehoriContent);
            await playPreGeneratedAudio(VoiceOptimization.phase3.pendingNehoriAudio, SPEAKERS.NEHORI);
            
            // クリアアップ
            VoiceOptimization.phase3.pendingNehoriContent = null;
            VoiceOptimization.phase3.pendingNehoriAudio = null;
            VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
            control.justPlayedPendingNehori = true;
            
            ConversationGatekeeper.registerSpeechEnd(SPEAKERS.NEHORI, 'phase3Optimization');
            
            // 短時間後にフラグをリセット
            setTimeout(() => { control.justPlayedPendingNehori = false; }, 100);
            return;
        }
        
        // 📋 Pendingがない場合は新しい質問を生成
        console.log('📝 Pendingがないため新しい質問を生成');
        await askNextQuestionInDeepDive();
        
    } catch (error) {
        console.error('❌ ねほりーの再生エラー:', error);
        ConversationGatekeeper.registerSpeechEnd(SPEAKERS.NEHORI, 'error');
    }
}

async function generateAndPlayNehoriImmediately() {
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
        const nehoriContent = await gptMessagesToCharacterResponse([
            { role: 'user', content: nextQuestionPrompt }
        ], SPEAKERS.NEHORI);
        const nehoriAudio = await ttsTextToAudioBlob(nehoriContent, SPEAKERS.NEHORI);
        if (isConfirmation) {
            AppState.pendingNehoriQuestion = nehoriContent;
            AppState.pendingNehoriAudio = nehoriAudio;
            return;
        }
        await addMessageToChat(SPEAKERS.NEHORI, nehoriContent);
        await playPreGeneratedAudio(nehoriAudio, SPEAKERS.NEHORI);
        AppState.waitingForPermission = true;
    } catch (error) {
        await askNextQuestionInDeepDive();
    }
}

// 知見確認モード解除時にpendingNehoriQuestion/pendingNehoriAudioがあれば即座に再生
// 🔧 改善版: ゲートキーパー対応のPendingねほりーの再生
function playPendingNehoriIfNeeded() {
    console.log('🔍 Pendingねほりーのの再生チェック');
    
    // 🛡️ ゲートキーパーによる統一チェック
    if (!ConversationGatekeeper.canNehoriSpeak('pendingPlayback')) {
        console.log('🚫 ゲートキーパーによりPendingねほりーのの再生をブロック');
        return;
    }
    
    const control = AppState.conversationControl;
    
    // 📋 AppState.pendingまたはconversationControl.pendingからの再生
    const hasAppStatePending = AppState.pendingNehoriQuestion && AppState.pendingNehoriAudio;
    const hasControlPending = control.pendingNehoriQuestion && control.pendingNehoriAudio;
    
    if (hasAppStatePending || hasControlPending) {
        console.log('🔄 Pendingねほりーのを安全に再生');
        
        // ゲートキーパーシステムを通じて安全に再生
        ConversationGatekeeper.resumePendingNehoriIfNeeded('playPendingCall');
    } else {
        console.log('📝 Pendingデータがないため新しい質問を生成');
        // Pendingがない場合は新しい質問を生成
        handleNehoriImmediatePlayback().catch(error => {
            console.error('❌ ねほりーの質問生成エラー:', error);
        });
    }
}

// 🔧 Phase C: はほりーの先読み生成機能
async function startHahoriGenerationDuringNehori() {
    // 🛡️ 初期条件チェック
    if (DualPreemptiveOptimization.phase1.isGeneratingHahori || AppState.phase !== PHASES.DEEPDIVE) {
        return;
    }
    
    // 🛡️ ゲートキーパーチェック - 生成前の許可確認
    if (!ConversationGatekeeper.canHahoriSpeak('generationStart')) {
        console.log('🚫 はほりーの応答生成をゲートキーパーがブロック');
        return;
    }
    
    const control = AppState.conversationControl;
    DualPreemptiveOptimization.phase1.isGeneratingHahori = true;
    DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = true;
    
    try {
        const recentConversation = AppState.conversationHistory
            .slice(-6)
            .map(msg => `${msg.sender}: ${msg.content}`)
            .join('\n');
        const knowledgeContext = AppState.extractedKnowledge
            .map((knowledge, index) => `知見${index + 1}: ${knowledge.summary}`)
            .join('\n');
            
        // 🔧 Phase C: はほりーの用の応答生成プロンプト
        const hahoriResponsePrompt = `テーマ「${AppState.currentTheme}」についての深掘り会話が進行中です。

最近の会話内容:
${recentConversation}

抽出された知見:
${knowledgeContext}

あなたは「はほりーの」です。ねほりーのの質問に対するユーザーの回答を聞いた後、以下のような応答を準備してください：

1. ユーザーの回答に対する共感や理解を示す
2. 回答内容を簡潔にまとめる
3. 必要に応じて追加の質問を促す
4. 会話の流れを自然に保つ

200文字以内で、親しみやすく、聞き手に寄り添うような応答を生成してください。`;

        const hahoriContent = await gptMessagesToCharacterResponse([
            { role: 'user', content: hahoriResponsePrompt }
        ], SPEAKERS.HAHORI);
        const hahoriAudio = await ttsTextToAudioBlob(hahoriContent, SPEAKERS.HAHORI);
        
        DualPreemptiveOptimization.phase1.pendingHahoriContent = hahoriContent;
        DualPreemptiveOptimization.phase1.pendingHahoriAudio = hahoriAudio;
        DualPreemptiveOptimization.phase1.isGeneratingHahori = false;
        
        // 🛡️ 生成完了後の再チェック - 状態が変わった可能性
        if (!ConversationGatekeeper.canHahoriSpeak('generationComplete')) {
            console.log('🔄 生成完了後にPendingに保存（知見確認モード等）');
            control.pendingHahoriContent = hahoriContent;
            control.pendingHahoriAudio = hahoriAudio;
            return;
        }
        
        // ✅ 安全な再生
        await handleHahoriImmediatePlayback();
        
    } catch (error) {
        console.error('❌ はほりーの応答生成エラー:', error);
        DualPreemptiveOptimization.phase1.isGeneratingHahori = false;
        DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
    }
}

// 🔧 Phase C: ゲートキーパー対応のはほりーの即座再生
async function handleHahoriImmediatePlayback() {
    // 🛡️ ゲートキーパーチェック - 再生前の許可確認
    if (!ConversationGatekeeper.canHahoriSpeak('immediatePlayback')) {
        console.log('🚫 はほりーの即座再生をゲートキーパーがブロック');
        return;
    }
    
    const control = AppState.conversationControl;
    
    try {
        // 📋 conversationControl.pendingからの再生
        if (control.pendingHahoriContent && control.pendingHahoriAudio) {
            console.log('🔄 conversationControl.pendingからはほりーのを再生');
            
            ConversationGatekeeper.registerSpeechStart(SPEAKERS.HAHORI, 'controlPendingHahori');
            
            await addMessageToChat(SPEAKERS.HAHORI, control.pendingHahoriContent);
            await playPreGeneratedAudio(control.pendingHahoriAudio, SPEAKERS.HAHORI);
            
            // クリアアップ
            control.pendingHahoriContent = null;
            control.pendingHahoriAudio = null;
            control.justPlayedPendingHahori = true;
            
            ConversationGatekeeper.registerSpeechEnd(SPEAKERS.HAHORI, 'controlPendingHahori');
            
            // 短時間後にフラグをリセット
            setTimeout(() => { control.justPlayedPendingHahori = false; }, 100);
            return;
        }
        
        // 📋 DualPreemptiveOptimizationからの再生
        if (DualPreemptiveOptimization.phase1.pendingHahoriContent && DualPreemptiveOptimization.phase1.pendingHahoriAudio) {
            console.log('🔄 DualPreemptiveOptimizationからはほりーのを再生');
            
            ConversationGatekeeper.registerSpeechStart(SPEAKERS.HAHORI, 'dualPreemptiveOptimization');
            
            await addMessageToChat(SPEAKERS.HAHORI, DualPreemptiveOptimization.phase1.pendingHahoriContent);
            await playPreGeneratedAudio(DualPreemptiveOptimization.phase1.pendingHahoriAudio, SPEAKERS.HAHORI);
            
            // クリアアップ
            DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
            DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
            DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
            control.justPlayedPendingHahori = true;
            
            ConversationGatekeeper.registerSpeechEnd(SPEAKERS.HAHORI, 'dualPreemptiveOptimization');
            
            // 短時間後にフラグをリセット
            setTimeout(() => { control.justPlayedPendingHahori = false; }, 100);
            return;
        }
        
        // 📋 Pendingがない場合は何もしない（はほりーのは状況に応じて発声）
        console.log('📝 はほりーののPendingデータがないため何もしない');
        
    } catch (error) {
        console.error('❌ はほりーの再生エラー:', error);
        ConversationGatekeeper.registerSpeechEnd(SPEAKERS.HAHORI, 'error');
    }
}

// 🔧 Phase C: Pendingはほりーのの再生チェック
function playPendingHahoriIfNeeded() {
    console.log('🔍 Pendingはほりーのの再生チェック');
    
    // 🛡️ ゲートキーパーによる統一チェック
    if (!ConversationGatekeeper.canHahoriSpeak('pendingPlayback')) {
        console.log('🚫 ゲートキーパーによりPendingはほりーのの再生をブロック');
        return;
    }
    
    const control = AppState.conversationControl;
    
    // 📋 conversationControl.pendingまたはDualPreemptiveOptimizationからの再生
    const hasControlPending = control.pendingHahoriContent && control.pendingHahoriAudio;
    const hasDualPending = DualPreemptiveOptimization.phase1.pendingHahoriContent && DualPreemptiveOptimization.phase1.pendingHahoriAudio;
    
    if (hasControlPending || hasDualPending) {
        console.log('🔄 Pendingはほりーのを安全に再生');
        
        // 安全に再生
        handleHahoriImmediatePlayback().catch(error => {
            console.error('❌ はほりーの再生エラー:', error);
        });
    } else {
        console.log('📝 はほりーののPendingデータがない');
    }
}

// =================================================================================
// DATA EXPORT - データエクスポート
// =================================================================================

function downloadMarkdownReport() {
    console.log('💡 downloadMarkdownReport が実行されました');
    
    try {
        const markdown = generateMarkdownReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `深堀セッション_${timestamp}.md`;
        
        downloadTextFile(markdown, filename);
        
        window.showMessage('success', 'レポートをダウンロードしました');
        console.log('✅ レポートダウンロード完了');
        
    } catch (error) {
        ErrorHandler.handle(error, 'レポートダウンロード');
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
    console.log('💡 exportAllData が実行されました（downloadAllKnowledgeへリダイレクト）');
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

// 📊 2ステップ状態の評価
function evaluate2StepStatus() {
    const loginComplete = window.StorageManager.login.load() && AppState.apiKey;
    const themeComplete = window.StorageManager.theme.loadInput().trim() !== '';
    
    return {
        loginComplete,
        themeComplete,
        allComplete: loginComplete && themeComplete
    };
}

// 🔄 2ステップUI更新機能

// 🎯 フォーカス制御関数
function focusPasswordInput() {
    const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
    if (passwordInput) {
        passwordInput.focus();
        passwordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function focusThemeInput() {
    const themeInput = window.UIManager.DOMUtils.get('themeInput');
    if (themeInput) {
        themeInput.focus();
        themeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 🚪 ログイン状態クリア処理
function handleLogout() {
    const confirmed = confirm('ログイン状態をクリアしますか？\nAPIキーとログイン状態がクリアされます。');
    if (confirmed) {
        try {
            // ログイン状態をクリア
            clearLoginState();
            AppState.apiKey = null;
            
            // パスワード入力欄をクリア
            const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
            if (passwordInput) {
                passwordInput.value = '';
            }
            
            // UI更新
            update2StepUI();
            
            console.log('✅ ログイン状態クリア完了');
            window.showMessage('success', 'ログイン状態をクリアしました');
        } catch (error) {
            console.error('❌ ログイン状態クリアエラー:', error);
            window.showMessage('error', 'ログイン状態のクリア中にエラーが発生しました');
        }
    }
}

// 🗑️ テーマクリア処理
function handleThemeClear() {
    const confirmed = confirm('テーマ設定をクリアしますか？');
    if (confirmed) {
        try {
            // テーマ入力状態をクリア
            clearThemeInputState();
            
            // テーマ入力欄をクリア
            const themeInput = window.UIManager.DOMUtils.get('themeInput');
            if (themeInput) {
                themeInput.value = '';
            }
            
            // UI更新
            update2StepUI();
            
            console.log('✅ テーマクリア完了');
            window.showMessage('success', 'テーマ設定をクリアしました');
        } catch (error) {
            console.error('❌ テーマクリアエラー:', error);
            window.showMessage('error', 'テーマクリア中にエラーが発生しました');
        }
    }
}

// 🚀 セッション開始ボタンの状態更新
function updateSessionStartButton(allComplete) {
    const startButton = window.UIManager.DOMUtils.get('startButton');
    const startButtonSubText = window.UIManager.DOMUtils.get('startButtonSubText');
    const sessionStartSection = window.UIManager.DOMUtils.get('sessionStartSection');
    
    // Step0時は非表示、Step1以降で表示
    const isApiKeyConfigured = window.isApiKeyConfigured ? window.isApiKeyConfigured() : false;
    
    if (sessionStartSection) {
        if (isApiKeyConfigured) {
            sessionStartSection.style.display = 'flex';
        } else {
            sessionStartSection.style.display = 'none';
            return; // Step0時は処理終了
        }
    }
    
    if (startButton) {
        if (allComplete) {
            // Step1・2完了時
            startButton.disabled = false;
            startButton.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
            // サブテキストを削除
            if (startButtonSubText) {
                startButtonSubText.style.display = 'none';
            }
        } else {
            // 未完了時
            startButton.disabled = true;
            startButton.style.background = '';
            // サブテキストを表示
            if (startButtonSubText) {
                startButtonSubText.style.display = 'block';
                startButtonSubText.textContent = 'Step1・2完了後開始できます';
            }
        }
    }
}

// 🔄 アプリケーション状態復元機能
async function restoreApplicationState() {
    try {
        console.log('📋 アプリケーション状態復元開始...');
        
        // 1. ログイン状態の復元
        const isLoggedIn = loadLoginState();
        if (isLoggedIn) {
            console.log('🔐 ログイン状態を復元中...');
            // 保存されたAPIキーがあるかチェック
            const savedHashes = getPasswordHashList();
            if (savedHashes.length > 0) {
                // APIキーは既に暗号化されているので、ここでは状態のみ設定
                console.log('✅ ログイン状態復元: APIキーが保存されています');
                // 注意: AppState.apiKeyは実際のパスワード入力時に設定される
            } else {
                // 保存されたAPIキーがない場合はログイン状態をクリア
                clearLoginState();
                console.log('⚠️ APIキーが見つからないため、ログイン状態をクリア');
            }
        }
        
        // 2. テーマ入力状態の復元
        const savedTheme = loadThemeInputState();
        if (savedTheme) {
            const themeInput = window.UIManager.DOMUtils.get('themeInput');
            if (themeInput) {
                themeInput.value = savedTheme;
                console.log(`🎨 テーマ入力状態復元: "${savedTheme}"`);
            }
        }
        
        // 3. 音声ベース知見評価設定の復元
        loadKnowledgeSettings();
        updateKnowledgeSettingsDisplay();
        console.log('🎯 音声ベース知見評価設定復元完了');
        
        // 4. 2ステップUIの初期更新
        update2StepUI();
        
        // 5. ファイル入力の初期状態設定
        setTimeout(() => {
            updateFileInputDisplay();
        }, 100);
        
        console.log('✅ アプリケーション状態復元完了');
        
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
    console.log('💡 setupApiKey が実行されました');
    
    const elements = window.UIManager.DOMUtils.getAll(['apiKeyInput', 'apiPasswordInput', 'testApiButton', 'startButton']);
    
    if (!elements.apiKeyInput || !elements.apiPasswordInput) {
        ErrorHandler.handle(new Error('DOM要素が見つかりません'), 'APIキー設定', '入力欄が見つかりません');
        return;
    }
    
    const apiKey = elements.apiKeyInput.value.trim();
    const password = elements.apiPasswordInput.value.trim();
    
    if (!password) {
        ErrorHandler.handle(new Error('パスワード未入力'), 'APIキー設定', 'パスワードを入力してください');
        return;
    }
    
    if (apiKey && !apiKey.startsWith('sk-')) {
        ErrorHandler.handle(new Error('無効なAPIキー'), 'APIキー設定', '正しいOpenAI APIキーを入力してください (sk-...で始まる)');
        return;
    }
    
    try {
        if (apiKey) {
            console.log('🔍 新しいAPIキーの接続テストを実行中...');
            
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
                ErrorHandler.success('✅ APIキー接続テスト成功！暗号化保存されました');
                elements.apiKeyInput.value = '';
                
                updateApiKeyStatusDisplay();
                
                if (elements.startButton) {
                    elements.startButton.disabled = false;
                    console.log('✅ セッション開始ボタンを有効化しました');
                }
            } else {
                AppState.apiKey = null;
                ErrorHandler.handle(new Error('APIキー接続テスト失敗'), 'APIキー設定', '❌ APIキーが無効です。正しいキーを入力してください');
                
                if (elements.startButton) {
                    elements.startButton.disabled = true;
                }
                return;
            }
        } else {
            console.log('🔍 保存済みAPIキーの読み込みと接続テスト中...');
            window.showMessage('info', '保存済みAPIキーの接続テスト中...');
            
            const decryptedKey = loadEncryptedApiKey(password);
            AppState.apiKey = decryptedKey;
            
            const isValid = await testApiConnection();
            
            if (isValid) {
                ErrorHandler.success('✅ 保存されたAPIキーを読み込みました（接続確認済み）');
                
                if (elements.startButton) {
                    elements.startButton.disabled = false;
                    console.log('✅ セッション開始ボタンを有効化しました');
                }
            } else {
                AppState.apiKey = null;
                ErrorHandler.handle(new Error('保存済みAPIキーが無効'), 'APIキー設定', '❌ 保存されたAPIキーが無効です。新しいキーを設定してください');
                
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
        
        console.log('✅ APIキー設定完了');
        
    } catch (error) {
        AppState.apiKey = null;
        
        if (elements.startButton) {
            elements.startButton.disabled = true;
        }
        
        ErrorHandler.handle(error, 'APIキー設定');
    }
}

async function testApiConnection() {
    console.log('🔍 testApiConnection が実行されました');
    
    if (!AppState.apiKey) {
        console.log('APIキーが設定されていません');
        return false;
    }
    
    try {
        console.log('API接続テストを開始します');
        
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
            console.log('✅ API接続テスト成功');
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
    console.log('💡 testApiKey が実行されました');
    
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
            console.log('✅ セッション開始ボタンを有効化しました');
        }
    } else {
        window.showMessage('error', 'API接続失敗：キーが無効です');
        
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.disabled = true;
            console.log('❌ セッション開始ボタンを無効化しました');
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
        console.log('💡 clearApiKey が実行されました');
        
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
            console.log('✅ APIキー削除完了');
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
        console.log('💡 changePassword が実行されました');
        
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
        console.log('🔐 パスワード変更完了');
        
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
    console.log('💡 toggleMicrophone が実行されました');
    
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
    console.log('🎤 音声認識を開始します（新システム）');
    
    if (!stateManager) {
        console.error('❌ StateManagerが未初期化');
        return;
    }
    
    stateManager.startRecognition();
}

function stopRealtimeRecognition() {
    console.log('🎤 音声認識を停止します（新システム）');
    
    if (!stateManager) {
        console.error('❌ StateManagerが未初期化');
        return;
    }
    
    stateManager.stopRecognition();
}


function forceStopAllActivity() {
    console.log('💡 forceStopAllActivity が実行されました');
    
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

async function generateFinalSummary() {
    console.log('🎭 はほりーのによる最終まとめを生成中...');
    
    try {
        const knowledgeCount = AppState.extractedKnowledge.length;
        const summaryPrompt = window.AI_PROMPTS?.SESSION_SUMMARY ? 
            window.AI_PROMPTS.SESSION_SUMMARY(
                AppState.currentTheme, 
                AppState.conversationHistory, 
                AppState.extractedKnowledge
            ) :
            `テーマ「${AppState.currentTheme}」について行った深掘りインタビューのセッション全体を振り返り、抽出された${knowledgeCount}件の知見をまとめて最終的な感謝の言葉を述べてください。`;
        
        const summaryMessage = await gptMessagesToCharacterResponse([
            { role: 'user', content: summaryPrompt }
        ], SPEAKERS.HAHORI);
        
        // 表示は長く、発声は短くする統合処理
        await addMessageToChatWithSpeech(SPEAKERS.HAHORI, summaryMessage);
        
        console.log('✅ はほりーのの最終まとめ完了');
        
    } catch (error) {
        console.error('❌ 最終まとめ生成エラー:', error);
        const fallbackMessage = `本日は貴重なお時間をいただき、ありがとうございました。${AppState.extractedKnowledge.length}件の価値ある知見を抽出させていただきました。`;
        await addMessageToChat(SPEAKERS.HAHORI, fallbackMessage);
        const audioBlob = await ttsTextToAudioBlob(fallbackMessage, SPEAKERS.HAHORI);
        await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
    }
}

async function generateFinalGreeting() {
    console.log('🎭 ねほりーのによる最終挨拶を生成中...');
    
    try {
        const greetingMessage = `今日は本当にありがとうございました！${AppState.currentTheme}について、とても興味深いお話を聞かせていただけて嬉しかったです。また是非お話を聞かせてくださいね。お疲れさまでした！`;
        
        await addMessageToChat(SPEAKERS.NEHORI, greetingMessage);
        const audioBlob = await ttsTextToAudioBlob(greetingMessage, SPEAKERS.NEHORI);
        await playPreGeneratedAudio(audioBlob, SPEAKERS.NEHORI);
        
        console.log('✅ ねほりーのの最終挨拶完了');
        
    } catch (error) {
        console.error('❌ 最終挨拶生成エラー:', error);
        const fallbackMessage = 'ありがとうございました！またお話を聞かせてくださいね。';
        await addMessageToChat(SPEAKERS.NEHORI, fallbackMessage);
        const audioBlob = await ttsTextToAudioBlob(fallbackMessage, SPEAKERS.NEHORI);
        await playPreGeneratedAudio(audioBlob, SPEAKERS.NEHORI);
    }
}

async function handleSessionEnd() {
    console.log('💡 音声コマンドによるセッション終了要求');
    await endConversationSession();
}

async function endConversationSession() {
    console.log('💡 endConversationSession が実行されました');
    
    if (!AppState.sessionActive) {
        window.showMessage('info', 'セッションは既に終了しています');
        return;
    }
    
    const confirmed = confirm('セッションを終了しますか？\n会話データは保存されます。');
    if (!confirmed) {
        return;
    }
    
    try {
        forceStopAllActivity();
        
        // 🔧 Phase B: セッション終了時の音声強制停止
        AudioControlManager.forceStopAllAudio('session_end');
        
        // フェーズを終了処理に変更
        AppState.phase = PHASES.SUMMARY;
        updateSessionStatus('セッション終了中...', AppState.currentTheme);
        
        // はほりーのによる知見のまとめ
        await generateFinalSummary();
        
        // ねほりーのによる最終挨拶
        await generateFinalGreeting();
        
        // セッションデータを保存
        if (AppState.conversationHistory.length > 0) {
            const sessionData = {
                theme: AppState.currentTheme,
                conversationHistory: [...AppState.conversationHistory],
                extractedKnowledge: [...AppState.extractedKnowledge],
                startTime: AppState.sessionStartTime,
                endTime: new Date()
            };
            
            AppState.allSessions.push(sessionData);
            
            // 🧬 知見永続化: LocalStorageに保存
            if (AppState.extractedKnowledge.length > 0) {
                FukaboriKnowledgeDatabase.addSession({
                    theme: AppState.currentTheme,
                    insights: [...AppState.extractedKnowledge],
                    startTime: AppState.sessionStartTime
                });
            }
        }
        
        // 状態リセット
        AppState.sessionActive = false;
        AppState.phase = PHASES.CLOSING;
        AppState.currentSpeaker = SPEAKERS.NULL;
        
        // UI更新
        updateSessionStatus('セッション完了', AppState.currentTheme);
        window.showMessage('success', 'セッションを終了しました');
        
        console.log('✅ セッション終了完了');
        
    } catch (error) {
        console.error('❌ セッション終了エラー:', error);
        window.showMessage('error', 'セッション終了中にエラーが発生しました');
    }
}

function returnToLogin() {
    console.log('💡 returnToLogin が実行されました');
    
    const confirmed = confirm('ログイン画面に戻りますか？\n現在のセッションデータは失われますが、ログイン状態とテーマ設定は保持されます。');
    if (confirmed) {
        // セッションデータをリセット（ただしログイン・テーマ状態は保持）
        AppState.conversationHistory = [];
        AppState.extractedKnowledge = [];
        AppState.currentTheme = ''; // セッション中のテーマをクリア
        AppState.phase = PHASES.SETUP;
        AppState.currentSpeaker = SPEAKERS.NULL;
        AppState.sessionActive = false;
        
        // UI状態をリセット
        updateSessionStatus('準備中...', '未設定');
        window.updateKnowledgeDisplay();
        
        // 音声認識を停止
        if (AppState.speechRecognition && AppState.speechRecognition.stop) {
            AppState.speechRecognition.stop();
        }
        
        // チャット履歴をクリア
        const messagesContainer = window.UIManager.DOMUtils.get('messagesContainer');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // 🔄 新機能: テーマ入力フィールドの状態は保持（従来はクリアしていた）
        // const themeInput = window.UIManager.DOMUtils.get('themeInput');
        // if (themeInput) {
        //     themeInput.value = ''; // この行をコメントアウト
        // }
        
        // ログイン画面を表示
        window.showLoginScreen();
        window.hideMainScreen();
        
        // 🔄 新機能: 状態復元（ログイン・テーマ状態を保持）
        setTimeout(async () => {
            await restoreApplicationState();
            console.log('🔄 ログイン画面復帰時の状態復元完了');
        }, 100);
        
        console.log('✅ ログイン画面に戻りました（状態保持機能付き）');
    }
}



// =================================================================================
// MISSING FUNCTIONS - 不足していた関数
// =================================================================================

async function testCharacterVoice(character) {
    console.log('💡 testCharacterVoice が実行されました:', character);
    console.log('現在のAPIキー状態:', !!AppState.apiKey);
    
    if (!AppState.apiKey) {
        console.log('APIキーが設定されていません');
        window.showMessage('error', 'まずAPIキーを設定してください');
        return;
    }

    try {
        console.log('音声テストを開始します');
        
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
        console.log('音声テスト完了');
    } catch (error) {
        console.error('音声テストエラー:', error);
        window.showMessage('error', `音声テストに失敗しました: ${error.message}`);
    }
}

function changeTheme(newTheme) {
    console.log('💡 changeTheme が実行されました:', newTheme);
    
    if (newTheme && newTheme !== currentTheme) {
        currentTheme = newTheme;
        
        // テーマ適用
        document.body.className = `theme-${newTheme}`;
        
        // テーマ設定を保存
        localStorage.setItem('fukabori_theme', newTheme);
        
        console.log(`✅ テーマを「${newTheme}」に変更しました`);
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
    console.log('🎯 次の質問を生成します');
    
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
        console.log(`✅ 保存されたテーマ「${savedTheme}」を読み込みました`);
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
        
        console.log(`🎤 スマート音声パネル: ${this.isExpanded ? '展開' : '折りたたみ'}`);
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
        
        console.log('🎤 スマート音声操作パネル初期化完了');
    }
};

// 🧪 音声コマンドテストモード
async function testVoiceCommands() {
    console.log('🧪 音声コマンドテストモード開始');
    
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
    
    console.log('🧪 テスト結果:\n' + resultMessage);
    
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
        console.log('🔧 音声訂正コマンド実行:', command);
        
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
function toggleVoiceGuide() {
    const voiceGuidePanel = window.UIManager.DOMUtils.get('voiceGuidePanel');
    const mainGuideToggle = window.UIManager.DOMUtils.get('mainGuideToggle');
    
    if (voiceGuidePanel && mainGuideToggle) {
        const isHidden = voiceGuidePanel.classList.contains('hidden');
        
        if (isHidden) {
            // ガイドパネルを表示
            voiceGuidePanel.classList.remove('hidden');
            mainGuideToggle.classList.remove('show');
            // 横書きを強制確保
            voiceGuidePanel.style.writingMode = 'horizontal-tb';
            voiceGuidePanel.style.textOrientation = 'mixed';
            console.log('✅ ヘルプガイドを表示しました');
        } else {
            // ガイドパネルを非表示
            voiceGuidePanel.classList.add('hidden');
            mainGuideToggle.classList.add('show');
            console.log('✅ ヘルプガイドを非表示にしました');
        }
    }
}

// ヘルプガイド関数を公開
window.toggleVoiceGuide = toggleVoiceGuide;

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
    
    console.log('✅ 音声設定スライダーのイベントリスナーを初期化しました');
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
        console.log('📚 知見管理システム初期化開始...');
        await initializeKnowledgeManagement();
        console.log('✅ 知見管理システム初期化完了');
        
        // 🎤 新システム: StateManager初期化
        console.log('🎤 音声システム初期化開始...');
        if (!initializeVoiceSystem()) {
            console.error('❌ 音声システム初期化失敗');
            window.showMessage('error', '音声システムの初期化に失敗しました。ページを再読み込みしてください。');
            return;
        }
        console.log('✅ 音声システム初期化完了');
        
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
    
    // Escキーでモーダルを閉じる
    document.addEventListener('keydown', handleEscapeKey);
    
    // 🎤 Phase B: スマート音声操作パネルの初期化
    if (typeof SmartVoicePanelManager !== 'undefined') {
        SmartVoicePanelManager.init();
    }
    
    console.log('✅ 初期化完了（状態管理・知見管理・スマート音声パネル機能付き）');
});

// =================================================================================
// KNOWLEDGE MANAGEMENT SYSTEM - 知見データ管理システム
// =================================================================================

// 📂 CSV管理システム - knowledge-management.jsに移動
// 🏷️ カテゴリー管理システム - knowledge-management.jsに移動
// 👤 ユーザー名管理システム - knowledge-management.jsに移動

// 📄 知見ファイル管理システム
const KnowledgeFileManager = {
    // セッション開始時のファイル初期化
    async createSessionFile(sessionMeta) {
        const timestamp = this.formatTimestamp(new Date());
        const category = sessionMeta.category || 'その他';
        const titleSummary = this.generateTitleSummary(sessionMeta.theme);
        
        const filename = `${timestamp}_${category}_${titleSummary}.md`;
        
        const knowledgeFile = {
            filename: filename,
            meta: {
                session_id: sessionMeta.session_id,
                date: new Date().toISOString(),
                category: category,
                title: titleSummary,
                participant: sessionMeta.participant || '未設定',
                participant_role: sessionMeta.participant_role || '未設定',
                theme: sessionMeta.theme,
                session_start: new Date().toISOString()
            },
            insights: [],
            conversations: [],
            isActive: true
        };
        
        window.KnowledgeState.currentSession = knowledgeFile;
        console.log('✅ 知見セッションファイル初期化:', filename);
        
        return knowledgeFile;
    },

    // タイムスタンプフォーマット (YYMMDD-HHMMSS)
    formatTimestamp(date) {
        const yy = String(date.getFullYear()).slice(2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        
        return `${yy}${mm}${dd}-${hh}${min}${ss}`;
    },

    // タイトル要約生成（20文字以内）
    generateTitleSummary(theme) {
        if (!theme) return 'セッション記録';
        
        // 基本的な要約処理
        let summary = theme.replace(/[「」]/g, '').trim();
        if (summary.length > 20) {
            summary = summary.substring(0, 17) + '...';
        }
        
        return summary;
    },

    // 知見の追加
    addInsight(insight, context, quality) {
        if (!window.KnowledgeState.currentSession) {
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

        window.KnowledgeState.currentSession.insights.push(insightEntry);
        console.log('✅ 知見を追加:', insight.substring(0, 50) + '...');
        
        return true;
    },

    // ファイル生成とダウンロード（AI拡張セッション対応）
    async generateKnowledgeFile(sessionData = null) {
        const session = sessionData || window.KnowledgeState.currentSession;
        
        if (!session) {
            console.warn('⚠️ アクティブなセッションがありません');
            return null;
        }

        const content = this.buildFileContent(session);
        
        // ファイル名の生成（Knowledge DNA統合の場合は特別なプレフィックス）
        const timestamp = this.formatTimestamp(new Date());
        const dnaPrefix = session.knowledge_graph ? 'KnowledgeDNA_' : '知見_';
        const filename = `${dnaPrefix}${session.meta.title}_${timestamp}.md`;
        
        // ファイルダウンロード
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ 知見ファイル生成完了:', filename);
        return filename;
    },

    // ファイル内容の構築（AI知見整理システム対応）
    buildFileContent(session) {
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

    // 平均重要度計算
    calculateAverageImportance(insights) {
        if (insights.length === 0) return 0;
        
        const total = insights.reduce((sum, insight) => {
            return sum + (insight.quality_scores?.importance || 0.5);
        }, 0);
        
        return Math.round((total / insights.length) * 100);
    },

    // AI知見整理システム（Knowledge DNA統合）
    async enhanceKnowledgeWithAI(session, showProgress = true) {
        if (!AppState.apiKey) {
            console.warn('⚠️ API key not available for knowledge enhancement');
            return session;
        }

        try {
            console.log('🤖 AI知見整理開始...');
            
            if (showProgress) {
                window.showMessage('info', '🧬 Knowledge DNAシステムによる知見整理中...');
            }
            
            // Phase 1: 知見構造化・リライト（実装済み）
            console.log('📝 Phase 1: 知見リライト・構造化開始...');
            const enhancedSession = { ...session };
            enhancedSession.insights = [];
            
            for (let i = 0; i < session.insights.length; i++) {
                const insight = session.insights[i];
                
                try {
                    if (showProgress) {
                        window.showMessage('info', `🔄 知見 ${i + 1}/${session.insights.length} を整理中...`);
                    }
                    
                    // 🔧 修正: 手動知見も自動知見と同様のリライト処理を適用
                    const enhancement = await KnowledgeDNAManager.rewriteInsightForClarity(
                        insight.content, 
                        { theme: session.meta.theme, category: session.meta.category }
                    );
                    
                    // 拡張された知見データを作成
                    const enhancedInsight = {
                        ...insight,
                        enhanced_content: enhancement.enhanced,
                        summary: enhancement.summary,
                        categories: enhancement.categories,
                        keywords: enhancement.keywords,
                        background: enhancement.background,
                        actionable_points: enhancement.actionable_points,
                        related_concepts: enhancement.related_concepts,
                        dna_enhanced: true
                    };
                    
                    enhancedSession.insights.push(enhancedInsight);
                    
                } catch (error) {
                    console.error(`❌ 知見 ${i + 1} の整理エラー:`, error);
                    // エラー時は元の知見をそのまま追加
                    enhancedSession.insights.push({
                        ...insight,
                        enhanced_content: insight.content,
                        summary: '整理処理でエラーが発生',
                        dna_enhanced: false
                    });
                }
            }
            
            // Phase 2: 関係性分析（実装済み）
            console.log('🕸️ Phase 2: 知見関係性分析開始...');
            if (showProgress) {
                window.showMessage('info', '🕸️ 知見間の関係性を分析中...');
            }
            
            const relationships = await KnowledgeDNAManager.analyzeKnowledgeRelationships(
                enhancedSession.insights
            );
            
            enhancedSession.knowledge_graph = relationships;
            
            console.log('✅ AI知見整理完了');
            if (showProgress) {
                window.showMessage('success', '🧬 Knowledge DNAによる知見整理が完了しました！');
            }
            
            return enhancedSession;
            
        } catch (error) {
            console.error('❌ AI知見整理エラー:', error);
            if (showProgress) {
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
        console.log('📚 知見データ管理システム初期化開始...');
        
        // CSV データの読み込み
        await CategoryManager.loadCategories();
        await UserManager.loadUsers();
        
        window.KnowledgeState.isInitialized = true;
        console.log('✅ 知見データ管理システム初期化完了');
        
    } catch (error) {
        console.error('❌ 知見管理システム初期化エラー:', error);
        window.KnowledgeState.isInitialized = false;
    }
}

// 🚀 セッション開始時の知見管理初期化
async function initializeKnowledgeSession(theme) {
    try {
        // KnowledgeStateが定義されているかチェック
        if (typeof window.KnowledgeState === 'undefined') {
            console.warn('⚠️ KnowledgeStateが未定義です');
            return;
        }
        
        if (!window.KnowledgeState.isInitialized) {
            console.warn('⚠️ 知見管理システムが初期化されていません');
            // 初期化を試行
            await initializeKnowledgeManagement();
            if (!window.KnowledgeState.isInitialized) {
                console.error('❌ 知見管理システムの初期化に失敗しました');
                return;
            }
        }
        
        console.log('📋 知見セッション初期化開始...');
        
        // 1. ユーザー名の確認（無効化 - デフォルト値を使用）
        // const participant = await promptUserIdentification();
        const participant = {
            formal_name: 'ゲスト',
            role: 'ユーザー'
        };
        
        // 2. カテゴリーの選択（無効化 - デフォルト値を使用）
        // const category = await promptCategorySelection();
        const category = 'その他';
        
        // 3. セッションファイルの初期化
        const sessionMeta = {
            session_id: `session_${Date.now()}`,
            theme: theme,
            participant: participant.formal_name,
            participant_role: participant.role,
            category: category
        };
        
        await KnowledgeFileManager.createSessionFile(sessionMeta);
        
        console.log('✅ 知見セッション初期化完了');
        window.showMessage('success', `知見収集セッションを開始しました（${category}カテゴリー）`);
        
    } catch (error) {
        console.error('❌ 知見セッション初期化エラー:', error);
        window.showMessage('warning', '知見収集機能でエラーが発生しましたが、セッションは継続されます');
    }
}

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
            console.log('🎯 音声ベース知見評価開始...');
            
            // 1. はほりーのによる品質評価
            const qualityEvaluation = await QualityAssessmentSystem.evaluateInsightQuality(insightText, conversationContext);
            
            if (!qualityEvaluation) {
                console.warn('⚠️ 品質評価が取得できませんでした');
                return { accepted: false, reason: 'evaluation_failed' };
            }
            
            // 統計更新
            AppState.sessionStats.totalKnowledge++;
            this.updateAverageScore(qualityEvaluation.overall);
            
            const totalScore = Math.round(qualityEvaluation.overall * 100);
            const threshold = AppState.knowledgeSettings.autoRecordThreshold;
            
            // 2. 閾値による自動判定
            if (totalScore >= threshold) {
                return await this.handleAutoRecord(qualityEvaluation, insightText, totalScore);
            } else {
                return await this.handleManualConfirmation(qualityEvaluation, insightText, totalScore);
            }
            
        } catch (error) {
            console.error('❌ 音声ベース知見評価エラー:', error);
            return { accepted: false, reason: 'process_error' };
        }
    },
    
    // 🤖 自動記録処理
    async handleAutoRecord(evaluation, insightText, totalScore) {
        console.log('✅ 高評価知見: 自動記録');
        
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
                
                console.log(`✅ 閾値を${newThreshold}点に変更`);
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
    console.log('✅ ユーザー承認: 知見記録');
    
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
        console.log('🔄 統合システムで音声認識再開（知見確認モード）');
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
    console.log('🏁 知見確認モード終了処理開始');
    
    // ゲートキーパーシステムを通じて安全にモードを終了
    ConversationGatekeeper.exitKnowledgeConfirmationMode('resetFunction');
    
    // レガシー状態もクリア（互換性のため）
    AppState.waitingForPermission = true;
    
    console.log('✅ 知見確認モード終了処理完了');
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
            console.log('✅ 知見設定を読み込みました');
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
    
    console.log('✅ 知見設定表示を更新しました');
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
        
        console.log(`✅ 閾値を${newThreshold}点に変更（HTML入力）`);
        
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
        
        console.log(`📊 知見統合チェック: セッション${sessionInsights.length}件, 手動${manualInsights.length}件`);
        
        if (sessionInsights.length === 0 && manualInsights.length === 0) {
            window.showMessage('warning', '知見データがありません。セッション中に抽出された知見があるときにダウンロードできます。');
            return;
        }

        console.log('📥 Knowledge DNA統合 知見ファイルダウンロード開始...');
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
        
        console.log(`✅ 知見統合完了: 合計${workingSession.insights.length}件`);

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
            console.log('✅ Knowledge DNA統合 知見ファイルダウンロード完了:', filename);
            
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
            console.log('📊 知見処理統計:', stats);
            
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
        console.log('🔧 Phase 1: 発声短縮管理システム初期化中...');
        this.loadSettings();
        this.updateUI();
        console.log('✅ Phase 1: 発声短縮管理システム初期化完了');
    },

    // 設定の保存
    saveSettings() {
        try {
            localStorage.setItem('speechShorteningSettings', JSON.stringify(this.settings));
            console.log('💾 発声短縮設定を保存しました', this.settings);
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
                console.log('📂 発声短縮設定を読み込みました', this.settings);
            }
        } catch (error) {
            console.error('❌ 発声短縮設定の読み込みに失敗:', error);
            // デフォルト設定を使用
        }
    },

    // UI更新
    updateUI() {
        const enabledCheckbox = document.getElementById('speechShorteningEnabled');
        const settingsPanel = document.getElementById('shorteningSettings');
        const levelSlider = document.getElementById('shorteningLevel');
        const levelValue = document.getElementById('shorteningLevelValue');
        const maxCharSlider = document.getElementById('maxCharacters');
        const maxCharValue = document.getElementById('maxCharactersValue');

        if (enabledCheckbox) {
            enabledCheckbox.checked = this.settings.enabled;
        }

        if (settingsPanel) {
            settingsPanel.style.opacity = this.settings.enabled ? '1' : '0.5';
            settingsPanel.style.pointerEvents = this.settings.enabled ? 'auto' : 'none';
        }

        if (levelSlider && levelValue) {
            levelSlider.value = this.settings.level;
            levelValue.textContent = this.settings.level;
        }

        if (maxCharSlider && maxCharValue) {
            maxCharSlider.value = this.settings.maxCharacters;
            maxCharValue.textContent = this.settings.maxCharacters;
        }

        // 個別オプション更新
        Object.keys(this.settings.options).forEach(key => {
            const checkbox = document.getElementById(key);
            if (checkbox) {
                checkbox.checked = this.settings.options[key];
            }
        });
    },

    // 機能有効/無効切り替え
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        this.updateUI();
        this.saveSettings();
        
        const status = this.settings.enabled ? '有効' : '無効';
        console.log(`🔄 発声短縮機能: ${status}`);
        window.showMessage('success', `発声短縮機能を${status}にしました`);
    },

    // レベル更新
    updateLevel(level) {
        this.settings.level = parseInt(level);
        this.updateUI();
        this.saveSettings();
        console.log(`📊 発声短縮レベル: ${this.settings.level}`);
    },

    // 最大文字数更新
    updateMaxCharacters(maxChars) {
        this.settings.maxCharacters = parseInt(maxChars);
        this.updateUI();
        this.saveSettings();
        console.log(`📏 最大文字数: ${this.settings.maxCharacters}`);
    },

    // 個別オプション更新
    updateOption(optionKey, value) {
        if (this.settings.options.hasOwnProperty(optionKey)) {
            this.settings.options[optionKey] = value;
            this.saveSettings();
            console.log(`⚙️ ${optionKey}: ${value}`);
        }
    },

    // 設定リセット
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
        this.updateUI();
        this.saveSettings();
        window.showMessage('success', '発声短縮設定をリセットしました');
        console.log('🔄 発声短縮設定をリセット');
    },

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
                console.log(`🎤 Phase 1 発声短縮実行:`);
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
            console.log(`✂️ Phase 1: 発声短縮実行 ${displayText.length}→${textForSpeech.length}文字 (${reduction}%短縮)`);
        }

        // 音声生成・再生
        const audioBlob = await ttsTextToAudioBlob(textForSpeech, speaker);
        await playPreGeneratedAudio(audioBlob, speaker);
        
        console.log('✅ Phase 1: 統合発話処理完了');
        
    } catch (error) {
        console.error('❌ Phase 1: 統合発話処理エラー:', error);
        window.showMessage('error', '音声の生成に失敗しました');
        
        // 緊急フォールバック: 安全システムを使用
        if (window.FukaboriSafetySystem) {
            console.log('🛡️ 安全システムによるフォールバック実行');
            await window.FukaboriSafetySystem.fallbackTextToSpeech(displayText, speaker);
        }
    }
}

// =================================================================================
// PHASE 1: UI EVENT HANDLERS - UI イベントハンドラー
// =================================================================================

// グローバル関数として公開
window.toggleSpeechShortening = function() {
    SpeechShorteningManager.toggleEnabled();
};

window.updateShorteningLevel = function() {
    const levelSlider = document.getElementById('shorteningLevel');
    if (levelSlider) {
        SpeechShorteningManager.updateLevel(levelSlider.value);
    }
};

window.updateMaxCharacters = function() {
    const maxCharSlider = document.getElementById('maxCharacters');
    if (maxCharSlider) {
        SpeechShorteningManager.updateMaxCharacters(maxCharSlider.value);
    }
};

window.resetShorteningSettings = function() {
    if (confirm('発声短縮設定をリセットしますか？')) {
        SpeechShorteningManager.resetSettings();
    }
};

window.testSpeechShortening = async function() {
    console.log('🧪 発声短縮機能テスト開始');
    
    const testTexts = [
        'いつもお忙しい中、貴重なお時間をいただき、誠にありがとうございます。本日は「プロジェクト管理の工夫」というテーマについて、さらに詳しくお聞かせいただければと思います。',
        'それは本当に素晴らしいお話ですね。具体的には、どのような場面で、どのような課題があり、それをどのように解決されたのでしょうか？',
        'ありがとうございました。非常に価値ある知見をお聞かせいただき、心より感謝申し上げます。'
    ];
    
    for (let i = 0; i < testTexts.length; i++) {
        const originalText = testTexts[i];
        const shortenedText = await SpeechShorteningManager.processTextWithShortening(originalText, 'nehori');
        
        console.log(`📋 テスト ${i + 1}:`);
        console.log(`📝 元テキスト (${originalText.length}文字): ${originalText}`);
        console.log(`🔊 短縮後 (${shortenedText.length}文字): ${shortenedText}`);
        console.log(`📊 短縮率: ${Math.round((1 - shortenedText.length / originalText.length) * 100)}%`);
        console.log('---');
    }
    
    window.showMessage('success', '発声短縮テストが完了しました。コンソールで結果を確認してください。');
};

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
            console.log('🚀 Phase 1: 発声短縮統合システム初期化完了');
        }
    }, 100);
});

console.log('✅ グローバル関数をwindowオブジェクトに公開しました');
console.log('🚀 Phase 1: 発声短縮統合システム読み込み完了');

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
        
        console.log('🔧 強制同期実行完了');
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

console.log('✅ Step0: APIキー設定システムの関数をwindowオブジェクトに公開しました');
console.log('✅ LocalStorage操作関数をwindowオブジェクトに公開しました');

// =================================================================================
// 新音声システム初期化処理
// =================================================================================

// StateManagerの初期化
function initializeVoiceSystem() {
    console.log('🚀 音声システム初期化開始');
    
    try {
        // StateManagerクラスが定義されているかチェック
        if (typeof StateManager === 'undefined') {
            console.error('❌ StateManagerクラスが未定義です');
            return false;
        }
        
        // グローバル変数として初期化
        window.stateManager = new StateManager();
        
        console.log('✅ 音声システム初期化完了');
        return true;
    } catch (error) {
        console.error('❌ 音声システム初期化エラー:', error);
        window.showMessage('error', '音声システムの初期化に失敗しました');
        return false;
    }
}

// 既存の初期化関数を置き換え
function initializeMicrophoneRecording(forceRecheck = false) {
    console.log('🎤 マイク初期化要求（新システム）');
    
    // StateManagerが定義されているかチェック
    if (typeof window.stateManager === 'undefined') {
        console.error('❌ StateManagerが未定義です');
        return Promise.resolve(false);
    }
    
    if (!window.stateManager) {
        console.error('❌ StateManagerが未初期化');
        // 初期化を試行
        if (initializeVoiceSystem()) {
            console.log('✅ StateManager初期化成功');
        } else {
            console.error('❌ StateManager初期化失敗');
            return Promise.resolve(false);
        }
    }
    
    return window.stateManager.permissionManager.getPermission();
}

function initializeSpeechRecognition() {
    console.log('🔄 SpeechRecognition初期化要求（新システム）');
    
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

console.log('✅ 新音声システム・知見管理システムの関数をwindowオブジェクトに公開しました');
