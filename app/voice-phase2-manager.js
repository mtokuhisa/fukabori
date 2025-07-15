// =================================================================================
// VOICE PHASE 2 MANAGER - 音声システムPhase2完全分離モジュール
// =================================================================================
// 🎯 目的: 音声システムPhase2の完全分離による保守性向上
// 📊 削減効果: 441行削減（6,428行→5,987行）
// 🛡️ 戦略: 完全後方互換性確保による安全な分離
// 📅 作成日: 2025-01-06
// =================================================================================

console.log('🚀 VoicePhase2Manager モジュール読み込み開始');

// =================================================================================
// VOICE OPTIMIZATION SYSTEM - 音声最適化システム
// =================================================================================

// Voice Optimization Phase 3: はほりーの発声中にねほりーの生成
const VoiceOptimization = {
    phase3: {
        isActive: true,
        pendingNehoriContent: null,
        pendingNehoriAudio: null,
        isGeneratingNehori: false,
        hahoriSpeechStartTime: null,
        shouldPlayNehoriImmediately: false
    }
};

// =================================================================================
// DUAL PREEMPTIVE OPTIMIZATION SYSTEM - 双方向先読み最適化システム
// =================================================================================

// 🔧 Phase C: 双方向先読み最適化システム
const DualPreemptiveOptimization = {
    phase1: {
        isActive: true,
        // はほりーの先読み管理
        pendingHahoriContent: null,
        pendingHahoriAudio: null,
        isGeneratingHahori: false,
        nehoriSpeechStartTime: null,
        shouldPlayHahoriImmediately: false,
        // 状況適応管理
        adaptiveStrategy: {
            nehoriSpeaking: { trigger: 'immediate', priority: 'high', context: 'knowledge_evaluation' },
            hahoriSpeaking: { trigger: 'delayed', priority: 'medium', context: 'next_question' },
            userSpeaking: { trigger: 'smart', priority: 'adaptive', context: 'response_preparation' }
        },
        // 🔧 Phase 2: 状況適応システム
        situationAnalyzer: {
            // 会話状況を分析
            analyzeConversationSituation(currentSpeaker, userInput) {
                const recentMessages = AppState.conversationHistory.slice(-3);
                const hasUserInput = userInput && userInput.trim().length > 0;
                const isKnowledgeConfirmation = AppState.voiceRecognitionState.isKnowledgeConfirmationMode;
                
                if (isKnowledgeConfirmation) {
                    return 'knowledge_confirmation';
                } else if (currentSpeaker === SPEAKERS.NEHORI) {
                    return 'nehori_speaking';
                } else if (currentSpeaker === SPEAKERS.HAHORI) {
                    return 'hahori_speaking';
                } else if (hasUserInput) {
                    return 'user_speaking';
                } else {
                    return 'idle';
                }
            },
            
            // 先読み戦略を決定
            determinePreemptiveStrategy(situation) {
                const strategy = DualPreemptiveOptimization.phase1.adaptiveStrategy[situation] || 
                                DualPreemptiveOptimization.phase1.adaptiveStrategy.userSpeaking;
                
                // 戦略に基づいて具体的な設定を決定
                switch (strategy.trigger) {
                    case 'immediate':
                        return {
                        trigger: 'immediate',
                            delay: 100,
                            targetSpeaker: situation === 'nehori_speaking' ? SPEAKERS.HAHORI : SPEAKERS.NEHORI,
                            priority: strategy.priority
                        };
                    case 'delayed':
                        return {
                        trigger: 'delayed',
                        delay: 2000,
                            targetSpeaker: situation === 'nehori_speaking' ? SPEAKERS.HAHORI : SPEAKERS.NEHORI,
                            priority: strategy.priority
                        };
                    case 'smart':
                        return {
                        trigger: 'smart',
                            delay: 1000,
                            targetSpeaker: DualPreemptiveOptimization.phase1.situationAnalyzer.determineSmartTargetSpeaker(situation),
                            priority: strategy.priority
                        };
                    default:
                        return {
                        trigger: 'none',
                        delay: 0,
                            targetSpeaker: null,
                            priority: 'none'
                        };
                }
            },

            // スマート戦略でのターゲット話者決定
            determineSmartTargetSpeaker(situation) {
                // 会話履歴から最適な次の話者を決定
                const recentMessages = AppState.conversationHistory.slice(-3);
                const lastSpeaker = recentMessages.length > 0 ? recentMessages[recentMessages.length - 1].sender : null;
                
                if (lastSpeaker === SPEAKERS.NEHORI) {
                    return SPEAKERS.HAHORI;
                } else if (lastSpeaker === SPEAKERS.HAHORI) {
                    return SPEAKERS.NEHORI;
                } else {
                    return SPEAKERS.NEHORI; // デフォルト
                }
            }
        }
    }
};

