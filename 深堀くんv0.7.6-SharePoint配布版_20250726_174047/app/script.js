// 深堀くんアプリ - メインスクリプト
// 元ファイル（深堀くんv063.html）準拠の完全版

// =================================================================================
// グローバル変数定義（最優先）
// =================================================================================

// 📊 知見管理システムの状態（グローバル定義）
window.KnowledgeState = {
    currentSession: null,
    categories: [],
    users: [],
    insights: [],
    qualityThreshold: 0.7,
    isInitialized: false
};

// 🎤 音声システムのグローバル変数
window.stateManager = null;

// =================================================================================
// STEP 1: 段階的復元 - 切り替え設定
// =================================================================================

// 🎯 Step 1: 段階的切り替え設定
const MIGRATION_CONFIG = {
    USE_NEW_TRANSCRIPT: true,           // transcript-display システム使用
    ENABLE_FALLBACK: true,              // フォールバック機能有効
    GRADUAL_MIGRATION: true,            // 段階的移行有効
    PRESERVE_EXISTING_FUNCTIONS: true,  // 既存機能の保持
    DEBUG_MODE: true                    // デバッグモード（開発時のみ）
};

// 🛡️ 緊急ロールバック機能
window.emergencyRollback = function() {
    console.log('🚨 緊急ロールバック開始');
    
    // transcript-display システムを使用
    MIGRATION_CONFIG.USE_NEW_TRANSCRIPT = true;
    
    const transcriptDisplay = document.getElementById('transcriptDisplay');
    
    if (transcriptDisplay) {
        transcriptDisplay.style.display = 'block';
        console.log('✅ transcript-display 有効化完了');
    }
    
    // 既存の更新関数を使用
    if (typeof updateRealtimeTranscript === 'function') {
        updateRealtimeTranscript('緊急ロールバック完了');
    }
    
    console.log('🚨 緊急ロールバック完了');
    return true;
};

// 🔄 段階的切り替え機能
window.switchToNewTranscript = function() {
    console.log('🔄 新しいtranscript表示に切り替え開始');
    
    if (!MIGRATION_CONFIG.GRADUAL_MIGRATION) {
        console.warn('⚠️ 段階的移行が無効化されています');
        return false;
    }
    
    try {
        // transcript-display システムを有効化
        MIGRATION_CONFIG.USE_NEW_TRANSCRIPT = true;
        
        // 表示を確認
        const transcriptDisplay = document.getElementById('transcriptDisplay');
        
        if (transcriptDisplay) {
            transcriptDisplay.style.display = 'block';
            console.log('✅ transcript-display 有効化完了');
        }
        
        // 新システムのテスト
        const testResult = testNewTranscriptSystem();
        if (!testResult) {
            console.error('❌ 新システムのテストに失敗、ロールバック実行');
            window.emergencyRollback();
            return false;
        }
        
        console.log('✅ 新しいtranscript表示に切り替え完了');
        return true;
        
    } catch (error) {
        console.error('❌ 切り替え中にエラー発生:', error);
        window.emergencyRollback();
        return false;
    }
};

// 🧪 新システムのテスト機能
function testNewTranscriptSystem() {
    console.log('🧪 新システムのテスト開始');
    
    try {
        const transcriptDisplay = document.getElementById('transcriptDisplay');
        
        // 要素の存在確認
        if (!transcriptDisplay) {
            console.error('❌ transcript-display要素が見つかりません');
            return false;
        }
        
        // 表示状態の確認
        const isVisible = transcriptDisplay.style.display !== 'none';
        if (!isVisible) {
            console.error('❌ transcript-display が表示されていません');
            return false;
        }
        
        // 更新機能のテスト
        const testMessage = 'テストメッセージ - ' + Date.now();
        transcriptDisplay.textContent = testMessage;
        
        // 確認
        if (transcriptDisplay.textContent.includes('テストメッセージ')) {
            console.log('✅ 新システムのテスト完了');
            return true;
        } else {
            console.error('❌ 新システムの更新機能テストに失敗');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 新システムのテスト中にエラー:', error);
        return false;
    }
}

// 🔧 段階的初期化関数
function initializeMigrationSystem() {
    console.log('🔧 段階的移行システム初期化');
    
    // 設定の確認
    console.log('📋 移行設定:', MIGRATION_CONFIG);
    
    // 両システムの確認
    const transcriptCompact = document.getElementById('transcriptCompact');
    const transcriptDisplay = document.getElementById('transcriptDisplay');
    
    console.log('🔍 システム確認:');
    console.log('  - transcript-compact:', !!transcriptCompact);
    console.log('  - transcript-display:', !!transcriptDisplay);
    
    // transcript-displayシステムを使用
    console.log('🎯 transcript-displayシステムを使用開始');
    if (transcriptDisplay) {
        transcriptDisplay.style.display = 'block';
        console.log('✅ transcript-display 有効化完了');
    }
    
    console.log('✅ 段階的移行システム初期化完了');
}

// 📝 リアルタイム文字起こし編集システム初期化
async function initializeTranscriptEditSystem() {
    try {
        console.log('📝 TranscriptEditManager初期化開始...');
        
        // TranscriptEditManagerクラスの存在確認
        if (typeof window.TranscriptEditManager !== 'function') {
            console.warn('⚠️ TranscriptEditManagerクラスが見つかりません');
            return false;
        }
        
        // EditableTranscriptUIクラスの存在確認
        if (typeof window.EditableTranscriptUI !== 'function') {
            console.warn('⚠️ EditableTranscriptUIクラスが見つかりません');
            return false;
        }
        
        // TranscriptEditManagerインスタンス作成
        window.transcriptEditManager = new window.TranscriptEditManager();
        
        // 初期化実行
        const initialized = await window.transcriptEditManager.initialize();
        if (!initialized) {
            console.error('❌ TranscriptEditManager初期化失敗');
            return false;
        }
        
        // EditableTranscriptUIとの連携設定
        if (window.transcriptEditManager.transcriptDisplay) {
            window.transcriptEditManager.editableUI = new window.EditableTranscriptUI(
                window.transcriptEditManager.transcriptDisplay
            );
            
            // カスタムイベントリスナー設定
            window.transcriptEditManager.transcriptDisplay.addEventListener('transcriptEditComplete', async (event) => {
                const newText = event.detail.text;
                await window.transcriptEditManager.finishEditing(newText);
            });
            
            window.transcriptEditManager.transcriptDisplay.addEventListener('transcriptEditCancel', async () => {
                await window.transcriptEditManager.cancelEditing();
            });
            
            console.log('✅ EditableTranscriptUIとの連携設定完了');
        }
        
        // グローバル状態更新
        if (window.AppState) {
            window.AppState.transcriptEditEnabled = true;
        }
        
        console.log('✅ transcript編集システム初期化完了');
        return true;
        
    } catch (error) {
        console.error('❌ transcript編集システム初期化エラー:', error);
        
        // 緊急フォールバック: システム無効化
        if (window.transcriptEditManager) {
            window.transcriptEditManager.emergencyDisable();
        }
        
        return false;
    }
}

// 🧪 開発者向けテスト機能
window.testMigrationSystem = function() {
    console.log('🧪 段階的移行システムテスト開始');
    
    const results = {
        configTest: false,
        elementsTest: false,
        switchTest: false,
        rollbackTest: false,
        overallSuccess: false
    };
    
    try {
        // 1. 設定テスト
        console.log('📋 1. 設定テスト');
        if (typeof MIGRATION_CONFIG === 'object' && MIGRATION_CONFIG.GRADUAL_MIGRATION) {
            results.configTest = true;
            console.log('  ✅ 設定テスト成功');
        } else {
            console.log('  ❌ 設定テスト失敗');
        }
        
        // 2. 要素存在テスト
        console.log('📋 2. 要素存在テスト');
        const transcriptCompact = document.getElementById('transcriptCompact');
        const transcriptDisplay = document.getElementById('transcriptDisplay');
        
        if (transcriptCompact && transcriptDisplay) {
            results.elementsTest = true;
            console.log('  ✅ 要素存在テスト成功');
            console.log('    - transcript-compact:', !!transcriptCompact);
            console.log('    - transcript-display:', !!transcriptDisplay);
        } else {
            console.log('  ❌ 要素存在テスト失敗');
            console.log('    - transcript-compact:', !!transcriptCompact);
            console.log('    - transcript-display:', !!transcriptDisplay);
        }
        
        // 3. 切り替えテスト
        console.log('📋 3. 切り替えテスト');
        try {
            const originalState = MIGRATION_CONFIG.USE_NEW_TRANSCRIPT;
            const switchResult = window.switchToNewTranscript();
            
            if (switchResult) {
                results.switchTest = true;
                console.log('  ✅ 切り替えテスト成功');
                
                // 元の状態に戻す
                if (!originalState) {
                    window.emergencyRollback();
                }
            } else {
                console.log('  ❌ 切り替えテスト失敗');
            }
        } catch (error) {
            console.log('  ❌ 切り替えテスト中にエラー:', error);
        }
        
        // 4. ロールバックテスト
        console.log('📋 4. ロールバックテスト');
        try {
            const rollbackResult = window.emergencyRollback();
            if (rollbackResult) {
                results.rollbackTest = true;
                console.log('  ✅ ロールバックテスト成功');
            } else {
                console.log('  ❌ ロールバックテスト失敗');
            }
        } catch (error) {
            console.log('  ❌ ロールバックテスト中にエラー:', error);
        }
        
        // 総合判定
        results.overallSuccess = results.configTest && results.elementsTest && results.switchTest && results.rollbackTest;
        
        console.log('📊 テスト結果:', results);
        
        if (results.overallSuccess) {
            console.log('🎉 段階的移行システムテスト完全成功！');
            if (typeof window.showMessage === 'function') {
                window.showMessage('success', '段階的移行システムテスト完全成功！');
            }
        } else {
            console.log('⚠️ 段階的移行システムテストで問題が検出されました');
            if (typeof window.showMessage === 'function') {
                window.showMessage('warning', '段階的移行システムテストで問題が検出されました。詳細はコンソールを確認してください。');
            }
        }
        
    } catch (error) {
        console.error('❌ テスト実行中にエラー:', error);
        if (typeof window.showMessage === 'function') {
            window.showMessage('error', 'テスト実行中にエラーが発生しました: ' + error.message);
        }
    }
    
    return results;
};

// 🔧 簡易テスト機能（ユーザー向け）
window.quickTestTranscript = function() {
    console.log('🧪 簡易transcript表示テスト');
    
    const transcriptCompact = document.getElementById('transcriptCompact');
    const transcriptDisplay = document.getElementById('transcriptDisplay');
    
    if (transcriptCompact && transcriptDisplay) {
        // 現在の状態を確認
        const compactVisible = transcriptCompact.style.display !== 'none';
        const displayVisible = transcriptDisplay.style.display !== 'none';
        
        console.log('📋 現在の状態:');
        console.log('  - transcript-compact 表示:', compactVisible);
        console.log('  - transcript-display 表示:', displayVisible);
        
        if (typeof window.showMessage === 'function') {
            window.showMessage('info', `現在の状態 - Compact: ${compactVisible ? '表示' : '非表示'}, Display: ${displayVisible ? '表示' : '非表示'}`);
        }
        
        return {
            compactVisible,
            displayVisible,
            systemReady: true
        };
    } else {
        console.log('❌ 要素が見つかりません');
        if (typeof window.showMessage === 'function') {
            window.showMessage('error', '要素が見つかりません');
        }
        return { systemReady: false };
    }
};

// =================================================================================
// 音声認識システム - 抜本解決版
// =================================================================================

// 🔧 A/Bテスト機能: マイク許可保持戦略の切り替え
const MICROPHONE_STRATEGY = {
    LEGACY: 'legacy',           // 従来システム（完全クリーンアップ）
    LIGHTWEIGHT: 'lightweight', // 軽量リスタート（現在の実装）
    PERSISTENT: 'persistent',   // インスタンス不変戦略（Chrome最適化）
    CONTINUOUS: 'continuous'    // 継続的音声認識（真の解決策）
};

// 🔧 現在の戦略を設定（開発時は動的切り替え可能）
window.CURRENT_MICROPHONE_STRATEGY = MICROPHONE_STRATEGY.CONTINUOUS; // Chrome専用の真の解決策

// 🔧 PermissionManager: voice-core.jsに移動済み
// 新しい音声コアシステムを使用: window.VoiceCore.permission

// 🔧 新しい統一状態管理システムを使用
// 既存のContinuousRecognitionManagerは削除済み - 新システムに完全移行
    
// 🔧 統一状態管理システムの初期化
async function initializeUnifiedStateManager() {
    try {
        console.log('🔄 統一状態管理システム初期化開始');
        
        // 統一状態管理システムのコアを初期化
        if (window.UnifiedStateManagerCore) {
            window.unifiedStateManager = new window.UnifiedStateManagerCore();
            await window.unifiedStateManager.initialize();
            console.log('✅ 統一状態管理システム初期化完了');
            return true;
            } else {
            console.warn('⚠️ 統一状態管理システムが見つかりません - フォールバック使用');
            return false;
            }
        } catch (error) {
        console.error('❌ 統一状態管理システム初期化エラー:', error);
        return false;
    }
}

// =================================================================================
// 新しい音声認識システム - 統一状態管理システム統合
// =================================================================================

// 🎤 グローバル音声認識制御
window.voiceRecognitionController = {
    isInitialized: false,
    voiceModule: null,
    
    // 初期化
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            console.log('🎤 音声認識制御システム初期化開始');
            
            // 統一状態管理システムから音声モジュールを取得
            if (window.unifiedStateManager) {
                this.voiceModule = window.unifiedStateManager.getModule('voice');
                if (this.voiceModule) {
                    this.isInitialized = true;
                    console.log('✅ 音声認識制御システム初期化完了');
                    return true;
                }
            }
            
            console.warn('⚠️ 統一状態管理システムが利用できません');
                return false;
            
        } catch (error) {
            console.error('❌ 音声認識制御システム初期化エラー:', error);
                    return false;
                }
    },
    
    // 音声認識開始
    async startRecognition() {
        if (!this.isInitialized || !this.voiceModule) {
            console.warn('⚠️ 音声認識制御システムが初期化されていません');
            return false;
        }
        
        return await this.voiceModule.startRecognition();
    },
    
    // 音声認識停止
    async stopRecognition() {
        if (!this.isInitialized || !this.voiceModule) {
            console.warn('⚠️ 音声認識制御システムが初期化されていません');
            return false;
        }
        
        return this.voiceModule.stopRecognition();
    },
    
    // 状態取得
    getState() {
        if (!this.isInitialized || !this.voiceModule) {
            return { recognitionState: 'unavailable' };
        }
        
        return this.voiceModule.getState();
    }
}

// =================================================================================
// 削除されたレガシーコード - 新しい音声システムに移行済み
// =================================================================================

// 🔧 レガシー関数は削除 - 新しい統一状態管理システムに移行済み
// 以下の関数は app/unified-state-manager/voice-module.js に移動済み:
// - resumeProcessing()
// - forceStop()
// - stop()
// - createRecognition()

// =================================================================================
// 削除されたレガシーコード（続き）
// =================================================================================

// 🔧 以下のレガシー関数は削除 - 新しい統一状態管理システムに移行済み:
// - startContinuityMonitor()
// - performAutoRecovery()
// - stopContinuityMonitor()
// - preemptiveRestart()
// - setupEventHandlers()
// - handleResult()
// - handleRecognitionError()
// - handleEnd()
// - notifyListeners()
// - getState()
// - addListener()
// - removeListener()

// 🔧 新しい音声システムは以下を使用:
// - window.VoiceModule (app/unified-state-manager/voice-module.js)
// - window.VoiceSystemInitializer (app/voice-error-handler.js)

// =================================================================================
// 既存のメインシステム（継続使用）
// =================================================================================

// 🔧 レガシー関数は削除済み - 新しい統一状態管理システムに移行済み
// これらの機能は以下のファイルで提供されています:
// - app/unified-state-manager/voice-module.js
// - app/voice-ui-manager.js  
// - app/voice-error-handler.js

// 🔧 AudioManager: voice-core.jsに移動済み
// 新しい音声コアシステムを使用: window.VoiceCore.audio

// 🔧 StateManager: 全体状態の一元管理
class StateManager {
    constructor() {
        // 🆕 新しい音声コアシステムを使用
        this.permissionManager = window.VoiceCore?.permission || new PermissionManager();
        
        // 🔧 A/Bテスト: 戦略に基づくRecognitionManager選択
        this.recognitionManager = this.createRecognitionManager();
        
        this.audioManager = window.VoiceCore?.audio || new AudioManager();
        
        // 🔧 許可状態の同期強化
        if (window.VoiceCore?.permission) {
            console.log('🔄 VoiceCore許可マネージャーを使用');
        } else {
            console.log('⚠️ VoiceCore未読み込み - フォールバック使用');
        }
        
        this.setupStateSync();
        console.log(`✅ StateManager初期化完了（戦略: ${window.CURRENT_MICROPHONE_STRATEGY}）`);
    }
    
    // 🔧 A/Bテスト: RecognitionManager作成
    createRecognitionManager() {
        const strategy = window.CURRENT_MICROPHONE_STRATEGY || MICROPHONE_STRATEGY.CONTINUOUS;
        
        // 🔧 新しい統一状態管理システムを使用
        console.log(`🔄 統一状態管理システム使用（戦略: ${strategy}）`);
        
        // 統一状態管理システムから音声モジュールを取得
        if (window.unifiedStateManager) {
            return window.unifiedStateManager.getModule('voice');
        }
        
        // フォールバック: 基本的な音声認識オブジェクトを返す
        return {
            state: 'idle',
            start: () => console.log('🔄 フォールバック音声認識開始'),
            stop: () => console.log('🔄 フォールバック音声認識停止'),
            addListener: () => {},
            removeListener: () => {}
        };
    }
    
    // 🔧 A/Bテスト: 戦略切り替え機能
    switchStrategy(newStrategy) {
        if (!Object.values(MICROPHONE_STRATEGY).includes(newStrategy)) {
            console.error(`❌ 無効な戦略: ${newStrategy}`);
            return false;
        }
        
        console.log(`🔄 戦略切り替え: ${window.CURRENT_MICROPHONE_STRATEGY} → ${newStrategy}`);
        
        // 現在のRecognitionManagerを停止
        if (this.recognitionManager) {
            this.recognitionManager.stop();
        }
        
        // 新しい戦略を設定
        window.CURRENT_MICROPHONE_STRATEGY = newStrategy;
        
        // 新しいRecognitionManagerを作成
        this.recognitionManager = this.createRecognitionManager();
        
        // 状態同期を再設定
        if (this.recognitionManager && typeof this.recognitionManager.addEventListener === 'function') {
            this.recognitionManager.addEventListener((state) => {
                console.log('🔄 音声認識状態変更:', state);
                this.updateUI();
            });
        } else if (this.recognitionManager && typeof this.recognitionManager.addListener === 'function') {
        this.recognitionManager.addListener((state) => {
            console.log('🔄 音声認識状態変更:', state);
            this.updateUI();
        });
        }
        
        console.log(`✅ 戦略切り替え完了: ${newStrategy}`);
        return true;
    }
    
    // 状態同期の設定
    setupStateSync() {
        // 許可状態変更時の処理
        if (this.permissionManager && typeof this.permissionManager.addListener === 'function') {
        this.permissionManager.addListener((state) => {
            console.log('🔄 許可状態変更:', state);
            this.updateUI();
        });
        }
        
        // 音声認識状態変更時の処理
        if (this.recognitionManager && typeof this.recognitionManager.addEventListener === 'function') {
            this.recognitionManager.addEventListener((state) => {
                console.log('🔄 音声認識状態変更:', state);
                this.updateUI();
            });
        } else if (this.recognitionManager && typeof this.recognitionManager.addListener === 'function') {
        this.recognitionManager.addListener((state) => {
            console.log('🔄 音声認識状態変更:', state);
            this.updateUI();
        });
        }
        
        // 音声再生状態変更時の処理
        if (this.audioManager && typeof this.audioManager.addListener === 'function') {
        this.audioManager.addListener((audioInfo) => {
            console.log('🔄 音声再生状態変更:', audioInfo.length, '件');
            this.updateUI();
        });
        }
    }
    
    // UI更新（状態に応じた表示制御）
    updateUI() {
        const permissionState = this.permissionManager.state;
        const recognitionState = this.recognitionManager.state;
        const audioInfo = this.audioManager.getActiveAudioInfo();
        
        // マイクボタンの状態更新
        this.updateMicrophoneButton(permissionState, recognitionState);
        
        // エラーメッセージの更新
        this.updateErrorMessages(permissionState, recognitionState);
        
        // 進行状況の更新
        this.updateProgress(permissionState, recognitionState, audioInfo);
    }
    
    // マイクボタン更新
    updateMicrophoneButton(permissionState, recognitionState) {
        const micButton = window.UIManager.DOMUtils.get('micButton');
        if (!micButton) return;
        
        let buttonClass = 'mic-button';
        let buttonText = '🎤';
        let isDisabled = false;
        
        switch (permissionState) {
            case 'denied':
                buttonClass += ' error';
                buttonText = '🚫';
                isDisabled = true;
                break;
            case 'requesting':
                buttonClass += ' loading';
                buttonText = '⏳';
                isDisabled = true;
                break;
            case 'granted':
                switch (recognitionState) {
                    case 'active':
                        buttonClass += ' recording';
                        buttonText = '🔴';
                        break;
                    case 'starting':
                    case 'stopping':
                        buttonClass += ' loading';
                        buttonText = '⏳';
                        isDisabled = true;
                        break;
                    case 'error':
                        buttonClass += ' error';
                        buttonText = '⚠️';
                        break;
                    default:
                        buttonClass += ' idle';
                        buttonText = '🎤';
                }
                break;
            default:
                buttonClass += ' idle';
                buttonText = '🎤';
        }
        
        micButton.className = buttonClass;
        micButton.textContent = buttonText;
        micButton.disabled = isDisabled;
    }
    
    // エラーメッセージ更新
    updateErrorMessages(permissionState, recognitionState) {
        if (permissionState === 'denied') {
            window.showMessage('error', 'マイクの使用許可が拒否されています。ブラウザの設定で許可し、ページを再読み込みしてください。');
        } else if (recognitionState === 'error') {
            window.showMessage('warning', '音声認識でエラーが発生しました。しばらく待ってから再試行してください。');
        }
    }
    
    // 進行状況更新
    updateProgress(permissionState, recognitionState, audioInfo) {
        const statusElement = window.UIManager.DOMUtils.get('sessionStatus');
        if (!statusElement) return;
        
        let statusText = '';
        
        if (permissionState === 'denied') {
            statusText = 'マイク許可が必要です';
        } else if (permissionState === 'requesting') {
            statusText = 'マイク許可を確認中...';
        } else if (recognitionState === 'starting') {
            statusText = '音声認識を開始中...';
        } else if (recognitionState === 'active') {
            statusText = '音声認識中...';
        } else if (recognitionState === 'stopping') {
            statusText = '音声認識を停止中...';
        } else if (recognitionState === 'error') {
            statusText = '音声認識エラー';
        } else if (audioInfo.length > 0) {
            statusText = `音声再生中 (${audioInfo.length}件)`;
        } else {
            statusText = '待機中';
        }
        
        statusElement.textContent = statusText;
    }
    
    // 音声認識開始
    async startRecognition() {
        console.log('🎤 音声認識開始要求');
        if (this.recognitionManager && typeof this.recognitionManager.startRecognition === 'function') {
            return await this.recognitionManager.startRecognition();
        } else if (this.recognitionManager && typeof this.recognitionManager.start === 'function') {
        return await this.recognitionManager.start();
        } else {
            throw new Error('音声認識マネージャーが利用できません');
        }
    }
    
    // 音声認識停止
    async stopRecognition() {
        console.log('🛑 音声認識停止要求');
        if (this.recognitionManager && typeof this.recognitionManager.stopRecognition === 'function') {
            return await this.recognitionManager.stopRecognition();
        } else if (this.recognitionManager && typeof this.recognitionManager.stop === 'function') {
        return await this.recognitionManager.stop();
        } else {
            throw new Error('音声認識マネージャーが利用できません');
        }
    }
    
    // 音声再生
    async playAudio(audioBlob, speaker) {
        console.log(`🎵 音声再生: ${speaker}`);
        
        const audioElement = new Audio(URL.createObjectURL(audioBlob));
        audioElement.volume = getVoiceSettings(speaker).volume;
        
        const audioId = this.audioManager.registerAudio(audioElement, 'tts', speaker);
        
        try {
            await audioElement.play();
            return audioId;
        } catch (error) {
            console.error('音声再生エラー:', error);
            this.audioManager.unregisterAudio({ id: audioId });
            throw error;
        }
    }
    
    // 全音声停止
    forceStopAllAudio(reason = 'user_request') {
        return this.audioManager.forceStopAllAudio(reason);
    }
    
    // 状態取得
    getState() {
        return {
            permission: this.permissionManager.state,
            recognition: this.recognitionManager.state,
            audio: this.audioManager.getActiveAudioInfo()
        };
    }
}

// =================================================================================
// CONSTANTS & STATE MANAGEMENT
// =================================================================================

const SPEAKERS = {
    NEHORI: 'nehori',
    HAHORI: 'hahori',
    USER: 'user',
    NULL: null
};

// 🔧 PHASES定数は app/phase-manager.js に移動しました
// 後方互換性は window.PHASES で保証

const MIC_STATES = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PROCESSING: 'processing'
};

// State: アプリケーション状態管理
const AppState = {
    apiKey: null,
    apiKeySource: null,         // 🔐 新機能: 'user' | 'embedded' | null
    currentTheme: '',
    sessionActive: false,
    currentSpeaker: SPEAKERS.NULL,
    phase: 'setup', // PhaseManagerで管理
    microphoneActive: false,
    speechRecognition: null,
    conversationHistory: [],
    extractedKnowledge: [],
    currentPoint: 0,
    participants: [],
    isProcessing: false,
    waitingForPermission: true,
    currentTranscript: '',
    transcriptHistory: [],
    sessionStartTime: null,
    allSessions: [],
    pendingKnowledge: null,
    extractedThemes: [],
    selectedThemes: [],
    currentDocument: null,
    selectedThemeDetails: [],
    documentContext: '',
    themeSummaries: {},
    // 🔧 音声認識安定化: 強化された音声認識状態管理
    voiceRecognitionStability: {
        micPermissionGranted: false,
        permissionRequestInProgress: false,
        consecutiveErrorCount: 0,
        lastErrorTime: null,
        maxConsecutiveErrors: 3,
        errorRecoveryDelay: 2000,
        isRecognitionActive: false,
        lastRestartTime: null,
        minRestartInterval: 1000,
        restartScheduled: false  // 🛡️ 再開スケジュール重複防止フラグ
    },
    // 🔧 新機能: 音声ベース知見評価設定
    knowledgeSettings: {
        autoRecordThreshold: 70,        // 自動記録閾値（初期値70点）
        showAutoRecordNotice: true,     // 自動記録時の音声通知
        showDetailedEvaluation: true,   // 詳細評価の表示
        saveThresholdChanges: true      // 閾値変更の保存
    },
    // 🔧 新機能: セッション統計
    sessionStats: {
        totalKnowledge: 0,              // 抽出された知見総数
        autoRecorded: 0,                // 自動記録された知見数
        manualConfirmed: 0,             // 手動確認された知見数
        rejected: 0,                    // 拒否された知見数
        averageScore: 0                 // 平均評価点
    },
    // 🔧 新機能: 音声認識状態管理
    voiceRecognitionState: {
        isKnowledgeConfirmationMode: false,  // 知見確認モード
        pendingKnowledgeEvaluation: null,    // 保留中の知見評価
        isWaitingForThresholdChange: false   // 閾値変更待機中
    },
    // 🔧 会話フロー制御: 厳格な順序管理
    conversationControl: {
        currentPhase: 'IDLE',  // IDLE, USER_SPEAKING, HAHORI_PROCESSING, KNOWLEDGE_CONFIRMATION, NEHORI_QUESTIONING
        lastSpeaker: null,
        speakingInProgress: false,
        pendingNehoriQuestion: null,
        pendingNehoriAudio: null,
        justPlayedPendingNehori: false,
        // 🔧 Phase C: はほりーの先読み機能追加
        pendingHahoriContent: null,
        pendingHahoriAudio: null,
        justPlayedPendingHahori: false,
        preventNehoriInterruption: false,
        // 🔧 強化された重複防止フラグ
        isExitingKnowledgeConfirmationMode: false,
        isResumeInProgress: false,
        questionGenerationScheduled: false,
        lastQuestionTime: null
    }
};

// 🔧 AppStateとSPEAKERSをグローバルに公開
window.AppState = AppState;
window.SPEAKERS = SPEAKERS;

// VoiceSettings: 音声設定管理
const VoiceSettings = {
    [SPEAKERS.NEHORI]: {
        voice: 'sage',
        speed: 1.2,
        volume: 0.8,
        prompt: ''
    },
    [SPEAKERS.HAHORI]: {
        voice: 'nova',
        speed: 1.1,
        volume: 0.8,
        prompt: ''
    }
};

// 🔧 音声システムPhase2: VoiceOptimization・DualPreemptiveOptimizationは
// app/voice-phase2-manager.js に分離済み
// 完全後方互換性のため、既存参照は window.VoiceOptimization、window.DualPreemptiveOptimization で維持

let currentTheme = 'blue';
let currentGuideStep = 1;

// =================================================================================
// CONVERSATION FLOW CONTROL - 会話フロー制御
// =================================================================================

