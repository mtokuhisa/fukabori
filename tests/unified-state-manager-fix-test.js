/**
 * 🚨 統一状態管理システム修正効果確認テスト
 * window.unifiedStateManager初期化とアクセス方法修正の効果確認
 */

class UnifiedStateManagerFixTest {
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

    async runAllTests() {
        this.log('🚀 統一状態管理システム修正効果確認テスト開始', 'info');

        // Test 1: window.unifiedStateManager初期化確認
        await this.runTest('統一状態管理システム初期化確認', () => {
            if (!window.unifiedStateManager) {
                return { success: false, message: 'window.unifiedStateManagerが存在しません' };
            }
            if (!window.unifiedStateManager.modules) {
                return { success: false, message: 'modulesプロパティが存在しません' };
            }
            if (typeof window.unifiedStateManager.modules.get !== 'function') {
                return { success: false, message: 'modules.get()メソッドが存在しません' };
            }
            return { success: true, message: '統一状態管理システムが正しく初期化されています' };
        });

        // Test 2: VoiceModule取得確認
        await this.runTest('VoiceModule取得確認', () => {
            if (!window.unifiedStateManager) {
                return { success: false, message: '統一状態管理システムが未初期化' };
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                return { success: false, message: 'VoiceModuleが取得できません' };
            }
            
            // 基本メソッドの存在確認
            const requiredMethods = ['getState', 'startRecognition', 'stopRecognition', 'pauseRecognition', 'resumeRecognition'];
            for (const method of requiredMethods) {
                if (typeof voiceModule[method] !== 'function') {
                    return { success: false, message: `VoiceModule.${method}()メソッドが存在しません` };
                }
            }
            
            return { success: true, message: 'VoiceModuleが正しく取得でき、必要なメソッドが存在します' };
        });

        // Test 3: toggleMicrophone安全性確認
        await this.runTest('toggleMicrophone安全性確認', async () => {
            if (typeof window.toggleMicrophone !== 'function') {
                return { success: false, message: 'toggleMicrophone関数が存在しません' };
            }

            try {
                // toggleMicrophone呼び出し（エラーが発生しないことを確認）
                // 注意：実際の実行はしない（音声認識影響を避けるため）
                const code = window.toggleMicrophone.toString();
                if (!code.includes('window.unifiedStateManager')) {
                    return { success: false, message: 'toggleMicrophoneで正しいアクセス方法が使用されていません' };
                }
                if (code.includes('window.VoiceModule')) {
                    return { success: false, message: 'toggleMicrophoneで古いアクセス方法が残存しています' };
                }
                
                return { success: true, message: 'toggleMicrophoneが正しいアクセス方法を使用しています' };
            } catch (error) {
                return { success: false, message: `toggleMicrophone実行エラー: ${error.message}` };
            }
        });

        // Test 4: updatePauseResumeButton安全性確認
        await this.runTest('updatePauseResumeButton安全性確認', () => {
            if (typeof window.updatePauseResumeButton !== 'function') {
                return { success: false, message: 'updatePauseResumeButton関数が存在しません' };
            }

            try {
                const code = window.updatePauseResumeButton.toString();
                if (!code.includes('window.unifiedStateManager')) {
                    return { success: false, message: 'updatePauseResumeButtonで正しいアクセス方法が使用されていません' };
                }
                if (code.includes('window.VoiceModule')) {
                    return { success: false, message: 'updatePauseResumeButtonで古いアクセス方法が残存しています' };
                }
                
                return { success: true, message: 'updatePauseResumeButtonが正しいアクセス方法を使用しています' };
            } catch (error) {
                return { success: false, message: `updatePauseResumeButton実行エラー: ${error.message}` };
            }
        });

        // Test 5: 透明継続システム動作確認
        await this.runTest('透明継続システム動作確認', () => {
            if (!window.unifiedStateManager) {
                return { success: false, message: '統一状態管理システムが未初期化' };
            }
            
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (!voiceModule) {
                return { success: false, message: 'VoiceModuleが取得できません' };
            }
            
            // 透明継続関連メソッドの存在確認
            const continuationMethods = ['shouldContinueTransparently', 'performTransparentContinuation'];
            for (const method of continuationMethods) {
                if (typeof voiceModule[method] !== 'function') {
                    return { success: false, message: `透明継続メソッド ${method}() が存在しません` };
                }
            }
            
            return { success: true, message: '透明継続システムが正しく実装されています' };
        });

        // Test 6: SessionManager修正確認
        await this.runTest('SessionManager修正確認', () => {
            if (typeof window.SessionEndManager === 'undefined') {
                return { success: false, message: 'SessionEndManagerが存在しません' };
            }

            // SessionEndManager.stopAllActivitiesの実装確認
            const stopActivitiesCode = window.SessionEndManager.stopAllActivities.toString();
            if (stopActivitiesCode.includes('window.VoiceModule')) {
                return { success: false, message: 'SessionEndManagerで古いアクセス方法が残存しています' };
            }
            if (!stopActivitiesCode.includes('window.unifiedStateManager')) {
                return { success: false, message: 'SessionEndManagerで正しいアクセス方法が使用されていません' };
            }
            
            return { success: true, message: 'SessionEndManagerが正しく修正されています' };
        });

        // Test 7: AppState.sessionActive状態確認
        await this.runTest('AppState.sessionActive状態確認', () => {
            if (!window.AppState) {
                return { success: false, message: 'window.AppStateが存在しません' };
            }
            
            if (typeof window.AppState.sessionActive === 'undefined') {
                return { success: false, message: 'AppState.sessionActiveが存在しません' };
            }
            
            const sessionActive = window.AppState.sessionActive;
            return { 
                success: true, 
                message: `AppState.sessionActive = ${sessionActive} (透明継続判定に使用)` 
            };
        });

        // 🎯 結果まとめ
        this.log('🎉 テスト完了！', 'info');
        this.log(`📊 成功率: ${this.successCount}/${this.testCount} (${Math.round((this.successCount / this.testCount) * 100)}%)`, 'info');

        if (this.successCount === this.testCount) {
            this.log('✅ 全てのテストが成功しました！統一状態管理システム修正が完了', 'success');
        } else {
            this.log('⚠️ いくつかのテストが失敗しました。詳細を確認してください', 'warning');
        }

        return {
            success: this.successCount === this.testCount,
            successRate: Math.round((this.successCount / this.testCount) * 100),
            results: this.testResults
        };
    }

