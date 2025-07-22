// =================================================================================
// STORAGE MANAGER - LocalStorage操作関数集約
// =================================================================================
// 
// Phase 2: LocalStorage操作関数の分離
// 分離元: app/script.js (約120行)
// 分離日: 2025年7月5日
// 
// 【分離対象関数】
// - APIキー管理: saveEncryptedApiKey, loadEncryptedApiKey, clearSavedApiKey
// - パスワード管理: updatePasswordHashList, getPasswordHashList, hasApiKeyForPassword
// - ログイン状態: saveLoginState, loadLoginState, clearLoginState
// - テーマ状態: saveThemeInputState, loadThemeInputState, clearThemeInputState
// - 知見設定: saveKnowledgeSettings, loadKnowledgeSettings
// - その他: getSavedApiKeyCount, loadSavedTheme
// 
// =================================================================================

// 🔄 暗号化方式の後方互換性対応
// 旧XOR暗号化 → 新AES暗号化の段階的移行

// 旧XOR暗号化関数（後方互換性のため保持）
function legacyEncryptApiKey(apiKey, password) {
    let encrypted = '';
    for (let i = 0; i < apiKey.length; i++) {
        encrypted += String.fromCharCode(
            apiKey.charCodeAt(i) ^ 
            password.charCodeAt(i % password.length)
        );
    }
    return btoa(encrypted);
}

function legacyDecryptApiKey(encryptedApiKey, password) {
    try {
        const decoded = atob(encryptedApiKey);
        let decrypted = '';
        for (let i = 0; i < decoded.length; i++) {
            decrypted += String.fromCharCode(
                decoded.charCodeAt(i) ^ 
                password.charCodeAt(i % password.length)
            );
        }
        return decrypted;
    } catch (error) {
        throw new Error('旧形式の暗号化データの復号に失敗');
    }
}

// 新AES暗号化関数
function encryptApiKey(apiKey, password) {
    if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJSライブラリが読み込まれていません');
    }
    const key = CryptoJS.PBKDF2(password, 'fukabori-salt', {
        keySize: 256/32,
        iterations: 1000
    });
    const encrypted = CryptoJS.AES.encrypt(apiKey, key.toString());
    return encrypted.toString();
}

function decryptApiKey(encryptedApiKey, password) {
    if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJSライブラリが読み込まれていません');
    }
    
    // 🔄 後方互換性: 旧XOR暗号化データかどうかを判定
    if (isLegacyEncryptedData(encryptedApiKey)) {
        console.log('🔄 旧XOR暗号化データを検出 - 旧方式で復号します');
        return legacyDecryptApiKey(encryptedApiKey, password);
    }
    
    // 新AES暗号化データの復号
    const key = CryptoJS.PBKDF2(password, 'fukabori-salt', {
        keySize: 256/32,
        iterations: 1000
    });
    const decrypted = CryptoJS.AES.decrypt(encryptedApiKey, key.toString());
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// 暗号化データの形式判定
function isLegacyEncryptedData(encryptedData) {
    // 旧XOR暗号化: Base64エンコードされた短いデータ
    // 新AES暗号化: CryptoJS形式の長いデータ（U2FsdGVkX1...で始まる）
    
    if (!encryptedData || typeof encryptedData !== 'string') {
        return false;
    }
    
    // CryptoJS AES暗号化の特徴的な開始パターン
    if (encryptedData.startsWith('U2FsdGVkX1')) {
        return false; // 新AES暗号化
    }
    
    // Base64パターンで短い場合は旧XOR暗号化の可能性
    try {
        const decoded = atob(encryptedData);
        // 旧XOR暗号化は通常50-100文字程度
        if (decoded.length < 200) {
            return true; // 旧XOR暗号化
        }
    } catch (error) {
        // Base64デコードに失敗した場合は新AES暗号化
        return false;
    }
    
    return false; // デフォルトは新AES暗号化
}

// =================================================================================
// API KEY MANAGEMENT - APIキー管理
// =================================================================================

/**
 * APIキーを暗号化してLocalStorageに保存
 * @param {string} apiKey - 保存するAPIキー
 * @param {string} password - 暗号化用パスワード
 */
function saveEncryptedApiKey(apiKey, password) {
    const encrypted = encryptApiKey(apiKey, password);
    const passwordHash = window.hashPassword(password);
    const keyId = `fukabori_encrypted_key_${passwordHash}`;
    const timestampId = `fukabori_key_timestamp_${passwordHash}`;
    
    localStorage.setItem(keyId, encrypted);
    localStorage.setItem(timestampId, Date.now().toString());
    
    updatePasswordHashList(passwordHash);
    console.log(`✅ APIキーを保存しました (パスワードID: ${passwordHash}, 新AES暗号化)`);
}

