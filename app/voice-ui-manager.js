/**
 * 音声認識UI管理システム
 * マイクボタン状態表示とビジュアルフィードバック
 */
class VoiceUIManager {
    constructor() {
        this.currentState = 'idle';
        this.currentErrorType = null;
        this.statusTextElement = null;
        this.microphoneButton = null;
        this.isInitialized = false;
        
        // 状態別テキスト表示
        this.statusTexts = {
            'idle': '音声認識準備完了',
            'starting': '音声認識を開始中...',
            'active': '音声認識中 - クリックで一時停止',
            'stopping': '音声認識一時停止中 - クリックで再開',
            'error': '音声認識エラー - クリックで再開'
        };
        
        // エラー種別別メッセージ
        this.errorMessages = {
            'aborted': '音声認識が予期せず停止しました',
            'network': 'ネットワーク接続を確認してください',
            'audio-capture': 'マイクへのアクセスに問題があります',
            'not-allowed': 'マイクの使用許可が必要です'
        };
        
        // ビジュアル状態インジケーター
        this.visualStates = {
            'idle': { color: '#9E9E9E', icon: '🎤', text: '音声認識準備完了' },
            'starting': { color: '#2196F3', icon: '⏳', text: '音声認識を開始中...' },
            'active': { color: '#4CAF50', icon: '🎤', text: '音声認識中 - クリックで一時停止' },
            'stopping': { color: '#FF9800', icon: '⏸️', text: '音声認識一時停止中 - クリックで再開' },
            'error': { color: '#f44336', icon: '⚠️', text: '音声認識エラー - クリックで再開' },
            'network-error': { color: '#FF5722', icon: '🌐', text: 'ネットワーク接続を確認してください' },
            'mic-denied': { color: '#9C27B0', icon: '🚫', text: 'マイクの使用許可が必要です' }
        };
    }

    /**
     * UI要素の初期化
     */
    initialize() {
        console.log('🎨 VoiceUIManager初期化開始');
        
        // マイクボタンの取得
        this.microphoneButton = document.getElementById('microphone-btn');
        if (!this.microphoneButton) {
            console.warn('⚠️ マイクボタンが見つかりません');
            return false;
        }
        
        // 状態表示テキスト要素を作成または取得
        this.createStatusTextElement();
        
        this.isInitialized = true;
        console.log('✅ VoiceUIManager初期化完了');
        
        // 初期状態を設定
        this.updateStatus('idle');
        
        return true;
    }

    /**
     * 状態表示テキスト要素の作成
     */
    createStatusTextElement() {
        // 既存の要素を探す
        this.statusTextElement = document.getElementById('mic-status-text');
        
        if (!this.statusTextElement) {
            console.log('🔧 マイク状態テキスト要素を作成');
            
            // 新しい要素を作成
            this.statusTextElement = document.createElement('div');
            this.statusTextElement.id = 'mic-status-text';
            this.statusTextElement.className = 'mic-status-text';
            
            // マイクボタンの親要素に追加
            const micContainer = this.microphoneButton.closest('.microphone-container') || 
                                this.microphoneButton.parentElement;
            
            if (micContainer) {
                micContainer.appendChild(this.statusTextElement);
            } else {
                // フォールバック：マイクボタンの後に挿入
                this.microphoneButton.insertAdjacentElement('afterend', this.statusTextElement);
            }
            
            // 基本スタイルを設定
            this.applyStatusTextStyles();
        }
    }

    /**
     * 状態テキストの基本スタイル適用
     */
    applyStatusTextStyles() {
        if (!this.statusTextElement) return;
        
        Object.assign(this.statusTextElement.style, {
            marginTop: '8px',
            fontSize: '12px',
            textAlign: 'center',
            fontWeight: '500',
            transition: 'color 0.3s ease',
            minHeight: '16px',
            lineHeight: '16px'
        });
    }

    /**
     * 状態の更新
     */
    updateStatus(state, errorType = null) {
        if (!this.isInitialized) {
            console.warn('⚠️ VoiceUIManager未初期化 - 状態更新をスキップ');
            return;
        }
        
        this.currentState = state;
        this.currentErrorType = errorType;
        
        console.log(`🎨 UI状態更新: ${state}${errorType ? ` (${errorType})` : ''}`);
        
        // ビジュアル状態の決定
        let visualState = this.getVisualState(state, errorType);
        
        // マイクボタンの更新
        this.updateMicrophoneButton(visualState);
        
        // 状態テキストの更新
        this.updateStatusText(visualState);
        
        // デバッグ情報
        console.log(`✅ UI更新完了: ${visualState.text}`);
    }

