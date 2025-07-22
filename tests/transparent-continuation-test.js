/**
 * 🔄 透明継続システム動作確認テスト
 * 方針A: ブラウザAPI無音終了を隠蔽して継続
 */

class TransparentContinuationTest {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.successCount = 0;
        this.monitoringInterval = null;
    }

    log(message, status = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'warning' ? '⚠️' : 'ℹ️'} ${message}`);
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

    async testTransparentContinuationMethods() {
        return new Promise((resolve) => {
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : null;
                if (voiceModule) {
                    // 新しいメソッドの存在確認
                    const methods = ['shouldContinueTransparently', 'performTransparentContinuation', 'pauseRecognition', 'resumeRecognition'];
                    const missingMethods = methods.filter(method => typeof voiceModule[method] !== 'function');
                    
                    if (missingMethods.length === 0) {
                        resolve({ success: true, message: '透明継続システムメソッド確認 - ✅ 全メソッド存在' });
                    } else {
                        resolve({ success: false, message: `透明継続システム不完全: 欠落メソッド ${missingMethods.join(', ')}` });
                    }
                } else {
                    resolve({ success: false, message: 'Voice Moduleが見つからない' });
                }
            } else {
                resolve({ success: false, message: '統一状態管理システムが見つからない' });
            }
        });
    }

    async testToggleMicrophoneFix() {
        return new Promise((resolve) => {
            try {
                // toggleMicrophone実行試行（getModuleエラーが出ないかチェック）
                const originalConsoleError = console.error;
                let getModuleErrorDetected = false;
                console.error = (msg) => {
                    if (msg.includes('unifiedManager.getModule is not a function')) {
                        getModuleErrorDetected = true;
                    }
                    originalConsoleError(msg);
                };

                // toggleMicrophoneを実行
                window.toggleMicrophone();

                // console.errorを復元
                console.error = originalConsoleError;

                if (getModuleErrorDetected) {
                    resolve({ success: false, message: 'toggleMicrophone実行時にgetModuleエラーが発生' });
                } else {
                    resolve({ success: true, message: 'toggleMicrophone修正確認 - ✅ getModuleエラーなし' });
                }

            } catch (error) {
                resolve({ success: false, message: `toggleMicrophone実行エラー: ${error.message}` });
            }
        });
    }

    async testVoiceStateTransitions() {
        return new Promise((resolve) => {
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : null;
                if (voiceModule) {
                    const state = voiceModule.getState();
                    
                    // 状態遷移のテスト（pausedの追加確認）
                    const validStates = ['idle', 'active', 'stopping', 'paused', 'error'];
                    const currentState = state.recognitionState;
                    
                    if (validStates.includes(currentState)) {
                        resolve({ success: true, message: `音声状態管理確認 - ✅ 現在状態: ${currentState}` });
                    } else {
                        resolve({ success: false, message: `無効な音声状態: ${currentState}` });
                    }
                } else {
                    resolve({ success: false, message: 'Voice Moduleが見つからない' });
                }
            } else {
                resolve({ success: false, message: '統一状態管理システムが見つからない' });
            }
        });
    }

    async testAutoRecoveryDisabled() {
        return new Promise((resolve) => {
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : null;
                if (voiceModule && voiceModule.autoRecovery) {
                    if (voiceModule.autoRecovery.enabled === false) {
                        resolve({ success: true, message: '旧自動復旧システム無効確認 - ✅ autoRecovery.enabled = false' });
                    } else {
                        resolve({ success: false, message: '旧自動復旧システムがまだ有効' });
                    }
                } else {
                    resolve({ success: false, message: 'voice moduleまたはautoRecovery設定が見つからない' });
                }
            } else {
                resolve({ success: false, message: '統一状態管理システムが見つからない' });
            }
        });
    }

    startVoiceStateMonitoring() {
        this.log('🔍 音声状態監視開始（30秒間）');
        let lastState = null;
        let stateChangeCount = 0;
        
        this.monitoringInterval = setInterval(() => {
            const unifiedManager = window.UnifiedStateManager || window.unifiedStateManager;
            if (unifiedManager) {
                const voiceModule = unifiedManager.modules ? unifiedManager.modules.get('voice') : null;
                if (voiceModule) {
                    const currentState = voiceModule.getState().recognitionState;
                    if (currentState !== lastState) {
                        stateChangeCount++;
                        this.log(`🔄 音声状態変化 [${stateChangeCount}]: ${lastState} → ${currentState}`, 'info');
                        lastState = currentState;
                        
                        // 透明継続の動作ログ確認
                        if (currentState === 'idle') {
                            this.log('⚠️ idle状態検出 - 透明継続が動作していない可能性', 'warning');
                        }
                    }
                }
            }
        }, 2000);
        
        // 30秒後に監視終了
        setTimeout(() => {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.log(`📊 音声状態監視終了 - 状態変化回数: ${stateChangeCount}`, 'info');
            }
        }, 30000);
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.log('🔍 音声状態監視停止', 'info');
        }
    }

    async runAllTests() {
        this.log('🔄 透明継続システム動作確認テスト開始');
        this.log('============================================================');

        await this.runTest('透明継続システムメソッド確認', () => this.testTransparentContinuationMethods());
        await this.runTest('toggleMicrophone修正確認', () => this.testToggleMicrophoneFix());
        await this.runTest('音声状態管理確認', () => this.testVoiceStateTransitions());
        await this.runTest('旧自動復旧システム無効確認', () => this.testAutoRecoveryDisabled());

        this.log('============================================================');
        this.log('🔄 透明継続システムテスト結果');
        this.log('============================================================');
        this.log(`✅ 成功: ${this.successCount}`);
        this.log(`❌ 失敗: ${this.testCount - this.successCount}`);
        this.log(`📊 総テスト数: ${this.testCount}`);

        if (this.successCount === this.testCount) {
            this.log('🎉 透明継続システムが正常に実装されています！', 'success');
            this.log('🔍 30秒間の音声状態監視を開始します（無音テスト用）', 'info');
            this.startVoiceStateMonitoring();
            return true;
        } else {
            this.log('⚠️ 一部の実装に問題があります。詳細を確認してください。', 'error');
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

// グローバルに公開
window.TransparentContinuationTest = TransparentContinuationTest;

// 即座実行用関数
window.runTransparentContinuationTest = async function() {
    const test = new TransparentContinuationTest();
    const success = await test.runAllTests();
    return test.getDetailedReport();
};

console.log('🔄 透明継続システムテストが利用可能になりました');
console.log('📋 実行方法:');
console.log('  - runTransparentContinuationTest() // 全テスト実行 + 30秒監視');
console.log('  - 実際のテスト: 深堀くんで30秒間無音にして継続確認'); 