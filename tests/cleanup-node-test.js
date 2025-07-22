/**
 * Node.js版 システム大掃除統合テスト
 * ファイルシステム直接アクセスによる検証
 */

const fs = require('fs');
const path = require('path');

class NodeCleanupTest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🧪 Node.js版システム大掃除統合テスト開始');
        console.log('='.repeat(60));
        
        await this.testFileCleanup();
        await this.testCodeCleanup();
        await this.testVoiceControlUnification();
        await this.testVoiceProcessingSimplification();
        await this.testPauseButtonIntegration();
        await this.testSystemDependencies();
        await this.testErrorHandling();
        
        this.printResults();
        return this.results;
    }

    async testFileCleanup() {
        console.log('\n📁 Phase 1: ファイル削除確認');
        
        // VoiceUIManagerファイルが削除されているか確認
        this.assertFileNotExists('app/voice-ui-manager.js', 'VoiceUIManager削除確認');
        
        // バックアップファイルが作成されているか確認
        this.assertBackupFileExists('app/script.js');
        this.assertBackupFileExists('深堀くん.html');
        this.assertBackupFileExists('app/voice-processing-manager.js');
    }

    async testCodeCleanup() {
        console.log('\n🧹 Phase 2: 統合コード削除確認');
        
        const scriptContent = this.loadFile('app/script.js');
        
        this.assertNotContains(scriptContent, 'handleVoiceUIToggle()', 'handleVoiceUIToggle削除確認');
        this.assertNotContains(scriptContent, 'updatePauseResumeButtonFromVoiceUI', 'VoiceUI統合関数削除確認');
        this.assertNotContains(scriptContent, 'window.VoiceUIManager', 'VoiceUIManager参照削除確認');
        
        const htmlContent = this.loadFile('深堀くん.html');
        this.assertContains(htmlContent, 'onclick="toggleMicrophone()"', '一時停止ボタン直接接続確認');
    }

    async testVoiceControlUnification() {
        console.log('\n🎤 Phase 3: 音声制御統一化確認');
        
        const scriptContent = this.loadFile('app/script.js');
        
        this.assertContains(scriptContent, '統一状態管理システム専用', 'toggleMicrophone統一化確認');
        this.assertNotContains(scriptContent, 'startRealtimeRecognition', 'レガシー関数削除確認');
        this.assertNotContains(scriptContent, 'stopRealtimeRecognition', 'レガシー関数削除確認');
    }

    async testVoiceProcessingSimplification() {
        console.log('\n🔧 Phase 4: VoiceProcessingManager単純化確認');
        
        const voiceProcessingContent = this.loadFile('app/voice-processing-manager.js');
        
        this.assertNotContains(voiceProcessingContent, 'callOriginalProcessor', 'callOriginalProcessor削除確認');
        this.assertNotContains(voiceProcessingContent, 'fallbackToOriginal', 'fallbackToOriginal削除確認');
        this.assertNotContains(voiceProcessingContent, 'fallbackDeleteCommand', 'fallbackDeleteCommand削除確認');
        this.assertContains(voiceProcessingContent, 'window.processFinalTranscriptOriginal', '直接委譲確認');
    }

    async testPauseButtonIntegration() {
        console.log('\n⏸️ Phase 5: 一時停止ボタン機能確認');
        
        const scriptContent = this.loadFile('app/script.js');
        const sessionStartContent = this.loadFile('app/session-start-manager.js');
        
        this.assertContains(scriptContent, 'updatePauseResumeButton()', 'ボタン更新関数確認');
        this.assertContains(scriptContent, 'startPauseButtonMonitoring()', '監視システム確認');
        this.assertContains(sessionStartContent, 'startPauseButtonMonitoring', 'セッション開始時監視開始確認');
        this.assertContains(scriptContent, 'UnifiedStateManager.modules.get(\'voice\')', '統一状態管理システム接続確認');
    }

    async testSystemDependencies() {
        console.log('\n🔗 Phase 6: システム依存関係確認');
        
        const criticalFiles = [
            'app/unified-state-manager/voice-module.js',
            'app/unified-state-manager/core.js', 
            'app/session-manager.js',
            'app/script.js'
        ];
        
        for (const file of criticalFiles) {
            this.assertFileExists(file, `重要ファイル存在確認: ${file}`);
        }
        
        const sessionManagerContent = this.loadFile('app/session-manager.js');
        this.assertContains(sessionManagerContent, 'UnifiedStateManager.modules.get(\'voice\')', 'セッション終了時統一制御確認');
        this.assertNotContains(sessionManagerContent, 'forceStopAllActivity', '危険関数削除確認');
    }

    async testErrorHandling() {
        console.log('\n🚨 Phase 7: エラーハンドリング確認');
        
        const voiceProcessingContent = this.loadFile('app/voice-processing-manager.js');
        
        this.assertNotContains(voiceProcessingContent, 'successMessage', 'successMessageエラー対策確認');
        this.assertContains(voiceProcessingContent, 'success: false, error: error.message', 'エラー戻り値統一確認');
    }

    // ユーティリティメソッド
    loadFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            this.recordResult(false, `ファイル読み込みエラー: ${filePath} - ${error.message}`);
            return '';
        }
    }

    assertFileExists(filePath, testName) {
        if (fs.existsSync(filePath)) {
            this.recordResult(true, `${testName}: ✅ ファイル存在確認`);
        } else {
            this.recordResult(false, `${testName}: ❌ ファイルが見つかりません`);
        }
    }

    assertFileNotExists(filePath, testName) {
        if (!fs.existsSync(filePath)) {
            this.recordResult(true, `${testName}: ✅ ファイル削除確認`);
        } else {
            this.recordResult(false, `${testName}: ❌ ファイルが残存しています`);
        }
    }

    assertBackupFileExists(originalFile) {
        const dir = path.dirname(originalFile);
        const basename = path.basename(originalFile);
        
        try {
            const files = fs.readdirSync(dir);
            const backupFiles = files.filter(file => 
                file.startsWith(basename + '.cleanup_backup_')
            );
            
            if (backupFiles.length > 0) {
                this.recordResult(true, `${originalFile}のバックアップ確認: ✅ ${backupFiles[0]}`);
            } else {
                this.recordResult(false, `${originalFile}のバックアップ確認: ❌ バックアップファイルなし`);
            }
        } catch (error) {
            this.recordResult(false, `${originalFile}のバックアップ確認: ❌ ディレクトリアクセスエラー`);
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
        console.log('\n' + '='.repeat(60));
        console.log('🧪 統合テスト結果');
        console.log('='.repeat(60));
        console.log(`✅ 成功: ${this.results.passed}`);
        console.log(`❌ 失敗: ${this.results.failed}`);
        console.log(`📊 総テスト数: ${this.results.passed + this.results.failed}`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 全テスト成功！システム大掃除完了です！');
            console.log('🌟 ブラウザテストの準備ができました：');
            console.log('   テストURL: http://localhost:8000/cleanup-test-runner.html');
        } else {
            console.log('\n⚠️ 問題が検出されました。詳細を確認してください。');
            
            // 失敗したテストの詳細表示
            console.log('\n📋 失敗したテスト:');
            this.results.details
                .filter(detail => !detail.success)
                .forEach(detail => console.log(`   • ${detail.message}`));
        }
    }
}

// テスト実行
async function runTest() {
    const test = new NodeCleanupTest();
    return await test.runAllTests();
}

// 直接実行の場合
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = NodeCleanupTest; 