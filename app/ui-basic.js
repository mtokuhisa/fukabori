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
// 🎨 NEW FEATURES - 新機能追加
// - updateVoiceStateDisplay() - 音声状態表示更新
// - updateRealtimeTranscript() - リアルタイム音声認識更新
// 
// =================================================================================

// 🔧 RIGHT PANE SESSION DISPLAY - 右ペインセッション状況表示機能
// Step 3.1: 既存UIManagerを使用した右ペインセッション状況表示の実装
// 内部管理v0.8.0.5

/**
 * 右ペインセッション状況表示の初期化
 * 既存のセッション状況表示の値を動的に更新するだけ（デザイン変更なし）
 */
function initializeRightPaneSessionDisplay() {
    const statusPanel = document.querySelector('.status-panel');
    if (!statusPanel) {
        console.warn('⚠️ 右ペイン(.status-panel)が見つかりません');
        return false;
    }
    
    // 既存のセッション状況表示要素を確認
    const existingSessionState = document.getElementById('sessionState');
    const existingSessionPhase = document.getElementById('sessionPhase');
    const existingSessionDuration = document.getElementById('sessionDuration');
    const existingCurrentTheme = document.getElementById('currentTheme');
    
    // デバッグ情報を追加
    console.log('🔍 セッション状況表示要素チェック:', {
        sessionState: !!existingSessionState,
        sessionPhase: !!existingSessionPhase,
        sessionDuration: !!existingSessionDuration,
        currentTheme: !!existingCurrentTheme
    });
    
    if (existingSessionState && existingSessionPhase && existingSessionDuration && existingCurrentTheme) {
        console.log('✅ 既存のセッション状況表示要素を発見しました');
        
        // 既存の要素をマッピング（要素追加なし）
        window.rightPaneElements = {
            sessionState: existingSessionState,
            sessionPhase: existingSessionPhase,
            sessionDuration: existingSessionDuration,
            currentTheme: existingCurrentTheme
        };
        
        console.log('✅ 右ペインセッション状況表示を初期化しました（既存要素のみ使用）');
        return true;
    } else {
        console.warn('⚠️ 既存のセッション状況表示要素が見つかりません');
        console.log('💡 見つからない要素:', {
            sessionState: !existingSessionState,
            sessionPhase: !existingSessionPhase,
            sessionDuration: !existingSessionDuration,
            currentTheme: !existingCurrentTheme
        });
        
        // エラーハンドリング: 部分的な初期化
        window.rightPaneElements = {
            sessionState: existingSessionState,
            sessionPhase: existingSessionPhase,
            sessionDuration: existingSessionDuration,
            currentTheme: existingCurrentTheme
        };
        
        return false;
    }
}

/**
 * 右ペインセッション状況表示の切り替え
 * 既存のセッション状況表示の切り替え機能
 */
function toggleRightPaneSessionDisplay() {
    const sessionStatusSection = document.querySelector('.status-section');
    if (sessionStatusSection) {
        const content = sessionStatusSection.querySelector('.status-content');
        if (content) {
            const isHidden = content.style.display === 'none';
            content.style.display = isHidden ? 'block' : 'none';
            console.log(`✅ 右ペインセッション表示を${isHidden ? '展開' : '折りたたみ'}しました`);
        }
    }
}

/**
 * 右ペインセッション状況表示のスタイル注入
 * 削除済み - 既存デザインを維持
 */
function injectRightPaneSessionStyles() {
    // 既存デザインを維持するため何もしない
    console.log('✅ 右ペインセッション状況表示のスタイル注入をスキップ（既存デザイン維持）');
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
    const transcriptDisplay = window.UIManager.DOMUtils.get('transcriptDisplay');
    const microphoneButton = window.UIManager.DOMUtils.get('microphoneButton');
    
    // 表示テキストを決定
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
    
    // 既存のtranscriptArea更新
    if (transcriptArea) {
        transcriptArea.textContent = displayText;
    }
    
    // 新しいtranscriptDisplay更新（Step 2で追加）
    if (transcriptDisplay) {
        transcriptDisplay.textContent = displayText;
        
        // 🎯 自動スクロール機能
        const transcriptPanel = window.UIManager.DOMUtils.get('transcriptPanel');
        if (transcriptPanel) {
            transcriptPanel.scrollTop = transcriptPanel.scrollHeight;
        }
    }
    
    console.log(`✅ 音声認識表示更新: ${displayText.substring(0, 30)}...`);
}