// =================================================================================
// PREEMPTIVE GENERATION MANAGERS - 先読み生成管理オブジェクト
// =================================================================================

// ねほりーの先読み生成管理
const nehoriPreemptiveGeneration = {
    isGenerating: false,
    startTime: null,
    generatedQuestion: null,
    lastPlaybackTime: null,
    createIntegratedNehoriPrompt: function(conversationContext, themeContext) {
        return `テーマ「${AppState.currentTheme}」についての深掘り会話が進行中です。

会話コンテキスト:
${conversationContext}

テーマコンテキスト:
${themeContext}

あなたは「ねほりーの」です。会話の流れを踏まえて、新しい角度での質問を生成してください。
200文字以内で、自然で親しみやすい質問をお願いします。`;
    },
    generateNehoriQuestionAsync: async function(prompt) {
        return await window.gptMessagesToCharacterResponse([
            { role: 'user', content: prompt }
        ], window.SPEAKERS.NEHORI);
    }
};

// はほりーの先読み生成管理
const hahoriPreemptiveGeneration = {
    isGenerating: false,
    startTime: null,
    generatedResponse: null,
    lastPlaybackTime: null,
    createIntegratedHahoriPrompt: function(conversationContext, themeContext) {
        return `テーマ「${AppState.currentTheme}」についての深掘り会話が進行中です。

会話コンテキスト:
${conversationContext}

テーマコンテキスト:
${themeContext}

あなたは「はほりーの」です。会話の流れを踏まえて、適切な応答を生成してください。
200文字以内で、自然で親しみやすい応答をお願いします。`;
    },
    generateHahoriResponseAsync: async function(prompt) {
        return await window.gptMessagesToCharacterResponse([
            { role: 'user', content: prompt }
        ], window.SPEAKERS.HAHORI);
    }
};

// =================================================================================
// NEHORI VOICE FUNCTIONS - ねほりー音声関数群
// =================================================================================

// 🔧 Phase 3: ねほりーの先読み生成機能
async function startNehoriGenerationDuringHahori() {
    console.log('🔮 ねほりーの先読み生成開始（はほりーの発話中）');
    
    // ConversationGatekeeperが利用可能かチェック
    if (!window.ConversationGatekeeper) {
        console.log('⚠️ ConversationGatekeeperが未初期化のため先読み生成をスキップ');
        return;
    }
    
    // 🔄 状況適応システム統合
    if (window.DualPreemptiveOptimization?.phase1.isActive) {
        const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(window.SPEAKERS?.HAHORI, null);
        const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        
        console.log('📊 状況適応分析結果:', { situation, strategy });
        
        if (strategy.trigger === 'none') {
            console.log('🚫 状況適応システムが先読み生成を無効化');
            return;
        }
    }
    
    // 🔄 会話制御チェック
    if (window.ConversationGatekeeper?.conversationControl?.speakingInProgress && 
        window.AppState?.currentSpeaker !== window.SPEAKERS?.HAHORI) {
        console.log('🚫 不適切な発話状態のため先読み生成をスキップ');
        return;
    }
    
    // 既存の先読み生成があるかチェック
    if (nehoriPreemptiveGeneration.isGenerating) {
        console.log('🔄 既に先読み生成中 - スキップ');
        return;
    }
    
    nehoriPreemptiveGeneration.isGenerating = true;
    nehoriPreemptiveGeneration.startTime = Date.now();
    
    // 🔄 統合処理: 会話履歴とテーマコンテキストを統合
    const conversationContext = window.AppState?.conversationHistory?.map(msg => msg.content).join(' ') || '';
    const themeContext = window.AppState?.selectedThemeDetails?.map(theme => theme.summary).join(' ') || '';
    
    console.log('🎯 先読み生成コンテキスト:', {
        conversationLength: conversationContext.length,
        themeLength: themeContext.length,
        hasHistory: window.AppState?.conversationHistory?.length > 0
    });
    
    // 🔄 統合プロンプト生成
    const prompt = nehoriPreemptiveGeneration.createIntegratedNehoriPrompt(conversationContext, themeContext);
    
    // 非同期で生成開始
    nehoriPreemptiveGeneration.generateNehoriQuestionAsync(prompt)
        .then(question => {
            if (question && question.trim()) {
                nehoriPreemptiveGeneration.generatedQuestion = question;
                console.log('✅ ねほりーの先読み生成完了');
            } else {
                console.log('⚠️ ねほりーの先読み生成結果が空');
            }
        })
        .catch(error => {
            console.error('❌ ねほりーの先読み生成エラー:', error);
        })
        .finally(() => {
            nehoriPreemptiveGeneration.isGenerating = false;
        });
}

