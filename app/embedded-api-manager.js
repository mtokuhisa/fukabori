// =================================================================================
// EMBEDDED API KEY MANAGER
// 深堀くんv2.0 - 埋め込みAPI Key管理システム
// =================================================================================
//
// 🎯 目的: 企業配布向け埋め込みAPI Key機能
// 🔐 復号化パスワード: "irobakuf" (固定)
// 🔄 既存システム統合: StorageManager・AppStateとの完全互換性
// 🛡️ セキュリティ: 二重暗号化システム（埋め込み時+ローカル保存時）
//
// =================================================================================

/**
 * 🔐 EmbeddedApiManager - 埋め込みAPI Key管理クラス
 * 
 * 企業配布向けの暗号化API Key機能を管理し、
 * 既存のStorageManagerシステムとの完全統合を提供します。
 */
class EmbeddedApiManager {
    constructor() {
        this.isInitialized = false;
        this.isAuthenticated = false;
        this.embeddedApiKey = null;
        this.authenticationTime = null;
        this.memoryCleanupScheduled = false;
        
        // 固定設定
        this.config = {
            corporatePassword: 'irobakuf',      // 企業パスワード（固定）
            featureEnabled: true,               // 機能有効フラグ
            memoryCleanupDelay: 30 * 60 * 1000, // 30分後にメモリクリア
            authenticationTimeout: 30 * 60 * 1000, // 30分認証タイムアウト
            localStorageKeys: {
                auth: 'fukabori_embedded_auth',
                feature: 'fukabori_embedded_feature'
            }
        };
        
        // 埋め込み暗号化API Key（実際の配布時に設定）
        this.embeddedEncryptedData = {
            // 本番用暗号化API Key (tools/encrypt-api-key.js で生成) - 修正版
            encrypted: "U2FsdGVkX1/MOEjjUAe315tpEfhW4NwxKSaqpuqLTAoDL7Z+x4tFTeBANRgQBQb5yeIPiyvxCECQ0CCxGoo1J8JqVQdQz+nSw7lX/NsXnpB0/y65HiepDE4ws29phjQzvpyb0hONpIofPKwbFFaafccOvpMNEN1/rqh8gEs3IjmWcLMFJi/KLPVgMd4QiH80fNhfB5grZe7yWl/Yf6NE5Z5qJRaojSCKp1FfGxmuqCYonh6SbQJa/PX0UGOIFJQA",
            version: '1.2',
            timestamp: Date.now()
        };
        
        console.log('🔐 EmbeddedApiManager初期化完了');
    }
    
    // =================================================================================
    // 初期化・基本機能
    // =================================================================================
    
        /**
     * 🚀 システム初期化
     */
    initialize() {
        try {
            console.log('🔐 EmbeddedApiManager初期化開始...');
            console.log('🔍 デバッグ: 機能有効性チェック中...');

            // 機能有効性チェック
            if (!this.isFeatureEnabled()) {
                console.log('⚠️ 埋め込みAPI Key機能は無効化されています');
                return false;
            }

            console.log('🔍 デバッグ: 埋め込みデータ存在チェック中...');
            console.log('🔍 デバッグ: 埋め込みデータ:', this.embeddedEncryptedData);

            // 埋め込みデータ存在チェック
            if (!this.hasEmbeddedData()) {
                console.log('📋 埋め込みAPI Keyデータが設定されていません');
                return false;
            }

            console.log('🔍 デバッグ: CryptoJS利用可能性チェック...');
            if (typeof CryptoJS === 'undefined') {
                console.error('❌ CryptoJSライブラリが読み込まれていません');
                return false;
            }
            console.log('✅ CryptoJS利用可能');

            // LocalStorage状態復元
            this.restoreAuthenticationState();

            // メモリクリーンアップスケジューリング
            if (this.isAuthenticated) {
                this.scheduleMemoryCleanup();
            }

            this.isInitialized = true;
            console.log('✅ EmbeddedApiManager初期化完了');
            console.log('🔍 デバッグ: 最終状態 - isInitialized:', this.isInitialized, 'hasEmbeddedData:', this.hasEmbeddedData());
            return true;

        } catch (error) {
            console.error('❌ EmbeddedApiManager初期化エラー:', error);
            console.error('❌ エラースタック:', error.stack);
            return false;
        }
    }
    
