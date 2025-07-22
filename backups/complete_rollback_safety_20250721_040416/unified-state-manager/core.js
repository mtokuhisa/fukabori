/**
 * 統一状態管理システム - コア
 * モジュール化された状態管理システムの中核
 */

class UnifiedStateManagerCore {
    constructor() {
        this.isInitialized = false;
        
        // 各モジュールの管理
        this.modules = new Map();
        
        // 統一状態オブジェクト
        this.state = {
            system: {
                phase: 'initialization',
                isActive: false,
                lastUpdate: Date.now()
            },
            voice: null,
            ui: null,
            session: null,
            network: {
                isOnline: navigator.onLine,
                lastCheck: Date.now()
            }
        };
        
        // イベントリスナー
        this.listeners = new Set();
        
        // アクション処理
        this.actionHandlers = new Map();
        
        console.log('🏗️ UnifiedStateManagerCore初期化完了');
    }
    
    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            console.log('🔄 統一状態管理システム初期化開始');
            
            // ネットワーク監視の開始
            this.setupNetworkMonitoring();
            
            // 各モジュールの初期化
            await this.initializeModules();
            
            // アクションハンドラーの設定
            this.setupActionHandlers();
            
            this.updateState('system', {
                phase: 'ready',
                isActive: true
            });
            
            this.isInitialized = true;
            console.log('✅ 統一状態管理システム初期化完了');
            