// 🔧 Phase 3: ゲートキーパー対応のねほりーの即座再生
async function handleNehoriImmediatePlayback() {
    console.log('🎤 ねほりーの即座再生処理開始');
    
    // ConversationGatekeeperが利用可能かチェック
    if (!window.ConversationGatekeeper) {
        console.log('⚠️ ConversationGatekeeperが未初期化のため即座再生をスキップ');
        return;
    }
    
    // 🔄 発話許可チェック
    if (!window.ConversationGatekeeper.canNehoriSpeak('immediate_playback')) {
        console.log('🚫 ねほりーの発話許可なし - 即座再生をスキップ');
        return;
    }
    
    // 🔄 状況適応システム統合
    if (window.DualPreemptiveOptimization?.phase1.isActive) {
        const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(window.SPEAKERS?.NULL, null);
        const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        
        if (strategy.trigger === 'none') {
            console.log('🚫 状況適応システムが即座再生を無効化');
            return;
        }
    }
    
    // 先読み生成された質問があるかチェック
    if (!nehoriPreemptiveGeneration.generatedQuestion) {
        console.log('📝 先読み生成された質問がありません');
        
        // 🔄 統合フォールバック: 即座生成
        try {
            const conversationContext = window.AppState?.conversationHistory?.map(msg => msg.content).join(' ') || '';
            const themeContext = window.AppState?.selectedThemeDetails?.map(theme => theme.summary).join(' ') || '';
            const prompt = nehoriPreemptiveGeneration.createIntegratedNehoriPrompt(conversationContext, themeContext);
            
            const question = await nehoriPreemptiveGeneration.generateNehoriQuestionAsync(prompt);
            if (question && question.trim()) {
                nehoriPreemptiveGeneration.generatedQuestion = question;
                console.log('✅ 即座生成完了');
            } else {
                console.log('⚠️ 即座生成結果が空');
                return;
            }
        } catch (error) {
            console.error('❌ 即座生成エラー:', error);
            return;
        }
    }
    
    // 🔄 発話開始登録
    window.ConversationGatekeeper.registerSpeechStart(window.SPEAKERS?.NEHORI, 'immediate_playback');
    
    try {
        // 🔄 統合処理: 音声合成と再生
        const audioBlob = await window.ttsTextToAudioBlob(nehoriPreemptiveGeneration.generatedQuestion, window.SPEAKERS?.NEHORI);
        
        // チャットに追加
        await window.addMessageToChat(window.SPEAKERS?.NEHORI, nehoriPreemptiveGeneration.generatedQuestion);
        
        // 音声再生
        await window.playPreGeneratedAudio(audioBlob, window.SPEAKERS?.NEHORI);
        
        // 🔄 統合クリーンアップ
        nehoriPreemptiveGeneration.generatedQuestion = null;
        nehoriPreemptiveGeneration.lastPlaybackTime = Date.now();
        
        console.log('✅ ねほりーの即座再生完了');
        
    } catch (error) {
        console.error('❌ ねほりーの即座再生エラー:', error);
    } finally {
        // 🔄 発話終了登録
        window.ConversationGatekeeper.registerSpeechEnd(window.SPEAKERS?.NEHORI, 'immediate_playback');
    }
}