/**
 * 🎯 Step 2: 長いユーザー発言のテスト用関数
 */
function testLongUtteranceDisplay() {
    const transcriptDisplay = window.UIManager.DOMUtils.get('transcriptDisplay');
    const transcriptPanel = window.UIManager.DOMUtils.get('transcriptPanel');
    
    if (!transcriptDisplay || !transcriptPanel) {
        console.error('❌ transcript-display要素が見つかりません');
        return;
    }
    
    // 長い発言のテスト
    const longText = `📝 これは非常に長いユーザー発言のテストです。音声認識システムが長い発言を適切に処理できるかをテストしています。スクロール機能が正常に動作するかを確認します。`.repeat(10);
    
    transcriptDisplay.textContent = longText;
    
    // 自動スクロール実行
    transcriptPanel.scrollTop = transcriptPanel.scrollHeight;
    
    console.log('✅ 長いユーザー発言テスト完了');
    console.log(`📏 テキスト長: ${longText.length}文字`);
    console.log(`📜 スクロール位置: ${transcriptPanel.scrollTop}px`);
}

// グローバルエクスポート
window.testLongUtteranceDisplay = testLongUtteranceDisplay;

/**
 * 🎯 Step 2: 既存システムとの共存確認テスト
 */
function testCoexistenceVerification() {
    const transcriptDisplay = window.UIManager.DOMUtils.get('transcriptDisplay');
    const transcriptPanel = window.UIManager.DOMUtils.get('transcriptPanel');
    const transcriptCompact = window.UIManager.DOMUtils.get('transcriptCompact');
    const transcriptArea = window.UIManager.DOMUtils.get('transcriptArea');
    
    console.log('🔍 Step 2 共存確認テスト開始');
    
    // 新システムチェック
    if (transcriptDisplay && transcriptPanel) {
        console.log('✅ 新システム (transcript-display): 利用可能');
        console.log(`📏 Panel表示状態: ${transcriptPanel.style.display || 'visible'}`);
        console.log(`📝 Display内容: ${transcriptDisplay.textContent.substring(0, 30)}...`);
    } else {
        console.error('❌ 新システム (transcript-display): 利用不可');
    }
    
    // 既存システムチェック
    if (transcriptCompact) {
        console.log('✅ 既存システム (transcript-compact): 利用可能');
        console.log(`📝 Compact内容: ${transcriptCompact.textContent.substring(0, 30)}...`);
    } else {
        console.log('⚠️ 既存システム (transcript-compact): 見つかりません');
    }
    
    if (transcriptArea) {
        console.log('✅ 既存システム (transcript-area): 利用可能');
        console.log(`📝 Area内容: ${transcriptArea.textContent.substring(0, 30)}...`);
    } else {
        console.log('⚠️ 既存システム (transcript-area): 見つかりません');
    }
    
    // テスト更新実行
    console.log('🔄 updateTranscriptDisplay()を実行してテスト');
    updateTranscriptDisplay();
    
    console.log('🎯 Step 2 共存確認テスト完了');
}

// グローバルエクスポート
window.testCoexistenceVerification = testCoexistenceVerification;

/**
 * 🎯 Step 2: 包括的統合テスト（開発者用）
 */
