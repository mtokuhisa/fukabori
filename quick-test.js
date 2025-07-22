// 🔧 クイック修正テスト
function quickTest() {
    console.log('🧪 クイック修正テスト開始');
    
    // removeVoiceCommand関数のテスト
    if (typeof window.removeVoiceCommand === 'function') {
        console.log('✅ removeVoiceCommand関数が利用可能');
        
        const testCases = [
            {
                input: 'ありがとうございます 削除して 3文字削除して',
                count: 3,
                expected: 'ありがとうございます 削除して',
                expectedAfterDelete: 'ありがとうございます 削除'
            },
            {
                input: 'これはテストです 5文字削除',
                count: 5,
                expected: 'これはテストです',
                expectedAfterDelete: 'これは'
            },
            {
                input: 'ありがとうございますか 3文字削除して',
                count: 3,
                expected: 'ありがとうございますか',
                expectedAfterDelete: 'ありがとうござい'
            },
            {
                input: 'テストです 5文字 削除して',
                count: 5,
                expected: 'テストです',
                expectedAfterDelete: ''
            }
        ];
        
        testCases.forEach((test, index) => {
            const result = window.removeVoiceCommand(test.input, test.count);
            const cleanSuccess = result === test.expected;
            console.log(`テスト${index + 1}（音声コマンド除去）: ${cleanSuccess ? '✅' : '❌'}`);
            console.log(`  入力: "${test.input}"`);
            console.log(`  除去後期待: "${test.expected}"`);
            console.log(`  除去後実際: "${result}"`);
            
            // 削除処理もテスト
            if (cleanSuccess && test.expectedAfterDelete) {
                const afterDelete = result.slice(0, -test.count);
                const deleteSuccess = afterDelete === test.expectedAfterDelete;
                console.log(`  削除処理: ${deleteSuccess ? '✅' : '❌'}`);
                console.log(`  削除後期待: "${test.expectedAfterDelete}"`);
                console.log(`  削除後実際: "${afterDelete}"`);
            }
            console.log('');
        });
    } else {
        console.log('❌ removeVoiceCommand関数が見つかりません');
    }
}

window.quickTest = quickTest;