// 🔧 改善版: ゲートキーパー対応のPendingねほりーの再生
async function playPendingNehoriIfNeeded() {
    console.log('🎵 ねほりーのPending再生チェック');
    
    // ConversationGatekeeperが利用可能かチェック
    if (!window.ConversationGatekeeper) {
        console.log('⚠️ ConversationGatekeeperが未初期化のためPending再生をスキップ');
        return;
    }
    
    // 🔄 発話許可チェック
    if (!window.ConversationGatekeeper.canNehoriSpeak('pending_playback')) {
        console.log('🚫 ねほりーの発話許可なし - Pending再生をスキップ');
        return;
    }
    
    // 先読み生成された質問があるかチェック
    if (!nehoriPreemptiveGeneration.generatedQuestion) {
        console.log('📝 Pending再生する質問がありません');
        return;
    }
    
    // 🔄 発話開始登録
    window.ConversationGatekeeper.registerSpeechStart(window.SPEAKERS?.NEHORI, 'pending_playback');
    
    try {
        // 🔄 統合処理: 音声合成と再生
        const audioBlob = await window.ttsTextToAudioBlob(nehoriPreemptiveGeneration.generatedQuestion, window.SPEAKERS?.NEHORI);
        
        // チャットに追加
        await window.addMessageToChat(window.SPEAKERS?.NEHORI, nehoriPreemptiveGeneration.generatedQuestion);
        
        // 音声再生
        await window.playPreGeneratedAudio(audioBlob, window.SPEAKERS?.NEHORI);
        
        // 🔄 統合クリーンアップ
        nehoriPreemptiveGeneration.generatedQuestion = null;
        nehoriPreemptiveGeneration.lastPlaybackTime = Date.now();
        
        console.log('✅ ねほりーのPending再生完了');
        
    } catch (error) {
        console.error('❌ ねほりーのPending再生エラー:', error);
    } finally {
        // 🔄 発話終了登録
        window.ConversationGatekeeper.registerSpeechEnd(window.SPEAKERS?.NEHORI, 'pending_playback');
    }
}

// 🔧 新機能: 即座質問生成と再生
async function generateAndPlayNehoriImmediately() {
    console.log('💡 generateAndPlayNehoriImmediately が実行されました');
    
    // 🛡️ ゲートキーパーチェック
    if (!ConversationGatekeeper.canNehoriSpeak('immediateGeneration')) {
        console.log('🚫 ゲートキーパーによりねほりーの即座生成をブロック');
        return;
    }
    
    try {
        const control = AppState.conversationControl;
        
        // 重複防止フラグをセット
        control.questionGenerationScheduled = true;
        
        ConversationGatekeeper.registerSpeechStart(SPEAKERS.NEHORI, 'immediateGeneration');
        
        // 質問生成
        const question = await generateNehoriQuestionInternal();
        const audio = await ttsTextToAudioBlob(question, SPEAKERS.NEHORI);
        
        // チャットに追加して再生
        await addMessageToChat(SPEAKERS.NEHORI, question);
        await playPreGeneratedAudio(audio, SPEAKERS.NEHORI);
        
        ConversationGatekeeper.registerSpeechEnd(SPEAKERS.NEHORI, 'immediateGeneration');
        
        // フラグをリセット
        control.questionGenerationScheduled = false;
        
    } catch (error) {
        console.error('❌ ねほりーの即座生成エラー:', error);
        ConversationGatekeeper.registerSpeechEnd(SPEAKERS.NEHORI, 'error');
        AppState.conversationControl.questionGenerationScheduled = false;
    }
}

