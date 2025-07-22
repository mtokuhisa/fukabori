/**
 * 削除処理修正テスト - 2025/07/21 (置き換え処理版)
 * 
 * 「5文字削除」バグ修正の動作確認 + 音声コマンド除去テスト
 */

// テストケース定義（置き換え処理対応）
const testCases = [
    {
        name: '数値削除（優先）',
        input: '5文字削除',
        expected: 'delete_characters',
        priority: 1
    },
    {
        name: '数値削除（大量・確認付き）',
        input: '35文字削除',
        expected: 'delete_characters + confirmation',
        priority: 1
    },
    {
        name: '全削除（確認付き）',
        input: '削除',
        expected: 'clear_all + confirmation',
        priority: 2
    },
    {
        name: '全削除（クリア）',
        input: 'クリア',
        expected: 'clear_all + confirmation',
        priority: 2
    },
    {
        name: '通常会話（保護）',
        input: 'この資料を削除してください',
        expected: 'normal（誤動作なし）',
        priority: 3
    },
    {
        name: '通常会話（保護）',
        input: '画面をクリアにして',
        expected: 'normal（誤動作なし）',
        priority: 3
    }
];

// 🆕 置き換え処理テストケース
const replacementTestCases = [
    {
        name: '音声コマンド置き換え：3文字削除',
        originalInput: 'ありがとうございます 削除して 3文字削除して',
        expectedResult: 'ありがとうございます 削',
        commandCount: 3,
        description: '音声コマンド部分を除去して正確に3文字削除'
    },
    {
        name: '音声コマンド置き換え：5文字削除',
        originalInput: 'これはテストです 5文字削除',
        expectedResult: 'これはテス',
        commandCount: 5,
        description: '末尾の音声コマンドを除去して5文字削除'
    },
    {
        name: '音声コマンド置き換え：最後の2文字削除',
        originalInput: 'サンプル文章 最後の2文字削除',
        expectedResult: 'サンプル文',
        commandCount: 2,
        description: '「最後の」形式のコマンド除去'
    }
];

