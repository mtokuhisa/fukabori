// =================================================================================
// UI BASIC MANAGER - 基本UI更新管理システム
// =================================================================================
// 
// 🔧 リファクタリング Phase 3B: 基本UI更新関数の分離
// 分離元: app/script.js (200行)
// 分離先: app/ui-basic.js (新規作成)
// 
// 【分離対象関数】
// - updateSessionStatus() - セッション状況更新
// - updateKnowledgeDisplay() - 知見表示更新
// - updateTranscriptDisplay() - 音声認識結果表示更新
// - updateMicrophoneButton() - マイクボタン状態更新
// - updateSessionProgress() - セッション進捗更新
// - updateVoiceSettingsUI() - 音声設定UI更新
// - updateAdvancedSettingsDisplay() - 高度設定表示更新
// - update2StepUI() - 2段階認証UI更新
// - updateApiKeyStatusDisplay() - APIキー状態表示更新
// - updateVoiceCommandsDisplay() - 音声コマンド表示更新
// 
// =================================================================================

// 🔧 RIGHT PANE SESSION DISPLAY - 右ペインセッション状況表示機能
// Step 3.1: 既存UIManagerを使用した右ペインセッション状況表示の実装
// 内部管理v0.8.0.5

/**
 * 右ペインセッション状況表示の初期化
 */
