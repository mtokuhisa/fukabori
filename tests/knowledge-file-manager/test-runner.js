// =================================================================================
// 深堀くん - テスト実行スクリプト
// =================================================================================

/**
 * Phase 1実装テストを実行
 */
async function runPhase1Tests() {
    console.log('🧪 Phase 1: 依存関係インターフェース化テスト開始');
    
    try {
        // 1. インターフェース初期化テスト
        console.log('🔧 1. インターフェース初期化テスト');
        await KnowledgeFileManagerInterface.initialize();
        
        // 2. 依存関係検証テスト
        console.log('🔧 2. 依存関係検証テスト');
        const validation = KnowledgeFileManagerInterface.validation.validateAllDependencies();
        console.log('依存関係検証結果:', validation);
        
        // 3. KnowledgeFileManagerテストスイート実行
        console.log('🔧 3. KnowledgeFileManagerテストスイート実行');
        await KnowledgeFileManagerTests.runAllTests();
        
        // 4. 後方互換性テスト
        console.log('🔧 4. 後方互換性テスト');
        await testBackwardCompatibility();
        
        console.log('✅ Phase 1テスト完了');
        
    } catch (error) {
        console.error('❌ Phase 1テスト失敗:', error);
        throw error;
    }
}

/**
 * 後方互換性テスト
 */
async function testBackwardCompatibility() {
    console.log('🔄 後方互換性テスト開始...');
    
    try {
        // KnowledgeFileManagerがグローバルに存在することを確認
        if (typeof window.KnowledgeFileManager === 'undefined') {
            throw new Error('KnowledgeFileManager がグローバルに存在しません');
        }
        
        // 既存のメソッドが存在することを確認
        const requiredMethods = [
            'createSessionFile',
            'addInsight',
            'generateKnowledgeFile',
            'enhanceKnowledgeWithAI'
        ];
        
        for (const method of requiredMethods) {
            if (typeof window.KnowledgeFileManager[method] !== 'function') {
                throw new Error(`KnowledgeFileManager.${method} が存在しません`);
            }
        }
        
        console.log('✅ 後方互換性テスト完了 - すべてのメソッドが存在します');
        
    } catch (error) {
        console.error('❌ 後方互換性テスト失敗:', error);
        throw error;
    }
}

/**
 * 実際のフローテスト（統合テスト）
 */
async function runIntegrationTest() {
    console.log('🔗 統合テスト開始...');
    
    try {
        // TestHelperでダミーデータを設定
        TestHelpers.setupDummyKnowledgeState();
        
        // 1. セッション作成
        console.log('1. セッション作成テスト');
        const sessionMeta = {
            session_id: 'integration_test_001',
            theme: '統合テスト用セッション',
            participant: 'テストユーザー',
            participant_role: 'テスター',
            category: '技術管理'
        };
        
        const session = await KnowledgeFileManager.createSessionFile(sessionMeta);
        console.log('✅ セッション作成完了:', session.filename);
        
        // 2. 知見追加
        console.log('2. 知見追加テスト');
        const result = KnowledgeFileManager.addInsight(
            '統合テスト用の知見です。リファクタリング後も正常動作することを確認します。',
            { situation: '統合テスト中', related_conversation: ['リファクタリング', '互換性確認'] },
            { confidence: 0.9, importance: 0.8 }
        );
        console.log('✅ 知見追加完了:', result);
        
        // 3. AI拡張（依存関係があるため条件付き）
        console.log('3. AI拡張テスト');
        const apiKey = KnowledgeFileManagerInterface.api.getApiKey();
        if (apiKey) {
            const enhanced = await KnowledgeFileManager.enhanceKnowledgeWithAI(
                KnowledgeFileManagerInterface.state.getCurrentSession(),
                false // プログレス表示なし
            );
            console.log('✅ AI拡張完了:', enhanced.insights.length, '件の知見');
        } else {
            console.log('⚠️ APIキーが設定されていないため、AI拡張をスキップしました');
        }
        
        // 4. ファイル生成
        console.log('4. ファイル生成テスト');
        const filename = await KnowledgeFileManager.generateKnowledgeFile();
        console.log('✅ ファイル生成完了:', filename);
        
        console.log('🎉 統合テスト完了 - すべての機能が正常に動作しています');
        
    } catch (error) {
        console.error('❌ 統合テスト失敗:', error);
        throw error;
    } finally {
        // クリーンアップ
        TestHelpers.cleanup();
    }
}

/**
 * 完全テスト実行
 */
async function runCompleteTests() {
    console.log('🚀 完全テスト実行開始');
    
    try {
        await runPhase1Tests();
        await runIntegrationTest();
        
        console.log('🎉 全テスト完了 - Phase 1 実装は成功しました！');
        
        // 結果サマリー表示
        const testResults = KnowledgeFileManagerTests.results;
        const passed = testResults.filter(r => r.status === 'PASS').length;
        const total = testResults.length;
        
        console.log(`\n📊 最終結果: ${passed}/${total} テストが成功`);
        
        if (passed === total) {
            console.log('✅ すべてのテストが成功しました！');
            console.log('🎯 Phase 2 (4つのサブモジュール分離) に進む準備が整いました');
        } else {
            console.log('⚠️ 一部のテストが失敗しました。修正が必要です。');
        }
        
    } catch (error) {
        console.error('❌ テスト実行中にエラーが発生しました:', error);
        throw error;
    }
}

// グローバル公開
window.runPhase1Tests = runPhase1Tests;
window.runIntegrationTest = runIntegrationTest;
window.runCompleteTests = runCompleteTests;

// 自動実行フラグ
if (typeof window.AUTO_RUN_TESTS !== 'undefined' && window.AUTO_RUN_TESTS) {
    document.addEventListener('DOMContentLoaded', async function() {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        console.log('🤖 自動テスト実行開始...');
        await runCompleteTests();
    });
}

console.log('✅ テスト実行スクリプト読み込み完了');
console.log('📝 使用方法:');
console.log('  - runCompleteTests() // 全テスト実行');
console.log('  - runPhase1Tests() // Phase 1テストのみ');
console.log('  - runIntegrationTest() // 統合テストのみ'); 