            return true;
        } catch (error) {
            console.error('❌ 統一状態管理システム初期化エラー:', error);
            this.updateState('system', {
                phase: 'error',
                isActive: false,
                lastError: error.message
            });
            return false;
        }
    }
    
    async initializeModules() {
        console.log('🔄 モジュール初期化開始');
        
        // VoiceModuleの初期化
        if (window.VoiceModule) {
            const voiceModule = new window.VoiceModule(this);
            this.modules.set('voice', voiceModule);
            await voiceModule.initialize();
        }
        
        // UIModuleの初期化
        if (window.UIModule) {
            const uiModule = new window.UIModule(this);
            this.modules.set('ui', uiModule);
            await uiModule.initialize();
        }
        
        // SessionModuleの初期化（将来実装）
        // NetworkModuleの初期化（将来実装）
        
        console.log('✅ モジュール初期化完了');
    }
    
    setupNetworkMonitoring() {
        // オンライン/オフライン状態の監視
        window.addEventListener('online', () => {
            this.updateState('network', {
                isOnline: true,
                lastCheck: Date.now()
            });
        });
        
        window.addEventListener('offline', () => {
            this.updateState('network', {
                isOnline: false,
                lastCheck: Date.now()
            });
        });
    }
    
    setupActionHandlers() {
        // 音声認識関連のアクション
        this.actionHandlers.set('requestMicrophone', async () => {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                await voiceModule.checkMicrophonePermission();
            }
        });
        
        this.actionHandlers.set('startVoiceRecognition', async () => {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                await voiceModule.startRecognition();
            }
        });
        
        this.actionHandlers.set('stopVoiceRecognition', () => {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                voiceModule.stopRecognition();
            }
        });
        
        this.actionHandlers.set('pauseVoiceRecognition', () => {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                voiceModule.pauseRecognition();
            }
        });
        
        this.actionHandlers.set('resumeVoiceRecognition', () => {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                voiceModule.resumeRecognition();
            }
        });
        
        this.actionHandlers.set('retryVoiceRecognition', async () => {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                voiceModule.updateState({ recognitionState: 'idle', lastError: null });
                await voiceModule.startRecognition();
            }
        });
        
        // UI関連のアクション
        this.actionHandlers.set('openSettings', () => {
            console.log('⚙️ 設定画面を開きます');
            // 実際の設定画面表示処理はここに実装
        });
    }
    
    // =================================================================================
    // 状態管理
    // =================================================================================
    
    updateState(moduleKey, updates) {
        if (!this.state.hasOwnProperty(moduleKey)) {
            console.warn(`⚠️ 未知のモジュール: ${moduleKey}`);
            return;
        }
        
        const oldState = this.state[moduleKey] ? { ...this.state[moduleKey] } : null;
        
        if (this.state[moduleKey]) {
            Object.assign(this.state[moduleKey], updates);
        } else {
            this.state[moduleKey] = { ...updates };
        }
        
        // 最終更新時刻を記録
        this.state.system.lastUpdate = Date.now();
        
        // 状態変更イベントを発火
        this.notifyListeners('stateChange', {
            module: moduleKey,
            oldState,
            newState: this.state[moduleKey],
            changes: updates,
            globalState: this.getState()
        });
        
        console.log(`📊 状態更新: ${moduleKey}`, updates);
    }
    
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    getModuleState(moduleKey) {
        return this.state[moduleKey] ? { ...this.state[moduleKey] } : null;
    }
    
    // =================================================================================
    // モジュール管理
    // =================================================================================
    
    getModule(moduleKey) {
        return this.modules.get(moduleKey);
    }
    
    hasModule(moduleKey) {
        return this.modules.has(moduleKey);
    }
    
    getAllModules() {
        return Array.from(this.modules.keys());
    }
    
    // =================================================================================
    // アクション処理
    // =================================================================================
    
    async dispatchAction(actionType, payload = null) {
        console.log('🚀 アクション実行:', actionType, payload);
        
        const handler = this.actionHandlers.get(actionType);
        if (handler) {
            try {
                await handler(payload);
            } catch (error) {
                console.error(`❌ アクション実行エラー: ${actionType}`, error);
                this.notifyListeners('actionError', {
                    actionType,
                    error: error.message,
                    payload
                });
            }
        } else {
            console.warn(`⚠️ 未知のアクション: ${actionType}`);
        }
    }
    
    registerActionHandler(actionType, handler) {
        this.actionHandlers.set(actionType, handler);
    }
    
    // =================================================================================
    // イベントリスナー管理
    // =================================================================================
    
    addEventListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
        } else {
            console.warn('⚠️ addEventListener: 無効なコールバック:', typeof callback, callback);
        }
    }
    
    removeEventListener(callback) {
        this.listeners.delete(callback);
    }
    
    notifyListeners(eventType, data) {
        this.listeners.forEach(callback => {
            try {
                if (typeof callback === 'function') {
                    callback(eventType, data);
                } else {
                    console.warn('⚠️ 無効なリスナー:', typeof callback, callback);
                    // 無効なリスナーを削除
                    this.listeners.delete(callback);
                }
            } catch (error) {
                console.error('❌ リスナーエラー:', error);
                // エラーを起こすリスナーを削除
                this.listeners.delete(callback);
            }
        });
    }
    
    // =================================================================================
    // 既存システムとの互換性
    // =================================================================================
    
    // 既存のAppStateとの互換性を提供
    getAppState() {
        return {
            sessionActive: this.state.system?.isActive || false,
            microphoneActive: this.state.voice?.recognitionState === 'active' || false,
            currentPhase: this.state.system?.phase || 'initialization',
            lastError: this.state.voice?.lastError || null
        };
    }
    
    // 既存のConversationGatekeeperとの互換性を提供
    getConversationState() {
        return {
            isListening: this.state.voice?.isListening || false,
            canSpeak: this.state.voice?.recognitionState === 'idle' || false,
            isProcessing: this.state.voice?.recognitionState === 'starting' || false
        };
    }
    
    // =================================================================================
    // ユーザー向け情報
    // =================================================================================
    
    getUserStatus() {
        const status = {
            systemReady: this.state.system?.isActive || false,
            currentPhase: this.state.system?.phase || 'initialization',
            canInteract: false,
            message: '',
            availableActions: []
        };
        
        // 音声認識の状態に基づいてユーザー情報を生成
        if (this.state.voice) {
            const voiceModule = this.modules.get('voice');
            if (voiceModule) {
                const voiceStatus = voiceModule.getUserStatus();
                status.canInteract = voiceStatus.canStart || voiceStatus.canStop;
                status.message = voiceStatus.userMessage;
                status.availableActions = voiceStatus.availableActions || [];
            }
        }
        
        return status;
    }
    
    // =================================================================================
    // デバッグ・統計
    // =================================================================================
    
    getDebugInfo() {
        const moduleInfo = {};
        this.modules.forEach((module, key) => {
            moduleInfo[key] = module.getDebugInfo ? module.getDebugInfo() : { available: true };
        });
        
        return {
            core: {
                initialized: this.isInitialized,
                modulesCount: this.modules.size,
                listenersCount: this.listeners.size,
                actionHandlersCount: this.actionHandlers.size
            },
            state: this.state,
            modules: moduleInfo
        };
    }
    
    getStatistics() {
        const stats = {
            systemUptime: this.state.system?.lastUpdate ? 
                Date.now() - this.state.system.lastUpdate : 0,
            moduleCount: this.modules.size,
            totalStateUpdates: 0 // 実装時にカウンターを追加
        };
        
        // 各モジュールの統計情報を収集
        this.modules.forEach((module, key) => {
            if (module.getStatistics) {
                stats[key] = module.getStatistics();
            }
        });
        
        return stats;
    }
    
    // =================================================================================
    // 緊急時の処理
    // =================================================================================
    
    emergencyStop() {
        console.log('🚨 緊急停止処理開始');
        
        // 音声認識の停止
        const voiceModule = this.modules.get('voice');
        if (voiceModule) {
            voiceModule.stopRecognition();
        }
        
        // システム状態の更新
        this.updateState('system', {
            phase: 'emergency_stop',
            isActive: false
        });
        
        // 緊急停止イベントを発火
        this.notifyListeners('emergencyStop', {
            timestamp: Date.now(),
            reason: 'manual_emergency_stop'
        });
    }
    
    async restart() {
        console.log('🔄 システム再起動開始');
        
        // 各モジュールの再初期化
        for (const [key, module] of this.modules) {
            if (module.initialize) {
                await module.initialize();
            }
        }
        
        // システム状態の更新
        this.updateState('system', {
            phase: 'ready',
            isActive: true
        });
        
        console.log('✅ システム再起動完了');
    }
}

// グローバルエクスポート
window.UnifiedStateManagerCore = UnifiedStateManagerCore; 