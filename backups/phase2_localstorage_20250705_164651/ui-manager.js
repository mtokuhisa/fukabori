// =================================================================================
// UI MANAGER - UI/DOM操作管理モジュール
// =================================================================================

/**
 * UI/DOM操作を一元管理するモジュール
 * Phase 1: DOMUtilsオブジェクトの分離
 * 
 * 依存関係:
 * - なし（完全に独立）
 * 
 * 公開API:
 * - window.UIManager.DOMUtils
 */

// =================================================================================
// DOM UTILITIES - DOM操作ユーティリティ
// =================================================================================

const DOMUtils = {
    /**
     * IDでDOM要素を取得
     * @param {string} id - 要素のID
     * @returns {HTMLElement|null} DOM要素またはnull
     */
    get: (id) => document.getElementById(id),
    
    /**
     * 複数のIDでDOM要素を一括取得
     * @param {string[]} ids - 要素IDの配列
     * @returns {Object} IDをキーとしたDOM要素のオブジェクト
     */
    getAll: (ids) => ids.reduce((acc, id) => {
        acc[id] = document.getElementById(id);
        return acc;
    }, {}),
    
    /**
     * 音声キャラクター用のDOM要素を取得
     * @param {string} character - キャラクター名（SPEAKERS.NEHORI または SPEAKERS.HAHORI）
     * @returns {Object} 音声設定用のDOM要素群
     */
    getVoiceElements: (character) => {
        const prefix = character === 'nehori' ? 'nehori' : 'hahori';
        return {
            voice: document.getElementById(`${prefix}Voice`),
            speed: document.getElementById(`${prefix}Speed`),
            volume: document.getElementById(`${prefix}Volume`),
            prompt: document.getElementById(`${prefix}Prompt`),
            speedValue: document.getElementById(`${prefix}SpeedValue`),
            volumeValue: document.getElementById(`${prefix}VolumeValue`)
        };
    }
};

// =================================================================================
// UI MANAGER - メインオブジェクト
// =================================================================================

const UIManager = {
    // Phase 1: DOMUtilsオブジェクト
    DOMUtils: DOMUtils,
    
    // 将来の拡張用
    // Phase 2: LocalStorage操作関数
    // Phase 3: 基本UI更新関数
    // Phase 4: 高度UI更新関数
    
    /**
     * UIManagerの初期化
     */
    init: () => {
        console.log('✅ UIManager初期化完了 - Phase 1: DOMUtils');
    }
};

// =================================================================================
// GLOBAL EXPORT - グローバル公開
// =================================================================================

// window経由でグローバルに公開
window.UIManager = UIManager;

// 初期化実行
UIManager.init();

console.log('🎯 UI Manager Phase 1 読み込み完了: DOMUtils分離'); 