#!/usr/bin/env node

// =================================================================================
// EMBEDDED API KEY ENCRYPTION TOOL
// 深堀くんv2.0 - 企業配布向け埋め込みAPI Key暗号化ツール
// =================================================================================
//
// 🎯 目的: 企業配布向けのAPI Key暗号化処理
// 🔐 復号化パスワード: "irobakuf" (固定)
// 🔄 暗号化方式: AES + PBKDF2 (既存システムとの完全互換性)
//
// 使用方法:
//   node tools/encrypt-api-key.js <API_KEY>
//   例: node tools/encrypt-api-key.js sk-1234567890abcdef...
//
// =================================================================================

const crypto = require('crypto');

// 設定定数
const ENCRYPTION_CONFIG = {
    password: 'irobakuf',        // 企業パスワード（固定）
    salt: 'fukabori-salt',       // 既存システムと同じソルト
    keySize: 32,                 // 256bit/32 = 32
    iterations: 1000,            // PBKDF2反復回数（既存システムと同じ）
    algorithm: 'aes-256-cbc'     // 暗号化アルゴリズム
};

/**
 * 🔐 API Keyを暗号化
 * 既存のapp/storage-manager.jsのencryptApiKey関数と完全互換
 * 
 * @param {string} apiKey - 暗号化するAPI Key
 * @param {string} password - 暗号化パスワード
 * @returns {string} 暗号化されたAPI Key（Base64エンコード）
 */
function encryptApiKey(apiKey, password) {
    try {
        // CryptoJS方式の暗号化（ブラウザ側復号化と完全互換）
        const CryptoJS = require('crypto-js');
        
        // 直接パスワードでAES暗号化（ブラウザ側のCryptoJS.AES.decryptと互換）
        const encrypted = CryptoJS.AES.encrypt(apiKey, password).toString();
        
        console.log('✅ API Key暗号化成功');
        return encrypted;
        
    } catch (error) {
        console.error('❌ 暗号化エラー:', error.message);
        throw error;
    }
}

/**
 * 🔍 API Key形式バリデーション
 * 
 * @param {string} apiKey - 検証するAPI Key
 * @returns {boolean} 有効なAPI Keyかどうか
 */
function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    
    // OpenAI API Keyの基本形式チェック
    if (!apiKey.startsWith('sk-')) {
        console.error('❌ API Keyは "sk-" で始まる必要があります');
        return false;
    }
    
    if (apiKey.length < 40) {
        console.error('❌ API Keyが短すぎます');
        return false;
    }
    
    return true;
}

/**
 * 🧪 暗号化テスト関数
 * 
 * @param {string} apiKey - テスト用API Key
 */
function testEncryption(apiKey) {
    console.log('🧪 暗号化テスト開始...');
    
    try {
        // 暗号化実行
        const encrypted = encryptApiKey(apiKey, ENCRYPTION_CONFIG.password);
        
        console.log('📋 テスト結果:');
        console.log(`   元API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`   暗号化データ: ${encrypted.substring(0, 20)}...`);
        console.log(`   データ長: ${encrypted.length}文字`);
        console.log(`   復号化パスワード: "${ENCRYPTION_CONFIG.password}"`);
        
        return encrypted;
        
    } catch (error) {
        console.error('❌ テスト失敗:', error.message);
        throw error;
    }
}

/**
 * 📜 使用方法表示
 */
function showUsage() {
    console.log(`
🔐 深堀くんv2.0 - 埋め込みAPI Key暗号化ツール

使用方法:
  node tools/encrypt-api-key.js <API_KEY>

例:
  node tools/encrypt-api-key.js sk-1234567890abcdef...

設定:
  復号化パスワード: "${ENCRYPTION_CONFIG.password}"
  暗号化方式: AES-256-CBC + PBKDF2
  
注意:
  - API Keyは "sk-" で始まる有効なOpenAI API Keyを指定してください
  - 暗号化されたデータは深堀くんアプリに埋め込み可能です
    `);
}

// =================================================================================
// メイン処理
// =================================================================================

if (require.main === module) {
    // コマンドライン引数の取得
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showUsage();
        process.exit(1);
    }
    
    const apiKey = args[0];
    
    // API Keyバリデーション
    if (!validateApiKey(apiKey)) {
        console.error('❌ 無効なAPI Keyです');
        showUsage();
        process.exit(1);
    }
    
    try {
        console.log('🔐 深堀くんv2.0 - 埋め込みAPI Key暗号化処理開始');
        console.log('=====================================');
        
        // 暗号化実行
        const encryptedApiKey = testEncryption(apiKey);
        
        console.log('=====================================');
        console.log('✅ 暗号化完了！');
        console.log('');
        console.log('📋 埋め込み用データ:');
        console.log(`"${encryptedApiKey}"`);
        console.log('');
        console.log('🔧 次のステップ:');
        console.log('1. 上記の暗号化データをapp/embedded-api-manager.jsに埋め込み');
        console.log('2. 深堀くんアプリでStep0画面から企業パスワード入力');
        console.log('3. 自動的に復号化されてAPI Keyとして使用開始');
        
    } catch (error) {
        console.error('❌ 処理失敗:', error.message);
        process.exit(1);
    }
}

// モジュールとしてのエクスポート
module.exports = {
    encryptApiKey,
    validateApiKey,
    testEncryption,
    ENCRYPTION_CONFIG
}; 