// 🔧 新機能: 中央集権的な会話ゲートキーパー
const ConversationGatekeeper = {
    // ネほりーのの発話許可チェック
    canNehoriSpeak(context = 'unknown') {
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        // 📝 知見確認モード中は絶対にNG
        if (state.isKnowledgeConfirmationMode) {
            console.log(`🚫 知見確認モード中のためねほりーの発話をブロック (${context})`);
            return false;
        }
        
        // 🗣️ 他のAIが発話中はブロック
        if (control.speakingInProgress || AppState.currentSpeaker !== SPEAKERS.NULL) {
            console.log(`🚫 AI発話中のためねほりーの発話をブロック (${context})`);
            return false;
        }
        
        // 📝 知見確認中の割り込み防止
        if (control.preventNehoriInterruption) {
            console.log(`🚫 割り込み防止フラグアクティブのためブロック (${context})`);
            return false;
        }
        
        // 🔄 連続発話防止（強化版）
        if (control.lastSpeaker === SPEAKERS.NEHORI && control.justPlayedPendingNehori) {
            console.log(`🚫 連続発話防止のためブロック (${context})`);
            return false;
        }
        
        // 🔄 知見確認モード終了プロセス中の重複防止
        if (control.isExitingKnowledgeConfirmationMode || control.isResumeInProgress) {
            console.log(`🚫 知見確認モード終了処理中のためブロック (${context})`);
            return false;
        }
        
        // 🔄 質問生成スケジュール済みの重複防止
        if (control.questionGenerationScheduled) {
            console.log(`🚫 質問生成スケジュール中のためブロック (${context})`);
            return false;
        }
        
        // 🔄 最近の質問からの最小間隔チェック
        if (control.lastQuestionTime && Date.now() - control.lastQuestionTime < 2000) {
            console.log(`🚫 最近の質問から間隔が短いためブロック (${context})`);
            return false;
        }
        
        console.log(`✅ ねほりーの発話許可 (${context})`);
        return true;
    },
    
    // はほりーのの発話許可チェック（Phase C強化版）
    canHahoriSpeak(context = 'unknown') {
        const control = AppState.conversationControl;
        
        // 🗣️ 他のAIが発話中はブロック
        if (control.speakingInProgress || AppState.currentSpeaker !== SPEAKERS.NULL) {
            console.log(`🚫 AI発話中のためはほりーの発話をブロック (${context})`);
            return false;
        }
        
        // 🔄 連続発話防止
        if (control.lastSpeaker === SPEAKERS.HAHORI && control.justPlayedPendingHahori) {
            console.log(`🚫 連続発話防止のためブロック (${context})`);
            return false;
        }
        
        // 📝 知見確認モード中の特別処理
        if (AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
            console.log(`📝 知見確認モード中のはほりーの発話許可 (${context})`);
            return true; // 知見評価のため許可
        }
        
        console.log(`✅ はほりーの発話許可 (${context})`);
        return true;
    },
    
    // 発話開始を登録（Phase C強化版）
    registerSpeechStart(speaker, context = 'unknown') {
        console.log(`🎤 ${speaker}発話開始を登録 (${context})`);
        
        const control = AppState.conversationControl;
        control.speakingInProgress = true;
        control.lastSpeaker = speaker;
        AppState.currentSpeaker = speaker;
        
        // ネほりーの場合の特別処理
        if (speaker === SPEAKERS.NEHORI) {
            control.justPlayedPendingNehori = false;
            control.lastQuestionTime = Date.now();
            control.questionGenerationScheduled = false;
            
                    // 🔧 Phase C: ねほりーの発声開始時にはほりーの先読みを開始（状況適応版）
        if (window.DualPreemptiveOptimization?.phase1.isActive) {
            const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.NEHORI, null);
            const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
            
            if (strategy.trigger !== 'none' && strategy.targetSpeaker === SPEAKERS.HAHORI) {
                setTimeout(() => {
                    window.startHahoriGenerationDuringNehori();
                }, strategy.delay);
            }
        }
        }
        
        // 🔧 Phase C: はほりーの場合の特別処理（状況適応版）
        if (speaker === SPEAKERS.HAHORI) {
            control.justPlayedPendingHahori = false;
            
            // 🔧 Phase C: はほりーの発声開始時にねほりーの先読みを開始（状況適応版）
            if (window.DualPreemptiveOptimization?.phase1.isActive) {
                const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.HAHORI, null);
                const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
                
                if (strategy.trigger !== 'none' && strategy.targetSpeaker === SPEAKERS.NEHORI) {
                    setTimeout(() => {
                        window.startNehoriGenerationDuringHahori();
                    }, strategy.delay);
                }
            }
        }
    },
    
    // 発話終了を登録
    registerSpeechEnd(speaker, context = 'unknown') {
        console.log(`🏁 ${speaker}発話終了を登録 (${context})`);
        
        const control = AppState.conversationControl;
        control.speakingInProgress = false;
        AppState.currentSpeaker = SPEAKERS.NULL;
        
        // 知見確認モード中でなければ音声認識を再開
        if (!AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
            setTimeout(() => {
                safeStartSpeechRecognition(`${speaker}SpeechEnd`);
            }, 500);
        }
    },
    
    // 知見確認モードの開始
    enterKnowledgeConfirmationMode(context = 'unknown') {
        console.log(`📝 知見確認モード開始 (${context})`);
        
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        state.isKnowledgeConfirmationMode = true;
        control.preventNehoriInterruption = true;
        
        // 進行中のネほりーの生成を停止
        if (VoiceOptimization.phase3.isGeneratingNehori) {
            console.log('🛑 進行中のネほりーの生成を停止');
            VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
        }
        
        // 🔧 Phase C: 進行中のはほりーの生成も停止
        if (window.DualPreemptiveOptimization?.phase1.isGeneratingHahori) {
            console.log('🛑 進行中のはほりーの生成を停止');
            window.DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
        }
    },
    
    // 知見確認モードの終了（強化版）
    exitKnowledgeConfirmationMode(context = 'unknown') {
        console.log(`🏁 知見確認モード終了開始 (${context})`);
        
        const state = AppState.voiceRecognitionState;
        const control = AppState.conversationControl;
        
        // 重複防止フラグをセット
        control.isExitingKnowledgeConfirmationMode = true;
        
        // 既存の状態をクリア
        state.isKnowledgeConfirmationMode = false;
        state.pendingKnowledgeEvaluation = null;
        control.preventNehoriInterruption = false;
        
        // 少し待ってからPendingのAI応答を再生
        setTimeout(() => {
            // 🔧 Phase C: ねほりーのとはほりーのの両方のPendingをチェック
            this.resumePendingNehoriIfNeeded(context);
            window.playPendingHahoriIfNeeded();
            
            // フラグを解除
            setTimeout(() => {
                control.isExitingKnowledgeConfirmationMode = false;
            }, 100);
        }, 300);
        
        console.log(`🏁 知見確認モード終了処理完了 (${context})`);
    },
    
    // 🔧 最適化版: Pending統一管理システム（強化版）
    resumePendingNehoriIfNeeded(context = 'unknown') {
        const control = AppState.conversationControl;
        
        // 重複実行防止
        if (control.isResumeInProgress) {
            console.log('🔄 resumePendingNehoriIfNeeded 実行中のためスキップ');
            return;
        }
        
        control.isResumeInProgress = true;
        
        try {
            if (!this.canNehoriSpeak(`resumePending_${context}`)) {
                console.log('😴 Pendingネほりーの再生条件未満');
                return;
            }
            
            // 📦 統一Pendingデータ探索（優先度順）
            const pendingSources = this.collectAllPendingData();
            
            if (pendingSources.hasPending) {
                console.log(`🔄 Pendingネほりーを統一管理で再生 (${context}): ${pendingSources.source}`);
                
                // 安全な再生
                this.playUnifiedPendingNehori(pendingSources, context);
            } else {
                console.log('📝 Pendingデータがないため新しい質問を生成');
                
                // 質問生成スケジュールフラグをセット
                if (!control.questionGenerationScheduled) {
                    control.questionGenerationScheduled = true;
                    
                    // Pendingがない場合は新しい質問を生成
                    setTimeout(() => {
                        window.handleNehoriImmediatePlayback().catch(error => {
                            console.error('❌ 新しい質問生成エラー:', error);
                        }).finally(() => {
                            control.questionGenerationScheduled = false;
                        });
                    }, 500);
                }
            }
        } finally {
            // フラグを解除
            setTimeout(() => {
                control.isResumeInProgress = false;
            }, 100);
        }
    },
    
    // 🔧 新機能: 全てのPendingデータを統一収集（Phase C強化版）
    collectAllPendingData() {
        const control = AppState.conversationControl;
        
        // 優先度順: conversationControl > AppState > Phase3 > DualPreemptive
        if (control.pendingNehoriQuestion && control.pendingNehoriAudio) {
            return {
                hasPending: true,
                source: 'conversationControl',
                question: control.pendingNehoriQuestion,
                audio: control.pendingNehoriAudio,
                clearFunction: () => {
                    control.pendingNehoriQuestion = null;
                    control.pendingNehoriAudio = null;
                }
            };
        }
        
        if (AppState.pendingNehoriQuestion && AppState.pendingNehoriAudio) {
            return {
                hasPending: true,
                source: 'AppState',
                question: AppState.pendingNehoriQuestion,
                audio: AppState.pendingNehoriAudio,
                clearFunction: () => {
                    AppState.pendingNehoriQuestion = null;
                    AppState.pendingNehoriAudio = null;
                }
            };
        }
        
        if (VoiceOptimization.phase3.pendingNehoriContent && VoiceOptimization.phase3.pendingNehoriAudio) {
            return {
                hasPending: true,
                source: 'phase3Optimization',
                question: VoiceOptimization.phase3.pendingNehoriContent,
                audio: VoiceOptimization.phase3.pendingNehoriAudio,
                clearFunction: () => {
                    VoiceOptimization.phase3.pendingNehoriContent = null;
                    VoiceOptimization.phase3.pendingNehoriAudio = null;
                    VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
                }
            };
        }
        
        // 🔧 Phase C: はほりーのPendingデータも収集
        if (control.pendingHahoriContent && control.pendingHahoriAudio) {
            return {
                hasPending: true,
                source: 'conversationControlHahori',
                question: control.pendingHahoriContent,
                audio: control.pendingHahoriAudio,
                clearFunction: () => {
                    control.pendingHahoriContent = null;
                    control.pendingHahoriAudio = null;
                }
            };
        }
        
        if (window.DualPreemptiveOptimization?.phase1.pendingHahoriContent && window.DualPreemptiveOptimization.phase1.pendingHahoriAudio) {
            return {
                hasPending: true,
                source: 'dualPreemptiveOptimization',
                question: window.DualPreemptiveOptimization.phase1.pendingHahoriContent,
                audio: window.DualPreemptiveOptimization.phase1.pendingHahoriAudio,
                clearFunction: () => {
                    window.DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
                    window.DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
                    window.DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
                }
            };
        }
        
        return {
            hasPending: false,
            source: 'none'
        };
    },
    
    // 🔧 新機能: 統一Pendingネほりーの安全再生
    async playUnifiedPendingNehori(pendingData, context = 'unknown') {
        const control = AppState.conversationControl;
        
        try {
            this.registerSpeechStart(SPEAKERS.NEHORI, `unified_${pendingData.source}_${context}`);
            
            // メッセージ追加と音声再生
            await addMessageToChat(SPEAKERS.NEHORI, pendingData.question);
            await playPreGeneratedAudio(pendingData.audio, SPEAKERS.NEHORI);
            
            // 統一クリア処理
            pendingData.clearFunction();
            control.justPlayedPendingNehori = true;
            
            this.registerSpeechEnd(SPEAKERS.NEHORI, `unified_${pendingData.source}_${context}`);
            
            // 短時間後にフラグをリセット
            setTimeout(() => { 
                control.justPlayedPendingNehori = false; 
            }, 100);
            
            console.log(`✅ 統一Pendingネほりーの再生が完了: ${pendingData.source}`);
            
        } catch (error) {
            console.error('❌ 統一Pendingネほりーの再生エラー:', error);
            // エラー時もクリア
            pendingData.clearFunction();
            this.registerSpeechEnd(SPEAKERS.NEHORI, `unified_error_${context}`);
        }
    },
    
    // Pendingネほりーの安全な再生
    async playPendingNehoriSafely(context = 'unknown') {
        const control = AppState.conversationControl;
        
        if (!control.pendingNehoriQuestion || !control.pendingNehoriAudio) {
            console.log('⚠️ Pendingデータが不完全です');
            return;
        }
        
        try {
            this.registerSpeechStart(SPEAKERS.NEHORI, `pending_${context}`);
            
            // メッセージ追加と音声再生
            addMessageToChat(SPEAKERS.NEHORI, control.pendingNehoriQuestion);
            await playPreGeneratedAudio(control.pendingNehoriAudio, SPEAKERS.NEHORI);
            
            this.registerSpeechEnd(SPEAKERS.NEHORI, `pending_${context}`);
            
        } catch (error) {
            console.error('❌ Pendingネほりーの再生エラー:', error);
            this.registerSpeechEnd(SPEAKERS.NEHORI, `pending_error_${context}`);
        }
    },
    
    // 🔧 新機能: 重複Pendingデータの完全クリア（Phase C強化版）
    clearAllPendingData(reason = 'cleanup') {
        console.log(`🧹 全Pendingデータをクリア: ${reason}`);
        
        const control = AppState.conversationControl;
        
        // conversationControlのPendingデータをクリア
        control.pendingNehoriQuestion = null;
        control.pendingNehoriAudio = null;
        // 🔧 Phase C: はほりーのPendingデータもクリア
        control.pendingHahoriContent = null;
        control.pendingHahoriAudio = null;
        
        // AppStateのPendingデータをクリア（レガシー対応）
        AppState.pendingNehoriQuestion = null;
        AppState.pendingNehoriAudio = null;
        
        // Phase3最適化のPendingデータをクリア
        VoiceOptimization.phase3.pendingNehoriContent = null;
        VoiceOptimization.phase3.pendingNehoriAudio = null;
        VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
        
        // 🔧 Phase C: 双方向先読み最適化のPendingデータをクリア
                    window.DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
            window.DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
            window.DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
        
        console.log('✅ 全Pendingデータのクリアが完了');
    },
    
    // 🔧 新機能: Pendingデータの状態確認（Phase C強化版）
    getPendingStatus() {
        const pendingData = this.collectAllPendingData();
        const control = AppState.conversationControl;
        
        return {
            hasPending: pendingData.hasPending,
            source: pendingData.source,
            canNehoriPlay: this.canNehoriSpeak('statusCheck'),
            canHahoriPlay: this.canHahoriSpeak('statusCheck'),
            isKnowledgeConfirmationMode: AppState.voiceRecognitionState.isKnowledgeConfirmationMode,
            justPlayedPendingNehori: control.justPlayedPendingNehori,
            justPlayedPendingHahori: control.justPlayedPendingHahori
        };
    }
};

// 🔧 ConversationGatekeeperをグローバルに公開
window.ConversationGatekeeper = ConversationGatekeeper;

// 🔧 グローバルユーティリティ関数: Pendingシステムの緊急クリア
// デバッグや緊急時に使用
function emergencyClearAllPending(reason = 'emergency') {
    console.warn(`🚨 緊急Pendingクリア実行: ${reason}`);
    ConversationGatekeeper.clearAllPendingData(reason);
}

// 🔧 Phase C: グローバル関数公開（テスト・デバッグ用）
// DualPreemptiveOptimizationは app/voice-phase2-manager.js に移動済み
window.startHahoriGenerationDuringNehori = startHahoriGenerationDuringNehori;
window.handleHahoriImmediatePlayback = handleHahoriImmediatePlayback;
window.playPendingHahoriIfNeeded = playPendingHahoriIfNeeded;

// 🔧 Phase C: 双方向先読みテスト機能
window.testDualPreemptiveSystem = async function() {
    console.log('🧪 双方向先読みシステムテスト開始');
    
    try {
        // 1. 状況分析テスト
        const situation = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.analyzeConversationSituation(SPEAKERS.NEHORI, null);
        console.log('📊 状況分析結果:', situation);
        
        // 2. 戦略決定テスト
        const strategy = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        console.log('🎯 戦略決定結果:', strategy);
        
        // 3. Pending状態確認
        const pendingStatus = ConversationGatekeeper.getPendingStatus();
        console.log('📋 Pending状態:', pendingStatus);
        
        // 4. はほりーの先読み生成テスト（条件が満たされている場合のみ）
        if (AppState.phase === 'deepdive' && ConversationGatekeeper.canHahoriSpeak('test')) {
            console.log('🔄 はほりーの先読み生成テスト実行');
            await startHahoriGenerationDuringNehori();
        } else {
            console.log('⏸️ はほりーの先読み生成テストスキップ（条件未満）');
        }
        
        console.log('✅ 双方向先読みシステムテスト完了');
        return { success: true, situation, strategy, pendingStatus };
        
    } catch (error) {
        console.error('❌ 双方向先読みシステムテストエラー:', error);
        return { success: false, error: error.message };
    }
};

// 🔧 Phase C: 状況適応システムテスト機能
window.testAdaptiveStrategy = function() {
    console.log('🧪 状況適応システムテスト開始');
    
    const testCases = [
        { speaker: SPEAKERS.NEHORI, input: null, expected: 'nehori_speaking' },
        { speaker: SPEAKERS.HAHORI, input: null, expected: 'hahori_speaking' },
        { speaker: SPEAKERS.NULL, input: 'テスト入力', expected: 'user_speaking' },
        { speaker: SPEAKERS.NULL, input: '', expected: 'idle' }
    ];
    
    const results = testCases.map(testCase => {
        const actual = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.analyzeConversationSituation(
            testCase.speaker, 
            testCase.input
        );
        const strategy = window.DualPreemptiveOptimization?.phase1.situationAnalyzer.determinePreemptiveStrategy(actual);
        
        return {
            testCase,
            actual,
            expected: testCase.expected,
            strategy,
            passed: actual === testCase.expected
        };
    });
    
    console.log('📊 状況適応システムテスト結果:', results);
    return results;
};

// 🔧 グローバルユーティリティ関数: Pending状態のデバッグ情報表示
function debugPendingStatus() {
    const status = ConversationGatekeeper.getPendingStatus();
    console.log('🔍 Pendingシステムデバッグ情報:', status);
    return status;
}

// 🔧 状態フラグ管理改善: レガシーフラグの統一アクセサ
// マイク状態の統一管理
Object.defineProperty(AppState, 'microphoneActive', {
    get() {
        // 新しい状態管理システムへのマッピング
        return this.voiceRecognitionStability.isRecognitionActive && 
               this.voiceRecognitionStability.micPermissionGranted;
    },
    set(value) {
        console.warn('⚠️ 非推奨: AppState.microphoneActiveの直接設定は非推奨です。ConversationGatekeeperを使用してください。');
        // 互換性のための一時的対応
        if (value) {
            this.voiceRecognitionStability.isRecognitionActive = true;
        } else {
            this.voiceRecognitionStability.isRecognitionActive = false;
        }
    },
    configurable: true
});

// Pendingネほりーフラグの統一管理
Object.defineProperty(AppState, 'justPlayedPendingNehori', {
    get() {
        return this.conversationControl.justPlayedPendingNehori;
    },
    set(value) {
        console.warn('⚠️ 非推奨: AppState.justPlayedPendingNehoriの直接設定は非推奨です。ConversationGatekeeperを使用してください。');
        this.conversationControl.justPlayedPendingNehori = value;
    },
    configurable: true
});

// 🔧 グローバルユーティリティ関数: 統一状態管理のデバッグ情報
function debugStateFlags() {
    const flags = {
        // 音声認識関連
        voiceRecognition: {
            isRecognitionActive: AppState.voiceRecognitionStability.isRecognitionActive,
            micPermissionGranted: AppState.voiceRecognitionStability.micPermissionGranted,
            consecutiveErrorCount: AppState.voiceRecognitionStability.consecutiveErrorCount,
            lastErrorTime: AppState.voiceRecognitionStability.lastErrorTime
        },
        // 会話制御関連
        conversationControl: {
            currentPhase: AppState.conversationControl.currentPhase,
            lastSpeaker: AppState.conversationControl.lastSpeaker,
            speakingInProgress: AppState.conversationControl.speakingInProgress,
            justPlayedPendingNehori: AppState.conversationControl.justPlayedPendingNehori,
            preventNehoriInterruption: AppState.conversationControl.preventNehoriInterruption
        },
        // 知見確認関連
        knowledgeConfirmation: {
            isKnowledgeConfirmationMode: AppState.voiceRecognitionState.isKnowledgeConfirmationMode,
            pendingKnowledgeEvaluation: !!AppState.voiceRecognitionState.pendingKnowledgeEvaluation
        },
        // レガシーフラグ（互換性）
        legacyFlags: {
            microphoneActive: AppState.microphoneActive, // ゲッター経由
            justPlayedPendingNehori: AppState.justPlayedPendingNehori // ゲッター経由
        }
    };
    
    console.log('🔍 統一状態管理デバッグ情報:', flags);
    return flags;
}

// 🔧 グローバルユーティリティ関数: レガシーフラグの移行状態確認
function checkLegacyFlagMigration() {
    const issues = [];
    
    // Pendingデータの重複チェック
    const pendingStatus = ConversationGatekeeper.getPendingStatus();
    if (pendingStatus.hasPending && pendingStatus.source !== 'conversationControl') {
        issues.push(`Pendingデータが新システム以外に存在: ${pendingStatus.source}`);
    }
    
    // 直接アクセスのチェック（ランタイムでは検出できないが、ログで確認可能）
    if (AppState.hasOwnProperty('microphoneActive') && 
        typeof AppState.microphoneActive !== 'undefined') {
        // ゲッター/セッターが設定されているか確認
        const descriptor = Object.getOwnPropertyDescriptor(AppState, 'microphoneActive');
        if (!descriptor || !descriptor.get) {
            issues.push('非推奨: AppState.microphoneActiveが直接プロパティとして存在');
        }
    }
    
    if (issues.length > 0) {
        console.warn('⚠️ レガシーフラグ移行の問題が発見されました:', issues);
        return { success: false, issues };
    } else {
        console.log('✅ レガシーフラグの移行が正常に完了しています');
        return { success: true, issues: [] };
    }
}

// 🔧 新機能: マイク許可保持統計情報デバッグ
function debugMicrophonePermissionStats() {
    console.log('🔍 マイク許可統計情報:');
    
    const stateManager = window.AppState?.stateManager || window.stateManager;
    if (!stateManager?.recognitionManager) {
        console.log('❌ 統合システム未初期化');
        return;
    }
    
    const stats = stateManager.recognitionManager.getMicrophonePermissionStats();
    
    console.log('📊 マイク許可統計:');
    
    // 戦略別の統計表示
    if (stats.strategy === 'continuous') {
        console.log(`  - 戦略: 継続的音声認識（真の解決策）`);
        console.log(`  - start()呼び出し: ${stats.startCount}回`);
        console.log(`  - マイク許可要求: ${stats.microphonePermissionRequests}回`);
        console.log(`  - 結果処理: ${stats.resultProcessedCount}回`);
        console.log(`  - 結果無視: ${stats.resultIgnoredCount}回`);
        console.log(`  - 一時停止: ${stats.pauseCount}回`);
        console.log(`  - 処理再開: ${stats.resumeCount}回`);
        console.log(`  - セッション時間: ${stats.sessionDuration}秒`);
        console.log(`  - 効率性: ${stats.efficiency}%`);
        console.log(`  - 継続性保持: ${stats.neverStopped ? '✅' : '❌'}`);
        console.log(`  - 継続的音声認識: ${stats.continuousRecognition ? '✅' : '❌'}`);
    } else if (stats.strategy === 'persistent') {
        console.log(`  - 戦略: Chrome専用インスタンス不変`);
        console.log(`  - インスタンス作成: ${stats.instanceCreationCount}回`);
        console.log(`  - マイク許可要求: ${stats.microphonePermissionRequests}回`);
        console.log(`  - 音声認識再開: ${stats.restartCount}回`);
        console.log(`  - abort()実行: ${stats.abortCount}回`);
        console.log(`  - セッション時間: ${stats.sessionDuration}秒`);
        console.log(`  - 効率性: ${stats.efficiency}%`);
        console.log(`  - インスタンス永続化: ${stats.instancePersistent ? '✅' : '❌'}`);
    } else {
        console.log(`  - 戦略: ${stats.strategy || 'lightweight'}`);
        console.log(`  - 完全クリーンアップ: ${stats.completeBefore || 0}回`);
        console.log(`  - 軽量リスタート: ${stats.lightweightCount || 0}回`);
        console.log(`  - 最終処理: ${stats.lastCleanupType || 'unknown'}`);
        console.log(`  - セッション時間: ${stats.sessionDuration}秒`);
        console.log(`  - 効率性: ${stats.efficiency}%`);
    }
    
    // 効率性に基づく推奨事項
    if (stats.strategy === 'continuous') {
        if (stats.startCount === 1 && stats.microphonePermissionRequests === 1) {
            console.log('🎯 完璧: 継続的音声認識が理想的に動作しています');
            console.log('✨ マイク許可アラートは完全に解消されました');
        } else if (stats.startCount <= 3) {
            console.log('✅ 良好: 継続的音声認識がほぼ正常に動作しています');
        } else {
            console.log('⚠️ 注意: 継続的音声認識で予期しない再開が発生しています');
            console.log('💡 継続的音声認識トラブルシューティング:');
            console.log('  - ブラウザまたはタブを再読み込み');
            console.log('  - 他のタブでマイクを使用していないか確認');
        }
    } else if (stats.efficiency >= 95) {
        console.log('🎯 完璧: マイク許可が完全に保持されています');
    } else if (stats.efficiency >= 80) {
        console.log('✅ 優秀: マイク許可が効率的に保持されています');
    } else if (stats.efficiency >= 60) {
        console.log('⚠️ 良好: マイク許可保持に若干の改善余地があります');
    } else {
        console.log('❌ 要改善: マイク許可アラートが頻発しています');
        console.log('💡 推奨事項:');
        console.log('  1. ブラウザの設定でマイク許可を確認');
        console.log('  2. ページの再読み込みを試行');
        console.log('  3. 他のタブでマイクを使用していないか確認');
        
        // 継続的音声認識戦略の推奨
        if (stats.strategy !== 'continuous' && navigator.userAgent.includes('Chrome')) {
            console.log('  4. 継続的音声認識戦略に切り替え: switchMicrophoneStrategy("continuous")');
        }
        // Chrome専用戦略の推奨
        else if (stats.strategy !== 'persistent' && navigator.userAgent.includes('Chrome')) {
            console.log('  4. Chrome専用戦略に切り替え: switchMicrophoneStrategy("persistent")');
        }
    }
    
    return stats;
}

// =================================================================================
// VOICE RECOGNITION PATTERNS - 音声認識パターン
// =================================================================================

// 🎤 音声パターンとテンプレートはprompts.jsから読み込み
// (重複定義を避けるため、ここでは削除済み)

// =================================================================================
// UTILITY FUNCTIONS - ユーティリティ関数
// =================================================================================

// DOMUtilsはapp/ui-manager.jsに移動済み

const ErrorHandler = {
    handle: (error, context = '', userMessage = '') => {
        console.error(`❌ ${context}エラー:`, error);
        const message = userMessage || error.message || 'エラーが発生しました';
        window.showMessage('error', message);
    },
    success: (message) => {
        console.log(`✅ ${message}`);
        window.showMessage('success', message);
    }
};

// =================================================================================
// CORE FUNCTIONS - 基本機能
// =================================================================================

// showMessage関数はapp/utils.jsに移動しました

// プロンプト取得関数
function getCharacterPrompt(character) {
    // まずprompts.jsから直接読み込みを試行
    if (window.VoicePresets && window.VoicePresets.default && window.VoicePresets.default.settings[character]) {
        const prompt = window.VoicePresets.default.settings[character].prompt;
        if (prompt && prompt.trim()) {
            return prompt;
        }
    }
    
    // フォールバック: VoiceSettingsから取得
    if (VoiceSettings[character] && VoiceSettings[character].prompt) {
        return VoiceSettings[character].prompt;
    }
    
    // デバッグ情報
    console.log(`⚠️ プロンプトが見つかりません (character: ${character})`);
    console.log('window.VoicePresets:', window.VoicePresets);
    
    return '';
}

function getDefaultSystemPrompt(character) {
    if (window.AI_PROMPTS) {
        return character === SPEAKERS.NEHORI ? 
            window.AI_PROMPTS.NEHORI_BASE : 
            window.AI_PROMPTS.HAHORI_BASE;
    }
    return '';
}

// 音声設定初期化
function initializeVoiceSettings() {
    try {
        // まずprompts.jsから基本設定を読み込み
        if (window.VoicePresets && window.VoicePresets.default) {
            Object.assign(VoiceSettings[SPEAKERS.NEHORI], window.VoicePresets.default.settings[SPEAKERS.NEHORI]);
            Object.assign(VoiceSettings[SPEAKERS.HAHORI], window.VoicePresets.default.settings[SPEAKERS.HAHORI]);
            console.log('✅ prompts.jsから音声設定を読み込みました');
        }
        
        // 次にカスタム設定ファイルがあれば読み込み
        if (window.CUSTOM_VOICE_CONFIG) {
            console.log('📄 カスタム音声設定ファイルを検出:', window.CUSTOM_VOICE_CONFIG);
            
            if (window.CUSTOM_VOICE_CONFIG.nehori) {
                Object.assign(VoiceSettings[SPEAKERS.NEHORI], window.CUSTOM_VOICE_CONFIG.nehori);
            }
            if (window.CUSTOM_VOICE_CONFIG.hahori) {
                Object.assign(VoiceSettings[SPEAKERS.HAHORI], window.CUSTOM_VOICE_CONFIG.hahori);
            }
            
            console.log('✅ カスタム音声設定ファイルを適用しました');
        }
        
        // 最後にローカルストレージの設定があれば上書き
        const savedConfig = localStorage.getItem('fukabori_voice_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('📄 ローカルストレージの音声設定を検出:', config);
            
            if (config.nehori) {
                Object.assign(VoiceSettings[SPEAKERS.NEHORI], config.nehori);
            }
            if (config.hahori) {
                Object.assign(VoiceSettings[SPEAKERS.HAHORI], config.hahori);
            }
            
            console.log('✅ ローカルストレージの音声設定を適用しました');
        }
        
        console.log('🎵 最終的な音声設定:', VoiceSettings);
        
        // 🆕 UIに設定を反映
        window.updateVoiceSettingsUI();
        
    } catch (error) {
        console.error('❌ 音声設定初期化エラー:', error);
    }
}

