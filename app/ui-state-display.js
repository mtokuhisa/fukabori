// =================================================================================
// UI STATE DISPLAY SYSTEM - UI状態表示システム
// =================================================================================
// 
// 【目的】システム状態とユーザー操作の透明性向上
// - リアルタイム状態表示
// - ユーザー操作ガイダンス
// - エラー状態の明確化
// - 進行状況の可視化
// 
// 【企業利用特化】
// - 長時間セッション対応
// - 複数人参加時の状態共有
// - ネットワーク不安定時の対応
// 
// =================================================================================

// 🔧 SYSTEM CONTROL FLAGS - システム制御フラグ
const UI_STATE_DISPLAY_CONFIG = {
    ENABLED: false,  // 🚫 UIStateDisplay機能を無効化
    AUTO_INITIALIZE: false,  // 🚫 自動初期化を無効化
    MANUAL_ONLY: true,  // ✅ 手動初期化のみ許可
    DEBUG_MODE: false
};

class UIStateDisplaySystem {
    constructor() {
        this.initialized = false;
        this.unifiedStateManager = null;
        this.displayElements = {};
        this.animations = new Map();
        this.updateQueue = [];
        this.isUpdating = false;
        
        // 🔧 無効化フラグチェック
        this.enabled = UI_STATE_DISPLAY_CONFIG.ENABLED;
        if (!this.enabled) {
            console.log('🚫 UIStateDisplay: システムが無効化されています');
        }
    }
    
    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        // 🔧 無効化チェック
        if (!this.enabled) {
            console.log('🚫 UIStateDisplay: 無効化により初期化をスキップ');
            return false;
        }
        
        if (this.initialized) return;
        
        console.log('🔄 UI状態表示システム初期化開始');
        
        // 統一状態管理システムの取得
        this.unifiedStateManager = window.UnifiedStateManager;
        if (!this.unifiedStateManager) {
            console.error('❌ 統一状態管理システムが見つかりません');
            return false;
        }
        
        // UI要素の作成
        this.createDisplayElements();
        
        // 状態変更リスナーの設定
        this.setupStateListeners();
        
        // 初期状態の表示
        this.updateAllDisplays();
        
        // 既存のUIシステムとの統合
        this.integrateWithExistingUI();
        
        this.initialized = true;
        console.log('✅ UI状態表示システム初期化完了');
        