/**
 * 暗号化されたAPIキーをLocalStorageから読み込み（後方互換性対応）
 * @param {string} password - 復号化用パスワード
 * @returns {string} 復号化されたAPIキー
 */
function loadEncryptedApiKey(password) {
    const passwordHash = window.hashPassword(password);
    const keyId = `fukabori_encrypted_key_${passwordHash}`;
    const encrypted = localStorage.getItem(keyId);
    
    if (!encrypted) {
        throw new Error(`このパスワードに対応するAPIキーが保存されていません (ID: ${passwordHash})`);
    }
    
    console.log(`✅ APIキーを読み込みました (パスワードID: ${passwordHash})`);
    
    try {
        const decrypted = decryptApiKey(encrypted, password);
        
        // 🔄 旧暗号化データの場合は新暗号化で再保存
        if (isLegacyEncryptedData(encrypted)) {
            console.log('🔄 旧暗号化データを新暗号化で再保存します');
            saveEncryptedApiKey(decrypted, password);
        }
        
        return decrypted;
    } catch (error) {
        console.error('❌ APIキー復号エラー:', error);
        throw new Error(`APIキーの復号に失敗しました: ${error.message}`);
    }
}

/**
 * 指定されたパスワードのAPIキーを削除
 * @param {string} password - 削除対象のパスワード
 */
function clearSavedApiKey(password = null) {
    if (password) {
        const passwordHash = window.hashPassword(password);
        const keyId = `fukabori_encrypted_key_${passwordHash}`;
        const timestampId = `fukabori_key_timestamp_${passwordHash}`;
        
        localStorage.removeItem(keyId);
        localStorage.removeItem(timestampId);
        
        console.log(`🗑️ APIキーを削除しました (パスワードID: ${passwordHash})`);
    }
}

// =================================================================================
// PASSWORD MANAGEMENT - パスワード管理
// =================================================================================

/**
 * パスワードハッシュリストを更新
 * @param {string} passwordHash - 追加するパスワードハッシュ
 */
function updatePasswordHashList(passwordHash) {
    const hashes = getPasswordHashList();
    if (!hashes.includes(passwordHash)) {
        hashes.push(passwordHash);
        localStorage.setItem('fukabori_password_hashes', JSON.stringify(hashes));
    }
}

/**
 * 保存されているパスワードハッシュリストを取得
 * @returns {string[]} パスワードハッシュの配列
 */
function getPasswordHashList() {
    const saved = localStorage.getItem('fukabori_password_hashes');
    return saved ? JSON.parse(saved) : [];
}

/**
 * 指定されたパスワードに対応するAPIキーが存在するかチェック
 * @param {string} password - チェックするパスワード
 * @returns {boolean} APIキーが存在するかどうか
 */
function hasApiKeyForPassword(password) {
    const passwordHash = window.hashPassword(password);
    const keyId = `fukabori_encrypted_key_${passwordHash}`;
    return !!localStorage.getItem(keyId);
}

/**
 * 保存されているAPIキーの数を取得
 * @returns {number} 保存されているAPIキーの数
 */
function getSavedApiKeyCount() {
    return getPasswordHashList().length;
}

// =================================================================================
// LOGIN STATE MANAGEMENT - ログイン状態管理
// =================================================================================

/**
 * ログイン状態を保存
 * @param {boolean} isLoggedIn - ログイン状態
 */
function saveLoginState(isLoggedIn) {
    try {
        localStorage.setItem('fukabori_login_state', isLoggedIn.toString());
        console.log(`✅ ログイン状態を保存: ${isLoggedIn}`);
    } catch (error) {
        console.error('❌ ログイン状態保存エラー:', error);
    }
}

/**
 * ログイン状態を読み込み
 * @returns {boolean} ログイン状態
 */
function loadLoginState() {
    try {
        const saved = localStorage.getItem('fukabori_login_state');
        const isLoggedIn = saved === 'true';
        console.log(`📋 ログイン状態を復元: ${isLoggedIn}`);
        return isLoggedIn;
    } catch (error) {
        console.error('❌ ログイン状態読み込みエラー:', error);
        return false;
    }
}

/**
 * ログイン状態をクリア
 */
function clearLoginState() {
    try {
        localStorage.removeItem('fukabori_login_state');
        console.log('🗑️ ログイン状態をクリア');
    } catch (error) {
        console.error('❌ ログイン状態クリアエラー:', error);
    }
}

