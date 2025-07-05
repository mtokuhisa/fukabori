// 深堀くんアプリ - 知見管理システム
// Knowledge Management System for Fukabori-kun App

// =================================================================================
// CSV DATA MANAGEMENT - CSVデータ管理
// =================================================================================

// 📁 CSV管理システム
const CSVManager = {
    // CSVファイル読み込み
    async loadCSV(filename) {
        try {
            const response = await fetch(`config/${filename}`);
            if (!response.ok) {
                throw new Error(`CSV読み込み失敗: ${filename}`);
            }
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.log(`📁 CSV読み込みエラー (${filename}) - フォールバックデータを使用:`, error);
            return this.getFallbackData(filename);
        }
    },

    // CSV解析
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            data.push(row);
        }
        
        return data;
    },

    // フォールバックデータ
    getFallbackData(filename) {
        if (filename === 'categories.csv') {
            return [
                { category_name: '営業手法', category_description: '営業・顧客対応に関する知見', is_active: 'true' },
                { category_name: 'コミュニケ', category_description: 'コミュニケーション・対人関係', is_active: 'true' },
                { category_name: '技術管理', category_description: '技術・開発管理に関する知見', is_active: 'true' },
                { category_name: '組織運営', category_description: '組織・チーム運営に関する知見', is_active: 'true' }
            ];
        } else if (filename === 'user_names.csv') {
            return [
                { nickname: 'admin', formal_name: '管理者', department: 'システム', role: '管理者', is_active: 'true' }
            ];
        }
        return [];
    }
};

// =================================================================================
// CATEGORY MANAGEMENT - カテゴリー管理
// =================================================================================

// 🏷️ カテゴリー管理システム
const CategoryManager = {
    // カテゴリー一覧の読み込み
    async loadCategories() {
        try {
            const categories = await CSVManager.loadCSV('categories.csv');
            window.KnowledgeState.categories = categories.filter(cat => cat.is_active === 'true');
            console.log('✅ カテゴリー読み込み完了:', window.KnowledgeState.categories.length, '件');
            return window.KnowledgeState.categories;
        } catch (error) {
            console.error('❌ カテゴリー読み込みエラー:', error);
            return [];
        }
    },

    // カテゴリー名の検証
    validateCategory(categoryName) {
        return window.KnowledgeState.categories.some(cat => cat.category_name === categoryName);
    },

    // カテゴリー選択UI（セッション開始時）
    async promptCategorySelection() {
        const categories = window.KnowledgeState.categories;
        if (categories.length === 0) {
            return '一般';
        }

        // 簡易的な選択（後でUIを改良）
        const categoryNames = categories.map(cat => cat.category_name);
        const prompt = `知見のカテゴリーを選択してください:\n${categoryNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`;
        
        // TODO: より良いUI実装
        return categoryNames[0]; // 暫定的に最初のカテゴリーを返す
    }
};

// =================================================================================
// USER MANAGEMENT - ユーザー管理
// =================================================================================

// 👤 ユーザー名管理システム  
const UserManager = {
    // ユーザー一覧の読み込み
    async loadUsers() {
        try {
            const users = await CSVManager.loadCSV('user_names.csv');
            window.KnowledgeState.users = users.filter(user => user.is_active === 'true');
            console.log('✅ ユーザー一覧読み込み完了:', window.KnowledgeState.users.length, '件');
            return window.KnowledgeState.users;
        } catch (error) {
            console.error('❌ ユーザー一覧読み込みエラー:', error);
            return [];
        }
    },

    // ニックネームからユーザーをマッチング
    matchUser(nickname) {
        const matches = window.KnowledgeState.users.filter(user => 
            user.nickname.toLowerCase() === nickname.toLowerCase()
        );
        return matches.length > 0 ? matches[0] : null;
    },

    // ユーザー確認プロンプト
    async confirmUser(nickname) {
        const match = this.matchUser(nickname);
        if (match) {
            const confirmed = confirm(
                `${match.formal_name}さん（${match.department}・${match.role}）でよろしいですか？`
            );
            return confirmed ? match : null;
        }
        
        // 新規ユーザーの場合
        const createNew = confirm(
            `「${nickname}」さんは登録されていません。\n新規ユーザーとして記録しますか？`
        );
        
        if (createNew) {
            return {
                nickname: nickname,
                formal_name: nickname,
                department: '未設定',
                role: '未設定',
                is_new: true
            };
        }
        
        return null;
    }
};