// 🔧 内部ヘルパー関数: ねほりーの質問生成
async function generateNehoriQuestionInternal() {
    const recentConversation = AppState.conversationHistory
        .slice(-6)
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');
    const knowledgeContext = AppState.extractedKnowledge
        .map((knowledge, index) => `知見${index + 1}: ${knowledge.summary}`)
        .join('\n');
        
    // 簡易プロンプト（AI_PROMPTSが利用できない場合のフォールバック）
    const nehoriQuestionPrompt = `テーマ「${AppState.currentTheme}」についての深掘り会話が進行中です。

最近の会話内容:
${recentConversation}

抽出された知見:
${knowledgeContext}

あなたは「ねほりーの」です。ユーザーの回答から新しい角度での質問を生成してください。
200文字以内で、自然で親しみやすい質問をお願いします。`;

    const response = await gptMessagesToCharacterResponse([
        { role: 'user', content: nehoriQuestionPrompt }
    ], SPEAKERS.NEHORI);
    
    return response;
}

// =================================================================================
// HAHORI VOICE FUNCTIONS - はほりー音声関数群
// =================================================================================

// 🔧 Phase C: はほりーの先読み生成機能
async function startHahoriGenerationDuringNehori() {
    console.log('🔮 はほりーの先読み生成開始（ねほりーの発話中）');
    
    // ConversationGatekeeperが利用可能かチェック
    if (!window.ConversationGatekeeper) {
        console.log('⚠️ ConversationGatekeeperが未初期化のため先読み生成をスキップ');
        return;
    }
    
    // 🔄 状況適応システム統合
    if (window.DualPreemptiveOptimization?.phase1.isActive) {
        const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(window.SPEAKERS?.NEHORI, null);
        const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        
        console.log('📊 状況適応分析結果:', { situation, strategy });
        
        if (strategy.trigger === 'none') {
            console.log('🚫 状況適応システムが先読み生成を無効化');
            return;
        }
    }
    
    // 🔄 会話制御チェック
    if (window.ConversationGatekeeper.conversationControl.speakingInProgress && 
        window.AppState?.currentSpeaker !== window.SPEAKERS?.NEHORI) {
        console.log('🚫 不適切な発話状態のため先読み生成をスキップ');
        return;
    }
    
    // 既存の先読み生成があるかチェック
    if (hahoriPreemptiveGeneration.isGenerating) {
        console.log('🔄 既に先読み生成中 - スキップ');
        return;
    }
    
    hahoriPreemptiveGeneration.isGenerating = true;
    hahoriPreemptiveGeneration.startTime = Date.now();
    
    // 🔄 統合処理: 会話履歴とテーマコンテキストを統合
    const conversationContext = window.AppState?.conversationHistory?.map(msg => msg.content).join(' ') || '';
    const themeContext = window.AppState?.selectedThemeDetails?.map(theme => theme.summary).join(' ') || '';
    
    console.log('🎯 先読み生成コンテキスト:', {
        conversationLength: conversationContext.length,
        themeLength: themeContext.length,
        hasHistory: window.AppState?.conversationHistory?.length > 0
    });
    
    // 🔄 統合プロンプト生成
    const prompt = hahoriPreemptiveGeneration.createIntegratedHahoriPrompt(conversationContext, themeContext);
    
    // 非同期で生成開始
    hahoriPreemptiveGeneration.generateHahoriResponseAsync(prompt)
        .then(response => {
            if (response && response.trim()) {
                hahoriPreemptiveGeneration.generatedResponse = response;
                console.log('✅ はほりーの先読み生成完了');
            } else {
                console.log('⚠️ はほりーの先読み生成結果が空');
            }
        })
        .catch(error => {
            console.error('❌ はほりーの先読み生成エラー:', error);
        })
        .finally(() => {
            hahoriPreemptiveGeneration.isGenerating = false;
        });
}

