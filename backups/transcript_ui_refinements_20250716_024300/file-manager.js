// =================================================================================
// FILE MANAGER - ファイル管理専用モジュール
// =================================================================================
//
// 【責任範囲】
// - ファイル生成・ダウンロード機能
// - ファイル内容フォーマット・構築
// - 複数ファイル形式対応（Markdown、JSON等）
// - 統計情報計算
// - ファイル名生成ロジック
// - 全知見ダウンロード機能
//
// 【Phase 2-3】SessionController、DataManager分離済み
// 【設計原則】後方互換性100%保証、段階的移行サポート
//
// =================================================================================

(function() {
    'use strict';

    // =================================================================================
    // CORE FILE MANAGER CLASS - コアファイル管理クラス
    // =================================================================================

    class FileManager {
        constructor() {
            this.supportedFormats = ['markdown', 'json', 'text'];
            this.defaultFormat = 'markdown';
            console.log('📄 FileManager 初期化中...');
        }

        // =================================================================================
        // FILE GENERATION - ファイル生成機能
        // =================================================================================

        /**
         * 知見ファイル生成（メイン機能）
         */
        async generateKnowledgeFile(sessionData = null) {
            console.log('📄 知見ファイル生成開始...');
            
            try {
                // セッションデータの確保
                const session = this._getSessionData(sessionData);
                if (!session) {
                    console.error('❌ セッションデータが見つかりません');
                    return null;
                }

                // ファイル内容構築
                const content = this.buildFileContent(session);
                
                // ファイル名の生成
                const filename = this.generateFileName(session);
                
                // ファイルダウンロード
                const success = this.downloadFile(content, filename);
                if (!success) {
                    console.error('❌ ファイルダウンロードに失敗しました');
                    return null;
                }
                
                console.log('✅ 知見ファイル生成完了:', filename);
                return filename;
                
            } catch (error) {
                console.error('❌ 知見ファイル生成エラー:', error);
                return null;
            }
        }

        /**
         * ファイル内容構築（AI知見整理システム対応）
         */
        buildFileContent(session) {
            const meta = session.meta;
            const insights = session.insights;
            
            let content = '---\n';
            content += '# メタデータ\n';
            content += `meta:\n`;
            content += `  session_id: "${meta.session_id}"\n`;
            content += `  date: "${meta.date}"\n`;
            content += `  category: "${meta.category}"\n`;
            content += `  title: "${meta.title}"\n`;
            content += `  participant: "${meta.participant}"\n`;
            content += `  participant_role: "${meta.participant_role}"\n`;
            content += `  theme: "${meta.theme}"\n`;
            content += `  knowledge_dna_version: "1.0"\n`;
            content += '\n';
            
            content += '# セッション概要\n';
            content += `summary:\n`;
            content += `  overview: "${meta.theme}について深掘りセッションを実施"\n`;
            content += `  insights_count: ${insights.length}\n`;
            content += `  enhanced_by_ai: true\n`;
            content += '\n';
            
            content += '# 抽出された知見（生データ）\n';
            content += `raw_insights:\n`;
            
            insights.forEach((insight, index) => {
                content += `  - id: "${insight.id}"\n`;
                content += `    content: "${insight.content}"\n`;
                content += `    timestamp: "${insight.timestamp}"\n`;
                if (insight.quality_scores) {
                    content += `    quality_scores:\n`;
                    content += `      confidence: ${insight.quality_scores.confidence || 0.5}\n`;
                    content += `      importance: ${insight.quality_scores.importance || 0.5}\n`;
                }
                content += '\n';
            });
            
            content += '---\n\n';
            content += `# ${meta.title}\n\n`;
            content += `**参加者**: ${meta.participant}\n`;
            content += `**日時**: ${new Date(meta.date).toLocaleString('ja-JP')}\n`;
            content += `**カテゴリー**: ${meta.category}\n`;
            content += `**テーマ**: ${meta.theme}\n\n`;
            
            // AI整理された知見セクション
            content += '## 🧬 Knowledge DNA - AI整理された知見\n\n';
            content += '> 以下の知見は、深堀くんのKnowledge DNAシステムによって整理・リライトされた内容です。\n\n';

            // 構造化された知見を表示
            insights.forEach((insight, index) => {
                content += `### 📘 知見 ${index + 1}\n\n`;
                
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
                    
                    if (insight.summary && insight.summary !== 'AI整理済み') {
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
                content += `- 🏷️ カテゴリー: ${meta.category}\n`;
                if (insight.categories && insight.categories.length > 0) {
                    content += `- 🎯 AI分析カテゴリー: ${insight.categories.join(', ')}\n`;
                }
                content += `- ⭐ 重要度: ${insight.quality_scores?.importance ? Math.round(insight.quality_scores.importance * 100) : 50}%\n`;
                content += `- 🎯 信頼度: ${insight.quality_scores?.confidence ? Math.round(insight.quality_scores.confidence * 100) : 50}%\n`;
                content += `- 🔗 セッションID: ${meta.session_id}\n`;
                content += `- 📅 抽出日時: ${insight.timestamp}\n`;
                content += `- 🤖 AI整理: ${insight.dna_enhanced ? '✅ 完了' : '❌ 未実行'}\n`;
                
                content += `\n---\n\n`;
            });

            // ナレッジグラフ情報
            content += this._buildKnowledgeGraph(session, insights);
            
            return content;
        }

        /**
         * Knowledge Graph セクション構築
         */
        _buildKnowledgeGraph(session, insights) {
            const meta = session.meta;
            let content = '## 🕸️ Knowledge Graph（ナレッジグラフ）\n\n';
            content += '> Knowledge DNAシステムによる知見間の関係性分析\n\n';
            
            // セッション統計
            content += `**📊 セッション統計**\n`;
            content += `- 総知見数: ${insights.length}\n`;
            content += `- 平均重要度: ${this.calculateAverageImportance(insights)}%\n`;
            content += `- AI整理済み: ${insights.filter(i => i.dna_enhanced).length}/${insights.length}\n`;
            content += `- テーマカテゴリー: ${meta.category}\n`;
            content += `- 参加者: ${meta.participant}\n\n`;
            
            // 知見クラスター分析
            if (session.knowledge_graph?.clusters?.length > 0) {
                content += `**🔗 知見クラスター分析**\n`;
                session.knowledge_graph.clusters.forEach((cluster, index) => {
                    content += `${index + 1}. **${cluster.theme}**\n`;
                    content += `   - 対象知見: ${cluster.insights.map(i => i + 1).join(', ')}\n`;
                    content += `   - 説明: ${cluster.description}\n\n`;
                });
            } else {
                content += `**🔗 知見クラスター分析**\n`;
                if (insights.length < 2) {
                    content += `- 単一の知見のため、クラスター分析は実行されませんでした\n\n`;
                } else {
                    content += `- 関係性分析中、またはAIによる自動分析が完了していません\n\n`;
                }
            }
            
            // 知見間関係性
            if (session.knowledge_graph?.relationships?.length > 0) {
                content += `**🔄 知見間関係性**\n`;
                session.knowledge_graph.relationships.forEach((rel, index) => {
                    content += `${index + 1}. 知見${rel.from + 1} → 知見${rel.to + 1} (${rel.type})\n`;
                    content += `   - ${rel.description}\n\n`;
                });
            } else {
                content += `**🔄 知見間関係性**\n`;
                if (insights.length < 2) {
                    content += `- 単一の知見のため、関係性分析は実行されませんでした\n\n`;
                } else {
                    content += `- 現在分析中、または関係性が検出されませんでした\n\n`;
                }
            }
            
            // 共通テーマ
            if (session.knowledge_graph?.themes?.length > 0) {
                content += `**🎯 共通テーマ分析**\n`;
                session.knowledge_graph.themes.forEach((theme, index) => {
                    content += `${index + 1}. **${theme.name}** (出現頻度: ${theme.frequency})\n`;
                    content += `   - ${theme.description}\n\n`;
                });
            } else {
                content += `**🎯 共通テーマ分析**\n`;
                const allKeywords = insights.flatMap(i => i.keywords || []);
                const keywordFreq = {};
                allKeywords.forEach(keyword => {
                    keywordFreq[keyword] = (keywordFreq[keyword] || 0) + 1;
                });
                
                const commonKeywords = Object.entries(keywordFreq)
                    .filter(([_, freq]) => freq > 1)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                
                if (commonKeywords.length > 0) {
                    content += `- 自動検出された共通テーマ:\n`;
                    commonKeywords.forEach(([keyword, freq], index) => {
                        content += `  ${index + 1}. **${keyword}** (出現: ${freq}回)\n`;
                    });
                    content += `\n`;
                } else {
                    content += `- メインテーマ: ${meta.theme}\n`;
                    content += `- このセッションの知見は多様性に富んでいます\n\n`;
                }
            }
            
            // 知見継承DNA
            content += `**🧬 知見継承DNA**\n`;
            content += `- 知見系統: ${meta.theme} > ${meta.category}\n`;
            content += `- 継承可能性: ${insights.filter(i => i.dna_enhanced).length > 0 ? '高（AI整理済み）' : '中（基本構造化済み）'}\n`;
            content += `- AI学習適用: ${insights.filter(i => i.dna_enhanced).length > 0 ? '✅ 適用済み' : '⏳ 準備中'}\n`;
            content += `- 組織知化レベル: ${insights.length >= 3 ? '高' : insights.length >= 2 ? '中' : '低'}\n`;
            
            const uniqueKeywords = [...new Set(insights.flatMap(i => i.keywords || []))];
            if (uniqueKeywords.length > 0) {
                content += `- 知見キーワード: ${uniqueKeywords.slice(0, 10).join(', ')}${uniqueKeywords.length > 10 ? '...' : ''}\n`;
            }
            content += `\n`;
            
            return content;
        }

        // =================================================================================
        // FILE DOWNLOAD - ファイルダウンロード機能
        // =================================================================================

        /**
         * ファイルダウンロード（コア機能）
         */
        downloadFile(content, filename, format = 'markdown') {
            try {
                const mimeType = this._getMimeType(format);
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                console.log('✅ ファイルダウンロード完了:', filename);
                return true;
            } catch (error) {
                console.error('❌ ファイルダウンロードエラー:', error);
                return false;
            }
        }

        /**
         * MIMEタイプ取得
         */
        _getMimeType(format) {
            const mimeTypes = {
                'markdown': 'text/markdown;charset=utf-8',
                'json': 'application/json;charset=utf-8',
                'text': 'text/plain;charset=utf-8'
            };
            return mimeTypes[format] || mimeTypes.markdown;
        }

        // =================================================================================
        // FILE NAME GENERATION - ファイル名生成機能
        // =================================================================================

        /**
         * ファイル名生成
         */
        generateFileName(session, format = 'markdown') {
            const timestamp = this.formatTimestamp(new Date());
            const dnaPrefix = session.knowledge_graph ? 'KnowledgeDNA_' : '知見_';
            const title = session.meta.title || 'セッション記録';
            const extension = this._getFileExtension(format);
            
            return `${dnaPrefix}${title}_${timestamp}.${extension}`;
        }

        /**
         * ファイル拡張子取得
         */
        _getFileExtension(format) {
            const extensions = {
                'markdown': 'md',
                'json': 'json',
                'text': 'txt'
            };
            return extensions[format] || 'md';
        }

        /**
         * タイムスタンプフォーマット
         */
        formatTimestamp(date) {
            const yy = String(date.getFullYear()).slice(2);
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hh = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            const ss = String(date.getSeconds()).padStart(2, '0');
            return `${yy}${mm}${dd}-${hh}${min}${ss}`;
        }

        // =================================================================================
        // STATISTICS - 統計計算機能
        // =================================================================================

        /**
         * 平均重要度計算
         */
        calculateAverageImportance(insights) {
            if (insights.length === 0) return 0;
            
            const total = insights.reduce((sum, insight) => {
                return sum + (insight.quality_scores?.importance || 0.5);
            }, 0);
            
            return Math.round((total / insights.length) * 100);
        }

        /**
         * セッション統計計算
         */
        calculateSessionStats(session) {
            const insights = session.insights || [];
            const aiEnhanced = insights.filter(i => i.dna_enhanced).length;
            const avgImportance = this.calculateAverageImportance(insights);
            
            return {
                totalInsights: insights.length,
                aiEnhanced,
                aiEnhancedRatio: insights.length > 0 ? Math.round((aiEnhanced / insights.length) * 100) : 0,
                avgImportance,
                category: session.meta.category,
                participant: session.meta.participant,
                theme: session.meta.theme
            };
        }

        // =================================================================================
        // ALL KNOWLEDGE DOWNLOAD - 全知見ダウンロード機能
        // =================================================================================

        /**
         * 全知見ダウンロード
         */
        async downloadAllKnowledge() {
            console.log('🧬 全知見ダウンロード開始');
            
            try {
                // データベース取得
                const database = this._getDatabase();
                if (!database || database.totalInsights === 0) {
                    this._showMessage('info', '保存された知見がありません。セッションを完了して知見を蓄積してください。');
                    return;
                }

                // プログレス表示
                this._showMessage('info', `🔄 ${database.totalSessions}セッション分の全知見を整理中...`);

                // 全知見統合
                const allInsights = this._consolidateAllInsights(database);

                // AI整理
                const enhancedDatabase = await this._enhanceAllKnowledgeWithAI(database, allInsights);

                // ファイル生成
                const fileContent = this.buildAllKnowledgeFileContent(enhancedDatabase, allInsights);
                const timestamp = this.formatTimestamp(new Date());
                const filename = `全知見アーカイブ_KnowledgeDNA_${timestamp}.md`;

                // ダウンロード
                const success = this.downloadFile(fileContent, filename);
                
                if (success) {
                    this._showMessage('success', `🎉 全知見アーカイブ「${filename}」をダウンロードしました！`);
                    console.log('✅ 全知見ダウンロード完了');
                } else {
                    throw new Error('ファイルダウンロードに失敗しました');
                }

            } catch (error) {
                console.error('❌ 全知見ダウンロードエラー:', error);
                this._showMessage('error', '全知見のダウンロードに失敗しました。');
            }
        }

        /**
         * 全知見ファイル内容構築
         */
        buildAllKnowledgeFileContent(database, allInsights) {
            const timestamp = new Date().toLocaleString('ja-JP');
            let content = '';

            // メタデータセクション
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
            content += `> 深堀くんアプリで蓄積した全知見の包括的アーカイブ\n\n`;
            content += `**📊 アーカイブ統計**\n`;
            content += `- 総セッション数: ${database.totalSessions}\n`;
            content += `- 総知見数: ${database.totalInsights}\n`;
            content += `- 生成日時: ${timestamp}\n`;
            content += `- 分析期間: ${database.sessions.length > 0 ? 
                `${database.sessions[database.sessions.length - 1].date} ～ ${database.sessions[0].date}` : '未記録'}\n\n`;

            // 各セッションの知見
            database.sessions.forEach((session, sessionIndex) => {
                content += `## 📋 セッション ${sessionIndex + 1}: ${session.metadata.title}\n\n`;
                content += `**基本情報**\n`;
                content += `- 日時: ${new Date(session.date).toLocaleString('ja-JP')}\n`;
                content += `- テーマ: ${session.metadata.theme}\n`;
                content += `- カテゴリー: ${session.metadata.category}\n`;
                content += `- 参加者: ${session.metadata.participant}\n`;
                content += `- 知見数: ${session.insights.length}\n\n`;

                // 各知見の詳細
                session.insights.forEach((insight, index) => {
                    content += `### 📘 知見 ${sessionIndex + 1}-${index + 1}\n\n`;
                    
                    // AI整理された内容
                    if (insight.enhanced_content && insight.dna_enhanced) {
                        content += `**📝 AI整理された内容**\n`;
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
                        
                        if (insight.summary && insight.summary !== 'AI整理済み') {
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
            });

            // 横断的分析
            content += `## 🔍 横断的知見分析\n\n`;
            content += `**📊 全体統計**\n`;
            content += `- 総知見数: ${database.totalInsights}\n`;
            content += `- 総セッション数: ${database.totalSessions}\n`;
            content += `- 平均知見数/セッション: ${database.totalSessions > 0 ? Math.round(database.totalInsights / database.totalSessions) : 0}\n`;
            content += `- AI整理済み知見数: ${allInsights.filter(i => i.dna_enhanced).length}\n`;
            content += `- AI整理率: ${database.totalInsights > 0 ? Math.round((allInsights.filter(i => i.dna_enhanced).length / database.totalInsights) * 100) : 0}%\n\n`;

            // 横断的関係性
            content += `**🔗 横断的関係性**\n`;
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
        // UTILITY METHODS - ユーティリティメソッド
        // =================================================================================

        /**
         * セッションデータ取得
         */
        _getSessionData(sessionData) {
            if (sessionData) return sessionData;
            
            // KnowledgeStateから現在のセッションを取得
            if (window.KnowledgeState?.currentSession) {
                return window.KnowledgeState.currentSession;
            }
            
            // フォールバック: 空のセッションを返す
            console.warn('⚠️ セッションデータが見つかりません。フォールバックを使用します。');
            return null;
        }

        /**
         * データベース取得
         */
        _getDatabase() {
            try {
                if (window.FukaboriKnowledgeDatabase?.load) {
                    return window.FukaboriKnowledgeDatabase.load();
                }
                console.warn('⚠️ FukaboriKnowledgeDatabase が利用できません');
                return null;
            } catch (error) {
                console.error('❌ データベース取得エラー:', error);
                return null;
            }
        }

        /**
         * 全知見統合
         */
        _consolidateAllInsights(database) {
            const allInsights = [];
            database.sessions.forEach(session => {
                session.insights.forEach(insight => {
                    allInsights.push({
                        ...insight,
                        sessionInfo: {
                            date: session.date,
                            theme: session.metadata.theme,
                            sessionId: session.sessionId
                        }
                    });
                });
            });
            return allInsights;
        }

        /**
         * AI整理（全知見）
         */
        async _enhanceAllKnowledgeWithAI(database, allInsights) {
            try {
                if (window.enhanceAllKnowledgeWithAI) {
                    return await window.enhanceAllKnowledgeWithAI(database, allInsights);
                }
                console.warn('⚠️ enhanceAllKnowledgeWithAI が利用できません');
                return database;
            } catch (error) {
                console.error('❌ AI整理エラー:', error);
                return database;
            }
        }

        /**
         * メッセージ表示
         */
        _showMessage(type, message) {
            if (typeof window.showMessage === 'function') {
                window.showMessage(type, message);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        }

        // =================================================================================
        // INITIALIZATION - 初期化処理
        // =================================================================================

        /**
         * FileManager初期化
         */
        async initialize() {
            console.log('📄 FileManager 初期化開始...');
            
            try {
                // 依存関係チェック
                const dependencies = this._checkDependencies();
                if (dependencies.missing.length > 0) {
                    console.warn('⚠️ 不足している依存関係:', dependencies.missing);
                }

                // 最小依存関係チェック
                if (!dependencies.canOperate) {
                    console.error('❌ 最小依存関係が不足しています');
                    return false;
                }

                console.log('✅ FileManager 初期化完了');
                return true;
                
            } catch (error) {
                console.error('❌ FileManager 初期化エラー:', error);
                return false;
            }
        }

        /**
         * 依存関係チェック
         */
        _checkDependencies() {
            const dependencies = {
                knowledgeState: !!window.KnowledgeState,
                showMessage: typeof window.showMessage === 'function',
                database: !!window.FukaboriKnowledgeDatabase
            };

            const missing = Object.entries(dependencies)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            return {
                all: dependencies,
                missing,
                canOperate: dependencies.knowledgeState && dependencies.showMessage
            };
        }
    }

    // =================================================================================
    // GLOBAL EXPORTS - グローバル公開
    // =================================================================================

    // FileManagerインスタンスを作成
    const fileManager = new FileManager();

    // グローバル公開
    window.FileManager = fileManager;

    // 個別関数も公開（後方互換性のため）
    window.downloadAllKnowledge = (...args) => fileManager.downloadAllKnowledge(...args);
    window.buildAllKnowledgeFileContent = (...args) => fileManager.buildAllKnowledgeFileContent(...args);

    console.log('✅ FileManager 読み込み完了');
    console.log('📄 主要機能:');
    console.log('  - FileManager.generateKnowledgeFile() // ファイル生成');
    console.log('  - FileManager.downloadAllKnowledge() // 全知見DL');
    console.log('  - FileManager.buildFileContent() // ファイル内容構築');
    console.log('  - FileManager.downloadFile() // ファイルDL');

})(); 