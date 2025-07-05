// =================================================================================
// VOICE PHASE2 MANAGER - 音声システムPhase2管理（安全版）
// =================================================================================
// 🔧 音声システムPhase2: 先読み最適化システム
// - 完全な後方互換性確保
// - 元のオブジェクト構造維持
// - 段階的移行対応
// =================================================================================

/**
 * 音声システムPhase2マネージャー（安全版）
 * 既存のDualPreemptiveOptimization/VoiceOptimizationと完全互換
 */
const VoicePhase2Manager = {
    // 初期化状態
    isInitialized: false,
    
    // 依存関係管理
    dependencies: {
        speakers: null,
        appState: null,
        conversationGatekeeper: null,
        gptMessagesToCharacterResponse: null,
        ttsTextToAudioBlob: null,
        addMessageToChat: null,
        playPreGeneratedAudio: null,
        askNextQuestionInDeepDive: null,
        showMessage: null
    },
    
    /**
     * 初期化
     */
    init() {
        if (this.isInitialized) {
            console.log('⚠️ VoicePhase2Manager: 既に初期化済み');
            return;
        }
        
        try {
            // 依存関係の検証
            if (!this.validateDependencies()) {
                console.error('❌ VoicePhase2Manager: 依存関係の検証に失敗');
                return false;
            }
            
            console.log('✅ VoicePhase2Manager: 初期化完了');
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ VoicePhase2Manager初期化エラー:', error);
            return false;
        }
    },
    
    /**
     * 依存関係の検証
     */
    validateDependencies() {
        const missing = [];
        
        // 必須依存関係をチェック
        if (!window.SPEAKERS) missing.push('SPEAKERS');
        if (!window.AppState) missing.push('AppState');
        if (!window.ConversationGatekeeper) missing.push('ConversationGatekeeper');
        if (typeof window.gptMessagesToCharacterResponse !== 'function') missing.push('gptMessagesToCharacterResponse');
        if (typeof window.ttsTextToAudioBlob !== 'function') missing.push('ttsTextToAudioBlob');
        if (typeof window.addMessageToChat !== 'function') missing.push('addMessageToChat');
        if (typeof window.playPreGeneratedAudio !== 'function') missing.push('playPreGeneratedAudio');
        if (typeof window.askNextQuestionInDeepDive !== 'function') missing.push('askNextQuestionInDeepDive');
        if (typeof window.showMessage !== 'function') missing.push('showMessage');
        
        if (missing.length > 0) {
            console.warn('⚠️ VoicePhase2Manager依存関係不足:', missing);
            return false;
        }
        
        // 依存関係を設定
        this.dependencies.speakers = window.SPEAKERS;
        this.dependencies.appState = window.AppState;
        this.dependencies.conversationGatekeeper = window.ConversationGatekeeper;
        this.dependencies.gptMessagesToCharacterResponse = window.gptMessagesToCharacterResponse;
        this.dependencies.ttsTextToAudioBlob = window.ttsTextToAudioBlob;
        this.dependencies.addMessageToChat = window.addMessageToChat;
        this.dependencies.playPreGeneratedAudio = window.playPreGeneratedAudio;
        this.dependencies.askNextQuestionInDeepDive = window.askNextQuestionInDeepDive;
        this.dependencies.showMessage = window.showMessage;
        
        return true;
    },
    
    /**
     * VoiceOptimizationオブジェクトの取得（互換性）
     */
    getVoiceOptimization() {
        // 既存のVoiceOptimizationオブジェクトを返す
        return window.VoiceOptimization || {
            phase3: {
                isActive: true,
                pendingNehoriContent: null,
                pendingNehoriAudio: null,
                isGeneratingNehori: false,
                hahoriSpeechStartTime: null,
                shouldPlayNehoriImmediately: false
            }
        };
    },
    
    /**
     * DualPreemptiveOptimizationオブジェクトの取得（互換性）
     */
    getDualPreemptiveOptimization() {
        // 既存のDualPreemptiveOptimizationオブジェクトを返す
        return window.DualPreemptiveOptimization || {
            phase1: {
                isActive: true,
                pendingHahoriContent: null,
                pendingHahoriAudio: null,
                isGeneratingHahori: false,
                nehoriSpeechStartTime: null,
                shouldPlayHahoriImmediately: false,
                adaptiveStrategy: {
                    nehoriSpeaking: { trigger: 'immediate', priority: 'high', context: 'knowledge_evaluation' },
                    hahoriSpeaking: { trigger: 'delayed', priority: 'medium', context: 'next_question' },
                    userSpeaking: { trigger: 'smart', priority: 'adaptive', context: 'response_preparation' }
                },
                situationAnalyzer: {
                    analyzeConversationSituation: (currentSpeaker, userInput) => {
                        // 既存のロジックを保持
                        const recentMessages = this.dependencies.appState?.conversationHistory?.slice(-3) || [];
                        const hasUserInput = userInput && userInput.trim().length > 0;
                        const isKnowledgeConfirmation = this.dependencies.appState?.voiceRecognitionState?.isKnowledgeConfirmationMode;
                        
                        if (isKnowledgeConfirmation) {
                            return 'knowledge_confirmation';
                        } else if (currentSpeaker === this.dependencies.speakers?.NEHORI) {
                            return 'nehori_speaking';
                        } else if (currentSpeaker === this.dependencies.speakers?.HAHORI) {
                            return 'hahori_speaking';
                        } else if (hasUserInput) {
                            return 'user_speaking';
                        } else {
                            return 'idle';
                        }
                    },
                    determinePreemptiveStrategy: (situation) => {
                        // 既存のロジックを保持
                        const strategies = {
                            nehori_speaking: {
                                trigger: 'immediate',
                                priority: 'high',
                                context: 'knowledge_evaluation',
                                delay: 1000,
                                targetSpeaker: this.dependencies.speakers?.HAHORI
                            },
                            hahori_speaking: {
                                trigger: 'delayed',
                                priority: 'medium',
                                context: 'next_question',
                                delay: 2000,
                                targetSpeaker: this.dependencies.speakers?.NEHORI
                            },
                            user_speaking: {
                                trigger: 'smart',
                                priority: 'adaptive',
                                context: 'response_preparation',
                                delay: 1500,
                                targetSpeaker: 'both'
                            },
                            knowledge_confirmation: {
                                trigger: 'none',
                                priority: 'none',
                                context: 'none',
                                delay: 0,
                                targetSpeaker: 'none'
                            },
                            idle: {
                                trigger: 'none',
                                priority: 'none',
                                context: 'none',
                                delay: 0,
                                targetSpeaker: 'none'
                            }
                        };
                        
                        return strategies[situation] || strategies.idle;
                    }
                }
            }
        };
    },
    
    /**
     * デバッグ情報の表示
     */
    debug() {
        console.log('🔍 VoicePhase2Manager デバッグ情報:');
        console.log('- 初期化状態:', this.isInitialized);
        console.log('- 依存関係:', this.dependencies);
        console.log('- VoiceOptimization:', this.getVoiceOptimization());
        console.log('- DualPreemptiveOptimization:', this.getDualPreemptiveOptimization());
    },
    
    /**
     * 緊急リセット
     */
    emergencyReset() {
        console.log('🚨 VoicePhase2Manager: 緊急リセット実行');
        this.isInitialized = false;
        
        // 依存関係をクリア
        Object.keys(this.dependencies).forEach(key => {
            this.dependencies[key] = null;
        });
        
        console.log('✅ VoicePhase2Manager: 緊急リセット完了');
    },
    
    // =================================================================================
    // 音声システムPhase2関数群
    // =================================================================================
    
    /**
     * ねほりーの先読み生成（はほりー発声中）
     */
    async startNehoriGenerationDuringHahori() {
        if (!this.isInitialized) {
            console.warn('⚠️ VoicePhase2Manager: 未初期化のため元の関数を呼び出し');
            return window.startNehoriGenerationDuringHahori?.();
        }
        
        const voiceOpt = this.getVoiceOptimization();
        const appState = this.dependencies.appState;
        const conversationGatekeeper = this.dependencies.conversationGatekeeper;
        
        // 🛡️ 初期条件チェック
        if (voiceOpt.phase3.isGeneratingNehori || appState.phase !== 'deepdive') {
            return;
        }
        
        // 🛡️ ゲートキーパーチェック - 生成前の許可確認
        if (!conversationGatekeeper.canNehoriSpeak('generationStart')) {
            console.log('🚫 ねほりーの質問生成をゲートキーパーがブロック');
            return;
        }
        
        const control = appState.conversationControl;
        voiceOpt.phase3.isGeneratingNehori = true;
        voiceOpt.phase3.shouldPlayNehoriImmediately = true;
        
        try {
            const recentConversation = appState.conversationHistory
                .slice(-6)
                .map(msg => `${msg.sender}: ${msg.content}`)
                .join('\n');
            const knowledgeContext = appState.extractedKnowledge
                .map((knowledge, index) => `知見${index + 1}: ${knowledge.summary}`)
                .join('\n');
                
            if (!window.AI_PROMPTS || !window.AI_PROMPTS.DEEPDIVE_NEXT) {
                console.error('❌ AI_PROMPTS.DEEPDIVE_NEXT が読み込まれていません');
                this.dependencies.showMessage('error', 'プロンプト設定の読み込みに失敗しました。ページを再読み込みしてください。');
                return;
            }
            
            const nextQuestionPrompt = window.AI_PROMPTS.DEEPDIVE_NEXT(
                appState.currentTheme,
                recentConversation,
                knowledgeContext,
                appState.selectedThemeDetails,
                appState.themeSummaries
            );
            
            const nehoriContent = await this.dependencies.gptMessagesToCharacterResponse([
                { role: 'user', content: nextQuestionPrompt }
            ], this.dependencies.speakers.NEHORI);
            const nehoriAudio = await this.dependencies.ttsTextToAudioBlob(nehoriContent, this.dependencies.speakers.NEHORI);
            
            voiceOpt.phase3.pendingNehoriContent = nehoriContent;
            voiceOpt.phase3.pendingNehoriAudio = nehoriAudio;
            voiceOpt.phase3.isGeneratingNehori = false;
            
            // 🛡️ 生成完了後の再チェック - 状態が変わった可能性
            if (!conversationGatekeeper.canNehoriSpeak('generationComplete')) {
                console.log('🔄 生成完了後にPendingに保存（知見確認モード等）');
                control.pendingNehoriQuestion = nehoriContent;
                control.pendingNehoriAudio = nehoriAudio;
                return;
            }
            
            // ✅ 安全な再生
            await this.handleNehoriImmediatePlayback();
            
        } catch (error) {
            console.error('❌ ねほりーの質問生成エラー:', error);
            voiceOpt.phase3.isGeneratingNehori = false;
            voiceOpt.phase3.shouldPlayNehoriImmediately = false;
        }
    },
    
    /**
     * ねほりーの即座再生
     */
    async handleNehoriImmediatePlayback() {
        if (!this.isInitialized) {
            console.warn('⚠️ VoicePhase2Manager: 未初期化のため元の関数を呼び出し');
            return window.handleNehoriImmediatePlayback?.();
        }
        
        const conversationGatekeeper = this.dependencies.conversationGatekeeper;
        const appState = this.dependencies.appState;
        const voiceOpt = this.getVoiceOptimization();
        
        // 🛡️ ゲートキーパーチェック - 再生前の許可確認
        if (!conversationGatekeeper.canNehoriSpeak('immediatePlayback')) {
            console.log('🚫 ねほりーの即座再生をゲートキーパーがブロック');
            return;
        }
        
        const control = appState.conversationControl;
        
        try {
            // 📋 AppState.pendingからの再生（レガシー対応）
            if (appState.pendingNehoriQuestion && appState.pendingNehoriAudio) {
                console.log('🔄 AppState.pendingからねほりーのを再生');
                
                conversationGatekeeper.registerSpeechStart(this.dependencies.speakers.NEHORI, 'appStatePending');
                
                await this.dependencies.addMessageToChat(this.dependencies.speakers.NEHORI, appState.pendingNehoriQuestion);
                await this.dependencies.playPreGeneratedAudio(appState.pendingNehoriAudio, this.dependencies.speakers.NEHORI);
                
                // クリアアップ
                appState.pendingNehoriQuestion = null;
                appState.pendingNehoriAudio = null;
                control.justPlayedPendingNehori = true;
                
                conversationGatekeeper.registerSpeechEnd(this.dependencies.speakers.NEHORI, 'appStatePending');
                
                // 短時間後にフラグをリセット
                setTimeout(() => { control.justPlayedPendingNehori = false; }, 100);
                return;
            }
            
            // 📋 conversationControlからの再生（新システム）
            if (control.pendingNehoriQuestion && control.pendingNehoriAudio) {
                console.log('🔄 conversationControlからねほりーのを再生');
                
                conversationGatekeeper.registerSpeechStart(this.dependencies.speakers.NEHORI, 'controlPending');
                
                await this.dependencies.addMessageToChat(this.dependencies.speakers.NEHORI, control.pendingNehoriQuestion);
                await this.dependencies.playPreGeneratedAudio(control.pendingNehoriAudio, this.dependencies.speakers.NEHORI);
                
                // クリアアップ
                control.pendingNehoriQuestion = null;
                control.pendingNehoriAudio = null;
                control.justPlayedPendingNehori = true;
                
                conversationGatekeeper.registerSpeechEnd(this.dependencies.speakers.NEHORI, 'controlPending');
                
                // 短時間後にフラグをリセット
                setTimeout(() => { control.justPlayedPendingNehori = false; }, 100);
                return;
            }
            
            // 📋 Phase3最適化からの再生
            if (voiceOpt.phase3.pendingNehoriContent && voiceOpt.phase3.pendingNehoriAudio) {
                console.log('🔄 Phase3最適化からねほりーのを再生');
                
                conversationGatekeeper.registerSpeechStart(this.dependencies.speakers.NEHORI, 'phase3Optimization');
                
                await this.dependencies.addMessageToChat(this.dependencies.speakers.NEHORI, voiceOpt.phase3.pendingNehoriContent);
                await this.dependencies.playPreGeneratedAudio(voiceOpt.phase3.pendingNehoriAudio, this.dependencies.speakers.NEHORI);
                
                // クリアアップ
                voiceOpt.phase3.pendingNehoriContent = null;
                voiceOpt.phase3.pendingNehoriAudio = null;
                voiceOpt.phase3.shouldPlayNehoriImmediately = false;
                control.justPlayedPendingNehori = true;
                
                conversationGatekeeper.registerSpeechEnd(this.dependencies.speakers.NEHORI, 'phase3Optimization');
                
                // 短時間後にフラグをリセット
                setTimeout(() => { control.justPlayedPendingNehori = false; }, 100);
                return;
            }
            
            // 📋 Pendingがない場合は新しい質問を生成
            console.log('📝 Pendingがないため新しい質問を生成');
            await this.dependencies.askNextQuestionInDeepDive();
            
        } catch (error) {
            console.error('❌ ねほりーの再生エラー:', error);
            conversationGatekeeper.registerSpeechEnd(this.dependencies.speakers.NEHORI, 'error');
        }
    }
};

// =================================================================================
// グローバル公開・後方互換性確保
// =================================================================================

// windowオブジェクトに公開
if (typeof window !== 'undefined') {
    window.VoicePhase2Manager = VoicePhase2Manager;
    
    // デバッグ関数もグローバルに公開
    window.debugVoicePhase2 = () => VoicePhase2Manager.debug();
    window.emergencyResetVoicePhase2 = () => VoicePhase2Manager.emergencyReset();
    
    // 後方互換性確保 - 既存の関数名でアクセス可能
    window.startNehoriGenerationDuringHahori = () => VoicePhase2Manager.startNehoriGenerationDuringHahori();
    window.handleNehoriImmediatePlayback = () => VoicePhase2Manager.handleNehoriImmediatePlayback();
}

// 初期化の実行（DOMContentLoadedで安全に実行）
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => VoicePhase2Manager.init(), 100);
        });
    } else {
        setTimeout(() => VoicePhase2Manager.init(), 100);
    }
}

console.log('📦 VoicePhase2Manager モジュール読み込み完了'); 