// 🆕 音声設定UIの更新関数
function updateVoiceSettingsUI() {
    try {
        // prompts.jsの設定を確認
        let nehoriSettings = VoiceSettings[SPEAKERS.NEHORI];
        let hahoriSettings = VoiceSettings[SPEAKERS.HAHORI];
        
        // prompts.jsから再読み込み（優先）
        if (window.VoicePresets && window.VoicePresets.default) {
            nehoriSettings = { ...nehoriSettings, ...window.VoicePresets.default.settings[SPEAKERS.NEHORI] };
            hahoriSettings = { ...hahoriSettings, ...window.VoicePresets.default.settings[SPEAKERS.HAHORI] };
            console.log('🔄 prompts.jsから音声設定を再読み込み');
        }
        
        // ねほりーの設定
        const nehoriVoice = window.UIManager.DOMUtils.get('nehoriVoice');
        const nehoriSpeed = window.UIManager.DOMUtils.get('nehoriSpeed');
        const nehoriVolume = window.UIManager.DOMUtils.get('nehoriVolume');
        const nehoriSpeedValue = window.UIManager.DOMUtils.get('nehoriSpeedValue');
        const nehoriVolumeValue = window.UIManager.DOMUtils.get('nehoriVolumeValue');
        
        if (nehoriVoice) nehoriVoice.value = nehoriSettings.voice || 'sage';
        if (nehoriSpeed) nehoriSpeed.value = nehoriSettings.speed || 1.3;
        if (nehoriVolume) nehoriVolume.value = Math.min(nehoriSettings.volume || 0.9, 1.0); // 上限1.0
        if (nehoriSpeedValue) nehoriSpeedValue.textContent = nehoriSpeed?.value || '1.3';
        if (nehoriVolumeValue) nehoriVolumeValue.textContent = nehoriVolume?.value || '0.9';
        
        // はほりーの設定
        const hahoriVoice = window.UIManager.DOMUtils.get('hahoriVoice');
        const hahoriSpeed = window.UIManager.DOMUtils.get('hahoriSpeed');
        const hahoriVolume = window.UIManager.DOMUtils.get('hahoriVolume');
        const hahoriSpeedValue = window.UIManager.DOMUtils.get('hahoriSpeedValue');
        const hahoriVolumeValue = window.UIManager.DOMUtils.get('hahoriVolumeValue');
        
        if (hahoriVoice) hahoriVoice.value = hahoriSettings.voice || 'shimmer';
        if (hahoriSpeed) hahoriSpeed.value = hahoriSettings.speed || 1.3;
        if (hahoriVolume) hahoriVolume.value = Math.min(hahoriSettings.volume || 0.7, 1.0); // 上限1.0
        if (hahoriSpeedValue) hahoriSpeedValue.textContent = hahoriSpeed?.value || '1.3';
        if (hahoriVolumeValue) hahoriVolumeValue.textContent = hahoriVolume?.value || '0.7';
        
        // VoiceSettingsも更新
        VoiceSettings[SPEAKERS.NEHORI] = nehoriSettings;
        VoiceSettings[SPEAKERS.HAHORI] = hahoriSettings;
        
        console.log('✅ 音声設定UIを更新しました', { nehoriSettings, hahoriSettings });
        
    } catch (error) {
        console.error('❌ 音声設定UI更新エラー:', error);
    }
}

// =================================================================================
// LOGIN & AUTHENTICATION - ログイン・認証
// =================================================================================

function loginWithPassword() {
    console.log('💡 loginWithPassword が実行されました');
    
    const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
    if (!passwordInput) {
        window.showMessage('error', 'パスワード入力欄が見つかりません');
        return;
    }
    
    const password = passwordInput.value.trim();
    if (!password) {
        window.showMessage('error', 'パスワードを入力してください');
        return;
    }

    try {
        const decryptedKey = window.StorageManager.apiKey.load(password);
        AppState.apiKey = decryptedKey;
        
        // 🔄 新機能: ログイン状態を保存
        saveLoginState(true);
        
        // 🔧 マイク許可拒否状態のリセット（ログイン成功時に再試行を許可）
        localStorage.removeItem('microphonePermissionDenied');
        console.log('🎤 マイク許可拒否状態をリセットしました（再試行可能）');
        
        // 🔄 新機能: パスワード入力欄をクリア
        passwordInput.value = '';
        
        // 🔄 新機能: 2ステップUIを更新（従来のボタン制御から変更）
        update2StepUI();
        
        window.showMessage('success', 'ログインに成功しました');
        console.log('✅ ログイン完了 - 状態を保存しました');
        
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        
        // 🔧 データ復旧を試行
        console.log('🔄 データ復旧を試行します...');
        const recoverySuccess = window.attemptDataRecovery(password);
        
        if (recoverySuccess) {
            console.log('✅ データ復旧成功 - 再度ログインを試行します');
            try {
                const decryptedKey = window.StorageManager.apiKey.load(password);
                AppState.apiKey = decryptedKey;
                
                saveLoginState(true);
                localStorage.removeItem('microphonePermissionDenied');
                passwordInput.value = '';
                update2StepUI();
                
                window.showMessage('success', 'データ復旧完了！ログインに成功しました');
                console.log('✅ 復旧後ログイン完了');
                return;
            } catch (retryError) {
                console.error('❌ 復旧後ログイン失敗:', retryError);
            }
        }
        
        window.showMessage('error', 'パスワードが間違っているか、保存されたAPIキーがありません');
    }
}

// 🔧 UI最適化Phase1: モーダル管理機能をapp/ui-advanced.jsに移動
// openAdvancedSettings, closeAdvancedSettings, updateAdvancedSettingsDisplay, 
// saveVoicePreset, downloadVoiceConfig, handleEscapeKey

// =================================================================================
// API INTEGRATION - API統合
// =================================================================================

// 🎭 音声用テキスト短縮機能
function shortenForSpeech(text, maxLength = 200) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    
    // 句読点での区切りを優先
    const sentences = text.split(/[。！？]/);
    let shortened = '';
    
    for (const sentence of sentences) {
        const candidate = shortened + sentence + (sentence.endsWith('。') || sentence.endsWith('！') || sentence.endsWith('？') ? '' : '。');
        if (candidate.length <= maxLength) {
            shortened = candidate;
        } else {
            break;
        }
    }
    
    // まだ長い場合は強制的に切る
    if (shortened.length > maxLength) {
        shortened = text.substring(0, maxLength - 3) + '...';
    }
    
    return shortened || text.substring(0, maxLength - 3) + '...';
}

// 🎭 表示と発声を分離した統合メッセージ処理
async function addMessageToChatWithSpeech(speaker, displayText, speechText = null) {
    // チャット表示（長いテキスト）
    await addMessageToChat(speaker, displayText);
    
    // 🆕 コンテキスト連携短縮システムを使用
    let textForSpeech;
    if (speechText) {
        textForSpeech = speechText;
    } else if (window.SpeechShorteningEngine && window.SpeechShorteningEngine.enabled) {
        // コンテキスト情報を取得
        const context = window.SpeechShorteningEngine.getCurrentContext();
        
        // AI要約が有効な場合は非同期処理
        if (window.SpeechShorteningEngine.settings.features.aiSummary) {
            textForSpeech = await window.SpeechShorteningEngine.shortenTextWithContext(displayText, context);
        } else {
            textForSpeech = window.SpeechShorteningEngine.shortenText(displayText, context);
        }
    } else {
        // フォールバック: 従来の簡易短縮
        textForSpeech = shortenForSpeech(displayText);
    }
    
    // 短縮が発生した場合のログ
    if (displayText.length > textForSpeech.length) {
        const reductionRate = Math.round((1 - textForSpeech.length / displayText.length) * 100);
        console.log(`🎤 音声短縮実行: ${displayText.length}文字 → ${textForSpeech.length}文字 (${reductionRate}%短縮)`);
        console.log(`📝 表示: ${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}`);
        console.log(`🔊 発声: ${textForSpeech}`);
    } else {
        console.log('📝 音声短縮なし（元テキストをそのまま使用）');
        console.log(`📄 テキスト: ${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}`);
    }
    
    try {
        const audioBlob = await ttsTextToAudioBlob(textForSpeech, speaker);
        await playPreGeneratedAudio(audioBlob, speaker);
    } catch (error) {
        console.error('❌ 音声生成エラー:', error);
        window.showMessage('error', '音声の生成に失敗しました');
    }
}

async function ttsTextToAudioBlob(text, character) {
    if (!AppState.apiKey) {
        throw new Error('APIキーが設定されていません');
    }

    // 🎯 Phase 1: 音声生成前に短縮エンジンを適用
    let textForSpeech = text;
    try {
        // SpeechShorteningManagerを使用して短縮処理
        if (window.SpeechShorteningManager && window.SpeechShorteningManager.settings.enabled) {
            const originalLength = text.length;
            textForSpeech = await window.SpeechShorteningManager.processTextWithShortening(text, character);
            
            if (originalLength !== textForSpeech.length) {
                const reduction = Math.round((1 - textForSpeech.length / originalLength) * 100);
                console.log(`🎯 TTS短縮適用: ${originalLength}→${textForSpeech.length}文字 (${reduction}%短縮)`);
            }
        }
    } catch (error) {
        console.warn('⚠️ TTS短縮エンジン適用エラー:', error);
        textForSpeech = text; // エラー時は元のテキストを使用
    }

    const voiceSettings = getVoiceSettings(character);
    
    try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini-tts',
                input: textForSpeech, // 短縮されたテキストを使用
                voice: voiceSettings.voice,
                speed: voiceSettings.speed,
                response_format: 'mp3',
                instructions: `${voiceSettings.voice}音声で、深堀インタビューAIとして親しみやすく、聞き手に寄り添うように話してください。`
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`TTS API Error: ${errorData.error?.message || response.statusText}`);
        }

        return await response.blob();
    } catch (error) {
        console.error('TTS API呼び出しエラー:', error);
        throw error;
    }
}

async function gptMessagesToCharacterResponse(messages, character) {
    console.warn('⚠️ gptMessagesToCharacterResponse は非推奨です。AIManager.sendToCharacter を使用してください');
    
    // AIManagerが利用可能かチェック
    if (window.AIManager && window.AIManager.isInitialized) {
        try {
            return await window.AIManager.sendToCharacter(messages, character);
        } catch (error) {
            console.error('❌ AIManager.sendToCharacter実行エラー:', error);
            // フォールバック処理へ
        }
    }
    
    // フォールバック実装（AIManager未使用時）
    console.warn('⚠️ AIManagerが未初期化のため、レガシー実装を使用します');
    
    if (!AppState.apiKey) {
        throw new Error('APIキーが設定されていません');
    }

    let characterPrompt;
    // Knowledge DNAシステム等のシステム呼び出し対応
    if (character === 'system' || !VoiceSettings || !VoiceSettings[character]) {
        characterPrompt = 'あなたは深堀くんの知見分析を担当するAIアシスタントです。正確で有用な分析を提供してください。';
    } else if (VoiceSettings[character] && VoiceSettings[character].prompt && VoiceSettings[character].prompt.trim()) {
        characterPrompt = VoiceSettings[character].prompt;
    } else {
        characterPrompt = getDefaultSystemPrompt(character);
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: characterPrompt },
                    ...messages
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GPT API Error: ${errorData.error?.message || response.statusText}`);
        }

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error('GPT API呼び出しエラー:', error);
        throw error;
    }
}

// =================================================================================
// AUDIO MANAGEMENT - 音声管理
// =================================================================================

// 🔧 改善版: 安定したマイク初期化関数（マイク許可は一回だけルール遵守）
async function initializeMicrophoneRecording(forceRecheck = false) {
    console.log('🎤 マイク初期化開始', { forceRecheck });
    
    // 🛡️ 重複リクエスト防止（絶対ルール）
    if (AppState.voiceRecognitionStability.permissionRequestInProgress) {
        console.log('🚫 マイク許可リクエストが既に進行中 - 重複防止');
        return AppState.voiceRecognitionStability.micPermissionGranted;
    }
    
    // 🛡️ 既に許可取得済みの場合は絶対に再取得しない
    if (AppState.voiceRecognitionStability.micPermissionGranted && !forceRecheck) {
        console.log('✅ マイク許可は既に取得済み - 再取得はしません');
        await initializeSpeechRecognition();
        return true;
    }
    
    AppState.voiceRecognitionStability.permissionRequestInProgress = true;
    
    try {
        // 🛡️ 保存された許可状態を最優先で確認
        const storedPermission = localStorage.getItem('microphonePermissionGranted');
        const hasStoredPermission = storedPermission === 'true';
        
        if (hasStoredPermission && !forceRecheck) {
            console.log('✅ 保存されたマイク許可を使用 - 新たな許可要求はしません');
            AppState.voiceRecognitionStability.micPermissionGranted = true;
        } else {
            // 🛡️ マイク許可は一回だけ - 絶対ルール
            console.log('🔄 マイク許可を一回だけ取得します（絶対ルール遵守）');
            
            // 🛡️ 許可状態を事前チェック
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
            if (permissionStatus && permissionStatus.state === 'granted') {
                console.log('✅ ブラウザレベルでマイク許可済み');
                localStorage.setItem('microphonePermissionGranted', 'true');
                AppState.voiceRecognitionStability.micPermissionGranted = true;
            } else {
                // 🛡️ 一回だけの許可取得
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                
                if (stream) {
                    // ストリームを即座に停止（許可のみが目的）
                    stream.getTracks().forEach(track => track.stop());
                    
                    localStorage.setItem('microphonePermissionGranted', 'true');
                    AppState.voiceRecognitionStability.micPermissionGranted = true;
                    console.log('✅ マイク許可を一回だけ取得し、永続保存しました');
                }
            }
        }
        
        // SpeechRecognitionの初期化（許可が取れた場合のみ）
        if (AppState.voiceRecognitionStability.micPermissionGranted) {
            await initializeSpeechRecognition();
        }
        
        AppState.voiceRecognitionStability.permissionRequestInProgress = false;
        return AppState.voiceRecognitionStability.micPermissionGranted;
        
    } catch (error) {
        console.error('❌ マイク初期化エラー:', error);
        
        AppState.voiceRecognitionStability.micPermissionGranted = false;
        AppState.voiceRecognitionStability.permissionRequestInProgress = false;
        
        // 🛡️ 許可拒否の場合は保存した許可も削除し、二度と要求しない
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            localStorage.removeItem('microphonePermissionGranted');
            localStorage.setItem('microphonePermissionDenied', 'true'); // 拒否状態を記録
            window.showMessage('error', 'マイクの使用許可が拒否されました。ブラウザの設定で許可し、ページを再読み込みしてください。');
        } else {
            window.showMessage('error', 'マイクの初期化に失敗しました。ページを再読み込みしてください。');
        }
        
        return false;
    }
}

// 🔧 新関数: SpeechRecognitionの安定した初期化
// 🗑️ 旧システム削除: initializeSpeechRecognition関数は新システムに置き換え済み

// 🗑️ 旧システム削除: handleRealtimeSpeechResult関数は新システムに置き換え済み

// 🗑️ 旧システム削除: handleImprovedSpeechError関数は新システムに置き換え済み

// 🗑️ 旧システム削除: scheduleRecognitionRestart関数の残り部分は新システムに置き換え済み

// 🗑️ 旧システム削除: handleImprovedSpeechEnd関数は新システムに置き換え済み

// 🗑️ 旧システム削除: handleSpeechStart関数は新システムに置き換え済み

// 🔧 統合版: 音声認識開始関数（新旧システム統合）
function safeStartSpeechRecognition(reason = 'unknown') {
    console.log(`🔍 統合音声認識開始試行: ${reason}`);
    
    // 🛡️ 統合システムを使用
    if (window.stateManager && window.stateManager.recognitionManager) {
        console.log('✅ 統合システムで開始');
        return window.stateManager.startRecognition();
    }
    
    console.error('❌ 統合音声システムが未初期化です');
    return false;
}

// 🔧 新関数: 音声認識を安全に停止
function safeStopSpeechRecognition(reason = 'unknown') {
    console.log(`🛑 音声認識停止: ${reason}`);
    
    const stability = AppState.voiceRecognitionStability;
    
    if (!AppState.speechRecognition || !stability.isRecognitionActive) {
        console.log('✅ 音声認識は既に停止しています');
        return true;
    }
    
    try {
        AppState.speechRecognition.abort();
        stability.isRecognitionActive = false;
        console.log('✅ 音声認識を停止しました');
        return true;
        
    } catch (error) {
        console.error('😨 音声認識停止エラー:', error);
        stability.isRecognitionActive = false; // 強制リセット
        return false;
    }
}

function restartSpeechRecognition() {
    console.log('🔄 音声認識再開処理開始（戦略別対応）');
    
    // AI発言終了後に音声認識を確実に再開する関数
    const stability = AppState.voiceRecognitionStability;
    
    // 🔧 新システムの許可状態も確認
    const newSystemPermission = window.stateManager?.permissionManager?.state === 'granted';
    const legacyPermission = stability.micPermissionGranted;
    
    if (!legacyPermission && !newSystemPermission) {
        console.log('📵 マイク許可未取得のため再開をスキップ');
        return;
    }
    
    if (newSystemPermission && !legacyPermission) {
        console.log('🔄 新システムの許可状態を旧システムに同期');
        stability.micPermissionGranted = true;
    }
    
    // 🔧 重要: マイク許可保持を優先した戦略別再開処理
    if (window.stateManager && window.stateManager.recognitionManager) {
        const recognitionManager = window.stateManager.recognitionManager;
        const currentState = recognitionManager.state;
        const strategy = window.CURRENT_MICROPHONE_STRATEGY;
        
        console.log(`🔍 現在の音声認識状態: ${currentState}, 戦略: ${strategy}`);
        
        // 🔄 継続的音声認識戦略: 結果処理再開のみ
        if (strategy === MICROPHONE_STRATEGY.CONTINUOUS) {
            console.log('🔄 継続的音声認識 - 結果処理再開（音声認識は継続中）');
            
            if (recognitionManager.resumeProcessing) {
                recognitionManager.resumeProcessing('AI応答終了');
                console.log('✅ 継続的音声認識の結果処理再開完了');
            } else {
                console.warn('⚠️ 継続的音声認識Manager未対応 - フォールバック');
                // フォールバックとして通常の開始処理（マイク許可確認付き）
                if (stability.micPermissionGranted) {
                recognitionManager.start();
                } else {
                    console.log('🚫 マイク許可がないため音声認識開始をスキップ');
                }
            }
            return;
        }
        
        // 🔧 その他の戦略: 軽量リスタート優先（マイク許可保持）
        if (recognitionManager.microphonePermissionManager?.canPerformLightweightRestart) {
            console.log('🔄 軽量リスタート実行（マイク許可保持）');
            
            // 現在の状態に応じて処理
            if (currentState === 'active') {
                // 軽量リスタート実行
                recognitionManager.performLightweightRestart();
            } else if (currentState === 'idle') {
                // 直接開始（軽量クリーンアップ適用）
                recognitionManager.start();
            } else {
                // 停止完了を待機してから軽量リスタート
                setTimeout(() => {
                    if (recognitionManager.state === 'idle') {
                        recognitionManager.start();
                    }
                }, 300); // 短時間待機
            }
            return;
        }
        
        // 🔧 フォールバック: 従来の処理（完全クリーンアップ）
        console.log('⚠️ 軽量リスタート不可 - 従来処理で再開');
        
        if (currentState !== 'idle') {
            console.log('🛑 現在の音声認識を停止中...');
            window.stateManager.stopRecognition();
            
            // 停止完了を待機してから再開
            setTimeout(() => {
                console.log('✨ 音声認識再開実行');
                if (stability.micPermissionGranted) {
                    safeStartSpeechRecognition('restartSpeechRecognition');
                } else {
                    console.log('🚫 再開時の許可チェックでNG - スキップ');
                }
            }, 800); // 停止時間を800msに延長
        } else {
            // 既にidleの場合は即座に再開
            setTimeout(() => {
                console.log('✨ 音声認識即座再開');
                if (stability.micPermissionGranted) {
                    safeStartSpeechRecognition('restartSpeechRecognition');
                } else {
                    console.log('🚫 再開時の許可チェックでNG - スキップ');
                }
            }, 200);
        }
    } else {
        // 統合システムが利用できない場合のフォールバック
        console.warn('⚠️ 統合システム未初期化 - レガシー再開処理');
        setTimeout(() => {
            if (stability.micPermissionGranted) {
                safeStartSpeechRecognition('restartSpeechRecognition');
            } else {
                console.log('🚫 再開時の許可チェックでNG - スキップ');
            }
        }, 500);
    }
}

function updateTranscriptDisplay() {
    const transcriptDisplay = window.UIManager.DOMUtils.get('transcriptDisplay');
    if (transcriptDisplay) {
        // 🚀 役員インタビュー向け最適化：非同期DOM更新（体感速度向上）
        requestAnimationFrame(() => {
            if (AppState.currentTranscript) {
                // リアルタイム文字起こし（確定済み + 入力中）を表示
                transcriptDisplay.textContent = AppState.currentTranscript;
            } else if (AppState.transcriptHistory.length > 0) {
                // 確定済みの文字起こしのみを表示
                const allText = AppState.transcriptHistory.join(' ');
                transcriptDisplay.textContent = allText;
            } else {
                // 現在の状態に応じたメッセージを表示
                if (AppState.currentSpeaker !== SPEAKERS.NULL) {
                    transcriptDisplay.textContent = 'AI応答中...音声認識は一時停止中です';
                } else if (AppState.sessionActive) {
                    transcriptDisplay.textContent = '音声認識待機中...（「どうぞ」と言うとAIが応答します）';
                } else {
                    transcriptDisplay.textContent = 'セッション未開始';
                }
            }
        });
    }
}

// =================================================================================
// Phase 1: VoiceProcessingManager 統合
// =================================================================================

// 元のprocessFinalTranscript関数をバックアップ
async function processFinalTranscriptOriginal(text) {
    if (AppState.currentSpeaker !== SPEAKERS.NULL) {
        return;
    }

    // 🎨 新機能: ユーザー発話時の話者変化イベントを発行
    if (window.dispatchEvent) {
        const speakerChangeEvent = new CustomEvent('speaker-change', {
            detail: { speaker: SPEAKERS.USER }
        });
        window.dispatchEvent(speakerChangeEvent);
        console.log(`🎨 話者変化イベント発行: ${SPEAKERS.USER} (ユーザー発話開始)`);
    }

    // 🔧 確認応答の除去
    if (AppState.waitingForClearConfirmation && (text.includes("はい") || text.includes("うん"))) {
        // "はい"も文字起こしから除去
        if (AppState.transcriptHistory.length > 0) {
            AppState.transcriptHistory.pop(); // 最新の"はい"エントリを削除
        }
        AppState.currentTranscript = AppState.transcriptHistory.join(" ");
        window.updateTranscriptDisplay();
        console.log("🎯 確認応答「はい」を文字起こしから除去");
    }

    // 🔧 Phase B: 音声認識訂正機能（「どうぞ」は除外）
    // 特別なコマンド（どうぞ、テーマ変更等）を先に処理
    if (text.includes('どうぞ') || text.includes('ドウゾ') || text.includes('どーぞ') ||
        text.includes('テーマ変更') || text.includes('テーマを変え') ||
        text.includes('質問変更') || text.includes('質問を変え') || text.includes('別の質問') ||
        text.includes('終了して') || text.includes('おわりして') || text.includes('セッション終了')) {
        // 特別コマンドは訂正処理をスキップして従来処理へ
        console.log('🎯 特別コマンド検出、訂正処理をスキップ:', text);
    } else {
        // 通常の音声訂正機能
        const correctionCommand = SpeechCorrectionSystem.detectCorrectionCommand(text);
        
        if (correctionCommand.type === 'deletion' || correctionCommand.type === 'replacement') {
            console.log('🔧 音声訂正コマンド検出:', correctionCommand);
            
            // 🎯 シンプル修正：音声コマンド除去
            if (correctionCommand.type === "deletion" && correctionCommand.action === "delete_characters") {
                // 音声コマンドパターンを除去
                const cleanedText = removeVoiceCommand(text, correctionCommand.count);
                
                // transcriptHistoryの最新エントリを置き換え
                if (AppState.transcriptHistory.length > 0) {
                    AppState.transcriptHistory[AppState.transcriptHistory.length - 1] = cleanedText;
                }
                console.log(`🎯 音声コマンド除去: "${text}" → "${cleanedText}"`);
            }
            
            // 現在の入力を設定（音声コマンド除去済み）
            const currentInput = AppState.transcriptHistory.join(" ");
            SpeechCorrectionSystem.setCurrentInput(currentInput);
            
            // 訂正コマンドを実行
            const result = await SpeechCorrectionSystem.executeCorrectionCommand(correctionCommand);
            
            if (result.success) {
                // 訂正結果を反映
                const correctedText = SpeechCorrectionSystem.getCurrentInput();
                AppState.transcriptHistory = correctedText ? [correctedText] : [];
                AppState.currentTranscript = correctedText || '';
                window.updateTranscriptDisplay();
                
                // 成功時の音声フィードバック
                await provideCorrectionFeedback(result.feedback);
                return;
            } else {
                // 失敗時のフィードバック
                await provideCorrectionFeedback(result.message);
                return;
            }
        }
    }

    // 🔧 従来の削除コマンド処理は SpeechCorrectionSystem に統一されました

    if (text.includes('テーマ変更') || text.includes('テーマを変え')) {
        await handleThemeChange();
        return;
    }

    if (text.includes('質問変更') || text.includes('質問を変え') || text.includes('別の質問')) {
        await handleQuestionChange();
        return;
    }

    if (text.includes('終了して') || text.includes('おわりして') || text.includes('セッション終了')) {
        await handleSessionEnd();
        return;
    }

    const hasPermission = text.includes('どうぞ') || text.includes('ドウゾ') || text.includes('どーぞ');
    
    if (hasPermission) {
        AppState.waitingForPermission = false;
        
        // 🎯 Phase 2: データ取得源修正 - 編集された内容を確実に取得
        let fullText;
        
        // Phase 2A: currentTranscriptを優先的に使用（編集された内容を反映）
        if (AppState.currentTranscript && AppState.currentTranscript.trim()) {
            fullText = AppState.currentTranscript.trim();
            console.log('🎯 Phase 2: currentTranscriptから取得:', fullText);
        } 
        // Phase 2B: フォールバック - transcriptHistoryから取得
        else if (AppState.transcriptHistory && AppState.transcriptHistory.length > 0) {
            fullText = AppState.transcriptHistory.join(' ').trim();
            console.log('🎯 Phase 2: transcriptHistory（フォールバック）から取得:', fullText);
        }
        // Phase 2C: 緊急フォールバック - 空文字列
        else {
            fullText = '';
            console.warn('⚠️ Phase 2: データが見つかりません - 空文字列を使用');
        }
        
        // Phase 2D: 取得したデータの検証
        if (fullText) {
            // 🔧 Phase B: 現在の入力を訂正システムに設定
            SpeechCorrectionSystem.setCurrentInput(fullText);
            
            // Phase 2E: デバッグ情報出力
            console.log('🎯 Phase 2 データ取得完了:', {
                source: AppState.currentTranscript ? 'currentTranscript' : 'transcriptHistory',
                data: fullText,
                currentTranscript: AppState.currentTranscript,
                transcriptHistory: AppState.transcriptHistory
            });
            
            await handleUserTextInput(fullText);
        } else {
            console.error('❌ Phase 2: 処理するテキストがありません');
        }
    } else if (!AppState.waitingForPermission) {
        // 🎯 Phase 2: 非許可待機時も同様の修正を適用
        let fullText;
        
        if (AppState.currentTranscript && AppState.currentTranscript.trim()) {
            fullText = AppState.currentTranscript.trim();
        } else {
            fullText = AppState.transcriptHistory.join(' ').trim();
        }
        
        if (fullText) {
            // 🔧 Phase B: 現在の入力を訂正システムに設定
            SpeechCorrectionSystem.setCurrentInput(fullText);
            await handleUserTextInput(fullText);
        }
    } else {
        console.log('「どうぞ」を待機中 - 文字起こし蓄積:', text);
        
        // 🎯 Phase 2: 待機中の表示も修正されたデータを使用
        const displayText = AppState.currentTranscript || AppState.transcriptHistory.join(' ');
        console.log('現在の累積文字起こし:', displayText);
    }
}

// =================================================================================
// Phase 1: 新しいprocessFinalTranscript関数（VoiceProcessingManager経由）
// =================================================================================

async function processFinalTranscript(text) {
    try {
        // VoiceProcessingManagerが利用可能か確認
        if (window.VoiceProcessingManager) {
            // VoiceProcessingManagerインスタンスを作成（初回のみ）
            if (!window.voiceProcessingManagerInstance) {
                window.voiceProcessingManagerInstance = new window.VoiceProcessingManager();
                const initialized = await window.voiceProcessingManagerInstance.initialize();
                if (!initialized) {
                    console.warn('[VoiceProcessingManager] 初期化失敗 - フォールバックを使用');
                }
            }
            
            // VoiceProcessingManagerを経由して処理
            return await window.voiceProcessingManagerInstance.processFinalTranscript(text);
        } else {
            console.warn('[VoiceProcessingManager] 利用不可 - 従来処理を直接実行');
            return await processFinalTranscriptOriginal(text);
        }
    } catch (error) {
        console.error('[VoiceProcessingManager] エラー:', error);
        // エラー時は従来処理にフォールバック
        return await processFinalTranscriptOriginal(text);
    }
}

// 🔧 Phase B: 音声訂正フィードバック
async function provideCorrectionFeedback(message) {
    console.log('🔧 音声訂正フィードバック:', message);
    
    try {
        // はほりーのによる簡潔なフィードバック
        const audioBlob = await ttsTextToAudioBlob(message, SPEAKERS.HAHORI);
        await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
        
        // 画面にもメッセージ表示
        window.showMessage('info', message);
        
    } catch (error) {
        console.error('❌ 音声訂正フィードバックエラー:', error);
        window.showMessage('info', message);
    }
}

async function handleUserTextInput(text) {
    if (!text || AppState.currentSpeaker !== SPEAKERS.NULL) return;

    await addMessageToChat(SPEAKERS.USER, text);
    
    // 会話欄に反映後、文字起こし欄をクリア
    AppState.transcriptHistory = [];
    AppState.currentTranscript = '';
    window.updateTranscriptDisplay();
    
    try {
        // 🎤 知見確認モード優先: 音声ベース知見評価の応答処理
        if (AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
            await processKnowledgeConfirmation(text);
            return;
        }
        
        switch (AppState.phase) {
            case 'warmup':
                await processWarmupUserResponse(text);
                break;
            case 'deepdive':
                await processDeepdiveUserResponse(text);
                break;
            case 'summary':
                await processSummaryUserResponse(text);
                break;
            case 'knowledge_confirmation':
                await processKnowledgeConfirmation(text);
                break;
        }
    } catch (error) {
        window.showMessage('error', `応答処理でエラーが発生しました: ${error.message}`);
    }
}

async function processWarmupUserResponse(text) {
    const confirmation = `ありがとうございます。それでは「${AppState.currentTheme}」について深く掘り下げていきましょう。ねほりーのから質問させていただきます。`;
    
    const [, audioBlob] = await Promise.all([
        addMessageToChat(SPEAKERS.HAHORI, confirmation),
        ttsTextToAudioBlob(confirmation, SPEAKERS.HAHORI)
    ]);
    
    await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);

    // フェーズ遷移はPhaseManagerに委譲
    if (window.PhaseManager) {
        await window.PhaseManager.transitionToPhase('deepdive', { theme: AppState.currentTheme });
    } else {
        AppState.phase = 'deepdive';
    }
    AppState.waitingForPermission = true;
    await startDeepdivePhase();
}

async function startDeepdivePhase() {
    updateSessionStatus('深掘り中', AppState.currentTheme);
    
    try {
        if (!window.AI_PROMPTS || !window.AI_PROMPTS.DEEPDIVE_FIRST) {
            console.error('❌ AI_PROMPTS.DEEPDIVE_FIRST が読み込まれていません');
            window.showMessage('error', 'プロンプト設定の読み込みに失敗しました。ページを再読み込みしてください。');
            return;
        }
        
        const prompt = window.AI_PROMPTS.DEEPDIVE_FIRST(
            AppState.currentTheme,
            AppState.selectedThemeDetails,
            AppState.themeSummaries
        );

        const firstQuestion = await gptMessagesToCharacterResponse([
            { role: 'user', content: prompt }
        ], SPEAKERS.NEHORI);
        
        await addMessageToChat(SPEAKERS.NEHORI, firstQuestion);
        const audio = await ttsTextToAudioBlob(firstQuestion, SPEAKERS.NEHORI);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
        
        AppState.waitingForPermission = true;
        
    } catch (error) {
        window.showMessage('error', `深掘りフェーズでエラーが発生しました: ${error.message}`);
    }
}

async function processDeepdiveUserResponse(text) {
    try {
        if (text.length > 50) {
            // 🎯 新機能: 音声ベース知見評価システムを使用
            const conversationContext = AppState.conversationHistory.slice(-3)
                .map(msg => `${msg.speaker}: ${msg.content}`)
                .join('\n');
            
            console.log('🔍 音声ベース知見評価システム開始...');
            const voiceResult = await VoiceKnowledgeSystem.processKnowledgeWithVoiceEvaluation(text, conversationContext);
            
            // voiceResultがnullの場合は手動確認待機中（音声応答待ち）
            if (voiceResult === null) {
                // 左ペインの音声コマンド表示を更新
                updateVoiceCommandsDisplay();
                // 右ペインの統計表示を更新
                updateKnowledgeSettingsDisplay();
                // 🚫 重要: 知見確認待機中はねほりーのの次の質問を生成しない
                console.log('🔄 知見確認待機中 - ねほりーのの質問生成を停止');
                AppState.waitingForPermission = true;
                return;
            }
            
            if (voiceResult.accepted) {
                // ✅ 知見が承認された場合（自動または手動）
                const summary = voiceResult.summary || voiceResult.evaluation?.summary || text.substring(0, 50) + '...';
                
                // 🔄 従来システムとの互換性: extractedKnowledgeに追加
                AppState.extractedKnowledge.push({
                    content: text,
                    summary: summary,
                    timestamp: new Date(),
                    point: AppState.currentPoint,
                    // 🆕 新機能: 品質評価データを追加
                    quality_evaluation: voiceResult.evaluation,
                    acceptance_reason: voiceResult.reason,
                    score: Math.round(voiceResult.evaluation.overall * 100)
                });
                
                // 🔄 新機能: 知見ファイル管理システムと連携
                if (window.KnowledgeState.currentSession) {
                    KnowledgeFileManager.addInsight(
                        text,
                        {
                            situation: conversationContext,
                            related_conversation: AppState.conversationHistory.slice(-2)
                        },
                        voiceResult.evaluation
                    );
                    console.log('✅ 知見ファイルシステムに保存完了');
                }
                
                window.updateKnowledgeDisplay();
                updateKnowledgeSettingsDisplay();
                
                // 次の質問へ
                await askNextQuestionInDeepDive();
                
            } else {
                // ❌ 知見が却下された場合
                const reason = voiceResult?.reason || 'unknown_error';
                const details = voiceResult?.details || '';
                
                console.log(`❌ 知見却下: ${reason}${details ? ' - ' + details : ''}`);
                
                // エラーの種類に応じた処理
                if (reason === 'prerequisites_not_met') {
                    window.showMessage('warning', `知見評価の前提条件エラー: ${details}`);
                } else if (reason === 'process_error') {
                    window.showMessage('error', `知見評価処理エラー: ${details}`);
                } else if (reason === 'manual_fallback_error') {
                    window.showMessage('error', '知見評価システムが利用できません。後でもう一度お試しください。');
                } else if (reason === 'manual_rejection') {
                    window.showMessage('info', '知見は保存されませんでした。');
                } else {
                    console.log(`❌ 知見却下: ${reason}`);
                }
                
                updateKnowledgeSettingsDisplay();
                
                // 次の質問へ
                await askNextQuestionInDeepDive();
            }
            
            AppState.waitingForPermission = true;
            
        } else {
            // 短い回答の場合：はほりーの発声なし、ねほりーの即座生成・発声
            if (VoiceOptimization.phase3.isActive) {
                await generateAndPlayNehoriImmediately();
            } else {
                // フォールバック: 従来の処理
                const prompt = window.AI_PROMPTS.DEEPDIVE_FOLLOWUP ? 
                    window.AI_PROMPTS.DEEPDIVE_FOLLOWUP(text, '') :
                    `回答「${text}」について、さらに深く掘り下げる質問をしてください。具体的なエピソード、感情、学び、背景などをより詳細に引き出してください。`;

                const followUp = await gptMessagesToCharacterResponse([
                    { role: 'user', content: prompt }
                ], SPEAKERS.NEHORI);

                await addMessageToChat(SPEAKERS.NEHORI, followUp);
                const audio = await ttsTextToAudioBlob(followUp, SPEAKERS.NEHORI);
                await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
            }
            
            AppState.waitingForPermission = true;
        }
        
    } catch (error) {
        window.showMessage('error', `深掘り応答処理でエラーが発生しました: ${error.message}`);
    }
}

async function askNextQuestionInDeepDive() {
    if (AppState.justPlayedPendingNehori) {
        return;
    }
    const isConfirmation = AppState.voiceRecognitionState.isKnowledgeConfirmationMode;
    try {
        const recentConversation = AppState.conversationHistory
            .slice(-6)
            .map(msg => `${msg.sender}: ${msg.content}`)
            .join('\n');
        const knowledgeContext = AppState.extractedKnowledge
            .map((knowledge, index) => `知見${index + 1}: ${knowledge.summary}`)
            .join('\n');
        if (!window.AI_PROMPTS || !window.AI_PROMPTS.DEEPDIVE_NEXT) {
            console.error('❌ AI_PROMPTS.DEEPDIVE_NEXT が読み込まれていません');
            window.showMessage('error', 'プロンプト設定の読み込みに失敗しました。ページを再読み込みしてください。');
            return;
        }
        const nextQuestionPrompt = window.AI_PROMPTS.DEEPDIVE_NEXT(
            AppState.currentTheme,
            recentConversation,
            knowledgeContext,
            AppState.selectedThemeDetails,
            AppState.themeSummaries
        );
        const nextQuestion = await gptMessagesToCharacterResponse([
            { role: 'user', content: nextQuestionPrompt }
        ], SPEAKERS.NEHORI);
        const audio = await ttsTextToAudioBlob(nextQuestion, SPEAKERS.NEHORI);
        if (isConfirmation) {
            AppState.pendingNehoriQuestion = nextQuestion;
            AppState.pendingNehoriAudio = audio;
            return;
        }
        await addMessageToChat(SPEAKERS.NEHORI, nextQuestion);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
    } catch (error) {
        window.showMessage('error', `次の質問生成でエラーが発生しました: ${error.message}`);
    }
}

async function processSummaryUserResponse(text) {
    // まとめフェーズの処理
    console.log('まとめフェーズの応答:', text);
}

async function processKnowledgeConfirmation(text) {
    console.log('🎤 音声ベース知見確認:', text);
    
    if (!AppState.voiceRecognitionState.pendingKnowledgeEvaluation) {
        console.warn('⚠️ 保留中の知見評価がありません');
        return;
    }
    
    const evaluation = AppState.voiceRecognitionState.pendingKnowledgeEvaluation;
    const userInput = text.toLowerCase().trim();
    
    // 閾値変更コマンドの確認
    if (await handleThresholdChangeCommand(userInput)) {
        return;
    }
    
    // 設定確認コマンドの確認
    if (handleSettingsInquiry(userInput)) {
        return;
    }
    
    // 詳細説明要求の確認
    if (VoicePatterns.DETAIL_PATTERNS.some(pattern => userInput.includes(pattern))) {
        await handleDetailedExplanation(evaluation);
        return;
    }
    
    // 承認パターンの確認
    if (VoicePatterns.APPROVAL_PATTERNS.some(pattern => userInput.includes(pattern))) {
        await handleKnowledgeApproval(evaluation);
        return;
    }
    
    // 拒否パターンの確認
    if (VoicePatterns.REJECTION_PATTERNS.some(pattern => userInput.includes(pattern))) {
        await handleKnowledgeRejection();
        return;
    }
    
    // 認識できない場合
    await handleUnrecognizedResponse();
}

// =================================================================================
// SESSION MANAGEMENT - セッション管理
// =================================================================================

// 🔧 セッション開始処理は app/session-start-manager.js に移動しました
// 後方互換性は window.startSession で保証

// 🔧 ウォームアップフェーズ開始処理は app/session-start-manager.js に移動しました
// 後方互換性は window.startWarmupPhase で保証





// =================================================================================
// UI MANAGEMENT - UI管理
// =================================================================================





async function addMessageToChat(speaker, message) {
    // 🚫 知見確認モード中はねほりーののメッセージ表示を絶対に行わない
    if (speaker === SPEAKERS.NEHORI && AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
        return;
    }
    const messagesContainer = window.UIManager.DOMUtils.get('messagesContainer');
    if (messagesContainer) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${speaker}`;
        
        const speakerName = {
            [SPEAKERS.NEHORI]: 'ねほりーの',
            [SPEAKERS.HAHORI]: 'はほりーの',
            [SPEAKERS.USER]: 'あなた'
        }[speaker];
        
        messageDiv.innerHTML = `
            <div class="message-header">${speakerName}</div>
            <div class="message-content">${message}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // 会話履歴に追加
        AppState.conversationHistory.push({
            sender: speaker,
            content: message,
            timestamp: new Date()
        });
        
        console.log(`✅ メッセージ追加: ${speakerName} - ${message.substring(0, 50)}...`);
    }
    // メッセージ追加後にAI応答中表示を制御
    if (speaker === SPEAKERS.NEHORI || speaker === SPEAKERS.HAHORI) {
        setTimeout(() => {
            AppState.currentSpeaker = SPEAKERS.NULL;
            window.updateTranscriptDisplay();
        }, 100);
    }
}

// 🔧 Phase B: 音声制御管理システム
const AudioControlManager = {
    // 現在再生中の音声を追跡
    activeAudioSources: new Set(),
    
    // 音声登録
    registerAudio(audioElement, source, speaker) {
        const audioData = {
            audio: audioElement,
            source: source,
            speaker: speaker,
            startTime: Date.now(),
            id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.activeAudioSources.add(audioData);
        console.log(`🎵 音声登録: ${speaker} (ID: ${audioData.id})`);
        
        // 音声終了時の自動削除
        audioElement.addEventListener('ended', () => {
            this.unregisterAudio(audioData);
        });
        
        audioElement.addEventListener('error', () => {
            this.unregisterAudio(audioData);
        });
        
        return audioData.id;
    },
    
    // 音声登録解除
    unregisterAudio(audioData) {
        this.activeAudioSources.delete(audioData);
        console.log(`🔇 音声登録解除: ${audioData.speaker} (ID: ${audioData.id})`);
    },
    
    // 全音声強制停止
    forceStopAllAudio(reason = 'user_request') {
        console.log(`🛑 全音声強制停止開始: ${reason} (対象: ${this.activeAudioSources.size}件)`);
        
        let stoppedCount = 0;
        this.activeAudioSources.forEach(audioData => {
            try {
                audioData.audio.pause();
                audioData.audio.currentTime = 0;
                URL.revokeObjectURL(audioData.audio.src);
                stoppedCount++;
                console.log(`🔇 停止: ${audioData.speaker} (再生時間: ${Date.now() - audioData.startTime}ms)`);
            } catch (error) {
                console.warn(`⚠️ 音声停止エラー (${audioData.speaker}):`, error);
            }
        });
        
        this.activeAudioSources.clear();
        AppState.currentSpeaker = SPEAKERS.NULL;
        
        console.log(`✅ 全音声停止完了: ${stoppedCount}件停止 (理由: ${reason})`);
        
        // ユーザー向けメッセージ
        if (stoppedCount > 0 && reason === 'user_request') {
            window.showMessage('info', `${stoppedCount}件の音声再生を停止しました`);
        }
        
        return stoppedCount;
    },
    
    // 特定話者の音声停止
    stopSpeakerAudio(speaker, reason = 'speaker_control') {
        let stoppedCount = 0;
        const audioToStop = Array.from(this.activeAudioSources).filter(audioData => audioData.speaker === speaker);
        
        audioToStop.forEach(audioData => {
            try {
                audioData.audio.pause();
                audioData.audio.currentTime = 0;
                URL.revokeObjectURL(audioData.audio.src);
                this.activeAudioSources.delete(audioData);
                stoppedCount++;
                console.log(`🔇 ${speaker}音声停止: ${audioData.id}`);
            } catch (error) {
                console.warn(`⚠️ ${speaker}音声停止エラー:`, error);
            }
        });
        
        if (AppState.currentSpeaker === speaker) {
            AppState.currentSpeaker = SPEAKERS.NULL;
        }
        
        console.log(`✅ ${speaker}音声停止完了: ${stoppedCount}件 (理由: ${reason})`);
        return stoppedCount;
    },
    
    // アクティブな音声情報取得
    getActiveAudioInfo() {
        return Array.from(this.activeAudioSources).map(audioData => ({
            speaker: audioData.speaker,
            source: audioData.source,
            duration: Date.now() - audioData.startTime,
            id: audioData.id
        }));
    }
};

async function playPreGeneratedAudio(audioBlob, speaker) {
    // 🚫 知見確認モード中はねほりーのの音声再生を絶対に行わない
    if (speaker === SPEAKERS.NEHORI && AppState.voiceRecognitionState.isKnowledgeConfirmationMode) {
        return;
    }
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(audioBlob);
        
        // 🔧 Phase B: 音声管理システムに登録
        const audioId = AudioControlManager.registerAudio(audio, 'tts_generated', speaker);
        
        // 音量設定を適用
        const voiceSettings = getVoiceSettings(speaker);
        audio.volume = voiceSettings.volume;
        
        AppState.currentSpeaker = speaker;
        
        // 🎨 新機能: 話者変化イベントを発行（右パネル背景変化のため）
        if (window.dispatchEvent) {
            const speakerChangeEvent = new CustomEvent('speaker-change', {
                detail: { speaker: speaker }
            });
            window.dispatchEvent(speakerChangeEvent);
            console.log(`🎨 話者変化イベント発行: ${speaker}`);
        }
        
        // Phase 3: はほりーの発声開始時にねほりーの生成を開始
        if (speaker === SPEAKERS.HAHORI && VoiceOptimization.phase3.isActive) {
            VoiceOptimization.phase3.hahoriSpeechStartTime = Date.now();
            startNehoriGenerationDuringHahori();
        }
        
        audio.onended = async () => {
            AppState.currentSpeaker = SPEAKERS.NULL;
            URL.revokeObjectURL(audio.src);
            
            // 🎨 新機能: 話者変化イベントを発行（発話終了時）
            if (window.dispatchEvent) {
                const speakerChangeEvent = new CustomEvent('speaker-change', {
                    detail: { speaker: null }
                });
                window.dispatchEvent(speakerChangeEvent);
                console.log('🎨 話者変化イベント発行: null (発話終了)');
            }
            
            // Phase 3: はほりーの発声終了後、ねほりーのを即座に再生
            if (speaker === SPEAKERS.HAHORI && VoiceOptimization.phase3.shouldPlayNehoriImmediately) {
                await handleNehoriImmediatePlayback();
            }
            
            // AI発言終了後、音声認識を確実に再開
            restartSpeechRecognition();
            
            resolve();
        };
        
        audio.onerror = (error) => {
            AppState.currentSpeaker = SPEAKERS.NULL;
            URL.revokeObjectURL(audio.src);
            
            // 🎨 新機能: 話者変化イベントを発行（エラー時）
            if (window.dispatchEvent) {
                const speakerChangeEvent = new CustomEvent('speaker-change', {
                    detail: { speaker: null }
                });
                window.dispatchEvent(speakerChangeEvent);
                console.log('🎨 話者変化イベント発行: null (エラー)');
            }
            
            reject(error);
        };
        
        audio.play().catch(reject);
    });
}

// =================================================================================
// VOICE OPTIMIZATION PHASE 3 - 音声最適化 Phase 3
// =================================================================================

// 🔧 改善版: ゲートキーパー対応のねほりーの質問生成
// 🔧 ねほりー関数群: startNehoriGenerationDuringHahori は app/voice-phase2-manager.js に分離済み
// 完全後方互換性のため、既存参照は window.startNehoriGenerationDuringHahori で維持

// 🔧 改善版: ゲートキーパー対応のねほりーの即座再生
// 🔧 ねほりー関数群: 以下の関数は app/voice-phase2-manager.js に分離済み
// - handleNehoriImmediatePlayback
// - generateAndPlayNehoriImmediately  
// - playPendingNehoriIfNeeded
// 完全後方互換性のため、既存参照は window.* で維持

// 🔧 はほりー関数群: 以下の関数は app/voice-phase2-manager.js に分離済み
// - startHahoriGenerationDuringNehori
// - handleHahoriImmediatePlayback
// - playPendingHahoriIfNeeded
// 完全後方互換性のため、既存参照は window.* で維持

// =================================================================================
// DATA EXPORT - データエクスポート
// =================================================================================

function downloadMarkdownReport() {
    console.log('💡 downloadMarkdownReport が実行されました');
    
    try {
        const markdown = generateMarkdownReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `深堀セッション_${timestamp}.md`;
        
        downloadTextFile(markdown, filename);
        
        window.showMessage('success', 'レポートをダウンロードしました');
        console.log('✅ レポートダウンロード完了');
        
    } catch (error) {
        console.error('❌ レポートダウンロードエラー:', error);
        window.showMessage('error', 'レポートダウンロードに失敗しました');
    }
}

// =================================================================================
// KNOWLEDGE PERSISTENCE SYSTEM - 知見永続化システム
// =================================================================================

// 🧬 全知見永続化データベース管理 - knowledge-management.jsに移動

// 🧬 全知見ダウンロード機能 - knowledge-management.jsに移動

// AI整理による全知見の拡張処理 - knowledge-management.jsに移動
// 全知見アーカイブファイル内容構築 - knowledge-management.jsに移動

// 🔄 互換性のためのラッパー関数（exportAllData → downloadAllKnowledge）
async function exportAllData() {
    console.log('💡 exportAllData が実行されました（downloadAllKnowledgeへリダイレクト）');
    await downloadAllKnowledge();
}

function generateMarkdownReport() {
    let markdown = `# 深堀セッション レポート\n\n`;
    markdown += `**テーマ:** ${AppState.currentTheme}\n`;
    markdown += `**開始時刻:** ${AppState.sessionStartTime ? AppState.sessionStartTime.toLocaleString('ja-JP') : '不明'}\n`;
    markdown += `**生成時刻:** ${new Date().toLocaleString('ja-JP')}\n\n`;
    
    if (AppState.conversationHistory.length > 0) {
        markdown += `## 会話履歴\n\n`;
        AppState.conversationHistory.forEach((msg, index) => {
            const senderName = {
                [SPEAKERS.NEHORI]: 'ねほりーの',
                [SPEAKERS.HAHORI]: 'はほりーの',
                [SPEAKERS.USER]: 'あなた'
            }[msg.sender];
            
            markdown += `### ${index + 1}. ${senderName}\n`;
            markdown += `${msg.content}\n\n`;
        });
    }
    
    if (AppState.extractedKnowledge.length > 0) {
        markdown += `## 抽出された知見\n\n`;
        AppState.extractedKnowledge.forEach((knowledge, index) => {
            markdown += `### 知見 ${index + 1}\n`;
            markdown += `**要約:** ${knowledge.summary}\n\n`;
            markdown += `**詳細:**\n${knowledge.content}\n\n`;
            if (knowledge.timestamp) {
                markdown += `**記録時刻:** ${knowledge.timestamp.toLocaleString('ja-JP')}\n\n`;
            }
            markdown += `---\n\n`;
        });
    }
    
    return markdown;
}

