/**
 * 深堀くん - ユーティリティ関数
 * 汎用的な補助関数をまとめたモジュール
 */

// グローバル名前空間に登録（段階的移行のため）
window.FukaboriUtils = window.FukaboriUtils || {};

/**
 * メッセージ表示関数
 * @param {string} type - メッセージタイプ (success, error, info, warning)
 * @param {string} message - 表示するメッセージ
 */
function showMessage(type, message) {
    console.log(`📢 ${type}: ${message}`);
    
    // 簡易的なメッセージ表示（実際のUIがあれば置き換え）
    const messageTypes = {
        'success': '✅',
        'error': '❌',
        'info': '💡',
        'warning': '⚠️'
    };
    
    const icon = messageTypes[type] || '📢';
    
    // コンソール出力（開発用）
    console.log(`${icon} ${message}`);
    
    // 将来的にはUIでのメッセージ表示を実装
    // 現在は一時的にalertで表示（本番では削除予定）
    if (type === 'error') {
        // エラーの場合のみalertで表示
        setTimeout(() => alert(`${icon} ${message}`), 100);
    }
}

/**
 * テキストファイルをダウンロードする関数
 * @param {string} content - ファイルの内容
 * @param {string} filename - ダウンロードするファイル名
 */
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// グローバルに公開
window.FukaboriUtils.showMessage = showMessage;
window.FukaboriUtils.downloadTextFile = downloadTextFile;
// 互換性のため直接も公開（段階的に削除予定）
window.showMessage = showMessage;
window.downloadTextFile = downloadTextFile;

// =================================================================================
// CRYPTO UTILITIES - 暗号化ユーティリティ
// =================================================================================

/**
 * APIキーを暗号化する関数
 * @param {string} apiKey - 暗号化するAPIキー
 * @param {string} password - 暗号化に使用するパスワード
 * @returns {string} Base64エンコードされた暗号化文字列
 */
function encryptApiKey(apiKey, password) {
    let encrypted = '';
    for (let i = 0; i < apiKey.length; i++) {
        encrypted += String.fromCharCode(apiKey.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return btoa(encrypted);
}

/**
 * 暗号化されたAPIキーを復号化する関数
 * @param {string} encryptedKey - Base64エンコードされた暗号化文字列
 * @param {string} password - 復号化に使用するパスワード
 * @returns {string} 復号化されたAPIキー
 * @throws {Error} 復号化に失敗した場合
 */
function decryptApiKey(encryptedKey, password) {
    try {
        const encrypted = atob(encryptedKey);
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ password.charCodeAt(i % password.length));
        }
        return decrypted;
    } catch (error) {
        throw new Error('復号化に失敗しました');
    }
}

/**
 * パスワードをハッシュ化する関数
 * @param {string} password - ハッシュ化するパスワード
 * @returns {string} ハッシュ化されたパスワード（36進数文字列）
 */
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// グローバルに公開
window.FukaboriUtils.encryptApiKey = encryptApiKey;
window.FukaboriUtils.decryptApiKey = decryptApiKey;
window.FukaboriUtils.hashPassword = hashPassword;
// 互換性のため直接も公開（段階的に削除予定）
window.encryptApiKey = encryptApiKey;
window.decryptApiKey = decryptApiKey;
window.hashPassword = hashPassword; 