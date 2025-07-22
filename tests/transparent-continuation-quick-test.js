/**
 * 🔧 透明継続システム修正効果確認クイックテスト
 * 30秒待つ必要なく、手動で透明継続をトリガーしてテスト
 */

class TransparentContinuationQuickTest {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.successCount = 0;
    }

    log(message, status = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${icon} ${message}`);
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
            this.log(`${testName}: 予期しないエラー - ${error.message}`, 'error');
            this.testResults.push({ name: testName, status: 'error', message: error.message });
        }
    }

    async runQuickTests() {
        this.log('🚀 透明継続システム修正効果確認クイックテスト開始', 'info');

        // Test 1: VoiceModule取得確認
        await this.runTest('VoiceModule取得確認', () => {
            if (!window.unifiedStateManager) {
                return { success: false, message: '統一状態管理システムが未初期化' };
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                return { success: false, message: 'VoiceModuleが取得できません' };
            }
            
            return { success: true, message: 'VoiceModuleが正常に取得できました' };
        });

        // Test 2: forceRestartRecognition メソッド存在確認
        await this.runTest('forceRestartRecognition メソッド存在確認', () => {
            if (!window.unifiedStateManager) {
                return { success: false, message: '統一状態管理システムが未初期化' };
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                return { success: false, message: 'VoiceModuleが取得できません' };
            }
            
            if (typeof voiceModule.forceRestartRecognition !== 'function') {
                return { success: false, message: 'forceRestartRecognition()メソッドが存在しません' };
            }
            
            return { success: true, message: 'forceRestartRecognition()メソッドが正常に存在します' };
        });

        // Test 3: 手動透明継続トリガー機能確認
        await this.runTest('手動透明継続トリガー機能確認', () => {
            if (!window.unifiedStateManager) {
                return { success: false, message: '統一状態管理システムが未初期化' };
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                return { success: false, message: 'VoiceModuleが取得できません' };
            }
            
            // 透明継続関連メソッドの存在確認
            const requiredMethods = ['shouldContinueTransparently', 'performTransparentContinuation'];
            for (const method of requiredMethods) {
                if (typeof voiceModule[method] !== 'function') {
                    return { success: false, message: `${method}()メソッドが存在しません` };
                }
            }
            
            return { success: true, message: '手動透明継続トリガー機能が利用可能です' };
        });

        // 🎯 結果まとめ
        this.log('🎉 クイックテスト完了！', 'info');
        this.log(`📊 成功率: ${this.successCount}/${this.testCount} (${Math.round((this.successCount / this.testCount) * 100)}%)`, 'info');

        return {
            success: this.successCount === this.testCount,
            successRate: Math.round((this.successCount / this.testCount) * 100),
            results: this.testResults
        };
    }

    // 🔧 手動透明継続トリガー（デバッグ用）
    async triggerTransparentContinuation() {
        this.log('🎯 手動透明継続トリガー開始', 'info');
        
        try {
            if (!window.unifiedStateManager) {
                throw new Error('統一状態管理システムが未初期化');
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                throw new Error('VoiceModuleが取得できません');
            }
            
            // 現在の状態を確認
            const currentState = voiceModule.getState();
            this.log(`現在の音声認識状態: ${currentState.recognitionState}`, 'info');
            
            if (currentState.recognitionState !== 'active') {
                throw new Error('音声認識が動作中ではありません。先に音声認識を開始してください。');
            }
            
            // 透明継続条件をチェック
            const shouldContinue = voiceModule.shouldContinueTransparently();
            this.log(`透明継続条件判定: ${shouldContinue}`, shouldContinue ? 'success' : 'warning');
            
            if (!shouldContinue) {
                this.log('透明継続条件を満たしていません（セッション非アクティブ等）', 'warning');
                return { success: false, message: '透明継続条件を満たしていません' };
            }
            
            // 手動で透明継続実行
            this.log('🔄 performTransparentContinuation()を手動実行', 'info');
            await voiceModule.performTransparentContinuation();
            
            // 結果確認
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
            const newState = voiceModule.getState();
            this.log(`透明継続後の音声認識状態: ${newState.recognitionState}`, 'info');
            
            return { 
                success: true, 
                message: '透明継続が正常に実行されました',
                oldState: currentState.recognitionState,
                newState: newState.recognitionState
            };
            
        } catch (error) {
            this.log(`手動透明継続エラー: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    // 🔧 forceRestartRecognition 単体テスト
    async testForceRestart() {
        this.log('🎯 forceRestartRecognition 単体テスト開始', 'info');
        
        try {
            if (!window.unifiedStateManager) {
                throw new Error('統一状態管理システムが未初期化');
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                throw new Error('VoiceModuleが取得できません');
            }
            
            // 現在の状態を保存
            const initialState = voiceModule.getState();
            this.log(`初期状態: ${initialState.recognitionState}`, 'info');
            
            // forceRestartRecognition 実行
            this.log('🔄 forceRestartRecognition()実行', 'info');
            const result = await voiceModule.forceRestartRecognition();
            
            // 結果確認
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
            const finalState = voiceModule.getState();
            this.log(`最終状態: ${finalState.recognitionState}`, 'info');
            
            return { 
                success: result === true, 
                message: 'forceRestartRecognition が正常に実行されました',
                initialState: initialState.recognitionState,
                finalState: finalState.recognitionState
            };
            
        } catch (error) {
            this.log(`forceRestartRecognition テストエラー: ${error.message}`, 'error');
            return { success: false, message: error.message };
        }
    }

    // 🎯 総合テスト：音声認識→停止→透明継続
    async runIntegratedTest() {
        this.log('🎯 統合テスト開始：音声認識→手動停止→透明継続', 'info');
        
        const results = [];
        
        try {
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                throw new Error('VoiceModuleが取得できません');
            }
            
            // Step 1: 音声認識開始
            this.log('Step 1: 音声認識開始', 'info');
            await voiceModule.startRecognition();
            await new Promise(resolve => setTimeout(resolve, 1000));
            let state = voiceModule.getState();
            results.push(`音声認識開始: ${state.recognitionState}`);
            
            // Step 2: 手動で onend イベントをシミュレート（透明継続のトリガー）
            this.log('Step 2: onend イベントシミュレート', 'info');
            voiceModule.handleEnd();
            await new Promise(resolve => setTimeout(resolve, 2000)); // 透明継続処理待機
            state = voiceModule.getState();
            results.push(`透明継続後: ${state.recognitionState}`);
            
            // Step 3: 結果判定
            if (state.recognitionState === 'active') {
                this.log('✅ 統合テスト成功：透明継続が正常に動作しました', 'success');
                return { success: true, message: '統合テスト成功', steps: results };
            } else {
                this.log('❌ 統合テスト失敗：透明継続が動作しませんでした', 'error');
                return { success: false, message: '統合テスト失敗', steps: results };
            }
            
        } catch (error) {
            this.log(`統合テストエラー: ${error.message}`, 'error');
            return { success: false, message: error.message, steps: results };
        }
    }
}