    /**
     * 🔍 機能有効性チェック
     */
    isFeatureEnabled() {
        try {
            // LocalStorageからの設定確認
            const featureSetting = localStorage.getItem(this.config.localStorageKeys.feature);
            if (featureSetting === 'false') {
                return false;
            }
            
            return this.config.featureEnabled;
        } catch (error) {
            console.error('❌ 機能有効性チェックエラー:', error);
            return false;
        }
    }
    
    /**
     * 📦 埋め込みデータ存在チェック
     */
    hasEmbeddedData() {
        return this.embeddedEncryptedData.encrypted !== null;
    }
    
    // =================================================================================
    // 認証・復号化機能
    // =================================================================================
    
        /**
     * 🔐 企業パスワード認証・API Key復号化
     *
     * @param {string} inputPassword - 入力されたパスワード
     * @returns {Promise<boolean>} 認証成功可否
     */
    async authenticateAndDecrypt(inputPassword) {
        try {
            console.log('🔐 企業パスワード認証開始...');
            console.log('🔍 デバッグ: 入力パスワード長:', inputPassword?.length || 0);
            console.log('🔍 デバッグ: 期待パスワード:', this.config.corporatePassword);
            
            if (!this.isInitialized) {
                console.error('❌ EmbeddedApiManagerが初期化されていません');
                // 自動初期化を試行
                console.log('🔄 自動初期化を試行中...');
                const initialized = this.initialize();
                if (!initialized) {
                    throw new Error('EmbeddedApiManagerの自動初期化に失敗しました');
                }
            }
            
            // パスワード照合
            console.log('🔍 デバッグ: パスワード照合中...');
            if (inputPassword !== this.config.corporatePassword) {
                console.log('❌ 企業パスワードが一致しません');
                console.log('🔍 デバッグ: 入力:', `"${inputPassword}"`, '期待:', `"${this.config.corporatePassword}"`);
                return false;
            }
            console.log('✅ パスワード照合成功');
            
            // 埋め込みAPI Key復号化
            console.log('🔍 デバッグ: API Key復号化開始...');
            const decryptedApiKey = await this.decryptEmbeddedApiKey(inputPassword);
            
            if (!decryptedApiKey) {
                console.log('❌ API Key復号化に失敗しました');
                return false;
            }
            
            console.log('✅ API Key復号化成功:', decryptedApiKey.substring(0, 15) + '...');
            
            // 認証状態設定
            this.isAuthenticated = true;
            this.embeddedApiKey = decryptedApiKey;
            this.authenticationTime = new Date();
            
            console.log('🔍 デバッグ: 認証状態設定完了');
            
            // LocalStorage状態保存
            this.saveAuthenticationState();
            
            // メモリクリーンアップスケジューリング
            this.scheduleMemoryCleanup();
            
            console.log('✅ 企業パスワード認証・復号化完了');
            return true;
            
        } catch (error) {
            console.error('❌ 認証・復号化エラー:', error);
            console.error('❌ エラースタック:', error.stack);
            this.clearAuthenticationState();
            return false;
        }
    }
    
    /**
     * 🔓 埋め込みAPI Key復号化
     * 
     * @param {string} password - 復号化パスワード
     * @returns {Promise<string|null>} 復号化されたAPI Key
     */
    async decryptEmbeddedApiKey(password) {
        try {
            console.log('🔍 デバッグ: 復号化開始 - パスワード:', password);
            
            if (!this.embeddedEncryptedData.encrypted) {
                throw new Error('埋め込み暗号化データが設定されていません');
            }
            
            console.log('🔍 デバッグ: 暗号化データ確認 - 長さ:', this.embeddedEncryptedData.encrypted.length);
            console.log('🔍 デバッグ: 暗号化データ先頭:', this.embeddedEncryptedData.encrypted.substring(0, 50) + '...');
            
            // CryptoJSを使用した復号化（既存システムと同じ方式）
            if (typeof CryptoJS === 'undefined') {
                throw new Error('CryptoJSライブラリが読み込まれていません');
            }
            
            console.log('🔍 デバッグ: 直接AES復号化実行中...');
            const decrypted = CryptoJS.AES.decrypt(this.embeddedEncryptedData.encrypted, password);
            
            console.log('🔍 デバッグ: UTF-8変換中...');
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            
            console.log('🔍 デバッグ: 復号化結果長さ:', decryptedText?.length || 0);
            console.log('🔍 デバッグ: 復号化結果先頭:', decryptedText?.substring(0, 15) || 'null');
            
            if (!decryptedText || decryptedText.length === 0) {
                throw new Error('復号化結果が空です - パスワードが間違っている可能性があります');
            }
            
            if (!decryptedText.startsWith('sk-')) {
                throw new Error(`復号化されたデータが有効なAPI Keyではありません: "${decryptedText.substring(0, 20)}..."`);
            }
            
            console.log('✅ 埋め込みAPI Key復号化成功');
            return decryptedText;
            
        } catch (error) {
            console.error('❌ 埋め込みAPI Key復号化エラー:', error);
            console.error('❌ エラースタック:', error.stack);
            return null;
        }
    }
    
