// =================================================================================
// AI MANAGER - AI統合管理システム
// =================================================================================
// 
// 🎯 目的: AI関連機能の統合管理
// - Knowledge DNAシステム (知見リライト・関係性分析)
// - QualityAssessmentSystem (品質評価システム)
// - AI通信コア (gptMessagesToCharacterResponse)
// - AI知見整理システム (enhanceKnowledgeWithAI)
// - プロンプト管理 (AI_PROMPTS統合)
//
// 🔧 Phase 2-4: SessionController・DataManager・FileManager完了後の統合
// 📝 リファクタリング実施日: 2025-01-07
// =================================================================================

/**
 * 🤖 AIManager - AI統合管理システム
 * 
 * 全てのAI関連機能を統合管理し、単一責任の原則に基づいて
 * AI通信、知見分析、品質評価を一元化します。
 */
class AIManager {
    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
        this.initializationStatus = 'pending'; // pending, in_progress, completed, failed
        this.apiKeyProvider = null;
        this.uiProvider = null;
        this.initTime = new Date();
        this.initError = null;
        
        // AI処理設定
        this.settings = {
            model: 'gpt-4o-mini',
            maxTokens: 800,
            temperature: 0.7,
            systemTimeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000
        };
        
        // 品質評価閾値
        this.qualityThresholds = {
            confidence: 0.7,
            importance: 0.6,
            actionability: 0.5,
            minimum_overall: 0.6,
            auto_accept: 0.8,
            auto_reject: 0.3
        };
        