// 🔧 Phase C: ゲートキーパー対応のはほりーの即座再生
async function handleHahoriImmediatePlayback() {
    console.log('🎤 はほりーの即座再生処理開始');
    
    // ConversationGatekeeperが利用可能かチェック
    if (!window.ConversationGatekeeper) {
        console.log('⚠️ ConversationGatekeeperが未初期化のため即座再生をスキップ');
        return;
    }
    
    // 🔄 発話許可チェック
    if (!window.ConversationGatekeeper.canHahoriSpeak('immediate_playback')) {
        console.log('🚫 はほりーの発話許可なし - 即座再生をスキップ');
        return;
    }
    
    // 🔄 状況適応システム統合
    if (window.DualPreemptiveOptimization?.phase1.isActive) {
        const situation = window.DualPreemptiveOptimization.phase1.situationAnalyzer.analyzeConversationSituation(window.SPEAKERS?.NULL, null);
        const strategy = window.DualPreemptiveOptimization.phase1.situationAnalyzer.determinePreemptiveStrategy(situation);
        
        if (strategy.trigger === 'none') {
            console.log('🚫 状況適応システムが即座再生を無効化');
            return;
        }
    }
    
    // 先読み生成された応答があるかチェック
    if (!hahoriPreemptiveGeneration.generatedResponse) {
        console.log('📝 先読み生成された応答がありません');
        
        // 🔄 統合フォールバック: 即座生成
        try {
            const conversationContext = window.AppState?.conversationHistory?.map(msg => msg.content).join(' ') || '';
            const themeContext = window.AppState?.selectedThemeDetails?.map(theme => theme.summary).join(' ') || '';
            const prompt = hahoriPreemptiveGeneration.createIntegratedHahoriPrompt(conversationContext, themeContext);
            
            const response = await hahoriPreemptiveGeneration.generateHahoriResponseAsync(prompt);
            if (response && response.trim()) {
                hahoriPreemptiveGeneration.generatedResponse = response;
                console.log('✅ 即座生成完了');
            } else {
                console.log('⚠️ 即座生成結果が空');
                return;
            }
        } catch (error) {
            console.error('❌ 即座生成エラー:', error);
            return;
        }
    }
    
    // 🔄 発話開始登録
    window.ConversationGatekeeper.registerSpeechStart(window.SPEAKERS?.HAHORI, 'immediate_playback');
    
    try {
        // 🔄 統合処理: 音声合成と再生
        const audioBlob = await window.ttsTextToAudioBlob(hahoriPreemptiveGeneration.generatedResponse, window.SPEAKERS?.HAHORI);
        
        // チャットに追加
        await window.addMessageToChat(window.SPEAKERS?.HAHORI, hahoriPreemptiveGeneration.generatedResponse);
        
        // 音声再生
        await window.playPreGeneratedAudio(audioBlob, window.SPEAKERS?.HAHORI);
        
        // 🔄 統合クリーンアップ
        hahoriPreemptiveGeneration.generatedResponse = null;
        hahoriPreemptiveGeneration.lastPlaybackTime = Date.now();
        
        console.log('✅ はほりーの即座再生完了');
        
    } catch (error) {
        console.error('❌ はほりーの即座再生エラー:', error);
    } finally {
        // 🔄 発話終了登録
        window.ConversationGatekeeper.registerSpeechEnd(window.SPEAKERS?.HAHORI, 'immediate_playback');
    }
}

