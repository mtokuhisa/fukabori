// =================================================================================
// STATE INTEGRATION ADAPTER - 状態統合アダプター
// =================================================================================
// 
// 【目的】既存システムと統一状態管理システムの橋渡し
// - AppState、ConversationGatekeeper、ContinuousRecognitionManager の段階的移行
// - 既存コードの無修正での動作保証
// - 透明性の高い状態同期
// 
// =================================================================================

class StateIntegrationAdapter {
    constructor() {
        this.initialized = false;
        this.unifiedStateManager = null;
        this.legacySystems = {
            appState: null,
            conversationGatekeeper: null,
            continuousRecognitionManager: null
        };
        
        this.syncInProgress = false;
        this.lastSyncTime = 0;
        this.syncThrottleMs = 100; // 100ms間隔で同期制限
    }
    
    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        if (this.initialized) return;
        
        console.log('🔄 状態統合アダプター初期化開始');
        
        // 統一状態管理システムの取得
        this.unifiedStateManager = window.UnifiedStateManager;
        if (!this.unifiedStateManager) {
            console.error('❌ 統一状態管理システムが見つかりません');
            return false;
        }
        
        // 既存システムの参照取得
        this.detectLegacySystems();
        
        // 双方向同期の設定
        this.setupBidirectionalSync();
        
        // 初期状態の同期
        await this.performInitialSync();
        
        this.initialized = true;
        console.log('✅ 状態統合アダプター初期化完了');
        