function runStep2ComprehensiveTest() {
    console.log('🧪 ===== Step 2 包括的統合テスト開始 =====');
    
    // 1. HTML構造確認
    console.log('\n1️⃣ HTML構造確認');
    const transcriptDisplay = document.getElementById('transcriptDisplay');
    const transcriptPanel = document.getElementById('transcriptPanel');
    const transcriptCompact = document.getElementById('transcriptCompact');
    
    console.log(`✅ transcriptDisplay: ${transcriptDisplay ? '存在' : '❌ 不存在'}`);
    console.log(`✅ transcriptPanel: ${transcriptPanel ? '存在' : '❌ 不存在'}`);
    console.log(`✅ transcriptCompact: ${transcriptCompact ? '存在' : '❌ 不存在'}`);
    
    // 2. CSS表示確認
    console.log('\n2️⃣ CSS表示確認');
    if (transcriptPanel) {
        const style = window.getComputedStyle(transcriptPanel);
        console.log(`📏 position: ${style.position}`);
        console.log(`📏 display: ${style.display}`);
        console.log(`📏 bottom: ${style.bottom}`);
        console.log(`📏 max-height: ${style.maxHeight}`);
        console.log(`📏 overflow-y: ${style.overflowY}`);
    }
    
    // 3. JavaScript機能確認
    console.log('\n3️⃣ JavaScript機能確認');
    console.log('🔄 updateTranscriptDisplay()テスト実行中...');
    updateTranscriptDisplay();
    
    // 4. 長いテキストテスト
    console.log('\n4️⃣ 長いテキストテスト');
    testLongUtteranceDisplay();
    
    // 5. 共存確認テスト
    console.log('\n5️⃣ 共存確認テスト');
    testCoexistenceVerification();
    
    // 6. 緊急機能確認
    console.log('\n6️⃣ 緊急機能確認');
    console.log(`🚨 emergencyRollback: ${typeof window.emergencyRollback === 'function' ? '利用可能' : '❌ 不可'}`);
    console.log(`🔄 switchToNewTranscript: ${typeof window.switchToNewTranscript === 'function' ? '利用可能' : '❌ 不可'}`);
    
    console.log('\n🎯 ===== Step 2 包括的統合テスト完了 =====');
    console.log('✅ 新しいtranscript-displayシステムが有効化されました！');
    console.log('📝 テスト方法: 音声認識を開始して、新しいパネルの動作を確認してください。');
}

// グローバルエクスポート
window.runStep2ComprehensiveTest = runStep2ComprehensiveTest;

/**
 * 🎯 transcript-panel 表示強制テスト
 */
function forceShowTranscriptPanel() {
    const transcriptPanel = document.getElementById('transcriptPanel');
    const transcriptDisplay = document.getElementById('transcriptDisplay');
    
    console.log('🔄 transcript-panel 表示強制テスト開始');
    
    if (!transcriptPanel) {
        console.error('❌ transcript-panel 要素が見つかりません');
        return;
    }
    
    if (!transcriptDisplay) {
        console.error('❌ transcript-display 要素が見つかりません');
        return;
    }
    
    // 強制的に表示
    transcriptPanel.classList.remove('hidden');
    transcriptPanel.style.display = 'block';
    transcriptPanel.style.visibility = 'visible';
    transcriptPanel.style.opacity = '1';
    
    // テスト用テキストを設定
    transcriptDisplay.textContent = '🎯 transcript-panel 表示テスト中... 新しいパネルが正常に表示されています！';
    
    console.log('✅ transcript-panel を強制表示しました');
    console.log('📏 Panel位置:', transcriptPanel.getBoundingClientRect());
    console.log('🎨 Panel表示状態:', {
        display: transcriptPanel.style.display,
        visibility: transcriptPanel.style.visibility,
        opacity: transcriptPanel.style.opacity,
        classList: Array.from(transcriptPanel.classList)
    });
}

// グローバルエクスポート
window.forceShowTranscriptPanel = forceShowTranscriptPanel;

/**
 * 🎯 キャラクターアバターグラデーション効果テスト
 */
function testCharacterAvatarGradients() {
    console.log('🧪 キャラクターアバターグラデーション効果テスト開始');
    
    const nehoriAvatar = document.getElementById('nehoriAvatar');
    const hahoriAvatar = document.getElementById('hahoriAvatar');
    
    if (!nehoriAvatar) {
        console.error('❌ nehoriAvatar 要素が見つかりません');
        return;
    }
    
    if (!hahoriAvatar) {
        console.error('❌ hahoriAvatar 要素が見つかりません');
        return;
    }
    
    console.log('✅ 両方のアバター要素を確認しました');
    
    // テスト1: ねほりーのグラデーション
    console.log('🔄 テスト1: ねほりーのグラデーション効果');
    nehoriAvatar.classList.add('speaking');
    hahoriAvatar.classList.remove('speaking');
    
    setTimeout(() => {
        // テスト2: はほりーのグラデーション
        console.log('🔄 テスト2: はほりーのグラデーション効果');
        nehoriAvatar.classList.remove('speaking');
        hahoriAvatar.classList.add('speaking');
        
        setTimeout(() => {
            // テスト3: 両方のグラデーション解除
            console.log('🔄 テスト3: 両方のグラデーション解除');
            nehoriAvatar.classList.remove('speaking');
            hahoriAvatar.classList.remove('speaking');
            
            console.log('✅ キャラクターアバターグラデーション効果テスト完了');
        }, 2000);
    }, 2000);
}

