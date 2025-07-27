/**
 * 深堀くん - ユーティリティ関数
 * 汎用的な補助関数をまとめたモジュール
 */

// グローバル名前空間に登録（段階的移行のため）
window.FukaboriUtils = window.FukaboriUtils || {};

/**
 * メッセージ表示（ポップアップ）
 * @param {string} message - 表示するメッセージ
 * @param {string} type - メッセージタイプ（'info', 'warning', 'error', 'success'）
 */
function showMessage(message, type = 'info') {
    // 音声認識関連のエラーメッセージはポップアップ表示しない
    if (message.includes('音声認識') || message.includes('no-speech') || message.includes('認識エラー')) {
        console.log(`🔇 音声認識エラー（ポップアップ無効化）: ${message}`);
        return;
    }
    
    // 不要なダイアログを無効化（スムーズなユーザー体験のため）
    const skipDialogMessages = [
        'ログインを完了してください',
        'テーマを入力してください',
        'ログインに成功しました',
        'APIキーを設定してください',
        'テーマ入力欄が見つかりません',
        'パスワードを入力してください',
        'パスワード入力欄が見つかりません'
    ];
    
    if (skipDialogMessages.some(skipMsg => message.includes(skipMsg))) {
        console.log(`🔇 不要なダイアログ（ポップアップ無効化）: ${message}`);
        return;
    }
    
    // 重要な確認ダイアログは残す（誤操作防止）
    const importantDialogs = [
        'セッションを終了しますか',
        'ログイン画面に戻りますか',
        'マイクの使用許可が拒否されています'
    ];
    
    if (importantDialogs.some(important => message.includes(important))) {
        alert(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    // その他のメッセージはコンソールのみ
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
}

/**
 * テキストファイルをダウンロードする関数
 * @param {string} content - ファイルの内容
 * @param {string} filename - ダウンロードするファイル名
 */
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// グローバルに公開
window.FukaboriUtils.showMessage = showMessage;
window.FukaboriUtils.downloadTextFile = downloadTextFile;
// 互換性のため直接も公開（段階的に削除予定）
window.showMessage = showMessage;
window.downloadTextFile = downloadTextFile;

// =================================================================================
// CRYPTO UTILITIES - 暗号化ユーティリティ
// =================================================================================

/**
 * APIキーを暗号化する関数
 * @param {string} apiKey - 暗号化するAPIキー
 * @param {string} password - 暗号化に使用するパスワード
 * @returns {string} Base64エンコードされた暗号化文字列
 */
function encryptApiKey(apiKey, password) {
    let encrypted = '';
    for (let i = 0; i < apiKey.length; i++) {
        encrypted += String.fromCharCode(apiKey.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return btoa(encrypted);
}

/**
 * 暗号化されたAPIキーを復号化する関数
 * @param {string} encryptedKey - Base64エンコードされた暗号化文字列
 * @param {string} password - 復号化に使用するパスワード
 * @returns {string} 復号化されたAPIキー
 * @throws {Error} 復号化に失敗した場合
 */
function decryptApiKey(encryptedKey, password) {
    try {
        const encrypted = atob(encryptedKey);
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ password.charCodeAt(i % password.length));
        }
        return decrypted;
    } catch (error) {
        throw new Error('復号化に失敗しました');
    }
}

/**
 * パスワードをハッシュ化する関数
 * @param {string} password - ハッシュ化するパスワード
 * @returns {string} ハッシュ化されたパスワード（36進数文字列）
 */
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// グローバルに公開
window.FukaboriUtils.encryptApiKey = encryptApiKey;
window.FukaboriUtils.decryptApiKey = decryptApiKey;
window.FukaboriUtils.hashPassword = hashPassword;
// 互換性のため直接も公開（段階的に削除予定）
window.encryptApiKey = encryptApiKey;
window.decryptApiKey = decryptApiKey;
window.hashPassword = hashPassword; 

// =================================================================================
// Phase 1C: 緊急時ロールバック・デバッグシステム
// =================================================================================

/**
 * 緊急時システム復旧管理クラス
 * 
 * 🎯 Phase 1C機能:
 * - ワンクリック状態復旧
 * - 段階的システムロールバック
 * - 緊急診断システム
 * - 完全リセット機能
 * 
 * @version 0.7.5-phase1c
 * @author AI Assistant
 * @created 2025-01-26
 */
class EmergencySystemManager {
    constructor() {
        this.backupHistory = [];
        this.maxBackups = 10;
        this.emergencyMode = false;
        this.diagnosticData = [];
    }
    
    /**
     * システム状態の完全バックアップ作成
     */
    createFullSystemBackup(label = 'auto') {
        const backup = {
            id: Date.now(),
            label,
            timestamp: new Date().toISOString(),
            AppState: (() => {
                try {
                    return window.AppState ? JSON.parse(JSON.stringify(window.AppState)) : null;
                } catch (error) {
                    console.warn('⚠️ AppState バックアップ失敗:', error.message);
                    return null;
                }
            })(),
            transcriptEditManager: (() => {
                try {
                    return {
                        isEditing: window.transcriptEditManager?.isEditing || false,
                        originalText: window.transcriptEditManager?.originalText || '',
                        editStartTime: window.transcriptEditManager?.editStartTime || null
                    };
                } catch (error) {
                    console.warn('⚠️ TranscriptEditManager バックアップ失敗:', error.message);
                    return { isEditing: false, originalText: '', editStartTime: null };
                }
            })(),
            unifiedStateManager: (() => {
                try {
                    // 🔧 Phase 1B修正: 正しいオブジェクト名とエラーハンドリング
                    if (window.UnifiedStateManager && typeof window.UnifiedStateManager.getCompleteState === 'function') {
                        return window.UnifiedStateManager.getCompleteState();
                    } else {
                        console.warn('⚠️ UnifiedStateManager.getCompleteState()が利用できません');
                        return null;
                    }
                } catch (error) {
                    console.warn('⚠️ UnifiedStateManager バックアップ失敗:', error.message);
                    return null;
                }
            })(),
            protectionStatus: (() => {
                try {
                    return window.TranscriptProtectionManager?.getProtectionStatus() || null;
                } catch (error) {
                    console.warn('⚠️ TranscriptProtectionManager バックアップ失敗:', error.message);
                    return null;
                }
            })(),
            debugInfo: (() => {
                try {
                    return window.StateUpdateController?.getDebugInfo() || null;
                } catch (error) {
                    console.warn('⚠️ StateUpdateController バックアップ失敗:', error.message);
                    return null;
                }
            })()
        };
        
        this.backupHistory.push(backup);
        
        // 最大バックアップ数を超えた場合、古いものを削除
        if (this.backupHistory.length > this.maxBackups) {
            this.backupHistory.shift();
        }
        
        console.log(`💾 システムバックアップ作成: ${label} (ID: ${backup.id})`);
        return backup.id;
    }
    
    /**
     * 緊急時ロールバック実行
     */
    emergencyRollback(backupId = null) {
        console.log('🚨 緊急ロールバック開始');
        
        // バックアップの選択
        const backup = backupId ? 
            this.backupHistory.find(b => b.id === backupId) :
            this.backupHistory[this.backupHistory.length - 1];
            
        if (!backup) {
            console.error('❌ 利用可能なバックアップがありません');
            return false;
        }
        
        try {
            this.emergencyMode = true;
            
            // 編集状態の強制終了
            if (window.transcriptEditManager?.isEditing) {
                console.log('🔄 編集状態強制終了');
                window.transcriptEditManager.isEditing = false;
                if (window.transcriptEditManager.editableUI) {
                    window.transcriptEditManager.editableUI.disableEditing();
                }
            }
            
            // 保護状態のクリア
            if (window.TranscriptProtectionManager) {
                window.TranscriptProtectionManager.clearProtection();
            }
            
            // AppState復元
            if (backup.AppState && window.AppState) {
                Object.assign(window.AppState, backup.AppState);
                console.log('🔄 AppState復元完了');
            }
            
            // 画面更新
            if (typeof window.updateTranscriptDisplay === 'function') {
                window.updateTranscriptDisplay();
            }
            
            // 統一状態管理システムの復元
            // 🔧 Phase 1B修正: 正しいオブジェクト名とエラーハンドリング
            if (window.UnifiedStateManager && backup.unifiedStateManager) {
                try {
                    if (typeof window.UnifiedStateManager.restoreCompleteState === 'function') {
                        const restored = window.UnifiedStateManager.restoreCompleteState(backup.unifiedStateManager);
                        if (restored) {
                            console.log('🔄 統一状態管理システム復元完了');
                        } else {
                            console.warn('⚠️ 統一状態管理システム復元失敗');
                        }
                    } else {
                        console.warn('⚠️ UnifiedStateManager.restoreCompleteState()が利用できません');
                    }
                } catch (error) {
                    console.warn('⚠️ 統一状態管理システム復元エラー:', error.message);
                }
            }
            
            console.log(`✅ 緊急ロールバック完了 (${backup.label}, ${backup.timestamp})`);
            return true;
            
        } catch (error) {
            console.error('❌ 緊急ロールバック失敗:', error);
            return false;
        } finally {
            this.emergencyMode = false;
        }
    }
    
    /**
     * システム診断実行
     */
    runSystemDiagnostics() {
        console.log('🔍 システム診断開始');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            appState: {
                exists: !!window.AppState,
                currentTranscript: window.AppState?.currentTranscript || '',
                transcriptHistoryLength: window.AppState?.transcriptHistory?.length || 0,
                isProcessing: window.AppState?.isProcessing || false
            },
            editSystem: {
                managerExists: !!window.transcriptEditManager,
                isEditing: window.transcriptEditManager?.isEditing || false,
                uiExists: !!window.transcriptEditManager?.editableUI
            },
            protectionSystem: {
                managerExists: !!window.TranscriptProtectionManager,
                isEditInProgress: window.TranscriptProtectionManager ? 
                    window.TranscriptProtectionManager.constructor.isEditInProgress() : false,
                protectionStatus: window.TranscriptProtectionManager?.getProtectionStatus() || null
            },
            stateController: {
                exists: !!window.StateUpdateController,
                debugInfo: window.StateUpdateController?.getDebugInfo() || null
            },
            unifiedState: {
                exists: !!window.unifiedStateManager,
                voiceState: window.unifiedStateManager?.getVoiceState() || null
            }
        };
        
        this.diagnosticData.push(diagnostics);
        console.log('🔍 システム診断完了:', diagnostics);
        
        return diagnostics;
    }
    
    /**
     * 完全システムリセット
     */
    completeSystemReset() {
        console.log('⚠️ 完全システムリセット開始');
        
        try {
            // 編集状態のクリア
            if (window.transcriptEditManager) {
                window.transcriptEditManager.isEditing = false;
                if (window.transcriptEditManager.editableUI) {
                    window.transcriptEditManager.editableUI.disableEditing();
                }
            }
            
            // 保護状態のクリア
            if (window.TranscriptProtectionManager) {
                window.TranscriptProtectionManager.clearProtection();
            }
            
            // AppState初期化
            if (window.AppState) {
                window.AppState.currentTranscript = '';
                window.AppState.transcriptHistory = [];
                window.AppState.isProcessing = false;
                window.AppState.waitingForPermission = true;
            }
            
            // 画面更新
            if (typeof window.updateTranscriptDisplay === 'function') {
                window.updateTranscriptDisplay();
            }
            
            console.log('✅ 完全システムリセット完了');
            return true;
            
        } catch (error) {
            console.error('❌ 完全システムリセット失敗:', error);
            return false;
        }
    }
    
    /**
     * デバッグ情報のエクスポート
     */
    exportDebugData() {
        return {
            backupHistory: this.backupHistory,
            diagnosticData: this.diagnosticData,
            currentDiagnostics: this.runSystemDiagnostics(),
            systemInfo: {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href
            }
        };
    }
    
    /**
     * 緊急コマンド登録
     */
    registerEmergencyCommands() {
        // グローバルコマンド登録
        window.emergencyRollback = () => this.emergencyRollback();
        window.systemDiagnostics = () => this.runSystemDiagnostics();
        window.completeReset = () => this.completeSystemReset();
        window.exportDebug = () => this.exportDebugData();
        
        console.log('🚨 緊急コマンド登録完了:');
        console.log('  - emergencyRollback() : 緊急ロールバック');
        console.log('  - systemDiagnostics() : システム診断');
        console.log('  - completeReset() : 完全リセット');
        console.log('  - exportDebug() : デバッグデータエクスポート');
    }
}

// グローバルインスタンス作成
window.EmergencySystemManager = new EmergencySystemManager();

// 緊急コマンドの登録
window.EmergencySystemManager.registerEmergencyCommands();

// 定期的な自動バックアップ設定
setInterval(() => {
    if (window.EmergencySystemManager && !window.EmergencySystemManager.emergencyMode) {
        window.EmergencySystemManager.createFullSystemBackup('periodic');
    }
}, 30000); // 30秒ごと

console.log('🛡️ Phase 1C: 緊急時システム復旧機能初期化完了'); 