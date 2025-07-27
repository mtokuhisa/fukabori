// =================================================================================
// SAFETY BACKUP SYSTEM - 既存機能保護システム
// =================================================================================
// 🛡️ 既存機能を絶対に壊さないための安全システム
// このファイルは既存のapp/script.jsに一切影響を与えません

console.log('🛡️ 安全バックアップシステム初期化開始');

// 🛡️ 既存機能の完全バックアップ（名前空間変更で競合回避）
const FukaboriSafetySystem = {
    // バックアップ済みフラグ
    isBackedUp: false,
    
    // 元の関数のバックアップ
    original: {},
    
    // バックアップ実行
    backup() {
        if (this.isBackedUp) {
            console.log('🛡️ 既存機能は既にバックアップ済みです');
            return true;
        }
        
        try {
            // 重要な関数をバックアップ
            this.original.addMessageToChat = window.addMessageToChat;
            this.original.ttsTextToAudioBlob = window.ttsTextToAudioBlob;
            this.original.playPreGeneratedAudio = window.playPreGeneratedAudio;
            
            // 既存の統合関数もバックアップ（存在する場合）
            if (window.addMessageToChatWithSpeech) {
                this.original.addMessageToChatWithSpeech = window.addMessageToChatWithSpeech;
            }
            
            this.isBackedUp = true;
            console.log('✅ 既存機能のバックアップ完了');
            
            // バックアップ状態を保存
            localStorage.setItem('functionBackupStatus', 'completed');
            localStorage.setItem('backupTimestamp', new Date().toISOString());
            
            return true;
            
        } catch (error) {
            console.error('❌ バックアップエラー:', error);
            this.isBackedUp = false;
            return false;
        }
    },
    
    // 復元実行
    restore() {
        if (!this.isBackedUp) {
            console.warn('⚠️ バックアップが存在しません');
            return false;
        }
        
        try {
            // 元の関数を復元
            window.addMessageToChat = this.original.addMessageToChat;
            window.ttsTextToAudioBlob = this.original.ttsTextToAudioBlob;
            window.playPreGeneratedAudio = this.original.playPreGeneratedAudio;
            
            if (this.original.addMessageToChatWithSpeech) {
                window.addMessageToChatWithSpeech = this.original.addMessageToChatWithSpeech;
            }
            
            console.log('✅ 既存機能の復元完了');
            
            // 実験機能を無効化
            if (window.SpeechShorteningEngine) {
                window.SpeechShorteningEngine.enabled = false;
                console.log('🔄 実験機能を無効化しました');
            }
            
            localStorage.setItem('experimentalFeaturesDisabled', 'true');
            localStorage.setItem('restoreTimestamp', new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('❌ 復元エラー:', error);
            return false;
        }
    },
    
    // 緊急停止
    emergencyStop() {
        console.log('🚨 緊急停止実行');
        
        const restored = this.restore();
        
        if (restored) {
            // 成功通知
            const message = '✅ 緊急停止完了\n既存の動作に戻りました。\n実験機能は無効化されました。';
            console.log(message);
            
            // ユーザーに通知
            if (window.showMessage) {
                window.showMessage('success', '緊急停止完了 - 元の動作に戻りました');
            } else {
                alert(message);
            }
        } else {
            // 失敗通知
            const message = '❌ 緊急停止でエラーが発生しました\nページを再読み込みしてください。';
            console.error(message);
            alert(message);
        }
        
        // 設定をリセット
        localStorage.setItem('speechShorteningEmergencyDisabled', 'true');
        localStorage.setItem('emergencyStopTimestamp', new Date().toISOString());
        
        return restored;
    },
    
    // ヘルスチェック
    healthCheck() {
        const issues = [];
        
        if (!this.isBackedUp) {
            issues.push('バックアップが実行されていません');
        }
        
        // 重要な関数の存在確認
        const requiredFunctions = [
            'addMessageToChat', 
            'ttsTextToAudioBlob', 
            'playPreGeneratedAudio'
        ];
        
        for (const funcName of requiredFunctions) {
            if (typeof window[funcName] !== 'function') {
                issues.push(`${funcName}関数が見つかりません`);
            }
        }
        
        // バックアップ状態の確認
        if (this.isBackedUp) {
            for (const funcName of requiredFunctions) {
                if (typeof this.original[funcName] !== 'function') {
                    issues.push(`${funcName}のバックアップが不完全です`);
                }
            }
        }
        
        if (issues.length === 0) {
            console.log('✅ システムヘルスチェック正常');
            return { healthy: true, issues: [] };
        } else {
            console.warn('⚠️ システムヘルスチェックで問題検出:', issues);
            return { healthy: false, issues };
        }
    },
    
    // 状態レポート
    getStatus() {
        return {
            isBackedUp: this.isBackedUp,
            backupTimestamp: localStorage.getItem('backupTimestamp'),
            restoreTimestamp: localStorage.getItem('restoreTimestamp'),
            emergencyStopTimestamp: localStorage.getItem('emergencyStopTimestamp'),
            experimentalDisabled: localStorage.getItem('experimentalFeaturesDisabled') === 'true',
            emergencyDisabled: localStorage.getItem('speechShorteningEmergencyDisabled') === 'true'
        };
    }
};

// =================================================================================
// 緊急停止チェック - ページ読み込み時
// =================================================================================

// ページ読み込み時に緊急停止状態をチェック
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 緊急停止状態のチェック
        const emergencyDisabled = localStorage.getItem('speechShorteningEmergencyDisabled');
        if (emergencyDisabled === 'true') {
            console.log('🚨 前回緊急停止されました - 実験機能は無効状態を維持');
            if (window.showMessage) {
                window.showMessage('info', '前回緊急停止されたため、実験機能は無効状態です');
            }
            return;
        }
        
        // 自動バックアップ実行（既存機能保護）
        const backupSuccess = FukaboriSafetySystem.backup();
        
        if (backupSuccess) {
            console.log('🛡️ 安全システム初期化完了 - 既存機能は保護されています');
        } else {
            console.warn('⚠️ 安全システム初期化に問題があります');
        }
        
    } catch (error) {
        console.error('❌ 安全システム初期化エラー:', error);
    }
});

// =================================================================================
// グローバル関数の公開
// =================================================================================

// 🛡️ 緊急停止のグローバル関数
window.emergencyStopShortening = function() {
    return FukaboriSafetySystem.emergencyStop();
};

// 🛡️ 復元のグローバル関数  
window.restoreOriginalFunctions = function() {
    return FukaboriSafetySystem.restore();
};

// 🛡️ ヘルスチェックのグローバル関数
window.systemHealthCheck = function() {
    return FukaboriSafetySystem.healthCheck();
};

// 🛡️ 状態確認のグローバル関数
window.getSafetyStatus = function() {
    return FukaboriSafetySystem.getStatus();
};

// 🛡️ 手動バックアップのグローバル関数
window.manualBackup = function() {
    return FukaboriSafetySystem.backup();
};

// 🛡️ 互換性維持のため古い名前でもアクセス可能
window.SafetyBackup = FukaboriSafetySystem;

// コンソールでの使用方法を表示
console.log(`
🛡️ 安全システム使用方法:
- emergencyStopShortening()     : 緊急停止（全て元に戻す）
- restoreOriginalFunctions()    : 既存機能に復元
- systemHealthCheck()          : システム健全性チェック
- getSafetyStatus()           : 現在の状態確認
- manualBackup()              : 手動バックアップ実行
`);

// エクスポート（他のモジュールから使用する場合）
window.FukaboriSafetySystem = FukaboriSafetySystem;

console.log('✅ 安全バックアップシステム読み込み完了'); 