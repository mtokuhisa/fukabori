/**
 * 深堀くん - 統合設定ファイル
 * 全ての設定情報を一元管理
 */

// 🔧 アプリ基本設定
window.FUKABORI_CONFIG = {
    app: {
        name: "深堀くん",
        version: "v0.7.6",
        mainFile: "深堀くん.html",
        launcherFile: "深堀くん.html",
        description: "AIインタビューアプリ - ねほりーの・はほりーのがあなたの知見を深掘り"
    },
    
    pages: {
        overview: "pages/overview.html",
        technical: "pages/technical.html", 
        changelog: "pages/changelog.html",
        screenshots: "pages/screenshots.html",
        faq: "pages/faq.html"
    },
    
    // 📊 統計情報
    stats: {
        totalLines: 5137,
        totalFeatures: 15,
        totalReleases: 9,
        developmentDays: 4,
        lastUpdate: "2025-07-26"
    },
    
    // 🎨 UI設定
    ui: {
        themes: ["white", "blue", "dark", "colorful"],
        defaultTheme: "blue",
        animations: true,
        glassEffect: true
    },
    
    // 🔗 リンク管理
    links: {
        backButtonClass: "back-button",
        versionDisplayClass: "version-display"
    },
    
    // 🎵 音声設定
    audio: {
        defaultVoice: "alloy",
        voices: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        speechRate: 1.0,
        autoPlay: false,
        // キャラクター別デフォルト設定
        characters: {
            nehori: {
                defaultVoice: "sage",
                defaultSpeed: 1.2,
                defaultVolume: 0.8
            },
            hahori: {
                defaultVoice: "nova", 
                defaultSpeed: 1.1,
                defaultVolume: 0.8
            }
        }
    },
    
    // 🤖 AI設定
    ai: {
        model: "gpt-4o-mini",
        maxTokens: 1000,
        temperature: 0.7,
        systemPromptFile: "config/prompts.txt"
    },
    
    // 💾 ストレージ設定
    storage: {
        sessionKey: "fukabori_session",
        settingsKey: "fukabori_settings",
        historyKey: "fukabori_history",
        maxHistoryItems: 100
    },
    
    // 🔒 セキュリティ設定
    security: {
        encryptApiKey: true,
        xorKey: "fukabori2024",
        validateInput: true
    },
    
    // 📱 レスポンシブ設定
    responsive: {
        mobileBreakpoint: 768,
        tabletBreakpoint: 1024
    },
    
    // 🚨 エラーハンドリング設定
    errorHandling: {
        maxHistorySize: 100,
        showUserNotifications: true,
        logToConsole: true,
        saveToHistory: true,
        enableDetailedLogging: true,
        notificationDuration: 5000
    },
    
    // 🧪 テスト設定
    testing: {
        enableTestMode: false,
        showTestResults: false,
        suppressConsoleInTests: true
    }
};

// 🔄 設定更新履歴
window.FUKABORI_CONFIG._history = [
    {
        version: "v0.6.5",
        date: "2025-06-23",
        changes: ["リファクタリング実装", "設定統合", "モジュール分離"]
    },
    {
        version: "v0.6.4", 
        date: "2025-06-23",
        changes: ["ナビゲーション機能追加", "更新履歴システム", "リンク管理"]
    }
];

// 📋 設定検証機能
window.FUKABORI_CONFIG.validate = function() {
    const required = [
        'app.name',
        'app.version',
        'app.mainFile',
        'pages.overview',
        'pages.technical',
        'pages.changelog',
        'pages.screenshots',
        'pages.faq'
    ];
    
    for (const path of required) {
        const value = path.split('.').reduce((obj, key) => obj?.[key], this);
        if (!value) {
            console.error(`❌ 必須設定項目が不足: ${path}`);
            return false;
        }
    }
    
    console.log('✅ 設定検証完了');
    return true;
};

// 🔄 設定更新機能
window.FUKABORI_CONFIG.update = function(path, value) {
    const keys = path.split('.');
    let obj = this;
    
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    console.log(`🔄 設定更新: ${path} = ${value}`);
};

// 🎯 設定取得機能
window.FUKABORI_CONFIG.get = function(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this);
};

// 🎵 音声設定の統合取得機能
window.FUKABORI_CONFIG.getVoiceConfig = function(character) {
    const defaultConfig = this.get(`audio.characters.${character}`);
    const customConfig = window.CUSTOM_VOICE_CONFIG?.[character];
    
    return {
        voice: customConfig?.voice || defaultConfig?.defaultVoice || this.get('audio.defaultVoice'),
        speed: customConfig?.speed || defaultConfig?.defaultSpeed || this.get('audio.speechRate'),
        volume: customConfig?.volume || defaultConfig?.defaultVolume || 0.8,
        prompt: customConfig?.prompt || ''
    };
};

// 初期化ログ
console.log('📋 深堀くん統合設定 v1.0 読み込み完了');
console.log('🔧 アプリバージョン:', window.FUKABORI_CONFIG.app.version);
console.log('📊 総行数:', window.FUKABORI_CONFIG.stats.totalLines.toLocaleString());

// 設定検証実行
window.FUKABORI_CONFIG.validate(); 