// downloadTextFile関数はapp/utils.jsに移動しました

// =================================================================================
// CRYPTO UTILITIES - 暗号化ユーティリティ
// =================================================================================

// LocalStorage操作関数はapp/storage-manager.jsに移動済み

// 🔧 2ステップ状態評価は app/session-start-manager.js に移動しました
// 後方互換性は window.evaluate2StepStatus で保証

// 🔧 2ステップUI更新機能は app/session-start-manager.js に移動しました
// 後方互換性は window.update2StepUI で保証

// 🔧 フォーカス制御関数は app/session-start-manager.js に移動しました
// 後方互換性は window.focusPasswordInput、window.focusThemeInput で保証

// 🔧 ログイン状態クリア処理は app/session-start-manager.js に移動しました
// 後方互換性は window.handleLogout で保証

// 🔧 テーマクリア処理は app/session-start-manager.js に移動しました
// 後方互換性は window.handleThemeClear で保証

// 🔧 セッション開始ボタンの状態更新は app/session-start-manager.js に移動しました
// 後方互換性は window.updateSessionStartButton で保証

// 🔄 アプリケーション状態復元機能
async function restoreApplicationState() {
    try {
        console.log('📋 アプリケーション状態復元開始...');
        
        // 1. ログイン状態の復元
        const isLoggedIn = loadLoginState();
        if (isLoggedIn) {
            console.log('🔐 ログイン状態を復元中...');
            // 保存されたAPIキーがあるかチェック
            const savedHashes = getPasswordHashList();
            if (savedHashes.length > 0) {
                // APIキーは既に暗号化されているので、ここでは状態のみ設定
                console.log('✅ ログイン状態復元: APIキーが保存されています');
                // 注意: AppState.apiKeyは実際のパスワード入力時に設定される
            } else {
                // 保存されたAPIキーがない場合はログイン状態をクリア
                clearLoginState();
                console.log('⚠️ APIキーが見つからないため、ログイン状態をクリア');
            }
        }
        
        // 2. テーマ入力状態の復元
        const savedTheme = loadThemeInputState();
        if (savedTheme) {
            const themeInput = window.UIManager.DOMUtils.get('themeInput');
            if (themeInput) {
                themeInput.value = savedTheme;
                console.log(`🎨 テーマ入力状態復元: "${savedTheme}"`);
            }
        }
        
        // 3. 音声ベース知見評価設定の復元
        loadKnowledgeSettings();
        updateKnowledgeSettingsDisplay();
        console.log('🎯 音声ベース知見評価設定復元完了');
        
        // 4. 2ステップUIの初期更新
        update2StepUI();
        
        // 5. ファイル入力の初期状態設定
        setTimeout(() => {
            updateFileInputDisplay();
        }, 100);
        
        console.log('✅ アプリケーション状態復元完了');
        
    } catch (error) {
        console.error('❌ 状態復元エラー:', error);
        // エラーが発生した場合は状態をクリア
        clearLoginState();
        clearThemeInputState();
        update2StepUI();
    }
}

// =================================================================================
// API KEY MANAGEMENT - APIキー管理
// =================================================================================

async function setupApiKey() {
    console.log('💡 setupApiKey が実行されました');
    
    const elements = window.UIManager.DOMUtils.getAll(['apiKeyInput', 'apiPasswordInput', 'testApiButton', 'startButton']);
    
    if (!elements.apiKeyInput || !elements.apiPasswordInput) {
        window.showMessage('error', '入力欄が見つかりません');
        return;
    }
    
    const apiKey = elements.apiKeyInput.value.trim();
    const password = elements.apiPasswordInput.value.trim();
    
    if (!password) {
        window.showMessage('error', 'パスワードを入力してください');
        return;
    }
    
    if (apiKey && !apiKey.startsWith('sk-')) {
        window.showMessage('error', '正しいOpenAI APIキーを入力してください (sk-...で始まる)');
        return;
    }
    
    try {
        if (apiKey) {
            console.log('🔍 新しいAPIキーの接続テストを実行中...');
            
            if (hasApiKeyForPassword(password)) {
                const overwrite = confirm(`このパスワードには既にAPIキーが保存されています。\n上書きしますか？`);
                if (!overwrite) {
                    window.showMessage('info', 'APIキーの設定をキャンセルしました');
                    return;
                }
            }
            
            window.showMessage('info', 'APIキー接続テスト中...');
            
            AppState.apiKey = apiKey;
            const isValid = await testApiConnection();
            
            if (isValid) {
                saveEncryptedApiKey(apiKey, password);
                window.showMessage('success', '✅ APIキー接続テスト成功！暗号化保存されました');
                elements.apiKeyInput.value = '';
                
                updateApiKeyStatusDisplay();
                
                if (elements.startButton) {
                    elements.startButton.disabled = false;
                    console.log('✅ セッション開始ボタンを有効化しました');
                }
            } else {
                AppState.apiKey = null;
                window.showMessage('error', '❌ APIキーが無効です。正しいキーを入力してください');
                
                if (elements.startButton) {
                    elements.startButton.disabled = true;
                }
                return;
            }
        } else {
            console.log('🔍 保存済みAPIキーの読み込みと接続テスト中...');
            window.showMessage('info', '保存済みAPIキーの接続テスト中...');
            
            const decryptedKey = loadEncryptedApiKey(password);
            AppState.apiKey = decryptedKey;
            
            const isValid = await testApiConnection();
            
            if (isValid) {
                window.showMessage('success', '✅ 保存されたAPIキーを読み込みました（接続確認済み）');
                
                if (elements.startButton) {
                    elements.startButton.disabled = false;
                    console.log('✅ セッション開始ボタンを有効化しました');
                }
            } else {
                AppState.apiKey = null;
                window.showMessage('error', '❌ 保存されたAPIキーが無効です。新しいキーを設定してください');
                
                clearSavedApiKey(password);
                console.log('🗑️ 無効なAPIキーを削除しました');
                
                if (elements.startButton) {
                    elements.startButton.disabled = true;
                }
                return;
            }
        }
        
        elements.apiPasswordInput.value = '';
        
        if (elements.testApiButton) {
            elements.testApiButton.disabled = false;
        }
        
        console.log('✅ APIキー設定完了');
        
    } catch (error) {
        AppState.apiKey = null;
        
        if (elements.startButton) {
            elements.startButton.disabled = true;
        }
        
        console.error('❌ APIキー設定エラー:', error);
        window.showMessage('error', 'APIキー設定に失敗しました');
    }
}

async function testApiConnection() {
    console.log('🔍 testApiConnection が実行されました');
    
    // 🔐 埋め込みAPI Key統合: 優先順位制御でAPI Key取得
    let apiKeyToTest = AppState.apiKey;
    
    if (!apiKeyToTest && window.StorageManager && window.StorageManager.apiKey.getWithPriority) {
        apiKeyToTest = window.StorageManager.apiKey.getWithPriority();
        if (apiKeyToTest) {
            console.log('🏢 埋め込みAPI Keyでテスト実行');
            // AppStateも更新
            AppState.apiKey = apiKeyToTest;
            AppState.apiKeySource = 'embedded';
        }
    }
    
    if (!apiKeyToTest) {
        console.log('APIキーが設定されていません');
        return false;
    }
    
    try {
        console.log('API接続テストを開始します');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyToTest}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5
            })
        });
        
        if (response.ok) {
            console.log('✅ API接続テスト成功');
            return true;
        } else {
            const errorData = await response.json();
            console.error('❌ API接続テスト失敗:', errorData);
            return false;
        }
    } catch (error) {
        console.error('❌ API接続テストエラー:', error);
        return false;
    }
}

async function testApiKey() {
    console.log('💡 testApiKey が実行されました');
    
    if (!AppState.apiKey) {
        window.showMessage('error', 'APIキーが設定されていません');
        return;
    }
    
    window.showMessage('info', 'API接続テスト中...');
    const isValid = await testApiConnection();
    
    if (isValid) {
        window.showMessage('success', 'API接続テスト成功！キーは有効です');
        
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.disabled = false;
            console.log('✅ セッション開始ボタンを有効化しました');
        }
    } else {
        window.showMessage('error', 'API接続失敗：キーが無効です');
        
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.disabled = true;
            console.log('❌ セッション開始ボタンを無効化しました');
        }
    }
}


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

/**
 * APIキー削除機能（UIボタン用）
 */
function clearApiKey() {
    try {
        console.log('💡 clearApiKey が実行されました');
        
        const passwordInput = document.getElementById('apiPasswordInput');
        if (!passwordInput) {
            window.showMessage('error', 'パスワード入力フィールドが見つかりません');
            return;
        }
        
        const password = passwordInput.value.trim();
        if (!password) {
            window.showMessage('error', 'パスワードを入力してからAPIキーを削除してください');
            return;
        }
        
        // 該当するAPIキーが存在するかチェック
        if (!hasApiKeyForPassword(password)) {
            window.showMessage('error', 'そのパスワードに対応するAPIキーは見つかりませんでした');
            return;
        }
        
        // 確認ダイアログ
        if (confirm('保存されたAPIキーを削除しますか？\nこの操作は取り消せません。')) {
            // APIキーを削除
            clearSavedApiKey(password);
            
            // パスワードハッシュリストからも削除
            const passwordHash = window.hashPassword(password);
            const hashList = getPasswordHashList();
            const updatedList = hashList.filter(hash => hash !== passwordHash);
            localStorage.setItem('fukabori_password_hashes', JSON.stringify(updatedList));
            
            // 入力フィールドをクリア
            passwordInput.value = '';
            
            // 現在ログインしているAPIキーが削除された場合の処理
            if (AppState.apiKey && loadEncryptedApiKey(password) === AppState.apiKey) {
                AppState.apiKey = '';
                AppState.sessionActive = false;
                // ログイン状態をクリア
                clearLoginState();
            }
            
            // Step0の表示状態を更新
            if (typeof updateStep0Visibility === 'function') {
                updateStep0Visibility();
            }
            
            // UI更新
            updateApiKeyStatusDisplay();
            update2StepUI();
            
            window.showMessage('success', 'APIキーを削除しました');
            console.log('✅ APIキー削除完了');
        }
        
    } catch (error) {
        console.error('❌ APIキー削除エラー:', error);
        window.showMessage('error', 'APIキーの削除に失敗しました: ' + error.message);
    }
}

/**
 * パスワード変更機能
 */