// =================================================================================
// THEME STATE MANAGEMENT - テーマ状態管理
// =================================================================================

/**
 * テーマ入力状態を保存
 * @param {string} themeText - テーマテキスト
 */
function saveThemeInputState(themeText) {
    try {
        if (themeText && themeText.trim()) {
            localStorage.setItem('fukabori_theme_input', themeText.trim());
            console.log(`✅ テーマ入力状態を保存: ${themeText.trim()}`);
        } else {
            localStorage.removeItem('fukabori_theme_input');
            console.log('🗑️ テーマ入力状態をクリア（空）');
        }
    } catch (error) {
        console.error('❌ テーマ入力状態保存エラー:', error);
    }
}

/**
 * テーマ入力状態を読み込み
 * @returns {string} テーマテキスト
 */
function loadThemeInputState() {
    try {
        const saved = localStorage.getItem('fukabori_theme_input');
        console.log(`📋 テーマ入力状態を復元: ${saved || '(なし)'}`);
        return saved || '';
    } catch (error) {
        console.error('❌ テーマ入力状態読み込みエラー:', error);
        return '';
    }
}

/**
 * テーマ入力状態をクリア
 */
function clearThemeInputState() {
    try {
        localStorage.removeItem('fukabori_theme_input');
        console.log('🗑️ テーマ入力状態をクリア');
    } catch (error) {
        console.error('❌ テーマ入力状態クリアエラー:', error);
    }
}

/**
 * 保存されたテーマを読み込み
 * @returns {string|null} 保存されたテーマ名
 */
function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('fukabori_theme');
        if (savedTheme) {
            console.log(`✅ 保存されたテーマ「${savedTheme}」を読み込みました`);
            return savedTheme;
        }
        return null;
    } catch (error) {
        console.error('❌ テーマ読み込みエラー:', error);
        return null;
    }
}

// =================================================================================
// KNOWLEDGE SETTINGS MANAGEMENT - 知見設定管理
// =================================================================================

/**
 * 知見設定を保存
 * @param {Object} knowledgeSettings - 知見設定オブジェクト
 */
function saveKnowledgeSettings(knowledgeSettings) {
    try {
        localStorage.setItem('fukabori_knowledge_settings', JSON.stringify(knowledgeSettings));
        console.log('✅ 知見設定を保存しました');
    } catch (error) {
        console.error('❌ 知見設定保存エラー:', error);
    }
}

/**
 * 知見設定を読み込み
 * @returns {Object|null} 知見設定オブジェクト
 */
function loadKnowledgeSettings() {
    try {
        const saved = localStorage.getItem('fukabori_knowledge_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            console.log('✅ 知見設定を読み込みました');
            return settings;
        }
        return null;
    } catch (error) {
        console.error('❌ 知見設定読み込みエラー:', error);
        return null;
    }
}

// =================================================================================
// DATA RECOVERY & MIGRATION - データ復旧・移行
// =================================================================================

/**
 * 破損した暗号化データの復旧を試行
 * @param {string} password - 復号化用パスワード
 * @returns {boolean} 復旧成功可否
 */
function attemptDataRecovery(password) {
    console.log('🔧 データ復旧処理を開始します...');
    
    const passwordHash = window.hashPassword(password);
    const keyId = `fukabori_encrypted_key_${passwordHash}`;
    const encrypted = localStorage.getItem(keyId);
    
    if (!encrypted) {
        console.log('❌ 復旧対象のデータが見つかりません');
        return false;
    }
    
    console.log(`📋 復旧対象データ: ${encrypted.substring(0, 50)}...`);
    
    // 1. 旧XOR暗号化での復号を試行
    try {
        console.log('🔄 旧XOR暗号化での復号を試行...');
        const decrypted = legacyDecryptApiKey(encrypted, password);
        
        // APIキーの妥当性チェック
        if (decrypted.startsWith('sk-') && decrypted.length > 40) {
            console.log('✅ 旧XOR暗号化での復号に成功');
            
            // 新AES暗号化で再保存
            console.log('🔄 新AES暗号化で再保存します...');
            saveEncryptedApiKey(decrypted, password);
            
            return true;
        } else {
            console.log('❌ 復号されたデータが有効なAPIキーではありません');
        }
    } catch (error) {
        console.log('❌ 旧XOR暗号化での復号に失敗:', error.message);
    }
    
    // 2. 新AES暗号化での復号を試行（強制）
    try {
        console.log('🔄 新AES暗号化での復号を強制試行...');
        const key = CryptoJS.PBKDF2(password, 'fukabori-salt', {
            keySize: 256/32,
            iterations: 1000
        });
        const decrypted = CryptoJS.AES.decrypt(encrypted, key.toString());
        const result = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (result && result.startsWith('sk-')) {
            console.log('✅ 新AES暗号化での復号に成功');
            return true;
        }
    } catch (error) {
        console.log('❌ 新AES暗号化での復号に失敗:', error.message);
    }
    
    // 3. データ破損の確認と削除
    console.log('❌ データ復旧に失敗 - 破損データを削除します');
    localStorage.removeItem(keyId);
    localStorage.removeItem(`fukabori_key_timestamp_${passwordHash}`);
    
    return false;
}