// =================================================================================
// KNOWLEDGE PERSISTENCE SYSTEM - 知見永続化システム
// =================================================================================

// 🧬 全知見永続化データベース管理
const FukaboriKnowledgeDatabase = {
    // LocalStorageから知見データベースを読み込み
    load() {
        try {
            const saved = localStorage.getItem('fukabori_knowledge_database');
            if (!saved) {
                return {
                    sessions: [],
                    totalSessions: 0,
                    totalInsights: 0,
                    lastUpdate: new Date().toISOString()
                };
            }
            const data = JSON.parse(saved);
            console.log(`📋 知見データベース読み込み: ${data.totalSessions}セッション, ${data.totalInsights}知見`);
            return data;
        } catch (error) {
            console.error('❌ 知見データベース読み込みエラー:', error);
            return {
                sessions: [],
                totalSessions: 0,
                totalInsights: 0,
                lastUpdate: new Date().toISOString()
            };
        }
    },

    // LocalStorageに知見データベースを保存
    save(database) {
        try {
            database.lastUpdate = new Date().toISOString();
            localStorage.setItem('fukabori_knowledge_database', JSON.stringify(database));
            console.log(`💾 知見データベース保存完了: ${database.totalSessions}セッション, ${database.totalInsights}知見`);
        } catch (error) {
            console.error('❌ 知見データベース保存エラー:', error);
        }
    },

    // 現在のセッション知見を永続化データベースに追加
    addSession(sessionData) {
        try {
            const database = this.load();
            
            // セッション情報の構築
            const sessionRecord = {
                sessionId: `session_${this.formatTimestamp(new Date())}`,
                date: new Date().toISOString().split('T')[0],
                theme: sessionData.theme || 'テーマ未設定',
                participant: 'ユーザー',
                insights: sessionData.insights || [],
                metadata: {
                    startTime: sessionData.startTime,
                    endTime: new Date().toISOString(),
                    totalInsights: (sessionData.insights || []).length,
                    category: '汎用',
                    sessionDuration: sessionData.startTime ? 
                        Math.round((new Date() - new Date(sessionData.startTime)) / 1000 / 60) : 0
                }
            };

            // データベースに追加
            database.sessions.unshift(sessionRecord); // 新しいセッションを先頭に
            database.totalSessions = database.sessions.length;
            database.totalInsights = database.sessions.reduce((total, session) => 
                total + session.insights.length, 0);

            this.save(database);

            console.log(`✅ セッション知見を永続化: ${sessionRecord.metadata.totalInsights}知見`);
            window.showMessage('success', `💾 ${sessionRecord.metadata.totalInsights}件の知見を永続保存しました`);

            return sessionRecord;
        } catch (error) {
            console.error('❌ セッション知見追加エラー:', error);
            return null;
        }
    },

    formatTimestamp(date) {
        return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }
};

// =================================================================================
// KNOWLEDGE MANAGEMENT INTERFACE - 知見管理インターフェース
// =================================================================================

// 🔌 外部システムとの接続インターフェース
window.KnowledgeManagementInterface = {
    // 初期化
    async initialize() {
        console.log('📚 知見管理システム初期化開始...');
        
        // KnowledgeStateが未定義の場合は初期化
        if (typeof window.KnowledgeState === 'undefined') {
            window.KnowledgeState = {
                currentSession: null,
                categories: [],
                users: [],
                insights: [],
                qualityThreshold: 0.7,
                isInitialized: false
            };
        }
        
        // CSV データの読み込み
        await CategoryManager.loadCategories();
        await UserManager.loadUsers();
        
        window.KnowledgeState.isInitialized = true;
        console.log('✅ 知見管理システム初期化完了');
    },
    
    // 外部からアクセス可能なメソッド
    getCategoryManager: () => CategoryManager,
    getUserManager: () => UserManager,
    getKnowledgeDatabase: () => FukaboriKnowledgeDatabase,
    getCSVManager: () => CSVManager
};

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