function changePassword() {
    try {
        console.log('💡 changePassword が実行されました');
        
        const passwordInput = document.getElementById('apiPasswordInput');
        if (!passwordInput) {
            window.showMessage('error', 'パスワード入力フィールドが見つかりません');
            return;
        }
        
        const currentPassword = passwordInput.value.trim();
        if (!currentPassword) {
            window.showMessage('error', '現在のパスワードを入力してください');
            return;
        }
        
        // 現在のパスワードでAPIキーが存在するかチェック
        if (!hasApiKeyForPassword(currentPassword)) {
            window.showMessage('error', '現在のパスワードに対応するAPIキーが見つかりません');
            return;
        }
        
        // 現在のAPIキーを読み込み
        const currentApiKey = loadEncryptedApiKey(currentPassword);
        if (!currentApiKey) {
            window.showMessage('error', '現在のパスワードでAPIキーを復号できませんでした');
            return;
        }
        
        // 新しいパスワードの入力
        const newPassword = prompt('新しいパスワードを入力してください:');
        if (!newPassword) {
            return; // キャンセルされた
        }
        
        if (newPassword.length < 4) {
            window.showMessage('error', 'パスワードは4文字以上で入力してください');
            return;
        }
        
        // パスワード確認
        const confirmPassword = prompt('新しいパスワードを再入力してください:');
        if (newPassword !== confirmPassword) {
            window.showMessage('error', 'パスワードが一致しません');
            return;
        }
        
        // 新しいパスワードで既にAPIキーが存在するかチェック
        if (hasApiKeyForPassword(newPassword)) {
            window.showMessage('error', 'そのパスワードは既に使用されています');
            return;
        }
        
        // 古いAPIキーを削除
        clearSavedApiKey(currentPassword);
        
        // 古いパスワードハッシュをリストから削除
        const oldPasswordHash = window.hashPassword(currentPassword);
        const hashList = getPasswordHashList();
        const filteredList = hashList.filter(hash => hash !== oldPasswordHash);
        
        // 新しいパスワードで保存
        saveEncryptedApiKey(currentApiKey, newPassword);
        
        // パスワード入力フィールドを新しいパスワードに更新
        passwordInput.value = newPassword;
        
        // UI更新
        updateApiKeyStatusDisplay();
        
        window.showMessage('success', 'パスワードを変更しました');
        console.log('🔐 パスワード変更完了');
        
    } catch (error) {
        console.error('❌ パスワード変更エラー:', error);
        window.showMessage('error', 'パスワードの変更に失敗しました: ' + error.message);
    }
}

// =================================================================================
// ADDITIONAL FUNCTIONS - 追加機能
// =================================================================================

function handleModalBackgroundClick(event) {
    if (event.target === event.currentTarget) {
        closeAdvancedSettings();
    }
}

function toggleMicrophone() {
    console.log('💡 toggleMicrophone が実行されました');
    
    // 📝 編集システムに手動操作を通知
    if (window.transcriptEditManager) {
        window.transcriptEditManager.lastManualActionTime = Date.now();
        console.log('📝 編集システムに手動操作を通知');
    }
    
    try {
        // 🔧 統一状態管理システム - 正しいアクセス方法
        if (!window.unifiedStateManager) {
            throw new Error('統一状態管理システムが未初期化');
        }
        
        const voiceModule = window.unifiedStateManager.modules.get('voice');
        if (!voiceModule) {
            throw new Error('音声モジュールが利用不可 - 統一状態管理システム未初期化');
        }
        
        const state = voiceModule.getState();
        console.log('🔄 統一状態管理システム使用:', state.recognitionState);
        
        if (state.recognitionState === 'active') {
            console.log('⏸️ 手動一時停止（透明継続無効）');
            voiceModule.pauseRecognition();
        } else if (state.recognitionState === 'paused' || state.recognitionState === 'idle' || state.recognitionState === 'stopping') {
            console.log('▶️ 手動再開');
            voiceModule.resumeRecognition();
        }
        
        // UI更新
        updatePauseResumeButton();
        
    } catch (error) {
        console.error('❌ 音声制御エラー:', error.message);
        console.log('🔄 音声認識システム初期化中の可能性があります - 再試行してください');
        
        // フォールバック: 直接音声認識を試行
        if (window.recognition) {
            try {
                window.recognition.stop();
                console.log('🔄 フォールバック音声認識停止');
            } catch (fallbackError) {
                console.log('🎤 フォールバック音声認識開始試行');
                // 通常は何もしない（システム初期化待ち）
            }
        }
    }
}

// 🔧 レガシー関数は削除 - toggleMicrophoneに統一

// =================================================================================
// VOICE CONTROL - シンプル音声制御システム
// =================================================================================

/**
 * 一時停止ボタンのシンプルUI更新
 * UnifiedStateManagerの状態のみに基づく軽量実装
 */
function updatePauseResumeButton() {
    const pauseBtn = document.getElementById('pauseResumeBtn');
    if (!pauseBtn) return;
    
    try {
        let isActive = false;
        
        // 🔧 統一状態管理システム - 正しいアクセス方法
        if (window.unifiedStateManager) {
            const voiceModule = window.unifiedStateManager.modules.get('voice');
            if (voiceModule) {
                const state = voiceModule.getState();
                isActive = state && state.recognitionState === 'active';
                
                // paused状態の場合は明示的に再開表示
                if (state && state.recognitionState === 'paused') {
                    isActive = false; // 一時停止中は再開ボタンを表示
                }
            }
        }
        
        // ボタンの表示とスタイルを更新
        if (isActive) {
            // 音声認識中 = 一時停止可能
            pauseBtn.innerHTML = '⏸️ 一時停止';
            pauseBtn.style.backgroundColor = ''; // 通常色（CSSデフォルト）
            pauseBtn.style.color = '';
        } else {
            // 音声認識停止中 = 再開可能
            pauseBtn.innerHTML = '▶️ 再開';
            pauseBtn.style.backgroundColor = '#4CAF50'; // 緑色
            pauseBtn.style.color = 'white';
        }
        
    } catch (error) {
        // エラーは静かにログのみ
        console.debug('一時停止ボタン更新エラー:', error);
    }
}

/**
 * 一時停止ボタンの定期更新を開始
 * セッション開始時に呼び出される
 */
function startPauseButtonMonitoring() {
    if (window.pauseButtonMonitoringInterval) {
        clearInterval(window.pauseButtonMonitoringInterval);
    }
    
    window.pauseButtonMonitoringInterval = setInterval(() => {
        updatePauseResumeButton();
    }, 1000); // 1秒間隔で更新（軽量化）
    
    console.log('✅ 一時停止ボタン監視開始');
}

// 🔧 監視システム統合完了: VoiceUIManagerの既存500ms監視に統合済み
// setupPauseResumeButtonMonitoring() - 削除（重複監視の除去）

// 🔧 統一システム対応: AppState変化時の一時停止ボタン更新
if (typeof window !== 'undefined') {
    window.addEventListener('appStateChanged', () => {
        setTimeout(() => updatePauseResumeButton(), 100);
    });
}


// forceStopAllActivity関数を削除 - マッチポンプ設計の根本原因であったため完全除去

// =================================================================================
// SESSION MANAGEMENT - セッション管理システム
// =================================================================================

// 🔧 セッション終了システムは app/session-manager.js に移動しました
// 以下の関数群は新モジュールに統合されています:
// - generateFinalSummary()     → SessionEndManager.generateFinalSummary()
// - generateFinalGreeting()    → SessionEndManager.generateFinalGreeting()
// - handleSessionEnd()         → SessionEndManager.handleSessionEndCommand()
// - endConversationSession()   → SessionEndManager.endSession()
// - returnToLogin()            → SessionEndManager.returnToLogin()

// 後方互換性は window.endConversationSession 等のラッパー関数で保証



// =================================================================================
// MISSING FUNCTIONS - 不足していた関数
// =================================================================================

async function testCharacterVoice(character) {
    console.log('💡 testCharacterVoice が実行されました:', character);
    console.log('現在のAPIキー状態:', !!AppState.apiKey);
    
    if (!AppState.apiKey) {
        console.log('APIキーが設定されていません');
        window.showMessage('error', 'まずAPIキーを設定してください');
        return;
    }

    try {
        console.log('音声テストを開始します');
        
        let testMessage;
        if (window.AI_PROMPTS && window.AI_PROMPTS.TEST_MESSAGES) {
            testMessage = window.AI_PROMPTS.TEST_MESSAGES[character];
        } else {
            testMessage = character === SPEAKERS.NEHORI ? 
                'こんにちは！ねほりーのです。今の音声設定はいかがでしょうか？' :
                'はほりーのと申します。この音声設定で進行させていただきます。';
        }
        
        console.log('テストメッセージ:', testMessage);
        
        const audioBlob = await ttsTextToAudioBlob(testMessage, character);
        await playPreGeneratedAudio(audioBlob, character);
        
        window.showMessage('success', `${character}の音声テストが完了しました`);
        console.log('音声テスト完了');
    } catch (error) {
        console.error('音声テストエラー:', error);
        window.showMessage('error', `音声テストに失敗しました: ${error.message}`);
    }
}

function changeTheme(newTheme) {
    console.log('💡 changeTheme が実行されました:', newTheme);
    
    if (newTheme && newTheme !== currentTheme) {
        currentTheme = newTheme;
        
        // テーマ適用
        document.body.className = `theme-${newTheme}`;
        
        // テーマ設定を保存
        localStorage.setItem('fukabori_theme', newTheme);
        
        console.log(`✅ テーマを「${newTheme}」に変更しました`);
        window.showMessage('success', `テーマを「${newTheme}」に変更しました`);
    }
}

async function handleThemeChange() {
    const themeChangeMessage = `テーマの変更をご希望ですね。新しいテーマを教えてください。「新しいテーマは○○です、どうぞ」とおっしゃってください。`;
    
    const [, audioBlob] = await Promise.all([
        addMessageToChat(SPEAKERS.HAHORI, themeChangeMessage),
        ttsTextToAudioBlob(themeChangeMessage, SPEAKERS.HAHORI)
    ]);
    
    await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
    AppState.waitingForPermission = true;
}

async function handleQuestionChange() {
    const questionChangeMessage = `質問を変更いたします。新しい角度から質問させていただきますね。`;
    
    const [, audioBlob] = await Promise.all([
        addMessageToChat(SPEAKERS.HAHORI, questionChangeMessage),
        ttsTextToAudioBlob(questionChangeMessage, SPEAKERS.HAHORI)
    ]);
    
    await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
    await askNextQuestion();
}

async function askNextQuestion() {
    console.log('🎯 次の質問を生成します');
    
    if (window.AI_PROMPTS && window.AI_PROMPTS.DEEPDIVE_NEXT) {
        const conversationContext = AppState.conversationHistory.map(msg => msg.content).join(' ');
        const knowledgeContext = AppState.extractedKnowledge.map(k => k.summary).join(' ');
        
        const prompt = window.AI_PROMPTS.DEEPDIVE_NEXT(
            AppState.currentTheme,
            conversationContext,
            knowledgeContext,
            AppState.selectedThemeDetails,
            AppState.themeSummaries
        );
        
        const question = await gptMessagesToCharacterResponse([
            { role: 'user', content: prompt }
        ], SPEAKERS.NEHORI);
        
        await addMessageToChat(SPEAKERS.NEHORI, question);
        const audio = await ttsTextToAudioBlob(question, SPEAKERS.NEHORI);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
    }
}

function loadSavedTheme() {
    const savedTheme = window.StorageManager.theme.loadSaved();
    if (savedTheme) {
        currentTheme = savedTheme;
        document.body.className = `theme-${savedTheme}`;
        console.log(`✅ 保存されたテーマ「${savedTheme}」を読み込みました`);
    }
}

// =================================================================================
// FILE HANDLING FUNCTIONS - ファイル処理機能
// =================================================================================

// 🛡️ ファイル選択前のログインチェック
// =============================
// 5678行目 - 7218行目
// ファイル処理関連の全関数は
// app/file-processing.jsに移動しました
// =============================

// =================================================================================
// GLOBAL FUNCTIONS - グローバル関数公開
// =================================================================================

// HTMLから呼び出される関数をグローバルに公開
window.loginWithPassword = loginWithPassword;
window.openAdvancedSettings = openAdvancedSettings;
window.closeAdvancedSettings = closeAdvancedSettings;
window.setupApiKey = setupApiKey;
window.testApiKey = testApiKey;
window.handleModalBackgroundClick = handleModalBackgroundClick;
window.startSession = startSession;
window.toggleMicrophone = toggleMicrophone;
// window.forceStopAllActivity = forceStopAllActivity; // マッチポンプ設計除去のため削除
window.updatePauseResumeButton = updatePauseResumeButton;
window.startPauseButtonMonitoring = startPauseButtonMonitoring;
window.endConversationSession = endConversationSession;
window.downloadMarkdownReport = downloadMarkdownReport;
window.downloadKnowledgeFile = downloadKnowledgeFile;
window.downloadAllKnowledge = downloadAllKnowledge;
window.FukaboriKnowledgeDatabase = FukaboriKnowledgeDatabase;
window.exportAllData = exportAllData;
window.returnToLogin = returnToLogin;
window.testCharacterVoice = testCharacterVoice;
window.changeTheme = changeTheme;

// セッション終了関数を公開
window.handleSessionEnd = handleSessionEnd;

// 🔧 Phase B: 音声制御機能を公開
window.AudioControlManager = AudioControlManager;
window.stopAllAudio = () => AudioControlManager.forceStopAllAudio('user_request');
window.stopSpeakerAudio = (speaker) => AudioControlManager.stopSpeakerAudio(speaker, 'user_request');
window.getActiveAudioInfo = () => AudioControlManager.getActiveAudioInfo();

// 🎨 Phase B: スマート音声操作パネル管理システム
const SmartVoicePanelManager = {
    isExpanded: false,
    
    // 折りたたみ/展開切り替え
    toggle() {
        this.isExpanded = !this.isExpanded;
        this.updateDisplay();
    },
    
    // 表示更新
    updateDisplay() {
        const compactPanel = document.getElementById('smartVoiceCompact');
        const expandedPanel = document.getElementById('smartVoiceExpanded');
        const toggleIcon = document.getElementById('smartVoiceToggle');
        
        if (this.isExpanded) {
            // 展開表示
            if (compactPanel) compactPanel.classList.add('hidden');
            if (expandedPanel) expandedPanel.classList.remove('hidden');
            if (toggleIcon) toggleIcon.textContent = '[▲]';
        } else {
            // 簡易表示
            if (compactPanel) compactPanel.classList.remove('hidden');
            if (expandedPanel) expandedPanel.classList.add('hidden');
            if (toggleIcon) toggleIcon.textContent = '[▼]';
        }
        
        console.log(`🎤 スマート音声パネル: ${this.isExpanded ? '展開' : '折りたたみ'}`);
    },
    
    // 利用可能コマンドの動的更新
    updateAvailableCommands(commands) {
        const availableCommandsElement = document.getElementById('availableCommands');
        if (availableCommandsElement) {
            const commandText = Array.isArray(commands) ? commands.join('、') : commands;
            availableCommandsElement.textContent = `現在利用可能: ${commandText}`;
        }
    },
    
    // セッション状況に応じたコマンド判定
    getContextualCommands() {
        const commands = [];
        
        // 基本コマンド
        if (AppState.sessionActive) {
            if (AppState.waitingForPermission) {
                commands.push('どうぞ');
            }
            commands.push('終了して');
        }
        
        // 文字訂正コマンド（常に利用可能）
        commands.push('削除');
        commands.push('置換');
        
        // セッション状況に応じて追加
        if (AppState.sessionActive) {
            commands.push('質問変更');
            
            if (AppState.currentTheme) {
                commands.push('テーマ変更');
            }
        }
        
        // 知見確認モードの場合
        if (AppState.voiceRecognitionState?.isKnowledgeConfirmationMode) {
            commands.push('はい/いいえ');
            commands.push('詳しく');
        }
        
        return commands;
    },
    
    // 自動更新
    autoUpdate() {
        const contextualCommands = this.getContextualCommands();
        this.updateAvailableCommands(contextualCommands);
        
        // 知見確認モードの表示制御
        const knowledgeCommands = document.getElementById('knowledgeCommands');
        if (knowledgeCommands) {
            if (AppState.voiceRecognitionState?.isKnowledgeConfirmationMode) {
                knowledgeCommands.classList.remove('hidden');
            } else {
                knowledgeCommands.classList.add('hidden');
            }
        }
    },
    
    // 初期化
    init() {
        this.updateDisplay();
        this.autoUpdate();
        
        // 定期的な自動更新（5秒間隔）
        setInterval(() => {
            this.autoUpdate();
        }, 5000);
        
        console.log('🎤 スマート音声操作パネル初期化完了');
    }
};

// 🧪 音声コマンドテストモード
async function testVoiceCommands() {
    console.log('🧪 音声コマンドテストモード開始');
    
    const testCommands = [
        { command: 'どうぞ', description: '発話許可コマンド' },
        { command: '3文字削除', description: '部分削除コマンド' },
        { command: '車内を社内にして', description: '基本置換コマンド' },
        { command: '車内は会社の社内にして', description: '文脈置換コマンド' },
        { command: '削除', description: '全削除コマンド' }
    ];
    
    let testResults = [];
    
    for (const test of testCommands) {
        try {
            if (test.command === 'どうぞ') {
                // 特別コマンドのテスト
                testResults.push({
                    command: test.command,
                    result: '✅ 特別コマンド（従来処理）',
                    description: test.description
                });
            } else {
                // 音声訂正コマンドのテスト
                const result = SpeechCorrectionSystem.detectCorrectionCommand(test.command);
                testResults.push({
                    command: test.command,
                    result: result.type !== 'normal' ? `✅ ${result.type}` : '❌ 認識失敗',
                    description: test.description
                });
            }
        } catch (error) {
            testResults.push({
                command: test.command,
                result: '❌ エラー',
                description: test.description
            });
        }
    }
    
    // テスト結果表示
    const resultMessage = testResults.map(test => 
        `${test.result} ${test.command} (${test.description})`
    ).join('\n');
    
    console.log('🧪 テスト結果:\n' + resultMessage);
    
    // ユーザーフィードバック
    window.showMessage('info', `音声コマンドテスト完了: ${testResults.length}件中${testResults.filter(t => t.result.includes('✅')).length}件成功`);
    
    // 詳細をコンソールに出力
    console.table(testResults);
}

// 📖 音声コマンドヘルプ表示
function showVoiceCommandHelp() {
    const helpContent = `
📖 **音声コマンド使い方ガイド**

🎯 **基本的な使い方**
1. マイクボタンが青色の時に音声で話しかけてください
2. コマンドは日本語で自然に話してください
3. 「どうぞ」でAIの応答を開始できます

✏️ **文字訂正機能 (NEW!)**
• 全削除: 「削除」「クリア」
• 部分削除: 「3文字削除」「最後の5文字削除」
• 置換: 「AをBにして」
• 文脈置換: 「AはBのCにして」

📝 **実用例**
• 「車内を社内にして」→ 車内が社内に変更
• 「車内は会社の社内にして」→ 文脈を理解して変更
• 「最後の3文字削除」→ 末尾3文字を削除

🎤 **音声認識のコツ**
• ゆっくりはっきりと話す
• 雑音の少ない環境で使用
• マイクに近づきすぎない

🧪 **デバッグ機能**
• ブラウザのコンソール(F12)で詳細確認可能
• window.testCorrectionCommand('テストテキスト')でテスト可能
`;
    
    console.log(helpContent);
    alert(helpContent.replace(/\*\*/g, '').replace(/•/g, '・'));
    
    window.showMessage('info', '音声コマンドヘルプをコンソールに表示しました（F12で確認）');
}

// グローバル関数として公開
window.toggleSmartVoicePanel = () => SmartVoicePanelManager.toggle();
window.testVoiceCommands = testVoiceCommands;
window.showVoiceCommandHelp = showVoiceCommandHelp;
window.SmartVoicePanelManager = SmartVoicePanelManager;

// 🔧 Phase B: 音声認識訂正システム
const SpeechCorrectionSystem = {
    // 削除コマンドパターン（通常会話での誤動作防止のため厳密化）
    deletionPatterns: [
        /^削除$/,           // 「削除」単体
        /^クリア$/,         // 「クリア」単体  
        /^全削除$/,         // 「全削除」
        /^全部削除$/,       // 「全部削除」
        /^全て削除$/,       // 「全て削除」
        /^リセット$/,       // 「リセット」単体
        /^文字消して$/,     // 「文字消して」単体
        /^もじけして$/,     // 「もじけして」単体
        /^クリアして$/,     // 「クリアして」単体
        /文字起こしを?削除/, // 「文字起こしを削除」
        /文字起こしを?クリア/, // 「文字起こしをクリア」
        /^間違い$/,         // 「間違い」単体
        /^やり直し$/        // 「やり直し」単体
    ],
    
    // 部分削除パターン（正規表現）
    partialDeletionPatterns: [
        /最後の(\d+)文字?削除/,
        /最後の(\d+)文字?消して/,
        /(\d+)文字?削除/,
        /(\d+)文字?消して/,
        /「(.+?)」削除/,
        /「(.+?)」消して/,
        /「(.+?)」を削除/,
        /「(.+?)」を消して/
    ],
    
    // 置換パターン
    replacementPatterns: [
        /^(.+?)は(.+?)の(.+?)にして$/,
        /^(.+?)を(.+?)にして$/,
        /^(.+?)は(.+?)にして$/,
        /^(.+?)を(.+?)に変えて$/,
        /^(.+?)を(.+?)に置き換えて$/
    ],
    
    // 現在の入力履歴
    currentInput: '',
    
    // 訂正コマンド検出
    detectCorrectionCommand(text) {
        const cleanText = text.trim();
        
        // 1. 削除コマンドチェック
        const deletionResult = this.checkDeletionCommand(cleanText);
        if (deletionResult) {
            return { type: 'deletion', ...deletionResult };
        }
        
        // 2. 置換コマンドチェック
        const replacementResult = this.checkReplacementCommand(cleanText);
        if (replacementResult) {
            return { type: 'replacement', ...replacementResult };
        }
        
        // 3. 通常の入力として処理
        return { type: 'normal', text: cleanText };
    },
    
    // 削除コマンド検出（優先順位: 数値削除 > 全削除 > 文字列削除）
    checkDeletionCommand(text) {
        const cleanText = text.toLowerCase().trim();
        
        // 🎯 優先度1: 数値指定削除（最優先）
        for (const pattern of this.partialDeletionPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[1] && !isNaN(match[1])) {
                    // 数字指定削除
                    const count = parseInt(match[1]);
                    return { 
                        action: 'delete_characters', 
                        count: count,
                        requiresConfirmation: count > 30  // 30文字以上は確認
                    };
                } else if (match[1]) {
                    // 指定文字列削除
                    return { 
                        action: 'delete_string', 
                        target: match[1],
                        requiresConfirmation: false
                    };
                }
            }
        }
        
        // 🎯 優先度2: 全削除（確認付き）
        for (const pattern of this.deletionPatterns) {
            if (pattern.test(cleanText)) {
                return { 
                    action: 'clear_all',
                    requiresConfirmation: true  // 全削除は必ず確認
                };
            }
        }
        
        return null;
    },
    
    // 置換コマンド検出
    checkReplacementCommand(text) {
        for (const pattern of this.replacementPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match.length === 4) {
                    // 「AはBのCにして」パターン
                    return {
                        action: 'replace_text',
                        target: match[1],
                        replacement: match[3],
                        context: match[2]
                    };
                } else if (match.length === 3) {
                    // 「AをBにして」パターン  
                    return {
                        action: 'replace_text',
                        target: match[1],
                        replacement: match[2]
                    };
                }
            }
        }
        
        return null;
    },
    
    // 訂正処理の実行（確認機能付き）
    async executeCorrectionCommand(command) {
        console.log('🔧 音声訂正コマンド実行:', command);
        
        // 確認が必要な場合の処理
        if (command.requiresConfirmation) {
            let confirmMessage = '';
            if (command.action === 'clear_all') {
                confirmMessage = '全ての文字起こしを削除します。よろしいですか？';
            } else if (command.action === 'delete_characters') {
                confirmMessage = `${command.count}文字を削除します。大きな数値ですが、よろしいですか？`;
            }
            
            const confirmed = confirm(confirmMessage);
            if (!confirmed) {
                return { 
                    success: true, 
                    message: '削除をキャンセルしました',
                    feedback: '削除をキャンセルしました' 
                };
            }
        }
        
        switch (command.action) {
            case 'clear_all':
                return this.clearAllText();
                
            case 'delete_characters':
                return this.deleteLastCharacters(command.count);
                
            case 'delete_string':
                return this.deleteSpecificString(command.target);
                
            case 'replace_text':
                return this.replaceText(command.target, command.replacement, command.context);
                
            default:
                return { success: false, message: '不明な訂正コマンドです' };
        }
    },
    
    // 全文削除
    clearAllText() {
        this.currentInput = '';
        this.updateInputDisplay();
        return { 
            success: true, 
            message: '全ての文字を削除しました',
            feedback: '全て削除しました'
        };
    },
    
    // 最後のN文字削除（置き換え処理版）
    deleteLastCharacters(count) {
        if (count <= 0) return { success: false, message: "削除する文字数が不正です" };
        
        const originalLength = this.currentInput.length;
        const deleteCount = Math.min(count, originalLength);
        
        this.currentInput = this.currentInput.slice(0, -deleteCount);
        this.updateInputDisplay();
        
        return { 
            success: true, 
            message: `最後の${deleteCount}文字を削除しました`,
            feedback: `${deleteCount}文字削除しました`
        };
    },
    // 指定文字列削除
    deleteSpecificString(target) {
        if (!this.currentInput.includes(target)) {
            return { 
                success: false, 
                message: `「${target}」が見つかりません`,
                feedback: `「${target}」が見つかりません`
            };
        }
        
        this.currentInput = this.currentInput.replace(target, '');
        this.updateInputDisplay();
        
        return { 
            success: true, 
            message: `「${target}」を削除しました`,
            feedback: `「${target}」を削除しました`
        };
    },
    
    // 文字列置換
    replaceText(target, replacement, context = null) {
        if (!this.currentInput.includes(target)) {
            return { 
                success: false, 
                message: `「${target}」が見つかりません`,
                feedback: `「${target}」が見つかりません`
            };
        }
        
        this.currentInput = this.currentInput.replace(target, replacement);
        this.updateInputDisplay();
        
        const contextMsg = context ? `（${context}の意味で）` : '';
        return { 
            success: true, 
            message: `「${target}」を「${replacement}」に置き換えました${contextMsg}`,
            feedback: `「${target}」を「${replacement}」に変更しました`
        };
    },
    
    // 入力表示更新
    updateInputDisplay() {
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.value = this.currentInput;
        }
        
        // 音声認識結果表示も更新
        const transcriptDisplay = document.getElementById('transcriptDisplay');
        if (transcriptDisplay) {
            transcriptDisplay.textContent = this.currentInput;
        }
    },
    
    // 入力内容設定
    setCurrentInput(text) {
        this.currentInput = text;
        this.updateInputDisplay();
    },
    
    // 入力内容取得
    getCurrentInput() {
        return this.currentInput;
    }
};

// 🔧 Phase B: 音声認識訂正機能を公開
window.SpeechCorrectionSystem = SpeechCorrectionSystem;
window.testCorrectionCommand = (text) => SpeechCorrectionSystem.detectCorrectionCommand(text);
window.executeCorrectionCommand = (command) => SpeechCorrectionSystem.executeCorrectionCommand(command);
window.provideCorrectionFeedback = provideCorrectionFeedback;

// 🎯 シンプル修正：音声コマンド除去関数
window.removeVoiceCommand = function(text, expectedCount) {
    // ✅ 改良：「してください」対応の音声コマンド除去パターン
    const voiceCommandPatterns = [
        new RegExp(`(.+?)\\s+(${expectedCount})文字削除(?:して(?:ください)?)?$`),        // "テキスト 3文字削除", "テキスト 3文字削除してください"
        new RegExp(`(.+?)\\s+(${expectedCount})文字消して(?:ください)?$`),               // "テキスト 3文字消して", "テキスト 3文字消してください"  
        new RegExp(`(.+?)\\s+(${expectedCount})文字\\s*削除(?:して(?:ください)?)?$`),     // "テキスト 3文字 削除してください"
        new RegExp(`(.+?)\\s+(${expectedCount})文字\\s*消して(?:ください)?$`),           // "テキスト 3文字 消してください"
        new RegExp(`(.+?)\\s+最後の(${expectedCount})文字\\s*削除(?:して(?:ください)?)?$`), // "テキスト 最後の3文字削除してください"
        new RegExp(`(.+?)\\s+最後の(${expectedCount})文字\\s*消して(?:ください)?$`),     // "テキスト 最後の3文字消してください"
        new RegExp(`(.+?)\\s+(${expectedCount})\\s*文字\\s*削除(?:して(?:ください)?)?$`), // "テキスト 3 文字 削除してください"
        new RegExp(`(.+?)\\s+(${expectedCount})\\s*文字\\s*消して(?:ください)?$`)        // "テキスト 3 文字 消してください"
    ];
    
    for (const pattern of voiceCommandPatterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1].trim(); // 音声コマンド前の部分のみ返す
        }
    }
    
    return text; // パターンが見つからない場合は元のまま
}

// ヘルプガイド切り替え関数
// 🔧 UI最適化Phase1: ヘルプガイド管理機能をapp/ui-advanced.jsに移動
// toggleVoiceGuide

// 🎯 新機能: 音声ベース知見評価関数を公開
window.updateThresholdFromInput = updateThresholdFromInput;

// セッション進行状況を更新する関数

// 音声設定スライダーのイベントリスナーを設定
function initializeVoiceSliders() {
    // ねほりーの設定
    const nehoriSpeed = window.UIManager.DOMUtils.get('nehoriSpeed');
    const nehoriVolume = window.UIManager.DOMUtils.get('nehoriVolume');
    const nehoriSpeedValue = window.UIManager.DOMUtils.get('nehoriSpeedValue');
    const nehoriVolumeValue = window.UIManager.DOMUtils.get('nehoriVolumeValue');
    
    if (nehoriSpeed && nehoriSpeedValue) {
        nehoriSpeed.addEventListener('input', function() {
            nehoriSpeedValue.textContent = this.value;
            console.log(`ねほりーの速度: ${this.value}`);
        });
    }
    
    if (nehoriVolume && nehoriVolumeValue) {
        nehoriVolume.addEventListener('input', function() {
            nehoriVolumeValue.textContent = this.value;
            console.log(`ねほりーの音量: ${this.value}`);
        });
    }
    
    // はほりーの設定
    const hahoriSpeed = window.UIManager.DOMUtils.get('hahoriSpeed');
    const hahoriVolume = window.UIManager.DOMUtils.get('hahoriVolume');
    const hahoriSpeedValue = window.UIManager.DOMUtils.get('hahoriSpeedValue');
    const hahoriVolumeValue = window.UIManager.DOMUtils.get('hahoriVolumeValue');
    
    if (hahoriSpeed && hahoriSpeedValue) {
        hahoriSpeed.addEventListener('input', function() {
            hahoriSpeedValue.textContent = this.value;
            console.log(`はほりーの速度: ${this.value}`);
        });
    }
    
    if (hahoriVolume && hahoriVolumeValue) {
        hahoriVolume.addEventListener('input', function() {
            hahoriVolumeValue.textContent = this.value;
            console.log(`はほりーの音量: ${this.value}`);
        });
    }
    
    console.log('✅ 音声設定スライダーのイベントリスナーを初期化しました');
}

