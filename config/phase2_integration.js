// =================================================================================
// 🚀 Phase 2: 発声短縮実用拡張機能統合
// =================================================================================

console.log('🚀 Phase 2統合システム読み込み開始');

// Phase 2自動適用切り替え
window.toggleAutoApply = function() {
    if (window.SpeechShorteningPhase2) {
        const toggle = document.getElementById('autoApplyToggle');
        if (toggle) {
            SpeechShorteningPhase2.settings.autoApplyInSession = toggle.checked;
            SpeechShorteningPhase2.saveSettings();
            
            const status = toggle.checked ? '有効' : '無効';
            console.log(`🚀 Phase 2自動適用: ${status}`);
            
            if (typeof showMessage === 'function') {
                showMessage('info', `Phase 2自動適用を${status}にしました`);
            }
        }
    }
};

// Phase 2統計表示更新
function updatePhase2Display() {
    if (window.SpeechShorteningPhase2) {
        SpeechShorteningPhase2.updateRealtimeDisplay();
    }
}

// セッション開始時にPhase 2統計更新（安全な統合方式）
function integratePhase2WithStartSession() {
    // 既存のstartSession関数をバックアップ
    if (window.startSession && typeof window.startSession === 'function') {
        const backupStartSession = window.startSession;
        
        window.startSession = function() {
            // 元のstartSession実行
            const result = backupStartSession.apply(this, arguments);
            
            // Phase 2セッション開始記録
            try {
                if (window.SpeechShorteningPhase2) {
                    SpeechShorteningPhase2.startSession();
                    console.log('🚀 Phase 2: セッション開始統計を記録');
                }
            } catch (error) {
                console.warn('⚠️ Phase 2セッション統計記録エラー:', error);
            }
            
            return result;
        };
        
        console.log('✅ Phase 2: startSession統合完了');
    } else {
        console.warn('⚠️ Phase 2: startSession関数が見つからないため、後で統合を試行します');
        
        // 1秒後に再試行
        setTimeout(integratePhase2WithStartSession, 1000);
    }
}

// DOMContentLoaded時のPhase 2初期化
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Phase 2システム初期化確認
        if (window.SpeechShorteningPhase2) {
            console.log('🚀 Phase 2: 実用拡張システム利用可能');
            
            // 自動適用設定UIの同期
            const autoToggle = document.getElementById('autoApplyToggle');
            if (autoToggle) {
                autoToggle.checked = SpeechShorteningPhase2.settings.autoApplyInSession;
            }
            
            // 統計表示更新
            updatePhase2Display();
            
            // セッション統合機能の初期化
            integratePhase2WithStartSession();
            
            console.log(`
🚀 Phase 2機能テスト方法:
1. runPhase2Test() - 4種類の実用テスト実行
2. showPhase2Statistics() - 詳細統計レポート表示
3. resetPhase2Statistics() - 統計データリセット
4. SpeechShorteningPhase2.settings.autoApplyInSession - 自動適用設定
            `);
        } else {
            console.warn('⚠️ Phase 2システムが読み込まれていません');
            
            // Phase 2システムの読み込みを1秒後に再確認
            setTimeout(() => {
                if (window.SpeechShorteningPhase2) {
                    console.log('🔄 Phase 2システム遅延読み込み完了');
                    const autoToggle = document.getElementById('autoApplyToggle');
                    if (autoToggle) {
                        autoToggle.checked = SpeechShorteningPhase2.settings.autoApplyInSession;
                    }
                    updatePhase2Display();
                    integratePhase2WithStartSession();
                } else {
                    console.error('❌ Phase 2システムの読み込みに失敗しました');
                }
            }, 1000);
        }
        
        // Phase 1とPhase 2の統合チェック
        if (window.SpeechShorteningManager && window.SpeechShorteningPhase2) {
            console.log('✅ Phase 1 + Phase 2統合完了');
            
            // 統合状況確認
            const phase1Enabled = SpeechShorteningManager.settings.enabled;
            const phase2AutoApply = SpeechShorteningPhase2.settings.autoApplyInSession;
            
            if (phase1Enabled && phase2AutoApply) {
                console.log('🎯 実用短縮機能: 完全有効（セッションで自動適用）');
            } else if (phase1Enabled) {
                console.log('🧪 テスト短縮機能: 有効（手動テストのみ）');
            } else {
                console.log('💤 短縮機能: 無効');
            }
        }
    }, 300); // Phase 0, Phase 1読み込み後に実行
});

console.log('🚀 Phase 2: 発声短縮実用拡張機能統合完了'); 