function initializeRightPaneSessionDisplay() {
    const statusPanel = document.querySelector('.status-panel');
    if (!statusPanel) {
        console.warn('⚠️ 右ペイン(.status-panel)が見つかりません');
        return false;
    }
    
    // 既存のセッション状況セクションを確認
    const existingSessionStatus = document.getElementById('sessionStatus');
    if (existingSessionStatus) {
        console.log('✅ 既存のセッション状況セクションを拡張します');
        
        // 既存の要素に新しいIDを追加して機能を拡張
        const sessionState = document.getElementById('sessionState');
        const sessionPhase = document.getElementById('sessionPhase');
        const sessionDuration = document.getElementById('sessionDuration');
        const currentTheme = document.getElementById('currentTheme');
        
        // 既存の要素を右ペイン用の要素として活用
        if (sessionState) sessionState.id = 'rightPaneSystemStatus';
        if (sessionPhase) sessionPhase.id = 'rightPaneSessionPhase';
        if (sessionDuration) sessionDuration.id = 'rightPaneSessionDuration';
        if (currentTheme) currentTheme.id = 'rightPaneCurrentTheme';
        
        // 不足している要素を追加
        const sessionGrid = existingSessionStatus.querySelector('.session-info-grid');
        if (sessionGrid) {
            // 音声認識状態と知見数を追加
            const voiceStatusHTML = `
                <div class="session-item">
                    <span class="session-label">🎤 音声認識:</span>
                    <span class="session-value" id="rightPaneVoiceStatus">待機中</span>
                </div>
                <div class="session-item">
                    <span class="session-label">💡 知見数:</span>
                    <span class="session-value" id="rightPaneKnowledgeCount">0件</span>
                </div>
            `;
            sessionGrid.insertAdjacentHTML('beforeend', voiceStatusHTML);
        }
        
        // 既存の要素のIDを復元（重複ID問題を解決）
        if (sessionState) sessionState.id = 'sessionState';
        if (sessionPhase) sessionPhase.id = 'sessionPhase';
        if (sessionDuration) sessionDuration.id = 'sessionDuration';
        if (currentTheme) currentTheme.id = 'currentTheme';
        
        console.log('✅ 既存セッション状況セクションを拡張しました');
        return true;
    }
    
    // 既存のセッション状況がない場合は新規作成
    const sessionDisplayHTML = `
        <div class="status-section">
            <div class="status-title">📊 セッション状況</div>
            <div class="status-content" id="sessionStatus">
                <div class="session-info-grid">
                    <div class="session-item">
                        <span class="session-label">🎯 テーマ:</span>
                        <span class="session-value" id="rightPaneCurrentTheme">未設定</span>
                    </div>
                    <div class="session-item">
                        <span class="session-label">📈 進行状況:</span>
                        <span class="session-value" id="rightPaneSessionPhase">セットアップ</span>
                    </div>
                    <div class="session-item">
                        <span class="session-label">💡 知見数:</span>
                        <span class="session-value" id="rightPaneKnowledgeCount">0件</span>
                    </div>
                    <div class="session-item">
                        <span class="session-label">🎤 音声認識:</span>
                        <span class="session-value" id="rightPaneVoiceStatus">待機中</span>
                    </div>
                    <div class="session-item">
                        <span class="session-label">⏱️ 経過時間:</span>
                        <span class="session-value" id="rightPaneSessionDuration">00:00</span>
                    </div>
                    <div class="session-item">
                        <span class="session-label">🔄 システム状態:</span>
                        <span class="session-value" id="rightPaneSystemStatus">準備中</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 右ペインの適切な位置に挿入
    const knowledgeSettingsSection = statusPanel.querySelector('.status-section');
    if (knowledgeSettingsSection) {
        knowledgeSettingsSection.insertAdjacentHTML('beforebegin', sessionDisplayHTML);
    } else {
        statusPanel.insertAdjacentHTML('beforeend', sessionDisplayHTML);
    }
    
    console.log('✅ 右ペインセッション状況表示を初期化しました');
    return true;
}

/**
 * 右ペインセッション状況表示の切り替え
 */
function toggleRightPaneSessionDisplay() {
    const content = document.getElementById('sessionStatusContent');
    const toggle = document.querySelector('.session-status-toggle .toggle-icon');
    
    if (content && toggle) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        toggle.textContent = isHidden ? '▼' : '▲';
        console.log(`✅ 右ペインセッション表示を${isHidden ? '展開' : '折りたたみ'}しました`);
    }
}

/**
 * 右ペインセッション状況表示のスタイル注入
 */
function injectRightPaneSessionStyles() {
    const styleId = 'rightPaneSessionStyles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .session-status-display {
            background: var(--glass-bg, rgba(255, 255, 255, 0.9));
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
            margin-bottom: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .session-status-display:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .session-status-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
            color: white;
            font-weight: 600;
        }
        
        .session-status-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .session-status-toggle {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 5px;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .session-status-toggle:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .session-status-content {
            padding: 20px;
        }
        
        .session-info-grid {
            display: grid;
            gap: 15px;
        }
        
        .session-info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .session-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary, #666);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .session-value {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary, #333);
            padding: 8px 12px;
            background: var(--input-bg, #f8f9fa);
            border-radius: 8px;
            border: 1px solid var(--input-border, #e9ecef);
            transition: all 0.2s ease;
        }
        
        .session-value.active {
            background: var(--success-light, #d4edda);
            border-color: var(--success, #28a745);
            color: var(--success-dark, #155724);
        }
        
        .session-value.warning {
            background: var(--warning-light, #fff3cd);
            border-color: var(--warning, #ffc107);
            color: var(--warning-dark, #856404);
        }
        
        .session-value.error {
            background: var(--danger-light, #f8d7da);
            border-color: var(--danger, #dc3545);
            color: var(--danger-dark, #721c24);
        }
        
        /* レスポンシブ対応 */
        @media (max-width: 768px) {
            .session-status-display {
                margin-bottom: 15px;
            }
            
            .session-status-header {
                padding: 12px 15px;
            }
            
            .session-status-content {
                padding: 15px;
            }
            
            .session-info-grid {
                gap: 12px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * セッション状況とテーマ表示を更新
 */
function updateSessionStatus(status, theme) {
    const sessionStatus = window.UIManager.DOMUtils.get('sessionStatus');
    const currentTheme = window.UIManager.DOMUtils.get('currentTheme');
    const currentThemeFixed = window.UIManager.DOMUtils.get('currentThemeFixed');
    
    // 新しいセッション状況表示の更新
    updateDetailedSessionStatus(status, theme);
    
    // 🔧 右ペインセッション状況表示の更新
    updateRightPaneSessionDisplay(status, theme);
    
    if (sessionStatus) {
        sessionStatus.textContent = status;
        console.log(`✅ セッション状況更新: ${status}`);
    }
    
    const themeText = theme || '未設定';
    
    // 右ペインのテーマ表示（まだ存在する場合のみ）
    if (currentTheme) {
        currentTheme.textContent = themeText;
        console.log(`✅ 右ペインテーマ更新: ${theme}`);
    }
    
    // 中央ペインの固定テーマ表示
    if (currentThemeFixed) {
        currentThemeFixed.textContent = themeText;
        console.log(`✅ 中央ペインテーマ更新: ${theme}`);
    }
}

/**
 * 詳細なセッション状況表示を更新
 */
function updateDetailedSessionStatus(status, theme) {
    const sessionState = document.getElementById('sessionState');
    const sessionPhase = document.getElementById('sessionPhase');
    const sessionDuration = document.getElementById('sessionDuration');
    const currentTheme = document.getElementById('currentTheme');
    
    // 状態の更新
    if (sessionState) {
        sessionState.textContent = status || '準備中';
        sessionState.className = 'session-value';
        if (status === 'アクティブ' || status === '認識中') {
            sessionState.classList.add('active');
        } else if (status === '一時停止中') {
            sessionState.classList.add('warning');
        } else if (status === 'エラー') {
            sessionState.classList.add('error');
        }
    }
    
    // フェーズの更新
    if (sessionPhase) {
        const currentPhase = window.AppState?.sessionPhase || 'setup';
        const phaseNames = {
            'setup': 'セットアップ',
            'warmup': 'ウォームアップ',
            'deepdive': '深掘り',
            'summary': 'まとめ',
            'completed': '完了'
        };
        
        sessionPhase.textContent = phaseNames[currentPhase] || 'セットアップ';
        sessionPhase.className = 'session-value';
        if (currentPhase !== 'setup') {
            sessionPhase.classList.add('active');
        }
    }
    
    // 経過時間の更新
    if (sessionDuration) {
        const duration = calculateSessionDuration();
        sessionDuration.textContent = duration;
        sessionDuration.className = 'session-value';
        if (duration !== '00:00') {
            sessionDuration.classList.add('active');
        }
    }
    
    // テーマの更新
    if (currentTheme) {
        currentTheme.textContent = theme || '未設定';
        currentTheme.className = 'session-value';
        if (theme && theme !== '未設定') {
            currentTheme.classList.add('active');
        }
    }
}

/**
 * セッション経過時間を計算
 */
function calculateSessionDuration() {
    if (!window.AppState?.sessionStartTime) {
        return '00:00';
    }
    
    const startTime = new Date(window.AppState.sessionStartTime);
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000); // 秒
    
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 定期的にセッション状況を更新
setInterval(() => {
    if (window.AppState?.sessionActive) {
        updateDetailedSessionStatus();
    }
}, 1000);

/**
 * 知見表示を更新
 */
function updateKnowledgeDisplay() {
    const extractedKnowledge = window.UIManager.DOMUtils.get('extractedKnowledge');
    
    if (extractedKnowledge) {
        if (AppState.extractedKnowledge.length === 0) {
            extractedKnowledge.innerHTML = '<div style="padding: 10px; color: #666; font-size: 12px; text-align: center;">まだありません</div>';
        } else {
            const knowledgeHtml = AppState.extractedKnowledge.map((knowledge, index) => {
                // 要約を2行表示用に調整（最大40文字）
                const shortSummary = knowledge.summary.length > 40 ? 
                    knowledge.summary.substring(0, 40) + '...' : 
                    knowledge.summary;
                
                return `<div style="padding: 8px 10px; margin-bottom: 6px; background: rgba(255, 255, 255, 0.15); border-radius: 8px; font-size: 11px;">
                    <div style="font-weight: 600; color: #06b6d4; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        💡 ${shortSummary}
                    </div>
                </div>`;
            }).join('');
            extractedKnowledge.innerHTML = knowledgeHtml;
        }
        console.log(`✅ 知見表示更新: ${AppState.extractedKnowledge.length}件`);
    }
    
    // セッション進行状況も更新
    window.updateSessionProgress();
}

/**
 * 音声認識結果表示を更新
 */
function updateTranscriptDisplay() {
    const transcriptArea = window.UIManager.DOMUtils.get('transcriptArea');
    const microphoneButton = window.UIManager.DOMUtils.get('microphoneButton');
    
    if (transcriptArea) {
        let displayText = '';
        
        if (AppState.currentSpeaker !== SPEAKERS.NULL) {
            displayText = `🎤 ${AppState.currentSpeaker}が話しています...`;
        } else if (AppState.finalTranscript) {
            displayText = `💬 ${AppState.finalTranscript}`;
        } else if (AppState.interimTranscript) {
            displayText = `📝 ${AppState.interimTranscript}`;
        } else {
            displayText = '🎙️ 音声認識待機中...';
        }
        
        transcriptArea.textContent = displayText;
        console.log(`✅ 音声認識表示更新: ${displayText.substring(0, 30)}...`);
    }
}

/**
 * マイクボタンの状態を更新
 */
function updateMicrophoneButton() {
    const microphoneButton = window.UIManager.DOMUtils.get('microphoneButton');
    const microphoneIcon = window.UIManager.DOMUtils.get('microphoneIcon');
    
    if (microphoneButton && microphoneIcon) {
        const isRecording = AppState.voiceRecognitionState.isRecording;
        
        if (isRecording) {
            microphoneButton.classList.add('recording');
            microphoneIcon.textContent = '🔴';
            microphoneButton.title = 'クリックして録音を停止';
        } else {
            microphoneButton.classList.remove('recording');
            microphoneIcon.textContent = '🎤';
            microphoneButton.title = 'クリックして録音を開始';
        }
        
        console.log(`✅ マイクボタン更新: ${isRecording ? '録音中' : '待機中'}`);
    }
}

/**
 * セッション進捗を更新
 */
function updateSessionProgress() {
    const sessionProgress = window.UIManager.DOMUtils.get('sessionProgress');
    const progressBar = window.UIManager.DOMUtils.get('progressBar');
    
    if (sessionProgress && progressBar) {
        const totalSteps = 3; // ウォームアップ、深掘り、まとめ
        let currentStep = 0;
        
        if (AppState.sessionPhase === 'warmup') currentStep = 1;
        else if (AppState.sessionPhase === 'deepdive') currentStep = 2;
        else if (AppState.sessionPhase === 'summary') currentStep = 3;
        
        const progressPercent = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        const phaseText = {
            'warmup': 'ウォームアップ',
            'deepdive': '深掘り',
            'summary': 'まとめ'
        }[AppState.sessionPhase] || '待機中';
        
        sessionProgress.textContent = `${phaseText} (${currentStep}/${totalSteps})`;
        console.log(`✅ セッション進捗更新: ${phaseText} ${progressPercent}%`);
    }
}

// 注意: updateVoiceSettingsUI, updateAdvancedSettingsDisplay, update2StepUIは
// script.jsに移動済みのため、ここでは削除済み

/**
 * APIキー状態表示を更新
 */
function updateApiKeyStatusDisplay() {
    const apiKeyStatus = window.UIManager.DOMUtils.get('apiKeyStatus');
    const apiKeyIndicator = window.UIManager.DOMUtils.get('apiKeyIndicator');
    
    if (apiKeyStatus) {
        const hasApiKey = !!AppState.apiKey;
        apiKeyStatus.textContent = hasApiKey ? '✅ 設定済み' : '⚠️ 未設定';
        apiKeyStatus.className = hasApiKey ? 'status-success' : 'status-warning';
        
        if (apiKeyIndicator) {
            apiKeyIndicator.style.backgroundColor = hasApiKey ? '#10b981' : '#f59e0b';
        }
        
        console.log(`✅ APIキー状態表示更新: ${hasApiKey ? '設定済み' : '未設定'}`);
    }
}

/**
 * 音声コマンド表示を更新
 */
function updateVoiceCommandsDisplay() {
    const voiceCommandsList = window.UIManager.DOMUtils.get('voiceCommandsList');
    
    if (voiceCommandsList) {
        const commands = [
            { command: '「終了」', description: 'セッションを終了' },
            { command: '「停止」', description: '音声再生を停止' },
            { command: '「テーマ変更」', description: 'テーマを変更' },
            { command: '「質問変更」', description: '質問を変更' },
            { command: '「設定確認」', description: '現在の設定を確認' }
        ];
        
        const commandsHtml = commands.map(cmd => 
            `<div class="voice-command-item">
                <span class="command">${cmd.command}</span>
                <span class="description">${cmd.description}</span>
            </div>`
        ).join('');
        
        voiceCommandsList.innerHTML = commandsHtml;
        console.log('✅ 音声コマンド表示更新完了');
    }
}

/**
 * 右ペインセッション状況表示の更新
 */
function updateRightPaneSessionDisplay(status, theme) {
    // 既存のHTML要素を使用
    const rightPaneTheme = document.getElementById('currentTheme');
    const rightPanePhase = document.getElementById('sessionPhase');
    const rightPaneKnowledgeCount = document.getElementById('rightPaneKnowledgeCount');
    const rightPaneVoiceStatus = document.getElementById('rightPaneVoiceStatus');
    const rightPaneDuration = document.getElementById('sessionDuration');
    const rightPaneSystemStatus = document.getElementById('sessionState');
    
    // テーマの更新
    if (rightPaneTheme) {
        const themeText = theme || '未設定';
        rightPaneTheme.textContent = themeText;
        rightPaneTheme.className = 'session-value';
        if (theme) {
            rightPaneTheme.classList.add('active');
        }
    }
    
    // フェーズの更新
    if (rightPanePhase) {
        const currentPhase = window.AppState?.sessionPhase || 'setup';
        const phaseNames = {
            'setup': 'セットアップ',
            'warmup': 'ウォームアップ',
            'deepdive': '深掘り',
            'summary': 'まとめ',
            'completed': '完了'
        };
        
        rightPanePhase.textContent = phaseNames[currentPhase] || 'セットアップ';
        rightPanePhase.className = 'session-value';
        if (currentPhase !== 'setup') {
            rightPanePhase.classList.add('active');
        }
    }
    
    // 知見数の更新
    if (rightPaneKnowledgeCount) {
        const knowledgeCount = window.AppState?.knowledgeItems?.length || 0;
        rightPaneKnowledgeCount.textContent = `${knowledgeCount}件`;
        rightPaneKnowledgeCount.className = 'session-value';
        if (knowledgeCount > 0) {
            rightPaneKnowledgeCount.classList.add('active');
        }
    }
    
    // 音声認識状態の更新
    if (rightPaneVoiceStatus) {
        const voiceStatus = getVoiceRecognitionStatus();
        rightPaneVoiceStatus.textContent = voiceStatus;
        rightPaneVoiceStatus.className = 'session-value';
        if (voiceStatus === '認識中' || voiceStatus === 'アクティブ') {
            rightPaneVoiceStatus.classList.add('active');
        } else if (voiceStatus === '一時停止中') {
            rightPaneVoiceStatus.classList.add('warning');
        } else if (voiceStatus === 'エラー') {
            rightPaneVoiceStatus.classList.add('error');
        }
    }
    
    // 経過時間の更新
    if (rightPaneDuration) {
        const duration = calculateSessionDuration();
        rightPaneDuration.textContent = duration;
        rightPaneDuration.className = 'session-value';
        if (duration !== '00:00') {
            rightPaneDuration.classList.add('active');
        }
    }
    
    // システム状態の更新
    if (rightPaneSystemStatus) {
        rightPaneSystemStatus.textContent = status || '準備中';
        rightPaneSystemStatus.className = 'session-value';
        if (status === 'アクティブ' || status === '認識中') {
            rightPaneSystemStatus.classList.add('active');
        } else if (status === '一時停止中') {
            rightPaneSystemStatus.classList.add('warning');
        } else if (status === 'エラー') {
            rightPaneSystemStatus.classList.add('error');
        }
    }
}

/**
 * 音声認識状態の取得
 */
function getVoiceRecognitionStatus() {
    try {
        if (window.unifiedStateManager) {
            const voiceModule = window.unifiedStateManager.getModule('voice');
            if (voiceModule) {
                const state = voiceModule.getState();
                if (state.isRecognizing) return '認識中';
                if (state.isListening) return 'アクティブ';
                if (state.isPaused) return '一時停止中';
                if (state.hasError) return 'エラー';
            }
        }
        
        // VoiceUIManagerからの状態取得
        if (window.voiceUIManager && window.voiceUIManager.isUserPausedManually) {
            if (window.voiceUIManager.isUserPausedManually()) {
                return '一時停止中';
            }
        }
        
        return '待機中';
    } catch (error) {
        console.warn('⚠️ 音声認識状態の取得に失敗:', error);
        return '不明';
    }
}

/**
 * 右ペインセッション状況表示の自動更新を開始
 */
function startRightPaneSessionDisplayUpdates() {
    // 既存の更新間隔があれば停止
    if (window.rightPaneUpdateInterval) {
        clearInterval(window.rightPaneUpdateInterval);
    }
    
    // 5秒間隔で更新
    window.rightPaneUpdateInterval = setInterval(() => {
        const currentStatus = window.AppState?.sessionStatus || '準備中';
        const currentTheme = window.AppState?.currentTheme || null;
        updateRightPaneSessionDisplay(currentStatus, currentTheme);
    }, 5000);
    
    console.log('✅ 右ペインセッション状況表示の自動更新を開始しました');
}

/**
 * 右ペインセッション状況表示の自動更新を停止
 */
function stopRightPaneSessionDisplayUpdates() {
    if (window.rightPaneUpdateInterval) {
        clearInterval(window.rightPaneUpdateInterval);
        window.rightPaneUpdateInterval = null;
        console.log('✅ 右ペインセッション状況表示の自動更新を停止しました');
    }
}

// グローバル関数として公開
window.initializeRightPaneSessionDisplay = initializeRightPaneSessionDisplay;
window.toggleRightPaneSessionDisplay = toggleRightPaneSessionDisplay;
window.updateRightPaneSessionDisplay = updateRightPaneSessionDisplay;
window.startRightPaneSessionDisplayUpdates = startRightPaneSessionDisplayUpdates;
window.stopRightPaneSessionDisplayUpdates = stopRightPaneSessionDisplayUpdates;

// =================================================================================
// UI BASIC OBJECT - UIBasicオブジェクト
// =================================================================================

const UIBasic = {
    // セッション関連
    session: {
        updateStatus: updateSessionStatus,
        updateProgress: updateSessionProgress
        // update2StepUIはscript.jsに移動済み
    },
    
    // 表示更新関連
    display: {
        updateKnowledge: updateKnowledgeDisplay,
        updateTranscript: updateTranscriptDisplay,
        updateMicrophone: updateMicrophoneButton,
        updateApiKeyStatus: updateApiKeyStatusDisplay,
        updateVoiceCommands: updateVoiceCommandsDisplay
    },
    
    // 設定関連（script.jsに移動済み）
    settings: {
        // updateVoiceSettings, updateAdvancedSettingsはscript.jsに移動
    }
};

// =================================================================================
// WINDOW EXPORTS - Window経由での公開
// =================================================================================

// 個別関数の公開
window.updateSessionStatus = updateSessionStatus;
window.updateKnowledgeDisplay = updateKnowledgeDisplay;
window.updateTranscriptDisplay = updateTranscriptDisplay;
window.updateMicrophoneButton = updateMicrophoneButton;
window.updateSessionProgress = updateSessionProgress;
// updateVoiceSettingsUI, updateAdvancedSettingsDisplay, update2StepUIはscript.jsに移動済み
window.updateApiKeyStatusDisplay = updateApiKeyStatusDisplay;
window.updateVoiceCommandsDisplay = updateVoiceCommandsDisplay;

// UIBasicオブジェクトの公開
window.UIBasic = UIBasic;

console.log('✅ UIBasic読み込み完了 - 基本UI更新管理システム');
console.log('📦 UIBasic: 7個の関数とUIBasicオブジェクトをwindow経由で公開（3個はscript.jsに移動済み）'); 