    // =================================================================================
    // API Key取得・優先順位制御
    // =================================================================================
    
    /**
     * 🎯 API Key取得（優先順位制御付き）
     * 
     * 優先順位:
     * 1. 設定画面API Key (最優先)
     * 2. 埋め込み企業API Key
     * 3. 未設定
     * 
     * @returns {string|null} 現在有効なAPI Key
     */
    getApiKeyWithPriority() {
        try {
            // 1. 設定画面API Key（最優先）
            if (window.StorageManager && window.StorageManager.apiKey.getCount() > 0) {
                console.log('🔑 設定画面API Keyを使用（最優先）');
                return null; // 既存システムにフォールバック
            }
            
            // 2. 埋め込み企業API Key
            if (this.isAuthenticated && this.embeddedApiKey) {
                console.log('🏢 埋め込み企業API Keyを使用');
                return this.embeddedApiKey;
            }
            
            // 3. 未設定
            console.log('⚠️ API Keyが設定されていません');
            return null;
            
        } catch (error) {
            console.error('❌ API Key取得エラー:', error);
            return null;
        }
    }
    
    /**
     * 🔍 API Key設定状況確認（拡張版）
     * 
     * @returns {Object} API Key設定状況
     */
    isApiKeyConfigured() {
        const result = {
            hasUserApiKey: false,
            hasEmbeddedApiKey: false,
            isEmbeddedAuthenticated: false,
            currentSource: null,
            totalCount: 0
        };
        
        try {
            // 設定画面API Key確認
            if (window.StorageManager && window.StorageManager.apiKey.getCount() > 0) {
                result.hasUserApiKey = true;
                result.currentSource = 'user';
                result.totalCount += window.StorageManager.apiKey.getCount();
            }
            
            // 埋め込みAPI Key確認
            if (this.hasEmbeddedData()) {
                result.hasEmbeddedApiKey = true;
                if (this.isAuthenticated) {
                    result.isEmbeddedAuthenticated = true;
                    if (!result.hasUserApiKey) {
                        result.currentSource = 'embedded';
                    }
                    result.totalCount += 1;
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ API Key設定状況確認エラー:', error);
            return result;
        }
    }
    
    // =================================================================================
    // 状態管理・永続化
    // =================================================================================
    
    /**
     * 💾 認証状態保存
     */
    saveAuthenticationState() {
        try {
            if (this.isAuthenticated) {
                localStorage.setItem(this.config.localStorageKeys.auth, 'authenticated');
                console.log('💾 埋め込みAPI認証状態を保存しました');
            }
        } catch (error) {
            console.error('❌ 認証状態保存エラー:', error);
        }
    }
    
    /**
     * 📋 認証状態復元
     */
    restoreAuthenticationState() {
        try {
            const authState = localStorage.getItem(this.config.localStorageKeys.auth);
            if (authState === 'authenticated') {
                // 注意: 実際のAPI Keyは再認証が必要
                // セキュリティのため、認証状態のみ復元
                console.log('📋 埋め込みAPI認証状態を復元（再認証が必要）');
            }
        } catch (error) {
            console.error('❌ 認証状態復元エラー:', error);
        }
    }
    
    /**
     * 🗑️ 認証状態クリア
     */
    clearAuthenticationState() {
        try {
            this.isAuthenticated = false;
            this.embeddedApiKey = null;
            this.authenticationTime = null;
            
            localStorage.removeItem(this.config.localStorageKeys.auth);
            
            console.log('🗑️ 埋め込みAPI認証状態をクリアしました');
        } catch (error) {
            console.error('❌ 認証状態クリアエラー:', error);
        }
    }
    
    // =================================================================================
    // セキュリティ・メモリ管理
    // =================================================================================
    
    /**
     * ⏰ メモリクリーンアップスケジューリング
     */
    scheduleMemoryCleanup() {
        if (this.memoryCleanupScheduled) {
            return;
        }
        
        this.memoryCleanupScheduled = true;
        
        setTimeout(() => {
            this.performMemoryCleanup();
        }, this.config.memoryCleanupDelay);
        
        console.log(`⏰ メモリクリーンアップを${this.config.memoryCleanupDelay / 60000}分後にスケジュール`);
    }
    
    /**
     * 🧹 メモリクリーンアップ実行
     */
    performMemoryCleanup() {
        try {
            console.log('🧹 埋め込みAPI Keyメモリクリーンアップ開始...');
            
            // API Keyをメモリから消去
            if (this.embeddedApiKey) {
                this.embeddedApiKey = null;
            }
            
            // 認証状態をクリア（LocalStorageは保持）
            this.isAuthenticated = false;
            this.authenticationTime = null;
            this.memoryCleanupScheduled = false;
            
            console.log('✅ メモリクリーンアップ完了');
            
            // UI更新通知（必要に応じて）
            if (typeof window.showMessage === 'function') {
                window.showMessage('info', '🔐 セキュリティのため、埋め込みAPI認証がタイムアウトしました');
            }
            
        } catch (error) {
            console.error('❌ メモリクリーンアップエラー:', error);
        }
    }
    
    // =================================================================================
    // 緊急機能・デバッグ
    // =================================================================================
    
    /**
     * 🚨 緊急ロールバック
     */
    emergencyRollback() {
        try {
            console.log('🚨 埋め込みAPI Key機能緊急ロールバック実行');
            
            // 機能無効化
            localStorage.setItem(this.config.localStorageKeys.feature, 'false');
            
            // 全状態クリア
            this.clearAuthenticationState();
            
            // メモリクリーンアップ
            this.performMemoryCleanup();
            
            console.log('✅ 緊急ロールバック完了');
            
            if (typeof window.showMessage === 'function') {
                window.showMessage('warning', '🚨 埋め込みAPI Key機能を緊急無効化しました');
            }
            
        } catch (error) {
            console.error('❌ 緊急ロールバックエラー:', error);
        }
    }
    
    /**
     * 🔧 デバッグ情報取得
     */
    getDebugInfo() {
        return {
            initialized: this.isInitialized,
            authenticated: this.isAuthenticated,
            hasEmbeddedData: this.hasEmbeddedData(),
            featureEnabled: this.isFeatureEnabled(),
            authenticationTime: this.authenticationTime,
            config: {
                ...this.config,
                corporatePassword: '[HIDDEN]' // セキュリティのため非表示
            }
        };
    }
}

// =================================================================================
// グローバル初期化・公開
// =================================================================================

// シングルトンインスタンス
window.EmbeddedApiManager = new EmbeddedApiManager();

// 緊急ロールバック関数のグローバル公開
window.emergencyRollbackEmbeddedApi = function() {
    if (window.EmbeddedApiManager) {
        window.EmbeddedApiManager.emergencyRollback();
    }
};

// デバッグ関数のグローバル公開
window.debugEmbeddedApi = function() {
    if (window.EmbeddedApiManager) {
        const debugInfo = window.EmbeddedApiManager.getDebugInfo();
        console.log('🔧 埋め込みAPI Key デバッグ情報:', debugInfo);
        return debugInfo;
    }
    return null;
};

// 初期化実行（複数のタイミングで確実に実行）
function initializeEmbeddedApiManager() {
    console.log('🔄 EmbeddedApiManager初期化試行...');
    if (window.EmbeddedApiManager && !window.EmbeddedApiManager.isInitialized) {
        const success = window.EmbeddedApiManager.initialize();
        console.log('🔍 初期化結果:', success ? '成功' : '失敗');
        return success;
    }
    return window.EmbeddedApiManager && window.EmbeddedApiManager.isInitialized;
}

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 DOMContentLoaded - 埋め込みAPI初期化開始');
    setTimeout(() => {
        initializeEmbeddedApiManager();
        
        // 企業版UI初期化（認証ボタンにフォーカス）
        const authButton = document.getElementById('corporateAuthButton');
        if (authButton) {
            setTimeout(() => {
                authButton.focus();
                console.log('🎯 企業認証ボタンにフォーカス設定');
            }, 500);
        }
    }, 100);
});

// ページ読み込み完了時の初期化（フォールバック）
window.addEventListener('load', function() {
    console.log('🔄 Window Load - 埋め込みAPI初期化フォールバック');
    setTimeout(() => {
        initializeEmbeddedApiManager();
    }, 200);
});

// 手動初期化関数のグローバル公開
window.initializeEmbeddedApiManager = initializeEmbeddedApiManager;

console.log('✅ 埋め込みAPI Key管理システム読み込み完了'); 