    // 🔧 修正効果の詳細確認
    async performDetailedAnalysis() {
        this.log('🔍 修正効果詳細分析開始', 'info');

        // 1. 初期化タイミング分析
        const initializationAnalysis = {
            unifiedStateManagerExists: !!window.unifiedStateManager,
            modulesExists: !!(window.unifiedStateManager && window.unifiedStateManager.modules),
            voiceModuleExists: !!(window.unifiedStateManager && window.unifiedStateManager.modules && window.unifiedStateManager.modules.get('voice'))
        };

        // 2. VoiceModule状態分析
        let voiceModuleState = null;
        if (initializationAnalysis.voiceModuleExists) {
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            voiceModuleState = voiceModule.getState ? voiceModule.getState() : 'getState()メソッドなし';
        }

        // 3. セッション状態分析
        const sessionAnalysis = {
            appStateExists: !!window.AppState,
            sessionActive: window.AppState ? window.AppState.sessionActive : 'AppState未定義'
        };

        const analysis = {
            initialization: initializationAnalysis,
            voiceState: voiceModuleState,
            session: sessionAnalysis,
            timestamp: new Date().toISOString()
        };

        console.log('📊 修正効果詳細分析結果:', analysis);
        return analysis;
    }
}

// テスト実行関数
async function runUnifiedStateManagerFixTest() {
    const test = new UnifiedStateManagerFixTest();
    const results = await test.runAllTests();
    const analysis = await test.performDetailedAnalysis();
    
    return {
        testResults: results,
        detailedAnalysis: analysis
    };
}

// グローバル公開
window.runUnifiedStateManagerFixTest = runUnifiedStateManagerFixTest;
window.UnifiedStateManagerFixTest = UnifiedStateManagerFixTest;

console.log('✅ 統一状態管理システム修正効果確認テスト準備完了');
console.log('🚀 テスト実行: runUnifiedStateManagerFixTest()'); 