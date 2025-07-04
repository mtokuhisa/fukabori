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