    /**
     * ビジュアル状態の決定
     */
    getVisualState(state, errorType) {
        // エラー状態の場合、エラー種別に応じた表示
        if (state === 'error' && errorType) {
            switch (errorType) {
                case 'network':
                    return this.visualStates['network-error'];
                case 'not-allowed':
                    return this.visualStates['mic-denied'];
                default:
                    return {
                        ...this.visualStates['error'],
                        text: this.errorMessages[errorType] || '音声認識エラー - クリックで再開'
                    };
            }
        }
        
        return this.visualStates[state] || this.visualStates['error'];
    }

    /**
     * マイクボタンの更新
     */
    updateMicrophoneButton(visualState) {
        if (!this.microphoneButton) return;
        
        // ボタンの背景色
        this.microphoneButton.style.backgroundColor = visualState.color;
        
        // アイコンの更新
        const iconElement = this.microphoneButton.querySelector('.mic-icon') || 
                           this.microphoneButton.querySelector('span') ||
                           this.microphoneButton;
        
        if (iconElement) {
            iconElement.textContent = visualState.icon;
        }
        
        // ボタンのタイトル（ホバー時表示）
        this.microphoneButton.title = visualState.text;
    }

    /**
     * 状態テキストの更新
     */
    updateStatusText(visualState) {
        if (!this.statusTextElement) return;
        
        this.statusTextElement.textContent = visualState.text;
        this.statusTextElement.style.color = visualState.color;
    }

    /**
     * エラー履歴の表示
     */
    showErrorHistory(errorStats) {
        if (!errorStats || errorStats.errorCount === 0) return;
        
        console.log(`📊 エラー履歴表示: ${errorStats.errorCount}回のエラー`);
        
        // 簡易エラー履歴をステータステキストに追加表示
        if (this.statusTextElement && this.currentState === 'error') {
            const historyText = `\n(エラー ${errorStats.errorCount}回発生)`;
            this.statusTextElement.innerHTML = 
                this.statusTextElement.textContent + 
                '<br><small style="opacity: 0.7;">' + 
                `エラー ${errorStats.errorCount}回発生` + 
                '</small>';
        }
    }

    /**
     * 統計情報の表示
     */
    displayStats(stats) {
        console.log('📊 統計情報表示:', {
            startCount: stats.startCount,
            efficiency: stats.efficiency,
            microphonePermissionRequests: stats.microphonePermissionRequests
        });
        
        // デバッグ用：コンソールに統計表示
        if (stats.startCount > 1) {
            console.warn(`⚠️ start()呼び出し回数: ${stats.startCount}回 (目標: 1回)`);
        }
        
        if (stats.efficiency < 100) {
            console.warn(`⚠️ 効率性: ${stats.efficiency}% (目標: 100%)`);
        }
    }

    /**
     * カスタムメッセージの表示
     */
    showCustomMessage(message, duration = 3000) {
        if (!this.statusTextElement) return;
        
        const originalText = this.statusTextElement.textContent;
        this.statusTextElement.textContent = message;
        this.statusTextElement.style.color = '#FF9800'; // オレンジ色
        
        setTimeout(() => {
            // 元の状態に戻す
            this.updateStatus(this.currentState, this.currentErrorType);
        }, duration);
    }

    /**
     * デバッグ情報の表示
     */
    debugInfo() {
        console.log('🔍 VoiceUIManager Debug Info:', {
            isInitialized: this.isInitialized,
            currentState: this.currentState,
            currentErrorType: this.currentErrorType,
            hasStatusTextElement: !!this.statusTextElement,
            hasMicrophoneButton: !!this.microphoneButton
        });
    }

    /**
     * UI要素のクリーンアップ
     */
    cleanup() {
        console.log('🧹 VoiceUIManager クリーンアップ');
        
        // 作成した要素の削除
        if (this.statusTextElement && this.statusTextElement.parentElement) {
            this.statusTextElement.parentElement.removeChild(this.statusTextElement);
        }
        
        this.isInitialized = false;
        this.statusTextElement = null;
        this.microphoneButton = null;
    }
}

// グローバル利用のためのエクスポート
if (typeof window !== 'undefined') {
    window.VoiceUIManager = VoiceUIManager;
}

// モジュールエクスポート（将来的なモジュール化対応）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceUIManager;
} 