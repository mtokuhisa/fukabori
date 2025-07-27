/**
 * TranscriptEditManager - リアルタイム文字起こし編集制御システム
 * =====================================================================
 * 
 * 【責任範囲】
 * - 編集状態管理（isEditing, originalText）
 * - 音声認識制御統合（一時停止ボタンとの連携）
 * - データ同期（AppState.currentTranscriptとの同期）
 * - 緊急無効化・フォールバック制御
 * 
 * 【設計原則】
 * - 既存機能の完全保護（Phase 1音声コマンドシステム等）
 * - 性能優先（リアルタイム音声認識性能維持）
 * - 段階的実装（各機能の独立テスト可能）
 * - 緊急無効化対応（単一設定での完全無効化可能）
 * 
 * バージョン: v1.0 (Phase A)
 * 作成日: 2025年7月24日
 */

/**
 * リアルタイム文字起こし編集管理システム
 * 
 * 🎯 Phase 1A新機能: 状態同期制御システム
 * - 循環参照防止機構
 * - 状態更新のアトミック処理
 * - デバッグ・トラッキング機能
 * 
 * @version 0.7.6-phase1a
 * @author AI Assistant
 * @created 2025-01-26
 */

/**
 * 状態更新制御クラス - 循環参照防止と安全な同期処理
 */
class StateUpdateController {
    constructor() {
        this.isUpdatingFromEdit = false;
        this.isUpdatingFromVoice = false;
        this.isUpdatingFromAdapter = false;
        this.updateQueue = new Map();
        this.debugLogs = [];
        this.maxDebugLogs = 50;
    }
    
    /**
     * 循環更新防止機構
     */
    preventCircularUpdate(source, operation, callback) {
        const flagName = `isUpdatingFrom${source.charAt(0).toUpperCase() + source.slice(1)}`;
        
        if (this[flagName]) {
            this.logDebug(`🛡️ 循環更新防止: ${source} -> ${operation}`);
            return null;
        }
        
        this[flagName] = true;
        this.logDebug(`🔄 状態更新開始: ${source} -> ${operation}`);
        
        try {
            const result = callback();
            this.logDebug(`✅ 状態更新完了: ${source} -> ${operation}`);
            return result;
        } catch (error) {
            this.logDebug(`❌ 状態更新エラー: ${source} -> ${operation}`, error);
            throw error;
        } finally {
            this[flagName] = false;
        }
    }
    
    /**
     * アトミック状態更新
     */
    atomicStateUpdate(source, updates) {
        return this.preventCircularUpdate(source, 'atomicUpdate', () => {
            const backup = this.createStateBackup();
            try {
                // 全ての更新を一括実行
                Object.entries(updates).forEach(([target, updateFunc]) => {
                    updateFunc();
                });
                return true;
            } catch (error) {
                // エラー時は状態を復元
                this.restoreStateBackup(backup);
                throw error;
            }
        });
    }
    
    /**
     * 状態バックアップ作成
     */
    createStateBackup() {
        if (!window.AppState) return null;
        return {
            currentTranscript: window.AppState.currentTranscript,
            transcriptHistory: [...(window.AppState.transcriptHistory || [])],
            timestamp: Date.now()
        };
    }
    
    /**
     * 状態バックアップ復元
     */
    restoreStateBackup(backup) {
        if (!backup || !window.AppState) return false;
        
        window.AppState.currentTranscript = backup.currentTranscript;
        window.AppState.transcriptHistory = [...backup.transcriptHistory];
        
        this.logDebug('🔄 状態バックアップ復元完了');
        return true;
    }
    
    /**
     * デバッグログ記録
     */
    logDebug(message, data = null) {
        const logEntry = {
            timestamp: Date.now(),
            message,
            data: data ? JSON.stringify(data) : null,
            stack: new Error().stack
        };
        
        this.debugLogs.push(logEntry);
        if (this.debugLogs.length > this.maxDebugLogs) {
            this.debugLogs.shift();
        }
        
        console.log(`[StateController] ${message}`, data || '');
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            logs: this.debugLogs,
            currentFlags: {
                isUpdatingFromEdit: this.isUpdatingFromEdit,
                isUpdatingFromVoice: this.isUpdatingFromVoice,
                isUpdatingFromAdapter: this.isUpdatingFromAdapter
            },
            queueSize: this.updateQueue.size
        };
    }
}

// グローバルインスタンス作成
window.StateUpdateController = new StateUpdateController();