// 現在の音声設定を取得する関数
function getVoiceSettings(speaker) {
    if (speaker === SPEAKERS.NEHORI) {
        const speedElement = window.UIManager.DOMUtils.get('nehoriSpeed');
        const volumeElement = window.UIManager.DOMUtils.get('nehoriVolume');
        const voiceElement = window.UIManager.DOMUtils.get('nehoriVoice');
        
        return {
            voice: voiceElement?.value || VoiceSettings[SPEAKERS.NEHORI].voice || 'sage',
            speed: parseFloat(speedElement?.value || VoiceSettings[SPEAKERS.NEHORI].speed || '1.3'),
            volume: Math.min(parseFloat(volumeElement?.value || VoiceSettings[SPEAKERS.NEHORI].volume || '0.9'), 1.0) // 上限1.0
        };
    } else if (speaker === SPEAKERS.HAHORI) {
        const speedElement = window.UIManager.DOMUtils.get('hahoriSpeed');
        const volumeElement = window.UIManager.DOMUtils.get('hahoriVolume');
        const voiceElement = window.UIManager.DOMUtils.get('hahoriVoice');
        
        return {
            voice: voiceElement?.value || VoiceSettings[SPEAKERS.HAHORI].voice || 'shimmer',
            speed: parseFloat(speedElement?.value || VoiceSettings[SPEAKERS.HAHORI].speed || '1.3'),
            volume: Math.min(parseFloat(volumeElement?.value || VoiceSettings[SPEAKERS.HAHORI].volume || '0.7'), 1.0) // 上限1.0
        };
    }
    
    // デフォルト設定
    return {
        voice: 'sage',
        speed: 1.0,
        volume: 0.8
    };
}

// =================================================================================
// INITIALIZATION - 初期化処理
// =================================================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 深堀くんアプリが起動しました');
    
    try {
        // 🔄 新機能: 知見データ管理システムの初期化（最初に実行）
        console.log('📚 知見管理システム初期化開始...');
        await initializeKnowledgeManagement();
        console.log('✅ 知見管理システム初期化完了');
        
        // 🎤 新システム: StateManager初期化
        console.log('🎤 音声システム初期化開始...');
        if (!initializeVoiceSystem()) {
            console.error('❌ 音声システム初期化失敗');
            window.showMessage('error', '音声システムの初期化に失敗しました。ページを再読み込みしてください。');
            return;
        }
        console.log('✅ 音声システム初期化完了');
        
        // 🎯 Step 1: 段階的移行システムの初期化
        console.log('🔄 段階的移行システム初期化開始...');
        initializeMigrationSystem();
        console.log('✅ 段階的移行システム初期化完了');
        
        // 📝 リアルタイム文字起こし編集システムの初期化
        console.log('✏️ transcript編集システム初期化開始...');
        await initializeTranscriptEditSystem();
        console.log('✅ transcript編集システム初期化完了');
        
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        window.showMessage('error', 'アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
        return;
    }
    
    // 初期化処理
    initializeVoiceSliders();
    loadSavedTheme();
    updateSessionStatus('準備中...', '未設定');
    window.updateKnowledgeDisplay();
    
    // 🔧 Step 3.1: 右ペインセッション状況表示の初期化
    if (typeof window.initializeRightPaneSessionDisplay === 'function') {
        try {
            const rightPaneInitialized = window.initializeRightPaneSessionDisplay();
            if (rightPaneInitialized) {
                console.log('✅ 右ペインセッション状況表示初期化完了');
                // 自動更新を開始
                if (typeof window.startRightPaneSessionDisplayUpdates === 'function') {
                    window.startRightPaneSessionDisplayUpdates();
                    console.log('✅ 右ペインセッション状況表示自動更新開始');
                }
            } else {
                console.warn('⚠️ 右ペインセッション状況表示初期化失敗');
            }
        } catch (error) {
            console.error('❌ 右ペインセッション状況表示初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ 右ペインセッション状況表示関数が見つかりません');
    }
    
    // 🎯 新機能: 音声ベース知見評価設定初期化
    loadKnowledgeSettings();
    updateKnowledgeSettingsDisplay();
    
    // 🔄 新機能: 状態復元処理
    await restoreApplicationState();
    
    // パスワード入力のEnterキー対応
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginWithPassword();
            }
        });
    }
    
    // 🔄 新機能: テーマ入力監視
    const themeInput = document.getElementById('themeInput');
    if (themeInput) {
        // テーマ入力の変更監視
        themeInput.addEventListener('input', function() {
            const themeText = themeInput.value.trim();
            saveThemeInputState(themeText);
            update2StepUI();
        });
        
        // Enterキーでセッション開始
        themeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const status = evaluate2StepStatus();
                if (status.allComplete) {
                    startSession();
                } else {
                    if (!status.loginComplete) {
                        focusPasswordInput();
                    }
                }
            }
        });
    }
    
    // Escキーでモーダルを閉じる（ui-advanced.jsから参照）
    if (window.UIAdvanced && window.UIAdvanced.Modal && window.UIAdvanced.Modal.handleEscapeKey) {
        document.addEventListener('keydown', window.UIAdvanced.Modal.handleEscapeKey);
    } else {
        // フォールバック: 基本的なEscapeキーハンドラー
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                if (window.closeAdvancedSettings) {
                    window.closeAdvancedSettings();
                }
            }
        });
    }
    
    // 🎯 SessionController初期化
    if (typeof SessionController !== 'undefined') {
        try {
            SessionController.init();
            console.log('✅ SessionController初期化完了');
        } catch (error) {
            console.error('❌ SessionController初期化エラー:', error);
        }
    }
    
    // 📊 Phase 2-2: DataManager初期化
    if (typeof window.initializeDataManager === 'function') {
        try {
            await window.initializeDataManager();
            console.log('✅ DataManager初期化完了');
        } catch (error) {
            console.error('❌ DataManager初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ DataManager が利用できません');
    }
    
    // 📄 Phase 2-3: FileManager初期化
    if (typeof window.initializeFileManager === 'function') {
        try {
            await window.initializeFileManager();
            console.log('✅ FileManager初期化完了');
        } catch (error) {
            console.error('❌ FileManager初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ FileManager が利用できません');
    }
    
    // 🤖 Phase 2-4: AIManager初期化
    if (typeof window.initializeAIManager === 'function') {
        try {
            await window.initializeAIManager();
            console.log('✅ AIManager初期化完了');
        } catch (error) {
            console.error('❌ AIManager初期化エラー:', error);
        }
    } else {
        console.warn('⚠️ AIManager が利用できません');
    }
    
    // 🎤 Phase B: スマート音声操作パネルの初期化
    if (typeof SmartVoicePanelManager !== 'undefined') {
        SmartVoicePanelManager.init();
    }
    
    // 🔧 VoiceUIManager削除完了 - 統一状態管理システムに完全移行
    
    console.log('✅ 初期化完了（状態管理・知見管理・SessionController・スマート音声パネル・新UI機能付き）');
});

// =================================================================================
// KNOWLEDGE MANAGEMENT SYSTEM - 知見データ管理システム
// =================================================================================

// 📂 CSV管理システム - knowledge-management.jsに移動
// 🏷️ カテゴリー管理システム - knowledge-management.jsに移動
// 👤 ユーザー名管理システム - knowledge-management.jsに移動