// グローバルエクスポート
window.testCharacterAvatarGradients = testCharacterAvatarGradients;

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
 * 既存の要素の値のみを更新（デザイン変更なし）
 */
function updateRightPaneSessionDisplay(status, theme) {
    // 既存の要素を取得
    const elements = window.rightPaneElements;
    if (!elements) {
        console.warn('⚠️ 右ペインセッション状況表示要素が初期化されていません');
        // 緊急初期化を試行
        if (initializeRightPaneSessionDisplay()) {
            console.log('✅ 緊急初期化が成功しました');
        } else {
            console.log('❌ 緊急初期化も失敗しました');
            return;
        }
    }
    
    // テーマの更新
    if (elements.currentTheme) {
        const themeText = theme || '未設定';
        elements.currentTheme.textContent = themeText;
        elements.currentTheme.className = 'session-value';
        if (theme) {
            elements.currentTheme.classList.add('active');
        }
    }
    
    // 状態の更新
    if (elements.sessionState) {
        elements.sessionState.textContent = status || '準備中';
        elements.sessionState.className = 'session-value';
        if (status === 'アクティブ' || status === '認識中') {
            elements.sessionState.classList.add('active');
        } else if (status === '一時停止中') {
            elements.sessionState.classList.add('warning');
        } else if (status === 'エラー') {
            elements.sessionState.classList.add('error');
        }
    }
    
    // フェーズの更新
    if (elements.sessionPhase) {
        const currentPhase = window.AppState?.sessionPhase || 'setup';
        const phaseNames = {
            'setup': 'セットアップ',
            'warmup': 'ウォームアップ',
            'deepdive': '深掘り',
            'summary': 'まとめ',
            'completed': '完了'
        };
        
        elements.sessionPhase.textContent = phaseNames[currentPhase] || 'セットアップ';
        elements.sessionPhase.className = 'session-value';
        if (currentPhase !== 'setup') {
            elements.sessionPhase.classList.add('active');
        }
    }
    
    // 経過時間の更新
    if (elements.sessionDuration) {
        const duration = calculateSessionDuration();
        elements.sessionDuration.textContent = duration;
        elements.sessionDuration.className = 'session-value';
        if (duration !== '00:00') {
            elements.sessionDuration.classList.add('active');
        }
    }
    
    console.log('✅ 右ペインセッション状況表示を更新しました:', {
        status: status,
        theme: theme,
        phase: window.AppState?.sessionPhase
    });
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
    
    // 5秒間隔で更新（控えめに）
    window.rightPaneUpdateInterval = setInterval(() => {
        if (window.rightPaneElements) {
            const currentStatus = window.AppState?.sessionStatus || '準備中';
            const currentTheme = window.AppState?.currentTheme || null;
            updateRightPaneSessionDisplay(currentStatus, currentTheme);
        }
    }, 5000);
    
    console.log('✅ 右ペインセッション状況表示の自動更新を開始しました（5秒間隔）');
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
    },
    
    // 🎨 新デザイン要件: 右パネル背景変化管理
    rightPanel: {
        initializeBackgroundManager: initializeRightPanelBackgroundManager
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
window.initializeRightPanelBackgroundManager = initializeRightPanelBackgroundManager;

// UIBasicオブジェクトの公開
window.UIBasic = UIBasic;

// 🎨 新デザイン要件: 右パネル背景変化管理
class RightPanelBackgroundManager {
    constructor() {
        this.statusSection = null;
        this.currentSpeaker = null;
        this.initialize();
    }

    initialize() {
        // status-panel要素を取得（背景変化用）
        this.statusPanel = document.querySelector('.status-panel');
        if (!this.statusPanel) {
            console.warn('⚠️ status-panel要素が見つかりません');
            return;
        }

        // 話者変化のリスナーを設定
        this.setupSpeakerChangeListener();
        console.log('✅ 右パネル背景変化管理初期化完了');
    }

    setupSpeakerChangeListener() {
        // AppStateの変化を監視
        const checkSpeakerChange = () => {
            const newSpeaker = window.AppState?.currentSpeaker;
            if (newSpeaker !== this.currentSpeaker) {
                this.updateBackgroundForSpeaker(newSpeaker);
                this.currentSpeaker = newSpeaker;
            }
        };

        // 定期的にチェック（メイン監視）
        setInterval(checkSpeakerChange, 100);

        // UnifiedStateManagerのイベントリスナーも設定（非同期対応）
        const setupUnifiedStateListener = () => {
            if (window.UnifiedStateManager && typeof window.UnifiedStateManager.addListener === 'function') {
                try {
                    window.UnifiedStateManager.addListener((eventType, data, state) => {
                        if (eventType === 'conversation_state_changed' && state?.conversation?.currentSpeaker !== this.currentSpeaker) {
                            this.updateBackgroundForSpeaker(state.conversation.currentSpeaker);
                            this.currentSpeaker = state.conversation.currentSpeaker;
                            console.log(`🎨 統一状態管理からの話者変化検知: ${state.conversation.currentSpeaker}`);
                        }
                    });
                    console.log('✅ 統一状態管理システムの話者変化リスナー設定完了');
                } catch (error) {
                    console.warn('⚠️ 統一状態管理システムリスナー設定失敗:', error);
                }
            } else {
                // 統一状態管理システムが利用できない場合は、再試行
                console.log('⏳ 統一状態管理システム待機中... 1秒後に再試行');
                setTimeout(setupUnifiedStateListener, 1000);
            }
        };

        // 🎨 新規: ConversationGatekeeperとの連携
        const setupConversationGatekeeperListener = () => {
            if (window.ConversationGatekeeper && typeof window.ConversationGatekeeper.registerSpeechStart === 'function') {
                const originalRegisterSpeechStart = window.ConversationGatekeeper.registerSpeechStart;
                window.ConversationGatekeeper.registerSpeechStart = (speaker, context) => {
                    // 元の処理を実行
                    originalRegisterSpeechStart.call(window.ConversationGatekeeper, speaker, context);
                    
                    // 右パネル背景変化を更新
                    this.updateBackgroundForSpeaker(speaker);
                    this.currentSpeaker = speaker;
                    console.log(`🎨 ConversationGatekeeperからの話者変化検知: ${speaker}`);
                };
                console.log('✅ ConversationGatekeeper連携設定完了');
            }
        };

        // 🎨 新規: 音声認識システムからの直接通知
        const setupVoiceRecognitionListener = () => {
            // グローバルイベントリスナーを設定
            window.addEventListener('speaker-change', (event) => {
                const speaker = event.detail.speaker;
                if (speaker !== this.currentSpeaker) {
                    this.updateBackgroundForSpeaker(speaker);
                    this.currentSpeaker = speaker;
                    console.log(`🎨 音声認識システムからの話者変化検知: ${speaker}`);
                }
            });
        };

        // 統一状態管理システムのリスナー設定を試行
        setupUnifiedStateListener();
        
        // 🎨 新規: 追加の連携システム設定
        setupConversationGatekeeperListener();
        setupVoiceRecognitionListener();
    }

    updateBackgroundForSpeaker(speaker) {
        if (!this.statusPanel) return;

        // キャラクター画像要素を取得
        const nehoriAvatar = document.getElementById('nehoriAvatar');
        const hahoriAvatar = document.getElementById('hahoriAvatar');

        // 既存のスピーカークラスを削除
        this.statusPanel.classList.remove('speaker-nehori', 'speaker-hahori', 'speaker-user');
        
        // 🎨 キャラクター画像のspeakingクラスを削除
        if (nehoriAvatar) nehoriAvatar.classList.remove('speaking');
        if (hahoriAvatar) hahoriAvatar.classList.remove('speaking');

        // 新しいスピーカークラスを追加
        if (speaker === window.SPEAKERS?.NEHORI) {
            this.statusPanel.classList.add('speaker-nehori');
            // 🎨 ねほりーの画像に縦長丸グラデーション効果を追加
            if (nehoriAvatar) nehoriAvatar.classList.add('speaking');
            console.log('🎨 右パネル背景変化: ねほりーの発話（縦長丸グラデーション）');
        } else if (speaker === window.SPEAKERS?.HAHORI) {
            this.statusPanel.classList.add('speaker-hahori');
            // 🎨 はほりーの画像に縦長丸グラデーション効果を追加
            if (hahoriAvatar) hahoriAvatar.classList.add('speaking');
            console.log('🎨 右パネル背景変化: はほりーの発話（縦長丸グラデーション）');
        } else if (speaker === window.SPEAKERS?.USER) {
            this.statusPanel.classList.add('speaker-user');
            console.log('🎨 右パネル背景変化: ユーザー発話');
        } else {
            // speaker === null の場合、すべてのクラスを削除（通常の背景に戻る）
            console.log('🎨 右パネル背景変化: 通常状態に戻る');
        }
    }
}

// 🎨 新デザイン要件: 右パネル背景変化管理システムの初期化
window.RightPanelBackgroundManager = RightPanelBackgroundManager;

// 🎨 新機能: 音声状態表示とリアルタイム音声認識のグローバル公開
window.updateVoiceStateDisplay = updateVoiceStateDisplay;
window.updateRealtimeTranscript = updateRealtimeTranscript;
window.initializeVoiceStateDisplay = initializeVoiceStateDisplay;

// セッション開始時に右パネル背景変化管理を初期化
function initializeRightPanelBackgroundManager() {
    if (window.rightPanelBackgroundManager) {
        return; // 既に初期化済み
    }

    window.rightPanelBackgroundManager = new RightPanelBackgroundManager();
    console.log('✅ 右パネル背景変化管理システム初期化完了');
    
    // 🎨 新機能: 初期化後にテスト実行
    setTimeout(() => {
        if (window.rightPanelBackgroundManager && window.rightPanelBackgroundManager.statusPanel) {
            console.log('🎨 右パネル背景変化システム動作確認');
            window.rightPanelBackgroundManager.updateBackgroundForSpeaker(null);
            
            // 🎨 新機能: 自動テスト実行
            if (window.testRightPanelBackgroundSystem) {
                console.log('🧪 右パネル背景変化システムテスト実行');
                window.testRightPanelBackgroundSystem();
            }
        }
    }, 1000);
}

// 🎨 新機能: 右パネル背景変化システムの動作テスト
function testRightPanelBackgroundSystem() {
    console.log('🧪 右パネル背景変化システムテスト開始');
    
    if (!window.rightPanelBackgroundManager) {
        console.error('❌ 右パネル背景変化管理システムが初期化されていません');
        return false;
    }
    
    const manager = window.rightPanelBackgroundManager;
    const statusPanel = manager.statusPanel;
    
    if (!statusPanel) {
        console.error('❌ status-panel要素が見つかりません');
        return false;
    }
    
    console.log('✅ 右パネル要素発見:', statusPanel);
    
    // 各話者の背景変化をテスト
    const speakers = [
        { name: 'ねほりー', value: window.SPEAKERS?.NEHORI },
        { name: 'はほりー', value: window.SPEAKERS?.HAHORI },
        { name: 'ユーザー', value: window.SPEAKERS?.USER },
        { name: 'なし', value: null }
    ];
    
    let testIndex = 0;
    
    const runTest = () => {
        if (testIndex >= speakers.length) {
            console.log('✅ 右パネル背景変化システムテスト完了');
            return;
        }
        
        const speaker = speakers[testIndex];
        console.log(`🔄 テスト ${testIndex + 1}/${speakers.length}: ${speaker.name} (${speaker.value})`);
        
        // 背景変化をテスト
        manager.updateBackgroundForSpeaker(speaker.value);
        
        // 2秒後に次のテスト
        testIndex++;
        setTimeout(runTest, 2000);
    };
    
    runTest();
    return true;
}

// 🎨 新機能: 右パネル背景変化システムの手動テスト
function manualTestRightPanelBackground(speaker) {
    console.log(`🧪 手動テスト: ${speaker}`);
    
    if (!window.rightPanelBackgroundManager) {
        console.error('❌ 右パネル背景変化管理システムが初期化されていません');
        return false;
    }
    
    const speakerValue = speaker === 'nehori' ? window.SPEAKERS?.NEHORI :
                        speaker === 'hahori' ? window.SPEAKERS?.HAHORI :
                        speaker === 'user' ? window.SPEAKERS?.USER : null;
    
    window.rightPanelBackgroundManager.updateBackgroundForSpeaker(speakerValue);
    return true;
}

// 🎨 新機能: 複数の方法で初期化を試行
function forceInitializeRightPanelBackgroundManager() {
    console.log('🚀 右パネル背景変化管理システム強制初期化開始');
    
    // 既存のインスタンスをクリア
    window.rightPanelBackgroundManager = null;
    
    // 1秒後に初期化
    setTimeout(() => {
        initializeRightPanelBackgroundManager();
    }, 1000);
    
    // 3秒後に再試行
    setTimeout(() => {
        if (!window.rightPanelBackgroundManager || !window.rightPanelBackgroundManager.statusPanel) {
            console.log('🔄 右パネル背景変化管理システム再初期化');
            initializeRightPanelBackgroundManager();
        }
    }, 3000);
}

// グローバルに公開
window.testRightPanelBackgroundSystem = testRightPanelBackgroundSystem;
window.manualTestRightPanelBackground = manualTestRightPanelBackground;
window.forceInitializeRightPanelBackgroundManager = forceInitializeRightPanelBackgroundManager;

// =================================================================================
// 🎨 NEW FEATURES - 音声状態表示とリアルタイム音声認識
// =================================================================================

/**
 * 音声状態表示の更新
 * 6つの音声認識状態を色とテキストで表示
 */
function updateVoiceStateDisplay(state = 'idle') {
    const stateIcon = document.getElementById('stateIcon');
    const stateText = document.getElementById('stateText');
    const voiceStateCompact = document.getElementById('voiceStateCompact');
    
    if (!stateIcon || !stateText || !voiceStateCompact) {
        console.warn('⚠️ 音声状態表示要素が見つかりません');
        return;
    }
    
    // 状態設定（マイクアイコンの重複を避けるため状態に応じたアイコンを使用）
    const stateConfig = {
        'starting': { text: '認識を開始中...', icon: '🔄' },
        'active': { text: '認識中', icon: '🟢' },
        'stopping': { text: '認識を一時停止中', icon: '⏸️' },
        'error': { text: '認識エラー', icon: '🔴' },
        'network-error': { text: 'ネットワークエラー', icon: '🌐' },
        'permission-denied': { text: 'マイク許可が必要', icon: '🚫' },
        'idle': { text: '待機中', icon: '⚪' }
    };
    
    const config = stateConfig[state] || stateConfig['idle'];
    
    // UI更新
    stateIcon.textContent = config.icon;
    stateText.textContent = config.text;
    
    // 状態クラスの更新
    voiceStateCompact.className = `voice-state-compact ${state}`;
    
    console.log(`🎨 音声状態表示更新: ${state} - ${config.text}`);
}

/**
 * リアルタイム音声認識結果の更新
 * 会話ログとは分離された音声認識結果を表示
 */
function updateRealtimeTranscript(transcriptText = '') {
    const transcriptElement = document.getElementById('transcriptText');
    
    if (!transcriptElement) {
        console.warn('⚠️ リアルタイム音声認識要素が見つかりません');
        return;
    }
    
    // 音声認識結果の更新
    if (transcriptText && transcriptText.trim()) {
        transcriptElement.textContent = transcriptText;
        transcriptElement.style.opacity = '1';
    } else {
        transcriptElement.textContent = '...';
        transcriptElement.style.opacity = '0.5';
    }
    
    console.log(`🎙️ リアルタイム音声認識更新: ${transcriptText}`);
}

/**
 * 音声状態表示とリアルタイム音声認識の初期化
 */
function initializeVoiceStateDisplay() {
    console.log('🎨 音声状態表示とリアルタイム音声認識の初期化開始');
    
    // 初期状態設定
    updateVoiceStateDisplay('idle');
    updateRealtimeTranscript('');
    
            // 統合状態管理システムとの連携
        if (window.unifiedStateManager) {
            try {
                // 音声認識状態の監視
                const checkVoiceState = () => {
                    try {
                        // 正しいAPIを使用: getModule('voice')
                        const voiceModule = window.unifiedStateManager.getModule('voice');
                        if (voiceModule && voiceModule.getState) {
                            const voiceState = voiceModule.getState();
                            if (voiceState.recognitionState) {
                                updateVoiceStateDisplay(voiceState.recognitionState);
                            }
                        }
                    } catch (error) {
                        console.warn('⚠️ 音声状態確認エラー:', error);
                    }
                };
                
                // 定期的な状態確認
                setInterval(checkVoiceState, 500);
                
                console.log('✅ 音声状態表示の統合状態管理システム連携完了');
            } catch (error) {
                console.error('❌ 音声状態表示の統合状態管理システム連携エラー:', error);
            }
        } else {
            console.warn('⚠️ 統合状態管理システムが見つかりません - 基本機能のみで動作');
        }
    
    console.log('✅ 音声状態表示とリアルタイム音声認識の初期化完了');
}

// =================================================================================
// 🔧 DEBUG & TEST FUNCTIONS - デバッグ・テスト用関数
// =================================================================================

/**
 * 音声状態表示のテスト関数
 * 6つの状態を順番に表示して動作確認
 */
window.testVoiceStateDisplay = function() {
    console.log('🧪 音声状態表示テスト開始');
    
    const states = ['starting', 'active', 'stopping', 'error', 'network-error', 'permission-denied', 'idle'];
    let currentIndex = 0;
    
    const testInterval = setInterval(() => {
        const state = states[currentIndex];
        console.log(`🔄 状態テスト: ${state}`);
        updateVoiceStateDisplay(state);
        
        currentIndex++;
        if (currentIndex >= states.length) {
            clearInterval(testInterval);
            console.log('✅ 音声状態表示テスト完了');
            // 最終的にidle状態に戻す
            updateVoiceStateDisplay('idle');
        }
    }, 1500);
};

/**
 * リアルタイム音声認識のテスト関数
 * サンプルテキストを表示して動作確認
 */
window.testRealtimeTranscript = function() {
    console.log('🧪 リアルタイム音声認識テスト開始');
    
    const sampleTexts = [
        'こんにちは',
        'テストしています',
        'うまく動作していますか？',
        'これはリアルタイム音声認識のテストです',
        ''
    ];
    
    let currentIndex = 0;
    
    const testInterval = setInterval(() => {
        const text = sampleTexts[currentIndex];
        console.log(`🔄 音声認識テスト: "${text}"`);
        updateRealtimeTranscript(text);
        
        currentIndex++;
        if (currentIndex >= sampleTexts.length) {
            clearInterval(testInterval);
            console.log('✅ リアルタイム音声認識テスト完了');
        }
    }, 2000);
};

/**
 * 右パネル背景変化のテスト関数
 * 話者による背景変化を確認
 */
window.testRightPanelBackground = function() {
    console.log('🧪 右パネル背景変化テスト開始');
    
    const statusPanel = document.querySelector('.status-panel');
    if (!statusPanel) {
        console.error('❌ 右パネルが見つかりません');
        return;
    }
    
    const speakers = ['nehori', 'hahori', 'user', ''];
    let currentIndex = 0;
    
    const testInterval = setInterval(() => {
        const speaker = speakers[currentIndex];
        console.log(`🔄 背景変化テスト: speaker-${speaker}`);
        
        // 既存のspeakerクラスを削除
        statusPanel.classList.remove('speaker-nehori', 'speaker-hahori', 'speaker-user');
        
        // 新しいspeakerクラスを追加
        if (speaker) {
            statusPanel.classList.add(`speaker-${speaker}`);
        }
        
        currentIndex++;
        if (currentIndex >= speakers.length) {
            clearInterval(testInterval);
            console.log('✅ 右パネル背景変化テスト完了');
        }
    }, 2000);
};

/**
 * 総合テスト関数
 * すべての新機能を順番にテスト
 */
window.testNewUIFeatures = function() {
    console.log('🧪 新UI機能総合テスト開始');
    
    // 1. 音声状態表示テスト
    testVoiceStateDisplay();
    
    // 2. リアルタイム音声認識テスト（3秒後）
    setTimeout(() => {
        testRealtimeTranscript();
    }, 3000);
    
    // 3. 右パネル背景変化テスト（8秒後）
    setTimeout(() => {
        testRightPanelBackground();
    }, 8000);
    
    console.log('✅ 新UI機能総合テスト完了予定（約15秒後）');
};

console.log('✅ UIBasic読み込み完了 - 基本UI更新管理システム');
console.log('📦 UIBasic: 7個の関数とUIBasicオブジェクトをwindow経由で公開（3個はscript.jsに移動済み）'); 