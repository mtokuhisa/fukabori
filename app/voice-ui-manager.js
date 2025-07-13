// =================================================================================
// VOICE UI MANAGER - 音声UI管理システム v0.8.14
// =================================================================================
// 
// 🎨 洗練されたデザイン要件対応：
// - 中央下部（統合コントロール）固定配置（ポップアップではない）
// - 大きなマイクアイコンメイン（48px）
// - 操作ボタン（アイコン+テキスト）
// - 手動一時停止機能
// - 洗練されたデザイン
// 
// =================================================================================

class VoiceUIManager {
    constructor() {
        this.isInitialized = false;
        this.voiceModule = null;
        this.elements = {};
        this.userPausedManually = false; // ユーザーが手動で一時停止したかのフラグ
        
        // 🎨 洗練されたデザイン設定
        this.stateConfig = {
            colors: {
                'starting': '#6c757d',     // グレー
                'active': '#28a745',       // グリーン
                'stopping': '#ffc107',     // イエロー
                'error': '#dc3545',        // レッド
                'network-error': '#dc3545', // レッド
                'permission-denied': '#dc3545', // レッド
                'idle': '#6c757d'          // グレー
            },
            messages: {
                'starting': '認識を開始しています...',
                'active': '音声認識中',
                'stopping': '一時停止中',
                'error': '認識エラー',
                'network-error': 'ネットワークエラー',
                'permission-denied': 'マイクの許可が必要です',
                'idle': '待機中'
            }
        };
        
        console.log('🎨 VoiceUIManager初期化完了 - 洗練されたデザイン v0.8.14');
    }

    // =================================================================================
    // 初期化
    // =================================================================================
    
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ VoiceUIManager既に初期化済み');
            return;
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
        this.elements = {
            container: voiceUI,
            micIcon: document.getElementById('voiceMicIcon'),
            stateText: document.getElementById('voiceStateText'),
            toggleButton: document.getElementById('voiceToggleButton'),
            endButton: document.getElementById('voiceEndButton')
        };
        
        console.log('✅ 音声UI作成完了');
    }

    // =================================================================================
    // イベントリスナー設定
    // =================================================================================
    
    setupEventListeners() {
        // 一時停止/再開ボタン
        this.elements.toggleButton.addEventListener('click', () => {
            this.handleToggleClick();
        });
        
        // セッション終了ボタン
        this.elements.endButton.addEventListener('click', () => {
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
        const micIcon = this.elements.micIcon;
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
        const stateText = this.elements.stateText;
        if (!stateText) return;
        
        const message = this.stateConfig.messages[state] || '不明な状態';
        stateText.textContent = message;
        stateText.style.color = this.stateConfig.colors[state] || '#6c757d';
    }

    updateToggleButton(state) {
        const toggleButton = this.elements.toggleButton;
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
        if (this.elements.container) {
            this.elements.container.style.display = 'flex';
            console.log('✅ 音声UI表示');
        }
    }

    hide() {
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
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
    
    // 手動一時停止フラグの取得
    isUserPausedManually() {
        return this.userPausedManually;
    }
    
    // 手動一時停止フラグのリセット
    resetUserPauseFlag() {
        this.userPausedManually = false;
    }
}

// =================================================================================
// グローバル初期化
// =================================================================================

// VoiceUIManagerのインスタンスを作成
window.VoiceUIManager = new VoiceUIManager();

// 初期化関数をグローバルに公開
window.initializeVoiceUI = async function() {
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

// 自動初期化を無効化 - メイン画面遷移時のみ手動で初期化
// 以下のコードをコメントアウトして自動初期化を停止
/*
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.initializeVoiceUI(), 1000);
    });
} else {
    setTimeout(() => window.initializeVoiceUI(), 1000);
}
*/

console.log('🎨 VoiceUIManager v0.8.15 読み込み完了 - 自動初期化無効化'); 