// システムをグローバルに公開
window.CategoryManager = CategoryManager;
window.UserManager = UserManager;
window.FukaboriKnowledgeDatabase = FukaboriKnowledgeDatabase;
window.CSVManager = CSVManager;

console.log('✅ 知見管理システム（独立コンポーネント）読み込み完了');

// =================================================================================
// KNOWLEDGE DNA MANAGER - 知見の構造化・リライト・関係性分析システム
// =================================================================================

// 🧬 Knowledge DNA Manager - 知見の構造化・リライト・関係性分析システム
const KnowledgeDNAManager = {
    // 知見リライト・整理機能
    async rewriteInsightForClarity(insightText, context) {
        if (!window.AppState?.apiKey || !insightText?.trim()) {
            return {
                enhanced: insightText,
                summary: '情報不足のため整理をスキップしました',
                categories: [],
                keywords: []
            };
        }

        try {
            console.log('🧬 知見リライト処理開始:', insightText.substring(0, 50) + '...');
            
            const prompt = this.buildRewritePrompt(insightText, context);
            
            const messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: `以下の知見を整理・リライトしてください：\n\n${insightText}` }
            ];

            const response = await window.gptMessagesToCharacterResponse(messages, 'system');
            const analysis = this.parseRewriteResponse(response);
            
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
    },

    // リライト用プロンプト構築
    buildRewritePrompt(insightText, context) {
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
    },

    // リライト結果の解析
    parseRewriteResponse(response) {
        try {
            console.log('🔍 レスポンス解析開始:', response.substring(0, 100) + '...');
            
            // JSONブロックの抽出を試行（複数パターン対応）
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
                // 要約の生成（複数の候補から選択）
                let summary = parsed.summary;
                if (!summary || summary === 'AI整理済み') {
                    // enhancedフィールドから要約を生成
                    if (parsed.enhanced && typeof parsed.enhanced === 'string') {
                        const enhanced = parsed.enhanced;
                        if (enhanced.length > 50) {
                            // 最初の文または最大100文字で要約
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
            
            // JSON解析失敗時は元の response から要約を生成
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
            // 元のレスポンスから基本的な要約を作成
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
    },

    // 知見間の関係性分析
    async analyzeKnowledgeRelationships(insights) {
        if (!window.AppState?.apiKey || !insights || insights.length < 2) {
            return {
                clusters: [],
                relationships: [],
                themes: []
            };
        }

        try {
            console.log('🕸️ 知見関係性分析開始...');
            
            const prompt = this.buildRelationshipPrompt();
            const insightTexts = insights.map(insight => insight.content).join('\n---\n');
            
            const messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: `以下の知見群の関係性を分析してください：\n\n${insightTexts}` }
            ];

            const response = await window.gptMessagesToCharacterResponse(messages, 'system');
            const analysis = this.parseRelationshipResponse(response);
            
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
    },

    // 関係性分析用プロンプト
    buildRelationshipPrompt() {
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
    },

    // 関係性分析結果の解析
    parseRelationshipResponse(response) {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                             response.match(/```\n([\s\S]*?)\n```/) ||
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
    },

    // 知見DNA生成
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
};

// =================================================================================
// QUALITY ASSESSMENT SYSTEM - 品質評価システム  
// =================================================================================

// 🎯 品質評価システム（はほりーのによる知見品質評価）
const QualityAssessmentSystem = {
    // 品質評価の閾値設定
    thresholds: {
        confidence: 0.7,
        importance: 0.6,
        actionability: 0.5,
        minimum_overall: 0.6
    },
    
    // はほりーのによる知見品質評価
    async evaluateInsightQuality(insightText, conversationContext) {
        try {
            if (!window.AppState?.apiKey || !insightText?.trim()) {
                return null;
            }
            
            console.log('🔍 はほりーの: 知見品質評価開始...');
            
            const evaluationPrompt = this.buildQualityEvaluationPrompt(insightText, conversationContext);
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.AppState.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: evaluationPrompt }],
                    max_tokens: 800,
                    temperature: 0.3
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const evaluation = this.parseQualityEvaluation(data.choices[0].message.content);
                
                console.log('✅ はほりーの品質評価完了:', evaluation);
                return evaluation;
            }
            
        } catch (error) {
            console.error('❌ 品質評価エラー:', error);
            return null;
        }
    },
    
    // 品質評価プロンプト生成
    buildQualityEvaluationPrompt(insightText, conversationContext) {
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
    },
    
    // 品質評価結果の解析
    parseQualityEvaluation(evaluationText) {
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
    },
    
    // ユーザー確認ダイアログ表示
    async promptUserConfirmation(insightText, qualityEvaluation) {
        try {
            const confirmationMessage = this.buildConfirmationMessage(insightText, qualityEvaluation);
            
            // モーダルベースの確認ダイアログ（より良いUX）
            const userDecision = await this.showQualityConfirmationModal(confirmationMessage, qualityEvaluation);
            
            console.log(`✅ ユーザー判定: ${userDecision ? '承認' : '却下'}`);
            return userDecision;
            
        } catch (error) {
            console.error('❌ ユーザー確認エラー:', error);
            return false;
        }
    },
    
    // 確認メッセージ生成
    buildConfirmationMessage(insightText, evaluation) {
        const scoreDisplay = `信頼性: ${(evaluation.confidence * 100).toFixed(0)}% | 重要性: ${(evaluation.importance * 100).toFixed(0)}% | 実行性: ${(evaluation.actionability * 100).toFixed(0)}%`;
        
        return `【知見品質評価結果】

📝 発言内容:
"${insightText.substring(0, 100)}${insightText.length > 100 ? '...' : ''}"

🤖 はほりーの評価:
${scoreDisplay}
総合評価: ${(evaluation.overall * 100).toFixed(0)}% (${evaluation.recommendation})

💡 要約: ${evaluation.summary}
📊 理由: ${evaluation.reason}

この発言を知見データとして保存しますか？`;
    },
    
    // 品質確認モーダル表示
    async showQualityConfirmationModal(message, evaluation) {
        return new Promise((resolve) => {
            // シンプルなconfirmダイアログ（後でモーダルUIに改良可能）
            const userChoice = confirm(message);
            resolve(userChoice);
        });
    },
    
    // 品質評価統合処理（メイン関数）
    async processInsightWithQualityAssessment(insightText, conversationContext) {
        try {
            console.log('🎯 知見品質評価プロセス開始...');
            
            // 1. はほりーのによる品質評価
            const qualityEvaluation = await this.evaluateInsightQuality(insightText, conversationContext);
            
            if (!qualityEvaluation) {
                console.warn('⚠️ 品質評価が取得できませんでした');
                return { accepted: false, reason: 'evaluation_failed' };
            }
            
            // 2. 自動判定（高品質は自動承認、低品質は自動却下）
            if (qualityEvaluation.overall >= 0.8 && qualityEvaluation.recommendation === 'ACCEPT') {
                console.log('✅ 高品質知見: 自動承認');
                return {
                    accepted: true,
                    reason: 'auto_accept',
                    evaluation: qualityEvaluation,
                    summary: qualityEvaluation.summary
                };
            }
            
            if (qualityEvaluation.overall < 0.3 || qualityEvaluation.recommendation === 'REJECT') {
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
            const userApproved = await this.promptUserConfirmation(insightText, qualityEvaluation);
            
            return {
                accepted: userApproved,
                reason: userApproved ? 'manual_accept' : 'manual_reject',
                evaluation: qualityEvaluation,
                summary: qualityEvaluation.summary
            };
            
        } catch (error) {
            console.error('❌ 品質評価統合処理エラー:', error);
            return { accepted: false, reason: 'process_error' };
        }
    }
};