        console.log('🤖 AIManager初期化開始...');
    }
    
    /**
     * 🔧 AIManager初期化
     * 
     * @param {Object} options - 初期化オプション
     * @param {Function} options.apiKeyProvider - APIキー取得関数
     * @param {Object} options.uiProvider - UI操作プロバイダー
     */
    async initialize(options = {}) {
        // 既に初期化が進行中の場合は、その Promise を返す
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        // 既に初期化が完了している場合
        if (this.isInitialized && this.initializationStatus === 'completed') {
            console.log('✅ AIManager: 既に初期化済み');
            return true;
        }
        
        // 初期化 Promise を作成
        this.initializationPromise = this._performInitialization(options);
        
        return this.initializationPromise;
    }
    
    /**
     * 🔧 AIManager実際の初期化処理
     * 
     * @private
     * @param {Object} options - 初期化オプション
     */
    async _performInitialization(options = {}) {
        try {
            this.initializationStatus = 'in_progress';
            console.log('🔄 AIManager初期化実行中...');
            
            // 依存関係の確認
            if (!options.apiKeyProvider) {
                throw new Error('APIキープロバイダーが必要です');
            }
            
            this.apiKeyProvider = options.apiKeyProvider;
            this.uiProvider = options.uiProvider || this._createDefaultUIProvider();
            
            // プロンプト管理の初期化
            this._initializePromptManager();
            
            // 接続テスト
            await this._testConnection();
            
            this.isInitialized = true;
            this.initializationStatus = 'completed';
            this.initError = null;
            console.log('✅ AIManager初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ AIManager初期化エラー:', error);
            this.isInitialized = false;
            this.initializationStatus = 'failed';
            this.initError = error;
            throw error;
        }
    }
    
    /**
     * 🔧 初期化完了を待機
     * 
     * @param {number} timeout - タイムアウト時間（ms）
     * @returns {Promise<boolean>} 初期化成功状態
     */
    async waitForInitialization(timeout = 30000) {
        // 既に初期化が完了している場合
        if (this.isInitialized && this.initializationStatus === 'completed') {
            return true;
        }
        
        // 初期化が失敗している場合
        if (this.initializationStatus === 'failed') {
            throw new Error(`AIManager初期化に失敗: ${this.initError?.message || 'Unknown error'}`);
        }
        
        // 初期化Promiseが存在する場合は待機
        if (this.initializationPromise) {
            try {
                const result = await Promise.race([
                    this.initializationPromise,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('AIManager初期化タイムアウト')), timeout)
                    )
                ]);
                return result;
            } catch (error) {
                console.error('❌ AIManager初期化待機エラー:', error);
                throw error;
            }
        }
        
        // 初期化が開始されていない場合
        throw new Error('AIManager初期化が開始されていません');
    }
    
    /**
     * 🔧 依存関係チェック
     */
    checkDependencies() {
        const dependencies = {
            apiKeyProvider: !!this.apiKeyProvider,
            uiProvider: !!this.uiProvider,
            prompts: !!window.AI_PROMPTS,
            initialized: this.isInitialized,
            initializationStatus: this.initializationStatus,
            initError: this.initError?.message || null
        };
        
        console.log('🔍 AIManager依存関係チェック:', dependencies);
        return dependencies;
    }
    
    // =================================================================================
    // AI通信コア機能
    // =================================================================================
    
    /**
     * 🤖 AIキャラクター通信メイン関数
     * 
     * @param {Array} messages - メッセージ配列
     * @param {string} character - キャラクター名 (nehori/hahori/system)
     * @returns {Promise<string>} AI応答
     */
    async sendToCharacter(messages, character) {
        if (!this.isInitialized) {
            throw new Error('AIManagerが初期化されていません');
        }
        
        const apiKey = await this.apiKeyProvider();
        if (!apiKey) {
            throw new Error('APIキーが設定されていません');
        }
        
        try {
            console.log(`🤖 AI通信開始: ${character}`);
            
            // キャラクタープロンプトの取得
            const characterPrompt = this._getCharacterPrompt(character);
            
            // API呼び出し
            const response = await this._callOpenAI({
                messages: [
                    { role: 'system', content: characterPrompt },
                    ...messages
                ]
            });
            
            console.log(`✅ AI通信完了: ${character}`);
            return response;
            
        } catch (error) {
            console.error(`❌ AI通信エラー (${character}):`, error);
            throw error;
        }
    }
    
    /**
     * 🔧 OpenAI API呼び出し (リトライ機能付き)
     */
    async _callOpenAI(payload, retryCount = 0) {
        try {
            // 不正なパラメータを除外してAPIリクエストを構築
            const {
                maxTokens,  // 不正なパラメータを除外
                ...validPayload
            } = payload;
            
            const requestBody = {
                model: this.settings.model,
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature,
                ...validPayload
            };
            
            console.log('🔧 APIリクエスト構築:', { 
                model: requestBody.model, 
                max_tokens: requestBody.max_tokens, 
                temperature: requestBody.temperature,
                messages: requestBody.messages?.length || 0
            });
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await this.apiKeyProvider()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
            }
            
            const result = await response.json();
            return result.choices[0].message.content;
            
        } catch (error) {
            if (retryCount < this.settings.retryAttempts) {
                console.warn(`⚠️ API呼び出し失敗、リトライ ${retryCount + 1}/${this.settings.retryAttempts}`);
                await this._delay(this.settings.retryDelay * (retryCount + 1));
                return this._callOpenAI(payload, retryCount + 1);
            }
            throw error;
        }
    }
    
    // =================================================================================
    // Knowledge DNAシステム
    // =================================================================================
    
    /**
     * 🧬 知見リライト・整理機能
     * 
     * @param {string} insightText - 知見テキスト
     * @param {Object} context - 文脈情報
     * @returns {Promise<Object>} 整理結果
     */
    async rewriteInsightForClarity(insightText, context = {}) {
        if (!insightText?.trim()) {
            return {
                enhanced: insightText,
                summary: '情報不足のため整理をスキップしました',
                categories: [],
                keywords: []
            };
        }
        
        try {
            console.log('🧬 知見リライト処理開始:', insightText.substring(0, 50) + '...');
            
            const prompt = this._buildRewritePrompt(insightText, context);
            
            const response = await this.sendToCharacter([
                { role: 'user', content: `以下の知見を整理・リライトしてください：\n\n${insightText}` }
            ], 'system');
            
            const analysis = this._parseRewriteResponse(response);
            
            console.log('✅ 知見リライト完了');
            return analysis;
            
        } catch (error) {
            console.error('❌ 知見リライトエラー:', error);
            return {
                enhanced: insightText,
                summary: 'リライト処理でエラーが発生しました',
                categories: [],
                keywords: []
            };
        }
    }
    
    /**
     * 🕸️ 知見関係性分析
     * 
     * @param {Array} insights - 知見配列
     * @returns {Promise<Object>} 関係性分析結果
     */
    async analyzeKnowledgeRelationships(insights) {
        if (!insights || insights.length < 2) {
            return {
                clusters: [],
                relationships: [],
                themes: []
            };
        }
        
        try {
            console.log('🕸️ 知見関係性分析開始...');
            
            const prompt = this._buildRelationshipPrompt();
            const insightTexts = insights.map(insight => insight.content).join('\n---\n');
            
            const response = await this.sendToCharacter([
                { role: 'user', content: `以下の知見群の関係性を分析してください：\n\n${insightTexts}` }
            ], 'system');
            
            const analysis = this._parseRelationshipResponse(response);
            
            console.log('✅ 知見関係性分析完了');
            return analysis;
            
        } catch (error) {
            console.error('❌ 知見関係性分析エラー:', error);
            return {
                clusters: [],
                relationships: [],
                themes: []
            };
        }
    }
    
    /**
     * 🧬 知見DNA生成
     * 
     * @param {Object} insight - 知見データ
     * @param {Object} enhancement - 拡張データ
     * @param {Array} relationships - 関係性データ
     * @returns {Object} 知見DNA
     */
    generateKnowledgeDNA(insight, enhancement, relationships) {
        const dna = {
            id: insight.id,
            original: insight.content,
            enhanced: enhancement.enhanced,
            summary: enhancement.summary,
            categories: enhancement.categories,
            keywords: enhancement.keywords,
            background: enhancement.background,
            actionable_points: enhancement.actionable_points,
            related_concepts: enhancement.related_concepts,
            relationships: relationships.filter(rel => 
                rel.from === insight.index || rel.to === insight.index
            ),
            quality_scores: insight.quality_scores || {},
            timestamp: insight.timestamp,
            dna_version: "1.0"
        };
        
        return dna;
    }
    
    // =================================================================================
    // 品質評価システム
    // =================================================================================
    
    /**
     * 🎯 知見品質評価
     * 
     * @param {string} insightText - 知見テキスト
     * @param {string} conversationContext - 会話文脈
     * @returns {Promise<Object>} 品質評価結果
     */
    async evaluateInsightQuality(insightText, conversationContext) {
        if (!insightText?.trim()) {
            return null;
        }
        
        try {
            console.log('🔍 知見品質評価開始...');
            
            const evaluationPrompt = this._buildQualityEvaluationPrompt(insightText, conversationContext);
            
            const response = await this.sendToCharacter([
                { role: 'user', content: evaluationPrompt }
            ], 'system');
            
            const evaluation = this._parseQualityEvaluation(response);
            
            console.log('✅ 知見品質評価完了:', evaluation);
            return evaluation;
            
        } catch (error) {
            console.error('❌ 品質評価エラー:', error);
            return null;
        }
    }
    
    /**
     * 🎯 品質評価統合処理
     * 
     * @param {string} insightText - 知見テキスト
     * @param {string} conversationContext - 会話文脈
     * @returns {Promise<Object>} 処理結果
     */
    async processInsightWithQualityAssessment(insightText, conversationContext) {
        try {
            console.log('🎯 知見品質評価プロセス開始...');
            
            // 1. 品質評価
            const qualityEvaluation = await this.evaluateInsightQuality(insightText, conversationContext);
            
            if (!qualityEvaluation) {
                console.warn('⚠️ 品質評価が取得できませんでした');
                return { accepted: false, reason: 'evaluation_failed' };
            }
            
            // 2. 自動判定
            if (qualityEvaluation.overall >= this.qualityThresholds.auto_accept && 
                qualityEvaluation.recommendation === 'ACCEPT') {
                console.log('✅ 高品質知見: 自動承認');
                return {
                    accepted: true,
                    reason: 'auto_accept',
                    evaluation: qualityEvaluation,
                    summary: qualityEvaluation.summary
                };
            }
            
            if (qualityEvaluation.overall < this.qualityThresholds.auto_reject || 
                qualityEvaluation.recommendation === 'REJECT') {
                console.log('❌ 低品質知見: 自動却下');
                return {
                    accepted: false,
                    reason: 'auto_reject',
                    evaluation: qualityEvaluation,
                    summary: qualityEvaluation.summary
                };
            }
            
            // 3. 中間品質は手動確認
            console.log('🤔 中間品質: ユーザー確認が必要');
            const userApproved = await this._promptUserConfirmation(insightText, qualityEvaluation);
            
            return {
                accepted: userApproved,
                reason: userApproved ? 'user_approved' : 'user_rejected',
                evaluation: qualityEvaluation,
                summary: qualityEvaluation.summary
            };
            
        } catch (error) {
            console.error('❌ 品質評価プロセスエラー:', error);
            return { accepted: false, reason: 'process_error' };
        }
    }
    
    // =================================================================================
    // AI知見整理システム
    // =================================================================================
    
    /**
     * 🤖 AI知見整理システム (Knowledge DNA統合)
     * 
     * @param {Object} session - セッションデータ
     * @param {boolean} showProgress - 進捗表示フラグ
     * @returns {Promise<Object>} 整理済みセッション
     */
    async enhanceKnowledgeWithAI(session, showProgress = true) {
        try {
            console.log('🤖 AI知見整理開始...');
            
            if (showProgress) {
                this.uiProvider.showProgress('🧬 Knowledge DNAシステムによる知見整理中...');
            }
            
            // Phase 1: 知見構造化・リライト
            console.log('📝 Phase 1: 知見リライト・構造化開始...');
            const enhancedSession = { ...session };
            enhancedSession.insights = [];
            
            for (let i = 0; i < session.insights.length; i++) {
                const insight = session.insights[i];
                
                try {
                    if (showProgress) {
                        this.uiProvider.showProgress(`🔄 知見 ${i + 1}/${session.insights.length} を整理中...`);
                    }
                    
                    // 知見リライト処理
                    const enhancement = await this.rewriteInsightForClarity(
                        insight.content,
                        { theme: session.meta.theme, category: session.meta.category }
                    );
                    
                    // 拡張された知見データを作成
                    const enhancedInsight = {
                        ...insight,
                        enhanced_content: enhancement.enhanced,
                        summary: enhancement.summary,
                        categories: enhancement.categories,
                        keywords: enhancement.keywords,
                        background: enhancement.background,
                        actionable_points: enhancement.actionable_points,
                        related_concepts: enhancement.related_concepts,
                        dna_enhanced: true
                    };
                    
                    enhancedSession.insights.push(enhancedInsight);
                    
                } catch (error) {
                    console.error(`❌ 知見 ${i + 1} の整理エラー:`, error);
                    // エラー時は元の知見をそのまま追加
                    enhancedSession.insights.push({
                        ...insight,
                        enhanced_content: insight.content,
                        summary: '整理処理でエラーが発生',
                        dna_enhanced: false
                    });
                }
            }
            
            // Phase 2: 関係性分析
            console.log('🕸️ Phase 2: 知見関係性分析開始...');
            if (showProgress) {
                this.uiProvider.showProgress('🕸️ 知見間の関係性を分析中...');
            }
            
            const relationships = await this.analyzeKnowledgeRelationships(enhancedSession.insights);
            enhancedSession.knowledge_graph = relationships;
            
            console.log('✅ AI知見整理完了');
            if (showProgress) {
                this.uiProvider.showSuccess('🧬 Knowledge DNAによる知見整理が完了しました！');
            }
            
            return enhancedSession;
            
        } catch (error) {
            console.error('❌ AI知見整理エラー:', error);
            if (showProgress) {
                this.uiProvider.showWarning('AI整理でエラーが発生しましたが、基本の知見は保存されます');
            }
            return session;
        }
    }
    
    // =================================================================================
    // プロンプト管理
    // =================================================================================
    
    /**
     * 🔧 プロンプト管理初期化
     */
    _initializePromptManager() {
        if (!window.AI_PROMPTS) {
            console.warn('⚠️ AI_PROMPTSが見つかりません');
            return;
        }
        
        this.prompts = window.AI_PROMPTS;
        console.log('✅ プロンプト管理初期化完了');
    }
    
    /**
     * 🎭 キャラクタープロンプト取得
     */
    _getCharacterPrompt(character) {
        // システム呼び出し対応
        if (character === 'system') {
            return 'あなたは深堀くんの知見分析を担当するAIアシスタントです。正確で有用な分析を提供してください。';
        }
        
        // 音声設定からプロンプト取得
        if (window.VoiceSettings && window.VoiceSettings[character]?.prompt?.trim()) {
            return window.VoiceSettings[character].prompt;
        }
        
        // デフォルトプロンプト
        const defaultPrompts = {
            nehori: this.prompts?.NEHORI_BASE || 'あなたは好奇心旺盛で共感力の高い深掘りインタビューAIです。',
            hahori: this.prompts?.HAHORI_BASE || 'あなたは冷静で論理的な会議進行・知見整理AIです。'
        };
        
        return defaultPrompts[character] || defaultPrompts.nehori;
    }
    
    /**
     * 🔧 リライト用プロンプト構築
     */
    _buildRewritePrompt(insightText, context) {
        return `あなたは組織の知見を整理・構造化する専門AIです。

【タスク】
提供された知見を以下の観点で整理・リライトしてください：

1. **明確化**: 曖昧な表現を具体的に
2. **構造化**: 要点を整理して読みやすく
3. **背景補完**: 文脈や前提を明確に
4. **実用性向上**: 活用しやすい形に整理

【出力形式】
以下のJSON形式で回答してください：

{
  "enhanced": "リライトされた知見内容",
  "summary": "知見の要約（1-2行）",
  "categories": ["カテゴリー1", "カテゴリー2"],
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "background": "背景・前提の説明",
  "actionable_points": ["実行可能なポイント1", "実行可能なポイント2"],
  "related_concepts": ["関連概念1", "関連概念2"]
}

【注意事項】
- 元の意味を変えずに、より明確で活用しやすい表現に
- 専門用語は必要に応じて説明を併記
- 具体例があれば活用して説明を補強
- 組織での活用を想定した整理を心がける`;
    }
    
    /**
     * 🔧 関係性分析用プロンプト構築
     */
    _buildRelationshipPrompt() {
        return `あなたは組織知識の関係性を分析する専門AIです。

【タスク】
提供された複数の知見から、以下を分析してください：

1. **知見クラスター**: 類似・関連する知見のグループ化
2. **関係性**: 知見間の因果関係、依存関係、補完関係
3. **共通テーマ**: 知見群に共通する主要テーマ

【出力形式】
以下のJSON形式で回答してください：

{
  "clusters": [
    {
      "theme": "クラスター名",
      "insights": [0, 1, 2],
      "description": "このクラスターの説明"
    }
  ],
  "relationships": [
    {
      "type": "因果関係",
      "from": 0,
      "to": 1,
      "description": "関係性の説明"
    }
  ],
  "themes": [
    {
      "name": "主要テーマ名",
      "frequency": 3,
      "description": "テーマの説明"
    }
  ]
}

【注意事項】
- insightsの配列番号は0から開始
- 関係性のタイプ：因果関係、補完関係、対立関係、前提条件など
- 意味のある関係性のみを抽出`;
    }
    
    /**
     * 🔧 品質評価プロンプト構築
     */
    _buildQualityEvaluationPrompt(insightText, conversationContext) {
        return `あなたは知見品質評価の専門AI「はほりーの」です。
以下の発言内容を分析し、ビジネスや業務における知見としての価値を評価してください。

【評価対象の発言】
${insightText}

【会話の文脈】
${conversationContext || '（会話の文脈情報なし）'}

【評価項目】
以下の各項目を0.0〜1.0で数値評価し、総合判定を行ってください：

1. 信頼性（Confidence）: 発言内容の具体性・根拠の明確さ
2. 重要性（Importance）: ビジネス・業務への影響度・価値
3. 実行可能性（Actionability）: 他の人が活用・応用できる具体性

【出力形式】
以下の形式で正確に出力してください：

CONFIDENCE: [0.0-1.0の数値]
IMPORTANCE: [0.0-1.0の数値] 
ACTIONABILITY: [0.0-1.0の数値]
OVERALL: [0.0-1.0の数値]
RECOMMENDATION: [ACCEPT/REJECT]
SUMMARY: [知見の要約（30文字以内）]
REASON: [評価理由（100文字以内）]

客観的かつ厳格に評価し、低品質な内容は遠慮なくREJECTしてください。`;
    }
    
    // =================================================================================
    // 内部ヘルパー関数
    // =================================================================================
    
    /**
     * 🔧 リライト結果解析
     */
    _parseRewriteResponse(response) {
        try {
            console.log('🔍 レスポンス解析開始:', response.substring(0, 100) + '...');
            
            // JSONブロックの抽出を試行
            const jsonPatterns = [
                /```json\n([\s\S]*?)\n```/,
                /```\n([\s\S]*?)\n```/,
                /\{[\s\S]*\}/
            ];
            
            let parsed = null;
            for (const pattern of jsonPatterns) {
                const match = response.match(pattern);
                if (match) {
                    try {
                        const jsonStr = match[1] || match[0];
                        parsed = JSON.parse(jsonStr);
                        console.log('✅ JSON解析成功:', parsed);
                        break;
                    } catch (parseError) {
                        console.warn('⚠️ JSON解析失敗、次のパターンを試行:', parseError.message);
                        continue;
                    }
                }
            }
            
            if (parsed && typeof parsed === 'object') {
                // 要約の生成
                let summary = parsed.summary;
                if (!summary || summary === 'AI整理済み') {
                    if (parsed.enhanced && typeof parsed.enhanced === 'string') {
                        const enhanced = parsed.enhanced;
                        if (enhanced.length > 50) {
                            const firstSentence = enhanced.split(/[。！？]/)[0];
                            summary = firstSentence.length > 100 ? 
                                enhanced.substring(0, 100) + '...' : 
                                firstSentence + (firstSentence.endsWith('。') ? '' : '。');
                        } else {
                            summary = enhanced;
                        }
                    }
                }
                
                return {
                    enhanced: parsed.enhanced || response,
                    summary: summary || 'AI により整理された知見です。',
                    categories: parsed.categories || [],
                    keywords: parsed.keywords || [],
                    background: parsed.background || '',
                    actionable_points: parsed.actionable_points || [],
                    related_concepts: parsed.related_concepts || []
                };
            }
            
            // JSON解析失敗時のフォールバック
            console.warn('⚠️ JSON解析完全失敗、フォールバック処理');
            let fallbackSummary = response;
            if (response.length > 100) {
                const firstSentence = response.split(/[。！？]/)[0];
                fallbackSummary = firstSentence.length > 100 ? 
                    response.substring(0, 100) + '...' : 
                    firstSentence + (firstSentence.endsWith('。') ? '' : '。');
            }
            
            return {
                enhanced: response,
                summary: fallbackSummary,
                categories: [],
                keywords: [],
                background: '',
                actionable_points: [],
                related_concepts: []
            };
            
        } catch (error) {
            console.error('❌ リライト結果解析エラー:', error);
            
            let errorSummary = response;
            if (response && response.length > 50) {
                errorSummary = response.substring(0, 50) + '...';
            }
            
            return {
                enhanced: response || '解析エラーが発生しました',
                summary: errorSummary || '解析エラー',
                categories: [],
                keywords: []
            };
        }
    }
    
    /**
     * 🔧 関係性分析結果解析
     */
    _parseRelationshipResponse(response) {
        try {
            // JSON解析を試行
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                            response.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                
                return {
                    clusters: parsed.clusters || [],
                    relationships: parsed.relationships || [],
                    themes: parsed.themes || []
                };
            }
            
            // フォールバック
            return {
                clusters: [],
                relationships: [],
                themes: []
            };
            
        } catch (error) {
            console.error('❌ 関係性分析結果解析エラー:', error);
            return {
                clusters: [],
                relationships: [],
                themes: []
            };
        }
    }
    
    /**
     * 🔧 品質評価結果解析
     */
    _parseQualityEvaluation(evaluationText) {
        const lines = evaluationText.split('\n');
        const evaluation = {
            confidence: 0.5,
            importance: 0.5,
            actionability: 0.5,
            overall: 0.5,
            recommendation: 'REJECT',
            summary: '',
            reason: ''
        };
        
        lines.forEach(line => {
            if (line.startsWith('CONFIDENCE:')) {
                evaluation.confidence = parseFloat(line.split(':')[1]?.trim()) || 0.5;
            } else if (line.startsWith('IMPORTANCE:')) {
                evaluation.importance = parseFloat(line.split(':')[1]?.trim()) || 0.5;
            } else if (line.startsWith('ACTIONABILITY:')) {
                evaluation.actionability = parseFloat(line.split(':')[1]?.trim()) || 0.5;
            } else if (line.startsWith('OVERALL:')) {
                evaluation.overall = parseFloat(line.split(':')[1]?.trim()) || 0.5;
            } else if (line.startsWith('RECOMMENDATION:')) {
                evaluation.recommendation = line.split(':')[1]?.trim().toUpperCase() || 'REJECT';
            } else if (line.startsWith('SUMMARY:')) {
                evaluation.summary = line.split(':')[1]?.trim() || '';
            } else if (line.startsWith('REASON:')) {
                evaluation.reason = line.split(':')[1]?.trim() || '';
            }
        });
        
        return evaluation;
    }
    
    /**
     * 🔧 ユーザー確認ダイアログ
     */
    async _promptUserConfirmation(insightText, qualityEvaluation) {
        try {
            const confirmationMessage = this._buildConfirmationMessage(insightText, qualityEvaluation);
            
            // シンプルなconfirmダイアログ（後でモーダルUIに改良可能）
            const userChoice = confirm(confirmationMessage);
            
            console.log(`✅ ユーザー判定: ${userChoice ? '承認' : '却下'}`);
            return userChoice;
            
        } catch (error) {
            console.error('❌ ユーザー確認エラー:', error);
            return false;
        }
    }
    
    /**
     * 🔧 確認メッセージ生成
     */
    _buildConfirmationMessage(insightText, evaluation) {
        const scoreDisplay = `信頼性: ${(evaluation.confidence * 100).toFixed(0)}% | 重要性: ${(evaluation.importance * 100).toFixed(0)}% | 実行性: ${(evaluation.actionability * 100).toFixed(0)}%`;
        
        return `【知見品質評価結果】

📝 発言内容:
"${insightText.substring(0, 100)}${insightText.length > 100 ? '...' : ''}"

🤖 AI評価:
${scoreDisplay}
総合評価: ${(evaluation.overall * 100).toFixed(0)}% (${evaluation.recommendation})

💡 要約: ${evaluation.summary}
📊 理由: ${evaluation.reason}

この発言を知見データとして保存しますか？`;
    }
    
    /**
     * 🔧 接続テスト
     */
    async _testConnection() {
        try {
            // 初期化中は一時的に接続テストを許可
            const wasInitialized = this.isInitialized;
            this.isInitialized = true;
            
            const testResponse = await this.sendToCharacter([
                { role: 'user', content: 'Test' }
            ], 'system');
            
            // 初期化状態を元に戻す
            this.isInitialized = wasInitialized;
            
            console.log('✅ AI接続テスト成功');
            return true;
            
        } catch (error) {
            console.warn('⚠️ AI接続テスト失敗:', error);
            return false;
        }
    }
    
    /**
     * 🔧 デフォルトUIプロバイダー作成
     */
    _createDefaultUIProvider() {
        return {
            showProgress: (message) => console.log(`🔄 ${message}`),
            showSuccess: (message) => console.log(`✅ ${message}`),
            showWarning: (message) => console.warn(`⚠️ ${message}`),
            showError: (message) => console.error(`❌ ${message}`)
        };
    }
    
    /**
     * 🔧 遅延ヘルパー
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 🔧 統計情報取得
     */
    getStats() {
        return {
            initialized: this.isInitialized,
            initTime: this.initTime,
            settings: this.settings,
            qualityThresholds: this.qualityThresholds,
            dependencies: this.checkDependencies()
        };
    }
}

