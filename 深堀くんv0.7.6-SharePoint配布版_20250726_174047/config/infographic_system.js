/**
 * 🎨 深堀くん知見インフォグラフィック生成システム
 * 完全独立モジュール - 会話システムに一切影響を与えません
 * Version: 1.0.0
 * Safety: 既存データ読み取り専用・エラー分離設計
 */

class InfographicSystem {
    constructor() {
        this.isEnabled = true;
        this.version = '2.0.0'; // Phase 1 高度機能対応
        this.chartLibraryLoaded = false;
        this.d3LibraryLoaded = false;
        this.visLibraryLoaded = false;
        
        // Phase 1: 高度分析用の内部データ
        this.analysisData = {
            knowledgeNetwork: [],
            conceptClusters: {},
            aiEnhancementStats: {},
            relationshipMatrix: [],
            temporalPatterns: []
        };
        
        console.log('🎨 高度インフォグラフィックシステム初期化完了 (Phase 1 + 独立モード)');
    }

    /**
     * 🛡️ 安全なデータ取得（読み取り専用）
     */
    async safeGetSessionData() {
        try {
            // 🔧 Phase A修正: 手動保存知見を含む包括的データ取得
            let insights = AppState?.currentInsights || [];
            let meta = AppState?.sessionMeta || {};
            
            // 🔧 手動保存された知見を統合
            const manualInsights = AppState?.extractedKnowledge || [];
            console.log(`📊 セッションデータ統合: システム${insights.length}件, 手動${manualInsights.length}件`);
            
            // 手動保存知見をセッション知見形式に変換
            const manualInsightsConverted = manualInsights.map((insight, index) => ({
                id: `manual_${index}`,
                content: insight.summary || insight.content || '内容不明',
                enhanced_content: insight.summary || insight.content,
                timestamp: insight.timestamp || new Date(),
                context: 'manual_approval',
                importance: insight.score || 70,
                quality_scores: {
                    importance: (insight.score || 70) / 100,
                    confidence: 0.8, // 手動承認済みなので高い信頼度
                    actionability: (insight.score || 70) / 100
                },
                source: 'manual_confirmed',
                method: insight.method || 'manual_approved',
                evaluation: insight.evaluation || null,
                dna_enhanced: false, // 手動承認済みなのでAI強化不要
                is_manually_approved: true,
                keywords: [], // 後で抽出可能
                related_concepts: []
            }));
            
            // システム知見と手動知見を統合
            insights = [...insights, ...manualInsightsConverted];
            
            // 現在のセッションにデータがない場合、永続化データから最新セッションを取得
            if (insights.length === 0) {
                console.log('🔄 現在のセッションデータなし、永続化データから最新セッション取得');
                
                // 依存関数の読み込み完了を待機
                await this.waitForDependencies();
                
                const database = window.FukaboriKnowledgeDatabase ? FukaboriKnowledgeDatabase.load() : null;
                
                if (database && database.sessions && database.sessions.length > 0) {
                    // 最新セッション（配列の最初）を取得
                    const latestSession = database.sessions[0];
                    console.log('📋 最新セッション取得:', latestSession.theme, latestSession.insights.length + '件の知見');
                    
                    insights = [...insights, ...(latestSession.insights || [])];
                    meta = {
                        theme: latestSession.theme,
                        participant: latestSession.participant,
                        sessionDuration: latestSession.metadata?.sessionDuration || 0,
                        category: latestSession.metadata?.category || 'その他',
                        session_id: latestSession.sessionId,
                        date: latestSession.date
                    };
                } else {
                    console.warn('⚠️ 永続化データも見つかりません');
                }
            }
            
            // 🔧 メタデータの補完（現在のセッション情報を優先）
            if (!meta.theme && AppState?.currentTheme) {
                meta.theme = AppState.currentTheme;
            }
            if (!meta.theme) {
                meta.theme = '深堀セッション';
            }
            
            console.log(`✅ セッションデータ統合完了: 合計${insights.length}件（手動${manualInsights.length}件含む）`);
            
            return {
                session: AppState?.currentSession || null,
                knowledge: window.KnowledgeFileManager ? KnowledgeFileManager.getCurrentSession() : null,
                insights: insights,
                meta: meta
            };
        } catch (error) {
            console.warn('⚠️ セッションデータ取得エラー（会話システム影響なし）:', error);
            return null;
        }
    }

    /**
     * 🛡️ 安全な全知見データ取得（待機ロジック付き）
     */
    async safeGetAllKnowledgeData() {
        try {
            console.log('🔍 全知見データ取得開始');
            
            // FukaboriKnowledgeDatabaseが利用可能になるまで待機
            await this.waitForDependencies();
            
            console.log('🔍 FukaboriKnowledgeDatabaseの存在確認:', !!window.FukaboriKnowledgeDatabase);
            
            if (!window.FukaboriKnowledgeDatabase) {
                console.error('❌ 待機後もFukaboriKnowledgeDatabaseが見つかりません');
                return null;
            }
            
            const database = FukaboriKnowledgeDatabase.load();
            console.log('📋 データベース読み込み結果:', database);
            
            if (database) {
                console.log('📊 データベース詳細:');
                console.log('  - totalSessions:', database.totalSessions);
                console.log('  - totalInsights:', database.totalInsights);
                console.log('  - sessions.length:', database.sessions?.length || 0);
                
                if (database.sessions && database.sessions.length > 0) {
                    console.log('  - 最新セッション:', database.sessions[0]);
                } else {
                    console.warn('⚠️ セッションデータが空です');
                }
            } else {
                console.warn('⚠️ データベースがnullです');
            }
            
            return database;
        } catch (error) {
            console.error('❌ 全知見データ取得エラー（会話システム影響なし）:', error);
            return null;
        }
    }

    /**
     * 🕐 依存関数の読み込み完了まで待機
     */
    async waitForDependencies(maxWaitTime = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            if (window.FukaboriKnowledgeDatabase && 
                typeof window.FukaboriKnowledgeDatabase.load === 'function') {
                console.log('✅ FukaboriKnowledgeDatabase読み込み完了');
                return true;
            }
            
            console.log('⏳ FukaboriKnowledgeDatabase読み込み待機中...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ FukaboriKnowledgeDatabase読み込みタイムアウト');
        return false;
    }

    /**
     * 📊 Chart.jsライブラリの安全な読み込み
     */
    async loadChartLibrary() {
        if (this.chartLibraryLoaded) return true;

        try {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
                script.onload = () => {
                    this.chartLibraryLoaded = true;
                    console.log('📊 Chart.js読み込み完了');
                    resolve(true);
                };
                script.onerror = () => {
                    console.warn('⚠️ Chart.js読み込み失敗（代替表示に切り替え）');
                    resolve(false);
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn('⚠️ ライブラリ読み込みエラー:', error);
            return false;
        }
    }

    /**
     * 🕸️ D3.jsライブラリの安全な読み込み（ネットワーク図用）
     */
    async loadD3Library() {
        if (this.d3LibraryLoaded) return true;

        try {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
                script.onload = () => {
                    this.d3LibraryLoaded = true;
                    console.log('🕸️ D3.js読み込み完了');
                    resolve(true);
                };
                script.onerror = () => {
                    console.warn('⚠️ D3.js読み込み失敗（代替表示に切り替え）');
                    resolve(false);
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn('⚠️ D3ライブラリ読み込みエラー:', error);
            return false;
        }
    }

    /**
     * 🌐 Vis.jsライブラリの安全な読み込み（ネットワーク可視化用）
     */
    async loadVisLibrary() {
        if (this.visLibraryLoaded) return true;

        try {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js';
                script.onload = () => {
                    this.visLibraryLoaded = true;
                    console.log('🌐 Vis.js読み込み完了');
                    console.log('🔍 Vis.jsグローバル確認:', typeof window.vis);
                    resolve(true);
                };
                script.onerror = () => {
                    console.warn('⚠️ Vis.js読み込み失敗（代替表示に切り替え）');
                    resolve(false);
                };
                document.head.appendChild(script);
            });
        } catch (error) {
            console.warn('⚠️ Visライブラリ読み込みエラー:', error);
            return false;
        }
    }

    /**
     * 🔄 全ライブラリの並列読み込み
     */
    async loadAllLibraries() {
        console.log('📚 高度分析ライブラリ読み込み開始...');
        
        const results = await Promise.all([
            this.loadChartLibrary(),
            this.loadD3Library(),
            this.loadVisLibrary()
        ]);
        
        const successCount = results.filter(r => r).length;
        console.log(`✅ ライブラリ読み込み完了: ${successCount}/3 成功`);
        console.log('📊 Chart.js:', typeof window.Chart);
        console.log('🕸️ D3.js:', typeof window.d3);
        console.log('🌐 Vis.js:', typeof window.vis);
        
        return successCount >= 1; // 最低1つのライブラリが読み込めれば継続
    }

    /**
     * 🧬 Phase 1: Knowledge DNA深度分析エンジン
     */
    analyzeKnowledgeDNA(database) {
        console.log('🧬 Knowledge DNA深度分析開始');
        
        try {
            // 1. 知見ネットワーク構築
            this.analysisData.knowledgeNetwork = this.buildKnowledgeNetwork(database);
            
            // 2. 概念クラスター分析
            this.analysisData.conceptClusters = this.analyzeConcepts(database);
            
            // 3. AI強化統計
            this.analysisData.aiEnhancementStats = this.analyzeAIEnhancements(database);
            
            // 4. 関係性マトリクス
            this.analysisData.relationshipMatrix = this.buildRelationshipMatrix(database);
            
            // 5. 時系列パターン
            this.analysisData.temporalPatterns = this.analyzeTemporalPatterns(database);
            
            console.log('✅ Knowledge DNA深度分析完了');
            return this.analysisData;
            
        } catch (error) {
            console.error('❌ Knowledge DNA分析エラー:', error);
            return null;
        }
    }

    /**
     * 🕸️ 知見ネットワーク構築
     */
    buildKnowledgeNetwork(database) {
        const nodes = [];
        const edges = [];
        let nodeId = 0;

        database.sessions.forEach((session, sessionIndex) => {
            // セッションノード
            const sessionNode = {
                id: `session_${sessionIndex}`,
                label: this.truncateText(session.theme, 20),
                group: 'session',
                size: Math.min(session.insights.length * 5 + 10, 50),
                color: this.getSessionColor(sessionIndex),
                metadata: {
                    type: 'session',
                    theme: session.theme,
                    date: session.date,
                    insightsCount: session.insights.length,
                    category: session.metadata?.category || 'その他'
                }
            };
            nodes.push(sessionNode);

            // 知見ノード
            session.insights.forEach((insight, insightIndex) => {
                const insightNode = {
                    id: `insight_${sessionIndex}_${insightIndex}`,
                    label: this.truncateText(insight.content, 30),
                    group: 'insight',
                    size: Math.min((insight.quality_scores?.importance || 0.5) * 30 + 5, 25),
                    color: this.getInsightColor(insight),
                    metadata: {
                        type: 'insight',
                        content: insight.content,
                        enhanced_content: insight.enhanced_content,
                        importance: insight.quality_scores?.importance || 0.5,
                        confidence: insight.quality_scores?.confidence || 0.5,
                        aiEnhanced: !!insight.dna_enhanced,
                        keywords: insight.keywords || [],
                        relatedConcepts: insight.related_concepts || []
                    }
                };
                nodes.push(insightNode);

                // セッション-知見エッジ
                edges.push({
                    from: sessionNode.id,
                    to: insightNode.id,
                    label: '含有',
                    color: { opacity: 0.6 }
                });

                // 知見間関係性エッジ（キーワード・概念の共通性）
                this.findInsightRelationships(insight, insightNode.id, session, sessionIndex, database, edges);
            });
        });

        console.log(`🕸️ ネットワーク構築完了: ${nodes.length}ノード, ${edges.length}エッジ`);
        return { nodes, edges };
    }

    /**
     * 🔗 知見間関係性発見
     */
    findInsightRelationships(currentInsight, currentNodeId, currentSession, currentSessionIndex, database, edges) {
        const currentKeywords = new Set(currentInsight.keywords || []);
        const currentConcepts = new Set(currentInsight.related_concepts || []);

        database.sessions.forEach((session, sessionIndex) => {
            session.insights.forEach((insight, insightIndex) => {
                if (sessionIndex === currentSessionIndex && insight === currentInsight) return;

                const targetNodeId = `insight_${sessionIndex}_${insightIndex}`;
                const targetKeywords = new Set(insight.keywords || []);
                const targetConcepts = new Set(insight.related_concepts || []);

                // キーワード重複度
                const keywordOverlap = this.calculateSetOverlap(currentKeywords, targetKeywords);
                // 概念重複度
                const conceptOverlap = this.calculateSetOverlap(currentConcepts, targetConcepts);
                
                // 関係性の強さ
                const relationshipStrength = keywordOverlap + conceptOverlap;
                
                if (relationshipStrength > 0.2) { // 閾値
                    edges.push({
                        from: currentNodeId,
                        to: targetNodeId,
                        label: this.getRelationshipLabel(keywordOverlap, conceptOverlap),
                        width: Math.min(relationshipStrength * 5, 3),
                        color: { opacity: Math.min(relationshipStrength, 0.8) },
                        metadata: {
                            strength: relationshipStrength,
                            keywordOverlap,
                            conceptOverlap
                        }
                    });
                }
            });
        });
    }