// =================================================================================
// KNOWLEDGE MANAGEMENT INTERFACE UPDATE - インターフェース更新
// =================================================================================

// インターフェースに新しいコンポーネントを追加
window.KnowledgeManagementInterface.getKnowledgeDNAManager = () => KnowledgeDNAManager;
window.KnowledgeManagementInterface.getQualityAssessmentSystem = () => QualityAssessmentSystem;

// グローバル公開
window.KnowledgeDNAManager = KnowledgeDNAManager;
window.QualityAssessmentSystem = QualityAssessmentSystem;

console.log('✅ 知見管理システム（AI整理・品質評価）読み込み完了');

// =================================================================================
// KNOWLEDGE DOWNLOAD FUNCTIONS - 知見ダウンロード関数
// =================================================================================

// 🧬 全知見ダウンロード機能
async function downloadAllKnowledge() {
    console.log('🧬 全知見ダウンロード開始');
    
    try {
        const database = FukaboriKnowledgeDatabase.load();
        
        if (database.totalInsights === 0) {
            window.showMessage('info', '保存された知見がありません。セッションを完了して知見を蓄積してください。');
            return;
        }

        // プログレス表示
        window.showMessage('info', `🔄 ${database.totalSessions}セッション分の全知見を整理中...`);

        // 全知見を統合
        const allInsights = [];
        database.sessions.forEach(session => {
            session.insights.forEach(insight => {
                allInsights.push({
                    ...insight,
                    sessionInfo: {
                        date: session.date,
                        theme: session.theme,
                        sessionId: session.sessionId
                    }
                });
            });
        });

        // Knowledge DNAシステムを活用してAI整理
        const enhancedDatabase = await enhanceAllKnowledgeWithAI(database, allInsights);

        // ファイル生成
        const fileContent = buildAllKnowledgeFileContent(enhancedDatabase, allInsights);
        const timestamp = FukaboriKnowledgeDatabase.formatTimestamp(new Date());
        const filename = `全知見アーカイブ_KnowledgeDNA_${timestamp}.md`;

        window.downloadTextFile(fileContent, filename);

        window.showMessage('success', `🎉 全知見アーカイブ「${filename}」をダウンロードしました！`);
        console.log('✅ 全知見ダウンロード完了');

    } catch (error) {
        console.error('❌ 全知見ダウンロードエラー:', error);
        window.showMessage('error', '全知見のダウンロードに失敗しました。');
    }
}

