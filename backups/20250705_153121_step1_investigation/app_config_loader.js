/**
 * 深堀くん - アプリ設定読み込み・リンク管理システム
 * fukabori_dev_rules.mdから設定を読み込み、全ページのリンクを自動更新
 */

// 🔧 設定読み込み機能
function loadConfigFromJS() {
    try {
        console.log('📋 設定データ読み込み開始...');
        
        if (window.FUKABORI_CONFIG) {
            const config = window.FUKABORI_CONFIG;
            
            // 設定検証
            validateConfig(config);
            
            console.log('✅ 設定データ読み込み完了:', config.app.version);
            return config;
        } else {
            throw new Error('FUKABORI_CONFIG が見つかりません');
        }
        
    } catch (error) {
        console.warn('⚠️ 設定データ読み込みエラー:', error);
        
        // フォールバック設定
        const fallbackConfig = {
            app: {
                name: "深堀くん",
                version: "v0.6.5",
                mainFile: "深堀くん.html"
            },
            pages: {
                overview: "pages/overview.html",
                technical: "pages/technical.html",
                changelog: "pages/changelog.html",
                screenshots: "pages/screenshots.html",
                faq: "pages/faq.html"
            },
            stats: {
                totalLines: 5119,
                totalFeatures: 15,
                totalReleases: 8
            },
            links: {
                backButtonClass: "back-button",
                versionDisplayClass: "version-display"
            }
        };
        
        console.log('⚠️ フォールバック設定を使用:', fallbackConfig.app.version);
        return fallbackConfig;
    }
}

// 🔍 設定検証機能
function validateConfig(config) {
    const requiredPaths = [
        'app.name',
        'app.version', 
        'app.mainFile',
        'pages.overview',
        'pages.technical',
        'pages.changelog',
        'pages.screenshots',
        'pages.faq'
    ];
    
    for (const path of requiredPaths) {
        if (!getNestedValue(config, path)) {
            throw new Error(`必須設定項目が不足: ${path}`);
        }
    }
    
    // バージョン形式チェック
    if (!/^v\d+\.\d+\.\d+$/.test(config.app.version)) {
        console.warn('⚠️ バージョン形式が標準と異なります:', config.app.version);
    }
}

// 🔗 リンク更新機能
function updateAllLinks() {
    try {
        const config = loadConfigFromJS();
        
        // 戻るボタンの更新
        updateBackButtons(config);
        
        // バージョン表示の更新
        updateVersionDisplays(config);
        
        // ナビゲーションボタンの更新
        updateNavigationButtons(config);
        
        // 統計情報の更新
        updateStatistics(config);
        
        console.log('✅ 全リンク更新完了');
        
    } catch (error) {
        console.error('❌ リンク更新エラー:', error);
    }
}

// 🔙 戻るボタン更新
function updateBackButtons(config) {
    const backButtons = document.querySelectorAll(`.${config.links.backButtonClass}`);
    backButtons.forEach(button => {
        // 現在のパスを確認してmainFileの相対パス調整
        const mainFilePath = getCorrectMainFilePath(config.app.mainFile);
        
        if (button.tagName === 'A') {
            button.href = mainFilePath;
        } else {
            button.onclick = () => window.location.href = mainFilePath;
        }
    });
    
    if (backButtons.length > 0) {
        console.log(`🔙 戻るボタン更新: ${backButtons.length}個`);
    }
}

// 📍 正しいmainFileパスを取得
function getCorrectMainFilePath(mainFile) {
    // 現在のパスがpagesフォルダ内かチェック
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes('/pages/') || currentPath.endsWith('.html') && document.querySelector('title')?.textContent?.includes('深堀くん');
    
    // pagesフォルダ内の場合は相対パスで一つ上のフォルダを指定
    if (isInPagesFolder && !mainFile.startsWith('../')) {
        return '../' + mainFile;
    }
    
    return mainFile;
}

// 📊 バージョン表示更新
function updateVersionDisplays(config) {
    const versionElements = document.querySelectorAll(`.${config.links.versionDisplayClass}`);
    versionElements.forEach(element => {
        if (element.textContent.includes('現在のバージョン')) {
            element.textContent = `現在のバージョン: ${config.app.version}`;
        } else {
            element.textContent = config.app.version;
        }
    });
    
    // 現在のバージョン表示（ID指定）
    const currentVersionElement = document.getElementById('currentVersion');
    if (currentVersionElement) {
        currentVersionElement.textContent = `現在のバージョン: ${config.app.version}`;
    }
    
    if (versionElements.length > 0) {
        console.log(`📊 バージョン表示更新: ${versionElements.length}個`);
    }
}

