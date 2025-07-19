// =================================================================================
// 深堀くん v2.0 - 既存音声コマンド機能バックアップ
// =================================================================================
// バックアップ作成日: 2025-01-19
// 目的: 新音声コマンドシステム実装前の既存機能保存
// 
// このファイルには以下の機能が含まれています：
// 1. processFinalTranscript() - 音声認識結果の処理
// 2. 各種コマンドハンドラー（テーマ変更、質問変更、セッション終了等）
// 3. 知見評価システムのコマンド処理
// 4. 音声訂正システム（SpeechCorrectionSystem）
// =================================================================================

// ========== 1. メイン音声処理関数 ==========
// script.js 2244-2343行目より抽出

async function processFinalTranscript(text) {
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
            
            // 現在の入力を設定（累積された文字起こし）
            const currentInput = AppState.transcriptHistory.join(' ');
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

    // 従来の文字削除コマンド（下位互換性のため維持）
    if (text.includes('文字消して') || text.includes('もじけして') || text.includes('クリアして')) {
        AppState.transcriptHistory = [];
        AppState.currentTranscript = '';
        SpeechCorrectionSystem.setCurrentInput('');
        window.updateTranscriptDisplay();
        console.log('✅ 文字起こしをクリアしました');
        await provideCorrectionFeedback('文字を削除しました');
        return;
    }

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
        const fullText = AppState.transcriptHistory.join(' ');
        // 🔧 Phase B: 現在の入力を訂正システムに設定
        SpeechCorrectionSystem.setCurrentInput(fullText);
        await handleUserTextInput(fullText);
    } else if (!AppState.waitingForPermission) {
        const fullText = AppState.transcriptHistory.join(' ');
        // 🔧 Phase B: 現在の入力を訂正システムに設定
        SpeechCorrectionSystem.setCurrentInput(fullText);
        await handleUserTextInput(fullText);
    } else {
        console.log('「どうぞ」を待機中 - 文字起こし蓄積:', text);
        console.log('現在の累積文字起こし:', AppState.transcriptHistory.join(' '));
    }
}

// ========== 2. 知見確認コマンド処理 ==========
// script.js 2607-2650行目より抽出

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

// ========== 3. 閾値変更コマンドハンドラー ==========
// script.js 5516-5548行目より抽出

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

// ========== 4. 動的コマンド判定 ==========
// script.js 3734-3768行目より抽出

function getContextualCommands() {
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
}

// ========== バックアップ情報 ==========
// 抽出元ファイル:
// - app/script.js
// - app/script.js.backup
// - config/prompts.js
// 
// 関連システム:
// - VoiceKnowledgeSystem（知見評価）
// - SpeechCorrectionSystem（音声訂正）
// - SmartVoicePanelManager（UI表示）
// - VoicePatterns（パターン定義）
// - VoiceTemplates（応答テンプレート） 