    /**
     * 🧮 集合重複度計算
     */
    calculateSetOverlap(set1, set2) {
        if (set1.size === 0 || set2.size === 0) return 0;
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size; // Jaccard係数
    }

    /**
     * 🏷️ 関係性ラベル生成
     */
    getRelationshipLabel(keywordOverlap, conceptOverlap) {
        if (keywordOverlap > conceptOverlap) {
            return keywordOverlap > 0.5 ? '強いキーワード関連' : 'キーワード関連';
        } else {
            return conceptOverlap > 0.5 ? '強い概念関連' : '概念関連';
        }
    }

    /**
     * 🎨 セッション色生成
     */
    getSessionColor(index) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
        return colors[index % colors.length];
    }

    /**
     * 🎨 知見色生成（重要度・AI強化状況ベース）
     */
    getInsightColor(insight) {
        const importance = insight.quality_scores?.importance || 0.5;
        const isAIEnhanced = !!insight.dna_enhanced;
        
        if (isAIEnhanced) {
            // AI強化済み: 重要度に応じた緑系
            if (importance > 0.8) return '#2ECC71'; // 濃い緑
            if (importance > 0.6) return '#58D68D'; // 中緑
            return '#85E085'; // 薄い緑
        } else {
            // 未強化: 重要度に応じたグレー系
            if (importance > 0.8) return '#5D6D7E'; // 濃いグレー
            if (importance > 0.6) return '#85929E'; // 中グレー
            return '#BDC3C7'; // 薄いグレー
        }
    }

    /**
     * 🔬 概念クラスター分析
     */
    analyzeConcepts(database) {
        const conceptFreq = {};
        const keywordFreq = {};
        const conceptCooccurrence = {};

        database.sessions.forEach(session => {
            session.insights.forEach(insight => {
                // キーワード頻度
                (insight.keywords || []).forEach(keyword => {
                    keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
                });

                // 概念頻度
                (insight.related_concepts || []).forEach(concept => {
                    conceptFreq[concept] = (conceptFreq[concept] || 0) + 1;
                });

                // 概念共起
                const concepts = insight.related_concepts || [];
                for (let i = 0; i < concepts.length; i++) {
                    for (let j = i + 1; j < concepts.length; j++) {
                        const pair = [concepts[i], concepts[j]].sort().join('|');
                        conceptCooccurrence[pair] = (conceptCooccurrence[pair] || 0) + 1;
                    }
                }
            });
        });

        return {
            topKeywords: Object.entries(keywordFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20),
            topConcepts: Object.entries(conceptFreq)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15),
            conceptPairs: Object.entries(conceptCooccurrence)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
        };
    }

    /**
     * 🤖 AI強化統計分析
     */
    analyzeAIEnhancements(database) {
        let totalInsights = 0;
        let aiEnhanced = 0;
        let qualityScores = [];
        let enhancementTypes = {};

        database.sessions.forEach(session => {
            session.insights.forEach(insight => {
                totalInsights++;
                
                if (insight.dna_enhanced) {
                    aiEnhanced++;
                }
                
                if (insight.quality_scores) {
                    qualityScores.push({
                        importance: insight.quality_scores.importance || 0.5,
                        confidence: insight.quality_scores.confidence || 0.5
                    });
                }

                // 強化タイプ分析
                if (insight.enhanced_content) enhancementTypes.content = (enhancementTypes.content || 0) + 1;
                if (insight.summary) enhancementTypes.summary = (enhancementTypes.summary || 0) + 1;
                if (insight.keywords?.length > 0) enhancementTypes.keywords = (enhancementTypes.keywords || 0) + 1;
                if (insight.related_concepts?.length > 0) enhancementTypes.concepts = (enhancementTypes.concepts || 0) + 1;
            });
        });

        const avgImportance = qualityScores.length > 0 ? 
            qualityScores.reduce((sum, score) => sum + score.importance, 0) / qualityScores.length : 0;

        const avgConfidence = qualityScores.length > 0 ? 
            qualityScores.reduce((sum, score) => sum + score.confidence, 0) / qualityScores.length : 0;

        return {
            totalInsights,
            aiEnhanced,
            enhancementRate: totalInsights > 0 ? aiEnhanced / totalInsights : 0,
            avgImportance,
            avgConfidence,
            enhancementTypes,
            qualityDistribution: this.analyzeQualityDistribution(qualityScores)
        };
    }

    /**
     * 📊 品質分布分析
     */
    analyzeQualityDistribution(qualityScores) {
        const importanceBins = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
        const confidenceBins = [0, 0, 0, 0, 0];

        qualityScores.forEach(score => {
            const impBin = Math.min(Math.floor(score.importance * 5), 4);
            const confBin = Math.min(Math.floor(score.confidence * 5), 4);
            
            importanceBins[impBin]++;
            confidenceBins[confBin]++;
        });

        return { importanceBins, confidenceBins };
    }

    /**
     * 📊 関係性マトリクス構築
     */
    buildRelationshipMatrix(database) {
        const matrix = [];
        const sessions = database.sessions;

        sessions.forEach((session1, i) => {
            const row = [];
            sessions.forEach((session2, j) => {
                if (i === j) {
                    row.push(1.0); // 自己関係性は1.0
                } else {
                    const similarity = this.calculateSessionSimilarity(session1, session2);
                    row.push(similarity);
                }
            });
            matrix.push(row);
        });

        console.log(`📊 関係性マトリクス構築完了: ${matrix.length}x${matrix[0]?.length || 0}`);
        return matrix;
    }

    /**
     * 🔗 セッション類似度計算
     */
    calculateSessionSimilarity(session1, session2) {
        const keywords1 = new Set();
        const concepts1 = new Set();
        const keywords2 = new Set();
        const concepts2 = new Set();

        // セッション1のキーワード・概念収集
        session1.insights.forEach(insight => {
            (insight.keywords || []).forEach(k => keywords1.add(k));
            (insight.related_concepts || []).forEach(c => concepts1.add(c));
        });

        // セッション2のキーワード・概念収集
        session2.insights.forEach(insight => {
            (insight.keywords || []).forEach(k => keywords2.add(k));
            (insight.related_concepts || []).forEach(c => concepts2.add(c));
        });

        // Jaccard係数による類似度計算
        const keywordSimilarity = this.calculateSetOverlap(keywords1, keywords2);
        const conceptSimilarity = this.calculateSetOverlap(concepts1, concepts2);

        return (keywordSimilarity + conceptSimilarity) / 2;
    }

    /**
     * ⏰ 時系列パターン分析
     */
    analyzeTemporalPatterns(database) {
        const timelineData = [];
        const qualityTrends = [];
        const themEvolution = {};

        database.sessions.forEach((session, index) => {
            const sessionDate = new Date(session.date);
            
            // セッション統計
            const sessionStats = {
                date: sessionDate,
                sessionIndex: index,
                theme: session.theme,
                insightCount: session.insights.length,
                avgImportance: session.insights.length > 0 ? 
                    session.insights.reduce((sum, i) => sum + (i.quality_scores?.importance || 0.5), 0) / session.insights.length : 0,
                avgConfidence: session.insights.length > 0 ? 
                    session.insights.reduce((sum, i) => sum + (i.quality_scores?.confidence || 0.5), 0) / session.insights.length : 0,
                aiEnhancedRate: session.insights.length > 0 ?
                    session.insights.filter(i => i.dna_enhanced).length / session.insights.length : 0
            };

            timelineData.push(sessionStats);
            qualityTrends.push({
                session: index + 1,
                importance: Math.round(sessionStats.avgImportance * 100),
                confidence: Math.round(sessionStats.avgConfidence * 100),
                aiRate: Math.round(sessionStats.aiEnhancedRate * 100)
            });

            // テーマ進化追跡
            const category = session.metadata?.category || 'その他';
            if (!themEvolution[category]) {
                themEvolution[category] = [];
            }
            themEvolution[category].push({
                date: sessionDate,
                theme: session.theme,
                insightCount: session.insights.length
            });
        });

        // トレンド分析
        const trends = this.calculateTrends(qualityTrends);

        return {
            timeline: timelineData,
            qualityTrends,
            themeEvolution: themEvolution,
            trends
        };
    }

    /**
     * 📈 トレンド計算
     */
    calculateTrends(data) {
        if (data.length < 2) return { importance: 0, confidence: 0, aiRate: 0 };

        const first = data[0];
        const last = data[data.length - 1];

        return {
            importance: last.importance - first.importance,
            confidence: last.confidence - first.confidence,
            aiRate: last.aiRate - first.aiRate
        };
    }

    /**
     * 🎨 単一セッション知見のインフォグラフィック生成（高度版）
     */
    async generateSessionInfographic(sessionData = null) {
        try {
            console.log('🎨 高度セッション知見インフォグラフィック生成開始');
            console.log('🔬 詳細デバッグ - セッション分析開始');

            this.showLoadingMessage('📊 セッションデータ読み込み中...');
            console.log('📊 セッションデータ取得開始...');
            const data = sessionData || await this.safeGetSessionData();
            console.log('📊 取得データ詳細:', {
                hasData: !!data,
                hasInsights: !!data?.insights,
                insightsCount: data?.insights?.length || 0,
                theme: data?.meta?.theme || 'なし',
                dataKeys: data ? Object.keys(data) : []
            });
            
            if (!data || !data.insights || data.insights.length === 0) {
                console.warn('⚠️ セッションデータが不足しています');
                this.showNoDataMessage('現在のセッションに知見データがありません');
                return;
            }

            this.showLoadingMessage('📚 高度分析ライブラリ読み込み中...');
            console.log('📚 ライブラリ読み込み開始...');
            const librariesLoaded = await this.loadAllLibraries();
            console.log('📚 ライブラリ読み込み結果:', librariesLoaded);
            
            this.showLoadingMessage('🧬 Knowledge DNA分析中...');
            console.log('🧬 Knowledge DNA分析開始...');
            // 単一セッション用の簡易データベース作成
            const sessionDatabase = {
                sessions: [{
                    ...data.meta,
                    insights: data.insights,
                    metadata: data.meta
                }],
                totalSessions: 1,
                totalInsights: data.insights.length
            };
            console.log('🗃️ セッションデータベース作成完了:', {
                sessions: sessionDatabase.sessions.length,
                totalInsights: sessionDatabase.totalInsights
            });
            
            const analysisData = this.analyzeKnowledgeDNA(sessionDatabase);
            console.log('🧬 分析結果:', {
                networkNodes: analysisData?.knowledgeNetwork?.nodes?.length || 0,
                networkEdges: analysisData?.knowledgeNetwork?.edges?.length || 0,
                aiEnhanced: analysisData?.aiEnhancementStats?.aiEnhanced || 0,
                conceptsCount: Object.keys(analysisData?.conceptClusters || {}).length
            });
            
            this.showLoadingMessage('🎨 高度インフォグラフィック生成中...');
            console.log('📄 HTMLレポート生成開始...');
            const html = this.buildAdvancedSessionInfographicHTML(data, analysisData);
            console.log('📄 HTMLレポート生成完了（文字数:', html.length, '文字）');
            
            console.log('🖼️ インフォグラフィック表示開始...');
            this.displayInfographic(html, `🧬 Knowledge DNA分析 - ${data.meta.theme || '深堀セッション'}`);
            console.log('🖼️ 表示完了');

        } catch (error) {
            console.error('⚠️ 高度セッションインフォグラフィック生成エラー（詳細）:', error);
            console.error('⚠️ エラースタック:', error.stack);
            this.showErrorMessage(`高度セッション可視化でエラーが発生しました: ${error.message}`);
        }
    }

    /**
     * 🌐 全知見のインフォグラフィック生成
     */
    async generateAllKnowledgeInfographic() {
        try {
            console.log('🌐 高度全知見インフォグラフィック生成開始');
            console.log('🔬 詳細デバッグ - 全知見分析開始');

            // 読み込み状況をユーザーに通知
            this.showLoadingMessage('📊 全知見データ読み込み中...');
            console.log('📊 全知見データ取得開始...');

            const database = await this.safeGetAllKnowledgeData();
            console.log('📊 取得データベース詳細:', {
                hasDatabase: !!database,
                hasSessions: !!database?.sessions,
                sessionsCount: database?.sessions?.length || 0,
                totalSessions: database?.totalSessions || 0,
                totalInsights: database?.totalInsights || 0,
                databaseKeys: database ? Object.keys(database) : []
            });
            
            if (!database || !database.sessions || database.sessions.length === 0) {
                console.warn('⚠️ 全知見データが不足しています');
                this.showNoDataMessage('全知見データがありません');
                return;
            }

            this.showLoadingMessage('📚 高度分析ライブラリ読み込み中...');
            console.log('📚 ライブラリ読み込み開始...');
            const librariesLoaded = await this.loadAllLibraries();
            console.log('📚 ライブラリ読み込み結果:', librariesLoaded);

            this.showLoadingMessage('🧬 Knowledge DNA深度分析実行中...');
            console.log('🧬 全知見Knowledge DNA分析開始...');
            const analysisData = this.analyzeKnowledgeDNA(database);
            console.log('🧬 全知見分析結果:', {
                networkNodes: analysisData?.knowledgeNetwork?.nodes?.length || 0,
                networkEdges: analysisData?.knowledgeNetwork?.edges?.length || 0,
                aiEnhanced: analysisData?.aiEnhancementStats?.aiEnhanced || 0,
                conceptsCount: Object.keys(analysisData?.conceptClusters || {}).length,
                temporalPatternsLength: analysisData?.temporalPatterns?.qualityTrends?.length || 0
            });
            
            this.showLoadingMessage('🎨 高度インフォグラフィック生成中...');
            console.log('📄 全知見HTMLレポート生成開始...');
            const html = this.buildAdvancedAllKnowledgeInfographicHTML(database, analysisData);
            console.log('📄 全知見HTMLレポート生成完了（文字数:', html.length, '文字）');
            
            console.log('🖼️ 全知見インフォグラフィック表示開始...');
            this.displayInfographic(html, `🧬 Knowledge DNA全解析 - ${database.totalSessions}セッション`);
            console.log('🖼️ 全知見表示完了');

            this.showSuccessMessage('✅ 高度全知見インフォグラフィック生成完了');

        } catch (error) {
            console.error('⚠️ 高度全知見インフォグラフィック生成エラー（詳細）:', error);
            console.error('⚠️ エラースタック:', error.stack);
            this.showErrorMessage(`高度全知見可視化でエラーが発生しました: ${error.message}`);
        }
    }

    /**
     * 🧬 高度セッション知見HTML構築（Phase 1）
     */
    buildAdvancedSessionInfographicHTML(data, analysisData) {
        const insights = data.insights;
        const meta = data.meta;
        const theme = meta.theme || 'セッション';
        const network = analysisData.knowledgeNetwork;
        const concepts = analysisData.conceptClusters;
        const aiStats = analysisData.aiEnhancementStats;
        const temporalPatterns = analysisData.temporalPatterns;
        
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge DNA セッション分析レポート - ${theme}</title>
    
    <!-- 可視化ライブラリの非同期読み込み -->
    <script async src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <script async src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
    <script async src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    
    <style>
        ${this.getAdvancedInfographicCSS()}
    </style>
</head>
<body class="advanced-infographic-body">
    <div class="advanced-container">
        <!-- ヘッダー -->
        <header class="advanced-header">
            <div class="header-logo-section">
                <img src="assets/fukabori_logo_wb.png" alt="深堀くんロゴ" class="fukabori-logo">
                <div class="dna-logo">🧬</div>
            </div>
            <div class="header-text">
                <h1>Knowledge DNA セッション分析レポート</h1>
                <h2>セッション: ${theme} | ${insights.length}件の知見</h2>
                <div class="analysis-meta">
                    Phase 1: 単一セッション深掘り分析 | Generated: ${new Date().toLocaleString('ja-JP')}
                </div>
            </div>
            <div class="header-avatars">
                <img src="assets/hahori_avatar.png" alt="はほりー" class="avatar-icon">
                <img src="assets/nehori_avatar.png" alt="ねほりー" class="avatar-icon">
            </div>
        </header>

        <!-- Knowledge DNAネットワーク - 1カラム大画面表示 -->
        <section class="network-main-section">
            <h3>🕸️ Knowledge DNAネットワーク（セッション内関係性）</h3>
            <div class="main-network-container">
                <div id="sessionKnowledgeNetwork" class="main-network-canvas"></div>
            </div>
        </section>

        <!-- エグゼクティブダッシュボード -->
        <section class="executive-dashboard">
            <h3>📊 セッション分析ダッシュボード</h3>
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h4>📈 品質トレンド</h4>
                    <canvas id="sessionQualityTrendChart"></canvas>
                </div>
                <div class="dashboard-card">
                    <h4>🤖 AI強化進捗</h4>
                    <canvas id="sessionAiProgressChart"></canvas>
                </div>
            </div>
        </section>

        <!-- 2カラム分析レイアウト -->
        <div class="two-column-analysis-layout">
            <!-- 左カラム -->
            <div class="analysis-left-column">
                <!-- 🔬 概念進化分析 -->
                <section class="concept-evolution-section">
                    <h3>🔬 セッション内概念進化</h3>
                    <div class="concept-evolution">
                        <div class="keyword-cloud-container">
                            <h4>キーワード出現頻度</h4>
                            <div class="advanced-keyword-cloud">
                                ${(concepts.topKeywords || []).map(([keyword, freq], index) => `
                                    <span class="advanced-keyword" 
                                          style="font-size: ${16 + Math.min(freq * 3, 20)}px; 
                                                 opacity: ${0.7 + (freq / Math.max(...(concepts.topKeywords || [[keyword, freq]]).map(k => k[1]))) * 0.3}">
                                        ${keyword}
                                        <span class="keyword-freq">${freq}</span>
                                    </span>
                                `).join('') || '<p class="no-data">キーワードデータがありません</p>'}
                            </div>
                        </div>
                        
                        <div class="concept-pairs-container">
                            <h4>概念共起関係</h4>
                            <div class="concept-pairs">
                                ${(concepts.conceptPairs || []).map(([pair, freq]) => {
                                    const [concept1, concept2] = pair.split('|');
                                    return `
                                        <div class="concept-pair">
                                            <div class="pair-concepts">
                                                <span class="concept">${concept1}</span>
                                                <span class="pair-connector">⇄</span>
                                                <span class="concept">${concept2}</span>
                                            </div>
                                            <span class="pair-frequency">${freq}回</span>
                                        </div>
                                    `;
                                }).join('') || '<p class="no-data">概念共起データがありません</p>'}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <!-- 右カラム -->
            <div class="analysis-right-column">
                <!-- 🤖 AI強化分析結果 -->
                <section class="ai-enhancement-section">
                    <h3>🤖 AI強化分析結果</h3>
                    <div class="ai-enhancement-summary">
                        <div class="enhancement-metrics">
                            <div class="metric-item">
                                <span class="metric-label">強化済み知見</span>
                                <span class="metric-value">${aiStats.aiEnhanced}件</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">平均品質スコア</span>
                                <span class="metric-value">${Math.round(aiStats.avgImportance * 100)}%</span>
                            </div>
                        </div>
                        <div class="enhancement-stats">
                            <h4>強化タイプ別統計</h4>
                            <div class="enhancement-list">
                                ${Object.entries(aiStats.enhancementTypes || {}).map(([type, count]) => `
                                    <div class="enhancement-item">
                                        <span class="enhancement-type">${this.getEnhancementTypeLabel(type)}</span>
                                        <span class="enhancement-count">${count}件</span>
                                        <div class="enhancement-bar">
                                            <div class="enhancement-fill" style="width: ${(count / Math.max(aiStats.totalInsights, 1)) * 100}%"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 📊 知見関係性マトリクス -->
                <section class="relationship-matrix-section">
                    <h3>📊 知見関係性マトリクス</h3>
                    <div id="sessionRelationshipMatrix" class="matrix-container"></div>
                </section>
            </div>
        </div>

        <!-- 知見詳細カード -->
        <section class="insights-detail-section">
            <h3>💎 知見詳細カード</h3>
            <div class="insights-container">
                ${insights.map((insight, index) => `
                    <div class="insight-card ${insight.dna_enhanced ? 'ai-enhanced' : 'raw'}">
                        <div class="insight-header">
                            <div class="insight-id">知見 #${index + 1}</div>
                            <div class="status-badge ${insight.dna_enhanced ? 'ai' : 'raw'}">
                                ${insight.dna_enhanced ? '🤖 AI強化済み' : '📝 生データ'}
                            </div>
                        </div>
                        
                        <div class="insight-content">
                            ${insight.dna_enhanced && insight.enhanced_content ? `
                                <div class="content-comparison">
                                    <div class="content-section">
                                        <h5>🔄 AI強化後</h5>
                                        <div class="enhanced-content">${this.parseEnhancedContent(insight.enhanced_content)}</div>
                                    </div>
                                    <div class="content-section">
                                        <h5>📝 元の内容</h5>
                                        <div class="original-content">${insight.content}</div>
                                    </div>
                                </div>
                            ` : `
                                <div class="content-section">
                                    <h5>📝 内容</h5>
                                    <div class="raw-content">${insight.content}</div>
                                </div>
                            `}
                        </div>

                        <div class="quality-scores">
                            <div class="score-item">
                                <span class="score-label">重要度</span>
                                <div class="score-bar">
                                    <div class="score-fill importance" 
                                         style="width: ${(insight.quality_scores?.importance || 0.5) * 100}%"></div>
                                </div>
                                <span class="score-value">${Math.round((insight.quality_scores?.importance || 0.5) * 100)}%</span>
                            </div>
                            <div class="score-item">
                                <span class="score-label">信頼度</span>
                                <div class="score-bar">
                                    <div class="score-fill confidence" 
                                         style="width: ${(insight.quality_scores?.confidence || 0.5) * 100}%"></div>
                                </div>
                                <span class="score-value">${Math.round((insight.quality_scores?.confidence || 0.5) * 100)}%</span>
                            </div>
                        </div>
                        
                        ${(insight.keywords && insight.keywords.length > 0) ? `
                            <div class="insight-keywords">
                                <span class="keywords-label">🏷️ キーワード:</span>
                                ${insight.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                            </div>
                        ` : ''}
                        
                        ${(insight.related_concepts && insight.related_concepts.length > 0) ? `
                            <div class="insight-concepts">
                                <span class="concepts-label">🔗 関連概念:</span>
                                ${insight.related_concepts.map(concept => `<span class="concept-tag">${concept}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- フッター -->
        <footer class="advanced-footer">
            <div class="footer-info">
                <div class="generation-info">
                    <strong>🧬 深堀くん Knowledge DNA分析システム Phase 1</strong><br>
                    Generated: ${new Date().toLocaleString('ja-JP')}<br>
                    Analysis Engine: v2.0.0 | Session Insights Analyzed: ${insights.length}
                </div>
            </div>
        </footer>
    </div>

    <script>
        // 深堀くんテーマ連動システム（強化版）
        function applyFukaboriTheme() {
            console.log('🎨 深堀くんテーマ連動開始（セッション版）');
            
            // 深堀くんのテーマ設定を取得（複数方法で試行）
            let fukaboriTheme = 'blue'; // デフォルト
            
            try {
                // 方法1: 親ウィンドウのグローバル変数
                if (window.opener && window.opener.currentTheme) {
                    fukaboriTheme = window.opener.currentTheme;
                    console.log('🔗 親ウィンドウ.currentThemeから取得:', fukaboriTheme);
                } 
                // 方法2: 親ウィンドウのローカルストレージ
                else if (window.opener && window.opener.localStorage) {
                    const openerTheme = window.opener.localStorage.getItem('selectedTheme');
                    if (openerTheme) {
                        fukaboriTheme = openerTheme;
                        console.log('🔗 親ウィンドウのlocalStorageから取得:', fukaboriTheme);
                    }
                }
                // 方法3: 自身のローカルストレージ
                else {
                    const storedTheme = localStorage.getItem('selectedTheme');
                    if (storedTheme) {
                        fukaboriTheme = storedTheme;
                        console.log('💾 自身のローカルストレージから取得:', fukaboriTheme);
                    }
                }
                
                // 方法4: URLパラメータから取得（将来の拡張用）
                const urlParams = new URLSearchParams(window.location.search);
                const urlTheme = urlParams.get('theme');
                if (urlTheme) {
                    fukaboriTheme = urlTheme;
                    console.log('🔗 URLパラメータから取得:', fukaboriTheme);
                }
                
            } catch (error) {
                console.log('ℹ️ テーマ取得エラー（デフォルトテーマ使用）:', error.message);
            }
            
            console.log('🎯 最終決定テーマ:', fukaboriTheme);
            
            // テーマ別色設定
            const themeColors = {
                'blue': {
                    primary: 'rgba(0,150,255,0.8)',
                    secondary: 'rgba(0,100,200,0.6)',
                    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #8e44ad 100%)'
                },
                'purple': {
                    primary: 'rgba(156,39,176,0.8)',
                    secondary: 'rgba(123,31,162,0.6)',
                    gradient: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 25%, #8e24aa 50%, #ab47bc 75%, #ce93d8 100%)'
                },
                'green': {
                    primary: 'rgba(76,175,80,0.8)',
                    secondary: 'rgba(67,160,71,0.6)',
                    gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 25%, #388e3c 50%, #4caf50 75%, #66bb6a 100%)'
                },
                'orange': {
                    primary: 'rgba(255,152,0,0.8)',
                    secondary: 'rgba(245,124,0,0.6)',
                    gradient: 'linear-gradient(135deg, #e65100 0%, #f57c00 25%, #ff9800 50%, #ffb74d 75%, #ffcc02 100%)'
                },
                'red': {
                    primary: 'rgba(244,67,54,0.8)',
                    secondary: 'rgba(229,57,53,0.6)',
                    gradient: 'linear-gradient(135deg, #b71c1c 0%, #c62828 25%, #d32f2f 50%, #f44336 75%, #ef5350 100%)'
                }
            };
            
            const theme = themeColors[fukaboriTheme] || themeColors['blue'];
            
            // 動的スタイル適用（強化版）
            const dynamicStyle = document.createElement('style');
            dynamicStyle.id = 'fukabori-theme-style';
            dynamicStyle.innerHTML = \`
                /* 背景テーマ連動 */
                .advanced-infographic-body {
                    background: radial-gradient(ellipse at top, \${theme.primary} 0%, \${theme.secondary} 20%), 
                               \${theme.gradient} !important;
                }
                
                /* ヘッダーテーマエフェクト */
                .advanced-header::before {
                    background: \${theme.gradient};
                    opacity: 0.15;
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 20px;
                    pointer-events: none;
                    z-index: -1;
                }
                
                /* メインネットワークセクションテーマエフェクト */
                .network-main-section::before {
                    background: \${theme.gradient};
                    opacity: 0.08;
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 20px;
                    pointer-events: none;
                    z-index: -1;
                }
                
                /* ダッシュボードカードのアクセント */
                .dashboard-card:hover {
                    background: \${theme.primary.replace('0.8', '0.2')} !important;
                }
                
                /* セクションヘッダーのアクセント */
                .network-main-section h3, .executive-dashboard h3,
                .concept-evolution-section h3, .ai-enhancement-section h3,
                .relationship-matrix-section h3, .insights-detail-section h3 {
                    border-bottom-color: \${theme.primary.replace('0.8', '0.4')} !important;
                }
                
                /* 知見カードのテーマアクセント */
                .insight-card.ai-enhanced {
                    border-left-color: \${theme.primary.replace('0.8', '0.6')} !important;
                }
            \`;
            
            // 既存のテーマスタイルがあれば削除
            const existingStyle = document.getElementById('fukabori-theme-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            document.head.appendChild(dynamicStyle);
            console.log('✅ 深堀くんテーマ連動完了（セッション版）:', fukaboriTheme);
            console.log('🎨 適用済みテーマ色:', theme);
        }
        
        // テーマ適用を複数タイミングで実行（確実な適用のため）
        applyFukaboriTheme();
        
        // DOM完全読み込み後にも再実行
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔄 DOM完全読み込み後のテーマ再適用（セッション版）');
            setTimeout(applyFukaboriTheme, 100);
        });
        
        // 初期化完了後にも再実行
        window.addEventListener('load', function() {
            console.log('🔄 ページ完全読み込み後のテーマ再適用（セッション版）');
            setTimeout(applyFukaboriTheme, 200);
        });

        ${this.getAdvancedInfographicJS(data, analysisData)}
    </script>
</body>
</html>
        `;
    }

    /**
     * 🧬 高度全知見インフォグラフィックHTML構築（Phase 1）
     */
    buildAdvancedAllKnowledgeInfographicHTML(database, analysisData) {
        const network = analysisData.knowledgeNetwork;
        const concepts = analysisData.conceptClusters;
        const aiStats = analysisData.aiEnhancementStats;
        const temporalPatterns = analysisData.temporalPatterns;
        
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Knowledge DNA全解析レポート - ${database.totalSessions}セッション</title>
    
    <!-- 可視化ライブラリの非同期読み込み -->
    <script async src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <script async src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
    <script async src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    
    <style>
        ${this.getAdvancedInfographicCSS()}
    </style>
</head>
<body class="advanced-infographic-body">
    <div class="advanced-container">
        <!-- ヘッダー -->
        <header class="advanced-header">
            <div class="header-logo-section">
                <img src="assets/fukabori_logo_wb.png" alt="深堀くんロゴ" class="fukabori-logo">
                <div class="dna-logo">🧬</div>
            </div>
            <div class="header-text">
                <h1>Knowledge DNA全解析レポート</h1>
                <h2>${database.totalSessions}セッション / ${database.totalInsights}知見</h2>
                <div class="analysis-meta">
                    Phase 1: 全知見横断分析 | Generated: ${new Date().toLocaleString('ja-JP')}
                </div>
            </div>
            <div class="header-avatars">
                <img src="assets/hahori_avatar.png" alt="はほりー" class="avatar-icon">
                <img src="assets/nehori_avatar.png" alt="ねほりー" class="avatar-icon">
            </div>
        </header>

        <!-- Knowledge DNAネットワーク - 1カラム大画面表示 -->
        <section class="network-main-section">
            <h3>🕸️ Knowledge DNAネットワーク全体</h3>
            <div class="main-network-container">
                <div id="globalKnowledgeNetwork" class="main-network-canvas"></div>
            </div>
        </section>

        <!-- エグゼクティブダッシュボード -->
        <section class="executive-dashboard">
            <h3>📊 全体ダッシュボード</h3>
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h4>📈 品質トレンド</h4>
                    <canvas id="qualityTrendChart"></canvas>
                </div>
                <div class="dashboard-card">
                    <h4>🤖 AI強化進捗</h4>
                    <canvas id="aiProgressChart"></canvas>
                </div>
            </div>
        </section>

        <!-- 2カラム横断分析レイアウト -->
        <div class="two-column-analysis-layout">
            <!-- 左カラム -->
            <div class="analysis-left-column">
                <!-- 🔬 概念進化分析 -->
                <section class="concept-evolution-section">
                    <h3>🔬 概念進化分析</h3>
                    <div class="concept-evolution">
                        ${Object.entries(temporalPatterns.themeEvolution).map(([category, themes]) => `
                            <div class="evolution-category">
                                <h5>${category}</h5>
                                <div class="theme-timeline">
                                    ${themes.map((theme, index) => `
                                        <div class="timeline-item">
                                            <div class="timeline-marker"></div>
                                            <div class="timeline-content">
                                                <div class="theme-title">${this.truncateText(theme.theme, 25)}</div>
                                                <div class="theme-date">${new Date(theme.date).toLocaleDateString('ja-JP')}</div>
                                                <div class="theme-insights">${theme.insightCount}件</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- ⏰ セッション時系列 -->
                <section class="temporal-analysis-section">
                    <h3>⏰ セッション時系列</h3>
                    <div class="temporal-content">
                        <canvas id="temporalDetailChart" class="temporal-chart"></canvas>
                    </div>
                </section>
            </div>

            <!-- 右カラム -->
            <div class="analysis-right-column">
                <!-- 🌐 横断分析結果 -->
                <section class="cross-analysis-results-section">
                    <h3>🌐 横断分析結果</h3>
                    <div class="cross-analysis-summary">
                        <div class="analysis-metrics">
                            <div class="metric-item">
                                <span class="metric-label">セッション関連度</span>
                                <span class="metric-value">${Math.round(analysisData.relationshipMatrix.avgSimilarity * 100)}%</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">概念収束性</span>
                                <span class="metric-value">${Object.keys(concepts.topConcepts).length}概念</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- 📊 関係性マトリクス -->
                <section class="relationship-matrix-section">
                    <h3>📊 関係性マトリクス</h3>
                    <div id="relationshipMatrix" class="matrix-container"></div>
                </section>
            </div>
        </div>

        <!-- セッション詳細比較 -->
        <section class="session-comparison-section">
            <h3>🔍 セッション詳細比較</h3>
            <div class="session-grid">
                ${database.sessions.map((session, index) => `
                    <div class="session-comparison-card">
                        <div class="session-header">
                            <h4>セッション ${index + 1}</h4>
                            <div class="session-theme">${session.theme}</div>
                            <div class="session-date">${session.date}</div>
                        </div>
                        
                        <div class="session-stats">
                            <div class="stat-row">
                                <span>知見数:</span>
                                <span>${session.insights.length}</span>
                            </div>
                            <div class="stat-row">
                                <span>AI強化率:</span>
                                <span>${Math.round((session.insights.filter(i => i.dna_enhanced).length / session.insights.length) * 100)}%</span>
                            </div>
                            <div class="stat-row">
                                <span>平均重要度:</span>
                                <span>${Math.round((session.insights.reduce((sum, i) => sum + (i.quality_scores?.importance || 0.5), 0) / session.insights.length) * 100)}%</span>
                            </div>
                        </div>

                        <div class="session-keywords">
                            <h5>主要キーワード</h5>
                            <div class="session-keyword-cloud">
                                ${this.getSessionKeywords(session).slice(0, 5).map(([keyword, freq]) => `
                                    <span class="session-keyword">${keyword} (${freq})</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- フッター -->
        <footer class="advanced-footer">
            <div class="footer-info">
                <div class="generation-info">
                    <strong>🧬 深堀くん Knowledge DNA分析システム Phase 1</strong><br>
                    Generated: ${new Date().toLocaleString('ja-JP')}<br>
                    Analysis Engine: v2.0.0 | Total Insights Analyzed: ${database.totalInsights}
                </div>
            </div>
        </footer>
    </div>

    <script>
        // 深堀くんテーマ連動システム（強化版）
        function applyFukaboriTheme() {
            console.log('🎨 深堀くんテーマ連動開始');
            
            // 深堀くんのテーマ設定を取得（複数方法で試行）
            let fukaboriTheme = 'blue'; // デフォルト
            
            try {
                // 方法1: 親ウィンドウのグローバル変数
                if (window.opener && window.opener.currentTheme) {
                    fukaboriTheme = window.opener.currentTheme;
                    console.log('🔗 親ウィンドウ.currentThemeから取得:', fukaboriTheme);
                } 
                // 方法2: 親ウィンドウのローカルストレージ
                else if (window.opener && window.opener.localStorage) {
                    const openerTheme = window.opener.localStorage.getItem('selectedTheme');
                    if (openerTheme) {
                        fukaboriTheme = openerTheme;
                        console.log('🔗 親ウィンドウのlocalStorageから取得:', fukaboriTheme);
                    }
                }
                // 方法3: 自身のローカルストレージ
                else {
                    const storedTheme = localStorage.getItem('selectedTheme');
                    if (storedTheme) {
                        fukaboriTheme = storedTheme;
                        console.log('💾 自身のローカルストレージから取得:', fukaboriTheme);
                    }
                }
                
                // 方法4: URLパラメータから取得（将来の拡張用）
                const urlParams = new URLSearchParams(window.location.search);
                const urlTheme = urlParams.get('theme');
                if (urlTheme) {
                    fukaboriTheme = urlTheme;
                    console.log('🔗 URLパラメータから取得:', fukaboriTheme);
                }
                
            } catch (error) {
                console.log('ℹ️ テーマ取得エラー（デフォルトテーマ使用）:', error.message);
            }
            
            console.log('🎯 最終決定テーマ:', fukaboriTheme);
            
            // テーマ別色設定
            const themeColors = {
                'blue': {
                    primary: 'rgba(0,150,255,0.8)',
                    secondary: 'rgba(0,100,200,0.6)',
                    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #8e44ad 100%)'
                },
                'purple': {
                    primary: 'rgba(156,39,176,0.8)',
                    secondary: 'rgba(123,31,162,0.6)',
                    gradient: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 25%, #8e24aa 50%, #ab47bc 75%, #ce93d8 100%)'
                },
                'green': {
                    primary: 'rgba(76,175,80,0.8)',
                    secondary: 'rgba(67,160,71,0.6)',
                    gradient: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 25%, #388e3c 50%, #4caf50 75%, #66bb6a 100%)'
                },
                'orange': {
                    primary: 'rgba(255,152,0,0.8)',
                    secondary: 'rgba(245,124,0,0.6)',
                    gradient: 'linear-gradient(135deg, #e65100 0%, #f57c00 25%, #ff9800 50%, #ffb74d 75%, #ffcc02 100%)'
                },
                'red': {
                    primary: 'rgba(244,67,54,0.8)',
                    secondary: 'rgba(229,57,53,0.6)',
                    gradient: 'linear-gradient(135deg, #b71c1c 0%, #c62828 25%, #d32f2f 50%, #f44336 75%, #ef5350 100%)'
                }
            };
            
            const theme = themeColors[fukaboriTheme] || themeColors['blue'];
            
            // 動的スタイル適用（強化版）
            const dynamicStyle = document.createElement('style');
            dynamicStyle.id = 'fukabori-theme-style';
            dynamicStyle.innerHTML = \`
                /* 背景テーマ連動 */
                .advanced-infographic-body {
                    background: radial-gradient(ellipse at top, \${theme.primary} 0%, \${theme.secondary} 20%), 
                               \${theme.gradient} !important;
                }
                
                /* ヘッダーテーマエフェクト */
                .advanced-header::before {
                    background: \${theme.gradient};
                    opacity: 0.15;
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 20px;
                    pointer-events: none;
                    z-index: -1;
                }
                
                /* メインネットワークセクションテーマエフェクト */
                .network-main-section::before {
                    background: \${theme.gradient};
                    opacity: 0.08;
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 20px;
                    pointer-events: none;
                    z-index: -1;
                }
                
                /* ダッシュボードカードのアクセント */
                .dashboard-card:hover {
                    background: \${theme.primary.replace('0.8', '0.2')} !important;
                }
                
                /* セクションヘッダーのアクセント */
                .network-main-section h3, .executive-dashboard h3,
                .temporal-analysis-section h3, .concept-evolution-section h3,
                .cross-analysis-results-section h3, .relationship-matrix-section h3,
                .session-comparison-section h3 {
                    border-bottom-color: \${theme.primary.replace('0.8', '0.4')} !important;
                }
                
                /* タイムラインマーカーのテーマ色 */
                .timeline-marker {
                    background: \${theme.gradient} !important;
                }
            \`;
            
            // 既存のテーマスタイルがあれば削除
            const existingStyle = document.getElementById('fukabori-theme-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            document.head.appendChild(dynamicStyle);
            console.log('✅ 深堀くんテーマ連動完了:', fukaboriTheme);
            console.log('🎨 適用済みテーマ色:', theme);
        }
        
        // テーマ適用を複数タイミングで実行（確実な適用のため）
        applyFukaboriTheme();
        
        // DOM完全読み込み後にも再実行
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔄 DOM完全読み込み後のテーマ再適用');
            setTimeout(applyFukaboriTheme, 100);
        });
        
        // 初期化完了後にも再実行
        window.addEventListener('load', function() {
            console.log('🔄 ページ完全読み込み後のテーマ再適用');
            setTimeout(applyFukaboriTheme, 200);
        });

        ${this.getAdvancedAllKnowledgeJS(database, analysisData)}
    </script>
</body>
</html>
        `;
    }

    /**
     * 🔧 ヘルパー関数群
     */
    parseEnhancedContent(enhancedContent) {
        if (typeof enhancedContent === 'string' && enhancedContent.startsWith('{')) {
            try {
                const parsed = JSON.parse(enhancedContent);
                return parsed.enhanced || enhancedContent;
            } catch (e) {
                return enhancedContent;
            }
        }
        return enhancedContent;
    }

    getEnhancementTypeLabel(type) {
        const labels = {
            content: '内容強化',
            summary: '要約生成',
            keywords: 'キーワード抽出',
            concepts: '関連概念'
        };
        return labels[type] || type;
    }

    getSessionKeywords(session) {
        const keywords = {};
        session.insights.forEach(insight => {
            (insight.keywords || []).forEach(keyword => {
                keywords[keyword] = (keywords[keyword] || 0) + 1;
            });
        });
        return Object.entries(keywords).sort((a, b) => b[1] - a[1]);
    }

    showSuccessMessage(message) {
        if (window.showMessage) {
            window.showMessage('success', message);
        } else {
            console.log('✅ ' + message);
        }
    }

    /**
     * 🏗️ セッション知見HTML構築
     */
    buildSessionInfographicHTML(data) {
        const insights = data.insights;
        const meta = data.meta;
        const theme = meta.theme || 'セッション';
        
        // 統計計算
        const totalInsights = insights.length;
        const avgImportance = insights.length > 0 ? 
            Math.round(insights.reduce((sum, i) => sum + (i.quality_scores?.importance || 0.5), 0) / insights.length * 100) : 0;
        const aiEnhanced = insights.filter(i => i.dna_enhanced).length;
        
        // キーワード分析
        const keywords = insights.flatMap(i => i.keywords || []);
        const keywordFreq = this.calculateFrequency(keywords);
        const topKeywords = Object.entries(keywordFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 ${theme} - 知見インフォグラフィック</title>
    <style>
        ${this.getInfographicCSS()}
    </style>
</head>
<body class="infographic-body">
    <div class="infographic-container">
        <!-- ヘッダー -->
        <header class="infographic-header">
            <div class="header-content">
                <div class="logo-section">
                    <div class="fukabori-logo">🧬</div>
                    <div class="title-section">
                        <h1>深堀くん知見レポート</h1>
                        <h2>${theme}</h2>
                    </div>
                </div>
                <div class="date-section">
                    <div class="date">${new Date().toLocaleDateString('ja-JP')}</div>
                    <div class="time">${new Date().toLocaleTimeString('ja-JP')}</div>
                </div>
            </div>
        </header>

        <!-- 統計概要 -->
        <section class="stats-overview">
            <div class="stat-card primary">
                <div class="stat-icon">📘</div>
                <div class="stat-content">
                    <div class="stat-number">${totalInsights}</div>
                    <div class="stat-label">抽出された知見</div>
                </div>
            </div>
            <div class="stat-card secondary">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                    <div class="stat-number">${avgImportance}%</div>
                    <div class="stat-label">平均重要度</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">🤖</div>
                <div class="stat-content">
                    <div class="stat-number">${aiEnhanced}/${totalInsights}</div>
                    <div class="stat-label">AI整理完了</div>
                </div>
            </div>
        </section>

        <!-- チャートセクション -->
        <section class="charts-section">
            <div class="chart-container">
                <h3>📊 知見重要度分布</h3>
                <canvas id="importanceChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>🏷️ キーワード出現頻度</h3>
                <div class="keywords-cloud">
                    ${topKeywords.map(([keyword, freq]) => `
                        <span class="keyword-tag" style="font-size: ${12 + freq * 4}px">
                            ${keyword} <small>(${freq})</small>
                        </span>
                    `).join('')}
                </div>
            </div>
        </section>

        <!-- 知見詳細 -->
        <section class="insights-section">
            <h3>🧬 Knowledge DNA - 抽出された知見</h3>
            <div class="insights-grid">
                ${insights.map((insight, index) => `
                    <div class="insight-card ${insight.dna_enhanced ? 'enhanced' : 'basic'}" data-importance="${Math.round((insight.quality_scores?.importance || 0.5) * 100)}">
                        <div class="insight-header">
                            <span class="insight-number">#${index + 1}</span>
                            <div class="insight-meta">
                                <span class="importance-badge">${Math.round((insight.quality_scores?.importance || 0.5) * 100)}%</span>
                                ${insight.dna_enhanced ? '<span class="ai-badge">🤖 AI整理済み</span>' : ''}
                            </div>
                        </div>
                        <div class="insight-content">
                            ${insight.enhanced_content && insight.dna_enhanced ? `
                                <div class="enhanced-content">
                                    <strong>📝 AI整理版:</strong><br>
                                    ${this.truncateText(insight.enhanced_content, 200)}
                                </div>
                            ` : ''}
                            <div class="original-content">
                                ${insight.enhanced_content && insight.dna_enhanced ? '<strong>📋 原文:</strong><br>' : ''}
                                ${this.truncateText(insight.content, 150)}
                            </div>
                            ${insight.keywords && insight.keywords.length > 0 ? `
                                <div class="insight-keywords">
                                    ${insight.keywords.map(kw => `<span class="mini-keyword">${kw}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>

        <!-- フッター -->
        <footer class="infographic-footer">
            <div class="footer-content">
                <div class="generated-info">
                    <strong>🧬 深堀くん Knowledge DNA システム</strong><br>
                    生成日時: ${new Date().toLocaleString('ja-JP')} | バージョン: ${this.version}
                </div>
                <div class="footer-stats">
                    総処理時間: ${meta.sessionDuration || 0}分 | 
                    参加者: ${meta.participant || 'ユーザー'}
                </div>
            </div>
        </footer>
    </div>

    <script>
        ${this.getInfographicJS(insights, topKeywords)}
    </script>
</body>
</html>`;
    }

    /**
     * 🌐 全知見HTML構築（簡略版 - 長すぎるので基本機能のみ）
     */
    buildAllKnowledgeInfographicHTML(database) {
        const sessions = database.sessions;
        const totalInsights = database.totalInsights;
        const totalSessions = database.totalSessions;
        
        // 全体統計
        const allInsights = sessions.flatMap(s => s.insights);
        const avgImportance = allInsights.length > 0 ? 
            Math.round(allInsights.reduce((sum, i) => sum + (i.quality_scores?.importance || 0.5), 0) / allInsights.length * 100) : 0;
        const aiEnhanced = allInsights.filter(i => i.dna_enhanced).length;
        
        // テーマ分析
        const themeStats = {};
        sessions.forEach(session => {
            if (session.insights.length > 0) {
                themeStats[session.theme] = (themeStats[session.theme] || 0) + session.insights.length;
            }
        });
        const topThemes = Object.entries(themeStats).sort((a, b) => b[1] - a[1]).slice(0, 6);

        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 全知見アーカイブ - インフォグラフィック</title>
    <style>
        ${this.getInfographicCSS()}
    </style>
</head>
<body class="infographic-body">
    <div class="infographic-container">
        <header class="infographic-header">
            <div class="header-content">
                <div class="logo-section">
                    <div class="fukabori-logo">🌐</div>
                    <div class="title-section">
                        <h1>深堀くん全知見アーカイブ</h1>
                        <h2>Knowledge DNA 包括レポート</h2>
                    </div>
                </div>
                <div class="date-section">
                    <div class="date">${new Date().toLocaleDateString('ja-JP')}</div>
                </div>
            </div>
        </header>

        <section class="stats-overview">
            <div class="stat-card primary">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                    <div class="stat-number">${totalSessions}</div>
                    <div class="stat-label">総セッション数</div>
                </div>
            </div>
            <div class="stat-card secondary">
                <div class="stat-icon">📚</div>
                <div class="stat-content">
                    <div class="stat-number">${totalInsights}</div>
                    <div class="stat-label">累積知見数</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">⭐</div>
                <div class="stat-content">
                    <div class="stat-number">${avgImportance}%</div>
                    <div class="stat-label">平均重要度</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">🤖</div>
                <div class="stat-content">
                    <div class="stat-number">${aiEnhanced}/${totalInsights}</div>
                    <div class="stat-label">AI整理完了</div>
                </div>
            </div>
        </section>

        <section class="charts-section">
            <div class="chart-container">
                <h3>🎯 テーマ別知見分布</h3>
                <canvas id="themeChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>📋 セッション一覧</h3>
                <div class="sessions-summary">
                    ${sessions.slice(0, 8).map((session, index) => `
                        <div class="session-item">
                            <span class="session-number">#${index + 1}</span>
                            <span class="session-theme">${this.truncateText(session.theme, 30)}</span>
                            <span class="session-count">${session.insights.length}件</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <footer class="infographic-footer">
            <div class="footer-content">
                <div class="generated-info">
                    <strong>🧬 深堀くん Knowledge DNA アーカイブシステム</strong><br>
                    生成日時: ${new Date().toLocaleString('ja-JP')} | バージョン: ${this.version}
                </div>
            </div>
        </footer>
    </div>

    <script>
        ${this.getAllKnowledgeJS(topThemes)}
    </script>
</body>
</html>`;
    }

    /**
     * 🎨 インフォグラフィック用CSS
     */
    getInfographicCSS() {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .infographic-body {
            font-family: 'Segoe UI', 'メイリオ', Meiryo, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }
        
        .infographic-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            border-radius: 20px;
            overflow: hidden;
        }
        
        .infographic-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .fukabori-logo {
            font-size: 3rem;
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 50%;
        }
        
        .title-section h1 {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .title-section h2 {
            font-size: 1.2rem;
            font-weight: normal;
            opacity: 0.9;
        }
        
        .date-section {
            text-align: right;
            font-size: 1.1rem;
        }
        
        .stats-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px 30px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 20px;
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card.primary { border-left: 5px solid #667eea; }
        .stat-card.secondary { border-left: 5px solid #f093fb; }
        .stat-card.success { border-left: 5px solid #4facfe; }
        .stat-card.warning { border-left: 5px solid #43e97b; }
        
        .stat-icon {
            font-size: 2.5rem;
            opacity: 0.8;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .charts-section {
            padding: 40px 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        @media (max-width: 768px) {
            .charts-section {
                grid-template-columns: 1fr;
            }
        }
        
        .chart-container {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
        }
        
        .chart-container h3 {
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .keywords-cloud {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            justify-content: center;
            min-height: 200px;
        }
        
        .keyword-tag {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 8px 15px;
            border-radius: 25px;
            font-weight: bold;
            display: inline-block;
            transition: transform 0.3s ease;
        }
        
        .keyword-tag:hover {
            transform: scale(1.1);
        }
        
        .insights-section {
            padding: 40px 30px;
            background: #f8f9fa;
        }
        
        .insights-section h3 {
            margin-bottom: 30px;
            color: #333;
            text-align: center;
            font-size: 1.5rem;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .insight-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: transform 0.3s ease;
        }
        
        .insight-card:hover {
            transform: translateY(-3px);
        }
        
        .insight-card.enhanced {
            border-left: 5px solid #43e97b;
        }
        
        .insight-card.basic {
            border-left: 5px solid #f093fb;
        }
        
        .insight-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .insight-number {
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .insight-meta {
            display: flex;
            gap: 10px;
        }
        
        .importance-badge {
            background: #f093fb;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .ai-badge {
            background: #43e97b;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
        
        .enhanced-content {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            border-left: 3px solid #43e97b;
        }
        
        .original-content {
            color: #666;
            line-height: 1.5;
        }
        
        .insight-keywords {
            margin-top: 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .mini-keyword {
            background: #e9ecef;
            color: #495057;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8rem;
        }
        
        .sessions-summary {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .session-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .session-number {
            background: #764ba2;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
        
        .session-theme {
            flex: 1;
            margin: 0 10px;
            font-weight: 500;
        }
        
        .session-count {
            background: #f8f9fa;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            color: #666;
        }
        
        .infographic-footer {
            background: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .footer-content {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .generated-info {
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        `;
    }

    /**
     * 📊 JavaScript生成
     */
    getInfographicJS(insights, topKeywords) {
        return `
        document.addEventListener('DOMContentLoaded', function() {
            const importanceData = ${JSON.stringify(insights.map(i => Math.round((i.quality_scores?.importance || 0.5) * 100)))};
            const importanceLabels = ${JSON.stringify(insights.map((_, i) => `知見${i + 1}`))};
            
            if (window.Chart) {
                const ctx = document.getElementById('importanceChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: importanceLabels,
                        datasets: [{
                            label: '重要度 (%)',
                            data: importanceData,
                            backgroundColor: 'rgba(102, 126, 234, 0.8)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: { callback: function(value) { return value + '%'; } }
                            }
                        }
                    }
                });
            }
            console.log('🎨 セッションインフォグラフィック表示完了');
        });
        `;
    }

    getAllKnowledgeJS(topThemes) {
        return `
        document.addEventListener('DOMContentLoaded', function() {
            if (window.Chart) {
                const themeCtx = document.getElementById('themeChart').getContext('2d');
                new Chart(themeCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ${JSON.stringify(topThemes.map(([theme]) => theme))},
                        datasets: [{
                            data: ${JSON.stringify(topThemes.map(([, count]) => count))},
                            backgroundColor: [
                                'rgba(102, 126, 234, 0.8)',
                                'rgba(240, 147, 251, 0.8)',  
                                'rgba(79, 172, 254, 0.8)',
                                'rgba(67, 233, 123, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(255, 99, 132, 0.8)'
                            ]
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
                });
            }
            console.log('🌐 全知見インフォグラフィック表示完了');
        });
        `;
    }

    /**
     * 🖥️ インフォグラフィック表示
     */
    displayInfographic(html, title) {
        try {
            // 別タブ表示に変更（ウィンドウサイズ指定なし）
            const newTab = window.open('', '_blank');
            if (newTab) {
                // document.writeの代わりに安全な方法を使用
                newTab.document.open();
                newTab.document.write(html);
                newTab.document.close();
                newTab.document.title = title;
                
                console.log('🎨 インフォグラフィック表示完了:', title);
                
                // 成功メッセージ表示
                if (typeof showMessage === 'function') {
                    showMessage('success', `🎨 ${title}を生成しました！`);
                }
            } else {
                this.showErrorMessage('ポップアップがブロックされました。ブラウザ設定を確認してください。');
            }
        } catch (error) {
            console.error('⚠️ インフォグラフィック表示エラー:', error);
            this.showErrorMessage('インフォグラフィック表示でエラーが発生しました');
        }
    }

    /**
     * 🔧 ユーティリティ関数群
     */
    calculateFrequency(array) {
        const freq = {};
        array.forEach(item => {
            freq[item] = (freq[item] || 0) + 1;
        });
        return freq;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    showNoDataMessage(message) {
        alert(`📊 ${message}\n\n以下をお試しください：\n• 深堀セッションを実行して知見を蓄積\n• セッション終了直後の場合は、数秒待ってから再試行\n• 「🧬 全知見DL」で知見の保存状況を確認`);
    }

    showErrorMessage(message) {
        alert(`⚠️ ${message}\n\n技術的な問題が発生しました。再試行してください。`);
    }

    showLoadingMessage(message) {
        // 既存のshowMessage関数が利用可能な場合はそれを使用
        if (typeof showMessage === 'function') {
            showMessage('info', message);
        } else {
            console.log(`📢 ${message}`);
        }
    }

    /**
     * 🎨 高度インフォグラフィック用CSS（Phase 1）
     */
    getAdvancedInfographicCSS() {
        return `
        /* 深堀くんテーマ: ガラス風Knowledge DNA分析レポート */
        .advanced-infographic-body {
            font-family: 'Segoe UI', 'Yu Gothic UI', sans-serif;
            margin: 0;
            padding: 0;
            background: radial-gradient(ellipse at top, rgba(0,150,255,0.8) 0%, rgba(0,100,200,0.6) 20%), 
                       linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #667eea 50%, #764ba2 75%, #8e44ad 100%);
            min-height: 100vh;
            color: #333;
            position: relative;
            overflow-x: hidden;
        }

        .advanced-infographic-body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="30" cy="30" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
            pointer-events: none;
            z-index: 1;
        }

        .advanced-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.1);
            border-radius: 20px;
            margin-top: 20px;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }

        /* ヘッダー */
        .advanced-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(30, 60, 114, 0.15);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }

        .header-logo-section {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .fukabori-logo {
            height: 60px;
            width: auto;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
        }

        .dna-logo {
            font-size: 64px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
        }

        .header-avatars {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .avatar-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
            background: rgba(255, 255, 255, 0.1);
            padding: 4px;
        }

        .header-text {
            flex: 1;
            text-align: center;
        }

        /* メインネットワークセクション - 1カラム大画面表示 */
        .network-main-section {
            margin: 30px 0;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }

        .main-network-container {
            margin-top: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .main-network-canvas {
            width: 100%;
            height: 600px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .header-text h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header-text h2 {
            margin: 5px 0;
            font-size: 1.5em;
            opacity: 0.9;
            font-weight: 400;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }

        .analysis-meta {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 10px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }

        /* 2カラム分析レイアウト */
        .two-column-analysis-layout {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 30px 0;
        }

        .analysis-left-column, .analysis-right-column {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }

        /* セッション時系列セクション */
        .temporal-analysis-section, .concept-evolution-section, .cross-analysis-results-section, .relationship-matrix-section {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .temporal-content, .matrix-container {
            margin-top: 15px;
        }

        .temporal-chart {
            height: 200px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        /* 横断分析結果 */
        .cross-analysis-summary {
            margin-top: 15px;
        }

        .analysis-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .metric-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 15px;
            border-radius: 15px;
            text-align: center;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .metric-label {
            display: block;
            font-size: 0.9em;
            opacity: 0.8;
            margin-bottom: 5px;
        }

        .metric-value {
            display: block;
            font-size: 1.5em;
            font-weight: 700;
            color: white;
        }

        /* エグゼクティブサマリー */
        .executive-summary, .executive-dashboard {
            margin: 30px 0;
        }

        .summary-grid, .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .summary-card, .dashboard-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            color: white;
        }

        .summary-card:hover, .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            background: rgba(255, 255, 255, 0.15);
        }

        .dashboard-card.large {
            grid-column: span 2;
            min-height: 400px;
        }

        .card-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
        }

        .card-number {
            font-size: 2.8em;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .card-label {
            font-size: 1.1em;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 8px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }

        .card-detail {
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.8);
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }

        /* 概念進化タイムライン */
        .concept-evolution {
            margin-top: 15px;
        }

        .evolution-category h5 {
            color: white;
            margin-bottom: 15px;
            font-size: 1.1em;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .theme-timeline {
            margin-bottom: 20px;
        }

        .timeline-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .timeline-marker {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff6b6b, #feca57);
            margin-right: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .timeline-content {
            flex: 1;
        }

        .theme-title {
            color: white;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .theme-date, .theme-insights {
            font-size: 0.85em;
            color: rgba(255, 255, 255, 0.8);
        }

        .theme-insights {
            margin-left: 10px;
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 8px;
            border-radius: 10px;
            display: inline-block;
        }

        /* セッション詳細比較 */
        .session-comparison-section {
            margin: 30px 0;
        }

        .session-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .session-comparison-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 25px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
            color: white;
        }

        .session-comparison-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.15);
        }

        .session-header h4 {
            margin: 0 0 8px 0;
            color: white;
            font-size: 1.3em;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .session-theme {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 12px;
            border-radius: 12px;
            font-size: 0.9em;
            margin-bottom: 8px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .session-date {
            font-size: 0.85em;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 15px;
        }

        .session-stats {
            margin: 15px 0;
        }

        .stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .session-keywords h5 {
            color: white;
            margin: 15px 0 10px 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .session-keyword-cloud {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .session-keyword {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 10px;
            font-size: 0.8em;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }

        /* ネットワーク可視化 */
        .network-section {
            margin: 40px 0;
            background: rgba(248, 249, 250, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .network-container {
            display: flex;
            gap: 30px;
        }

        .network-canvas, .large-network-canvas {
            flex: 1;
            height: 500px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .large-network-canvas {
            height: 400px;
        }

        .network-legend {
            width: 200px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 15px;
            color: white;
        }

        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .session-color { background: linear-gradient(135deg, #FF6B6B, #FF8E8E); }
        .insight-ai-color { background: linear-gradient(135deg, #2ECC71, #58D68D); }
        .insight-raw-color { background: linear-gradient(135deg, #BDC3C7, #D5DBDB); }

        .legend-edge {
            width: 20px;
            height: 3px;
            background: linear-gradient(90deg, #666, #999);
            margin-right: 10px;
            border-radius: 2px;
        }

        /* 知見詳細カード */
        .insights-detail-section {
            margin: 40px 0;
        }

        .insights-container {
            display: grid;
            gap: 25px;
            margin-top: 20px;
        }

        .insight-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-left: 5px solid #ddd;
        }

        .insight-card.ai-enhanced {
            border-left-color: #2ECC71;
            background: linear-gradient(135deg, #ffffff 0%, #f8fff9 100%);
        }

        .insight-card.raw {
            border-left-color: #95a5a6;
        }

        .insight-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .insight-id {
            font-size: 1.2em;
            font-weight: 700;
            color: #2a5298;
        }

        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }

        .status-badge.ai {
            background: #d4edda;
            color: #155724;
        }

        .status-badge.raw {
            background: #f8d7da;
            color: #721c24;
        }

        .content-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .content-section h5 {
            margin: 0 0 10px 0;
            color: #2a5298;
        }

        .enhanced-content {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2ECC71;
        }

        .original-content, .raw-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #6c757d;
        }

        /* 品質スコア */
        .quality-scores {
            margin: 20px 0;
        }

        .score-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .score-label {
            width: 80px;
            font-weight: 600;
            font-size: 0.9em;
        }

        .score-bar {
            flex: 1;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 0 15px;
        }

        .score-fill.importance {
            background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
        }

        .score-fill.confidence {
            background: linear-gradient(90deg, #4ecdc4, #45b7d1);
        }

        .score-value {
            width: 50px;
            text-align: right;
            font-weight: 700;
        }

        /* キーワード・概念タグ */
        .insight-keywords, .insight-concepts {
            margin-top: 15px;
        }

        .keywords-label, .concepts-label {
            font-weight: 600;
            margin-right: 10px;
        }

        .keyword-tag, .concept-tag {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.85em;
            margin: 2px 4px;
        }

        .concept-tag {
            background: #fff3e0;
            color: #f57c00;
        }

        /* セクションヘッダー統一スタイル */
        .executive-dashboard h3, .temporal-analysis-section h3, .concept-evolution-section h3, 
        .cross-analysis-results-section h3, .relationship-matrix-section h3, .session-comparison-section h3 {
            color: white;
            font-size: 1.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 10px;
        }

        /* フッター */
        .advanced-footer {
            margin-top: 50px;
            padding: 30px;
            background: rgba(248, 249, 250, 0.1);
            backdrop-filter: blur(15px) saturate(180%);
            -webkit-backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .generation-info {
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.6;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }

        /* レスポンシブ対応 */
        @media (max-width: 768px) {
            .advanced-container {
                margin: 10px;
                padding: 15px;
            }

            .summary-grid, .dashboard-grid {
                grid-template-columns: 1fr;
            }

            .dashboard-card.large {
                grid-column: span 1;
            }

            .content-comparison {
                grid-template-columns: 1fr;
            }

            .network-container {
                flex-direction: column;
            }

            .network-legend {
                width: 100%;
            }

            .two-column-analysis-layout {
                grid-template-columns: 1fr;
                gap: 20px;
            }

            .advanced-header {
                flex-direction: column;
                text-align: center;
                gap: 20px;
            }

            .header-avatars {
                order: -1;
            }

            .analysis-metrics {
                grid-template-columns: 1fr;
            }

            .main-network-canvas {
                height: 400px;
            }

            .session-grid {
                grid-template-columns: 1fr;
            }

            .network-main-section h3, .executive-dashboard h3 {
                font-size: 1.3em;
            }
        }
        `;
    }

    /**
     * 🔧 高度インフォグラフィック用JavaScript（Phase 1）
     */
    getAdvancedInfographicJS(data, analysisData) {
        return `
        // Phase 1: セッション専用Knowledge DNA可視化システム
        function initializeSessionVisualization() {
            console.log('🧬 セッション版Knowledge DNA可視化システム初期化開始');
            console.log('📊 セッションデータ確認:', '${data?.meta?.theme || 'データなし'}');
            console.log('🔬 分析データ確認:', {
                networkNodes: ${analysisData?.knowledgeNetwork?.nodes?.length || 0},
                networkEdges: ${analysisData?.knowledgeNetwork?.edges?.length || 0},
                aiStats: ${JSON.stringify(analysisData?.aiEnhancementStats || 'なし')}
            });
            
            // ライブラリ確認と待機
            console.log('📚 ライブラリ状況:');
            console.log('  Chart.js:', typeof window.Chart);
            console.log('  Vis.js:', typeof window.vis);
            
            // セッション専用ライブラリ読み込み完了待機
            function waitForSessionLibraries(maxAttempts = 40) {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    console.log(\`🔄 セッション版ライブラリ確認試行 \${attempts}/\${maxAttempts}\`);
                    
                    if (typeof window.Chart !== 'undefined' && typeof window.vis !== 'undefined') {
                        clearInterval(checkInterval);
                        console.log('✅ セッション版全ライブラリ読み込み確認完了');
                        
                        // 初期化（500ms待機でDOM構築確実化）
                        setTimeout(() => {
                            try {
                                initializeSessionKnowledgeNetwork();
                            } catch (error) {
                                console.error('❌ セッションネットワーク初期化エラー:', error);
                                showSessionFallbackNetwork();
                            }
                            
                            try {
                                initializeSessionCharts();
                            } catch (error) {
                                console.error('❌ セッションチャート初期化エラー:', error);
                                showSessionFallbackCharts();
                            }
                            
                            try {
                                initializeSessionMatrix();
                            } catch (error) {
                                console.error('❌ セッション関係性マトリクス初期化エラー:', error);
                                showSessionFallbackMatrix();
                            }
                        }, 500);
                        
                        console.log('✅ セッション版Knowledge DNA可視化システム初期化完了');
                        
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        console.warn('⚠️ セッション版ライブラリ読み込みタイムアウト - 代替表示');
                        showSessionFallbackNetwork();
                        showSessionFallbackCharts();
                        showSessionFallbackMatrix();
                    }
                }, 200);
            }
            
            waitForSessionLibraries();
        }

        // DOM読み込み完了または即座に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeSessionVisualization);
        } else {
            initializeSessionVisualization();
        }

        // 🕸️ セッション内知見関係性ネットワーク
        function initializeSessionKnowledgeNetwork() {
            console.log('🕸️ セッションネットワーク初期化開始');
            const networkData = ${JSON.stringify(analysisData.knowledgeNetwork)};
            console.log('🔍 セッションネットワークデータ:', networkData);
            
            const container = document.getElementById('sessionKnowledgeNetwork');
            console.log('📍 セッションネットワークコンテナ確認:', !!container);
            
            if (!window.vis || !container) {
                console.warn('⚠️ Vis.jsまたはコンテナが利用できません');
                showSessionFallbackNetwork();
                return;
            }
            
            try {
                const options = {
                    nodes: {
                        shape: 'circle',
                        scaling: { min: 15, max: 40 },
                        font: { 
                            size: 14, 
                            face: 'Yu Gothic UI',
                            color: '#2c3e50'
                        },
                        shadow: {
                            enabled: true,
                            color: 'rgba(0,0,0,0.2)',
                            size: 10
                        }
                    },
                    edges: {
                        width: 2,
                        color: { 
                            color: '#3498db',
                            highlight: '#e74c3c',
                            hover: '#f39c12'
                        },
                        smooth: { 
                            type: 'continuous',
                            forceDirection: 'none',
                            roundness: 0.5
                        }
                    },
                    physics: {
                        enabled: true,
                        stabilization: { iterations: 150 },
                        barnesHut: {
                            gravitationalConstant: -15000,
                            springConstant: 0.04,
                            springLength: 250,
                            damping: 0.09
                        }
                    },
                    interaction: { 
                        hover: true, 
                        tooltipDelay: 300,
                        selectConnectedEdges: false
                    },
                    layout: {
                        improvedLayout: true
                    }
                };

                console.log('🔧 セッション版Vis.jsネットワーク作成中...');
                const network = new vis.Network(container, networkData, options);
                console.log('✅ セッションネットワーク作成完了');
                
                // セッション専用ノードクリックイベント
                network.on('click', function(params) {
                    if (params.nodes.length > 0) {
                        const nodeId = params.nodes[0];
                        const node = networkData.nodes.find(n => n.id === nodeId);
                        if (node && node.metadata) {
                            showSessionNodeDetails(node);
                        }
                    }
                });
                
                // ネットワーク安定化完了イベント
                network.on('stabilizationIterationsDone', function() {
                    console.log('🎯 セッションネットワーク安定化完了');
                    network.fit();
                });
                
            } catch (error) {
                console.error('❌ セッション版Vis.jsネットワーク作成エラー:', error);
                showSessionFallbackNetwork();
            }
        }

        // 📊 セッション専用チャート初期化
        function initializeSessionCharts() {
            console.log('📊 セッションチャート初期化開始');
            
            if (!window.Chart) {
                console.warn('⚠️ Chart.jsライブラリが利用できません');
                showSessionFallbackCharts();
                return;
            }
            
            // 品質トレンドチャート
            const trendContainer = document.getElementById('sessionQualityTrendChart');
            if (trendContainer) {
                console.log('📈 品質トレンドチャート作成中...');
                const trendCtx = trendContainer.getContext('2d');
                
                const insights = ${JSON.stringify(data.insights)};
                const qualityData = insights.map((insight, index) => ({
                    x: index + 1,
                    y: (insight.quality_scores?.importance || 0.5) * 100
                }));
                
                new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: '品質スコア',
                            data: qualityData,
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: {
                                title: { display: true, text: '知見番号' }
                            },
                            y: {
                                title: { display: true, text: '品質スコア(%)' },
                                min: 0,
                                max: 100
                            }
                        }
                    }
                });
                console.log('✅ 品質トレンドチャート作成完了');
            }
            
            // AI強化進捗チャート
            const progressContainer = document.getElementById('sessionAiProgressChart');
            if (progressContainer) {
                console.log('🤖 AI強化進捗チャート作成中...');
                const progressCtx = progressContainer.getContext('2d');
                
                const aiStats = ${JSON.stringify(analysisData.aiEnhancementStats)};
                const enhancedCount = aiStats.aiEnhanced || 0;
                const totalCount = aiStats.totalInsights || 1;
                const unenhancedCount = totalCount - enhancedCount;
                
                new Chart(progressCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['AI強化済み', '未処理'],
                        datasets: [{
                            data: [enhancedCount, unenhancedCount],
                            backgroundColor: ['#27ae60', '#95a5a6'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
                console.log('✅ AI強化進捗チャート作成完了');
            }
        }

        // 📊 セッション関係性マトリクス
        function initializeSessionMatrix() {
            console.log('📊 セッション関係性マトリクス初期化開始');
            const matrixContainer = document.getElementById('sessionRelationshipMatrix');
            
            if (!matrixContainer) {
                console.warn('⚠️ マトリクスコンテナが見つかりません');
                return;
            }
            
            const insights = ${JSON.stringify(data.insights)};
            const matrixHTML = buildSessionMatrixHTML(insights);
            matrixContainer.innerHTML = matrixHTML;
            console.log('✅ セッション関係性マトリクス作成完了');
        }

        function buildSessionMatrixHTML(insights) {
            if (!insights || insights.length === 0) {
                return '<p class="no-data">関係性データがありません</p>';
            }
            
            let html = '<div class="matrix-grid">';
            
            insights.forEach((insight, i) => {
                html += \`
                    <div class="matrix-item">
                        <div class="matrix-label">知見#\${i + 1}</div>
                        <div class="matrix-content">
                            <div class="matrix-text">\${insight.content.substring(0, 60)}...</div>
                            <div class="matrix-score">
                                重要度: \${Math.round((insight.quality_scores?.importance || 0.5) * 100)}%
                            </div>
                        </div>
                    </div>
                \`;
            });
            
            html += '</div>';
            return html;
        }

        // 代替表示関数群
        function showSessionFallbackNetwork() {
            const container = document.getElementById('sessionKnowledgeNetwork');
            if (container) {
                container.innerHTML = \`
                    <div style="padding: 40px; text-align: center; background: rgba(255,255,255,0.1); border-radius: 15px; color: white;">
                        <h3>🔧 セッションネットワーク図代替表示</h3>
                        <p>ライブラリ読み込み中またはエラーのため、簡易表示します。</p>
                        <div style="margin: 20px 0;">
                            <strong>📊 セッション内関係性統計:</strong><br>
                            知見ノード数: ${analysisData?.knowledgeNetwork?.nodes?.length || 0}<br>
                            関係性エッジ数: ${analysisData?.knowledgeNetwork?.edges?.length || 0}
                        </div>
                    </div>
                \`;
            }
        }

        function showSessionFallbackCharts() {
            const trendContainer = document.getElementById('sessionQualityTrendChart');
            if (trendContainer) {
                const parent = trendContainer.parentElement;
                parent.innerHTML = \`
                    <h4>📈 品質トレンド</h4>
                    <div style="padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; color: white;">
                        <p>チャートライブラリ読み込み中...</p>
                        <p>平均品質スコア: ${Math.round((analysisData?.aiEnhancementStats?.avgImportance || 0.5) * 100)}%</p>
                    </div>
                \`;
            }
            
            const progressContainer = document.getElementById('sessionAiProgressChart');
            if (progressContainer) {
                const parent = progressContainer.parentElement;
                parent.innerHTML = \`
                    <h4>🤖 AI強化進捗</h4>
                    <div style="padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; color: white;">
                        <p>チャートライブラリ読み込み中...</p>
                        <p>強化済み: ${analysisData?.aiEnhancementStats?.aiEnhanced || 0}件</p>
                        <p>未処理: ${(analysisData?.aiEnhancementStats?.totalInsights || 0) - (analysisData?.aiEnhancementStats?.aiEnhanced || 0)}件</p>
                    </div>
                \`;
            }
        }

        function showSessionFallbackMatrix() {
            const container = document.getElementById('sessionRelationshipMatrix');
            if (container) {
                container.innerHTML = \`
                    <div style="padding: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; color: white;">
                        <p>関係性マトリクス準備中...</p>
                        <p>セッション内知見数: ${data?.insights?.length || 0}件</p>
                    </div>
                \`;
            }
        }

        function showSessionNodeDetails(node) {
            const details = node.metadata;
            let content = '';
            
            if (details.type === 'insight') {
                content = \`
                    💡 知見詳細
                    内容: \${details.content.substring(0, 100)}...
                    重要度: \${Math.round(details.importance * 100)}%
                    信頼度: \${Math.round(details.confidence * 100)}%
                    AI強化: \${details.aiEnhanced ? '✅ 完了' : '❌ 未実行'}
                \`;
            }
            
            // モーダル表示（セッション専用）
            alert(content);
        }
                return;
            }
            
            if (!chartContainer) {
                console.warn('⚠️ チャートコンテナが見つかりません');
                return;
            }
            
            try {
                const ctx = chartContainer.getContext('2d');
                const qualityData = ${JSON.stringify(analysisData.aiEnhancementStats.qualityDistribution)};
                console.log('📊 品質データ:', qualityData);
                
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
                        datasets: [{
                            label: '重要度分布',
                            data: qualityData.importanceBins,
                            backgroundColor: 'rgba(102, 126, 234, 0.8)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 1
                        }, {
                            label: '信頼度分布',
                            data: qualityData.confidenceBins,
                            backgroundColor: 'rgba(118, 75, 162, 0.8)',
                            borderColor: 'rgba(118, 75, 162, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: '知見品質スコア分布'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
                console.log('✅ 品質分布チャート作成完了');
                
            } catch (error) {
                console.error('❌ チャート作成エラー:', error);
                showFallbackCharts();
            }
        }

        function showFallbackCharts() {
            console.log('🔧 代替チャート表示開始');
            const container = document.getElementById('qualityDistributionChart');
            if (container) {
                const parent = container.parentElement;
                if (parent) {
                    parent.innerHTML = \`
                        <div style="padding: 30px; text-align: center; background: #f8f9fa; border-radius: 10px;">
                            <h4>📊 品質分布（代替表示）</h4>
                            <p>Chart.jsライブラリ読み込み中またはエラーのため、テキスト表示します。</p>
                            <div style="margin: 15px 0; text-align: left; max-width: 300px; margin: 15px auto;">
                                <strong>重要度分布:</strong><br>
                                ${analysisData?.aiEnhancementStats?.qualityDistribution?.importanceBins?.map((count, i) => 
                                    (i*20) + '-' + ((i+1)*20) + '%: ' + count + '件').join('<br>') || 'データなし'}<br><br>
                                <strong>信頼度分布:</strong><br>
                                ${analysisData?.aiEnhancementStats?.qualityDistribution?.confidenceBins?.map((count, i) => 
                                    (i*20) + '-' + ((i+1)*20) + '%: ' + count + '件').join('<br>') || 'データなし'}
                            </div>
                        </div>
                    \`;
                }
            }
        }
        `;
    }

    /**
     * 🌐 高度全知見インフォグラフィック用JavaScript（Phase 1）
     */
    getAdvancedAllKnowledgeJS(database, analysisData) {
        return `
        // Phase 1: 全知見横断分析可視化システム（デバッグ強化版）
        function initializeVisualization() {
            console.log('🌐 全知見横断分析可視化システム初期化開始');
            console.log('🗃️ データベース確認:', {
                totalSessions: ${database?.totalSessions || 0},
                totalInsights: ${database?.totalInsights || 0},
                sessionsLength: ${database?.sessions?.length || 0}
            });
            console.log('🔬 分析データ確認:', {
                networkNodes: ${analysisData?.knowledgeNetwork?.nodes?.length || 0},
                networkEdges: ${analysisData?.knowledgeNetwork?.edges?.length || 0},
                temporalDataLength: ${analysisData?.temporalPatterns?.qualityTrends?.length || 0}
            });
            
            // ライブラリ確認と待機
            console.log('📚 ライブラリ状況:');
            console.log('  Chart.js:', typeof window.Chart);
            console.log('  Vis.js:', typeof window.vis);
            
            // ライブラリ読み込み完了を確実に待機
            function waitForLibraries(maxAttempts = 40) {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    console.log(\`🔄 ライブラリ確認試行 \${attempts}/\${maxAttempts} (非同期読み込み対応)\`);
                    console.log('  Chart.js:', typeof window.Chart);
                    console.log('  Vis.js:', typeof window.vis);
                    
                    if (typeof window.Chart !== 'undefined' && typeof window.vis !== 'undefined') {
                        clearInterval(checkInterval);
                        console.log('✅ 全ライブラリ非同期読み込み確認完了');
                        
                        // グローバルネットワーク可視化
                        try {
                            initializeGlobalKnowledgeNetwork();
                        } catch (error) {
                            console.error('❌ グローバルネットワーク初期化エラー:', error);
                            showFallbackGlobalNetwork();
                        }
                        
                        // 横断分析チャート
                        try {
                            initializeCrossAnalysisCharts();
                        } catch (error) {
                            console.error('❌ 横断分析チャート初期化エラー:', error);
                            showFallbackCrossAnalysisCharts();
                        }
                        
                        console.log('✅ 全知見横断分析可視化システム初期化完了');
                        
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        console.warn('⚠️ 非同期ライブラリ読み込みタイムアウト - 代替表示に切り替え');
                        showFallbackGlobalNetwork();
                        showFallbackCrossAnalysisCharts();
                    }
                }, 200); // 200ms間隔で確認、最大8秒待機
            }
            
            waitForLibraries();
        }

        // DOM読み込み完了または即座に実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeVisualization);
        } else {
            initializeVisualization();
        }

        function initializeGlobalKnowledgeNetwork() {
            console.log('🌐 グローバルネットワーク初期化開始');
            const networkData = ${JSON.stringify(analysisData.knowledgeNetwork)};
            console.log('🔍 グローバルネットワークデータ:', networkData);
            
            const container = document.getElementById('globalKnowledgeNetwork');
            console.log('📍 グローバルコンテナ確認:', !!container);
            
            if (!window.vis) {
                console.warn('⚠️ Vis.jsライブラリが利用できません（グローバル）');
                showFallbackGlobalNetwork();
                return;
            }
            
            if (!container) {
                console.warn('⚠️ グローバルネットワークコンテナが見つかりません');
                return;
            }
            
            try {
                const options = {
                    nodes: {
                        shape: 'dot',
                        scaling: { min: 15, max: 50 },
                        font: { size: 14, face: 'Yu Gothic UI' }
                    },
                    edges: {
                        width: 0.2,
                        color: {inherit: 'from'},
                        smooth: { type: 'continuous' }
                    },
                    physics: {
                        stabilization: {iterations: 150},
                        barnesHut: {
                            gravitationalConstant: -12000,
                            springConstant: 0.001,
                            springLength: 250
                        }
                    },
                    interaction: { hover: true, tooltipDelay: 200 }
                };

                console.log('🔧 グローバルVis.jsネットワーク作成中...');
                console.log('🔧 ネットワークデータ詳細:', {
                    nodesCount: networkData.nodes.length,
                    edgesCount: networkData.edges.length,
                    sampleNode: networkData.nodes[0],
                    sampleEdge: networkData.edges[0]
                });
                console.log('🔧 Vis.jsバージョン:', window.vis.version || 'バージョン不明');
                
                const network = new vis.Network(container, networkData, options);
                console.log('✅ グローバルネットワーク作成完了 - ネットワークID:', network.body?.data?.nodes?.length || 'ID不明');
                
            } catch (error) {
                console.error('❌ グローバルVis.jsネットワーク作成エラー:', error);
                showFallbackGlobalNetwork();
            }
        }

        function showFallbackGlobalNetwork() {
            const container = document.getElementById('globalKnowledgeNetwork');
            if (container) {
                container.innerHTML = \`
                    <div style="padding: 50px; text-align: center; background: #f8f9fa; border-radius: 10px;">
                        <h3>🌐 全知見ネットワーク（代替表示）</h3>
                        <p>ライブラリ読み込み中またはエラーのため、統計表示します。</p>
                        <div style="margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 400px; margin: 30px auto;">
                            <div style="background: white; padding: 20px; border-radius: 8px;">
                                <strong>📊 ノード数</strong><br>
                                <span style="font-size: 2em; color: #667eea;">${analysisData?.knowledgeNetwork?.nodes?.length || 0}</span>
                            </div>
                            <div style="background: white; padding: 20px; border-radius: 8px;">
                                <strong>🔗 関係性</strong><br>
                                <span style="font-size: 2em; color: #764ba2;">${analysisData?.knowledgeNetwork?.edges?.length || 0}</span>
                            </div>
                        </div>
                        <div style="font-size: 0.9em; color: #666;">
                            セッション間の知見関係性をネットワーク図で表示予定
                        </div>
                    </div>
                \`;
            }
        }

        function initializeCrossAnalysisCharts() {
            console.log('📊 横断分析チャート初期化開始');
            const temporalData = ${JSON.stringify(analysisData.temporalPatterns.qualityTrends)};
            console.log('📊 時系列データ:', temporalData);
            
            if (!window.Chart) {
                console.warn('⚠️ Chart.jsライブラリが利用できません（横断分析）');
                showFallbackCrossAnalysisCharts();
                return;
            }
            
            // 品質トレンドチャート
            const trendContainer = document.getElementById('qualityTrendChart');
            if (trendContainer) {
                try {
                    console.log('📈 品質トレンドチャート作成中...');
                    const ctx = trendContainer.getContext('2d');
                    
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: temporalData.map(d => 'セッション' + d.session),
                            datasets: [{
                                label: '重要度(%)',
                                data: temporalData.map(d => d.importance),
                                borderColor: 'rgb(255, 107, 107)',
                                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                                tension: 0.4
                            }, {
                                label: '信頼度(%)',
                                data: temporalData.map(d => d.confidence),
                                borderColor: 'rgb(78, 205, 196)',
                                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'セッション別品質トレンド'
                                }
                            }
                        }
                    });
                    console.log('✅ 品質トレンドチャート作成完了');
                } catch (error) {
                    console.error('❌ 品質トレンドチャートエラー:', error);
                }
            } else {
                console.warn('⚠️ 品質トレンドチャートコンテナが見つかりません');
            }

            // AI進捗チャート
            const progressContainer = document.getElementById('aiProgressChart');
            if (progressContainer) {
                try {
                    console.log('🤖 AI進捗チャート作成中...');
                    const ctx = progressContainer.getContext('2d');
                    
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['AI強化済み', '未処理'],
                            datasets: [{
                                data: [
                                    ${analysisData.aiEnhancementStats.aiEnhanced},
                                    ${analysisData.aiEnhancementStats.totalInsights - analysisData.aiEnhancementStats.aiEnhanced}
                                ],
                                backgroundColor: [
                                    'rgba(46, 204, 113, 0.8)',
                                    'rgba(189, 195, 199, 0.8)'
                                ]
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'AI強化進捗'
                                }
                            }
                        }
                    });
                    console.log('✅ AI進捗チャート作成完了');
                } catch (error) {
                    console.error('❌ AI進捗チャートエラー:', error);
                }
            } else {
                console.warn('⚠️ AI進捗チャートコンテナが見つかりません');
            }
        }

        function showFallbackCrossAnalysisCharts() {
            console.log('🔧 横断分析代替表示開始');
            
            // 品質トレンド代替表示
            const trendContainer = document.getElementById('qualityTrendChart');
            if (trendContainer) {
                const parent = trendContainer.parentElement;
                if (parent) {
                    parent.innerHTML = \`
                        <div style="padding: 30px; text-align: center; background: #f8f9fa; border-radius: 10px;">
                            <h4>📈 品質トレンド（代替表示）</h4>
                            <div style="margin: 15px 0; text-align: left;">
                                ${analysisData?.temporalPatterns?.qualityTrends?.map(d => 
                                    'セッション' + d.session + ': 重要度' + d.importance + '% / 信頼度' + d.confidence + '%').join('<br>') || 'データなし'}
                            </div>
                        </div>
                    \`;
                }
            }
            
            // AI進捗代替表示
            const progressContainer = document.getElementById('aiProgressChart');
            if (progressContainer) {
                const parent = progressContainer.parentElement;
                if (parent) {
                    parent.innerHTML = \`
                        <div style="padding: 30px; text-align: center; background: #f8f9fa; border-radius: 10px;">
                            <h4>🤖 AI強化進捗（代替表示）</h4>
                            <div style="margin: 20px 0;">
                                <div style="font-size: 1.5em; color: #2ECC71;">✅ AI強化済み: ${analysisData?.aiEnhancementStats?.aiEnhanced || 0}件</div>
                                <div style="font-size: 1.2em; color: #BDC3C7;">⏳ 未処理: ${(analysisData?.aiEnhancementStats?.totalInsights || 0) - (analysisData?.aiEnhancementStats?.aiEnhanced || 0)}件</div>
                                <div style="margin-top: 15px; font-weight: bold;">
                                    進捗率: ${Math.round((analysisData?.aiEnhancementStats?.enhancementRate || 0) * 100)}%
                                </div>
                            </div>
                        </div>
                    \`;
                }
            }
        }
        `;
    }
}

// 🎨 グローバルインスタンス作成（会話システムから完全独立）
console.log('🎨 インフォグラフィックシステム初期化開始...');

try {
    const FukaboriInfographic = new InfographicSystem();
    console.log('🎨 InfographicSystemインスタンス作成完了');

    // 🎯 グローバル関数公開（安全な呼び出し専用）
    window.generateSessionInfographic = function() {
        console.log('📊 セッションインフォグラフィック呼び出し開始');
        try {
            FukaboriInfographic.generateSessionInfographic();
        } catch (error) {
            console.error('⚠️ セッションインフォグラフィック呼び出しエラー:', error);
        }
    };

    window.generateAllKnowledgeInfographic = function() {
        console.log('🌐 全知見インフォグラフィック呼び出し開始');
        try {
            FukaboriInfographic.generateAllKnowledgeInfographic();
        } catch (error) {
            console.error('⚠️ 全知見インフォグラフィック呼び出しエラー:', error);
        }
    };

    // 関数が正しく公開されたか確認
    console.log('🔍 グローバル関数確認:');
    console.log('  generateSessionInfographic:', typeof window.generateSessionInfographic);
    console.log('  generateAllKnowledgeInfographic:', typeof window.generateAllKnowledgeInfographic);

    console.log('🎨 深堀くんインフォグラフィックシステム初期化完了（独立モード）');
    
} catch (error) {
    console.error('❌ インフォグラフィックシステム初期化エラー:', error);
    console.error('❌ エラー詳細:', error.message);
    console.error('❌ エラースタック:', error.stack);
    
    // エラー時でも最低限の関数を公開
    window.generateSessionInfographic = function() {
        alert('❌ インフォグラフィックシステムの初期化に失敗しました。コンソールを確認してください。');
    };
    
    window.generateAllKnowledgeInfographic = function() {
        alert('❌ インフォグラフィックシステムの初期化に失敗しました。コンソールを確認してください。');
    };
} 