(function(global) {
    'use strict';
    
    // =================================================================================
    // SYSTEM CONTROL FLAGS - システム制御フラグ
    // =================================================================================
    
    const TRANSCRIPT_EDIT_CONFIG = {
        ENABLED: true,                    // 🔧 緊急無効化フラグ（false=完全無効化）
        AUTO_PAUSE_ON_EDIT: true,        // 編集開始時の自動一時停止
        KEYBOARD_SHORTCUTS: true,        // キーボードショートカット有効
        PERFORMANCE_MONITORING: true,    // 性能監視有効
        DEBUG_MODE: true,               // デバッグモード
        VERSION: '1.0-phase-a'
    };
    
    // =================================================================================
    // MAIN CLASS - TranscriptEditManager
    // =================================================================================
    
    class TranscriptEditManager {
        constructor() {
            this.isInitialized = false;
            this.version = TRANSCRIPT_EDIT_CONFIG.VERSION;
            
            // 🔧 緊急無効化チェック
            this.enabled = TRANSCRIPT_EDIT_CONFIG.ENABLED;
            if (!this.enabled) {
                console.log('🚫 TranscriptEditManager: システムが無効化されています');
                return;
            }
            
            // 編集状態管理
            this.isEditing = false;
            this.originalText = '';
            this.editStartTime = null;
            
            // 音声認識制御統合
            this.pauseController = null;
            this.wasRecognitionActiveBeforeEdit = false;
            this.lastManualActionTime = 0;
            
            // UI要素参照
            this.transcriptDisplay = null;
            this.editableUI = null;
            
            // 性能監視
            this.performanceStats = {
                editStartCount: 0,
                editCompleteCount: 0,
                averageEditDuration: 0,
                lastEditDuration: 0
            };
            
            console.log(`🎯 TranscriptEditManager v${this.version} 初期化完了`);
        }
        
        // =============================================================================
        // INITIALIZATION - 初期化
        // =============================================================================
        
        /**
         * システム初期化
         */
        async initialize() {
            if (!this.enabled) {
                console.log('🚫 TranscriptEditManager: 無効化のため初期化をスキップ');
                return false;
            }
            
            if (this.isInitialized) {
                console.log('✅ TranscriptEditManager: 既に初期化済み');
                return true;
            }
            
            try {
                console.log('🔄 TranscriptEditManager 初期化開始');
                
                // DOM要素の取得
                this.transcriptDisplay = this.getTranscriptDisplayElement();
                if (!this.transcriptDisplay) {
                    throw new Error('transcriptDisplay要素が見つかりません');
                }
                
                // EditableTranscriptUIとの連携準備
                // NOTE: EditableTranscriptUIクラスは次のタスクで実装
                
                // 既存一時停止ボタンとの連携準備
                this.setupPauseController();
                
                // イベントリスナー設定
                this.setupEventListeners();
                
                this.isInitialized = true;
                console.log('✅ TranscriptEditManager 初期化完了');
                return true;
                
            } catch (error) {
                console.error('❌ TranscriptEditManager 初期化エラー:', error);
                
                // 緊急フォールバック: システムを無効化
                this.enabled = false;
                console.log('🛡️ 緊急フォールバック: 編集機能を無効化しました');
                return false;
            }
        }
        
        /**
         * transcriptDisplay要素の取得
         */
        getTranscriptDisplayElement() {
            // 🔧 既存システムのDOM取得方法を使用
            if (window.UIManager && window.UIManager.DOMUtils) {
                return window.UIManager.DOMUtils.get('transcriptDisplay');
            }
            
            // フォールバック: 直接DOM取得
            return document.getElementById('transcriptDisplay');
        }
        
        /**
         * 一時停止制御システムとの連携設定
         */
        setupPauseController() {
            // NOTE: Phase B で実装予定
            // 既存の toggleMicrophone() 関数との連携
            this.pauseController = {
                pause: () => {
                    if (typeof window.toggleMicrophone === 'function') {
                        // 現在の状態を確認して一時停止実行
                        console.log('🔄 編集開始による自動一時停止');
                        return true;
                    }
                    return false;
                },
                resume: () => {
                    if (typeof window.toggleMicrophone === 'function') {
                        // 現在の状態を確認して再開実行
                        console.log('🔄 編集完了による自動再開');
                        return true;
                    }
                    return false;
                }
            };
        }
        
        /**
         * イベントリスナー設定
         */
        setupEventListeners() {
            if (!this.transcriptDisplay) return;
            
            // transcriptDisplayクリックで編集開始
            this.transcriptDisplay.addEventListener('click', (event) => {
                this.handleTranscriptClick(event);
            });
            
            // 編集モード用のキーボードイベント（Phase C で実装予定）
            document.addEventListener('keydown', (event) => {
                if (this.isEditing) {
                    this.handleEditingKeydown(event);
                }
            });
        }
        
        // =============================================================================
        // EDIT CONTROL - 編集制御
        // =============================================================================
        
        /**
         * 編集開始処理
         */
        async startEditing() {
            if (!this.enabled || !this.isInitialized) {
                console.log('🚫 編集機能が無効または未初期化');
                return false;
            }
            
            if (this.isEditing) {
                console.log('⚠️ 既に編集中です');
                return false;
            }
            
            try {
                console.log('🎯 編集開始処理開始');
                
                // 🎯 Phase 1C: 編集開始前のバックアップ作成
                if (window.EmergencySystemManager) {
                    window.EmergencySystemManager.createFullSystemBackup('edit-start');
                }
                
                // 現在のテキストを保存
                this.originalText = this.transcriptDisplay.textContent || '';
                
                // 音声認識の一時停止（手動操作チェック付き）
                if (TRANSCRIPT_EDIT_CONFIG.AUTO_PAUSE_ON_EDIT && !this.isUserManuallyControllingAudio()) {
                    this.wasRecognitionActiveBeforeEdit = await this.pauseVoiceRecognition();
                } else if (this.isUserManuallyControllingAudio()) {
                    console.log('🚫 手動操作検知のため自動一時停止をスキップ');
                    this.wasRecognitionActiveBeforeEdit = false;
                }
                
                // 編集状態に移行
                this.isEditing = true;
                this.editStartTime = performance.now();
                
                // EditableTranscriptUIの有効化（次のタスクで実装）
                if (this.editableUI) {
                    this.editableUI.enableEditing();
                }
                
                // 統計更新
                this.performanceStats.editStartCount++;
                
                console.log('✅ 編集開始完了');
                return true;
                
            } catch (error) {
                console.error('❌ 編集開始エラー:', error);
                this.isEditing = false;
                return false;
            }
        }
        
        /**
         * 編集完了処理 - Phase 1A拡張版
         */
        async finishEditing(newText = null) {
            if (!this.isEditing) {
                console.log('⚠️ 編集中ではありません');
                return false;
            }
            
            try {
                console.log('🎯 編集完了処理開始 (Phase 1A拡張)');
                
                // 新しいテキストの決定
                const finalText = newText || this.transcriptDisplay.textContent || '';
                
                // 🎯 Phase 1A: 状態同期制御システムによる安全な更新
                const updateSuccess = window.StateUpdateController.atomicStateUpdate('edit', {
                    'AppState': () => {
                        if (window.AppState) {
                            // currentTranscriptとtranscriptHistoryの完全同期
                            window.AppState.currentTranscript = finalText;
                            
                            // 🔧 重要: transcriptHistoryも更新（これが欠けていた原因）
                            if (finalText.trim()) {
                                window.AppState.transcriptHistory = [finalText.trim()];
                            } else {
                                window.AppState.transcriptHistory = [];
                            }
                            
                            console.log('🔄 AppState完全同期完了:', {
                                currentTranscript: finalText,
                                transcriptHistory: window.AppState.transcriptHistory
                            });
                        }
                    },
                    
                    'StateIntegrationAdapter': () => {
                        // 統一状態管理システムへの変更通知
                        if (window.StateIntegrationAdapter && window.StateIntegrationAdapter.notifyAppStateChange) {
                            window.StateIntegrationAdapter.notifyAppStateChange({
                                currentTranscript: finalText,
                                transcriptHistory: window.AppState.transcriptHistory || []
                            });
                            console.log('🔄 StateIntegrationAdapter通知完了');
                        }
                    },
                    
                    'SpeechCorrectionSystem': () => {
                        // 音声訂正システムの同期
                        if (window.SpeechCorrectionSystem && window.SpeechCorrectionSystem.setCurrentInput) {
                            window.SpeechCorrectionSystem.setCurrentInput(finalText);
                            console.log('🔄 SpeechCorrectionSystem同期完了');
                        }
                    }
                });
                
                if (!updateSuccess) {
                    throw new Error('状態更新に失敗しました');
                }
                
                // 🎯 Phase 1C: 編集完了後のバックアップ作成
                if (window.EmergencySystemManager) {
                    window.EmergencySystemManager.createFullSystemBackup('edit-complete');
                }
                
                // 音声認識の再開（手動操作チェック付き）
                if (this.wasRecognitionActiveBeforeEdit && TRANSCRIPT_EDIT_CONFIG.AUTO_PAUSE_ON_EDIT && !this.isUserManuallyControllingAudio()) {
                    await this.resumeVoiceRecognition();
                } else if (this.isUserManuallyControllingAudio()) {
                    console.log('🚫 手動操作検知のため自動再開をスキップ');
                }
                
                // 編集状態解除
                this.isEditing = false;
                
                // EditableTranscriptUIの無効化
                if (this.editableUI) {
                    this.editableUI.disableEditing();
                }
                
                // 性能統計更新
                if (this.editStartTime) {
                    const duration = performance.now() - this.editStartTime;
                    this.performanceStats.lastEditDuration = duration;
                    this.performanceStats.editCompleteCount++;
                    
                    const totalEdits = this.performanceStats.editCompleteCount;
                    this.performanceStats.averageEditDuration = 
                        (this.performanceStats.averageEditDuration * (totalEdits - 1) + duration) / totalEdits;
                }
                
                console.log(`✅ 編集完了 (Phase 1A): "${this.originalText}" → "${finalText}"`);
                return true;
                
            } catch (error) {
                console.error('❌ 編集完了エラー (Phase 1A):', error);
                
                // エラー時の状態デバッグ情報出力
                console.error('🔍 デバッグ情報:', window.StateUpdateController.getDebugInfo());
                
                return false;
            }
        }
        
        /**
         * 編集キャンセル処理
         */
        async cancelEditing() {
            if (!this.isEditing) {
                console.log('⚠️ 編集中ではありません');
                return false;
            }
            
            try {
                console.log('🚫 編集キャンセル処理開始');
                
                // 元のテキストに復元
                if (this.transcriptDisplay) {
                    this.transcriptDisplay.textContent = this.originalText;
                }
                
                // 編集完了処理を実行（元のテキストで）
                await this.finishEditing(this.originalText);
                
                console.log('✅ 編集キャンセル完了');
                return true;
                
            } catch (error) {
                console.error('❌ 編集キャンセルエラー:', error);
                return false;
            }
        }
        
        // =============================================================================
        // EVENT HANDLERS - イベントハンドラー
        // =============================================================================
        
        /**
         * transcriptDisplayクリックハンドラー
         */
        async handleTranscriptClick(event) {
            if (!this.enabled) return;
            
            // セッションがアクティブでない場合は編集を許可しない
            if (!window.AppState?.sessionActive) {
                console.log('🚫 セッション非アクティブのため編集を無効化');
                return;
            }
            
            event.preventDefault();
            await this.startEditing();
        }
        
        /**
         * 編集中のキーボードイベントハンドラー
         */
        handleEditingKeydown(event) {
            if (!this.isEditing || !TRANSCRIPT_EDIT_CONFIG.KEYBOARD_SHORTCUTS) return;
            
            // ESCキー: 編集キャンセル
            if (event.key === 'Escape') {
                event.preventDefault();
                this.cancelEditing();
                return;
            }
            
            // 🔧 Shift+Enter: 編集完了
            if (event.key === 'Enter' && event.shiftKey) {
                event.preventDefault();
                this.finishEditing();
                return;
            }
        }
        
        // =============================================================================
        // VOICE RECOGNITION INTEGRATION - 音声認識統合（Phase B 実装）
        // =============================================================================
        
        /**
         * 音声認識一時停止
         */
        async pauseVoiceRecognition() {
            try {
                console.log('🔄 編集開始による音声認識一時停止');
                
                // 統一状態管理システムの音声モジュールを取得
                const voiceModule = this.getVoiceModule();
                if (!voiceModule) {
                    console.warn('⚠️ 音声モジュール未取得 - 一時停止をスキップ');
                    return false;
                }
                
                // 現在の状態を確認
                const state = voiceModule.getState();
                console.log('🔍 現在の音声認識状態:', state.recognitionState);
                
                // アクティブな場合のみ一時停止
                if (state.recognitionState === 'active') {
                    voiceModule.pauseRecognition();
                    
                    // UI更新（既存の関数を使用）
                    if (typeof window.updatePauseResumeButton === 'function') {
                        window.updatePauseResumeButton();
                    }
                    
                    console.log('✅ 音声認識一時停止完了');
                    return true;
                } else {
                    console.log('ℹ️ 音声認識が非アクティブのため一時停止をスキップ');
                    return false;
                }
                
            } catch (error) {
                console.error('❌ 音声認識一時停止エラー:', error);
                return false;
            }
        }
        
        /**
         * 音声認識再開
         */
        async resumeVoiceRecognition() {
            try {
                console.log('🔄 編集完了による音声認識再開');
                
                // 統一状態管理システムの音声モジュールを取得
                const voiceModule = this.getVoiceModule();
                if (!voiceModule) {
                    console.warn('⚠️ 音声モジュール未取得 - 再開をスキップ');
                    return false;
                }
                
                // 現在の状態を確認
                const state = voiceModule.getState();
                console.log('🔍 現在の音声認識状態:', state.recognitionState);
                
                // 一時停止状態の場合のみ再開
                if (state.recognitionState === 'paused' || state.recognitionState === 'idle') {
                    voiceModule.resumeRecognition();
                    
                    // UI更新（既存の関数を使用）
                    if (typeof window.updatePauseResumeButton === 'function') {
                        window.updatePauseResumeButton();
                    }
                    
                    console.log('✅ 音声認識再開完了');
                    return true;
                } else {
                    console.log('ℹ️ 音声認識が既にアクティブまたは他の状態のため再開をスキップ');
                    return false;
                }
                
            } catch (error) {
                console.error('❌ 音声認識再開エラー:', error);
                return false;
            }
        }
        
        /**
         * 統一状態管理システムの音声モジュール取得
         */
        getVoiceModule() {
            try {
                // 統一状態管理システムの確認
                if (!window.unifiedStateManager) {
                    console.warn('⚠️ 統一状態管理システム未初期化');
                    return null;
                }
                
                // 音声モジュールの取得
                const voiceModule = window.unifiedStateManager.modules.get('voice');
                if (!voiceModule) {
                    console.warn('⚠️ 音声モジュール未取得');
                    return null;
                }
                
                return voiceModule;
                
            } catch (error) {
                console.error('❌ 音声モジュール取得エラー:', error);
                return null;
            }
        }
        
        /**
         * 手動操作との競合チェック
         */
        isUserManuallyControllingAudio() {
            try {
                const voiceModule = this.getVoiceModule();
                if (!voiceModule) return false;
                
                const state = voiceModule.getState();
                
                // 手動で停止されたばかりの場合は自動操作を避ける
                const timeSinceLastManualAction = Date.now() - (this.lastManualActionTime || 0);
                const manualActionCooldown = 2000; // 2秒間のクールダウン
                
                if (timeSinceLastManualAction < manualActionCooldown) {
                    console.log('🚫 手動操作直後のため自動制御をスキップ');
                    return true;
                }
                
                return false;
                
            } catch (error) {
                console.error('❌ 手動制御チェックエラー:', error);
                return false;
            }
        }
        
        // =============================================================================
        // UTILITY & DEBUG - ユーティリティ・デバッグ
        // =============================================================================
        
        /**
         * 現在の状態取得
         */
        getState() {
            return {
                enabled: this.enabled,
                isInitialized: this.isInitialized,
                isEditing: this.isEditing,
                originalText: this.originalText,
                hasTranscriptDisplay: !!this.transcriptDisplay,
                performanceStats: { ...this.performanceStats }
            };
        }
        
        /**
         * システム状態のデバッグ出力
         */
        debugStatus() {
            if (!TRANSCRIPT_EDIT_CONFIG.DEBUG_MODE) return;
            
            console.log('🔍 TranscriptEditManager デバッグ状態:');
            console.table(this.getState());
        }
        
        /**
         * 緊急無効化
         */
        emergencyDisable() {
            console.log('🚨 TranscriptEditManager 緊急無効化実行');
            
            // 編集中の場合はキャンセル
            if (this.isEditing) {
                this.cancelEditing();
            }
            
            // システム無効化
            this.enabled = false;
            TRANSCRIPT_EDIT_CONFIG.ENABLED = false;
            
            console.log('✅ TranscriptEditManager 緊急無効化完了');
        }
    }
    
    // =================================================================================
    // GLOBAL EXPORT - グローバル公開
    // =================================================================================
    
    // グローバルに公開
    global.TranscriptEditManager = TranscriptEditManager;
    global.TRANSCRIPT_EDIT_CONFIG = TRANSCRIPT_EDIT_CONFIG;
    
    // デバッグ用関数をグローバルに公開
    if (TRANSCRIPT_EDIT_CONFIG.DEBUG_MODE) {
        global.debugTranscriptEdit = () => {
            if (global.transcriptEditManager) {
                global.transcriptEditManager.debugStatus();
            } else {
                console.log('🚫 TranscriptEditManager インスタンスが見つかりません');
            }
        };
    }
    
    console.log('✅ transcript-edit-manager.js 読み込み完了');

})(window); 