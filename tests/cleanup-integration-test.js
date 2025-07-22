/**
 * システム大掃除後 統合テストスイート
 * 全ての修正項目の動作確認を自動実行
 */

class CleanupIntegrationTest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🧪 システム大掃除後統合テスト開始');
        console.log('=' .repeat(60));
        
        // Phase 1: ファイル削除確認
        await this.testFileCleanup();
        
        // Phase 2: 統合コード削除確認  
        await this.testCodeCleanup();
        
        // Phase 3: 音声制御統一化確認
        await this.testVoiceControlUnification();
        
        // Phase 4: VoiceProcessingManager単純化確認
        await this.testVoiceProcessingSimplification();
        
        // Phase 5: 一時停止ボタン機能確認
        await this.testPauseButtonIntegration();
        
        // Phase 6: システム依存関係確認
        await this.testSystemDependencies();
        
        // Phase 7: エラーハンドリング確認
        await this.testErrorHandling();
        
        this.printResults();
        return this.results;
    }

    async testFileCleanup() {
        console.log('\n📁 Phase 1: ファイル削除確認');
        
        // VoiceUIManagerファイルが削除されているか確認
        await this.checkFileNotExists('app/voice-ui-manager.js', 'VoiceUIManager削除確認');
        
        // バックアップファイルが作成されているか確認
        const backupFiles = [
            'app/script.js.cleanup_backup',
            'app/voice-processing-manager.js.cleanup_backup',
            '深堀くん.html.cleanup_backup'
        ];
        
        for (const file of backupFiles) {
            await this.checkFileExists(file, `バックアップファイル確認: ${file}`);
        }
    }

    async testCodeCleanup() {
        console.log('\n🧹 Phase 2: 統合コード削除確認');
        
        // script.js内の削除された関数を確認
        const scriptContent = await this.loadFile('app/script.js');
        
        this.assertNotContains(scriptContent, 'handleVoiceUIToggle()', 'handleVoiceUIToggle削除確認');
        this.assertNotContains(scriptContent, 'updatePauseResumeButtonFromVoiceUI', 'VoiceUI統合関数削除確認');
        this.assertNotContains(scriptContent, 'window.VoiceUIManager', 'VoiceUIManager参照削除確認');
        
        // HTMLファイル内の変更確認
        const htmlContent = await this.loadFile('深堀くん.html');
        this.assertContains(htmlContent, 'onclick="toggleMicrophone()"', '一時停止ボタン直接接続確認');
    }

    async testVoiceControlUnification() {
        console.log('\n🎤 Phase 3: 音声制御統一化確認');
        
        const scriptContent = await this.loadFile('app/script.js');
        
        // toggleMicrophone関数の統一状態管理システム専用化確認
        this.assertContains(scriptContent, '統一状態管理システム専用', 'toggleMicrophone統一化確認');
        this.assertNotContains(scriptContent, 'フォールバック', 'フォールバック処理削除確認');
        this.assertNotContains(scriptContent, 'startRealtimeRecognition', 'レガシー関数削除確認');
        this.assertNotContains(scriptContent, 'stopRealtimeRecognition', 'レガシー関数削除確認');
    }

    async testVoiceProcessingSimplification() {
        console.log('\n🔧 Phase 4: VoiceProcessingManager単純化確認');
        
        const voiceProcessingContent = await this.loadFile('app/voice-processing-manager.js');
        
        this.assertNotContains(voiceProcessingContent, 'callOriginalProcessor', 'callOriginalProcessor削除確認');
        this.assertNotContains(voiceProcessingContent, 'fallbackToOriginal', 'fallbackToOriginal削除確認');
        this.assertNotContains(voiceProcessingContent, 'fallbackDeleteCommand', 'fallbackDeleteCommand削除確認');
        this.assertContains(voiceProcessingContent, 'window.processFinalTranscriptOriginal', '直接委譲確認');
    }

    async testPauseButtonIntegration() {
        console.log('\n⏸️ Phase 5: 一時停止ボタン機能確認');
        
        const scriptContent = await this.loadFile('app/script.js');
        const sessionStartContent = await this.loadFile('app/session-start-manager.js');
        
        this.assertContains(scriptContent, 'updatePauseResumeButton()', 'ボタン更新関数確認');
        this.assertContains(scriptContent, 'startPauseButtonMonitoring()', '監視システム確認');
        this.assertContains(sessionStartContent, 'startPauseButtonMonitoring', 'セッション開始時監視開始確認');
        this.assertContains(scriptContent, 'UnifiedStateManager.modules.get(\'voice\')', '統一状態管理システム接続確認');
    }

    async testSystemDependencies() {
        console.log('\n🔗 Phase 6: システム依存関係確認');
        
        // 重要ファイルの存在確認
        const criticalFiles = [
            'app/unified-state-manager/voice-module.js',
            'app/unified-state-manager/core.js', 
            'app/session-manager.js',
            'app/script.js'
        ];
        
        for (const file of criticalFiles) {
            await this.checkFileExists(file, `重要ファイル存在確認: ${file}`);
        }
        
        // SessionEndManagerのstopAllActivities確認
        const sessionManagerContent = await this.loadFile('app/session-manager.js');
        this.assertContains(sessionManagerContent, 'UnifiedStateManager.modules.get(\'voice\')', 'セッション終了時統一制御確認');
        this.assertNotContains(sessionManagerContent, 'forceStopAllActivity', '危険関数削除確認');
    }

    async testErrorHandling() {
        console.log('\n🚨 Phase 7: エラーハンドリング確認');
        
        const voiceProcessingContent = await this.loadFile('app/voice-processing-manager.js');
        
        // successMessage関連エラーの対策確認
        this.assertNotContains(voiceProcessingContent, 'successMessage', 'successMessageエラー対策確認');
        this.assertContains(voiceProcessingContent, 'success: false, error: error.message', 'エラー戻り値統一確認');
    }

    // ユーティリティメソッド
    async loadFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`ファイル読み込み失敗: ${filePath}`);
            return await response.text();
        } catch (error) {
            this.recordResult(false, `ファイル読み込みエラー: ${filePath} - ${error.message}`);
            return '';
        }
    }

    async checkFileExists(filePath, testName) {
        try {
            const response = await fetch(filePath + '?t=' + Date.now());
            if (response.ok) {
                this.recordResult(true, `${testName}: ✅ ファイル存在確認`);
            } else {
                this.recordResult(false, `${testName}: ❌ ファイルが見つかりません`);
            }
        } catch (error) {
            this.recordResult(false, `${testName}: ❌ アクセスエラー`);
        }
    }

    async checkFileNotExists(filePath, testName) {
        try {
            const response = await fetch(filePath + '?t=' + Date.now());
            if (response.ok) {
                this.recordResult(false, `${testName}: ❌ ファイルが残存しています`);
            } else {
                this.recordResult(true, `${testName}: ✅ ファイル削除確認`);
            }
        } catch (error) {
            this.recordResult(true, `${testName}: ✅ ファイル削除確認（アクセス不可）`);
        }
    }

    assertContains(content, searchText, testName) {
        if (content.includes(searchText)) {
            this.recordResult(true, `${testName}: ✅ 期待する内容が存在`);
        } else {
            this.recordResult(false, `${testName}: ❌ 期待する内容が見つかりません: "${searchText}"`);
        }
    }

    assertNotContains(content, searchText, testName) {
        if (!content.includes(searchText)) {
            this.recordResult(true, `${testName}: ✅ 削除確認`);
        } else {
            this.recordResult(false, `${testName}: ❌ 削除されるべき内容が残存: "${searchText}"`);
        }
    }

    recordResult(success, message) {
        if (success) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }
        this.results.details.push({ success, message });
        console.log(success ? '✅' : '❌', message);
    }

    printResults() {
        console.log('\n' + '=' .repeat(60));
        console.log('🧪 統合テスト結果');
        console.log('=' .repeat(60));
        console.log(`✅ 成功: ${this.results.passed}`);
        console.log(`❌ 失敗: ${this.results.failed}`);
        console.log(`📊 総テスト数: ${this.results.passed + this.results.failed}`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 全テスト成功！システム大掃除完了です！');
        } else {
            console.log('\n⚠️ 問題が検出されました。詳細を確認してください。');
        }
    }
}

// テスト実行関数
async function runCleanupIntegrationTest() {
    const test = new CleanupIntegrationTest();
    const results = await test.runAllTests();
    
    // 結果をグローバルに保存
    window.cleanupTestResults = results;
    return results;
}

// 自動実行（ページ読み込み後）
if (typeof window !== 'undefined') {
    window.runCleanupIntegrationTest = runCleanupIntegrationTest;
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CleanupIntegrationTest;
} 