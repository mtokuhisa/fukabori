// =================================================================================
// VOICE UI MANAGER - 音声UI管理システム
// =================================================================================

// 🔧 SYSTEM CONTROL FLAGS - システム制御フラグ
const VOICE_UI_MANAGER_CONFIG = {
    ENABLED: true,  // ✅ VoiceUIManager機能を有効化（音声認識継続処理のため）
    AUTO_INITIALIZE: false,  // 🚫 自動初期化を無効化
    MANUAL_ONLY: true,  // ✅ 手動初期化のみ許可
    FIXED_POSITION: false,  // 🚫 固定位置表示を無効化
    UI_DISPLAY: false,  // 🚫 UI表示を無効化（新設）
    DEBUG_MODE: false
};

/**
 * 音声UI管理システム
 * 音声認識の視覚的フィードバックとユーザー操作を提供
 */
class VoiceUIManager {
    constructor() {
        this.isInitialized = false;
        this.voiceModule = null;
        this.container = null;
        this.micIcon = null;
        this.stateText = null;
        this.toggleButton = null;
        this.endButton = null;
        this.monitoringInterval = null;
        this.userPausedManually = false;
        
        // 🔧 無効化フラグチェック
        this.enabled = VOICE_UI_MANAGER_CONFIG.ENABLED;
        this.autoInitialize = VOICE_UI_MANAGER_CONFIG.AUTO_INITIALIZE;
        this.fixedPosition = VOICE_UI_MANAGER_CONFIG.FIXED_POSITION;
        this.uiDisplay = VOICE_UI_MANAGER_CONFIG.UI_DISPLAY;  // 🔧 UI表示制御
        
        if (!this.enabled) {
            console.log('🚫 VoiceUIManager: システムが無効化されています');
        } else if (!this.uiDisplay) {
            console.log('🎨 VoiceUIManager: UI表示のみ無効化 - 音声認識継続処理は有効');
        }
        
        console.log('🎨 VoiceUIManager初期化完了 - UI表示:', this.uiDisplay, '音声処理:', this.enabled);
    }

    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        // 🔧 無効化チェック
        if (!this.enabled) {
            console.log('🚫 VoiceUIManager: 無効化により初期化をスキップ');
            return false;
        }
        
        // 🔧 UI表示が無効化されている場合はUI初期化をスキップ
        if (!this.uiDisplay) {
            console.log('🎨 VoiceUIManager: UI表示無効化 - UI初期化をスキップ');
            this.isInitialized = true;  // 音声処理機能のみ有効化
            return true;
        }
        
        if (this.isInitialized) {
            console.log('⚠️ VoiceUIManager既に初期化済み');
            return true;
        }
        