// 📄 知見ファイル管理システム
const KnowledgeFileManager = {
    // 依存関係インターフェース
    interface: null,
    
    // インターフェース初期化
    _ensureInterface() {
        if (!this.interface) {
            this.interface = window.KnowledgeFileManagerInterface;
            if (!this.interface) {
                throw new Error('KnowledgeFileManagerInterface が見つかりません');
            }
        }
        return this.interface;
    },

    // セッション管理機能はSessionControllerに移動されました
    // 後方互換性のための転送メソッド
    async createSessionFile(sessionMeta) {
        console.warn('⚠️ KnowledgeFileManager.createSessionFile は非推奨です。SessionController.createSessionFile を使用してください');
        if (!window.SessionController) {
            throw new Error('SessionController が見つかりません');
        }
        return await window.SessionController.createSessionFile(sessionMeta);
    },

    // 後方互換性のための転送メソッド
    formatTimestamp(date) {
        console.warn('⚠️ KnowledgeFileManager.formatTimestamp は非推奨です。SessionController.formatTimestamp を使用してください');
        if (!window.SessionController) {
            // フォールバック実装
            const yy = String(date.getFullYear()).slice(2);
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            return `${yy}${mm}${dd}-${hh}${min}${ss}`;
        }
        return window.SessionController.formatTimestamp(date);
    },

    // 後方互換性のための転送メソッド
    generateTitleSummary(theme) {
        console.warn('⚠️ KnowledgeFileManager.generateTitleSummary は非推奨です。SessionController.generateTitleSummary を使用してください');
        if (!window.SessionController) {
            // フォールバック実装
            if (!theme) return 'セッション記録';
            let summary = theme.replace(/[「」]/g, '').trim();
            if (summary.length > 20) {
                summary = summary.substring(0, 17) + '...';
            }
            return summary;
        }
        return window.SessionController.generateTitleSummary(theme);
    },

    // 知見の追加（DataManagerに移譲）
    addInsight(insight, context, quality) {
        console.warn('⚠️ KnowledgeFileManager.addInsight は非推奨です。DataManager.addInsight を使用してください');
        
        // DataManagerが利用可能かチェック
        if (window.DataManager && window.DataManager.isInitialized()) {
            try {
                return window.DataManager.addInsight(insight, context, quality);
            } catch (error) {
                console.error('❌ DataManager.addInsight実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（DataManager未使用時）
        const iface = this._ensureInterface();
        
        const currentSession = iface.state.getCurrentSession();
        if (!currentSession) {
            console.warn('⚠️ アクティブなセッションがありません');
            return false;
        }

        const insightEntry = {
            id: `insight_${Date.now()}`,
            content: insight,
            context: context,
            quality_scores: quality,
            timestamp: new Date().toISOString(),
            conversation_context: context.related_conversation || []
        };

        // インターフェース経由で知見を追加
        const success = iface.state.addInsightToSession(insightEntry);
        if (!success) {
            console.error('❌ 知見の追加に失敗しました');
            return false;
        }
        
        console.log('✅ 知見を追加:', insight.substring(0, 50) + '...');
        
        return true;
    },

    // ファイル生成（FileManagerに移譲）
    async generateKnowledgeFile(sessionData = null) {
        console.warn('⚠️ KnowledgeFileManager.generateKnowledgeFile は非推奨です。FileManager.generateKnowledgeFile を使用してください');
        
        // FileManagerが利用可能かチェック
        if (window.FileManager) {
            try {
                return await window.FileManager.generateKnowledgeFile(sessionData);
            } catch (error) {
                console.error('❌ FileManager.generateKnowledgeFile実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（FileManager未使用時）
        const iface = this._ensureInterface();
        
        const session = sessionData || iface.state.getCurrentSession();
        
        if (!session) {
            console.warn('⚠️ アクティブなセッションがありません');
            return null;
        }

        const content = this.buildFileContent(session);
        
        // ファイル名の生成（Knowledge DNA統合の場合は特別なプレフィックス）
        const timestamp = this.formatTimestamp(new Date());
        const dnaPrefix = session.knowledge_graph ? 'KnowledgeDNA_' : '知見_';
        const filename = `${dnaPrefix}${session.meta.title}_${timestamp}.md`;
        
        // インターフェース経由でファイルダウンロード
        const success = iface.file.downloadFile(content, filename);
        if (!success) {
            console.error('❌ ファイルダウンロードに失敗しました');
            return null;
        }
        
        console.log('✅ 知見ファイル生成完了:', filename);
        return filename;
    },

    // ファイル内容の構築（FileManagerに移譲）
    buildFileContent(session) {
        console.warn('⚠️ KnowledgeFileManager.buildFileContent は非推奨です。FileManager.buildFileContent を使用してください');
        
        // FileManagerが利用可能かチェック
        if (window.FileManager) {
            try {
                return window.FileManager.buildFileContent(session);
            } catch (error) {
                console.error('❌ FileManager.buildFileContent実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（FileManager未使用時）
        const meta = session.meta;
        const insights = session.insights;
        
        let content = '---\n';
        content += '# メタデータ\n';
        content += `meta:\n`;
        content += `  session_id: "${meta.session_id}"\n`;
        content += `  date: "${meta.date}"\n`;
        content += `  category: "${meta.category}"\n`;
        content += `  title: "${meta.title}"\n`;
        content += `  participant: "${meta.participant}"\n`;
        content += `  participant_role: "${meta.participant_role}"\n`;
        content += `  theme: "${meta.theme}"\n`;
        content += `  knowledge_dna_version: "1.0"\n`;
        content += '\n';
        
        content += '# セッション概要\n';
        content += `summary:\n`;
        content += `  overview: "${meta.theme}について深掘りセッションを実施"\n`;
        content += `  insights_count: ${insights.length}\n`;
        content += `  enhanced_by_ai: true\n`;
        content += '\n';
        
        content += '# 抽出された知見（生データ）\n';
        content += `raw_insights:\n`;
        
        insights.forEach((insight, index) => {
            content += `  - id: "${insight.id}"\n`;
            content += `    content: "${insight.content}"\n`;
            content += `    timestamp: "${insight.timestamp}"\n`;
            if (insight.quality_scores) {
                content += `    quality_scores:\n`;
                content += `      confidence: ${insight.quality_scores.confidence || 0.5}\n`;
                content += `      importance: ${insight.quality_scores.importance || 0.5}\n`;
            }
            content += '\n';
        });
        
        content += '---\n\n';
        content += `# ${meta.title}\n\n`;
        content += `**参加者**: ${meta.participant}\n`;
        content += `**日時**: ${new Date(meta.date).toLocaleString('ja-JP')}\n`;
        content += `**カテゴリー**: ${meta.category}\n`;
        content += `**テーマ**: ${meta.theme}\n\n`;
        
        // AI整理された知見セクション
        content += '## 🧬 Knowledge DNA - AI整理された知見\n\n';
        content += '> 以下の知見は、深堀くんのKnowledge DNAシステムによって整理・リライトされた内容です。\n\n';

        // 構造化された知見を表示
        insights.forEach((insight, index) => {
            content += `### 📘 知見 ${index + 1}\n\n`;
            
            // AI整理された内容を表示（利用可能な場合）
            if (insight.enhanced_content && insight.dna_enhanced) {
                content += `**📝 AI整理された内容**\n`;
                
                // enhanced_content が JSON文字列の場合は解析を試行
                let enhancedText = insight.enhanced_content;
                if (typeof enhancedText === 'string' && enhancedText.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(enhancedText);
                        if (parsed.enhanced) {
                            enhancedText = parsed.enhanced;
                        }
                    } catch (e) {
                        // JSON解析失敗時はそのまま使用
                        console.warn('Enhanced content JSON解析失敗:', e);
                    }
                }
                
                content += `${enhancedText}\n\n`;
                
                if (insight.summary && insight.summary !== 'AI整理済み') {
                    content += `**📋 要約**\n`;
                    content += `${insight.summary}\n\n`;
                }
                
                if (insight.background && insight.background.trim()) {
                    content += `**🔍 背景・前提**\n`;
                    content += `${insight.background}\n\n`;
                }
                
                if (insight.actionable_points && insight.actionable_points.length > 0) {
                    content += `**💡 実行可能なポイント**\n`;
                    insight.actionable_points.forEach(point => {
                        content += `- ${point}\n`;
                    });
                    content += `\n`;
                }
                
                if (insight.keywords && insight.keywords.length > 0) {
                    content += `**🏷️ キーワード**\n`;
                    content += `${insight.keywords.join(', ')}\n\n`;
                }
                
                if (insight.related_concepts && insight.related_concepts.length > 0) {
                    content += `**🔗 関連概念**\n`;
                    content += `${insight.related_concepts.join(', ')}\n\n`;
                }
                
            } else {
                // 従来の表示形式
                content += `**📝 内容**\n`;
                content += `${insight.content}\n\n`;
                
            if (insight.context) {
                    content += `**🔍 背景・状況**\n`;
                    content += `${insight.context.situation || '詳細な背景情報が記録されています'}\n\n`;
                }
            }
            
            // Knowledge DNA情報
            content += `**🧬 Knowledge DNA**\n`;
            content += `- 🏷️ カテゴリー: ${meta.category}\n`;
            if (insight.categories && insight.categories.length > 0) {
                content += `- 🎯 AI分析カテゴリー: ${insight.categories.join(', ')}\n`;
            }
            content += `- ⭐ 重要度: ${insight.quality_scores?.importance ? Math.round(insight.quality_scores.importance * 100) : 50}%\n`;
            content += `- 🎯 信頼度: ${insight.quality_scores?.confidence ? Math.round(insight.quality_scores.confidence * 100) : 50}%\n`;
            content += `- 🔗 セッションID: ${meta.session_id}\n`;
            content += `- 📅 抽出日時: ${insight.timestamp}\n`;
            content += `- 🤖 AI整理: ${insight.dna_enhanced ? '✅ 完了' : '❌ 未実行'}\n`;
            
            content += `\n---\n\n`;
        });

        // ナレッジグラフ情報（AI分析結果）
        content += '## 🕸️ Knowledge Graph（ナレッジグラフ）\n\n';
        content += '> Knowledge DNAシステムによる知見間の関係性分析\n\n';
        
        // セッション統計
        content += `**📊 セッション統計**\n`;
        content += `- 総知見数: ${insights.length}\n`;
        content += `- 平均重要度: ${this.calculateAverageImportance(insights)}%\n`;
        content += `- AI整理済み: ${insights.filter(i => i.dna_enhanced).length}/${insights.length}\n`;
        content += `- テーマカテゴリー: ${meta.category}\n`;
        content += `- 参加者: ${meta.participant}\n\n`;
        
        // 知見クラスター分析
        if (session.knowledge_graph && session.knowledge_graph.clusters && session.knowledge_graph.clusters.length > 0) {
            content += `**🔗 知見クラスター分析**\n`;
            session.knowledge_graph.clusters.forEach((cluster, index) => {
                content += `${index + 1}. **${cluster.theme}**\n`;
                content += `   - 対象知見: ${cluster.insights.map(i => i + 1).join(', ')}\n`;
                content += `   - 説明: ${cluster.description}\n\n`;
            });
        } else {
            content += `**🔗 知見クラスター分析**\n`;
            if (insights.length < 2) {
                content += `- 単一の知見のため、クラスター分析は実行されませんでした\n\n`;
            } else {
                content += `- 関係性分析中、またはAIによる自動分析が完了していません\n`;
                content += `- 今後のバージョンで高度な知見クラスタリングが利用可能になります\n\n`;
            }
        }
        
        // 知見間関係性
        if (session.knowledge_graph && session.knowledge_graph.relationships && session.knowledge_graph.relationships.length > 0) {
            content += `**🔄 知見間関係性**\n`;
            session.knowledge_graph.relationships.forEach((rel, index) => {
                content += `${index + 1}. 知見${rel.from + 1} → 知見${rel.to + 1} (${rel.type})\n`;
                content += `   - ${rel.description}\n\n`;
            });
        } else {
            content += `**🔄 知見間関係性**\n`;
            if (insights.length < 2) {
                content += `- 単一の知見のため、関係性分析は実行されませんでした\n\n`;
            } else {
                content += `- 現在分析中、または関係性が検出されませんでした\n`;
                content += `- より多くの知見が蓄積されると、知見間の因果関係・補完関係が抽出されます\n\n`;
            }
        }
        
        // 共通テーマ
        if (session.knowledge_graph && session.knowledge_graph.themes && session.knowledge_graph.themes.length > 0) {
            content += `**🎯 共通テーマ分析**\n`;
            session.knowledge_graph.themes.forEach((theme, index) => {
                content += `${index + 1}. **${theme.name}** (出現頻度: ${theme.frequency})\n`;
                content += `   - ${theme.description}\n\n`;
            });
        } else {
            content += `**🎯 共通テーマ分析**\n`;
            // 知見のキーワードから共通テーマを手動生成
            const allKeywords = insights.flatMap(i => i.keywords || []);
            const keywordFreq = {};
            allKeywords.forEach(keyword => {
                keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
            });
            
            const commonKeywords = Object.entries(keywordFreq)
                .filter(([_, freq]) => freq > 1)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
            
            if (commonKeywords.length > 0) {
                content += `- 自動検出された共通テーマ:\n`;
                commonKeywords.forEach(([keyword, freq], index) => {
                    content += `  ${index + 1}. **${keyword}** (出現: ${freq}回)\n`;
                });
                content += `\n`;
            } else {
                content += `- メインテーマ: ${meta.theme}\n`;
                content += `- このセッションの知見は多様性に富んでおり、特定の共通テーマは検出されませんでした\n`;
                content += `- より多くの知見が蓄積されると、詳細なテーマ分析が可能になります\n\n`;
            }
        }
        
        // 知見継承DNA
        content += `**🧬 知見継承DNA**\n`;
        content += `- 知見系統: ${meta.theme} > ${meta.category}\n`;
        content += `- 継承可能性: ${insights.filter(i => i.dna_enhanced).length > 0 ? '高（AI整理済み）' : '中（基本構造化済み）'}\n`;
        content += `- AI学習適用: ${insights.filter(i => i.dna_enhanced).length > 0 ? '✅ 適用済み' : '⏳ 準備中'}\n`;
        content += `- 組織知化レベル: ${insights.length >= 3 ? '高' : insights.length >= 2 ? '中' : '低'}\n`;
        const uniqueKeywords = [...new Set(insights.flatMap(i => i.keywords || []))];
        if (uniqueKeywords.length > 0) {
            content += `- 知見キーワード: ${uniqueKeywords.slice(0, 10).join(', ')}${uniqueKeywords.length > 10 ? '...' : ''}\n`;
        }
        content += `\n`;
        
        return content;
    },

    // 平均重要度計算（FileManagerに移譲）
    calculateAverageImportance(insights) {
        console.warn('⚠️ KnowledgeFileManager.calculateAverageImportance は非推奨です。FileManager.calculateAverageImportance を使用してください');
        
        // FileManagerが利用可能かチェック
        if (window.FileManager) {
            try {
                return window.FileManager.calculateAverageImportance(insights);
            } catch (error) {
                console.error('❌ FileManager.calculateAverageImportance実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（FileManager未使用時）
        if (insights.length === 0) return 0;
        
        const total = insights.reduce((sum, insight) => {
            return sum + (insight.quality_scores?.importance || 0.5);
        }, 0);
        
        return Math.round((total / insights.length) * 100);
    },

    // AI知見整理システム（AIManagerに移譲）
    async enhanceKnowledgeWithAI(session, showProgress = true) {
        console.warn('⚠️ KnowledgeFileManager.enhanceKnowledgeWithAI は非推奨です。AIManager.enhanceKnowledgeWithAI を使用してください');
        
        // AIManagerが利用可能かチェック
        if (window.AIManager && window.AIManager.isInitialized) {
            try {
                return await window.AIManager.enhanceKnowledgeWithAI(session, showProgress);
            } catch (error) {
                console.error('❌ AIManager.enhanceKnowledgeWithAI実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（AIManager未使用時）
        console.warn('⚠️ AIManagerが未初期化のため、基本実装を使用します');
        
        try {
            // APIキーの確認
            if (!window.AppState?.apiKey) {
                console.warn('⚠️ API key not available for knowledge enhancement');
                return session;
            }
            
            console.log('🤖 AI知見整理開始（フォールバック）...');
            
            if (showProgress && window.showMessage) {
                window.showMessage('info', '🧬 Knowledge DNAシステムによる知見整理中...');
            }
            
            // 基本的な知見整理のみ実行
            const enhancedSession = { ...session };
            enhancedSession.insights = session.insights.map(insight => ({
                ...insight,
                enhanced_content: insight.content,
                summary: insight.content.substring(0, 100) + (insight.content.length > 100 ? '...' : ''),
                dna_enhanced: false,
                categories: [],
                keywords: []
            }));
            
            console.log('✅ AI知見整理完了（フォールバック）');
            if (showProgress && window.showMessage) {
                window.showMessage('success', '基本的な知見整理が完了しました');
            }
            
            return enhancedSession;
            
        } catch (error) {
            console.error('❌ AI知見整理エラー（フォールバック）:', error);
            if (showProgress && window.showMessage) {
                window.showMessage('warning', 'AI整理でエラーが発生しましたが、基本の知見は保存されます');
            }
            return session;
        }
    }
};

// 🔧 KnowledgeFileManagerをグローバル公開
window.KnowledgeFileManager = KnowledgeFileManager;

// 🎯 知見管理システムの初期化
async function initializeKnowledgeManagement() {
    try {
        console.log('📚 知見データ管理システム初期化開始...');
        
        // CSV データの読み込み
        await CategoryManager.loadCategories();
        await UserManager.loadUsers();
        
        window.KnowledgeState.isInitialized = true;
        console.log('✅ 知見データ管理システム初期化完了');
        
    } catch (error) {
        console.error('❌ 知見管理システム初期化エラー:', error);
        window.KnowledgeState.isInitialized = false;
    }
}

// 🔧 知見セッション初期化処理は app/session-start-manager.js に移動しました
// 後方互換性は window.initializeKnowledgeSession で保証

// 👤 ユーザー識別プロンプト
async function promptUserIdentification() {
    try {
        // 簡易的な入力（後でより良いUIに改良）
        const nickname = prompt('あなたのお名前を教えてください（ニックネームでも結構です）:') || 'ゲスト';
        
        const user = await UserManager.confirmUser(nickname);
        if (user) {
            return user;
        }
        
        // フォールバック
        return {
            nickname: nickname,
            formal_name: nickname,
            role: '参加者',
            department: '未設定'
        };
        
    } catch (error) {
        console.error('❌ ユーザー識別エラー:', error);
        return {
            nickname: 'ゲスト',
            formal_name: 'ゲストユーザー',
            role: '参加者',
            department: '未設定'
        };
    }
}

// 🏷️ カテゴリー選択プロンプト  
async function promptCategorySelection() {
    try {
        const categories = window.KnowledgeState.categories;
        if (categories.length === 0) {
            return 'その他';
        }
        
        // 簡易的な選択（後でより良いUIに改良）
        const categoryNames = categories.map(cat => cat.category_name);
        const options = categoryNames.map((name, i) => `${i + 1}. ${name}`).join('\n');
        
        const selection = prompt(`知見のカテゴリーを選択してください:\n${options}\n\n番号を入力してください (1-${categoryNames.length}):`);
        const index = parseInt(selection) - 1;
        
        if (index >= 0 && index < categoryNames.length) {
            return categoryNames[index];
        }
        
        // デフォルト選択
        return categoryNames[0];
        
    } catch (error) {
        console.error('❌ カテゴリー選択エラー:', error);
        return 'その他';
    }
}

// =================================================================================
// KNOWLEDGE DNA SYSTEM - 知見DNAシステム - knowledge-management.jsに移動
// =================================================================================

// =================================================================================
// QUALITY ASSESSMENT SYSTEM - 品質評価システム - knowledge-management.jsに移動
// =================================================================================

// =================================================================================
// VOICE-BASED KNOWLEDGE EVALUATION SYSTEM - 音声ベース知見評価システム
// =================================================================================

const VoiceKnowledgeSystem = {
    // 🎯 メイン処理: 音声ベース知見評価
    async processKnowledgeWithVoiceEvaluation(insightText, conversationContext) {
        try {
            console.log('🎯 音声ベース知見評価開始...');
            
            // 1. 前提条件の確認
            const prerequisites = await this._checkEvaluationPrerequisites();
            if (!prerequisites.canProceed) {
                console.warn('⚠️ 知見評価の前提条件が満たされていません:', prerequisites.reason);
                return { accepted: false, reason: 'prerequisites_not_met', details: prerequisites.reason };
            }
            
            // 2. はほりーのによる品質評価（AIManager統一）
            let qualityEvaluation = null;
            
            // AIManagerによる統一評価処理
            if (window.AIManager) {
                try {
                    console.log('🎯 AIManager統一評価処理開始...');
                    
                    // 初期化完了を待機（タイムアウト付き）
                    await window.AIManager.waitForInitialization(10000);
                    
                    // 品質評価実行
                    qualityEvaluation = await window.AIManager.evaluateInsightQuality(insightText, conversationContext);
                    
                    console.log('✅ AIManager統一評価完了');
                } catch (error) {
                    console.error('❌ AIManager評価エラー:', error);
                    
                    // エラーの詳細をログに記録
                    if (error.message?.includes('初期化')) {
                        console.warn('⚠️ AIManager初期化エラー - 手動評価に移行');
                    } else if (error.message?.includes('API')) {
                        console.warn('⚠️ API通信エラー - 手動評価に移行');
                    } else {
                        console.warn('⚠️ 予期しないエラー - 手動評価に移行');
                    }
                }
            } else {
                console.warn('⚠️ AIManagerが未定義 - 手動評価に移行');
            }
            
            // AI評価失敗時は手動評価
            if (!qualityEvaluation) {
                console.log('🔄 手動評価フォールバック実行');
                return await this._handleManualEvaluationFallback(insightText, conversationContext);
            }
            
            // 統計更新
            AppState.sessionStats.totalKnowledge++;
            this.updateAverageScore(qualityEvaluation.overall);
            
            const totalScore = Math.round(qualityEvaluation.overall * 100);
            const threshold = AppState.knowledgeSettings.autoRecordThreshold;
            
            // 3. 閾値による自動判定
            if (totalScore >= threshold) {
                return await this.handleAutoRecord(qualityEvaluation, insightText, totalScore);
            } else {
                return await this.handleManualConfirmation(qualityEvaluation, insightText, totalScore);
            }
            
        } catch (error) {
            console.error('❌ 音声ベース知見評価エラー:', error);
            return { accepted: false, reason: 'process_error', details: error.message };
        }
    },
    
    // 🤖 自動記録処理
    async handleAutoRecord(evaluation, insightText, totalScore) {
        console.log('✅ 高評価知見: 自動記録');
        
        // 統計更新
        AppState.sessionStats.autoRecorded++;
        
        // 音声通知
        if (AppState.knowledgeSettings.showAutoRecordNotice) {
            const message = VoiceTemplates.AUTO_RECORD(evaluation.summary, totalScore);
            await this.speakAsHahori(message);
        }
        
        // 右ペインに詳細表示
        this.updateDetailedEvaluation(evaluation, totalScore, 'auto');
        
        return {
            accepted: true,
            reason: 'auto_accept',
            evaluation: evaluation,
            summary: evaluation.summary
        };
    },
    
    // 🎤 手動確認処理
    async handleManualConfirmation(evaluation, insightText, totalScore) {
        console.log('🤔 中程度品質: 音声確認実施');
        
        // 詳細表示版で確認要求
        await this.speakKnowledgeEvaluation(evaluation, totalScore);
        
        // 右ペインに詳細表示
        this.updateDetailedEvaluation(evaluation, totalScore, 'pending');
        
        // 🔧 改善版: ゲートキーパーシステムで知見確認モード開始
        ConversationGatekeeper.enterKnowledgeConfirmationMode('manualConfirmation');
        
        // 保留中の知見評価を設定
        AppState.voiceRecognitionState.pendingKnowledgeEvaluation = {
            ...evaluation,
            insightText: insightText,
            totalScore: totalScore
        };
        
        // 音声認識の再開を確実に行う
        restartSpeechRecognition();
        
        // この時点では結果を返さず、音声応答を待つ
        return null;
    },
    
    // 🎵 はほりーのの音声発話（知見評価時は詳細表示版）
    async speakAsHahori(message) {
        try {
            await addMessageToChat(SPEAKERS.HAHORI, message);
            const audioBlob = await ttsTextToAudioBlob(message, SPEAKERS.HAHORI);
            await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
        } catch (error) {
            console.error('❌ はほりーの音声発話エラー:', error);
        }
    },
    
    // 🎵 はほりーの知見評価発話（詳細表示版）
    async speakKnowledgeEvaluation(evaluation, totalScore) {
        try {
            // 音声用のシンプルなメッセージ
            const voiceMessage = VoiceTemplates.CONFIRMATION_REQUEST(evaluation.summary, totalScore);
            
            // 会話欄用の詳細表示メッセージ
            const detailedMessage = this.createDetailedEvaluationMessage(evaluation, totalScore);
            
            // 詳細版を会話欄に表示
            await addMessageToChat(SPEAKERS.HAHORI, detailedMessage);
            
            // シンプル版を音声で発話
            const audioBlob = await ttsTextToAudioBlob(voiceMessage, SPEAKERS.HAHORI);
            await playPreGeneratedAudio(audioBlob, SPEAKERS.HAHORI);
        } catch (error) {
            console.error('❌ はほりーの知見評価発話エラー:', error);
        }
    },
    
    // 📊 詳細評価メッセージ作成
    createDetailedEvaluationMessage(evaluation, totalScore) {
        const getStars = (score) => {
            const starCount = Math.round(score * 5);
            return '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
        };
        
        const confidenceScore = Math.round(evaluation.confidence * 100);
        const importanceScore = Math.round(evaluation.importance * 100);
        const actionabilityScore = Math.round(evaluation.actionability * 100);
        
        return `「${evaluation.summary}」という知見を抽出しました。評価は${totalScore}点です。

📊 詳細評価:
• 信頼性: ${confidenceScore}点 ${getStars(evaluation.confidence)}
• 重要性: ${importanceScore}点 ${getStars(evaluation.importance)}  
• 実行性: ${actionabilityScore}点 ${getStars(evaluation.actionability)}

この知見を記録しますか？「はい」または「いいえ」でお答えください。`;
    },
    
    // 📊 右ペイン詳細評価表示
    updateDetailedEvaluation(evaluation, totalScore, status) {
        if (!AppState.knowledgeSettings.showDetailedEvaluation) return;
        
        // 既存の知見表示を更新（詳細情報付き）
        const extractedKnowledge = window.UIManager.DOMUtils.get('extractedKnowledge');
        if (!extractedKnowledge) return;
        
        const statusIcon = {
            'auto': '✅',
            'pending': '⏳',
            'approved': '👍',
            'rejected': '❌'
        }[status] || '📊';
        
        const evaluationHtml = `
            <div style="padding: 8px 10px; margin-bottom: 6px; background: rgba(255, 255, 255, 0.15); border-radius: 8px; font-size: 11px; border-left: 3px solid #06b6d4;">
                <div style="font-weight: 600; color: #06b6d4; line-height: 1.4; margin-bottom: 4px;">
                    ${statusIcon} ${evaluation.summary}
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #999;">
                    <span>信頼性:${Math.round(evaluation.confidence * 100)}%</span>
                    <span>重要性:${Math.round(evaluation.importance * 100)}%</span>
                    <span>実行性:${Math.round(evaluation.actionability * 100)}%</span>
                </div>
                <div style="text-align: center; margin-top: 2px; font-weight: 600; color: ${totalScore >= AppState.knowledgeSettings.autoRecordThreshold ? '#4caf50' : '#ffa500'};">
                    総合: ${totalScore}点
                </div>
            </div>
        `;
        
        if (status === 'pending') {
            // 保留中の場合は一時的に表示
            extractedKnowledge.innerHTML = evaluationHtml + extractedKnowledge.innerHTML;
        }
    },
    
    // 📈 平均スコア更新
    updateAverageScore(newScore) {
        const total = AppState.sessionStats.totalKnowledge;
        const currentAvg = AppState.sessionStats.averageScore;
        AppState.sessionStats.averageScore = ((currentAvg * (total - 1)) + newScore) / total;
    },
    
    // 🔧 知見評価前提条件チェック
    async _checkEvaluationPrerequisites() {
        const issues = [];
        
        // APIキーの確認
        if (!window.AppState?.apiKey) {
            issues.push('APIキーが設定されていません');
        }
        
        // 入力テキストの確認
        if (!window.AppState?.voiceRecognitionState?.pendingKnowledgeEvaluation?.insightText) {
            // 実際の評価実行時に再チェック
        }
        
        // AIManagerの存在確認
        if (!window.AIManager) {
            issues.push('AIManagerが読み込まれていません');
        }
        
        // QualityAssessmentSystemの確認
        if (!window.QualityAssessmentSystem) {
            issues.push('QualityAssessmentSystemが読み込まれていません');
        }
        
        // AI_PROMPTSの確認
        if (!window.AI_PROMPTS) {
            issues.push('AI_PROMPTSが読み込まれていません');
        }
        
        return {
            canProceed: issues.length === 0,
            reason: issues.length > 0 ? issues.join(', ') : null,
            issues: issues
        };
    },
    
    // 🔧 手動評価フォールバック処理（改善版）
    async _handleManualEvaluationFallback(insightText, conversationContext) {
        try {
            console.log('🔄 手動評価フォールバック開始...');
            
            // はほりーのによる音声説明
            const explanationMessage = `AI評価システムが一時的に利用できません。手動で評価させていただきます。`;
            await this.speakAsHahori(explanationMessage);
            
            // 知見内容の確認
            const knowledgePreview = insightText.length > 100 ? 
                insightText.substring(0, 100) + '...' : insightText;
            
            const confirmationMessage = `「${knowledgePreview}」という知見が抽出されました。この知見を保存しますか？「はい」または「いいえ」でお答えください。`;
            await this.speakAsHahori(confirmationMessage);
            
            // 手動確認モードに入る
            ConversationGatekeeper.enterKnowledgeConfirmationMode('manualFallback');
            
            // 手動評価用の評価データを準備
            const manualEvaluation = {
                confidence: 0.75,
                importance: 0.75,
                actionability: 0.75,
                overall: 0.75,
                summary: knowledgePreview,
                reason: 'AI評価システム利用不可のため手動評価',
                recommendation: 'MANUAL_CONFIRM'
            };
            
            // 保留中の知見評価を設定（音声応答を待つ）
            AppState.voiceRecognitionState.pendingKnowledgeEvaluation = {
                ...manualEvaluation,
                insightText: insightText,
                totalScore: 75, // 中間値として75点
                isManualFallback: true
            };
            
            // 音声認識の再開
            restartSpeechRecognition();
            
            // この時点では結果を返さず、音声応答を待つ
            return null;
            
        } catch (error) {
            console.error('❌ 手動評価フォールバックエラー:', error);
            
            // エラー時の緊急処理
            const errorMessage = `評価処理でエラーが発生しました。知見を保存せずに続行します。`;
            if (window.showMessage) {
                window.showMessage('error', errorMessage);
            }
            
            return {
                accepted: false,
                reason: 'manual_fallback_error',
                evaluation: null,
                summary: 'フォールバック処理でエラー発生'
            };
        }
    },
    
    // 🧪 Phase 4: システム健全性チェック機能
    async performSystemHealthCheck() {
        console.log('🔍 知見評価システム健全性チェック開始...');
        
        const healthReport = {
            timestamp: new Date().toISOString(),
            aiManager: false,
            apiConnection: false,
            voiceSystem: false,
            overall: false,
            errors: [],
            recommendations: []
        };
        
        try {
            // 1. AIManager健全性チェック
            if (window.AIManager) {
                try {
                    await window.AIManager.waitForInitialization(5000);
                    if (window.AIManager.isInitialized) {
                        healthReport.aiManager = true;
                        console.log('✅ AIManager: 正常');
                    } else {
                        healthReport.errors.push('AIManager初期化未完了');
                        healthReport.recommendations.push('ページを再読み込みしてください');
                    }
                } catch (error) {
                    healthReport.errors.push(`AIManager初期化エラー: ${error.message}`);
                    healthReport.recommendations.push('AIManager初期化を手動実行してください');
                }
            } else {
                healthReport.errors.push('AIManagerが未定義');
                healthReport.recommendations.push('AIManagerモジュールの読み込みを確認してください');
            }
            
            // 2. API接続チェック（軽量）
            if (window.AppState?.apiKey) {
                healthReport.apiConnection = true;
                console.log('✅ API設定: 正常');
            } else {
                healthReport.errors.push('APIキーが未設定');
                healthReport.recommendations.push('APIキーを設定してください');
            }
            
            // 3. 音声認識システムチェック
            if (window.stateManager?.recognitionManager) {
                const voiceState = window.stateManager.recognitionManager.state;
                if (voiceState === 'idle' || voiceState === 'active') {
                    healthReport.voiceSystem = true;
                    console.log('✅ 音声認識: 正常');
                } else {
                    healthReport.errors.push(`音声認識状態異常: ${voiceState}`);
                    healthReport.recommendations.push('音声認識を再開してください');
                }
            } else {
                healthReport.errors.push('音声認識システムが未初期化');
                healthReport.recommendations.push('音声システムを再初期化してください');
            }
            
            // 4. 総合判定
            healthReport.overall = healthReport.aiManager && healthReport.apiConnection && healthReport.voiceSystem;
            
            console.log('📊 健全性チェック結果:', {
                overall: healthReport.overall ? '✅ 正常' : '❌ 問題あり',
                components: {
                    aiManager: healthReport.aiManager ? '✅' : '❌',
                    apiConnection: healthReport.apiConnection ? '✅' : '❌',  
                    voiceSystem: healthReport.voiceSystem ? '✅' : '❌'
                },
                errors: healthReport.errors.length,
                recommendations: healthReport.recommendations.length
            });
            
            return healthReport;
            
        } catch (error) {
            console.error('❌ 健全性チェックエラー:', error);
            healthReport.errors.push(`健全性チェック実行エラー: ${error.message}`);
            healthReport.recommendations.push('システムを再起動してください');
            return healthReport;
        }
    },
    
    // 🔧 Phase 4: 自動回復処理
    async performAutoRecovery() {
        console.log('🚑 知見評価システム自動回復開始...');
        
        const recoveryReport = {
            timestamp: new Date().toISOString(),
            attempted: [],
            successful: [],
            failed: [],
            overall: false
        };
        
        try {
            // 1. AIManager回復試行
            if (!window.AIManager?.isInitialized) {
                recoveryReport.attempted.push('AIManager初期化');
                try {
                    if (typeof initializeAIManager === 'function') {
                        await initializeAIManager();
                        recoveryReport.successful.push('AIManager初期化成功');
                        console.log('✅ AIManager回復成功');
                    } else {
                        recoveryReport.failed.push('initializeAIManager関数が見つからない');
                    }
                } catch (error) {
                    recoveryReport.failed.push(`AIManager初期化失敗: ${error.message}`);
                }
            }
            
            // 2. 音声認識回復試行
            if (!window.stateManager?.recognitionManager || 
                window.stateManager.recognitionManager.state === 'error') {
                recoveryReport.attempted.push('音声認識システム回復');
                try {
                    if (window.stateManager) {
                        await window.stateManager.recognitionManager.stop();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        await window.stateManager.startRecognition();
                        recoveryReport.successful.push('音声認識システム回復成功');
                        console.log('✅ 音声認識回復成功');
                    } else {
                        recoveryReport.failed.push('StateManagerが未初期化');
                    }
                } catch (error) {
                    recoveryReport.failed.push(`音声認識回復失敗: ${error.message}`);
                }
            }
            
            // 3. 回復結果判定
            recoveryReport.overall = recoveryReport.failed.length === 0 && recoveryReport.attempted.length > 0;
            
            console.log('🚑 自動回復結果:', {
                overall: recoveryReport.overall ? '✅ 成功' : (recoveryReport.attempted.length === 0 ? '📝 不要' : '❌ 失敗'),
                attempted: recoveryReport.attempted.length,
                successful: recoveryReport.successful.length,
                failed: recoveryReport.failed.length
            });
            
            return recoveryReport;
            
        } catch (error) {
            console.error('❌ 自動回復エラー:', error);
            recoveryReport.failed.push(`自動回復実行エラー: ${error.message}`);
            return recoveryReport;
        }
    },
    
    // 🧪 Phase 4: 知見評価テスト機能
    async testInsightEvaluation(testInsight = null) {
        console.log('🧪 知見評価システムテスト開始...');
        
        const testData = testInsight || {
            text: 'これはテスト用の知見です。AIマネージャーの動作確認のために使用されます。',
            context: { phase: 'test', user: 'system' }
        };
        
        const testReport = {
            timestamp: new Date().toISOString(),
            testInput: testData,
            healthCheck: null,
            evaluationResult: null,
            duration: 0,
            success: false,
            errors: []
        };
        
        const startTime = Date.now();
        
        try {
            // 1. 事前健全性チェック
            testReport.healthCheck = await this.performSystemHealthCheck();
            
            if (!testReport.healthCheck.overall) {
                console.log('⚠️ システム健全性に問題があります。自動回復を試行...');
                const recoveryResult = await this.performAutoRecovery();
                
                if (!recoveryResult.overall && recoveryResult.attempted.length > 0) {
                    throw new Error('システム回復に失敗しました');
                }
                
                // 回復後再チェック
                testReport.healthCheck = await this.performSystemHealthCheck();
            }
            
            // 2. 実際の知見評価テスト（非破壊的）
            if (testReport.healthCheck.overall) {
                console.log('🔄 知見評価テスト実行中...');
                
                // テスト用に評価のみ実行（実際の保存はしない）
                if (window.AIManager && window.AIManager.isInitialized) {
                    const evaluation = await window.AIManager.evaluateInsightQuality(
                        testData.text, 
                        testData.context
                    );
                    
                    testReport.evaluationResult = evaluation;
                    testReport.success = evaluation !== null && evaluation.overall !== undefined;
                } else {
                    testReport.evaluationResult = 'AIManager利用不可';
                    testReport.success = false;
                }
                
                console.log('✅ 知見評価テスト完了');
            } else {
                throw new Error('システム健全性チェックに失敗');
            }
            
        } catch (error) {
            console.error('❌ 知見評価テストエラー:', error);
            testReport.errors.push(error.message);
            testReport.success = false;
        } finally {
            testReport.duration = Date.now() - startTime;
        }
        
        console.log('🧪 テスト結果サマリー:', {
            success: testReport.success ? '✅ 成功' : '❌ 失敗',
            duration: `${testReport.duration}ms`,
            healthStatus: testReport.healthCheck?.overall ? '✅ 正常' : '❌ 問題あり',
            evaluationCompleted: testReport.evaluationResult ? '✅ 完了' : '❌ 失敗',
            errors: testReport.errors.length
        });
        
        return testReport;
    }
};

// 🎤 音声コマンドハンドラー関数群
async function handleThresholdChangeCommand(userInput) {
    for (const pattern of VoicePatterns.THRESHOLD_PATTERNS) {
        const match = userInput.match(pattern);
        if (match) {
            const newThreshold = parseInt(match[1]);
            if (newThreshold >= 0 && newThreshold <= 100) {
                AppState.knowledgeSettings.autoRecordThreshold = newThreshold;
                
                // 設定保存
                if (AppState.knowledgeSettings.saveThresholdChanges) {
                    saveKnowledgeSettings();
                }
                
                // 音声確認
                const message = VoiceTemplates.THRESHOLD_CHANGE(newThreshold);
                await VoiceKnowledgeSystem.speakAsHahori(message);
                
                // 右ペイン設定表示更新
                updateKnowledgeSettingsDisplay();
                
                // 知見確認モード終了
                resetKnowledgeConfirmationMode();
                
                console.log(`✅ 閾値を${newThreshold}点に変更`);
                return true;
            }
        }
    }
    return false;
}

function handleSettingsInquiry(userInput) {
    if (VoicePatterns.SETTINGS_INQUIRY_PATTERNS.some(pattern => userInput.includes(pattern))) {
        const threshold = AppState.knowledgeSettings.autoRecordThreshold;
        const message = VoiceTemplates.CURRENT_SETTINGS(threshold);
        VoiceKnowledgeSystem.speakAsHahori(message);
        return true;
    }
    
    if (VoicePatterns.DEFAULT_RESET_PATTERNS.some(pattern => userInput.includes(pattern))) {
        AppState.knowledgeSettings.autoRecordThreshold = 70;
        saveKnowledgeSettings();
        const message = VoiceTemplates.THRESHOLD_CHANGE(70);
        VoiceKnowledgeSystem.speakAsHahori(message);
        updateKnowledgeSettingsDisplay();
        resetKnowledgeConfirmationMode();
        return true;
    }
    
    if (VoicePatterns.AUTO_RECORD_OFF_PATTERNS.some(pattern => userInput.includes(pattern))) {
        AppState.knowledgeSettings.autoRecordThreshold = 0;
        saveKnowledgeSettings();
        const message = `承知いたしました。今後は全ての知見を手動確認いたします。`;
        VoiceKnowledgeSystem.speakAsHahori(message);
        updateKnowledgeSettingsDisplay();
        resetKnowledgeConfirmationMode();
        return true;
    }
    
    return false;
}

async function handleDetailedExplanation(evaluation) {
    const message = VoiceTemplates.DETAILED_EXPLANATION(evaluation);
    await VoiceKnowledgeSystem.speakAsHahori(message);
    
    // 詳細説明後、再度確認を求める
    const confirmMessage = `改めてお伺いします。この知見を記録しますか？`;
    await VoiceKnowledgeSystem.speakAsHahori(confirmMessage);
}

async function handleKnowledgeApproval(evaluation) {
    console.log('✅ ユーザー承認: 知見記録');
    
    // 統計更新
    AppState.sessionStats.manualConfirmed++;
    
    // 知見を記録
    AppState.extractedKnowledge.push({
        summary: evaluation.summary,
        timestamp: new Date(),
        score: evaluation.totalScore,
        evaluation: evaluation,
        method: 'manual_approved'
    });
    
    // 表示更新
    window.updateKnowledgeDisplay();
    VoiceKnowledgeSystem.updateDetailedEvaluation(evaluation, evaluation.totalScore, 'approved');
    
    // 確認モード終了
    resetKnowledgeConfirmationMode();
    
    // 次の質問へ
    await askNextQuestionInDeepDive();
}

async function handleKnowledgeRejection() {
    console.log('❌ ユーザー拒否: 知見記録せず');
    
    // 統計更新
    AppState.sessionStats.rejected++;
    
    // 音声確認
    const message = VoiceTemplates.KNOWLEDGE_REJECTED();
    await VoiceKnowledgeSystem.speakAsHahori(message);
    
    // 確認モード終了
    resetKnowledgeConfirmationMode();
    
    // 次の質問へ
    await askNextQuestionInDeepDive();
}

async function handleUnrecognizedResponse() {
    console.warn('⚠️ 音声認識できず: 再確認');
    
    const message = VoiceTemplates.RECOGNITION_ERROR();
    await VoiceKnowledgeSystem.speakAsHahori(message);
    
    // 🔧 修正: 統合音声認識システムで再開（知見確認モード対応）
    if (window.stateManager?.recognitionManager) {
        console.log('🔄 統合システムで音声認識再開（知見確認モード）');
        // 短時間待機後に再開（はほりーの発話終了を待つ）
        setTimeout(() => {
            window.stateManager.recognitionManager.start();
        }, 1000);
    } else {
        // フォールバック: 旧システムで再開
        restartSpeechRecognition();
    }
}

// 🔧 ユーティリティ関数
// 🔧 改善版: ゲートキーパー対応の知見確認モードリセット
function resetKnowledgeConfirmationMode() {
    console.log('🏁 知見確認モード終了処理開始');
    
    // ゲートキーパーシステムを通じて安全にモードを終了
    ConversationGatekeeper.exitKnowledgeConfirmationMode('resetFunction');
    
    // レガシー状態もクリア（互換性のため）
    AppState.waitingForPermission = true;
    
    console.log('✅ 知見確認モード終了処理完了');
}

// 知見設定保存（StorageManager経由）
function saveKnowledgeSettings() {
    try {
        window.StorageManager.knowledge.save(AppState.knowledgeSettings);
    } catch (error) {
        console.error('❌ 知見設定保存エラー:', error);
    }
}

// 知見設定読み込み（StorageManager経由）
function loadKnowledgeSettings() {
    try {
        const settings = window.StorageManager.knowledge.load();
        if (settings) {
            Object.assign(AppState.knowledgeSettings, settings);
            console.log('✅ 知見設定を読み込みました');
        }
    } catch (error) {
        console.error('❌ 知見設定読み込みエラー:', error);
    }
}

// 🎯 右ペイン設定表示更新
function updateKnowledgeSettingsDisplay() {
    const thresholdInput = window.UIManager.DOMUtils.get('thresholdInput');
    const autoRecordCount = window.UIManager.DOMUtils.get('autoRecordCount');
    const manualConfirmCount = window.UIManager.DOMUtils.get('manualConfirmCount');
    const rejectedCount = window.UIManager.DOMUtils.get('rejectedCount');
    
    if (thresholdInput) {
        thresholdInput.value = AppState.knowledgeSettings.autoRecordThreshold;
    }
    
    if (autoRecordCount) {
        autoRecordCount.textContent = AppState.sessionStats.autoRecorded;
    }
    
    if (manualConfirmCount) {
        manualConfirmCount.textContent = AppState.sessionStats.manualConfirmed;
    }
    
    if (rejectedCount) {
        rejectedCount.textContent = AppState.sessionStats.rejected;
    }
    
    console.log('✅ 知見設定表示を更新しました');
}

// 🎯 HTML入力による閾値変更
function updateThresholdFromInput() {
    const thresholdInput = window.UIManager.DOMUtils.get('thresholdInput');
    if (!thresholdInput) return;
    
    const newThreshold = parseInt(thresholdInput.value);
    if (newThreshold >= 0 && newThreshold <= 100) {
        AppState.knowledgeSettings.autoRecordThreshold = newThreshold;
        
        if (AppState.knowledgeSettings.saveThresholdChanges) {
            saveKnowledgeSettings();
        }
        
        console.log(`✅ 閾値を${newThreshold}点に変更（HTML入力）`);
        
        // 音声通知（セッション中のみ）
        if (AppState.sessionActive) {
            const message = VoiceTemplates.THRESHOLD_CHANGE(newThreshold);
            VoiceKnowledgeSystem.speakAsHahori(message);
        }
    } else {
        // 無効な値の場合は元に戻す
        thresholdInput.value = AppState.knowledgeSettings.autoRecordThreshold;
        window.showMessage('error', '閾値は0-100の範囲で入力してください');
    }
}

// 🎯 左ペイン音声コマンド表示制御

    // 📥 知見ファイルダウンロード機能（Knowledge DNA統合）
async function downloadKnowledgeFile() {
    try {
        // 🔧 Phase A修正: 手動保存知見統合チェック
        const sessionInsights = window.KnowledgeState.currentSession ? window.KnowledgeState.currentSession.insights : [];
        const manualInsights = AppState.extractedKnowledge || [];
        
        console.log(`📊 知見統合チェック: セッション${sessionInsights.length}件, 手動${manualInsights.length}件`);
        
        if (sessionInsights.length === 0 && manualInsights.length === 0) {
            window.showMessage('warning', '知見データがありません。セッション中に抽出された知見があるときにダウンロードできます。');
            return;
        }

        console.log('📥 Knowledge DNA統合 知見ファイルダウンロード開始...');
        window.showMessage('info', '🧬 Knowledge DNAシステムによる知見ファイル生成中...');

        // 🔧 Phase A修正: 手動保存された知見をセッションに統合
        let workingSession;
        if (!window.KnowledgeState.currentSession) {
            // セッションが存在しない場合は手動知見のみで作成
            workingSession = {
                meta: {
                    session_id: `manual_${Date.now()}`,
                    theme: AppState.currentTheme || '手動保存知見',
                    timestamp: new Date().toISOString(),
                    participant: 'ユーザー',
                    category: 'その他'
                },
                insights: []
            };
        } else {
            workingSession = { ...window.KnowledgeState.currentSession };
        }

        // 手動保存知見の統合処理
        const manualInsightsConverted = manualInsights.map((insight, index) => ({
            id: `manual_${index}`,
            content: insight.summary || insight.content || '内容不明',
            timestamp: insight.timestamp || new Date(),
            context: 'manual_approval',
            importance: insight.score || 70,
            source: 'manual_confirmed',
            method: insight.method || 'manual_approved',
            evaluation: insight.evaluation || null,
            // 🔧 手動保存済みフラグを設定（リライト処理は通常通り実行）
            is_manually_approved: true
        }));

        // セッション知見と手動知見の統合
        workingSession.insights = [...workingSession.insights, ...manualInsightsConverted];
        
        console.log(`✅ 知見統合完了: 合計${workingSession.insights.length}件`);

        // Phase 1: Knowledge DNAによる知見整理（手動保存知見も通常処理を適用）
        const enhancedSession = await KnowledgeFileManager.enhanceKnowledgeWithAI(
            workingSession, 
            true // プログレス表示ON
        );

        // Phase 2: 拡張されたセッションでファイル生成
        window.showMessage('info', '📄 構造化ファイルを生成中...');
        const filename = await KnowledgeFileManager.generateKnowledgeFile(enhancedSession);
        
        if (filename) {
            window.showMessage('success', `🎉 Knowledge DNA統合知見ファイル「${filename}」をダウンロードしました！`);
            console.log('✅ Knowledge DNA統合 知見ファイルダウンロード完了:', filename);
            
            // 🔧 Phase A修正: 統計情報の改良
            const stats = {
                total_insights: enhancedSession.insights.length,
                session_insights: sessionInsights.length,
                manual_insights: manualInsights.length,
                ai_enhanced: enhancedSession.insights.filter(i => i.dna_enhanced).length,
                manually_approved: enhancedSession.insights.filter(i => i.is_manually_approved).length,
                has_relationships: enhancedSession.knowledge_graph?.relationships?.length > 0,
                has_clusters: enhancedSession.knowledge_graph?.clusters?.length > 0
            };
            console.log('📊 知見処理統計:', stats);
            
        } else {
            window.showMessage('error', '知見ファイルの生成に失敗しました。');
        }

    } catch (error) {
        console.error('❌ Knowledge DNA知見ファイルダウンロードエラー:', error);
        window.showMessage('error', `知見ファイルのダウンロードでエラーが発生しました: ${error.message}`);
    }
}

// =================================================================================
// SAFETY BACKUP SYSTEM - 既存機能保護システム
// =================================================================================
// 注意: SafetyBackupシステムは独立ファイル config/safety_backup.js に移行済み
// ここでは削除されています

// =================================================================================
// GLOBAL EXPORTS - グローバル関数公開
// =================================================================================

// HTMLから直接呼び出される関数をwindowオブジェクトに公開
window.loginWithPassword = loginWithPassword;
window.openAdvancedSettings = openAdvancedSettings;
window.closeAdvancedSettings = closeAdvancedSettings;
window.setupApiKey = setupApiKey;
window.testApiKey = testApiKey;
window.startSession = startSession;
window.toggleMicrophone = toggleMicrophone;
window.handleUserTextInput = handleUserTextInput;
window.update2StepUI = update2StepUI;
window.handleLogout = handleLogout;
window.handleThemeClear = handleThemeClear;
window.saveVoicePreset = saveVoicePreset;
window.testCharacterVoice = testCharacterVoice;
window.checkLoginBeforeFileSelect = checkLoginBeforeFileSelect;
window.triggerFileInput = triggerFileInput;
window.downloadMarkdownReport = downloadMarkdownReport;
window.exportAllData = exportAllData;
window.handleModalBackgroundClick = handleModalBackgroundClick;
window.closeFileErrorModal = closeFileErrorModal;
window.returnToLoginFromError = returnToLoginFromError;
window.closeThemeSelection = closeThemeSelection;
window.selectAllThemes = selectAllThemes;
window.deselectAllThemes = deselectAllThemes;
window.confirmThemeSelection = confirmThemeSelection;
window.toggleVoiceGuide = toggleVoiceGuide;
window.updateThresholdFromInput = updateThresholdFromInput;
window.downloadKnowledgeFile = downloadKnowledgeFile;
window.downloadAllKnowledge = downloadAllKnowledge;
window.FukaboriKnowledgeDatabase = FukaboriKnowledgeDatabase;

// =================================================================================
// PHASE 1: SPEECH SHORTENING INTEGRATION - 発声短縮統合システム
// =================================================================================

// 🔧 Phase 1: 発声短縮設定管理
const SpeechShorteningManager = {
    // 設定状態
    settings: {
        enabled: false,
        level: 3,
        maxCharacters: 150,
        options: {
            shortenGreetings: true,
            shortenHonorific: true,
            shortenThemes: true,
            removeRedundancy: true
        }
    },

    // 初期化
    init() {
        console.log('🔧 Phase 1: 発声短縮管理システム初期化中...');
        this.loadSettings();
        
        // UI更新はui-advanced.jsのUIAdvancedに委譲
        if (window.UIAdvanced && window.UIAdvanced.SpeechShorteningUI) {
            window.UIAdvanced.SpeechShorteningUI.updateUI();
        } else {
            console.warn('⚠️ UIAdvanced.SpeechShorteningUIが利用できません - UI更新をスキップ');
        }
        
        console.log('✅ Phase 1: 発声短縮管理システム初期化完了');
    },

    // 設定の保存
    saveSettings() {
        try {
            localStorage.setItem('speechShorteningSettings', JSON.stringify(this.settings));
            console.log('💾 発声短縮設定を保存しました', this.settings);
        } catch (error) {
            console.error('❌ 発声短縮設定の保存に失敗:', error);
        }
    },

    // 設定の読み込み
    loadSettings() {
        try {
            const saved = localStorage.getItem('speechShorteningSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
                console.log('📂 発声短縮設定を読み込みました', this.settings);
            }
        } catch (error) {
            console.error('❌ 発声短縮設定の読み込みに失敗:', error);
            // デフォルト設定を使用
        }
    },

    // UI更新
    // 🔧 UI最適化Phase1: UI関連メソッドをapp/ui-advanced.jsに移動
    // updateUI, toggleEnabled, updateLevel, updateMaxCharacters, resetSettings
    
    // 統合処理: 発声短縮エンジンとの連携
    async processTextWithShortening(originalText, speaker) {
        if (!this.settings.enabled) {
            console.log('🚫 Phase 1: 発声短縮無効のため元テキストを返却');
            return originalText; // 無効時は元のテキストをそのまま返す
        }

        console.log('🔧 Phase 1: 発声短縮処理開始', {
            enabled: this.settings.enabled,
            level: this.settings.level,
            maxCharacters: this.settings.maxCharacters,
            options: this.settings.options
        });

        try {
            // Phase 0で実装した発声短縮エンジンを使用
            if (window.SpeechShorteningEngine) {
                // 🔧 強制設定同期（毎回実行して確実に同期）
                window.SpeechShorteningEngine.enabled = this.settings.enabled;
                window.SpeechShorteningEngine.settings.level = this.settings.level;
                window.SpeechShorteningEngine.settings.maxLength = this.settings.maxCharacters;
                
                // 個別オプションの強制同期
                if (this.settings.options) {
                    const options = this.settings.options;
                    window.SpeechShorteningEngine.settings.features.greetingShortening = options.shortenGreetings !== false;
                    window.SpeechShorteningEngine.settings.features.politeSimplification = options.shortenHonorific !== false;
                    window.SpeechShorteningEngine.settings.features.themeShortening = options.shortenThemes !== false;
                    window.SpeechShorteningEngine.settings.features.redundancyRemoval = options.removeRedundancy !== false;
                    window.SpeechShorteningEngine.settings.features.characterLimit = true;
                }

                console.log('🔄 Phase 1→Phase 0 設定強制同期完了', {
                    engineEnabled: window.SpeechShorteningEngine.enabled,
                    engineLevel: window.SpeechShorteningEngine.settings.level,
                    engineMaxLength: window.SpeechShorteningEngine.settings.maxLength,
                    engineFeatures: window.SpeechShorteningEngine.settings.features
                });

                // Phase 0エンジンの呼び出し（引数を修正）
                const shortenedText = window.SpeechShorteningEngine.shortenText(originalText);

                // ログ出力（常に表示）
                const reductionRate = Math.round((1 - shortenedText.length / originalText.length) * 100);
                console.log(`🎤 Phase 1 発声短縮実行:`);
                console.log(`📝 元文字数: ${originalText.length}文字`);
                console.log(`🔊 短縮後: ${shortenedText.length}文字`);
                console.log(`📉 短縮率: ${reductionRate}%`);

                if (reductionRate === 0) {
                    console.warn('⚠️ 短縮率0% - Phase 0エンジンの設定または短縮ルールを確認してください');
                }

                return shortenedText;
            } else {
                console.log('📝 発声短縮エンジンが利用できません - 内蔵短縮機能を使用');
                return shortenForSpeech(originalText, this.settings.maxCharacters);
            }
        } catch (error) {
            console.error('❌ 発声短縮処理エラー:', error);
            // エラー時は既存の短縮処理を使用（フォールバック）
            return shortenForSpeech(originalText, this.settings.maxCharacters);
        }
    },

    // UI関連メソッド（app/ui-advanced.jsから呼び出し）
    toggleEnabled() {
        this.settings.enabled = !this.settings.enabled;
        this.saveSettings();
        
        const status = this.settings.enabled ? '有効' : '無効';
        console.log(`🔄 発声短縮機能: ${status}`);
        window.showMessage('success', `発声短縮機能を${status}にしました`);
    },

    updateLevel(level) {
        this.settings.level = parseInt(level);
        this.saveSettings();
        console.log(`📊 発声短縮レベル: ${this.settings.level}`);
    },

    updateMaxCharacters(maxChars) {
        this.settings.maxCharacters = parseInt(maxChars);
        this.saveSettings();
        console.log(`📏 最大文字数: ${this.settings.maxCharacters}`);
    },

    resetSettings() {
        this.settings = {
            enabled: false,
            level: 3,
            maxCharacters: 150,
            options: {
                shortenGreetings: true,
                shortenHonorific: true,
                shortenThemes: true,
                removeRedundancy: true
            }
        };
        this.saveSettings();
        window.showMessage('success', '発声短縮設定をリセットしました');
        console.log('🔄 発声短縮設定をリセット');
    }
};

// 🔧 Phase 1: 統合発話処理の改良版
async function addMessageToChatWithSmartShortening(speaker, displayText, speechText = null) {
    console.log('🚀 Phase 1: 統合発話処理開始', { 
        speaker, 
        displayLength: displayText.length,
        customSpeech: !!speechText 
    });

    // チャット表示（長いテキスト）
    await addMessageToChat(speaker, displayText);
    
    try {
        // 音声用テキストの決定
        let textForSpeech;
        
        if (speechText) {
            // カスタム音声テキストが指定されている場合
            textForSpeech = speechText;
            console.log('📝 カスタム音声テキストを使用');
        } else {
            // Phase 1: 発声短縮システムを使用
            textForSpeech = await SpeechShorteningManager.processTextWithShortening(displayText, speaker);
        }
        
        // 短縮統計の表示
        if (displayText.length > textForSpeech.length) {
            const reduction = Math.round((1 - textForSpeech.length / displayText.length) * 100);
            console.log(`✂️ Phase 1: 発声短縮実行 ${displayText.length}→${textForSpeech.length}文字 (${reduction}%短縮)`);
        }

        // 音声生成・再生
        const audioBlob = await ttsTextToAudioBlob(textForSpeech, speaker);
        await playPreGeneratedAudio(audioBlob, speaker);
        
        console.log('✅ Phase 1: 統合発話処理完了');
        
    } catch (error) {
        console.error('❌ Phase 1: 統合発話処理エラー:', error);
        window.showMessage('error', '音声の生成に失敗しました');
        
        // 緊急フォールバック: 安全システムを使用
        if (window.FukaboriSafetySystem) {
            console.log('🛡️ 安全システムによるフォールバック実行');
            await window.FukaboriSafetySystem.fallbackTextToSpeech(displayText, speaker);
        }
    }
}

// =================================================================================
// PHASE 1: UI EVENT HANDLERS - UI イベントハンドラー
// =================================================================================

// 🔧 UI最適化Phase1: 発声短縮UI関数をapp/ui-advanced.jsに移動
// toggleSpeechShortening, updateShorteningLevel, updateMaxCharacters, 
// resetShorteningSettings, testSpeechShortening

// =================================================================================
// PHASE 1: INITIALIZATION - Phase 1 初期化
// =================================================================================

// グローバル公開
window.SpeechShorteningManager = SpeechShorteningManager;

// DOMContentLoadedイベントでPhase 1システムを初期化
document.addEventListener('DOMContentLoaded', function() {
    // Phase 1システムの初期化（安全システム初期化後に実行）
    setTimeout(() => {
        if (typeof SpeechShorteningManager !== 'undefined') {
            SpeechShorteningManager.init();
            console.log('🚀 Phase 1: 発声短縮統合システム初期化完了');
        }
    }, 100);
});

console.log('✅ グローバル関数をwindowオブジェクトに公開しました');
console.log('🚀 Phase 1: 発声短縮統合システム読み込み完了');

// =================================================================================
// PHASE 1: デバッグ・修復UI機能
// =================================================================================

// 設定同期状況確認
window.checkShorteningSync = function() {
    const debugInfo = document.getElementById('debugInfoContent');
    const debugDisplay = document.getElementById('shorteningDebugInfo');
    
    const info = {
        timestamp: new Date().toLocaleString(),
        phase1: {
            enabled: SpeechShorteningManager.settings.enabled,
            level: SpeechShorteningManager.settings.level,
            maxCharacters: SpeechShorteningManager.settings.maxCharacters,
            options: SpeechShorteningManager.settings.options
        },
        phase0: {
            available: !!window.SpeechShorteningEngine,
            enabled: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.enabled : 'N/A',
            level: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.settings.level : 'N/A',
            maxLength: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.settings.maxLength : 'N/A',
            features: window.SpeechShorteningEngine ? window.SpeechShorteningEngine.settings.features : 'N/A'
        },
        syncStatus: 'チェック中...'
    };
    
    // 同期状況判定
    if (!window.SpeechShorteningEngine) {
        info.syncStatus = '❌ Phase 0エンジンが利用できません';
    } else if (info.phase1.enabled !== info.phase0.enabled) {
        info.syncStatus = '⚠️ 有効状態が不一致';
    } else if (info.phase1.enabled && info.phase0.enabled && info.phase1.level !== info.phase0.level) {
        info.syncStatus = '⚠️ 短縮レベルが不一致';
    } else if (info.phase1.enabled && info.phase0.enabled) {
        info.syncStatus = '✅ 同期済み（短縮が動作しない場合は強制同期を実行）';
    } else {
        info.syncStatus = '🔄 両方とも無効状態';
    }
    
    debugInfo.textContent = JSON.stringify(info, null, 2);
    debugDisplay.style.display = 'block';
    
    window.showMessage('info', '設定同期状況を確認しました。下記のデバッグ情報を確認してください。');
};

// 強制同期修復
window.forceShorteningSync = function() {
    if (!window.SpeechShorteningEngine) {
        window.showMessage('error', 'Phase 0エンジンが利用できません。ページを再読み込みしてください。');
        return;
    }
    
    try {
        // Phase 1の設定をPhase 0に強制同期
        window.SpeechShorteningEngine.enabled = SpeechShorteningManager.settings.enabled;
        window.SpeechShorteningEngine.settings.level = SpeechShorteningManager.settings.level;
        window.SpeechShorteningEngine.settings.maxLength = SpeechShorteningManager.settings.maxCharacters;
        
        // 個別オプションの同期
        if (SpeechShorteningManager.settings.options) {
            const options = SpeechShorteningManager.settings.options;
            window.SpeechShorteningEngine.settings.features.greetingShortening = options.shortenGreetings || true;
            window.SpeechShorteningEngine.settings.features.politeSimplification = options.shortenHonorific || true;
            window.SpeechShorteningEngine.settings.features.themeShortening = options.shortenThemes || true;
            window.SpeechShorteningEngine.settings.features.redundancyRemoval = options.removeRedundancy || true;
            window.SpeechShorteningEngine.settings.features.characterLimit = true;
        }
        
        console.log('🔧 強制同期実行完了');
        console.log('Phase 1 enabled:', SpeechShorteningManager.settings.enabled);
        console.log('Phase 0 enabled:', window.SpeechShorteningEngine.enabled);
        console.log('Phase 1 level:', SpeechShorteningManager.settings.level);
        console.log('Phase 0 level:', window.SpeechShorteningEngine.settings.level);
        
        window.showMessage('success', '設定同期修復が完了しました。再度テストを実行してください。');
        
        // 同期後の状況確認
        setTimeout(() => {
            window.checkShorteningSync();
        }, 500);
        
    } catch (error) {
        console.error('❌ 強制同期エラー:', error);
        window.showMessage('error', '同期修復に失敗しました: ' + error.message);
    }
};

// エンジン直接テスト
window.directShorteningTest = function() {
    if (!window.SpeechShorteningEngine) {
        window.showMessage('error', 'Phase 0エンジンが利用できません。');
        return;
    }
    
    const testText = 'こんにちは、私は深堀AIアシスタントのねほりーのです。本日はお忙しい中、貴重なお時間をいただき、誠にありがとうございます。';
    
    try {
        // エンジンを強制有効化してテスト
        const originalEnabled = window.SpeechShorteningEngine.enabled;
        window.SpeechShorteningEngine.enabled = true;
        
        const result = window.SpeechShorteningEngine.shortenText(testText);
        
        // 結果をデバッグ表示に出力
        const debugInfo = document.getElementById('debugInfoContent');
        const debugDisplay = document.getElementById('shorteningDebugInfo');
        
        const testResult = {
            timestamp: new Date().toLocaleString(),
            engineStatus: '✅ Phase 0エンジン直接テスト',
            originalText: testText,
            originalLength: testText.length,
            shortenedText: result,
            shortenedLength: result.length,
            reductionRate: Math.round((1 - result.length / testText.length) * 100) + '%',
            engineEnabled: window.SpeechShorteningEngine.enabled,
            engineLevel: window.SpeechShorteningEngine.settings.level,
            features: window.SpeechShorteningEngine.settings.features
        };
        
        debugInfo.textContent = JSON.stringify(testResult, null, 2);
        debugDisplay.style.display = 'block';
        
        // 元の設定に戻す
        window.SpeechShorteningEngine.enabled = originalEnabled;
        
        if (result === testText) {
            window.showMessage('warning', 'エンジンは動作していますが短縮されませんでした。短縮ルールの設定を確認してください。');
        } else {
            window.showMessage('success', `エンジン直接テスト完了: ${testResult.reductionRate}短縮されました。`);
        }
        
    } catch (error) {
        console.error('❌ 直接テストエラー:', error);
        window.showMessage('error', '直接テストに失敗しました: ' + error.message);
    }
};

// キャッシュクリア
window.clearShorteningCache = function() {
    try {
        // localStorage クリア
        localStorage.removeItem('speechShorteningEnabled');
        localStorage.removeItem('speechShorteningSettings');
        localStorage.removeItem('speechShorteningEmergencyDisabled');
        
        // Phase 1設定をデフォルトにリセット
        SpeechShorteningManager.settings = {
            enabled: false,
            level: 3,
            maxCharacters: 150,
            options: {
                shortenGreetings: true,
                shortenHonorific: true,
                shortenThemes: true,
                removeRedundancy: true
            }
        };
        
        // Phase 0設定をデフォルトにリセット
        if (window.SpeechShorteningEngine) {
            window.SpeechShorteningEngine.enabled = false;
            window.SpeechShorteningEngine.settings.level = 1;
            window.SpeechShorteningEngine.settings.maxLength = 200;
        }
        
        // UI更新
        SpeechShorteningManager.updateUI();
        
        // デバッグ表示をクリア
        const debugDisplay = document.getElementById('shorteningDebugInfo');
        if (debugDisplay) {
            debugDisplay.style.display = 'none';
        }
        
        window.showMessage('success', 'キャッシュをクリアしました。設定をリセットしてから再度有効化してください。');
        
    } catch (error) {
        console.error('❌ キャッシュクリアエラー:', error);
        window.showMessage('error', 'キャッシュクリアに失敗しました: ' + error.message);
    }
};

console.log('🔧 デバッグ・修復UI機能を追加しました');




window.clearApiKey = clearApiKey;
window.changePassword = changePassword;
window.updateSessionStartButton = updateSessionStartButton;
window.update2StepUI = update2StepUI;

// LocalStorage操作関数はapp/storage-manager.jsに移動済み

console.log('✅ Step0: APIキー設定システムの関数をwindowオブジェクトに公開しました');
console.log('✅ LocalStorage操作関数をwindowオブジェクトに公開しました');

// =================================================================================
// 新音声システム初期化処理
// =================================================================================

// StateManagerの初期化
function initializeVoiceSystem() {
    console.log('🚀 音声システム初期化開始');
    
    try {
        // StateManagerクラスが定義されているかチェック
        if (typeof StateManager === 'undefined') {
            console.error('❌ StateManagerクラスが未定義です');
            return false;
        }
        
        // グローバル変数として初期化
        window.stateManager = new StateManager();
        
        console.log('✅ 音声システム初期化完了');
        return true;
    } catch (error) {
        console.error('❌ 音声システム初期化エラー:', error);
        window.showMessage('error', '音声システムの初期化に失敗しました');
        return false;
    }
}

// 既存の初期化関数を置き換え
function initializeMicrophoneRecording(forceRecheck = false) {
    console.log('🎤 マイク初期化要求（新システム）');
    
    // StateManagerが定義されているかチェック
    if (typeof window.stateManager === 'undefined') {
        console.error('❌ StateManagerが未定義です');
        return Promise.resolve(false);
    }
    
    if (!window.stateManager) {
        console.error('❌ StateManagerが未初期化');
        // 初期化を試行
        if (initializeVoiceSystem()) {
            console.log('✅ StateManager初期化成功');
        } else {
            console.error('❌ StateManager初期化失敗');
            return Promise.resolve(false);
        }
    }
    
    return window.stateManager.permissionManager.getPermission();
}

function initializeSpeechRecognition() {
    console.log('🔄 SpeechRecognition初期化要求（新システム）');
    
    // StateManagerが定義されているかチェック
    if (typeof window.stateManager === 'undefined') {
        console.error('❌ StateManagerが未定義です');
        return Promise.resolve();
    }
    
    if (!window.stateManager) {
        console.error('❌ StateManagerが未初期化');
        return Promise.resolve();
    }
    
    return window.stateManager.startRecognition();
}

// グローバル関数として公開
window.initializeVoiceSystem = initializeVoiceSystem;
window.initializeKnowledgeManagement = initializeKnowledgeManagement;
window.initializeKnowledgeSession = initializeKnowledgeSession;

// 🧪 Phase 4: テスト・検証機能をグローバル公開
window.testInsightEvaluation = () => VoiceKnowledgeSystem.testInsightEvaluation();
window.performSystemHealthCheck = () => VoiceKnowledgeSystem.performSystemHealthCheck();
window.performAutoRecovery = () => VoiceKnowledgeSystem.performAutoRecovery();

// 🛠️ デバッグ用コンソール機能
window.debugInsightEvaluation = async function() {
    console.log('🛠️ 知見評価システムデバッグ開始...');
    
    try {
        // 1. 健全性チェック
        console.log('1. システム健全性チェック');
        const healthReport = await VoiceKnowledgeSystem.performSystemHealthCheck();
        
        // 2. 必要に応じて自動回復
        if (!healthReport.overall) {
            console.log('2. 自動回復試行');
            const recoveryReport = await VoiceKnowledgeSystem.performAutoRecovery();
            console.log('回復結果:', recoveryReport);
        }
        
        // 3. テスト実行
        console.log('3. 知見評価テスト実行');
        const testReport = await VoiceKnowledgeSystem.testInsightEvaluation();
        
        // 4. 結果まとめ
        console.log('📊 デバッグ結果まとめ:', {
            健全性チェック: healthReport.overall ? '✅ 正常' : '❌ 問題あり',
            テスト実行: testReport.success ? '✅ 成功' : '❌ 失敗',
            実行時間: `${testReport.duration}ms`,
            エラー数: testReport.errors.length
        });
        
        if (testReport.success) {
            console.log('🎉 知見評価システムは正常に動作しています！');
        } else {
            console.log('⚠️ 知見評価システムに問題があります。詳細を確認してください。');
            console.log('エラー詳細:', testReport.errors);
            if (healthReport.recommendations.length > 0) {
                console.log('推奨対処法:', healthReport.recommendations);
            }
        }
        
        return {
            健全性: healthReport,
            テスト結果: testReport
        };
        
    } catch (error) {
        console.error('❌ デバッグ実行エラー:', error);
        return { error: error.message };
    }
};

// DataManager初期化
async function initializeDataManager() {
    console.log('📊 DataManager 初期化開始...');
    
    try {
        if (window.DataManager) {
            const success = await window.DataManager.initialize();
            if (success) {
                console.log('✅ DataManager 初期化完了');
            } else {
                console.error('❌ DataManager 初期化に失敗しました');
            }
        } else {
            console.error('❌ DataManager が見つかりません');
        }
    } catch (error) {
        console.error('❌ DataManager 初期化エラー:', error);
    }
}

// FileManager初期化
async function initializeFileManager() {
    console.log('📄 FileManager 初期化開始...');
    
    try {
        if (window.FileManager) {
            const success = await window.FileManager.initialize();
            if (success) {
                console.log('✅ FileManager 初期化完了');
            } else {
                console.error('❌ FileManager 初期化に失敗しました');
            }
        } else {
            console.error('❌ FileManager が見つかりません');
        }
    } catch (error) {
        console.error('❌ FileManager 初期化エラー:', error);
    }
}

// 音声システムの自動初期化
document.addEventListener('DOMContentLoaded', function() {
    // 🔧 統一状態管理システムの初期化（音声システム前に実行）
    setTimeout(async () => {
        console.log('🏗️ 統一状態管理システム初期化開始');
        try {
            await initializeUnifiedStateManager();
            console.log('✅ 統一状態管理システム初期化完了');
        } catch (error) {
            console.error('❌ 統一状態管理システム初期化エラー:', error);
        }
    }, 30);
    
    // 少し遅延させて他のシステムの初期化を待つ
    setTimeout(() => {
        console.log('🚀 音声システム自動初期化開始');
        const initialized = initializeVoiceSystem();
        if (initialized) {
            console.log('✅ 音声システム自動初期化完了');
        } else {
            console.error('❌ 音声システム自動初期化失敗');
        }
    }, 50);
    
    // AIManagerの初期化
    setTimeout(async () => {
        console.log('🤖 AIManager自動初期化開始');
        if (typeof initializeAIManager === 'function') {
            try {
                const initialized = await initializeAIManager();
                if (initialized) {
                    console.log('✅ AIManager自動初期化完了');
                } else {
                    console.error('❌ AIManager自動初期化失敗');
                }
            } catch (error) {
                console.error('❌ AIManager自動初期化エラー:', error);
            }
        } else {
            console.error('❌ initializeAIManager関数が見つかりません');
        }
    }, 100);
});

console.log('✅ 新音声システム・知見管理システムの関数をwindowオブジェクトに公開しました');

// =================================================================================
// CHROME専用デバッグ機能 - A/Bテスト・マイク許可最適化
// =================================================================================

// 🔧 Chrome専用: ブラウザ判定と最適化
function detectBrowserAndOptimize() {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edge');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');
    const isEdge = userAgent.includes('Edge');
    
    console.log('🔍 ブラウザ判定:');
    console.log(`  - Chrome: ${isChrome ? '✅' : '❌'}`);
    console.log(`  - Safari: ${isSafari ? '✅' : '❌'}`);
    console.log(`  - Firefox: ${isFirefox ? '✅' : '❌'}`);
    console.log(`  - Edge: ${isEdge ? '✅' : '❌'}`);
    
    // Chrome専用最適化の自動適用
    if (isChrome && window.CURRENT_MICROPHONE_STRATEGY !== MICROPHONE_STRATEGY.CONTINUOUS) {
        console.log('🎯 Chrome検出 - 継続的音声認識推奨（真の解決策）');
        console.log('💡 継続的音声認識に切り替えるには: switchMicrophoneStrategy("continuous")');
    }
    
    return {
        isChrome,
        isSafari,
        isFirefox,
        isEdge,
        userAgent,
        recommendation: isChrome ? 'continuous' : 'lightweight'
    };
}

// 🔧 A/Bテスト: 戦略切り替え関数（グローバル）
function switchMicrophoneStrategy(strategy) {
    const stateManager = window.AppState?.stateManager || window.stateManager;
    
    if (!stateManager) {
        console.error('❌ StateManagerが初期化されていません');
        return false;
    }
    
    const validStrategies = Object.values(MICROPHONE_STRATEGY);
    if (!validStrategies.includes(strategy)) {
        console.error(`❌ 無効な戦略: ${strategy}`);
        console.log(`💡 有効な戦略: ${validStrategies.join(', ')}`);
        return false;
    }
    
    const success = stateManager.switchStrategy(strategy);
    if (success) {
        console.log(`✅ 戦略切り替え成功: ${strategy}`);
        console.log('💡 効果を確認するには: debugMicrophonePermissionStats()');
    }
    
    return success;
}

// 🔧 A/Bテスト: 現在の戦略表示
function showCurrentStrategy() {
    const strategy = window.CURRENT_MICROPHONE_STRATEGY || 'unknown';
    const browserInfo = detectBrowserAndOptimize();
    
    console.log('🎯 現在のマイク許可戦略:');
    console.log(`  - 戦略: ${strategy}`);
    console.log(`  - ブラウザ: ${browserInfo.userAgent}`);
    console.log(`  - 推奨戦略: ${browserInfo.recommendation}`);
    
    if (strategy !== browserInfo.recommendation) {
        console.log(`💡 推奨戦略に切り替え: switchMicrophoneStrategy("${browserInfo.recommendation}")`);
    }
    
    return { strategy, browserInfo };
}

// 🔧 Chrome専用: 統計リセット機能
function resetMicrophoneStats() {
    const stateManager = window.AppState?.stateManager || window.stateManager;
    
    if (!stateManager?.recognitionManager) {
        console.error('❌ 音声認識システムが初期化されていません');
        return false;
    }
    
    const manager = stateManager.recognitionManager;
    
    // PersistentRecognitionManagerの場合
    if (manager.stats) {
        manager.stats.restartCount = 0;
        manager.stats.abortCount = 0;
        manager.stats.startTime = Date.now();
        manager.stats.lastRestartTime = 0;
        console.log('🔄 Chrome専用統計リセット完了');
    }
    // 従来のRecognitionManagerの場合
    else if (manager.microphonePermissionManager) {
        manager.microphonePermissionManager.completeBefore = 0;
        manager.microphonePermissionManager.lightweightCount = 0;
        manager.microphonePermissionManager.sessionStartTime = Date.now();
        console.log('🔄 軽量リスタート統計リセット完了');
    }
    
    console.log('✅ 統計リセット完了 - 新しいセッションを開始');
    return true;
}

// 🔧 新機能：簡単テスト用統計リセット
function quickResetStats() {
    console.log('🚀 クイック統計リセット開始');
    
    // 継続的音声認識の場合
    if (window.stateManager?.recognitionManager?.resetStats) {
        const success = window.stateManager.recognitionManager.resetStats();
        if (success) {
            console.log('🎯 継続的音声認識統計リセット完了');
            console.log('💡 現在のセッションは継続中 - 次の発話から新しい統計開始');
            console.log('📊 1-2回の短い発話で効果を確認してください');
            console.log('🔍 確認方法: debugMicrophonePermissionStats()');
            return true;
        }
    }
    
    // 従来の方法もサポート
    const legacySuccess = resetMicrophoneStats();
    if (legacySuccess) {
        console.log('🎯 従来統計リセット完了');
        return true;
    }
    
    console.log('❌ 統計リセット失敗');
    return false;
}

// 🔧 Chrome専用: 包括的デバッグ機能
function debugChromeOptimization() {
    console.log('🎯 Chrome専用マイク許可最適化デバッグ:');
    
    // ブラウザ判定
    const browserInfo = detectBrowserAndOptimize();
    console.log('');
    
    // 現在の戦略表示
    const strategyInfo = showCurrentStrategy();
    console.log('');
    
    // 統計情報表示
    const stats = debugMicrophonePermissionStats();
    console.log('');
    
    // 推奨事項
    console.log('🎯 最適化推奨事項:');
    if (browserInfo.isChrome && strategyInfo.strategy !== 'persistent') {
        console.log('  1. Chrome専用戦略に切り替え: switchMicrophoneStrategy("persistent")');
    }
    if (stats && stats.efficiency < 80) {
        console.log('  2. 統計をリセット: resetMicrophoneStats()');
        console.log('  3. ページを再読み込み');
    }
    if (browserInfo.isChrome && strategyInfo.strategy === 'persistent') {
        console.log('  ✅ 既にChrome専用戦略で最適化済み');
    }
    
    return {
        browser: browserInfo,
        strategy: strategyInfo,
        stats: stats
    };
}

// 🔧 Chrome専用: 自動最適化機能
function autoOptimizeChromeStrategy() {
    const browserInfo = detectBrowserAndOptimize();
    
    if (browserInfo.isChrome && window.CURRENT_MICROPHONE_STRATEGY !== MICROPHONE_STRATEGY.CONTINUOUS) {
        console.log('🎯 Chrome検出 - 継続的音声認識自動適用（真の解決策）');
        const success = switchMicrophoneStrategy('continuous');
        
        if (success) {
            console.log('✅ 継続的音声認識に自動切り替え完了');
            console.log('💡 効果を確認するには: debugMicrophonePermissionStats()');
            console.log('🎯 これでマイク許可アラートは完全に解消されます');
        }
        
        return success;
    }
    
    console.log('⚠️ Chrome以外のブラウザまたは既に最適化済み');
    return false;
}

// グローバル公開
window.detectBrowserAndOptimize = detectBrowserAndOptimize;
window.switchMicrophoneStrategy = switchMicrophoneStrategy;
window.showCurrentStrategy = showCurrentStrategy;
window.resetMicrophoneStats = resetMicrophoneStats;
window.quickResetStats = quickResetStats;
window.debugChromeOptimization = debugChromeOptimization;
window.autoOptimizeChromeStrategy = autoOptimizeChromeStrategy;

console.log('🎯 Chrome専用デバッグ機能を公開しました');
console.log('💡 Chrome最適化: autoOptimizeChromeStrategy() | 包括デバッグ: debugChromeOptimization()');
console.log('🚀 簡単テスト: quickResetStats() | 統計確認: debugMicrophonePermissionStats()');

// Chrome自動最適化
if (navigator.userAgent.includes('Chrome')) {
    console.log('🎯 Chrome検出 - 自動最適化を提案します');
    console.log('💡 自動最適化を実行するには: autoOptimizeChromeStrategy()');
}

// =================================================================================
// VoicePhase2Manager用の関数をグローバル公開
// =================================================================================

// 🔧 VoicePhase2Manager用の関数をグローバル公開
window.gptMessagesToCharacterResponse = gptMessagesToCharacterResponse;
window.ttsTextToAudioBlob = ttsTextToAudioBlob;
window.addMessageToChat = addMessageToChat;
window.playPreGeneratedAudio = playPreGeneratedAudio;

console.log('✅ VoicePhase2Manager依存関数をグローバル公開完了');

// =================================================================================
// 🧪 自動テスト・監視システム - ユーザーテスト負荷軽減
// =================================================================================