/**
 * 全ての保存されたAPIキーのデータ移行
 * @returns {Object} 移行結果
 */
function migrateAllEncryptedData() {
    console.log('🔄 全データ移行処理を開始します...');
    
    const hashes = getPasswordHashList();
    const results = {
        total: hashes.length,
        migrated: 0,
        failed: 0,
        errors: []
    };
    
    for (const hash of hashes) {
        const keyId = `fukabori_encrypted_key_${hash}`;
        const encrypted = localStorage.getItem(keyId);
        
        if (!encrypted) {
            results.failed++;
            results.errors.push(`${hash}: データが見つかりません`);
            continue;
        }
        
        // 旧暗号化データかチェック
        if (isLegacyEncryptedData(encrypted)) {
            console.log(`🔄 旧暗号化データを検出: ${hash}`);
            // 実際の移行はパスワード入力時に実行
            results.migrated++;
        } else {
            console.log(`✅ 新暗号化データ: ${hash}`);
        }
    }
    
    console.log(`✅ データ移行チェック完了: ${results.migrated}件移行対象, ${results.failed}件失敗`);
    return results;
}

// =================================================================================
// STORAGE MANAGER OBJECT - StorageManagerオブジェクト
// =================================================================================

const StorageManager = {
    // APIキー管理
    apiKey: {
        save: saveEncryptedApiKey,
        load: loadEncryptedApiKey,
        clear: clearSavedApiKey,
        hasForPassword: hasApiKeyForPassword,
        getCount: getSavedApiKeyCount
    },
    
    // パスワード管理
    password: {
        updateHashList: updatePasswordHashList,
        getHashList: getPasswordHashList
    },
    
    // ログイン状態管理
    login: {
        save: saveLoginState,
        load: loadLoginState,
        clear: clearLoginState
    },
    
    // テーマ状態管理
    theme: {
        saveInput: saveThemeInputState,
        loadInput: loadThemeInputState,
        clearInput: clearThemeInputState,
        loadSaved: loadSavedTheme
    },
    
    // 知見設定管理
    knowledge: {
        save: saveKnowledgeSettings,
        load: loadKnowledgeSettings
    },
    
    // データ復旧・移行
    recovery: {
        attemptDataRecovery: attemptDataRecovery,
        migrateAllEncryptedData: migrateAllEncryptedData,
        isLegacyData: isLegacyEncryptedData
    }
};

// =================================================================================
// WINDOW EXPORTS - Window経由での公開
// =================================================================================

// 個別関数の公開
window.saveEncryptedApiKey = saveEncryptedApiKey;
window.loadEncryptedApiKey = loadEncryptedApiKey;
window.clearSavedApiKey = clearSavedApiKey;
window.updatePasswordHashList = updatePasswordHashList;
window.getPasswordHashList = getPasswordHashList;
window.hasApiKeyForPassword = hasApiKeyForPassword;
window.getSavedApiKeyCount = getSavedApiKeyCount;
window.saveLoginState = saveLoginState;
window.loadLoginState = loadLoginState;
window.clearLoginState = clearLoginState;
window.saveThemeInputState = saveThemeInputState;
window.loadThemeInputState = loadThemeInputState;
window.clearThemeInputState = clearThemeInputState;
window.loadSavedTheme = loadSavedTheme;
window.saveKnowledgeSettings = saveKnowledgeSettings;
window.loadKnowledgeSettings = loadKnowledgeSettings;

// 復旧関数の公開
window.attemptDataRecovery = attemptDataRecovery;
window.migrateAllEncryptedData = migrateAllEncryptedData;
window.isLegacyEncryptedData = isLegacyEncryptedData;

// StorageManagerオブジェクトの公開
window.StorageManager = StorageManager;

console.log('✅ StorageManager読み込み完了 - 後方互換性対応版'); 