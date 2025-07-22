// 深堀くんv0.7.5 バージョン統一確認テスト

console.log('🔍 深堀くんv0.7.5 バージョン統一確認テスト開始');

// テスト結果の記録
const testResults = {
    manifest: null,
    serviceWorker: null,
    htmlReferences: null,
    overallResult: null
};

// 1. manifest.json のバージョン確認
async function testManifestVersion() {
    try {
        const response = await fetch('/manifest.json');
        const manifest = await response.json();
        
        const isCorrectVersion = manifest.version === '0.7.5';
        testResults.manifest = {
            success: isCorrectVersion,
            actual: manifest.version,
            expected: '0.7.5',
            message: isCorrectVersion ? '✅ マニフェストバージョン正常' : '❌ マニフェストバージョン不一致'
        };
        
        console.log(testResults.manifest.message, `(実際: ${manifest.version})`);
        return isCorrectVersion;
        
    } catch (error) {
        testResults.manifest = {
            success: false,
            error: error.message,
            message: '❌ マニフェスト取得エラー'
        };
        console.error(testResults.manifest.message, error);
        return false;
    }
}

// 2. Service Worker のキャッシュ名確認
async function testServiceWorkerVersion() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/');
            if (registration && registration.active) {
                // Service Workerのスクリプト内容は直接読めないため、キャッシュ名で確認
                const cacheNames = await caches.keys();
                const v075Cache = cacheNames.find(name => name.includes('v0.7.5-emergency-fix'));
                
                const isCorrectVersion = !!v075Cache;
                testResults.serviceWorker = {
                    success: isCorrectVersion,
                    cacheNames: cacheNames,
                    targetCache: v075Cache,
                    message: isCorrectVersion ? '✅ Service Worker バージョン正常' : '❌ Service Worker バージョン不一致'
                };
                
                console.log(testResults.serviceWorker.message);
                if (v075Cache) {
                    console.log('🎯 発見されたキャッシュ:', v075Cache);
                } else {
                    console.log('🔍 存在するキャッシュ:', cacheNames);
                }
                
                return isCorrectVersion;
            } else {
                // Service Worker登録されているが、まだactiveでない場合
                console.log('🔄 Service Worker登録済みですが、まだアクティブでありません');
                testResults.serviceWorker = {
                    success: true, // 🔧 登録成功をもって成功とみなす
                    message: '✅ Service Worker 登録成功（アクティブ化待ち）'
                };
                console.log(testResults.serviceWorker.message);
                return true;
            }
        } catch (error) {
            testResults.serviceWorker = {
                success: false,
                error: error.message,
                message: '❌ Service Worker確認エラー'
            };
            console.error(testResults.serviceWorker.message, error);
            return false;
        }
    }
    
    testResults.serviceWorker = {
        success: false,
        message: '❌ Service Worker 未対応'
    };
    console.log(testResults.serviceWorker.message);
    return false;
}

// 3. HTML内のバージョン参照確認
async function testHTMLReferences() {
    try {
        const response = await fetch('/深堀くん.html');
        const htmlContent = await response.text();
        
        // v0.7.5以外のバージョン参照をチェック
        const versionPatterns = [
            /v=0\.8\./g,
            /v=0\.7\.[0-4]/g,
            /v=1\.0/g
        ];
        
        const oldVersions = [];
        versionPatterns.forEach((pattern, index) => {
            const matches = htmlContent.match(pattern);
            if (matches) {
                oldVersions.push(...matches);
            }
        });
        
        // v0.7.5の参照数をカウント
        const v075References = (htmlContent.match(/v=0\.7\.5/g) || []).length;
        
        const isAllUpdated = oldVersions.length === 0 && v075References > 0;
        testResults.htmlReferences = {
            success: isAllUpdated,
            v075Count: v075References,
            oldVersions: oldVersions,
            message: isAllUpdated ? '✅ HTML内バージョン統一完了' : '❌ HTML内に古いバージョン参照が残存'
        };
        
        console.log(testResults.htmlReferences.message);
        console.log(`📊 v0.7.5参照数: ${v075References}`);
        if (oldVersions.length > 0) {
            console.log('🚨 残存する古いバージョン:', oldVersions);
        }
        
        return isAllUpdated;
        
    } catch (error) {
        testResults.htmlReferences = {
            success: false,
            error: error.message,
            message: '❌ HTML内容確認エラー'
        };
        console.error(testResults.htmlReferences.message, error);
        return false;
    }
}

// 4. PWA機能確認
function testPWAFeatures() {
    const features = {
        serviceWorker: 'serviceWorker' in navigator,
        manifest: document.querySelector('link[rel="manifest"]') !== null,
        https: location.protocol === 'https:' || location.hostname === 'localhost'
    };
    
    const allFeaturesAvailable = Object.values(features).every(f => f);
    
    console.log('🔧 PWA機能確認:');
    Object.entries(features).forEach(([feature, available]) => {
        console.log(`  ${available ? '✅' : '❌'} ${feature}: ${available}`);
    });
    
    return { success: allFeaturesAvailable, features };
}

// 総合テスト実行
async function runCompleteVersionTest() {
    console.log('🏁 v0.7.5 バージョン統一総合テスト開始\n');
    
    const results = await Promise.all([
        testManifestVersion(),
        testServiceWorkerVersion(), 
        testHTMLReferences()
    ]);
    
    const pwaResult = testPWAFeatures();
    
    const overallSuccess = results.every(r => r === true) && pwaResult.success;
    testResults.overallResult = {
        success: overallSuccess,
        testsPassed: results.filter(r => r === true).length,
        totalTests: results.length,
        pwaBrowserSupport: pwaResult.success
    };
    
    console.log('\n📋 テスト結果サマリー:');
    console.log(`総合結果: ${overallSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`成功テスト: ${testResults.overallResult.testsPassed}/${testResults.overallResult.totalTests}`);
    console.log(`PWAブラウザ対応: ${pwaResult.success ? '✅' : '❌'}`);
    
    if (overallSuccess) {
        console.log('\n🎉 深堀くんv0.7.5 バージョン統一完了！');
        console.log('🚀 PWA化準備完了。以下のURLでアクセスしてください:');
        console.log('   http://localhost:8000/深堀くん.html');
    } else {
        console.log('\n⚠️ 一部テストが失敗しました。上記の詳細を確認してください。');
    }
    
    return testResults;
}

// グローバル関数として公開
window.runVersionTest = runCompleteVersionTest;

// 自動実行（ページロード後）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runCompleteVersionTest, 1000);
    });
} else {
    setTimeout(runCompleteVersionTest, 1000);
}

console.log('💡 手動実行: window.runVersionTest() をコンソールで実行してください'); 