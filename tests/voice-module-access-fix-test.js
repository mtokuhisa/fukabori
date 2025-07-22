/**
 * 🚨 VoiceModule直接アクセス修正効果確認テスト
 * 統一状態管理システムアクセスエラーの根本修正確認
 */

class VoiceModuleAccessFixTest {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.successCount = 0;
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

    async testVoiceModuleDirectAccess() {
        return new Promise((resolve) => {
            // window.VoiceModule直接アクセス確認
            if (typeof window.VoiceModule !== 'undefined') {
                if (typeof window.VoiceModule.getState === 'function') {
                    const state = window.VoiceModule.getState();
                    if (state && typeof state.recognitionState !== 'undefined') {
                        resolve({ success: true, message: `VoiceModule直接アクセス確認 - ✅ 状態: ${state.recognitionState}` });
                    } else {
                        resolve({ success: false, message: 'VoiceModuleの状態取得失敗' });
                    }
                } else {
                    resolve({ success: false, message: 'VoiceModule.getStateメソッドが存在しない' });
                }
            } else {
                resolve({ success: false, message: 'window.VoiceModuleが見つからない' });
            }
        });
    }

    async testToggleMicrophoneFixed() {
        return new Promise((resolve) => {
            try {
                // toggleMicrophone実行試行（VoiceModuleエラーが出ないかチェック）
                const originalConsoleError = console.error;
                let voiceModuleErrorDetected = false;
                console.error = (msg) => {
                    if (msg.includes('VoiceModuleが利用不可') || 
                        msg.includes('統一状態管理システム未初期化') ||
                        msg.includes('unifiedManager.getModule is not a function')) {
                        voiceModuleErrorDetected = true;
                    }
                    originalConsoleError(msg);
                };

                // toggleMicrophoneを実行
                window.toggleMicrophone();

                // console.errorを復元
                console.error = originalConsoleError;

                if (voiceModuleErrorDetected) {
                    resolve({ success: false, message: 'toggleMicrophone実行時にVoiceModuleアクセスエラーが発生' });
                } else {
                    resolve({ success: true, message: 'toggleMicrophone修正確認 - ✅ VoiceModuleアクセスエラーなし' });
                }

            } catch (error) {
                resolve({ success: false, message: `toggleMicrophone実行エラー: ${error.message}` });
            }
        });
    }

    async testUpdatePauseResumeButtonFixed() {
        return new Promise((resolve) => {
            try {
                if (typeof window.updatePauseResumeButton !== 'function') {
                    resolve({ success: false, message: 'updatePauseResumeButton関数が見つからない' });
                    return;
                }

                // updatePauseResumeButton実行試行
                window.updatePauseResumeButton();

                // ボタンの状態確認
                const pauseBtn = document.getElementById('pauseResumeBtn');
                if (pauseBtn) {
                    const buttonText = pauseBtn.innerHTML;
                    const isCorrect = buttonText.includes('一時停止') || buttonText.includes('再開');
                    
                    if (isCorrect) {
                        resolve({ success: true, message: `updatePauseResumeButton修正確認 - ✅ ボタン表示: "${buttonText}"` });
                    } else {
                        resolve({ success: false, message: `ボタン表示が異常: "${buttonText}"` });
                    }
                } else {
                    resolve({ success: false, message: '一時停止ボタンが見つからない' });
                }
                
            } catch (error) {
                resolve({ success: false, message: `updatePauseResumeButton実行エラー: ${error.message}` });
            }
        });
    }

    async testTransparentContinuationSystemReady() {
        return new Promise((resolve) => {
            // 透明継続システムの準備状態確認
            if (window.VoiceModule) {
                const methods = ['shouldContinueTransparently', 'performTransparentContinuation', 'pauseRecognition', 'resumeRecognition'];
                const missingMethods = methods.filter(method => typeof window.VoiceModule[method] !== 'function');
                
                if (missingMethods.length === 0) {
                    resolve({ success: true, message: '透明継続システム準備確認 - ✅ 全メソッド利用可能' });
                } else {
                    resolve({ success: false, message: `透明継続システム不完全: 欠落メソッド ${missingMethods.join(', ')}` });
                }
            } else {
                resolve({ success: false, message: 'VoiceModuleが見つからない' });
            }
        });
    }

    async testVoiceRecognitionStateNow() {
        return new Promise((resolve) => {
            // 現在の音声認識状態確認
            if (window.VoiceModule) {
                const state = window.VoiceModule.getState();
                if (state) {
                    const status = state.recognitionState;
                    const isListening = state.isListening;
                    
                    resolve({ 
                        success: true, 
                        message: `現在の音声認識状態 - ✅ 状態: ${status}, リスニング: ${isListening}` 
                    });
                } else {
                    resolve({ success: false, message: 'VoiceModuleの状態取得失敗' });
                }
            } else {
                resolve({ success: false, message: 'VoiceModuleが見つからない' });
            }
        });
    }

    async runAllTests() {
        this.log('🚨 VoiceModule直接アクセス修正効果確認テスト開始');
        this.log('============================================================');

        await this.runTest('VoiceModule直接アクセス確認', () => this.testVoiceModuleDirectAccess());
        await this.runTest('toggleMicrophone修正確認', () => this.testToggleMicrophoneFixed());
        await this.runTest('updatePauseResumeButton修正確認', () => this.testUpdatePauseResumeButtonFixed());
        await this.runTest('透明継続システム準備確認', () => this.testTransparentContinuationSystemReady());
        await this.runTest('現在の音声認識状態確認', () => this.testVoiceRecognitionStateNow());

        this.log('============================================================');
        this.log('🚨 修正効果確認テスト結果');
        this.log('============================================================');
        this.log(`✅ 成功: ${this.successCount}`);
        this.log(`❌ 失敗: ${this.testCount - this.successCount}`);
        this.log(`📊 総テスト数: ${this.testCount}`);

        if (this.successCount === this.testCount) {
            this.log('🎉 VoiceModule直接アクセス修正が完全に成功しました！', 'success');
            this.log('🔄 透明継続システムが正常に利用可能です', 'success');
            this.log('⏸️ 一時停止ボタンが正常に動作するはずです', 'success');
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

// グローバルに公開
window.VoiceModuleAccessFixTest = VoiceModuleAccessFixTest;

// 即座実行用関数
window.runVoiceModuleAccessFixTest = async function() {
    const test = new VoiceModuleAccessFixTest();
    const success = await test.runAllTests();
    return test.getDetailedReport();
};

console.log('🚨 VoiceModule直接アクセス修正テストが利用可能になりました');
console.log('📋 実行方法:');
console.log('  - runVoiceModuleAccessFixTest() // 修正効果確認');
console.log('  - 実際のテスト: 一時停止ボタンを押してエラーが出ないことを確認'); 