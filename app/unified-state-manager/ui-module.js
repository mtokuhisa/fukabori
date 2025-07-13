/**
 * UI状態モジュール - 統一状態管理システム
 * ユーザー向け状態表示とガイダンス管理
 */

class UIModule {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.isInitialized = false;
        
        // UI状態
        this.state = {
            // 画面状態
            currentScreen: 'login', // login, setup, main, settings, knowledge
            theme: 'light', // light, dark, colorful
            
            // 表示状態
            isLoading: false,
            loadingMessage: '',
            
            // ユーザーガイダンス
            userMessage: '',
            userAction: '',
            availableActions: [],
            
            // 通知・アラート
            notifications: [],
            alerts: [],
            
            // モーダル・ダイアログ
            modalOpen: false,
            modalType: null,
            modalData: null,
            
            // レスポンシブ
            isMobile: false,
            screenSize: 'desktop'
        };
        
        // UI要素への参照
        this.elements = {
            statusDisplay: null,
            userGuidance: null,
            actionButtons: null,
            notifications: null
        };
        
        console.log('🎨 UIModule初期化完了');
    }
    
    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            console.log('🔄 UIモジュール初期化開始');
            
            // 画面サイズの検出
            this.detectScreenSize();
            
            // UI要素の作成
            this.createUIElements();
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            // 初期状態の表示
            this.updateDisplay();
            
            this.isInitialized = true;
            console.log('✅ UIモジュール初期化完了');
            
            return true;
        } catch (error) {
            console.error('❌ UIモジュール初期化エラー:', error);
            return false;
        }
    }
    
    detectScreenSize() {
        const width = window.innerWidth;
        
        if (width < 768) {
            this.updateState({
                isMobile: true,
                screenSize: 'mobile'
            });
        } else if (width < 1024) {
            this.updateState({
                isMobile: false,
                screenSize: 'tablet'
            });
        } else {
            this.updateState({
                isMobile: false,
                screenSize: 'desktop'
            });
        }
    }
    
    createUIElements() {
        // 状態表示パネルの作成
        this.createStatusDisplay();
        
        // ユーザーガイダンスパネルの作成
        this.createUserGuidance();
        
        // 通知システムの作成
        this.createNotificationSystem();
        
        console.log('🎨 UI要素作成完了');
    }
    
    createStatusDisplay() {
        // 既存の要素をチェック
        let statusContainer = document.getElementById('unified-status-display');
        
        if (!statusContainer) {
            statusContainer = document.createElement('div');
            statusContainer.id = 'unified-status-display';
            statusContainer.className = 'unified-status-display';
            
            // メイン画面に追加
            const mainContainer = document.querySelector('.main-container') || 
                                document.querySelector('#main-screen') || 
                                document.body;
            mainContainer.appendChild(statusContainer);
        }
        
        statusContainer.innerHTML = `
            <div class="status-header">
                <h3>📊 システム状態</h3>
                <button class="status-toggle" onclick="window.UIModule?.toggleStatusDisplay()">
                    <span class="toggle-icon">▼</span>
                </button>
            </div>
            <div class="status-content">
                <div class="status-section">
                    <div class="status-item">
                        <label>🎤 音声認識:</label>
                        <span id="voice-status" class="status-value">初期化中...</span>
                    </div>
                    <div class="status-item">
                        <label>📱 システム:</label>
                        <span id="system-status" class="status-value">準備中...</span>
                    </div>
                    <div class="status-item">
                        <label>🌐 ネットワーク:</label>
                        <span id="network-status" class="status-value">確認中...</span>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.statusDisplay = statusContainer;
    }
    
    createUserGuidance() {
        // 既存の要素をチェック
        let guidanceContainer = document.getElementById('user-guidance-display');
        
        if (!guidanceContainer) {
            guidanceContainer = document.createElement('div');
            guidanceContainer.id = 'user-guidance-display';
            guidanceContainer.className = 'user-guidance-display';
            
            // メイン画面に追加
            const mainContainer = document.querySelector('.main-container') || 
                                document.querySelector('#main-screen') || 
                                document.body;
            mainContainer.appendChild(guidanceContainer);
        }
        
        guidanceContainer.innerHTML = `
            <div class="guidance-content">
                <div class="user-message">
                    <div class="message-icon">💡</div>
                    <div class="message-text">
                        <div id="user-message-text">システムを初期化しています...</div>
                        <div id="user-action-text" class="action-text">しばらくお待ちください</div>
                    </div>
                </div>
                <div class="available-actions" id="available-actions">
                    <!-- 動的に生成される操作ボタン -->
                </div>
            </div>
        `;
        
        this.elements.userGuidance = guidanceContainer;
    }
    
    createNotificationSystem() {
        // 通知コンテナの作成
        let notificationContainer = document.getElementById('notification-container');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        this.elements.notifications = notificationContainer;
    }
    
    setupEventListeners() {
        // 画面サイズ変更の監視
        window.addEventListener('resize', () => {
            this.detectScreenSize();
        });
        
        // 統一状態管理システムの状態変更を監視
        this.stateManager.addEventListener((eventType, data) => {
            if (eventType === 'stateChange') {
                this.handleStateChange(data);
            }
        });
    }
    
    // =================================================================================
    // 状態表示の更新
    // =================================================================================
    
    updateDisplay() {
        this.updateStatusDisplay();
        this.updateUserGuidance();
        this.updateNotifications();
    }
    
    updateNotifications() {
        // 通知システムの状態を更新
        const globalState = this.stateManager.getState();
        
        // 新しい通知があるかチェック
        if (globalState.ui && globalState.ui.notifications) {
            globalState.ui.notifications.forEach(notification => {
                if (!notification.displayed) {
                    this.showNotification(notification.message, notification.type, notification.duration);
                    notification.displayed = true;
                }
            });
        }
        
        // エラー状態の通知
        if (globalState.voice && globalState.voice.recognitionState === 'error') {
            const errorMessage = globalState.voice.lastError || '音声認識でエラーが発生しました';
            this.showNotification(errorMessage, 'error');
        }
    }
    
    updateStatusDisplay() {
        const globalState = this.stateManager.getState();
        
        // 音声認識状態の表示
        const voiceStatus = document.getElementById('voice-status');
        if (voiceStatus && globalState.voice) {
            const voice = globalState.voice;
            const statusText = this.getVoiceStatusText(voice.recognitionState);
            const statusClass = this.getVoiceStatusClass(voice.recognitionState);
            
            voiceStatus.textContent = statusText;
            voiceStatus.className = `status-value ${statusClass}`;
        }
        
        // システム状態の表示
        const systemStatus = document.getElementById('system-status');
        if (systemStatus && globalState.system) {
            const system = globalState.system;
            systemStatus.textContent = system.phase || '準備中';
            systemStatus.className = `status-value ${system.isActive ? 'active' : 'inactive'}`;
        }
        
        // ネットワーク状態の表示
        const networkStatus = document.getElementById('network-status');
        if (networkStatus && globalState.network) {
            const network = globalState.network;
            networkStatus.textContent = network.isOnline ? '接続中' : '切断';
            networkStatus.className = `status-value ${network.isOnline ? 'online' : 'offline'}`;
        }
    }
    
    updateUserGuidance() {
        const globalState = this.stateManager.getState();
        
        // ユーザーメッセージの更新
        const messageText = document.getElementById('user-message-text');
        const actionText = document.getElementById('user-action-text');
        const actionsContainer = document.getElementById('available-actions');
        
        if (messageText && actionText && actionsContainer) {
            // 現在の状態に基づいてメッセージを生成
            const guidance = this.generateUserGuidance(globalState);
            
            messageText.textContent = guidance.message;
            actionText.textContent = guidance.action;
            
            // 利用可能な操作ボタンを生成
            this.renderActionButtons(actionsContainer, guidance.availableActions);
        }
    }
    
    generateUserGuidance(globalState) {
        // 🗑️ ポップアップメッセージを完全に削除
        // ユーザーからの要求により、邪魔なガイダンスメッセージを表示しない
        return {
            message: '',
            action: '',
            availableActions: []
        };
    }
    
    renderActionButtons(container, actions) {
        container.innerHTML = '';
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.id = action.id;
            button.className = 'action-button';
            button.textContent = action.text;
            button.onclick = () => this.handleActionClick(action.action);
            container.appendChild(button);
        });
    }
    
    handleActionClick(actionType) {
        console.log('🔘 ユーザーアクション:', actionType);
        
        // 統一状態管理システムに操作を通知
        this.stateManager.dispatchAction(actionType);
        
        // 各種操作の処理
        switch (actionType) {
            case 'requestMicrophone':
                this.requestMicrophonePermission();
                break;
            case 'startVoiceRecognition':
                this.startVoiceRecognition();
                break;
            case 'stopVoiceRecognition':
                this.stopVoiceRecognition();
                break;
            case 'pauseVoiceRecognition':
                this.pauseVoiceRecognition();
                break;
            case 'resumeVoiceRecognition':
                this.resumeVoiceRecognition();
                break;
            case 'retryVoiceRecognition':
                this.retryVoiceRecognition();
                break;
            case 'openSettings':
                this.openSettings();
                break;
        }
    }
    
    // =================================================================================
    // 操作処理
    // =================================================================================
    
    async requestMicrophonePermission() {
        const voiceModule = this.stateManager.getModule('voice');
        if (voiceModule) {
            await voiceModule.checkMicrophonePermission();
        }
    }
    
    async startVoiceRecognition() {
        const voiceModule = this.stateManager.getModule('voice');
        if (voiceModule) {
            await voiceModule.startRecognition();
        }
    }
    
    stopVoiceRecognition() {
        const voiceModule = this.stateManager.getModule('voice');
        if (voiceModule) {
            voiceModule.stopRecognition();
        }
    }
    
    pauseVoiceRecognition() {
        const voiceModule = this.stateManager.getModule('voice');
        if (voiceModule) {
            voiceModule.pauseRecognition();
        }
    }
    
    resumeVoiceRecognition() {
        const voiceModule = this.stateManager.getModule('voice');
        if (voiceModule) {
            voiceModule.resumeRecognition();
        }
    }
    
    async retryVoiceRecognition() {
        const voiceModule = this.stateManager.getModule('voice');
        if (voiceModule) {
            // エラー状態をリセットしてから再開
            voiceModule.updateState({ recognitionState: 'idle', lastError: null });
            await voiceModule.startRecognition();
        }
    }
    
    openSettings() {
        // 設定画面を開く処理
        console.log('⚙️ 設定画面を開きます');
        // 実際の設定画面表示処理はここに実装
    }
    
    // =================================================================================
    // 通知システム
    // =================================================================================
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now(),
            message,
            type, // info, success, warning, error
            timestamp: new Date(),
            duration
        };
        
        this.state.notifications.push(notification);
        this.renderNotification(notification);
        
        // 自動削除
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }
    
    renderNotification(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.id = `notification-${notification.id}`;
        notificationElement.className = `notification notification-${notification.type}`;
        
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="notification-message">${notification.message}</div>
                <button class="notification-close" onclick="window.UIModule?.removeNotification(${notification.id})">×</button>
            </div>
        `;
        
        this.elements.notifications.appendChild(notificationElement);
        
        // アニメーション
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);
    }
    
    removeNotification(id) {
        const notificationElement = document.getElementById(`notification-${id}`);
        if (notificationElement) {
            notificationElement.classList.add('hide');
            setTimeout(() => {
                notificationElement.remove();
            }, 300);
        }
        
        // 状態からも削除
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }
    
    // =================================================================================
    // ヘルパーメソッド
    // =================================================================================
    
    getVoiceStatusText(state) {
        const statusTexts = {
            idle: '待機中',
            starting: '開始中...',
            active: '聞いています',
            paused: '一時停止',
            stopping: '停止中...',
            error: 'エラー'
        };
        return statusTexts[state] || state;
    }
    
    getVoiceStatusClass(state) {
        const statusClasses = {
            idle: 'idle',
            starting: 'loading',
            active: 'active',
            paused: 'paused',
            stopping: 'loading',
            error: 'error'
        };
        return statusClasses[state] || 'unknown';
    }
    
    toggleStatusDisplay() {
        const statusContent = this.elements.statusDisplay?.querySelector('.status-content');
        const toggleIcon = this.elements.statusDisplay?.querySelector('.toggle-icon');
        
        if (statusContent && toggleIcon) {
            const isVisible = statusContent.style.display !== 'none';
            statusContent.style.display = isVisible ? 'none' : 'block';
            toggleIcon.textContent = isVisible ? '▶' : '▼';
        }
    }
    
    // =================================================================================
    // 状態管理
    // =================================================================================
    
    updateState(updates) {
        Object.assign(this.state, updates);
        this.stateManager.updateState('ui', this.state);
    }
    
    getState() {
        return { ...this.state };
    }
    
    handleStateChange(event) {
        // 状態変更に応じてUIを更新
        this.updateDisplay();
    }
    
    // =================================================================================
    // デバッグ
    // =================================================================================
    
    getDebugInfo() {
        return {
            module: 'UIModule',
            initialized: this.isInitialized,
            state: this.state,
            elementsCreated: Object.keys(this.elements).filter(key => this.elements[key]).length
        };
    }
}

// グローバルエクスポート
window.UIModule = UIModule; 