        return true;
    }
    
    // =================================================================================
    // レガシーシステムの検出
    // =================================================================================
    
    detectLegacySystems() {
        // AppStateの検出
        if (window.AppState) {
            this.legacySystems.appState = window.AppState;
            console.log('✅ AppState検出');
        }
        
        // ConversationGatekeeperの検出
        if (window.ConversationGatekeeper) {
            this.legacySystems.conversationGatekeeper = window.ConversationGatekeeper;
            console.log('✅ ConversationGatekeeper検出');
        }
        
        // ContinuousRecognitionManagerの検出（StateManager経由）
        if (window.stateManager?.recognitionManager) {
            this.legacySystems.continuousRecognitionManager = window.stateManager.recognitionManager;
            console.log('✅ ContinuousRecognitionManager検出');
        }
    }
    
    // =================================================================================
    // 双方向同期の設定
    // =================================================================================
    
    setupBidirectionalSync() {
        // 統一システム → レガシーシステム
        this.unifiedStateManager.addListener((eventType, data, state) => {
            this.syncToLegacySystems(eventType, data, state);
        });
        
        // レガシーシステム → 統一システム（定期監視）
        this.setupLegacySystemMonitoring();
        
        console.log('🔄 双方向同期設定完了');
    }
    
    setupLegacySystemMonitoring() {
        // AppStateの変更監視
        if (this.legacySystems.appState) {
            this.monitorAppStateChanges();
        }
        
        // ConversationGatekeeperの状態監視
        if (this.legacySystems.conversationGatekeeper) {
            this.monitorConversationGatekeeperChanges();
        }
        
        // ContinuousRecognitionManagerの状態監視
        if (this.legacySystems.continuousRecognitionManager) {
            this.monitorContinuousRecognitionManagerChanges();
        }
    }
    
    // =================================================================================
    // ContinuousRecognitionManager監視
    // =================================================================================
    
    monitorContinuousRecognitionManagerChanges() {
        const manager = this.legacySystems.continuousRecognitionManager;
        if (!manager) return;
        
        // 状態変更の監視
        if (manager.notifyListeners) {
            const originalNotifyListeners = manager.notifyListeners;
            manager.notifyListeners = () => {
                originalNotifyListeners.call(manager);
                
                // 統一状態管理システムに同期
                this.syncVoiceStateFromContinuousRecognition(manager);
            };
        }
        
        // 結果処理状態の監視
        if (manager.handleResult) {
            const originalHandleResult = manager.handleResult;
            manager.handleResult = (event) => {
                originalHandleResult.call(manager, event);
                
                // 統一状態管理システムに結果処理を通知
                this.unifiedStateManager.updateVoiceState({
                    lastActivity: Date.now(),
                    hasRecentResult: true,
                    recognitionState: 'active'
                });
            };
        }
        
        console.log('✅ ContinuousRecognitionManager監視開始');
    }
    
    // ContinuousRecognitionManagerの状態同期
    syncVoiceStateFromContinuousRecognition(manager) {
        if (!manager || !this.unifiedStateManager) return;
        
        const voiceUpdates = {
            recognitionState: manager.state,
            isRecognitionActive: manager.state === 'active',
            lastActivity: manager.lastResultTime || Date.now(),
            timeSinceLastResult: Date.now() - (manager.lastResultTime || Date.now()),
            processResults: manager.processResults,
            pauseReason: manager.pauseReason
        };
        
        // 統計情報の同期
        if (manager.stats) {
            voiceUpdates.stats = {
                startCount: manager.stats.startCount,
                resultProcessedCount: manager.stats.resultProcessedCount,
                resultIgnoredCount: manager.stats.resultIgnoredCount,
                pauseCount: manager.stats.pauseCount,
                resumeCount: manager.stats.resumeCount
            };
        }
        
        this.unifiedStateManager.updateVoiceState(voiceUpdates);
    }
    
    // =================================================================================
    // ConversationGatekeeper監視
    // =================================================================================
    
    monitorConversationGatekeeperChanges() {
        const gatekeeper = this.legacySystems.conversationGatekeeper;
        if (!gatekeeper) return;
        
        // ConversationGatekeeperの状態監視は必要に応じて実装
        console.log('✅ ConversationGatekeeper監視開始');
    }
    
    // =================================================================================
    // AppState監視
    // =================================================================================
    
    monitorAppStateChanges() {
        const appState = this.legacySystems.appState;
        let lastSnapshot = this.createAppStateSnapshot(appState);
        
        setInterval(() => {
            if (this.syncInProgress) return;
            
            const currentSnapshot = this.createAppStateSnapshot(appState);
            const changes = this.detectAppStateChanges(lastSnapshot, currentSnapshot);
            
            if (Object.keys(changes).length > 0) {
                console.log('🔄 AppState変更検出:', changes);
                this.syncAppStateToUnified(changes);
                lastSnapshot = currentSnapshot;
            }
        }, this.syncThrottleMs);
    }
    
    createAppStateSnapshot(appState) {
        return {
            sessionActive: appState.sessionActive,
            currentTheme: appState.currentTheme,
            apiKey: appState.apiKey,
            currentSpeaker: appState.currentSpeaker,
            phase: appState.phase,
            currentTranscript: appState.currentTranscript,
            transcriptHistory: [...(appState.transcriptHistory || [])],
            isProcessing: appState.isProcessing,
            waitingForPermission: appState.waitingForPermission,
            microphoneActive: appState.microphoneActive,
            voiceRecognitionStability: appState.voiceRecognitionStability ? {
                micPermissionGranted: appState.voiceRecognitionStability.micPermissionGranted,
                isRecognitionActive: appState.voiceRecognitionStability.isRecognitionActive,
                consecutiveErrorCount: appState.voiceRecognitionStability.consecutiveErrorCount,
                lastErrorTime: appState.voiceRecognitionStability.lastErrorTime
            } : null
        };
    }
    
    detectAppStateChanges(oldSnapshot, newSnapshot) {
        const changes = {};
        
        for (const key in newSnapshot) {
            if (JSON.stringify(oldSnapshot[key]) !== JSON.stringify(newSnapshot[key])) {
                changes[key] = newSnapshot[key];
            }
        }
        
        return changes;
    }
    
    syncAppStateToUnified(changes) {
        this.throttledSync(() => {
            // システム状態の同期
            if ('sessionActive' in changes || 'currentTheme' in changes || 'apiKey' in changes || 'phase' in changes) {
                const systemUpdates = {};
                if ('sessionActive' in changes) systemUpdates.sessionActive = changes.sessionActive;
                if ('currentTheme' in changes) systemUpdates.currentTheme = changes.currentTheme;
                if ('apiKey' in changes) systemUpdates.apiKey = changes.apiKey;
                if ('phase' in changes) systemUpdates.currentPhase = changes.phase;
                
                this.unifiedStateManager.updateSystemState(systemUpdates);
            }
            
            // 音声認識状態の同期
            if ('voiceRecognitionStability' in changes && changes.voiceRecognitionStability) {
                const voiceUpdates = {};
                const stability = changes.voiceRecognitionStability;
                
                if ('micPermissionGranted' in stability) {
                    voiceUpdates.microphonePermissionGranted = stability.micPermissionGranted;
                }
                if ('isRecognitionActive' in stability) {
                    voiceUpdates.isRecognitionActive = stability.isRecognitionActive;
                    voiceUpdates.recognitionState = stability.isRecognitionActive ? 'active' : 'idle';
                }
                if ('consecutiveErrorCount' in stability) {
                    voiceUpdates.consecutiveErrorCount = stability.consecutiveErrorCount;
                }
                if ('lastErrorTime' in stability) {
                    voiceUpdates.lastErrorTime = stability.lastErrorTime;
                }
                
                this.unifiedStateManager.updateVoiceState(voiceUpdates);
            }
            
            // 会話フロー状態の同期
            if ('currentSpeaker' in changes) {
                this.unifiedStateManager.updateConversationState({
                    currentSpeaker: changes.currentSpeaker,
                    speakingInProgress: changes.currentSpeaker !== null
                });
            }
            
            // UI状態の同期
            if ('currentTranscript' in changes || 'transcriptHistory' in changes || 'isProcessing' in changes || 'waitingForPermission' in changes) {
                const uiUpdates = {};
                if ('currentTranscript' in changes) uiUpdates.currentTranscript = changes.currentTranscript;
                if ('transcriptHistory' in changes) uiUpdates.transcriptHistory = changes.transcriptHistory;
                if ('isProcessing' in changes) uiUpdates.isProcessing = changes.isProcessing;
                if ('waitingForPermission' in changes) uiUpdates.waitingForPermission = changes.waitingForPermission;
                
                this.unifiedStateManager.updateUIState(uiUpdates);
            }
        });
    }
    
    // =================================================================================
    // 統一システム → レガシーシステム同期
    // =================================================================================
    
    syncToLegacySystems(eventType, data, state) {
        this.throttledSync(() => {
            // AppStateへの同期
            if (this.legacySystems.appState) {
                this.syncToAppState(eventType, data, state);
            }
            
            // ConversationGatekeeperへの同期
            if (this.legacySystems.conversationGatekeeper) {
                this.syncToConversationGatekeeper(eventType, data, state);
            }
            
            // ContinuousRecognitionManagerへの同期
            if (this.legacySystems.continuousRecognitionManager) {
                this.syncToContinuousRecognitionManager(eventType, data, state);
            }
        });
    }
    
    syncToAppState(eventType, data, state) {
        const appState = this.legacySystems.appState;
        
        // システム状態の同期
        if (state.system) {
            if ('sessionActive' in state.system) appState.sessionActive = state.system.sessionActive;
            if ('currentTheme' in state.system) appState.currentTheme = state.system.currentTheme;
            if ('apiKey' in state.system) appState.apiKey = state.system.apiKey;
            if ('currentPhase' in state.system) appState.phase = state.system.currentPhase;
        }
        
        // 音声認識状態の同期
        if (state.voice && appState.voiceRecognitionStability) {
            if ('microphonePermissionGranted' in state.voice) {
                appState.voiceRecognitionStability.micPermissionGranted = state.voice.microphonePermissionGranted;
            }
            if ('isRecognitionActive' in state.voice) {
                appState.voiceRecognitionStability.isRecognitionActive = state.voice.isRecognitionActive;
            }
            if ('consecutiveErrorCount' in state.voice) {
                appState.voiceRecognitionStability.consecutiveErrorCount = state.voice.consecutiveErrorCount;
            }
            if ('lastErrorTime' in state.voice) {
                appState.voiceRecognitionStability.lastErrorTime = state.voice.lastErrorTime;
            }
        }
        
        // 会話フロー状態の同期
        if (state.conversation) {
            if ('currentSpeaker' in state.conversation) {
                appState.currentSpeaker = state.conversation.currentSpeaker;
            }
        }
        
        // UI状態の同期
        if (state.ui) {
            if ('currentTranscript' in state.ui) appState.currentTranscript = state.ui.currentTranscript;
            if ('transcriptHistory' in state.ui) appState.transcriptHistory = state.ui.transcriptHistory;
            if ('isProcessing' in state.ui) appState.isProcessing = state.ui.isProcessing;
            if ('waitingForPermission' in state.ui) appState.waitingForPermission = state.ui.waitingForPermission;
        }
    }
    
    syncToConversationGatekeeper(eventType, data, state) {
        // ConversationGatekeeperは主に読み取り専用なので、
        // 必要に応じて内部状態を更新
        if (eventType === 'conversation_state_changed' && this.legacySystems.conversationGatekeeper.conversationControl) {
            const control = this.legacySystems.conversationGatekeeper.conversationControl;
            if (state.conversation.currentSpeaker !== undefined) {
                control.currentSpeaker = state.conversation.currentSpeaker;
            }
            if (state.conversation.speakingInProgress !== undefined) {
                control.speakingInProgress = state.conversation.speakingInProgress;
            }
        }
    }
    
    syncToContinuousRecognitionManager(eventType, data, state) {
        const manager = this.legacySystems.continuousRecognitionManager;
        
        if (eventType === 'voice_state_changed' && state.voice) {
            // 音声認識マネージャーの状態同期
            if ('recognitionState' in state.voice) {
                manager.state = state.voice.recognitionState;
            }
            if ('isRecognitionActive' in state.voice && manager.stats) {
                // 統計情報の更新は慎重に行う
            }
        }
    }
    
    // =================================================================================
    // 初期同期
    // =================================================================================
    
    async performInitialSync() {
        console.log('🔄 初期状態同期開始');
        
        if (this.legacySystems.appState) {
            const snapshot = this.createAppStateSnapshot(this.legacySystems.appState);
            this.syncAppStateToUnified(snapshot);
            console.log('✅ AppState → 統一システム初期同期完了');
        }
        
        console.log('✅ 初期状態同期完了');
    }
    
    // =================================================================================
    // ユーティリティ
    // =================================================================================
    
    throttledSync(syncFunction) {
        const now = Date.now();
        if (this.syncInProgress || (now - this.lastSyncTime) < this.syncThrottleMs) {
            return;
        }
        
        this.syncInProgress = true;
        this.lastSyncTime = now;
        
        try {
            syncFunction();
        } catch (error) {
            console.error('❌ 状態同期エラー:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // =================================================================================
    // デバッグメソッド
    // =================================================================================
    
    debugSyncStatus() {
        const status = {
            initialized: this.initialized,
            unifiedStateManager: !!this.unifiedStateManager,
            legacySystems: {
                appState: !!this.legacySystems.appState,
                conversationGatekeeper: !!this.legacySystems.conversationGatekeeper,
                continuousRecognitionManager: !!this.legacySystems.continuousRecognitionManager
            },
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime
        };
        
        console.log('🔍 状態統合アダプター - 同期状況:', status);
        return status;
    }
    
    debugStateComparison() {
        if (!this.initialized) {
            console.warn('⚠️ アダプターが初期化されていません');
            return;
        }
        
        const unifiedState = this.unifiedStateManager.getState();
        const appStateSnapshot = this.legacySystems.appState ? 
            this.createAppStateSnapshot(this.legacySystems.appState) : null;
        
        console.log('🔍 状態比較:');
        console.log('  統一システム:', unifiedState);
        console.log('  AppState:', appStateSnapshot);
        
        return { unified: unifiedState, appState: appStateSnapshot };
    }
}

// =================================================================================
// グローバル初期化
// =================================================================================

if (typeof window !== 'undefined') {
    // DOMContentLoaded後に初期化
    document.addEventListener('DOMContentLoaded', () => {
        // 統一状態管理システムの初期化を待つ
        const initializeAdapter = async () => {
            if (window.UnifiedStateManager && window.UnifiedStateManager.initialized) {
                window.StateIntegrationAdapter = new StateIntegrationAdapter();
                await window.StateIntegrationAdapter.initialize();
                
                // グローバルアクセス用のショートカット
                window.debugStateSync = () => window.StateIntegrationAdapter.debugSyncStatus();
                window.debugStateComparison = () => window.StateIntegrationAdapter.debugStateComparison();
                
                console.log('✅ 状態統合アダプターが利用可能になりました');
            } else {
                // 統一状態管理システムの初期化を待つ
                setTimeout(initializeAdapter, 100);
            }
        };
        
        initializeAdapter();
    });
}

// CommonJS/ESモジュール対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateIntegrationAdapter;
} 