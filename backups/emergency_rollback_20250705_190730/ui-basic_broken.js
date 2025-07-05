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

/**
 * セッション状況とテーマ表示を更新
 */
function updateSessionStatus(status, theme) {
    const sessionStatus = window.UIManager.DOMUtils.get('sessionStatus');
    const currentTheme = window.UIManager.DOMUtils.get('currentTheme');
    const currentThemeFixed = window.UIManager.DOMUtils.get('currentThemeFixed');
    
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

/**
 * 音声設定UIを更新
 */
function updateVoiceSettingsUI() {
    if (typeof window.AI_PROMPTS === 'undefined' || !window.AI_PROMPTS.VOICE_SETTINGS) {
        console.log('⚠️ 音声設定データが読み込まれていません');
        return;
    }
    
    const voiceSettings = window.AI_PROMPTS.VOICE_SETTINGS;
    
    // ねほりーの設定
    const nehoriVoiceSelect = window.UIManager.DOMUtils.get('nehoriVoiceSelect');
    const nehoriSpeedSlider = window.UIManager.DOMUtils.get('nehoriSpeedSlider');
    const nehoriPitchSlider = window.UIManager.DOMUtils.get('nehoriPitchSlider');
    
    if (nehoriVoiceSelect && voiceSettings.nehori) {
        nehoriVoiceSelect.value = voiceSettings.nehori.voice || 'ja-JP-NanamiNeural';
        if (nehoriSpeedSlider) nehoriSpeedSlider.value = voiceSettings.nehori.speed || 1.0;
        if (nehoriPitchSlider) nehoriPitchSlider.value = voiceSettings.nehori.pitch || 1.0;
    }
    
    // はほりーの設定
    const hahoriVoiceSelect = window.UIManager.DOMUtils.get('hahoriVoiceSelect');
    const hahoriSpeedSlider = window.UIManager.DOMUtils.get('hahoriSpeedSlider');
    const hahoriPitchSlider = window.UIManager.DOMUtils.get('hahoriPitchSlider');
    
    if (hahoriVoiceSelect && voiceSettings.hahori) {
        hahoriVoiceSelect.value = voiceSettings.hahori.voice || 'ja-JP-KeitaNeural';
        if (hahoriSpeedSlider) hahoriSpeedSlider.value = voiceSettings.hahori.speed || 1.0;
        if (hahoriPitchSlider) hahoriPitchSlider.value = voiceSettings.hahori.pitch || 1.0;
    }
    
    console.log('✅ 音声設定UI更新完了');
}

/**
 * 高度設定表示を更新
 */
function updateAdvancedSettingsDisplay() {
    const advancedSettings = window.UIManager.DOMUtils.get('advancedSettings');
    
    if (advancedSettings) {
        // 現在の設定値を表示に反映
        const currentTheme = localStorage.getItem('fukabori_theme') || 'modern';
        const themeSelect = window.UIManager.DOMUtils.get('themeSelect');
        if (themeSelect) {
            themeSelect.value = currentTheme;
        }
        
        // 音声設定の表示更新
        window.updateVoiceSettingsUI();
        
        console.log('✅ 高度設定表示更新完了');
    }
}

/**
 * 2段階認証UIを更新
 */
function update2StepUI() {
    const step1Status = window.UIManager.DOMUtils.get('step1Status');
    const step2Status = window.UIManager.DOMUtils.get('step2Status');
    const sessionStartButton = window.UIManager.DOMUtils.get('sessionStartButton');
    
    // Step1: APIキー設定状況
    const hasApiKey = !!AppState.apiKey;
    if (step1Status) {
        step1Status.textContent = hasApiKey ? '✅ 完了' : '⚠️ 未設定';
        step1Status.className = hasApiKey ? 'status-complete' : 'status-incomplete';
    }
    
    // Step2: テーマ設定状況
    const hasTheme = !!AppState.currentTheme;
    if (step2Status) {
        step2Status.textContent = hasTheme ? '✅ 完了' : '⚠️ 未設定';
        step2Status.className = hasTheme ? 'status-complete' : 'status-incomplete';
    }
    
    // セッション開始ボタンの状態
    const allComplete = hasApiKey && hasTheme;
    if (sessionStartButton) {
        sessionStartButton.disabled = !allComplete;
        sessionStartButton.textContent = allComplete ? 'セッションを開始' : '設定を完了してください';
    }
    
    console.log(`✅ 2段階UI更新: API=${hasApiKey ? '完了' : '未設定'}, テーマ=${hasTheme ? '完了' : '未設定'}`);
}

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

// =================================================================================
// UI BASIC OBJECT - UIBasicオブジェクト
// =================================================================================

const UIBasic = {
    // セッション関連
    session: {
        updateStatus: updateSessionStatus,
        updateProgress: updateSessionProgress,
        update2Step: update2StepUI
    },
    
    // 表示更新関連
    display: {
        updateKnowledge: updateKnowledgeDisplay,
        updateTranscript: updateTranscriptDisplay,
        updateMicrophone: updateMicrophoneButton,
        updateApiKeyStatus: updateApiKeyStatusDisplay,
        updateVoiceCommands: updateVoiceCommandsDisplay
    },
    
    // 設定関連
    settings: {
        updateVoiceSettings: updateVoiceSettingsUI,
        updateAdvancedSettings: updateAdvancedSettingsDisplay
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
window.updateVoiceSettingsUI = updateVoiceSettingsUI;
window.updateAdvancedSettingsDisplay = updateAdvancedSettingsDisplay;
window.update2StepUI = update2StepUI;
window.updateApiKeyStatusDisplay = updateApiKeyStatusDisplay;
window.updateVoiceCommandsDisplay = updateVoiceCommandsDisplay;

// UIBasicオブジェクトの公開
window.UIBasic = UIBasic;

console.log('✅ UIBasic読み込み完了 - 基本UI更新管理システム');
console.log('📦 UIBasic: 10個の関数とUIBasicオブジェクトをwindow経由で公開'); 