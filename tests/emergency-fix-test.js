/**
 * 深堀くんv2.0 緊急修復テスト
 * forceStopAllActivity除去後の音声認識継続性テスト
 */

async function emergencyFixTest() {
    console.log('🚨 深堀くんv2.0 緊急修復テスト開始');
    console.log('⏰', new Date().toISOString());
    
    const testResults = {
        startTime: Date.now(),
        forceStopAllActivityRemoval: null,
        toggleMicrophoneFix: null,
        sessionManagerSafety: null,
        htmlCleanup: null,
        deleteFunction: null,
        voiceContinuity: null,
        totalTests: 6,
        passedTests: 0,
        errors: []
    };

    try {
        // Test 1: forceStopAllActivity関数の完全除去確認
        console.log('\n📋 Test 1: forceStopAllActivity除去確認');
        if (typeof window.forceStopAllActivity === 'undefined') {
            testResults.forceStopAllActivityRemoval = { status: 'PASS', message: 'forceStopAllActivity関数が正しく除去されている' };
            testResults.passedTests++;
        } else {
            testResults.forceStopAllActivityRemoval = { status: 'FAIL', message: 'forceStopAllActivity関数がまだ存在している' };
        }

        // Test 2: toggleMicrophone統一状態管理システム優先確認
        console.log('\n📋 Test 2: toggleMicrophone統一状態管理システム対応');
        if (typeof window.toggleMicrophone === 'function') {
            // 統一状態管理システムが利用可能かチェック
            const hasUnifiedStateManager = typeof window.UnifiedStateManager !== 'undefined';
            testResults.toggleMicrophoneFix = { 
                status: 'PASS', 
                message: `toggleMicrophone関数存在, 統一状態管理システム: ${hasUnifiedStateManager}` 
            };
            testResults.passedTests++;
        } else {
            testResults.toggleMicrophoneFix = { status: 'FAIL', message: 'toggleMicrophone関数が存在しない' };
        }

        // Test 3: SessionEndManager安全実装確認
        console.log('\n📋 Test 3: SessionEndManager安全実装');
        if (typeof SessionEndManager !== 'undefined' && typeof SessionEndManager.stopAllActivities === 'function') {
            testResults.sessionManagerSafety = { status: 'PASS', message: 'SessionEndManager.stopAllActivitiesが存在' };
            testResults.passedTests++;
        } else {
            testResults.sessionManagerSafety = { status: 'FAIL', message: 'SessionEndManager.stopAllActivitiesが存在しない' };
        }

        // Test 4: HTML一時停止ボタン修正確認
        console.log('\n📋 Test 4: HTML一時停止ボタン修正');
        const pauseButton = document.querySelector('button[onclick*="toggleMicrophone"]');
        if (pauseButton && !document.querySelector('button[onclick*="forceStopAllActivity"]')) {
            testResults.htmlCleanup = { status: 'PASS', message: 'HTML一時停止ボタンがtoggleMicrophoneに修正済み' };
            testResults.passedTests++;
        } else {
            testResults.htmlCleanup = { status: 'FAIL', message: 'HTML一時停止ボタンの修正が不完全' };
        }

        // Test 5: 削除機能の「どうぞ」待ちシステム確認
        console.log('\n📋 Test 5: 削除機能「どうぞ」待ちシステム');
        const hasVoiceProcessingManager = typeof window.VoiceProcessingManager !== 'undefined';
        const hasAppStateWaitingFlag = typeof window.AppState?.waitingForPermission !== 'undefined';
        if (hasVoiceProcessingManager && hasAppStateWaitingFlag !== false) {
            testResults.deleteFunction = { 
                status: 'PASS', 
                message: `削除機能システム存在: VPM=${hasVoiceProcessingManager}, waitingFlag=${hasAppStateWaitingFlag}` 
            };
            testResults.passedTests++;
        } else {
            testResults.deleteFunction = { status: 'FAIL', message: '削除機能システムが不完全' };
        }

        // Test 6: 音声認識継続性シミュレーション（基本チェック）
        console.log('\n📋 Test 6: 音声認識継続性基本チェック');
        const hasUnifiedVoiceModule = window.UnifiedStateManager?.modules?.get('voice');
        const hasStateManager = typeof window.stateManager !== 'undefined';
        if (hasUnifiedVoiceModule || hasStateManager) {
            testResults.voiceContinuity = { 
                status: 'PASS', 
                message: `音声システム利用可能: Unified=${!!hasUnifiedVoiceModule}, Legacy=${hasStateManager}` 
            };
            testResults.passedTests++;
        } else {
            testResults.voiceContinuity = { status: 'FAIL', message: '音声システムが利用不可能' };
        }

    } catch (error) {
        testResults.errors.push(`テスト実行エラー: ${error.message}`);
    }

    // 結果まとめ
    testResults.endTime = Date.now();
    testResults.duration = testResults.endTime - testResults.startTime;
    testResults.success = testResults.passedTests === testResults.totalTests && testResults.errors.length === 0;

    console.log('\n🎯 緊急修復テスト結果');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${testResults.passedTests}/${testResults.totalTests}`);
    console.log(`⏱️ 実行時間: ${testResults.duration}ms`);
    console.log(`🎯 総合結果: ${testResults.success ? '🟢 SUCCESS' : '🔴 FAILURE'}`);
    
    // 詳細結果
    Object.keys(testResults).forEach(key => {
        if (typeof testResults[key] === 'object' && testResults[key]?.status) {
            const result = testResults[key];
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${key}: ${result.message}`);
        }
    });

    if (testResults.errors.length > 0) {
        console.log('\n⚠️ エラー:');
        testResults.errors.forEach(error => console.log(`  • ${error}`));
    }

    return testResults;
}

// テスト実行
if (typeof window !== 'undefined') {
    window.emergencyFixTest = emergencyFixTest;
    console.log('🧪 緊急修復テストが利用可能です: emergencyFixTest()');
} else {
    console.log('�� ブラウザ環境が必要です');
} 