// =================================================================================
// モジュール初期化とエクスポート
// =================================================================================

// グローバル公開
window.AIManager = AIManager;

// 初期化関数
async function initializeAIManager() {
    try {
        console.log('🤖 AIManager初期化開始...');
        
        // AIManagerインスタンス作成
        const aiManager = new AIManager();
        
        // 依存関係の設定
        const options = {
            apiKeyProvider: async () => {
                return window.AppState?.apiKey || null;
            },
            uiProvider: {
                showProgress: (message) => {
                    if (window.showMessage) {
                        window.showMessage('info', message);
                    }
                    console.log(`🔄 ${message}`);
                },
                showSuccess: (message) => {
                    if (window.showMessage) {
                        window.showMessage('success', message);
                    }
                    console.log(`✅ ${message}`);
                },
                showWarning: (message) => {
                    if (window.showMessage) {
                        window.showMessage('warning', message);
                    }
                    console.warn(`⚠️ ${message}`);
                },
                showError: (message) => {
                    if (window.showMessage) {
                        window.showMessage('error', message);
                    }
                    console.error(`❌ ${message}`);
                }
            }
        };
        
        // 初期化実行
        const success = await aiManager.initialize(options);
        
        if (success) {
            window.AIManager = aiManager;
            console.log('✅ AIManager初期化完了');
            return aiManager;
        } else {
            throw new Error('AIManager初期化失敗');
        }
        
    } catch (error) {
        console.error('❌ AIManager初期化エラー:', error);
        return null;
    }
}

// 後方互換性のためのインターフェース
window.initializeAIManager = initializeAIManager;

// 使用状況レポート
console.log('🤖 AIManager読み込み完了 - AI統合管理システム初期化待機中'); 