// テスト実行関数
async function runTransparentContinuationQuickTest() {
    const test = new TransparentContinuationQuickTest();
    const results = await test.runQuickTests();
    return results;
}

// 手動透明継続トリガー関数
async function triggerTransparentContinuation() {
    const test = new TransparentContinuationQuickTest();
    return await test.triggerTransparentContinuation();
}

// forceRestartRecognition単体テスト関数
async function testForceRestart() {
    const test = new TransparentContinuationQuickTest();
    return await test.testForceRestart();
}

// 統合テスト関数
async function runTransparentContinuationIntegratedTest() {
    const test = new TransparentContinuationQuickTest();
    return await test.runIntegratedTest();
}

// グローバル公開
window.runTransparentContinuationQuickTest = runTransparentContinuationQuickTest;
window.triggerTransparentContinuation = triggerTransparentContinuation;
window.testForceRestart = testForceRestart;
window.runTransparentContinuationIntegratedTest = runTransparentContinuationIntegratedTest;
window.TransparentContinuationQuickTest = TransparentContinuationQuickTest;

console.log('✅ 透明継続システム修正効果確認クイックテスト準備完了');
console.log('🚀 基本テスト: runTransparentContinuationQuickTest()');
console.log('🎯 手動トリガー: triggerTransparentContinuation()');
console.log('🔧 単体テスト: testForceRestart()');
console.log('🎯 統合テスト: runTransparentContinuationIntegratedTest()'); 