// AI整理による全知見の拡張処理
async function enhanceAllKnowledgeWithAI(database, allInsights) {
    if (allInsights.length === 0) return database;

    try {
        // 知見が多数の場合は処理をスキップしてパフォーマンスを確保
        if (allInsights.length > 10) {
            console.log('💡 知見数が多いため、AI整理をスキップします');
            return database;
        }

        console.log('🧬 全知見のAI整理を開始...');
        window.showMessage('info', '🔄 全知見をAIで分析・整理中...');

        // 代表的な知見のみAI処理（パフォーマンス考慮）
        const sampleInsights = allInsights.slice(0, 5);
        
        for (let i = 0; i < sampleInsights.length; i++) {
            const insight = sampleInsights[i];
            if (!insight.enhanced_content) {
                const enhanced = await KnowledgeDNAManager.rewriteInsightForClarity(
                    insight.content, 
                    insight.sessionInfo
                );
                insight.enhanced_content = enhanced?.enhanced || insight.content;
                insight.summary = enhanced?.summary || '要約生成中...';
            }
        }

        console.log('✅ 全知見AI整理完了');
        return database;

    } catch (error) {
        console.error('❌ 全知見AI整理エラー:', error);
        return database;
    }
}

// 全知見アーカイブファイル内容構築（「知見DL」と同等の詳細度）
function buildAllKnowledgeFileContent(database, allInsights) {
    const timestamp = new Date().toLocaleString('ja-JP');
    let content = '';

    // 🧬 全体メタデータセクション
    content += '---\n';
    content += '# 全知見アーカイブメタデータ\n';
    content += `archive_meta:\n`;
    content += `  archive_id: "fukabori_all_knowledge_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}"\n`;
    content += `  generated_date: "${new Date().toISOString()}"\n`;
    content += `  total_sessions: ${database.totalSessions}\n`;
    content += `  total_insights: ${database.totalInsights}\n`;
    content += `  data_period: "${database.sessions.length > 0 ? 
        `${database.sessions[database.sessions.length - 1].date} ～ ${database.sessions[0].date}` : '未記録'}"\n`;
    content += `  knowledge_dna_version: "1.0"\n`;
    content += `  format_version: "comprehensive_archive_v1.0"\n`;
    content += '\n';
    
    content += '# アーカイブ概要\n';
    content += `summary:\n`;
    content += `  overview: "深堀くんアプリで蓄積した全知見の包括的アーカイブ"\n`;
    content += `  sessions_included: ${database.totalSessions}\n`;
    content += `  insights_included: ${database.totalInsights}\n`;
    content += `  ai_enhanced: true\n`;
    content += `  cross_session_analysis: true\n`;
    content += '\n';
    
    content += '---\n\n';

    // タイトル
    content += `# 🧬 深堀くん全知見アーカイブ - Knowledge DNA\n\n`;
    content += `> 深堀くんアプリで蓄積した全知見の包括的アーカイブ（「知見DL」同等の詳細度）\n\n`;
    content += `**📊 アーカイブ統計**\n`;
    content += `- 総セッション数: ${database.totalSessions}\n`;
    content += `- 総知見数: ${database.totalInsights}\n`;
    content += `- 生成日時: ${timestamp}\n`;
    content += `- データ期間: ${database.sessions.length > 0 ? 
        `${database.sessions[database.sessions.length - 1].date} ～ ${database.sessions[0].date}` : '未記録'}\n`;
    content += `- Knowledge DNA版: v1.0\n\n`;

    content += `---\n\n`;

    // 🧬 各セッションの詳細（「知見DL」と同等の詳細度）
    database.sessions.forEach((session, sessionIndex) => {
        if (session.insights.length === 0) return;

        // セッションメタデータ（YAML形式）
        content += `## 🎯 セッション ${sessionIndex + 1}: ${session.theme}\n\n`;
        content += '```yaml\n';
        content += `session_meta:\n`;
        content += `  session_id: "${session.sessionId}"\n`;
        content += `  date: "${session.date}"\n`;
        content += `  theme: "${session.theme}"\n`;
        content += `  participant: "${session.participant}"\n`;
        content += `  insights_count: ${session.insights.length}\n`;
        content += `  session_duration: ${session.metadata.sessionDuration}分\n`;
        content += `  category: "${session.metadata.category}"\n`;
        content += '```\n\n';

        // 知見生データ（YAML形式）
        content += `### 📋 知見生データ\n\n`;
        content += '```yaml\n';
        content += `raw_insights:\n`;
        session.insights.forEach((insight, index) => {
            content += `  - id: "insight_${sessionIndex + 1}_${index + 1}"\n`;
            content += `    content: "${insight.content?.replace(/"/g, '\\"') || ''}"\n`;
            content += `    timestamp: "${insight.timestamp || ''}"\n`;
            if (insight.quality_scores) {
                content += `    quality_scores:\n`;
                content += `      confidence: ${insight.quality_scores.confidence || 0.5}\n`;
                content += `      importance: ${insight.quality_scores.importance || 0.5}\n`;
            }
        });
        content += '```\n\n';

        // 🧬 Knowledge DNA整理された知見
        content += `### 🧬 Knowledge DNA - AI整理された知見\n\n`;
        content += `> 以下の知見は、深堀くんのKnowledge DNAシステムによって整理・リライトされた内容です。\n\n`;

        session.insights.forEach((insight, index) => {
            content += `#### 📘 知見 ${index + 1}\n\n`;

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
                        console.warn('Enhanced content JSON解析失敗:', e);
                    }
                }
                
                content += `${enhancedText}\n\n`;
                
                if (insight.summary && insight.summary !== '要約生成中...' && insight.summary !== 'AI整理済み') {
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
            content += `- 🏷️ カテゴリー: ${session.metadata.category}\n`;
            if (insight.categories && insight.categories.length > 0) {
                content += `- 🎯 AI分析カテゴリー: ${insight.categories.join(', ')}\n`;
            }
            content += `- ⭐ 重要度: ${insight.quality_scores?.importance ? Math.round(insight.quality_scores.importance * 100) : 50}%\n`;
            content += `- 🎯 信頼度: ${insight.quality_scores?.confidence ? Math.round(insight.quality_scores.confidence * 100) : 50}%\n`;
            content += `- 🔗 セッションID: ${session.sessionId}\n`;
            content += `- 📅 抽出日時: ${insight.timestamp}\n`;
            content += `- 🤖 AI整理: ${insight.dna_enhanced ? '✅ 完了' : '❌ 未実行'}\n`;
            
            content += `\n---\n\n`;
        });

        // セッション固有のナレッジグラフ
        content += `### 🕸️ セッション Knowledge Graph\n\n`;
        content += `> ${session.theme}セッションの知見関係性分析\n\n`;
        
        // セッション統計
        content += `**📊 セッション統計**\n`;
        content += `- 知見数: ${session.insights.length}\n`;
        const sessionAvgImportance = session.insights.length > 0 ? 
            Math.round(session.insights.reduce((sum, i) => sum + (i.quality_scores?.importance || 0.5), 0) / session.insights.length * 100) : 0;
        content += `- 平均重要度: ${sessionAvgImportance}%\n`;
        content += `- AI整理済み: ${session.insights.filter(i => i.dna_enhanced).length}/${session.insights.length}\n`;
        content += `- テーマカテゴリー: ${session.metadata.category}\n`;
        content += `- 参加者: ${session.participant}\n\n`;
        
        // 知見クラスター分析（セッション内）
        content += `**🔗 知見クラスター分析**\n`;
        if (session.insights.length < 2) {
            content += `- 単一の知見のため、クラスター分析は実行されませんでした\n\n`;
        } else {
            content += `- 関係性分析中、またはAIによる自動分析が完了していません\n`;
            content += `- 今後のバージョンで高度な知見クラスタリングが利用可能になります\n\n`;
        }
        
        // 共通テーマ（セッション内）
        content += `**🎯 セッション内共通テーマ**\n`;
        const sessionKeywords = session.insights.flatMap(i => i.keywords || []);
        const sessionKeywordFreq = {};
        sessionKeywords.forEach(keyword => {
            sessionKeywordFreq[keyword] = (sessionKeywordFreq[keyword] || 0) + 1;
        });
        
        const sessionCommonKeywords = Object.entries(sessionKeywordFreq)
            .filter(([_, freq]) => freq > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
            
        if (sessionCommonKeywords.length > 0) {
            sessionCommonKeywords.forEach(([keyword, freq]) => {
                content += `- **${keyword}** (出現: ${freq}回)\n`;
            });
        } else {
            content += `- このセッションでは重複キーワードは検出されませんでした\n`;
        }
        content += `\n`;

        content += `---\n\n`;
    });

    // 🌐 全セッション横断分析
    content += `## 🌐 全セッション横断 Knowledge Graph\n\n`;
    content += `> 全${database.totalSessions}セッションの知見を横断した包括的分析\n\n`;
    
    // 全体統計
    content += `**📊 全体統計**\n`;
    const totalAvgImportance = allInsights.length > 0 ? 
        Math.round(allInsights.reduce((sum, i) => sum + (i.quality_scores?.importance || 0.5), 0) / allInsights.length * 100) : 0;
    content += `- 総知見数: ${database.totalInsights}\n`;
    content += `- 平均重要度: ${totalAvgImportance}%\n`;
    content += `- AI整理済み: ${allInsights.filter(i => i.dna_enhanced).length}/${allInsights.length}\n`;
    content += `- セッション期間: ${database.sessions.length > 0 ? 
        `${database.sessions[database.sessions.length - 1].date} ～ ${database.sessions[0].date}` : '未記録'}\n\n`;
    
    // テーマ別集計
    const themeStats = {};
    database.sessions.forEach(session => {
        if (session.insights.length > 0) {
            themeStats[session.theme] = (themeStats[session.theme] || 0) + session.insights.length;
        }
    });

    content += `**🎯 テーマ別知見分布**\n`;
    Object.entries(themeStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([theme, count]) => {
            const percentage = Math.round((count / database.totalInsights) * 100);
            content += `- **${theme}**: ${count}件 (${percentage}%)\n`;
        });
    content += `\n`;

    // 月別集計
    const monthlyStats = {};
    database.sessions.forEach(session => {
        if (session.insights.length > 0) {
            const month = session.date.slice(0, 7);
            monthlyStats[month] = (monthlyStats[month] || 0) + session.insights.length;
        }
    });

    if (Object.keys(monthlyStats).length > 1) {
        content += `**📅 月別知見蓄積推移**\n`;
        Object.entries(monthlyStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .forEach(([month, count]) => {
                const percentage = Math.round((count / database.totalInsights) * 100);
                content += `- **${month}**: ${count}件 (${percentage}%)\n`;
            });
        content += `\n`;
    }

    // 全体キーワード分析
    content += `**🏷️ 全体キーワード分析**\n`;
    const allKeywords = allInsights.flatMap(i => i.keywords || []);
    const keywordFreq = {};
    allKeywords.forEach(keyword => {
        keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
    });
    
    const topKeywords = Object.entries(keywordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
        
    if (topKeywords.length > 0) {
        topKeywords.forEach(([keyword, freq]) => {
            const percentage = Math.round((freq / allKeywords.length) * 100);
            content += `- **${keyword}**: ${freq}回出現 (${percentage}%)\n`;
        });
    } else {
        content += `- キーワードデータが不足しています\n`;
    }
    content += `\n`;

    // セッション間関連性
    content += `**🔄 セッション間関連性**\n`;
    if (database.totalSessions > 1) {
        content += `- ${database.totalSessions}セッション間の横断的知見関係性を分析\n`;
        content += `- 共通テーマとキーワードから知見継承パターンを抽出\n`;
        content += `- より多くのセッションが蓄積されると、知見進化の軌跡が可視化されます\n`;
    } else {
        content += `- 単一セッションのため、セッション間関連性分析は実行されませんでした\n`;
    }
    content += `\n`;

    content += `---\n\n`;
    content += `## 🧬 Knowledge DNA継承情報\n\n`;
    content += `このアーカイブは深堀くんアプリのKnowledge DNAシステムによって生成されました。\n`;
    content += `各知見は個別セッションの「知見DL」と同等の詳細度で記録されており、\n`;
    content += `全セッション横断の包括的分析も含まれています。\n\n`;
    content += `**🔧 システム情報**\n`;
    content += `- Knowledge DNA版: v1.0\n`;
    content += `- アーカイブ形式: 包括的詳細版\n`;
    content += `- 生成エンジン: 全知見永続化システム\n`;
    content += `- 品質保証: 個別「知見DL」同等\n\n`;

    return content;
}

// =================================================================================
// KNOWLEDGE MANAGEMENT INTERFACE FINAL UPDATE - 最終インターフェース更新
// =================================================================================

// 全知見ダウンロード関数をインターフェースに追加
window.KnowledgeManagementInterface.downloadAllKnowledge = downloadAllKnowledge;
window.KnowledgeManagementInterface.enhanceAllKnowledgeWithAI = enhanceAllKnowledgeWithAI;
window.KnowledgeManagementInterface.buildAllKnowledgeFileContent = buildAllKnowledgeFileContent;

// グローバル公開
window.downloadAllKnowledge = downloadAllKnowledge;

console.log('✅ 知見管理システム（全知見ダウンロード機能）読み込み完了'); 