        try {
            // 統合状態管理システムの取得 - 正しい参照方法に修正
            if (window.unifiedStateManager) {
                this.voiceModule = window.unifiedStateManager.getModule('voice');
            } else if (window.UnifiedStateManager) {
                this.voiceModule = window.UnifiedStateManager.getModule('voice');
            }
            
            if (!this.voiceModule) {
                console.warn('⚠️ VoiceModule未初期化 - 初期化を中止');
                return false;
            }
            
            // UI要素の作成
            this.createVoiceUI();
            
            // スタイルの注入
            this.injectStyles();
            
            // イベントリスナーの設定
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ VoiceUIManager初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ VoiceUIManager初期化エラー:', error);
            return false;
        }
    }

    // =================================================================================
    // UI作成
    // =================================================================================
    
    createVoiceUI() {
        // 既存のUI要素を削除
        const existingUI = document.getElementById('voice-integrated-control');
        if (existingUI) {
            existingUI.remove();
        }
        
        // メインUI要素の作成
        const voiceUI = document.createElement('div');
        voiceUI.id = 'voice-integrated-control';
        voiceUI.className = 'voice-integrated-control';
        
        voiceUI.innerHTML = `
            <div class="voice-mic-section">
                <div class="voice-mic-icon" id="voiceMicIcon">🎤</div>
                <div class="voice-state-text" id="voiceStateText">待機中</div>
            </div>
            
            <div class="voice-button-section">
                <button class="voice-toggle-button" id="voiceToggleButton">
                    <span class="button-icon">⏸️</span>
                    <span class="button-text">一時停止</span>
                </button>
                <button class="voice-end-button" id="voiceEndButton">
                    <span class="button-icon">🛑</span>
                    <span class="button-text">セッション終了</span>
                </button>
            </div>
        `;
        
        // DOMに追加
        document.body.appendChild(voiceUI);
        
        // 要素の参照を保存
        this.container = voiceUI;
        this.micIcon = document.getElementById('voiceMicIcon');
        this.stateText = document.getElementById('voiceStateText');
        this.toggleButton = document.getElementById('voiceToggleButton');
        this.endButton = document.getElementById('voiceEndButton');
        
        console.log('✅ 音声UI作成完了');
    }

    // =================================================================================
    // イベントリスナー設定
    // =================================================================================
    
    setupEventListeners() {
        // 一時停止/再開ボタン
        this.toggleButton.addEventListener('click', () => {
            this.handleToggleClick();
        });
        
        // セッション終了ボタン
        this.endButton.addEventListener('click', () => {
            this.handleEndClick();
        });
        
        // 音声認識状態の監視
        this.startStateMonitoring();
        
        console.log('✅ イベントリスナー設定完了');
    }

    // =================================================================================
    // 状態監視
    // =================================================================================
    
    startStateMonitoring() {
        // 定期的に状態をチェック
        setInterval(() => {
            this.updateVoiceState();
        }, 500);
    }

    updateVoiceState() {
        if (!this.voiceModule) return;
        
        const state = this.voiceModule.getState();
        if (!state) return;
        
        // 状態に応じてUIを更新
        this.updateMicIcon(state.recognitionState);
        this.updateStateText(state.recognitionState);
        this.updateToggleButton(state.recognitionState);
    }

    updateMicIcon(state) {
        const micIcon = this.micIcon;
        if (!micIcon) return;
        
        // 状態に応じたクラスを設定
        micIcon.className = `voice-mic-icon ${state}`;
        
        // アクティブ状態の場合、アニメーション追加
        if (state === 'active') {
            micIcon.classList.add('active');
        } else {
            micIcon.classList.remove('active');
        }
    }

    updateStateText(state) {
        const stateText = this.stateText;
        if (!stateText) return;
        
        const message = this.stateConfig.messages[state] || '不明な状態';
        stateText.textContent = message;
        stateText.style.color = this.stateConfig.colors[state] || '#6c757d';
    }

    updateToggleButton(state) {
        const toggleButton = this.toggleButton;
        if (!toggleButton) return;
        
        const icon = toggleButton.querySelector('.button-icon');
        const text = toggleButton.querySelector('.button-text');
        
        if (state === 'active' && !this.userPausedManually) {
            // 認識中 - 一時停止ボタン
            icon.textContent = '⏸️';
            text.textContent = '一時停止';
            toggleButton.style.borderColor = '#ffc107';
        } else if (state === 'stopping' || this.userPausedManually) {
            // 停止中 - 再開ボタン
            icon.textContent = '▶️';
            text.textContent = '再開';
            toggleButton.style.borderColor = '#28a745';
        } else {
            // その他の状態
            icon.textContent = '⏸️';
            text.textContent = '一時停止';
            toggleButton.style.borderColor = '#6c757d';
        }
    }

    // =================================================================================
    // ボタンハンドラー
    // =================================================================================
    
    handleToggleClick() {
        if (!this.voiceModule) return;
        
        const state = this.voiceModule.getState();
        if (!state) return;
        
        if (state.recognitionState === 'active' && !this.userPausedManually) {
            // 一時停止
            this.userPausedManually = true;
            this.voiceModule.pauseRecognition();
            console.log('🎤 ユーザーが手動で一時停止');
        } else if (this.userPausedManually || state.recognitionState === 'stopping') {
            // 再開
            this.userPausedManually = false;
            this.voiceModule.resumeRecognition();
            console.log('🎤 ユーザーが手動で再開');
        }
    }

    handleEndClick() {
        // セッション終了の確認
        if (confirm('セッションを終了しますか？')) {
            if (typeof endConversationSession === 'function') {
                endConversationSession();
            } else {
                console.warn('⚠️ endConversationSession関数が見つかりません');
            }
        }
    }

    // =================================================================================
    // 表示/非表示制御
    // =================================================================================
    
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            console.log('✅ 音声UI表示');
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            console.log('✅ 音声UI非表示');
        }
    }

    // =================================================================================
    // CSS スタイル注入
    // =================================================================================
    
    injectStyles() {
        const existingStyle = document.getElementById('voice-ui-manager-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'voice-ui-manager-styles';
        style.textContent = `
            /* 🎤 中央下部統合コントロール（固定配置） */
            .voice-integrated-control {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                padding: 25px 30px;
                background: rgba(255, 255, 255, 0.98);
                border: 2px solid rgba(255, 255, 255, 0.8);
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                backdrop-filter: blur(10px);
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                min-width: 280px;
            }
            
            .voice-mic-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }
            
            .voice-mic-icon {
                font-size: 48px;
                transition: all 0.3s ease;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
                cursor: default;
            }
            
            .voice-mic-icon.active {
                transform: scale(1.15);
                filter: drop-shadow(0 6px 12px rgba(40, 167, 69, 0.4));
                animation: pulse 2s infinite;
            }
            
            .voice-state-text {
                font-size: 16px;
                font-weight: 600;
                color: #495057;
                text-align: center;
                margin: 0;
                letter-spacing: 0.5px;
            }
            
            .voice-button-section {
                display: flex;
                gap: 20px;
                width: 100%;
                justify-content: center;
            }
            
            .voice-toggle-button,
            .voice-end-button {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 15px 20px;
                border: 2px solid #ddd;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: rgba(255, 255, 255, 0.9);
                min-width: 100px;
                backdrop-filter: blur(5px);
            }
            
            .voice-toggle-button:hover,
            .voice-end-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                background: rgba(255, 255, 255, 1);
            }
            
            .voice-toggle-button:active,
            .voice-end-button:active {
                transform: translateY(-1px);
            }
            
            .button-icon {
                font-size: 24px;
                display: block;
                line-height: 1;
            }
            
            .button-text {
                font-size: 13px;
                font-weight: 600;
                color: #495057;
                white-space: nowrap;
                letter-spacing: 0.3px;
            }
            
            /* 🎨 状態別色分け */
            .voice-mic-icon.starting { color: #6c757d; }
            .voice-mic-icon.active { color: #28a745; }
            .voice-mic-icon.stopping { color: #ffc107; }
            .voice-mic-icon.error { color: #dc3545; }
            .voice-mic-icon.network-error { color: #dc3545; }
            .voice-mic-icon.permission-denied { color: #dc3545; }
            .voice-mic-icon.idle { color: #6c757d; }
            
            /* 🎬 アニメーション */
            @keyframes pulse {
                0%, 100% { 
                    transform: scale(1.15);
                    filter: drop-shadow(0 6px 12px rgba(40, 167, 69, 0.4));
                }
                50% { 
                    transform: scale(1.25);
                    filter: drop-shadow(0 8px 16px rgba(40, 167, 69, 0.6));
                }
            }
            
            /* 📱 モバイル対応 */
            @media (max-width: 768px) {
                .voice-integrated-control {
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    transform: none;
                    min-width: auto;
                    padding: 20px;
                }
                
                .voice-button-section {
                    gap: 15px;
                }
                
                .voice-toggle-button,
                .voice-end-button {
                    flex: 1;
                    min-width: auto;
                }
            }
            
            /* 🎯 高解像度対応 */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
                .voice-integrated-control {
                    border-width: 1px;
                }
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ 洗練されたスタイル注入完了');
    }

    // =================================================================================
    // 公開メソッド
    // =================================================================================
    
    // 音声認識継続処理サポート機能（UI表示無効化時も動作）
    isUserPausedManually() {
        // 🔧 UI表示が無効化されていてもこの機能は提供
        if (!this.enabled) {
            console.log('🚫 VoiceUIManager: システム無効化により手動一時停止チェック不可');
            return false;
        }
        
        // UI表示無効化時は常にfalse（手動一時停止なし）
        if (!this.uiDisplay) {
            return false;
        }
        
        return this.userPausedManually;
    }

    resetUserPauseFlag() {
        // 🔧 UI表示が無効化されていてもこの機能は提供
        if (!this.enabled) {
            console.log('🚫 VoiceUIManager: システム無効化により手動一時停止リセット不可');
            return;
        }
        
        this.userPausedManually = false;
        console.log('🔄 手動一時停止フラグをリセット');
    }
}

// =================================================================================
// グローバル初期化
// =================================================================================

// 🔧 フラグベースの条件付きインスタンス作成
if (VOICE_UI_MANAGER_CONFIG.ENABLED || VOICE_UI_MANAGER_CONFIG.MANUAL_ONLY) {
    // VoiceUIManagerのインスタンスを作成
    window.VoiceUIManager = new VoiceUIManager();
    
    // 初期化関数をグローバルに公開
    window.initializeVoiceUI = async function() {
        // 🔧 無効化チェック
        if (!VOICE_UI_MANAGER_CONFIG.ENABLED) {
            console.log('🚫 VoiceUIManager: 無効化により初期化をスキップ');
            return false;
        }
        
        // メイン画面でのみ初期化を実行
        const chatArea = document.getElementById('chatArea');
        const setupPanel = document.getElementById('setupPanel');
        
        // ログイン画面の場合は初期化しない
        if (!chatArea || !setupPanel || !chatArea.classList.contains('hidden')) {
            console.log('🔇 ログイン画面のためVoiceUI初期化をスキップ');
            return false;
        }
        
        // メイン画面でのみ初期化実行
        return await window.VoiceUIManager.initialize();
    };
    
    // 🔧 手動有効化関数
    window.enableVoiceUI = function() {
        VOICE_UI_MANAGER_CONFIG.ENABLED = true;
        console.log('✅ VoiceUIManager: 手動で有効化されました');
        return true;
    };
    
    // 🔧 手動無効化関数
    window.disableVoiceUI = function() {
        VOICE_UI_MANAGER_CONFIG.ENABLED = false;
        if (window.VoiceUIManager && window.VoiceUIManager.isInitialized) {
            window.VoiceUIManager.hide();
        }
        console.log('🚫 VoiceUIManager: 手動で無効化されました');
        return true;
    };
    
} else {
    console.log('🚫 VoiceUIManager: 完全無効化により作成をスキップ');
}

// 🔧 自動初期化を完全無効化
if (VOICE_UI_MANAGER_CONFIG.AUTO_INITIALIZE && VOICE_UI_MANAGER_CONFIG.ENABLED) {
    // 自動初期化コード（現在は無効化）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.initializeVoiceUI(), 1000);
        });
    } else {
        setTimeout(() => window.initializeVoiceUI(), 1000);
    }
} else {
    console.log('🚫 VoiceUIManager: 自動初期化無効化');
}

console.log('🎨 VoiceUIManager v0.8.0.3 読み込み完了 - 条件付き無効化実装'); 