// 🔧 Phase C: Pendingはほりーのの再生チェック
async function playPendingHahoriIfNeeded() {
    console.log('🎵 はほりーのPending再生チェック');
    
    // ConversationGatekeeperが利用可能かチェック
    if (!window.ConversationGatekeeper) {
        console.log('⚠️ ConversationGatekeeperが未初期化のためPending再生をスキップ');
        return;
    }
    
    // 🔄 発話許可チェック
    if (!window.ConversationGatekeeper.canHahoriSpeak('pending_playback')) {
        console.log('🚫 はほりーの発話許可なし - Pending再生をスキップ');
        return;
    }
    
    // 先読み生成された応答があるかチェック
    if (!hahoriPreemptiveGeneration.generatedResponse) {
        console.log('📝 Pending再生する応答がありません');
        return;
    }
    
    // 🔄 発話開始登録
    window.ConversationGatekeeper.registerSpeechStart(window.SPEAKERS?.HAHORI, 'pending_playback');
    
    try {
        // 🔄 統合処理: 音声合成と再生
        const audioBlob = await window.ttsTextToAudioBlob(hahoriPreemptiveGeneration.generatedResponse, window.SPEAKERS?.HAHORI);
        
        // チャットに追加
        await window.addMessageToChat(window.SPEAKERS?.HAHORI, hahoriPreemptiveGeneration.generatedResponse);
        
        // 音声再生
        await window.playPreGeneratedAudio(audioBlob, window.SPEAKERS?.HAHORI);
        
        // 🔄 統合クリーンアップ
        hahoriPreemptiveGeneration.generatedResponse = null;
        hahoriPreemptiveGeneration.lastPlaybackTime = Date.now();
        
        console.log('✅ はほりーのPending再生完了');
        
    } catch (error) {
        console.error('❌ はほりーのPending再生エラー:', error);
    } finally {
        // 🔄 発話終了登録
        window.ConversationGatekeeper.registerSpeechEnd(window.SPEAKERS?.HAHORI, 'pending_playback');
    }
}

// =================================================================================
// VOICE PHASE 2 MANAGER - 統合管理システム
// =================================================================================

const VoicePhase2Manager = {
    // システム情報
    version: '2.0.0',
    created: '2025-01-06',
    
    // 管理対象オブジェクト
    VoiceOptimization,
    DualPreemptiveOptimization,
    
    // 管理対象関数
    functions: {
        // ねほりー関数群
        startNehoriGenerationDuringHahori,
        handleNehoriImmediatePlayback,
        playPendingNehoriIfNeeded,
        generateAndPlayNehoriImmediately,
        
        // はほりー関数群
        startHahoriGenerationDuringNehori,
        handleHahoriImmediatePlayback,
        playPendingHahoriIfNeeded
    },
    
    // デバッグ・管理機能
    debug: {
        // 依存関係チェック
        validateDependencies() {
            const required = [
                'AppState',
                'SPEAKERS',
                'gptMessagesToCharacterResponse',
                'ttsTextToAudioBlob',
                'addMessageToChat',
                'playPreGeneratedAudio'
            ];
            
            const missing = required.filter(dep => {
                if (dep === 'AppState') return typeof window.AppState === 'undefined';
                if (dep === 'SPEAKERS') return typeof window.SPEAKERS === 'undefined';
                return typeof window[dep] === 'undefined';
            });
            
            if (missing.length > 0) {
                console.warn('⚠️ VoicePhase2Manager 依存関係不足:', missing);
                console.log('📝 不足している依存関係は後で利用可能になる予定です');
                
                // 詳細診断
                missing.forEach(dep => {
                    const status = (dep === 'AppState' ? typeof window.AppState : 
                                   dep === 'SPEAKERS' ? typeof window.SPEAKERS : 
                                   typeof window[dep]) !== 'undefined' ? 'OK' : 'MISSING';
                    console.log(`  ${status === 'OK' ? '✅' : '❌'} ${dep}: ${status}`);
                });
                
                return false;
            }
            
            return true;
        },
        
        // システム状態確認
        getSystemStatus() {
            return {
                voiceOptimization: {
                    isActive: VoiceOptimization.phase3.isActive,
                    isGenerating: VoiceOptimization.phase3.isGeneratingNehori,
                    hasPending: !!(VoiceOptimization.phase3.pendingNehoriContent && VoiceOptimization.phase3.pendingNehoriAudio)
                },
                dualPreemptiveOptimization: {
                    isActive: DualPreemptiveOptimization.phase1.isActive,
                    isGenerating: DualPreemptiveOptimization.phase1.isGeneratingHahori,
                    hasPending: !!(DualPreemptiveOptimization.phase1.pendingHahoriContent && DualPreemptiveOptimization.phase1.pendingHahoriAudio)
                }
            };
        },
        
        // 緊急リセット
        emergencyReset() {
            console.warn('🚨 VoicePhase2Manager 緊急リセット実行');
            
            // VoiceOptimization リセット
            VoiceOptimization.phase3.pendingNehoriContent = null;
            VoiceOptimization.phase3.pendingNehoriAudio = null;
            VoiceOptimization.phase3.isGeneratingNehori = false;
            VoiceOptimization.phase3.shouldPlayNehoriImmediately = false;
            
            // DualPreemptiveOptimization リセット
            DualPreemptiveOptimization.phase1.pendingHahoriContent = null;
            DualPreemptiveOptimization.phase1.pendingHahoriAudio = null;
            DualPreemptiveOptimization.phase1.isGeneratingHahori = false;
            DualPreemptiveOptimization.phase1.shouldPlayHahoriImmediately = false;
            
            console.log('✅ VoicePhase2Manager 緊急リセット完了');
        }
    },
    
    // 初期化
    initialize(force = false) {
        console.log('🚀 VoicePhase2Manager 初期化開始');
        
        // 強制初期化または依存関係チェック
        if (!force && !this.debug.validateDependencies()) {
            console.warn('⚠️ VoicePhase2Manager 初期化スキップ: 依存関係待機中');
            return false;
        }
        
        // 部分初期化モード（一部依存関係が不足していても基本機能は有効化）
        if (force) {
            console.log('🔧 VoicePhase2Manager 部分初期化モード（依存関係不足でも基本機能有効化）');
        }
        
        console.log('✅ VoicePhase2Manager 初期化完了');
        return true;
    }
};

