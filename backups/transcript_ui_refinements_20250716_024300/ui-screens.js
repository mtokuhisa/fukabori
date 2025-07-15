// =================================================================================
// UI SCREENS MANAGER - 画面遷移管理システム
// =================================================================================
// 
// 🔧 リファクタリング Phase 3A: 画面遷移関数の分離
// 分離元: app/script.js (50行)
// 分離先: app/ui-screens.js (新規作成)
// 
// 【分離対象関数】
// - showLoginScreen() - ログイン画面表示
// - hideLoginScreen() - ログイン画面非表示
// - showMainScreen() - メイン画面表示
// - hideMainScreen() - メイン画面非表示
// 
// =================================================================================

/**
 * ログイン画面を表示
 */
function showLoginScreen() {
    const setupPanel = window.UIManager.DOMUtils.get('setupPanel');
    if (setupPanel) {
        setupPanel.classList.remove('hidden');
        console.log('✅ ログイン画面を表示');
    }
}

/**
 * ログイン画面を非表示
 */
function hideLoginScreen() {
    const setupPanel = window.UIManager.DOMUtils.get('setupPanel');
    if (setupPanel) {
        setupPanel.classList.add('hidden');
        console.log('✅ ログイン画面を非表示');
    }
}

/**
 * メイン画面を表示
 */
function showMainScreen() {
    const chatArea = window.UIManager.DOMUtils.get('chatArea');
    if (chatArea) {
        chatArea.classList.remove('hidden');
        console.log('✅ メイン画面を表示');
    }
}

/**
 * メイン画面を非表示
 */
function hideMainScreen() {
    const chatArea = window.UIManager.DOMUtils.get('chatArea');
    if (chatArea) {
        chatArea.classList.add('hidden');
        console.log('✅ メイン画面を非表示');
    }
}

// =================================================================================
// UI SCREENS OBJECT - UIScreensオブジェクト
// =================================================================================

const UIScreens = {
    // ログイン画面制御
    login: {
        show: showLoginScreen,
        hide: hideLoginScreen
    },
    
    // メイン画面制御
    main: {
        show: showMainScreen,
        hide: hideMainScreen
    }
};

// =================================================================================
// WINDOW EXPORTS - Window経由での公開
// =================================================================================

// 個別関数の公開
window.showLoginScreen = showLoginScreen;
window.hideLoginScreen = hideLoginScreen;
window.showMainScreen = showMainScreen;
window.hideMainScreen = hideMainScreen;

// UIScreensオブジェクトの公開
window.UIScreens = UIScreens;

console.log('✅ UIScreens読み込み完了 - 画面遷移管理システム');
console.log('📦 UIScreens: 4個の関数とUIScreensオブジェクトをwindow経由で公開'); 