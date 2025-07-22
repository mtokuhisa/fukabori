// 🧪 音声削除コマンド統合テストシステム
// ユーザー負担最小で自動化されたテスト機能

const VoiceDeleteIntegrationTest = {
    // テスト結果記録
    results: {
        tests: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            startTime: null,
            endTime: null
        }
    },
    
    // テスト実行フラグ
    isRunning: false,
    
    // =================================================================================
    // メインテスト実行
    // =================================================================================
    
    async runCompleteTest() {
        if (this.isRunning) {
            console.log('🔄 テスト実行中のため待機してください');
            return;
        }
        
        this.isRunning = true;
        this.results.summary.startTime = Date.now();
        this.results.tests = [];
        
        console.log('🚀 音声削除コマンド統合テスト開始');
        console.log('='.repeat(60));
        
        try {
            // Phase 1: 基本機能テスト
            await this.testVoiceCommandRemoval();
            await this.testDeleteProcessing();
            await this.testStateManagement();
            
            // Phase 2: 統合テスト
            await this.testIntegratedFlow();
            await this.testEdgeCases();
            
            // Phase 3: パフォーマンステスト
            await this.testPerformance();
            
            // 結果集計
            this.generateSummary();
            
        } catch (error) {
            console.error('❌ テスト実行エラー:', error);
            this.recordTest('Test Runner', 'テスト実行', false, `実行エラー: ${error.message}`);
        } finally {
            this.isRunning = false;
            this.results.summary.endTime = Date.now();
        }
    },
    
    // =================================================================================
    // Phase 1: 基本機能テスト
    // =================================================================================
    
    async testVoiceCommandRemoval() {
        console.log('📝 Phase 1: 音声コマンド除去テスト');
        
        const testCases = [
            {
                name: '3文字削除コマンド',
                input: 'ありがとうございます 3文字削除して',
                expectedCount: 3,
                expected: 'ありがとうございます'
            },
            {
                name: '5文字削除コマンド',
                input: '適当に喋りますよ 5文字削除',
                expectedCount: 5,
                expected: '適当に喋りますよ'
            },
            {
                name: '5文字削除コマンド（スペース入り）',
                input: 'テストデータです 5文字 削除して',
                expectedCount: 5,
                expected: 'テストデータです'
            },
            {
                name: '10文字削除コマンド',
                input: 'テストデータです最後の10文字消して',
                expectedCount: 10,
                expected: 'テストデータです最後の'
            },
            {
                name: 'ありがとうございますかテスト',
                input: 'ありがとうございますか 3文字削除して',
                expectedCount: 3,
                expected: 'ありがとうございますか'
            },
            {
                name: '音声コマンドなし',
                input: 'これは普通のテキストです',
                expectedCount: 5,
                expected: 'これは普通のテキストです'
            }
        ];
        
        for (const testCase of testCases) {
            await this.testSingleVoiceCommandRemoval(testCase);
        }
    },
    
    async testSingleVoiceCommandRemoval(testCase) {
        try {
            if (typeof window.removeVoiceCommand !== 'function') {
                this.recordTest('Voice Command Removal', testCase.name, false, 'removeVoiceCommand関数が見つかりません');
                return;
            }
            
            const result = window.removeVoiceCommand(testCase.input, testCase.expectedCount);
            const success = result === testCase.expected;
            
            this.recordTest(
                'Voice Command Removal', 
                testCase.name, 
                success, 
                success ? '音声コマンド除去成功' : `期待値: "${testCase.expected}", 実際: "${result}"`
            );
            
        } catch (error) {
            this.recordTest('Voice Command Removal', testCase.name, false, `エラー: ${error.message}`);
        }
    },
    
    async testDeleteProcessing() {
        console.log('🔧 Phase 1: 削除処理テスト');
        
        // AppStateのバックアップ
        const backup = {
            transcriptHistory: [...(window.AppState?.transcriptHistory || [])],
            currentTranscript: window.AppState?.currentTranscript || ''
        };
        
        try {
            // テスト用データ設定
            if (window.AppState) {
                window.AppState.transcriptHistory = ['テストデータです'];
                window.AppState.currentTranscript = 'テストデータです';
            }
            
            // VoiceProcessingManagerが利用可能かテスト
            const vpmAvailable = window.VoiceProcessingManager && 
                                 typeof window.VoiceProcessingManager.executeNumberDelete === 'function';
            
            if (vpmAvailable) {
                await this.testVoiceProcessingManagerDelete();
            } else {
                this.recordTest('Delete Processing', 'VoiceProcessingManager', false, 'VoiceProcessingManagerが利用不可');
            }
            
        } finally {
            // AppState復元
            if (window.AppState) {
                window.AppState.transcriptHistory = backup.transcriptHistory;
                window.AppState.currentTranscript = backup.currentTranscript;
            }
        }
    },
    
    async testVoiceProcessingManagerDelete() {
        try {
            // VoiceProcessingManagerインスタンス取得
            const vpm = new window.VoiceProcessingManager();
            await vpm.initialize();
            
            // 3文字削除テスト
            const result3 = await vpm.executeNumberDelete(3);
            const success3 = result3 && result3.deletedCount === 3;
            
            this.recordTest(
                'Delete Processing', 
                '3文字削除実行', 
                success3, 
                success3 ? `3文字削除成功: ${result3.deletedCount}文字` : `削除失敗: ${JSON.stringify(result3)}`
            );
            
        } catch (error) {
            this.recordTest('Delete Processing', 'VPM削除実行', false, `エラー: ${error.message}`);
        }
    },
    
    async testStateManagement() {
        console.log('⚙️ Phase 1: 状態管理テスト');
        
        const testCases = [
            {
                name: 'waitingForPermission初期状態',
                test: () => window.AppState?.waitingForPermission !== undefined,
                expected: true
            },
            {
                name: 'transcriptHistory配列',
                test: () => Array.isArray(window.AppState?.transcriptHistory),
                expected: true
            },
            {
                name: 'currentTranscript文字列',
                test: () => typeof window.AppState?.currentTranscript === 'string',
                expected: true
            }
        ];
        
        testCases.forEach(testCase => {
            try {
                const result = testCase.test();
                const success = result === testCase.expected;
                
                this.recordTest(
                    'State Management', 
                    testCase.name, 
                    success, 
                    success ? '状態管理正常' : `期待値: ${testCase.expected}, 実際: ${result}`
                );
                
            } catch (error) {
                this.recordTest('State Management', testCase.name, false, `エラー: ${error.message}`);
            }
        });
    },
    
    // =================================================================================
    // Phase 2: 統合テスト
    // =================================================================================
    
    async testIntegratedFlow() {
        console.log('🔄 Phase 2: 統合フローテスト');
        
        // 3文字と5文字削除の統一処理テスト
        await this.testUnifiedDeletionFlow();
        
        // 音声コマンド除去 + 削除実行の連携テスト
        await this.testVoiceCommandIntegration();
    },
    
    async testUnifiedDeletionFlow() {
        try {
            // VoiceProcessingManagerの削除コマンド検出テスト
            if (!window.VoiceProcessingManager) {
                this.recordTest('Integrated Flow', '統一削除フロー', false, 'VoiceProcessingManagerが利用不可');
                return;
            }
            
            const vpm = new window.VoiceProcessingManager();
            await vpm.initialize();
            
            // 3文字削除コマンド検出
            const command3 = vpm.detectDeleteCommand('3文字削除して');
            const success3 = command3 && command3.type === 'number_delete' && command3.count === 3;
            
            this.recordTest(
                'Integrated Flow', 
                '3文字削除コマンド検出', 
                success3, 
                success3 ? '3文字削除検出成功' : `検出失敗: ${JSON.stringify(command3)}`
            );
            
            // 5文字削除コマンド検出
            const command5 = vpm.detectDeleteCommand('5文字削除');
            const success5 = command5 && command5.type === 'number_delete' && command5.count === 5;
            
            this.recordTest(
                'Integrated Flow', 
                '5文字削除コマンド検出', 
                success5, 
                success5 ? '5文字削除検出成功' : `検出失敗: ${JSON.stringify(command5)}`
            );
            
            // 両方とも確認なしで実行されるかテスト
            const noConfirmation3 = !command3?.requiresConfirmation;
            const noConfirmation5 = !command5?.requiresConfirmation;
            
            this.recordTest(
                'Integrated Flow', 
                '確認処理無効化', 
                noConfirmation3 && noConfirmation5, 
                `3文字確認: ${command3?.requiresConfirmation}, 5文字確認: ${command5?.requiresConfirmation}`
            );
            
        } catch (error) {
            this.recordTest('Integrated Flow', '統一削除フロー', false, `エラー: ${error.message}`);
        }
    },
    
    async testVoiceCommandIntegration() {
        try {
                         // 音声コマンド除去 + 削除実行の連携テスト
             const testCases = [
                 {
                     name: '基本削除テスト',
                     input: 'これはテストです 3文字削除して',
                     expectedCleaned: 'これはテストです',
                     expectedAfterDelete: 'これはテス',
                     deleteCount: 3
                 },
                 {
                     name: 'ありがとうございますかテスト',
                     input: 'ありがとうございますか 3文字削除して',
                     expectedCleaned: 'ありがとうございますか',
                     expectedAfterDelete: 'ありがとうござい',
                     deleteCount: 3
                 },
                 {
                     name: '5文字削除テスト',
                     input: 'テストです 5文字削除して',
                     expectedCleaned: 'テストです',
                     expectedAfterDelete: '',
                     deleteCount: 5
                 }
             ];
             
             for (const testCase of testCases) {
                 await this.testSingleVoiceCommandIntegration(testCase);
             }
         } catch (error) {
             this.recordTest('Voice Command Integration', '連携テスト', false, `エラー: ${error.message}`);
         }
     },
     
     async testSingleVoiceCommandIntegration(testCase) {
         try {
             const { input, expectedCleaned, expectedAfterDelete, deleteCount } = testCase;
            
                         // Step 1: 音声コマンド除去
             if (typeof window.removeVoiceCommand !== 'function') {
                 this.recordTest('Voice Command Integration', `${testCase.name}_連携テスト`, false, 'removeVoiceCommand関数が利用不可');
                 return;
             }
             
             const cleaned = window.removeVoiceCommand(input, deleteCount);
             const cleanSuccess = cleaned === expectedCleaned;
             
             // Step 2: AppStateに設定してSpeechCorrectionSystemで削除実行
             if (window.AppState && window.SpeechCorrectionSystem) {
                 // AppStateバックアップ
                 const backup = {
                     transcriptHistory: [...(window.AppState.transcriptHistory || [])],
                     currentTranscript: window.AppState.currentTranscript || ''
                 };
                 
                 try {
                     // テストデータ設定
                     window.AppState.transcriptHistory = [cleaned];
                     window.AppState.currentTranscript = cleaned;
                     window.SpeechCorrectionSystem.setCurrentInput(cleaned);
                     
                     // 削除実行
                     const deleteResult = await window.SpeechCorrectionSystem.deleteLastCharacters(deleteCount);
                     const finalText = window.SpeechCorrectionSystem.getCurrentInput();
                     
                     const deleteSuccess = deleteResult.success && finalText === expectedAfterDelete;
                     
                     this.recordTest(
                         'Voice Command Integration', 
                         `${testCase.name}_統合処理`, 
                         cleanSuccess && deleteSuccess, 
                         `入力:"${input}" → 除去:"${cleaned}"${cleanSuccess ? '✅' : '❌'} → 削除:"${finalText}"${deleteSuccess ? '✅' : '❌'} (期待値:"${expectedAfterDelete}")`
                     );
                     
                 } finally {
                     // AppState復元
                     window.AppState.transcriptHistory = backup.transcriptHistory;
                     window.AppState.currentTranscript = backup.currentTranscript;
                 }
             } else {
                 this.recordTest('Voice Command Integration', `${testCase.name}_連携テスト`, false, 'AppState または SpeechCorrectionSystem が利用不可');
             }
            
        } catch (error) {
            this.recordTest('Voice Command Integration', '連携テスト', false, `エラー: ${error.message}`);
        }
    },
    
    // =================================================================================
    // Phase 3: エッジケース・パフォーマンステスト
    // =================================================================================
    
    async testEdgeCases() {
        console.log('🧪 Phase 2: エッジケーステスト');
        
        const edgeCases = [
            {
                name: '空文字列処理',
                input: '',
                count: 3,
                expected: ''
            },
            {
                name: '削除文字数超過',
                input: '短い',
                count: 10,
                expected: ''
            },
            {
                name: '日本語・英語混合',
                input: 'Hello世界 5文字削除',
                count: 5,
                expected: 'Hello世界'
            },
            {
                name: '特殊文字含有',
                input: '!@#$%^&*() 3文字消して',
                count: 3,
                expected: '!@#$%^&*()'
            }
        ];
        
        for (const testCase of edgeCases) {
            await this.testEdgeCase(testCase);
        }
    },
    
    async testEdgeCase(testCase) {
        try {
            if (typeof window.removeVoiceCommand !== 'function') {
                this.recordTest('Edge Cases', testCase.name, false, 'removeVoiceCommand関数が利用不可');
                return;
            }
            
            const result = window.removeVoiceCommand(testCase.input, testCase.count);
            const success = result === testCase.expected;
            
            this.recordTest(
                'Edge Cases', 
                testCase.name, 
                success, 
                success ? 'エッジケース処理成功' : `期待値: "${testCase.expected}", 実際: "${result}"`
            );
            
        } catch (error) {
            this.recordTest('Edge Cases', testCase.name, false, `エラー: ${error.message}`);
        }
    },
    
    async testPerformance() {
        console.log('⚡ Phase 3: パフォーマンステスト');
        
        try {
            const testCount = 100;
            const testInput = 'パフォーマンステストデータです 5文字削除して';
            
            if (typeof window.removeVoiceCommand !== 'function') {
                this.recordTest('Performance', 'パフォーマンス測定', false, 'removeVoiceCommand関数が利用不可');
                return;
            }
            
            const startTime = performance.now();
            
            for (let i = 0; i < testCount; i++) {
                window.removeVoiceCommand(testInput, 5);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / testCount;
            
            // 要件: 平均処理時間 < 100ms (メモリより)
            const success = avgTime < 100;
            
            this.recordTest(
                'Performance', 
                'パフォーマンス測定', 
                success, 
                `${testCount}回実行: 平均${avgTime.toFixed(2)}ms (要件: <100ms)`
            );
            
        } catch (error) {
            this.recordTest('Performance', 'パフォーマンス測定', false, `エラー: ${error.message}`);
        }
    },
    
    // =================================================================================
    // テスト結果管理
    // =================================================================================
    
    recordTest(category, name, success, details) {
        const testResult = {
            category,
            name,
            success,
            details,
            timestamp: Date.now()
        };
        
        this.results.tests.push(testResult);
        this.results.summary.total++;
        
        if (success) {
            this.results.summary.passed++;
            console.log(`✅ ${category}: ${name} - ${details}`);
        } else {
            this.results.summary.failed++;
            console.log(`❌ ${category}: ${name} - ${details}`);
        }
    },
    
    generateSummary() {
        const duration = this.results.summary.endTime - this.results.summary.startTime;
        const successRate = Math.round((this.results.summary.passed / this.results.summary.total) * 100);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('🧪 **音声削除コマンド統合テスト結果**');
        console.log('='.repeat(60));
        console.log(`総テスト数: ${this.results.summary.total}`);
        console.log(`成功: ${this.results.summary.passed}`);
        console.log(`失敗: ${this.results.summary.failed}`);
        console.log(`成功率: ${successRate}%`);
        console.log(`実行時間: ${duration.toFixed(0)}ms`);
        console.log('');
        
        // カテゴリ別結果
        const categories = {};
        this.results.tests.forEach(test => {
            if (!categories[test.category]) {
                categories[test.category] = { total: 0, passed: 0 };
            }
            categories[test.category].total++;
            if (test.success) categories[test.category].passed++;
        });
        
        console.log('📊 **カテゴリ別結果**');
        Object.keys(categories).forEach(cat => {
            const rate = Math.round((categories[cat].passed / categories[cat].total) * 100);
            console.log(`  ${cat}: ${categories[cat].passed}/${categories[cat].total} (${rate}%)`);
        });
        
        console.log('');
        console.log(successRate >= 90 ? '🎉 テスト成功！修正が正常に動作しています' : '⚠️ テスト失敗が検出されました');
        console.log('='.repeat(60));
        
        // 失敗したテストの詳細表示
        const failedTests = this.results.tests.filter(test => !test.success);
        if (failedTests.length > 0) {
            console.log('❌ **失敗したテスト**');
            failedTests.forEach(test => {
                console.log(`  - ${test.category}: ${test.name} - ${test.details}`);
            });
            console.log('');
        }
    }
};

// グローバルアクセス用関数
window.runVoiceDeleteTest = () => VoiceDeleteIntegrationTest.runCompleteTest();
window.VoiceDeleteIntegrationTest = VoiceDeleteIntegrationTest;

console.log('🧪 音声削除コマンド統合テストシステム読み込み完了');
console.log('📝 使用方法:');
console.log('  - runVoiceDeleteTest() : 完全テスト実行');
console.log('  - VoiceDeleteIntegrationTest : 詳細制御用オブジェクト'); 