/**
 * VoiceProcessingManager v1.0 (Phase 1)
 * ----------------------------------------
 * 音声コマンドシステムの新しい統一処理管理システム
 * 
 * Phase 1: 基盤構築
 * - 従来機能の完全保持
 * - script.jsとの安全な連携
 * - デバッグ・ログシステム
 */

(function(global) {
    'use strict';
    
    if (!global || !global.window) {
        console.error('VoiceProcessingManager: window オブジェクトが見つかりません');
        return;
    }

    class VoiceProcessingManager {
        constructor() {
            this.isInitialized = false;
            this.debugMode = true;
            this.version = '1.0-phase1';
            
            // 処理統計
            this.stats = {
                totalProcessed: 0,
                themeChangeRequests: 0,
                questionChangeRequests: 0,
                fallbackCalls: 0,
                errorCount: 0,
                startTime: Date.now()
            };
            
            // デバッグログ
            this.debugLog = [];
            this.maxLogEntries = 100;
            
            console.log(`🚀 VoiceProcessingManager v${this.version} 初期化開始`);
        }
        
        /**
         * 初期化処理
         */
        async initialize() {
            if (this.isInitialized) {
                this.log('warn', 'VoiceProcessingManager は既に初期化済みです');
                return true;
            }
            
            try {
                // 従来システムとの連携確認
                if (typeof window.processFinalTranscript !== 'function') {
                    throw new Error('従来のprocessFinalTranscript関数が見つかりません');
                }
                
                this.isInitialized = true;
                this.log('info', 'VoiceProcessingManager 初期化完了');
                return true;
                
            } catch (error) {
                this.log('error', `初期化エラー: ${error.message}`);
                return false;
            }
        }
        
        /**
         * メイン音声処理関数（Phase 1: 基本仲介機能）
         */
        async processFinalTranscript(text) {
            if (!this.isInitialized) {
                this.log('warn', '未初期化状態 - フォールバックに移行');
                return await this.fallbackToOriginal(text);
            }
            
            const startTime = performance.now();
            this.stats.totalProcessed++;
            
            try {
                this.log('info', `音声処理開始: "${text}"`);
                
                // Phase 2: テーマ変更要望検出・処理
                const themeChangeRequest = this.detectThemeChangeRequest(text);
                if (themeChangeRequest) {
                    this.stats.themeChangeRequests++;
                    this.log('info', `テーマ変更要望検出: "${themeChangeRequest.request}"`);
                    return await this.handleThemeChangeWithRequest(themeChangeRequest);
                }
                
                // Phase 2: 質問変更要望検出・処理
                const questionChangeRequest = this.detectQuestionChangeRequest(text);
                if (questionChangeRequest) {
                    this.stats.questionChangeRequests++;
                    this.log('info', `質問変更要望検出: "${questionChangeRequest.request}"`);
                    return await this.handleQuestionChangeWithRequest(questionChangeRequest);
                }
                
                // TODO Phase 3: 削除コマンド改良処理
                
                // Phase 1: 従来のprocessFinalTranscript呼び出し
                const result = await this.callOriginalProcessor(text);
                
                const duration = performance.now() - startTime;
                this.log('info', `音声処理完了 (${duration.toFixed(2)}ms)`);
                
                return result;
                
            } catch (error) {
                this.stats.errorCount++;
                this.log('error', `処理エラー: ${error.message}`);
                
                // エラー時はフォールバックを実行
                return await this.fallbackToOriginal(text);
            }
        }
        
        /**
         * 従来のprocessFinalTranscript呼び出し
         */
        async callOriginalProcessor(text) {
            if (typeof window.processFinalTranscriptOriginal === 'function') {
                return await window.processFinalTranscriptOriginal(text);
            }
            
            // フォールバック: グローバルのprocessFinalTranscriptを直接呼び出し
            if (typeof window.processFinalTranscript === 'function') {
                // 一時的に自分自身を無効化して無限ループを防ぐ
                const temp = window.processFinalTranscript;
                window.processFinalTranscript = null;
                
                try {
                    const result = await temp(text);
                    window.processFinalTranscript = temp;
                    return result;
                } catch (error) {
                    window.processFinalTranscript = temp;
                    throw error;
                }
            }
            
            throw new Error('従来のprocessFinalTranscript関数が利用できません');
        }
        
        /**
         * フォールバック処理
         */
        async fallbackToOriginal(text) {
            this.stats.fallbackCalls++;
            this.log('warn', `フォールバック実行: "${text}"`);
            
            try {
                return await this.callOriginalProcessor(text);
            } catch (error) {
                this.log('error', `フォールバック失敗: ${error.message}`);
                throw error;
            }
        }
        
        // =================================================================================
        // Phase 2: AI会話継続機能実装
        // =================================================================================
        
        /**
         * テーマ変更要望検出
         */
        detectThemeChangeRequest(text) {
            // テーマ変更パターンの定義
            const patterns = [
                /テーマ変更[、,]\s*(.+)/i,
                /テーマを変えて[、,]\s*(.+)/i,
                /テーマ変更して[、,]\s*(.+)/i,
                /新しいテーマで[、,]\s*(.+)/i
            ];
            
            const basicPatterns = [
                /テーマ変更/i,
                /テーマを変え/i
            ];
            
            // 具体的要望付きのパターンを優先チェック
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    const request = match[1].trim();
                    if (request) {
                        return {
                            type: 'theme_change_with_request',
                            request: request,
                            originalText: text
                        };
                    }
                }
            }
            
            // 基本パターンのチェック
            for (const pattern of basicPatterns) {
                if (pattern.test(text)) {
                    return {
                        type: 'theme_change_basic',
                        request: null,
                        originalText: text
                    };
                }
            }
            
            return null;
        }
        
        /**
         * 質問変更要望検出
         */
        detectQuestionChangeRequest(text) {
            // 質問変更パターンの定義
            const patterns = [
                /質問変更[、,]\s*(.+)/i,
                /質問を変えて[、,]\s*(.+)/i,
                /別の質問で[、,]\s*(.+)/i,
                /質問変更して[、,]\s*(.+)/i
            ];
            
            const basicPatterns = [
                /質問変更/i,
                /質問を変え/i,
                /別の質問/i
            ];
            
            // 具体的要望付きのパターンを優先チェック
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    const request = match[1].trim();
                    if (request) {
                        return {
                            type: 'question_change_with_request',
                            request: request,
                            originalText: text
                        };
                    }
                }
            }
            
            // 基本パターンのチェック
            for (const pattern of basicPatterns) {
                if (pattern.test(text)) {
                    return {
                        type: 'question_change_basic',
                        request: null,
                        originalText: text
                    };
                }
            }
            
            return null;
        }
        
        /**
         * テーマ変更要望付きハンドリング
         */
        async handleThemeChangeWithRequest(requestData) {
            try {
                if (requestData.request) {
                    // 要望付きの場合：AI promptに組み込み
                    const enhancedMessage = `テーマの変更をご希望ですね。「${requestData.request}」という観点で新しいテーマを教えてください。「新しいテーマは○○です、どうぞ」とおっしゃってください。`;
                    
                    this.log('info', `テーマ変更要望組み込み: "${requestData.request}"`);
                    
                    // 従来のhandleThemeChangeと同様の処理
                    const [, audioBlob] = await Promise.all([
                        window.addMessageToChat(window.SPEAKERS?.HAHORI || 'hahori', enhancedMessage),
                        window.ttsTextToAudioBlob(enhancedMessage, window.SPEAKERS?.HAHORI || 'hahori')
                    ]);
                    
                    await window.playPreGeneratedAudio(audioBlob, window.SPEAKERS?.HAHORI || 'hahori');
                    if (window.AppState) window.AppState.waitingForPermission = true;
                    
                    return { success: true, enhanced: true, request: requestData.request };
                } else {
                    // 要望なしの場合：従来のhandleThemeChangeにフォールバック
                    this.log('info', 'テーマ変更（要望なし）- 従来処理にフォールバック');
                    await window.handleThemeChange();
                    return { success: true, enhanced: false };
                }
                
            } catch (error) {
                this.log('error', `テーマ変更処理エラー: ${error.message}`);
                // エラー時は従来のhandleThemeChangeにフォールバック
                await window.handleThemeChange();
                return { success: true, enhanced: false, fallback: true };
            }
        }
        
        /**
         * 質問変更要望付きハンドリング
         */
        async handleQuestionChangeWithRequest(requestData) {
            try {
                if (requestData.request) {
                    // 要望付きの場合：AI promptに組み込み
                    const enhancedMessage = `質問を変更いたします。「${requestData.request}」という観点で新しい角度から質問させていただきますね。`;
                    
                    this.log('info', `質問変更要望組み込み: "${requestData.request}"`);
                    
                    // はほりーのメッセージ
                    const [, audioBlob] = await Promise.all([
                        window.addMessageToChat(window.SPEAKERS?.HAHORI || 'hahori', enhancedMessage),
                        window.ttsTextToAudioBlob(enhancedMessage, window.SPEAKERS?.HAHORI || 'hahori')
                    ]);
                    
                    await window.playPreGeneratedAudio(audioBlob, window.SPEAKERS?.HAHORI || 'hahori');
                    
                    // 要望を組み込んだ質問生成
                    await this.askNextQuestionWithRequest(requestData.request);
                    
                    return { success: true, enhanced: true, request: requestData.request };
                } else {
                    // 要望なしの場合：従来のhandleQuestionChangeにフォールバック
                    this.log('info', '質問変更（要望なし）- 従来処理にフォールバック');
                    await window.handleQuestionChange();
                    return { success: true, enhanced: false };
                }
                
            } catch (error) {
                this.log('error', `質問変更処理エラー: ${error.message}`);
                // エラー時は従来のhandleQuestionChangeにフォールバック
                await window.handleQuestionChange();
                return { success: true, enhanced: false, fallback: true };
            }
        }
        
        /**
         * 要望を組み込んだ質問生成
         */
        async askNextQuestionWithRequest(userRequest) {
            try {
                this.log('info', `要望組み込み質問生成開始: "${userRequest}"`);
                
                if (window.AI_PROMPTS && window.AI_PROMPTS.DEEPDIVE_NEXT && window.AppState) {
                    const conversationContext = window.AppState.conversationHistory?.map(msg => msg.content).join(' ') || '';
                    const knowledgeContext = window.AppState.extractedKnowledge?.map(k => k.summary).join(' ') || '';
                    
                    // 要望を組み込んだプロンプト拡張
                    const enhancedPrompt = window.AI_PROMPTS.DEEPDIVE_NEXT(
                        window.AppState.currentTheme,
                        conversationContext,
                        knowledgeContext,
                        window.AppState.selectedThemeDetails,
                        window.AppState.themeSummaries
                    ) + `\n\n【重要】ユーザーから「${userRequest}」という観点での質問が要望されています。この観点を踏まえて質問を生成してください。`;
                    
                    // AI応答生成
                    const question = await window.gptMessagesToCharacterResponse([
                        { role: 'user', content: enhancedPrompt }
                    ], window.SPEAKERS?.NEHORI || 'nehori');
                    
                    // 質問の追加と音声再生
                    await window.addMessageToChat(window.SPEAKERS?.NEHORI || 'nehori', question);
                    const audio = await window.ttsTextToAudioBlob(question, window.SPEAKERS?.NEHORI || 'nehori');
                    await window.playPreGeneratedAudio(audio, window.SPEAKERS?.NEHORI || 'nehori');
                    
                    this.log('info', `要望組み込み質問生成完了: "${question.substring(0, 50)}..."`);
                    
                } else {
                    // AI_PROMPTSが利用できない場合：従来のaskNextQuestionにフォールバック
                    this.log('warn', 'AI_PROMPTSが利用不可 - 従来のaskNextQuestionにフォールバック');
                    await window.askNextQuestion();
                }
                
            } catch (error) {
                this.log('error', `要望組み込み質問生成エラー: ${error.message}`);
                // エラー時は従来のaskNextQuestionにフォールバック
                await window.askNextQuestion();
            }
        }
        
        /**
         * デバッグログ記録
         */
        log(level, message) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                stats: { ...this.stats }
            };
            
            // ログ保存
            this.debugLog.push(logEntry);
            if (this.debugLog.length > this.maxLogEntries) {
                this.debugLog.shift();
            }
            
            // コンソール出力
            if (this.debugMode) {
                const prefix = `[VoiceProcessingManager]`;
                switch (level) {
                    case 'error':
                        console.error(`${prefix} ❌ ${message}`);
                        break;
                    case 'warn':
                        console.warn(`${prefix} ⚠️ ${message}`);
                        break;
                    case 'info':
                        console.info(`${prefix} ℹ️ ${message}`);
                        break;
                    default:
                        console.log(`${prefix} ${message}`);
                }
            }
        }
        
        /**
         * 統計情報取得
         */
        getStats() {
            const runtime = Date.now() - this.stats.startTime;
            return {
                ...this.stats,
                runtime,
                averageProcessingTime: this.stats.totalProcessed > 0 
                    ? runtime / this.stats.totalProcessed 
                    : 0
            };
        }
        
        /**
         * デバッグ情報取得
         */
        getDebugInfo() {
            return {
                version: this.version,
                initialized: this.isInitialized,
                debugMode: this.debugMode,
                stats: this.getStats(),
                recentLogs: this.debugLog.slice(-10)
            };
        }
    }
    
    // グローバル公開
    global.window.VoiceProcessingManager = VoiceProcessingManager;
    
    // =================================================================================
    // Phase 1: デバッグ・テスト関数群
    // =================================================================================
    
    // グローバルデバッグ関数
    global.window.VoiceProcessingManagerDebug = {
        // インスタンス取得
        getInstance: () => global.window.voiceProcessingManagerInstance,
        
        // デバッグ情報表示
        showDebugInfo: () => {
            const instance = global.window.voiceProcessingManagerInstance;
            if (instance) {
                const info = instance.getDebugInfo();
                console.group('🔍 VoiceProcessingManager Debug Info');
                console.table(info.stats);
                console.log('Recent Logs:', info.recentLogs);
                console.groupEnd();
                return info;
            } else {
                console.warn('VoiceProcessingManager インスタンスが見つかりません');
                return null;
            }
        },
        
        // 統計情報リセット
        resetStats: () => {
            const instance = global.window.voiceProcessingManagerInstance;
            if (instance) {
                instance.stats = {
                    totalProcessed: 0,
                    themeChangeRequests: 0,
                    questionChangeRequests: 0,
                    fallbackCalls: 0,
                    errorCount: 0,
                    startTime: Date.now()
                };
                instance.debugLog = [];
                console.log('✅ VoiceProcessingManager 統計情報をリセット');
                return true;
            }
            return false;
        },
        
        // テスト実行
        runBasicTest: async () => {
            console.group('🧪 VoiceProcessingManager Basic Test');
            
            try {
                const testCases = [
                    'テスト音声入力',
                    'どうぞ',
                    'テーマ変更してください'
                ];
                
                const results = [];
                
                for (const testCase of testCases) {
                    console.log(`Testing: "${testCase}"`);
                    const startTime = performance.now();
                    
                    try {
                        const result = await global.window.processFinalTranscript(testCase);
                        const duration = performance.now() - startTime;
                        
                        results.push({
                            input: testCase,
                            success: true,
                            duration: duration.toFixed(2) + 'ms',
                            result: result
                        });
                        
                        console.log(`✅ Success (${duration.toFixed(2)}ms)`);
                    } catch (error) {
                        results.push({
                            input: testCase,
                            success: false,
                            error: error.message
                        });
                        console.error(`❌ Error: ${error.message}`);
                    }
                }
                
                console.table(results);
                console.groupEnd();
                
                return results;
                
            } catch (error) {
                console.error('テスト実行エラー:', error);
                console.groupEnd();
                return null;
            }
        },
        
        // Phase 2: AI会話継続機能テスト
        runPhase2Test: async () => {
            console.group('🎯 Phase 2: AI会話継続機能テスト');
            
            try {
                const testCases = [
                    // テーマ変更テスト
                    {
                        input: 'テーマ変更',
                        expected: 'theme_change_basic',
                        description: 'テーマ変更（基本）'
                    },
                    {
                        input: 'テーマ変更、もっと技術的に',
                        expected: 'theme_change_with_request',
                        description: 'テーマ変更（要望付き）'
                    },
                    {
                        input: 'テーマを変えて、ビジネス視点で',
                        expected: 'theme_change_with_request',
                        description: 'テーマ変更（バリエーション）'
                    },
                    // 質問変更テスト
                    {
                        input: '質問変更',
                        expected: 'question_change_basic',
                        description: '質問変更（基本）'
                    },
                    {
                        input: '質問変更、もっと具体的に',
                        expected: 'question_change_with_request',
                        description: '質問変更（要望付き）'
                    },
                    {
                        input: '別の質問で、実践的な観点から',
                        expected: 'question_change_with_request',
                        description: '質問変更（バリエーション）'
                    },
                    // 通常処理テスト
                    {
                        input: 'これは通常の音声入力です',
                        expected: 'fallback_to_original',
                        description: '通常の音声入力（フォールバック）'
                    }
                ];
                
                const instance = global.window.voiceProcessingManagerInstance;
                if (!instance) {
                    console.error('❌ VoiceProcessingManagerインスタンスが見つかりません');
                    return null;
                }
                
                const results = [];
                
                for (const testCase of testCases) {
                    console.log(`\n🔍 Testing: ${testCase.description}`);
                    console.log(`   Input: "${testCase.input}"`);
                    
                    const startTime = performance.now();
                    
                    try {
                        // 検出機能のテスト
                        let detectionResult = null;
                        let detectionType = 'none';
                        
                        const themeRequest = instance.detectThemeChangeRequest(testCase.input);
                        if (themeRequest) {
                            detectionResult = themeRequest;
                            detectionType = themeRequest.type;
                        }
                        
                        const questionRequest = instance.detectQuestionChangeRequest(testCase.input);
                        if (questionRequest) {
                            detectionResult = questionRequest;
                            detectionType = questionRequest.type;
                        }
                        
                        if (!detectionResult) {
                            detectionType = 'fallback_to_original';
                        }
                        
                        const duration = performance.now() - startTime;
                        
                        // 結果の検証
                        const success = detectionType === testCase.expected ||
                                      (testCase.expected === 'theme_change_with_request' && detectionType === 'theme_change_with_request') ||
                                      (testCase.expected === 'question_change_with_request' && detectionType === 'question_change_with_request');
                        
                        results.push({
                            description: testCase.description,
                            input: testCase.input,
                            expected: testCase.expected,
                            actual: detectionType,
                            request: detectionResult?.request || null,
                            success: success,
                            duration: duration.toFixed(2) + 'ms'
                        });
                        
                        if (success) {
                            console.log(`   ✅ Success: ${detectionType}`);
                            if (detectionResult?.request) {
                                console.log(`   📝 要望内容: "${detectionResult.request}"`);
                            }
                        } else {
                            console.log(`   ❌ Failed: expected ${testCase.expected}, got ${detectionType}`);
                        }
                        
                    } catch (error) {
                        results.push({
                            description: testCase.description,
                            input: testCase.input,
                            expected: testCase.expected,
                            success: false,
                            error: error.message
                        });
                        console.error(`   ❌ Error: ${error.message}`);
                    }
                }
                
                // 結果サマリー
                console.log('\n📊 テスト結果サマリー:');
                console.table(results);
                
                const successCount = results.filter(r => r.success).length;
                const totalCount = results.length;
                const successRate = Math.round((successCount / totalCount) * 100);
                
                console.log(`\n🎯 成功率: ${successCount}/${totalCount} (${successRate}%)`);
                
                if (successRate >= 90) {
                    console.log('🎉 Phase 2テスト合格！（90%以上）');
                } else if (successRate >= 70) {
                    console.log('⚠️ Phase 2テスト部分合格（70%以上）');
                } else {
                    console.log('❌ Phase 2テスト不合格（70%未満）');
                }
                
                console.groupEnd();
                
                return {
                    results: results,
                    successCount: successCount,
                    totalCount: totalCount,
                    successRate: successRate
                };
                
            } catch (error) {
                console.error('Phase 2テスト実行エラー:', error);
                console.groupEnd();
                return null;
            }
        },
        
        // Phase 2: 実際の音声処理テスト
        runPhase2IntegrationTest: async () => {
            console.group('🔗 Phase 2: 統合テスト');
            
            try {
                const testCases = [
                    'テーマ変更、もっと実践的に',
                    '質問変更、初心者向けで'
                ];
                
                const results = [];
                
                for (const testCase of testCases) {
                    console.log(`\n🚀 Integration Test: "${testCase}"`);
                    const startTime = performance.now();
                    
                    try {
                        // 実際のprocessFinalTranscriptを呼び出し
                        const result = await global.window.processFinalTranscript(testCase);
                        const duration = performance.now() - startTime;
                        
                        results.push({
                            input: testCase,
                            success: true,
                            duration: duration.toFixed(2) + 'ms',
                            result: typeof result === 'object' ? JSON.stringify(result) : result
                        });
                        
                        console.log(`✅ Success (${duration.toFixed(2)}ms)`);
                        
                    } catch (error) {
                        results.push({
                            input: testCase,
                            success: false,
                            error: error.message
                        });
                        console.error(`❌ Error: ${error.message}`);
                    }
                }
                
                console.table(results);
                console.groupEnd();
                
                return results;
                
            } catch (error) {
                console.error('統合テスト実行エラー:', error);
                console.groupEnd();
                return null;
            }
        }
    };
    
    console.log('📦 VoiceProcessingManager クラス定義完了');
    console.log('🔧 デバッグ関数: window.VoiceProcessingManagerDebug で利用可能');

})(typeof window !== 'undefined' ? { window } : global); 