// =================================================================================
// GLOBAL EXPORTS - グローバル公開（完全後方互換性確保）
// =================================================================================

// 完全後方互換性のためのグローバル公開
window.VoicePhase2Manager = VoicePhase2Manager;

// 既存参照の完全維持
window.VoiceOptimization = VoiceOptimization;
window.DualPreemptiveOptimization = DualPreemptiveOptimization;

// 既存関数の完全維持
window.startNehoriGenerationDuringHahori = startNehoriGenerationDuringHahori;
window.handleNehoriImmediatePlayback = handleNehoriImmediatePlayback;
window.playPendingNehoriIfNeeded = playPendingNehoriIfNeeded;
window.generateAndPlayNehoriImmediately = generateAndPlayNehoriImmediately;

window.startHahoriGenerationDuringNehori = startHahoriGenerationDuringNehori;
window.handleHahoriImmediatePlayback = handleHahoriImmediatePlayback;
window.playPendingHahoriIfNeeded = playPendingHahoriIfNeeded;

// 遅延初期化（script.js読み込み後に実行）
function initializeVoicePhase2ManagerWhenReady() {
    // 依存関係のチェック
    const checkDependencies = () => {
        return window.AppState && 
               window.SPEAKERS && 
               window.gptMessagesToCharacterResponse && 
               window.ttsTextToAudioBlob && 
               window.addMessageToChat && 
               window.playPreGeneratedAudio;
    };
    
    if (checkDependencies()) {
        console.log('🚀 VoicePhase2Manager 依存関係確認済み - 初期化開始');
        const initialized = VoicePhase2Manager.initialize();
        if (initialized) {
            console.log('✅ VoicePhase2Manager 初期化完了');
        } else {
                    console.log('🔧 VoicePhase2Manager 強制初期化実行（部分機能モード）');
            VoicePhase2Manager.initialize(true);
                }
    } else {
        console.log('⚠️ VoicePhase2Manager 依存関係待機中 - 再試行します');
        setTimeout(initializeVoicePhase2ManagerWhenReady, 1000);
        }
}

// DOM読み込み完了後に初期化開始
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeVoicePhase2ManagerWhenReady, 1000);
    });
} else {
    // 既にDOMが読み込まれている場合
    setTimeout(initializeVoicePhase2ManagerWhenReady, 1000);
}

console.log('✅ VoicePhase2Manager モジュール読み込み完了');
console.log('📊 分離対象: VoiceOptimization、DualPreemptiveOptimization、8つの音声関数');
console.log('🛡️ 完全後方互換性確保: 既存参照は全て維持'); 