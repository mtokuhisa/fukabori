// =================================================================================
// UI ADVANCED MANAGER - 高度UI管理モジュール
// =================================================================================

/**
 * UI最適化Phase1: 高度UI機能の分離
 * - モーダル管理
 * - ヘルプガイド管理
 * - 発声短縮UI管理
 * 
 * 依存関係:
 * - window.UIManager.DOMUtils (DOM操作)
 * - window.showMessage (メッセージ表示)
 * - AppState (状態参照のみ)
 * 
 * 公開API:
 * - window.UIAdvanced
 */

// =================================================================================
// MODAL MANAGEMENT - モーダル管理
// =================================================================================

const ModalManager = {
    /**
     * 設定モーダルを開く
     */
    openAdvancedSettings() {
        console.log('💡 openAdvancedSettings が実行されました');
        
        const modal = window.UIManager.DOMUtils.get('advancedSettingsModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            this.updateAdvancedSettingsDisplay();
            document.addEventListener('keydown', this.handleEscapeKey);
            console.log('✅ その他設定モーダルを開きました');
        } else {
            console.error('❌ モーダル要素が見つかりません');
        }
    },

    /**
     * 設定モーダルを閉じる
     */
    closeAdvancedSettings() {
        console.log('💡 closeAdvancedSettings が実行されました');
        
        const modal = window.UIManager.DOMUtils.get('advancedSettingsModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            document.removeEventListener('keydown', this.handleEscapeKey);
            console.log('✅ その他設定モーダルを閉じました');
        }
    },

    /**
     * 設定モーダルの表示内容を更新
     */
    updateAdvancedSettingsDisplay() {
        // カスタムプロンプト表示更新
        const nehoriPrompt = window.UIManager.DOMUtils.get('nehoriPrompt');
        const hahoriPrompt = window.UIManager.DOMUtils.get('hahoriPrompt');
        
        if (nehoriPrompt && window.getCharacterPrompt) {
            nehoriPrompt.value = window.getCharacterPrompt(window.SPEAKERS?.NEHORI || 'nehori');
        }
        if (hahoriPrompt && window.getCharacterPrompt) {
            hahoriPrompt.value = window.getCharacterPrompt(window.SPEAKERS?.HAHORI || 'hahori');
        }
        
        // 音声設定UIも更新
        setTimeout(() => {
            if (window.updateVoiceSettingsUI) {
                window.updateVoiceSettingsUI();
            }
        }, 100); // prompts.jsの読み込み完了を待つ
    },

    /**
     * Escapeキーでモーダルを閉じる
     */
    handleEscapeKey(event) {
        if (event.key === 'Escape') {
            if (window.UIAdvanced && window.UIAdvanced.Modal) {
                window.UIAdvanced.Modal.closeAdvancedSettings();
            } else if (window.closeAdvancedSettings) {
                window.closeAdvancedSettings();
            }
        }
    },

    /**
     * 音声設定を保存
     */
    saveVoicePreset() {
        try {
            console.log('💾 音声設定を保存中...');
            
            // 設定画面からプロンプトを取得
            const nehoriPrompt = window.UIManager.DOMUtils.get('nehoriPrompt');
            const hahoriPrompt = window.UIManager.DOMUtils.get('hahoriPrompt');
            
            if (!nehoriPrompt || !hahoriPrompt) {
                window.showMessage('error', 'プロンプト入力欄が見つかりません');
                return;
            }
            
            // VoiceSettingsを更新
            const SPEAKERS = window.SPEAKERS || { NEHORI: 'nehori', HAHORI: 'hahori' };
            const VoiceSettings = window.VoiceSettings || {};
            
            if (!VoiceSettings[SPEAKERS.NEHORI]) VoiceSettings[SPEAKERS.NEHORI] = {};
            if (!VoiceSettings[SPEAKERS.HAHORI]) VoiceSettings[SPEAKERS.HAHORI] = {};
            
            VoiceSettings[SPEAKERS.NEHORI].prompt = nehoriPrompt.value || '';
            VoiceSettings[SPEAKERS.HAHORI].prompt = hahoriPrompt.value || '';
            
            // ローカルストレージに保存
            const voiceConfig = {
                nehori: {
                    ...VoiceSettings[SPEAKERS.NEHORI]
                },
                hahori: {
                    ...VoiceSettings[SPEAKERS.HAHORI]
                },
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem('fukabori_voice_config', JSON.stringify(voiceConfig));
            
            // configフォルダ用の設定ファイルも生成してダウンロード
            this.downloadVoiceConfig(voiceConfig);
            
            console.log('✅ 音声設定を保存しました');
            window.showMessage('success', '音声設定を保存しました（voice_config.jsファイルもダウンロードされました）');
            
        } catch (error) {
            console.error('❌ 音声設定保存エラー:', error);
            window.showMessage('error', '音声設定の保存に失敗しました');
        }
    },

    /**
     * 音声設定ファイルをダウンロード
     */
    downloadVoiceConfig(config) {
        try {
            // JavaScriptファイル形式で出力
            const jsContent = `// 深堀くん - カスタム音声設定
// 生成日時: ${config.lastUpdated}

window.CUSTOM_VOICE_CONFIG = ${JSON.stringify(config, null, 2)};

// 設定の自動適用
if (typeof window !== 'undefined' && window.VoiceSettings) {
    Object.assign(window.VoiceSettings.nehori, window.CUSTOM_VOICE_CONFIG.nehori);
    Object.assign(window.VoiceSettings.hahori, window.CUSTOM_VOICE_CONFIG.hahori);
    console.log('✅ カスタム音声設定を適用しました');
}
`;

            const blob = new Blob([jsContent], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'voice_config.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('📁 voice_config.jsファイルをダウンロードしました');
            
        } catch (error) {
            console.error('❌ 設定ファイルダウンロードエラー:', error);
        }
    }
};

// =================================================================================
// HELP GUIDE MANAGEMENT - ヘルプガイド管理
// =================================================================================

const HelpGuideManager = {
    /**
     * ヘルプガイドの表示/非表示を切り替え
     */
    toggleVoiceGuide() {
        const voiceGuidePanel = window.UIManager.DOMUtils.get('voiceGuidePanel');
        const mainGuideToggle = window.UIManager.DOMUtils.get('mainGuideToggle');
        
        if (voiceGuidePanel && mainGuideToggle) {
            const isHidden = voiceGuidePanel.classList.contains('hidden');
            
            if (isHidden) {
                // ガイドパネルを表示
                voiceGuidePanel.classList.remove('hidden');
                mainGuideToggle.classList.remove('show');
                // 横書きを強制確保
                voiceGuidePanel.style.writingMode = 'horizontal-tb';
                voiceGuidePanel.style.textOrientation = 'mixed';
                console.log('✅ ヘルプガイドを表示しました');
            } else {
                // ガイドパネルを非表示
                voiceGuidePanel.classList.add('hidden');
                mainGuideToggle.classList.add('show');
                console.log('✅ ヘルプガイドを非表示にしました');
            }
        }
    }
};

// =================================================================================
// SPEECH SHORTENING UI MANAGEMENT - 発声短縮UI管理
// =================================================================================

const SpeechShorteningUIManager = {
    /**
     * 発声短縮UIを更新
     */
    updateUI() {
        const enabledCheckbox = document.getElementById('speechShorteningEnabled');
        const settingsPanel = document.getElementById('shorteningSettings');
        const levelSlider = document.getElementById('shorteningLevel');
        const levelValue = document.getElementById('shorteningLevelValue');
        const maxCharSlider = document.getElementById('maxCharacters');
        const maxCharValue = document.getElementById('maxCharactersValue');

        // 設定を取得（SpeechShorteningManagerから）
        const settings = window.SpeechShorteningManager?.settings || {
            enabled: false,
            level: 3,
            maxCharacters: 150,
            options: {}
        };

        if (enabledCheckbox) {
            enabledCheckbox.checked = settings.enabled;
        }

        if (settingsPanel) {
            settingsPanel.style.opacity = settings.enabled ? '1' : '0.5';
            settingsPanel.style.pointerEvents = settings.enabled ? 'auto' : 'none';
        }

        if (levelSlider && levelValue) {
            levelSlider.value = settings.level;
            levelValue.textContent = settings.level;
        }

        if (maxCharSlider && maxCharValue) {
            maxCharSlider.value = settings.maxCharacters;
            maxCharValue.textContent = settings.maxCharacters;
        }

        // 個別オプション更新
        if (settings.options) {
            Object.keys(settings.options).forEach(key => {
                const checkbox = document.getElementById(key);
                if (checkbox) {
                    checkbox.checked = settings.options[key];
                }
            });
        }
    },

    /**
     * 発声短縮機能の有効/無効を切り替え
     */
    toggleEnabled() {
        if (window.SpeechShorteningManager) {
            window.SpeechShorteningManager.toggleEnabled();
            this.updateUI(); // UI同期
        } else {
            console.warn('⚠️ SpeechShorteningManagerが利用できません');
            window.showMessage('warning', '発声短縮機能が利用できません');
        }
    },

    /**
     * 発声短縮レベルを更新
     */
    updateLevel() {
        const levelSlider = document.getElementById('shorteningLevel');
        if (levelSlider && window.SpeechShorteningManager) {
            window.SpeechShorteningManager.updateLevel(levelSlider.value);
            this.updateUI(); // UI同期
        }
    },

    /**
     * 最大文字数を更新
     */
    updateMaxCharacters() {
        const maxCharSlider = document.getElementById('maxCharacters');
        if (maxCharSlider && window.SpeechShorteningManager) {
            window.SpeechShorteningManager.updateMaxCharacters(maxCharSlider.value);
            this.updateUI(); // UI同期
        }
    },

    /**
     * 発声短縮設定をリセット
     */
    resetSettings() {
        if (confirm('発声短縮設定をリセットしますか？')) {
            if (window.SpeechShorteningManager) {
                window.SpeechShorteningManager.resetSettings();
                this.updateUI(); // UI同期
            }
        }
    },

    /**
     * 発声短縮機能をテスト
     */
    async testSpeechShortening() {
        console.log('🧪 発声短縮機能テスト開始');
        
        const testTexts = [
            'いつもお忙しい中、貴重なお時間をいただき、誠にありがとうございます。本日は「プロジェクト管理の工夫」というテーマについて、さらに詳しくお聞かせいただければと思います。',
            'それは本当に素晴らしいお話ですね。具体的には、どのような場面で、どのような課題があり、それをどのように解決されたのでしょうか？',
            'ありがとうございました。非常に価値ある知見をお聞かせいただき、心より感謝申し上げます。'
        ];
        
        if (!window.SpeechShorteningManager) {
            console.warn('⚠️ SpeechShorteningManagerが利用できません');
            window.showMessage('warning', '発声短縮機能が利用できません');
            return;
        }
        
        for (let i = 0; i < testTexts.length; i++) {
            const originalText = testTexts[i];
            const shortenedText = await window.SpeechShorteningManager.processTextWithShortening(originalText, 'nehori');
            
            console.log(`📋 テスト ${i + 1}:`);
            console.log(`📝 元テキスト (${originalText.length}文字): ${originalText}`);
            console.log(`🔊 短縮後 (${shortenedText.length}文字): ${shortenedText}`);
            console.log(`📊 短縮率: ${Math.round((1 - shortenedText.length / originalText.length) * 100)}%`);
            console.log('---');
        }
        
        window.showMessage('success', '発声短縮テストが完了しました。コンソールで結果を確認してください。');
    }
};

// =================================================================================
// UI ADVANCED MANAGER - メインオブジェクト
// =================================================================================

const UIAdvanced = {
    // Phase 1: 高度UI機能
    Modal: ModalManager,
    HelpGuide: HelpGuideManager,
    SpeechShorteningUI: SpeechShorteningUIManager,
    
    /**
     * UIAdvancedの初期化
     */
    init() {
        console.log('✅ UIAdvanced初期化完了 - Phase 1: モーダル・ガイド・短縮UI');
        
        // 発声短縮UIの初期化
        this.SpeechShorteningUI.updateUI();
    },

    /**
     * 設定の同期更新
     */
    syncSettings() {
        this.SpeechShorteningUI.updateUI();
    }
};

// =================================================================================
// GLOBAL EXPORT - グローバル公開
// =================================================================================

// window経由でグローバルに公開
window.UIAdvanced = UIAdvanced;

// 後方互換性のための個別関数公開
window.openAdvancedSettings = () => UIAdvanced.Modal.openAdvancedSettings();
window.closeAdvancedSettings = () => UIAdvanced.Modal.closeAdvancedSettings();
window.saveVoicePreset = () => UIAdvanced.Modal.saveVoicePreset();
window.toggleVoiceGuide = () => UIAdvanced.HelpGuide.toggleVoiceGuide();

// 発声短縮UI関数の公開
window.toggleSpeechShortening = () => UIAdvanced.SpeechShorteningUI.toggleEnabled();
window.updateShorteningLevel = () => UIAdvanced.SpeechShorteningUI.updateLevel();
window.updateMaxCharacters = () => UIAdvanced.SpeechShorteningUI.updateMaxCharacters();
window.resetShorteningSettings = () => UIAdvanced.SpeechShorteningUI.resetSettings();
window.testSpeechShortening = () => UIAdvanced.SpeechShorteningUI.testSpeechShortening();

// 初期化実行
document.addEventListener('DOMContentLoaded', () => {
    UIAdvanced.init();
});

console.log('🎯 UI Advanced Manager Phase 1 読み込み完了: モーダル・ガイド・短縮UI分離'); 