        return true;
    }
    
    // =================================================================================
    // 手動制御メソッド
    // =================================================================================
    
    enable() {
        this.enabled = true;
        console.log('✅ UIStateDisplay: システムを有効化');
        return this;
    }
    
    disable() {
        this.enabled = false;
        console.log('🚫 UIStateDisplay: システムを無効化');
        this.cleanup();
        return this;
    }
    
    cleanup() {
        // UI要素の削除
        Object.values(this.displayElements).forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.displayElements = {};
        
        // アニメーションの停止
        this.animations.forEach(animation => {
            if (animation.cancel) animation.cancel();
        });
        this.animations.clear();
        
        // 更新キューのクリア
        this.updateQueue = [];
        this.isUpdating = false;
        
        this.initialized = false;
        console.log('🧹 UIStateDisplay: クリーンアップ完了');
    }
    
    // =================================================================================
    // UI要素の作成
    // =================================================================================
    
    createDisplayElements() {
        // 🔧 無効化チェック
        if (!this.enabled) return;
        
        // メイン状態表示パネル
        this.createMainStatusPanel();
        
        // 音声認識状態表示
        this.createVoiceStatusDisplay();
        
        // 進行状況表示
        this.createProgressDisplay();
        
        // エラー表示
        this.createErrorDisplay();
        
        // ネットワーク状態表示
        this.createNetworkStatusDisplay();
        
        // ユーザー操作ガイダンス
        this.createUserGuidanceDisplay();
        
        console.log('✅ UI表示要素作成完了');
    }
    
    createMainStatusPanel() {
        // 既存のUI要素を拡張する形で実装
        const existingPanel = document.querySelector('.status-panel');
        if (existingPanel) {
            this.displayElements.mainPanel = existingPanel;
        } else {
            // 新規作成
            const panel = document.createElement('div');
            panel.className = 'unified-status-panel';
            panel.innerHTML = `
                <div class="status-header">
                    <h3>システム状態</h3>
                    <button class="status-toggle" onclick="window.UIStateDisplay.togglePanel()">📊</button>
                </div>
                <div class="status-content">
                    <div class="status-row">
                        <span class="status-label">セッション:</span>
                        <span class="status-value" id="sessionStatus">待機中</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">フェーズ:</span>
                        <span class="status-value" id="phaseStatus">セットアップ</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">音声認識:</span>
                        <span class="status-value" id="voiceStatus">未開始</span>
                    </div>
                    <div class="status-row">
                        <span class="status-label">ネットワーク:</span>
                        <span class="status-value" id="networkStatus">確認中</span>
                    </div>
                </div>
            `;
            
            // CSSスタイルの追加
            this.addStatusPanelStyles();
            
            document.body.appendChild(panel);
            this.displayElements.mainPanel = panel;
        }
    }
    
    createVoiceStatusDisplay() {
        // マイクボタンの拡張
        const micButton = document.getElementById('microphoneButton');
        if (micButton) {
            this.displayElements.micButton = micButton;
            
            // 状態表示用の要素を追加
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'mic-status-indicator';
            statusIndicator.innerHTML = `
                <div class="mic-status-text">待機中</div>
                <div class="mic-status-progress">
                    <div class="progress-bar"></div>
                </div>
            `;
            
            micButton.appendChild(statusIndicator);
            this.displayElements.micStatusIndicator = statusIndicator;
        }
        
        // 音声レベル表示
        this.createVoiceLevelDisplay();
    }
    
    createVoiceLevelDisplay() {
        const levelDisplay = document.createElement('div');
        levelDisplay.className = 'voice-level-display hidden';
        levelDisplay.innerHTML = `
            <div class="voice-level-header">音声入力レベル</div>
            <div class="voice-level-bars">
                ${Array.from({length: 10}, (_, i) => 
                    `<div class="voice-level-bar" data-level="${i + 1}"></div>`
                ).join('')}
            </div>
        `;
        
        document.body.appendChild(levelDisplay);
        this.displayElements.voiceLevelDisplay = levelDisplay;
    }
    
    createProgressDisplay() {
        // 既存の進行状況表示を拡張
        let progressDisplay = document.querySelector('.progress-display');
        if (!progressDisplay) {
            progressDisplay = document.createElement('div');
            progressDisplay.className = 'unified-progress-display hidden';
            progressDisplay.innerHTML = `
                <div class="progress-content">
                    <div class="progress-message">処理中...</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill"></div>
                    </div>
                    <div class="progress-details"></div>
                </div>
            `;
            
            document.body.appendChild(progressDisplay);
        }
        
        this.displayElements.progressDisplay = progressDisplay;
    }
    
    createErrorDisplay() {
        // 既存のエラー表示を拡張
        let errorDisplay = document.querySelector('.error-display');
        if (!errorDisplay) {
            errorDisplay = document.createElement('div');
            errorDisplay.className = 'unified-error-display hidden';
            errorDisplay.innerHTML = `
                <div class="error-content">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">エラーが発生しました</div>
                    <div class="error-details"></div>
                    <div class="error-actions">
                        <button class="error-retry" onclick="window.UIStateDisplay.retryLastAction()">再試行</button>
                        <button class="error-dismiss" onclick="window.UIStateDisplay.dismissError()">閉じる</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(errorDisplay);
        }
        
        this.displayElements.errorDisplay = errorDisplay;
    }
    
    createNetworkStatusDisplay() {
        const networkDisplay = document.createElement('div');
        networkDisplay.className = 'network-status-indicator';
        networkDisplay.innerHTML = `
            <div class="network-icon">🌐</div>
            <div class="network-status">オンライン</div>
        `;
        
        // ヘッダーに追加
        const header = document.querySelector('.header');
        if (header) {
            header.appendChild(networkDisplay);
        } else {
            document.body.appendChild(networkDisplay);
        }
        
        this.displayElements.networkDisplay = networkDisplay;
    }
    
    createUserGuidanceDisplay() {
        // 🗑️ ユーザーガイダンス表示を完全に削除
        // ユーザーからの要求により、邪魔なガイダンスメッセージを表示しない
        console.log('🗑️ ユーザーガイダンス表示は無効化されました');
    }
    
    // =================================================================================
    // CSSスタイル
    // =================================================================================
    
    addStatusPanelStyles() {
        const styles = `
            <style>
                .unified-status-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    min-width: 250px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .status-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .status-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }
                
                .status-toggle {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: background-color 0.2s;
                }
                
                .status-toggle:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }
                
                .status-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                }
                
                .status-row:last-child {
                    border-bottom: none;
                }
                
                .status-label {
                    font-weight: 500;
                    color: #666;
                    font-size: 14px;
                }
                
                .status-value {
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    background-color: rgba(0, 0, 0, 0.05);
                }
                
                .status-value.active {
                    background-color: #4CAF50;
                    color: white;
                }
                
                .status-value.error {
                    background-color: #f44336;
                    color: white;
                }
                
                .status-value.warning {
                    background-color: #ff9800;
                    color: white;
                }
                
                .mic-status-indicator {
                    position: absolute;
                    bottom: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                
                .mic-status-indicator.visible {
                    opacity: 1;
                }
                
                .voice-level-display {
                    position: fixed;
                    bottom: 100px;
                    left: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 12px;
                    border-radius: 8px;
                    z-index: 1000;
                }
                
                .voice-level-bars {
                    display: flex;
                    gap: 2px;
                    margin-top: 8px;
                }
                
                .voice-level-bar {
                    width: 4px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 2px;
                    transition: background-color 0.1s;
                }
                
                .voice-level-bar.active {
                    background: #4CAF50;
                }
                
                .unified-progress-display {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 24px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    z-index: 2000;
                    min-width: 300px;
                    text-align: center;
                }
                
                .progress-bar-container {
                    width: 100%;
                    height: 6px;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 3px;
                    margin: 12px 0;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    border-radius: 3px;
                    transition: width 0.3s ease;
                    width: 0%;
                }
                
                .unified-error-display {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 24px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    z-index: 2000;
                    min-width: 350px;
                    text-align: center;
                    border-left: 4px solid #f44336;
                }
                
                .error-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                
                .error-message {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 8px;
                }
                
                .error-details {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 16px;
                }
                
                .error-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                
                .error-retry, .error-dismiss {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .error-retry {
                    background: #4CAF50;
                    color: white;
                }
                
                .error-retry:hover {
                    background: #45a049;
                }
                
                .error-dismiss {
                    background: #f0f0f0;
                    color: #333;
                }
                
                .error-dismiss:hover {
                    background: #e0e0e0;
                }
                
                .network-status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .network-status-indicator.offline {
                    background: rgba(244, 67, 54, 0.1);
                    color: #f44336;
                }
                
                .network-status-indicator.online {
                    background: rgba(76, 175, 80, 0.1);
                    color: #4CAF50;
                }
                
                .user-guidance-display {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(33, 150, 243, 0.95);
                    color: white;
                    padding: 16px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    max-width: 300px;
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                
                .user-guidance-display.visible {
                    transform: translateY(0);
                    opacity: 1;
                }
                
                .guidance-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }
                
                .guidance-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }
                
                .guidance-message {
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                @media (max-width: 768px) {
                    .unified-status-panel {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                    }
                    
                    .user-guidance-display {
                        bottom: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // =================================================================================
    // 状態リスナー
    // =================================================================================
    
    setupStateListeners() {
        // 🔧 無効化チェック
        if (!this.enabled) return;
        
        this.unifiedStateManager.addListener((eventType, data, state) => {
            this.handleStateChange(eventType, data, state);
        });
        
        console.log('✅ 状態変更リスナー設定完了');
    }
    
    handleStateChange(eventType, data, state) {
        // 🔧 無効化チェック
        if (!this.enabled) return;
        
        // 更新キューに追加
        this.updateQueue.push({ eventType, data, state });
        
        // 非同期で更新処理
        if (!this.isUpdating) {
            this.processUpdateQueue();
        }
    }
    
    async processUpdateQueue() {
        // 🔧 無効化チェック
        if (!this.enabled) return;
        
        this.isUpdating = true;
        
        while (this.updateQueue.length > 0) {
            const update = this.updateQueue.shift();
            await this.applyStateUpdate(update);
        }
        
        this.isUpdating = false;
    }
    
    async applyStateUpdate({ eventType, data, state }) {
        // 🔧 無効化チェック
        if (!this.enabled) return;
        
        switch (eventType) {
            case 'system_state_changed':
                this.updateSystemDisplay(state.system);
                break;
                
            case 'voice_state_changed':
                this.updateVoiceDisplay(state.voice);
                break;
                
            case 'conversation_state_changed':
                this.updateConversationDisplay(state.conversation);
                break;
                
            case 'ui_state_changed':
                this.updateUIDisplay(state.ui);
                break;
                
            case 'network_state_changed':
                this.updateNetworkDisplay(state.network);
                break;
                
            case 'error_occurred':
                this.showError(data.errorType, data.message, data.details);
                break;
                
            case 'error_cleared':
                this.hideError();
                break;
                
            case 'session_started':
                // this.showUserGuidance('セッションが開始されました。自然に話しかけてください。');
                break;
                
            case 'speech_started':
                this.updateSpeechStatus(data.speaker, '発話中');
                break;
                
            case 'speech_ended':
                this.updateSpeechStatus(null, '待機中');
                break;
        }
    }
    
    // =================================================================================
    // 表示更新メソッド
    // =================================================================================
    
    updateSystemDisplay(systemState) {
        // セッション状態
        const sessionStatus = document.getElementById('sessionStatus');
        if (sessionStatus) {
            sessionStatus.textContent = systemState.sessionActive ? 'アクティブ' : '待機中';
            sessionStatus.className = `status-value ${systemState.sessionActive ? 'active' : ''}`;
        }
        
        // フェーズ状態
        const phaseStatus = document.getElementById('phaseStatus');
        if (phaseStatus) {
            const phaseNames = {
                'setup': 'セットアップ',
                'warmup': 'ウォームアップ',
                'deepdive': '深掘り',
                'summary': 'まとめ',
                'completed': '完了'
            };
            phaseStatus.textContent = phaseNames[systemState.currentPhase] || systemState.currentPhase;
        }
    }
    
    updateVoiceDisplay(voiceState) {
        // 音声認識状態
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) {
            const statusNames = {
                'idle': '待機中',
                'starting': '開始中',
                'active': '聞いています',
                'paused': '一時停止',
                'stopping': '停止中',
                'error': 'エラー'
            };
            
            let statusText = statusNames[voiceState.recognitionState] || voiceState.recognitionState;
            
            // 詳細情報を追加
            if (voiceState.recognitionState === 'paused' && voiceState.pauseReason) {
                statusText += ` (${voiceState.pauseReason})`;
            }
            
            if (voiceState.recognitionState === 'active' && voiceState.timeSinceLastResult) {
                const seconds = Math.floor(voiceState.timeSinceLastResult / 1000);
                if (seconds > 10) {
                    statusText += ` (${seconds}秒前)`;
                }
            }
            
            voiceStatus.textContent = statusText;
            voiceStatus.className = `status-value ${voiceState.recognitionState === 'active' ? 'active' : 
                                                   voiceState.recognitionState === 'error' ? 'error' : 
                                                   voiceState.recognitionState === 'paused' ? 'warning' : ''}`;
        }
        
        // マイクボタンの状態更新
        this.updateMicrophoneButton(voiceState);
        
        // 音声レベル表示の更新
        if (voiceState.recognitionState === 'active') {
            this.showVoiceLevelDisplay();
        } else {
            this.hideVoiceLevelDisplay();
        }
        
        // マイクステータスインジケーターの更新
        this.updateMicStatusIndicator(voiceState);
    }
    
    updateMicrophoneButton(voiceState) {
        const micButton = this.displayElements.micButton;
        const statusIndicator = this.displayElements.micStatusIndicator;
        
        if (!micButton || !statusIndicator) return;
        
        // ボタンクラスの更新
        micButton.classList.remove('mic-idle', 'mic-active', 'mic-error', 'mic-disabled');
        
        switch (voiceState.recognitionState) {
            case 'active':
                micButton.classList.add('mic-active');
                break;
            case 'error':
                micButton.classList.add('mic-error');
                break;
            case 'starting':
            case 'stopping':
                micButton.classList.add('mic-loading');
                break;
            default:
                micButton.classList.add('mic-idle');
        }
    }
    
    updateMicStatusIndicator(voiceState) {
        const indicator = this.displayElements.micStatusIndicator;
        if (!indicator) return;
        
        const statusMessages = {
            'idle': '待機中',
            'starting': '開始中...',
            'active': '聞いています',
            'paused': '一時停止中',
            'stopping': '停止中...',
            'error': 'エラー'
        };
        
        let message = statusMessages[voiceState.recognitionState] || voiceState.recognitionState;
        
        // 詳細情報を追加
        if (voiceState.recognitionState === 'active' && voiceState.timeSinceLastResult) {
            const seconds = Math.floor(voiceState.timeSinceLastResult / 1000);
            if (seconds > 30) {
                message += ` (${seconds}秒間無音)`;
            }
        }
        
        const statusText = indicator.querySelector('.mic-status-text');
        if (statusText) {
            statusText.textContent = message;
        }
        
        indicator.className = `mic-status-indicator ${voiceState.recognitionState === 'active' ? 'visible' : ''}`;
    }
    
    updateConversationDisplay(conversationState) {
        // 発話者の表示更新
        // if (conversationState.currentSpeaker) {
        //     this.showUserGuidance(`${conversationState.currentSpeaker}が発話中です...`);
        // }
    }
    
    updateUIDisplay(uiState) {
        // 進行状況の表示
        if (uiState.progressMessage) {
            this.showProgress(uiState.progressMessage, uiState.progressPercentage);
        } else {
            this.hideProgress();
        }
        
        // エラーメッセージの表示
        if (uiState.errorMessage) {
            this.showError(uiState.errorType, uiState.errorMessage);
        }
    }
    
    updateNetworkDisplay(networkState) {
        const networkDisplay = this.displayElements.networkDisplay;
        if (!networkDisplay) return;
        
        const statusElement = networkDisplay.querySelector('.network-status');
        const iconElement = networkDisplay.querySelector('.network-icon');
        
        if (networkState.isOnline) {
            statusElement.textContent = 'オンライン';
            iconElement.textContent = '🌐';
            networkDisplay.className = 'network-status-indicator online';
        } else {
            statusElement.textContent = 'オフライン';
            iconElement.textContent = '📡';
            networkDisplay.className = 'network-status-indicator offline';
        }
    }
    
    // =================================================================================
    // ユーティリティメソッド
    // =================================================================================
    
    showProgress(message, percentage = 0) {
        const progressDisplay = this.displayElements.progressDisplay;
        if (!progressDisplay) return;
        
        progressDisplay.querySelector('.progress-message').textContent = message;
        progressDisplay.querySelector('.progress-bar-fill').style.width = `${percentage}%`;
        progressDisplay.classList.remove('hidden');
    }
    
    hideProgress() {
        const progressDisplay = this.displayElements.progressDisplay;
        if (progressDisplay) {
            progressDisplay.classList.add('hidden');
        }
    }
    
    showError(errorType, message, details = null) {
        const errorDisplay = this.displayElements.errorDisplay;
        if (!errorDisplay) return;
        
        errorDisplay.querySelector('.error-message').textContent = message;
        if (details) {
            errorDisplay.querySelector('.error-details').textContent = details;
        }
        
        errorDisplay.classList.remove('hidden');
    }
    
    hideError() {
        const errorDisplay = this.displayElements.errorDisplay;
        if (errorDisplay) {
            errorDisplay.classList.add('hidden');
        }
    }
    
    showUserGuidance(message, actions = []) {
        // 🗑️ ユーザーガイダンス表示を完全に削除
        // ユーザーからの要求により、邪魔なガイダンスメッセージを表示しない
        console.log('🗑️ ユーザーガイダンス表示は無効化されました');
    }
    
    hideUserGuidance() {
        const guidanceDisplay = this.displayElements.guidanceDisplay;
        if (guidanceDisplay) {
            guidanceDisplay.classList.remove('visible');
        }
    }
    
    showVoiceLevelDisplay() {
        const voiceLevelDisplay = this.displayElements.voiceLevelDisplay;
        if (voiceLevelDisplay) {
            voiceLevelDisplay.classList.remove('hidden');
        }
    }
    
    hideVoiceLevelDisplay() {
        const voiceLevelDisplay = this.displayElements.voiceLevelDisplay;
        if (voiceLevelDisplay) {
            voiceLevelDisplay.classList.add('hidden');
        }
    }
    
    updateSpeechStatus(speaker, status) {
        // 発話状態の更新
        console.log(`🎤 発話状態更新: ${speaker} - ${status}`);
    }
    
    updateAllDisplays() {
        // 🔧 無効化チェック
        if (!this.enabled) return;
        
        if (!this.unifiedStateManager) return;
        
        const state = this.unifiedStateManager.getState();
        this.updateSystemDisplay(state.system);
        this.updateVoiceDisplay(state.voice);
        this.updateConversationDisplay(state.conversation);
        this.updateUIDisplay(state.ui);
        this.updateNetworkDisplay(state.network);
    }
    
    // =================================================================================
    // パブリックメソッド
    // =================================================================================
    
    togglePanel() {
        const panel = this.displayElements.mainPanel;
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    retryLastAction() {
        // 最後のアクションの再試行
        console.log('🔄 最後のアクションを再試行');
        this.hideError();
    }
    
    dismissError() {
        this.hideError();
    }
    
    // =================================================================================
    // 既存UIシステムとの統合
    // =================================================================================
    
    integrateWithExistingUI() {
        // 既存のマイクボタンとの統合
        this.integrateWithMicrophoneButton();
        
        // 既存のステータス表示との統合
        this.integrateWithStatusDisplays();
        
        // 既存のエラー表示との統合
        this.integrateWithErrorDisplays();
        
        console.log('✅ 既存UIシステムとの統合完了');
    }
    
    integrateWithMicrophoneButton() {
        const micButton = document.getElementById('microphoneButton');
        if (micButton) {
            // 既存のマイクボタンに状態表示を追加
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'mic-status-indicator';
            statusIndicator.id = 'micStatusIndicator';
            micButton.parentNode.style.position = 'relative';
            micButton.parentNode.appendChild(statusIndicator);
            
            this.displayElements.micStatusIndicator = statusIndicator;
            console.log('✅ マイクボタンと統合完了');
        }
    }
    
    integrateWithStatusDisplays() {
        // 既存のステータス表示要素を拡張
        const existingElements = [
            'sessionStatus',
            'phaseStatus', 
            'voiceStatus',
            'networkStatus'
        ];
        
        existingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // 既存要素に状態表示クラスを追加
                element.classList.add('unified-status-value');
                this.displayElements[id] = element;
            }
        });
    }
    
    integrateWithErrorDisplays() {
        // 既存のエラー表示システムとの統合
        const existingErrorDisplay = document.querySelector('.error-display');
        if (existingErrorDisplay) {
            this.displayElements.errorDisplay = existingErrorDisplay;
        }
    }
    
    // =================================================================================
    // デバッグメソッド
    // =================================================================================
    
    debugDisplayStatus() {
        const status = {
            enabled: this.enabled,
            initialized: this.initialized,
            elementsCreated: Object.keys(this.displayElements).length,
            updateQueueLength: this.updateQueue.length,
            isUpdating: this.isUpdating,
            config: UI_STATE_DISPLAY_CONFIG
        };
        
        console.log('🔍 UI状態表示システム - 表示状況:', status);
        return status;
    }
}

// =================================================================================
// グローバル初期化
// =================================================================================

if (typeof window !== 'undefined') {
    // 🔧 自動初期化を無効化
    if (UI_STATE_DISPLAY_CONFIG.AUTO_INITIALIZE) {
        // DOMContentLoaded後に初期化
        document.addEventListener('DOMContentLoaded', () => {
            // 統一状態管理システムの初期化を待つ
            const initializeDisplay = async () => {
                if (window.UnifiedStateManager && window.UnifiedStateManager.initialized) {
                    window.UIStateDisplay = new UIStateDisplaySystem();
                    await window.UIStateDisplay.initialize();
                    
                    console.log('✅ UI状態表示システムが利用可能になりました');
                } else {
                    // 統一状態管理システムの初期化を待つ
                    setTimeout(initializeDisplay, 100);
                }
            };
            
            initializeDisplay();
        });
    } else {
        // 手動初期化のみ - インスタンスのみ作成
        window.UIStateDisplay = new UIStateDisplaySystem();
        console.log('🔧 UIStateDisplay: 手動初期化モード（自動初期化無効）');
    }
}

// CommonJS/ESモジュール対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIStateDisplaySystem;
} 