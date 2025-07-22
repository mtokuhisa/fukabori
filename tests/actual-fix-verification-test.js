/**
 * 🧪 実際の修正効果確認テスト
 * 構造的シンプル化修正後の動作を検証
 */

class ActualFixVerificationTest {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.successCount = 0;
    }

    log(message, status = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${status === 'success' ? '✅' : status === 'error' ? '❌' : 'ℹ️'} ${message}`);
    }

    async runTest(testName, testFunction) {
        this.testCount++;
        try {
            this.log(`${testName} 開始`, 'info');
            const result = await testFunction();
            if (result.success) {
                this.successCount++;
                this.log(`${testName}: ${result.message}`, 'success');
                this.testResults.push({ name: testName, status: 'success', message: result.message });
            } else {
                this.log(`${testName}: ${result.message}`, 'error');
                this.testResults.push({ name: testName, status: 'error', message: result.message });
            }
        } catch (error) {
            this.log(`${testName} 例外エラー: ${error.message}`, 'error');
            this.testResults.push({ name: testName, status: 'error', message: error.message });
        }
    }

    async testVoiceUIManagerRemoval() {
        return new Promise((resolve) => {
            // VoiceUIManagerが存在しないことを確認
            if (typeof window.VoiceUIManager === 'undefined') {
                resolve({ success: true, message: 'VoiceUIManager完全削除確認 - ✅ グローバル参照なし' });
            } else {
                resolve({ success: false, message: 'VoiceUIManager参照が残存している' });
            }
        });
    }

    async testAutoRecoveryDisabled() {
        return new Promise((resolve) => {
            // 統一状態管理システムのvoice moduleを確認
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : unifiedManager.getModule('voice');
                if (voiceModule && voiceModule.autoRecovery) {
                    if (voiceModule.autoRecovery.enabled === false) {
                        resolve({ success: true, message: '自動復旧システム無効化確認 - ✅ autoRecovery.enabled = false' });
                    } else {
                        resolve({ success: false, message: '自動復旧システムがまだ有効になっている' });
                    }
                } else {
                    resolve({ success: false, message: 'voice moduleまたはautoRecovery設定が見つからない' });
                }
            } else {
                resolve({ success: false, message: '統一状態管理システムが見つからない' });
            }
        });
    }

    async testToggleMicrophoneAccess() {
        return new Promise((resolve) => {
            try {
                // toggleMicrophone関数の存在確認
                if (typeof window.toggleMicrophone !== 'function') {
                    resolve({ success: false, message: 'toggleMicrophone関数が見つからない' });
                    return;
                }

                // toggleMicrophone実行試行（エラーなしで実行されるかチェック）
                const originalConsoleError = console.error;
                let errorDetected = false;
                console.error = (msg) => {
                    if (msg.includes('統一状態管理システムが利用できません')) {
                        errorDetected = true;
                    }
                    originalConsoleError(msg);
                };

                // toggleMicrophoneを実行
                window.toggleMicrophone();

                // console.errorを復元
                console.error = originalConsoleError;

                if (errorDetected) {
                    resolve({ success: false, message: 'toggleMicrophone実行時にアクセスエラーが発生' });
                } else {
                    resolve({ success: true, message: 'toggleMicrophone安全アクセス確認 - ✅ エラーなし実行' });
                }

            } catch (error) {
                resolve({ success: false, message: `toggleMicrophone実行エラー: ${error.message}` });
            }
        });
    }

    async testUnifiedStateManagerAccess() {
        return new Promise((resolve) => {
            // 統一状態管理システムアクセス確認
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : unifiedManager.getModule('voice');
                if (voiceModule) {
                    const state = voiceModule.getState();
                    if (state) {
                        resolve({ success: true, message: '統一状態管理システムアクセス確認 - ✅ 正常アクセス可能' });
                    } else {
                        resolve({ success: false, message: 'voice module stateが取得できない' });
                    }
                } else {
                    resolve({ success: false, message: 'voice moduleが取得できない' });
                }
            } else {
                resolve({ success: false, message: '統一状態管理システムが見つからない' });
            }
        });
    }

    async testPauseResumeButtonFunction() {
        return new Promise((resolve) => {
            // updatePauseResumeButton関数の存在確認
            if (typeof window.updatePauseResumeButton !== 'function') {
                resolve({ success: false, message: 'updatePauseResumeButton関数が見つからない' });
                return;
            }

            try {
                // updatePauseResumeButton実行試行
                window.updatePauseResumeButton();
                resolve({ success: true, message: '一時停止ボタン更新機能確認 - ✅ エラーなし実行' });
            } catch (error) {
                resolve({ success: false, message: `updatePauseResumeButton実行エラー: ${error.message}` });
            }
        });
    }

    async testVoiceModuleExists() {
        return new Promise((resolve) => {
            // voice-moduleの存在確認
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : unifiedManager.getModule('voice');
                if (voiceModule) {
                    // 必要なメソッドの存在確認
                    const methods = ['startRecognition', 'stopRecognition', 'getState'];
                    const missingMethods = methods.filter(method => typeof voiceModule[method] !== 'function');
                    
                    if (missingMethods.length === 0) {
                        resolve({ success: true, message: 'Voice Module機能確認 - ✅ 必要メソッド全て存在' });
                    } else {
                        resolve({ success: false, message: `Voice Module不完全: 欠落メソッド ${missingMethods.join(', ')}` });
                    }
                } else {
                    resolve({ success: false, message: 'Voice Moduleが見つからない' });
                }
            } else {
                resolve({ success: false, message: '統一状態管理システムが見つからない' });
            }
        });
    }

    async runAllTests() {
        this.log('🧪 実際の修正効果確認テスト開始');
        this.log('============================================================');

        await this.runTest('VoiceUIManager完全削除確認', () => this.testVoiceUIManagerRemoval());
        await this.runTest('自動復旧システム無効化確認', () => this.testAutoRecoveryDisabled());
        await this.runTest('統一状態管理システムアクセス確認', () => this.testUnifiedStateManagerAccess());
        await this.runTest('toggleMicrophone安全実行確認', () => this.testToggleMicrophoneAccess());
        await this.runTest('一時停止ボタン機能確認', () => this.testPauseResumeButtonFunction());
        await this.runTest('Voice Module機能確認', () => this.testVoiceModuleExists());

        this.log('============================================================');
        this.log('🧪 実際の修正効果確認テスト結果');
        this.log('============================================================');
        this.log(`✅ 成功: ${this.successCount}`);
        this.log(`❌ 失敗: ${this.testCount - this.successCount}`);
        this.log(`📊 総テスト数: ${this.testCount}`);

        if (this.successCount === this.testCount) {
            this.log('🎉 全ての修正が正常に動作しています！', 'success');
            return true;
        } else {
            this.log('⚠️ 一部の修正に問題があります。詳細を確認してください。', 'error');
            return false;
        }
    }

    getDetailedReport() {
        return {
            success: this.successCount === this.testCount,
            totalTests: this.testCount,
            successCount: this.successCount,
            failureCount: this.testCount - this.successCount,
            results: this.testResults
        };
    }
}

// グローバルに公開してブラウザから実行可能にする
window.ActualFixVerificationTest = ActualFixVerificationTest;

// 即座実行用関数
window.runActualFixVerification = async function() {
    const test = new ActualFixVerificationTest();
    const success = await test.runAllTests();
    return test.getDetailedReport();
};

console.log('🔧 実際の修正効果確認テストが利用可能になりました');
console.log('📋 実行方法:');
console.log('  - runActualFixVerification() // 全テスト実行'); 