// 🧭 ナビゲーションボタン更新
function updateNavigationButtons(config) {
    // 概要ページへのリンク
    const overviewButtons = document.querySelectorAll('[data-page="overview"]');
    overviewButtons.forEach(button => {
        const pagePath = getCorrectPagePath(config.pages.overview);
        button.onclick = () => window.location.href = pagePath;
    });
    
    // 技術仕様ページへのリンク
    const technicalButtons = document.querySelectorAll('[data-page="technical"]');
    technicalButtons.forEach(button => {
        const pagePath = getCorrectPagePath(config.pages.technical);
        button.onclick = () => window.location.href = pagePath;
    });
    
    // 更新履歴ページへのリンク
    const changelogButtons = document.querySelectorAll('[data-page="changelog"]');
    changelogButtons.forEach(button => {
        const pagePath = getCorrectPagePath(config.pages.changelog);
        button.onclick = () => window.location.href = pagePath;
    });
    
    // 画面説明ページへのリンク
    const screenshotsButtons = document.querySelectorAll('[data-page="screenshots"]');
    screenshotsButtons.forEach(button => {
        const pagePath = getCorrectPagePath(config.pages.screenshots);
        button.onclick = () => window.location.href = pagePath;
    });
    
    // FAQページへのリンク
    const faqButtons = document.querySelectorAll('[data-page="faq"]');
    faqButtons.forEach(button => {
        const pagePath = getCorrectPagePath(config.pages.faq);
        button.onclick = () => window.location.href = pagePath;
    });
    
    const totalButtons = overviewButtons.length + technicalButtons.length + changelogButtons.length + screenshotsButtons.length + faqButtons.length;
    if (totalButtons > 0) {
        console.log(`🧭 ナビゲーションボタン更新: ${totalButtons}個`);
    }
}

// 📄 正しいページパスを取得
function getCorrectPagePath(pagePath) {
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes('/pages/');
    const isMainPage = currentPath.includes('深堀くん.html') || currentPath === '/' || !currentPath.includes('/pages/');
    
    // メインページから他のページへ（pages/xxx.html）
    if (isMainPage && !pagePath.startsWith('pages/')) {
        return 'pages/' + pagePath;
    }
    
    // pagesフォルダ内から同じフォルダ内のページへ（xxx.html）
    if (isInPagesFolder && pagePath.startsWith('pages/')) {
        return pagePath.replace('pages/', '');
    }
    
    return pagePath;
}

// 📈 統計情報更新
function updateStatistics(config) {
    if (!config.stats) return;
    
    // 統計値の更新
    const statElements = document.querySelectorAll('.stat-number');
    statElements.forEach(element => {
        const label = element.nextElementSibling?.textContent;
        if (label?.includes('リリース回数')) {
            element.textContent = config.stats.totalReleases;
        } else if (label?.includes('総コード行数')) {
            element.textContent = config.stats.totalLines.toLocaleString();
        } else if (label?.includes('主要機能')) {
            element.textContent = `${config.stats.totalFeatures}+`;
        }
    });
    
    console.log('📈 統計情報更新完了');
}

// 🛠️ ユーティリティ関数
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 🔄 設定更新通知
function notifyConfigUpdate(newVersion) {
    console.log(`🔄 設定更新通知: ${newVersion}`);
    
    // 必要に応じて画面に通知表示
    const notification = document.createElement('div');
    notification.textContent = `設定が更新されました: ${newVersion}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-family: 'Segoe UI', sans-serif;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 🚀 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 アプリ設定読み込みシステム開始');
    updateAllLinks();
    
    // 🎯 知見評価システムの初期化
    if (typeof loadKnowledgeSettings === 'function') {
        loadKnowledgeSettings();
        console.log('✅ 知見設定読み込み完了');
        
        // 知見設定表示を更新
        if (typeof updateKnowledgeSettingsDisplay === 'function') {
            updateKnowledgeSettingsDisplay();
            console.log('✅ 知見設定表示更新完了');
        }
    }
});

// 🔧 開発者向けAPI
window.fukaboriConfig = {
    reload: loadConfigFromJS,
    updateLinks: updateAllLinks,
    version: '1.0.0'
};

console.log('📋 app_config_loader.js v1.0.0 読み込み完了'); 