// テスト実行関数
function runDeleteFixTest() {
    console.group('🧪 削除処理修正テスト');
    
    if (!window.SpeechCorrectionSystem) {
        console.error('❌ SpeechCorrectionSystem が見つかりません');
        return;
    }
    
    const results = [];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n🔍 テスト ${index + 1}: ${testCase.name}`);
        console.log(`   入力: "${testCase.input}"`);
        
        try {
            const result = window.SpeechCorrectionSystem.detectCorrectionCommand(testCase.input);
            
            let actual = 'normal';
            if (result.type === 'deletion') {
                if (result.action === 'delete_characters') {
                    actual = result.requiresConfirmation ? 
                        'delete_characters + confirmation' : 
                        'delete_characters';
                } else if (result.action === 'clear_all') {
                    actual = result.requiresConfirmation ? 
                        'clear_all + confirmation' : 
                        'clear_all';
                }
            }
            
            const success = actual === testCase.expected || 
                           (testCase.expected.includes('normal') && actual === 'normal');
            
            results.push({
                test: testCase.name,
                input: testCase.input,
                expected: testCase.expected,
                actual: actual,
                success: success ? '✅' : '❌',
                priority: testCase.priority
            });
            
            console.log(`   期待: ${testCase.expected}`);
            console.log(`   実際: ${actual}`);
            console.log(`   結果: ${success ? '✅ 成功' : '❌ 失敗'}`);
            
        } catch (error) {
            results.push({
                test: testCase.name,
                input: testCase.input,
                expected: testCase.expected,
                actual: `エラー: ${error.message}`,
                success: '❌',
                priority: testCase.priority
            });
            console.error(`   ❌ エラー: ${error.message}`);
        }
    });
    
    console.log('\n📊 テスト結果サマリー:');
    console.table(results);
    
    const successCount = results.filter(r => r.success === '✅').length;
    const totalCount = results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log(`\n🎯 成功率: ${successCount}/${totalCount} (${successRate}%)`);
    
    if (successRate >= 90) {
        console.log('🎉 削除処理修正テスト合格！');
    } else {
        console.log('⚠️ 一部テストに問題があります');
    }
    
    console.groupEnd();
    
    return {
        results: results,
        successCount: successCount,
        totalCount: totalCount,
        successRate: successRate
    };
}

// 🆕 置き換え処理テスト
function runReplacementTest() {
    console.group('🔄 置き換え処理テスト');
    
    if (!window.SpeechCorrectionSystem) {
        console.error('❌ SpeechCorrectionSystem が見つかりません');
        return;
    }
    
    const results = [];
    
    replacementTestCases.forEach((testCase, index) => {
        console.log(`\n🔍 置き換えテスト ${index + 1}: ${testCase.name}`);
        console.log(`   元入力: "${testCase.originalInput}"`);
        console.log(`   期待結果: "${testCase.expectedResult}"`);
        
        try {
            // SpeechCorrectionSystemに元入力を設定
            window.SpeechCorrectionSystem.setCurrentInput(testCase.originalInput);
            
            // 削除処理実行
            const result = window.SpeechCorrectionSystem.deleteLastCharacters(testCase.commandCount);
            
            // 結果取得
            const actualResult = window.SpeechCorrectionSystem.getCurrentInput();
            
            const success = actualResult === testCase.expectedResult;
            
            results.push({
                test: testCase.name,
                originalInput: testCase.originalInput,
                expectedResult: testCase.expectedResult,
                actualResult: actualResult,
                success: success ? '✅' : '❌',
                description: testCase.description
            });
            
            console.log(`   実際結果: "${actualResult}"`);
            console.log(`   結果: ${success ? '✅ 成功' : '❌ 失敗'}`);
            
        } catch (error) {
            results.push({
                test: testCase.name,
                originalInput: testCase.originalInput,
                expectedResult: testCase.expectedResult,
                actualResult: `エラー: ${error.message}`,
                success: '❌',
                description: testCase.description
            });
            console.error(`   ❌ エラー: ${error.message}`);
        }
    });
    
    console.log('\n📊 置き換え処理結果サマリー:');
    console.table(results);
    
    const successCount = results.filter(r => r.success === '✅').length;
    const totalCount = results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log(`\n🎯 置き換え処理成功率: ${successCount}/${totalCount} (${successRate}%)`);
    
    if (successRate >= 90) {
        console.log('🎉 置き換え処理テスト合格！');
    } else {
        console.log('⚠️ 置き換え処理に問題があります');
    }
    
    console.groupEnd();
    
    return {
        results: results,
        successCount: successCount,
        totalCount: totalCount,
        successRate: successRate
    };
}

// 優先順位テスト
function testDeletePriority() {
    console.group('🎯 削除コマンド優先順位テスト');
    
    const priorityTests = [
        {
            input: '5文字削除して、残りは削除しないで',
            description: '複合コマンドでの数値削除優先度確認'
        }
    ];
    
    priorityTests.forEach(test => {
        console.log(`🔍 ${test.description}`);
        console.log(`   入力: "${test.input}"`);
        
        const result = window.SpeechCorrectionSystem.detectCorrectionCommand(test.input);
        console.log(`   検出結果:`, result);
    });
    
    console.groupEnd();
}

// ブラウザでの実行
if (typeof window !== 'undefined') {
    window.runDeleteFixTest = runDeleteFixTest;
    window.runReplacementTest = runReplacementTest;
    window.testDeletePriority = testDeletePriority;
    console.log('🔧 削除処理テスト関数が利用可能になりました');
    console.log('   - runDeleteFixTest(): 基本テスト実行');
    console.log('   - runReplacementTest(): 置き換え処理テスト実行');
    console.log('   - testDeletePriority(): 優先順位テスト実行');
}

// Node.js環境での実行
if (typeof module !== 'undefined') {
    module.exports = { runDeleteFixTest, runReplacementTest, testDeletePriority };
} 
// 🆕 音声コマンド除去テスト
function runVoiceCommandRemovalTest() {
    console.group('🎯 音声コマンド除去テスト');
    
    if (typeof removeVoiceCommand !== 'function') {
        console.error('❌ removeVoiceCommand 関数が見つかりません');
        return;
    }
    
    const testCases = [
        {
            input: 'ありがとうございます 削除して 3文字削除して',
            expectedCount: 3,
            expectedResult: 'ありがとうございます 削除して',
            description: '3文字削除コマンドの除去'
        },
        {
            input: 'これはテストです 5文字削除',
            expectedCount: 5,
            expectedResult: 'これはテストです',
            description: '5文字削除コマンドの除去'
        },
        {
            input: 'サンプル文章 最後の2文字削除',
            expectedCount: 2,
            expectedResult: 'サンプル文章',
            description: '最後のN文字削除コマンドの除去'
        },
        {
            input: 'コマンドがない普通の文章',
            expectedCount: 3,
            expectedResult: 'コマンドがない普通の文章',
            description: 'コマンドがない場合はそのまま'
        }
    ];
    
    const results = [];
    
    testCases.forEach((testCase, index) => {
        console.log(`\n🔍 テスト ${index + 1}: ${testCase.description}`);
        console.log(`   入力: "${testCase.input}"`);
        console.log(`   期待: "${testCase.expectedResult}"`);
        
        try {
            const result = removeVoiceCommand(testCase.input, testCase.expectedCount);
            const success = result === testCase.expectedResult;
            
            results.push({
                test: testCase.description,
                input: testCase.input,
                expected: testCase.expectedResult,
                actual: result,
                success: success ? '✅' : '❌'
            });
            
            console.log(`   実際: "${result}"`);
            console.log(`   結果: ${success ? '✅ 成功' : '❌ 失敗'}`);
            
        } catch (error) {
            results.push({
                test: testCase.description,
                input: testCase.input,
                expected: testCase.expectedResult,
                actual: `エラー: ${error.message}`,
                success: '❌'
            });
            console.error(`   ❌ エラー: ${error.message}`);
        }
    });
    
    console.log('\n📊 音声コマンド除去テスト結果:');
    console.table(results);
    
    const successCount = results.filter(r => r.success === '✅').length;
    const totalCount = results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log(`\n🎯 成功率: ${successCount}/${totalCount} (${successRate}%)`);
    
    if (successRate >= 90) {
        console.log('🎉 音声コマンド除去テスト合格！');
    } else {
        console.log('⚠️ 音声コマンド除去に問題があります');
    }
    
    console.groupEnd();
    
    return {
        results: results,
        successCount: successCount,
        totalCount: totalCount,
        successRate: successRate
    };
}

// ブラウザでの実行関数を更新
if (typeof window !== 'undefined') {
    window.runVoiceCommandRemovalTest = runVoiceCommandRemovalTest;
    console.log('   - runVoiceCommandRemovalTest(): 音声コマンド除去テスト実行');
}
