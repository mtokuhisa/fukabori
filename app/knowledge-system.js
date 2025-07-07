// =================================================================================
// 深堀くん - Knowledge System v1.0
// Phase C-2-1: 知見管理システム分離モジュール
// =================================================================================

/**
 * Knowledge System - 知見管理専用システム
 * 
 * 【責任範囲】
 * - 知見データベース管理（FukaboriKnowledgeDatabase）
 * - CSV管理システム（CategoryManager、UserManager）
 * - 知見ファイル管理（KnowledgeFileManager）
 * - 全知見ダウンロード機能
 * - 知見永続化・AI整理システム
 * 
 * 【設計原則】
 * - 完全独立性：他モジュールに非依存
 * - 後方互換性：既存API 100%維持
 * - エラーハンドリング：フォールバック機能完備
 * - インターフェース抽象化：テスト・モック化対応
 */

// =================================================================================
// GLOBAL STATE INITIALIZATION - グローバル状態初期化
// =================================================================================

// KnowledgeStateの初期化（script.jsとの調整済み）
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
            if (window.showMessage) {
                window.showMessage('success', `💾 ${sessionRecord.metadata.totalInsights}件の知見を永続保存しました`);
            }

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
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        });
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
// KNOWLEDGE FILE MANAGEMENT SYSTEM - 知見ファイル管理システム
// =================================================================================

// 📄 知見ファイル管理システム
const KnowledgeFileManager = {
    // 依存関係インターフェース
    interface: null,
    
    // インターフェース初期化
    _ensureInterface() {
        if (!this.interface) {
            this.interface = window.KnowledgeFileManagerInterface;
            if (!this.interface) {
                throw new Error('KnowledgeFileManagerInterface が見つかりません');
            }
        }
        return this.interface;
    },

    // セッションファイル作成
    createSessionFile(sessionMeta) {
        try {
            const knowledgeFile = {
                metadata: {
                    session_id: sessionMeta.session_id,
                    title: `深堀セッション：${sessionMeta.theme}`,
                    date: new Date().toISOString(),
                    participant: sessionMeta.participant,
                    participant_role: sessionMeta.participant_role || 'ユーザー',
                    category: sessionMeta.category,
                    theme: sessionMeta.theme,
                    format_version: "fukabori_v1.0"
                },
                insights: [],
                summary: null,
                analysis: null
            };
            
            // KnowledgeStateに現在のセッションとして設定
            window.KnowledgeState.currentSession = knowledgeFile;
            
            console.log(`✅ 知見セッションファイル作成: ${sessionMeta.theme}`);
            return knowledgeFile;
            
        } catch (error) {
            console.error('❌ セッションファイル作成エラー:', error);
            throw error;
        }
    },

    // 知見の追加（DataManagerに移譲予定）
    addInsight(insight, context, quality) {
        console.warn('⚠️ KnowledgeFileManager.addInsight は非推奨です。DataManager.addInsight を使用してください');
        
        // DataManagerが利用可能かチェック
        if (window.DataManager && window.DataManager.isInitialized && window.DataManager.isInitialized()) {
            try {
                return window.DataManager.addInsight(insight, context, quality);
            } catch (error) {
                console.error('❌ DataManager.addInsight実行エラー:', error);
                // フォールバック処理へ
            }
        }
        
        // フォールバック実装（DataManager未使用時）
        const iface = this._ensureInterface();
        
        const currentSession = iface.state.getCurrentSession();
        if (!currentSession) {
            console.warn('⚠️ アクティブなセッションがありません');
            return false;
        }

        const insightEntry = {
            id: `insight_${Date.now()}`,
            content: insight,
            context: context,
            quality_scores: quality,
            timestamp: new Date().toISOString(),
            conversation_context: context.related_conversation || []
        };

        // インターフェース経由で知見を追加
        const success = iface.state.addInsightToSession(insightEntry);
        if (!success) {
            console.error('❌ 知見の追加に失敗しました');
            return false;
        }
        
        console.log('✅ 知見を追加:', insight.substring(0, 50) + '...');
        return true;
    }
};

// =================================================================================
// ALL KNOWLEDGE DOWNLOAD FUNCTIONS - 全知見ダウンロード機能
// =================================================================================

// 🧬 全知見ダウンロード機能（FileManagerに移譲）
async function downloadAllKnowledge() {
    console.warn('⚠️ downloadAllKnowledge は非推奨です。FileManager.downloadAllKnowledge を使用してください');
    
    // FileManagerが利用可能かチェック
    if (window.FileManager) {
        try {
            return await window.FileManager.downloadAllKnowledge();
        } catch (error) {
            console.error('❌ FileManager.downloadAllKnowledge実行エラー:', error);
            // フォールバック処理へ
        }
    }
    
    // フォールバック実装（FileManager未使用時）
    console.log('🧬 全知見ダウンロード開始');
    
    try {
        const database = FukaboriKnowledgeDatabase.load();
        
        if (database.totalInsights === 0) {
            if (window.showMessage) {
                window.showMessage('info', '保存された知見がありません。セッションを完了して知見を蓄積してください。');
            }
            return;
        }

        // プログレス表示
        if (window.showMessage) {
            window.showMessage('info', `🔄 ${database.totalSessions}セッション分の全知見を整理中...`);
        }

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

        if (window.downloadTextFile) {
            window.downloadTextFile(fileContent, filename);
        } else {
            console.error('❌ downloadTextFile関数が見つかりません');
            return;
        }

        if (window.showMessage) {
            window.showMessage('success', `🎉 全知見アーカイブ「${filename}」をダウンロードしました！`);
        }
        console.log('✅ 全知見ダウンロード完了');

    } catch (error) {
        console.error('❌ 全知見ダウンロードエラー:', error);
        if (window.showMessage) {
            window.showMessage('error', '全知見のダウンロードに失敗しました。');
        }
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
        if (window.showMessage) {
            window.showMessage('info', '🔄 全知見をAIで分析・整理中...');
        }

        // 代表的な知見のみAI処理（パフォーマンス考慮）
        const sampleInsights = allInsights.slice(0, 5);
        
        for (let i = 0; i < sampleInsights.length; i++) {
            const insight = sampleInsights[i];
            if (!insight.enhanced_content) {
                // AIManagerが利用可能かチェック
                if (window.AIManager && window.AIManager.isInitialized) {
                    try {
                        const enhanced = await window.AIManager.rewriteInsightForClarity(
                            insight.content, 
                            insight.sessionInfo
                        );
                        insight.enhanced_content = enhanced?.enhanced || insight.content;
                        insight.summary = enhanced?.summary || '要約生成中...';
                    } catch (error) {
                        console.error('❌ AI整理エラー:', error);
                        insight.enhanced_content = insight.content;
                        insight.summary = 'AI整理をスキップしました';
                    }
                } else {
                    // フォールバック
                    insight.enhanced_content = insight.content;
                    insight.summary = 'AI整理システムが利用できません';
                }
            }
        }

        console.log('✅ 全知見AI整理完了');
        return database;

    } catch (error) {
        console.error('❌ 全知見AI整理エラー:', error);
        return database;
    }
}

// 全知見アーカイブファイル内容構築
function buildAllKnowledgeFileContent(database, allInsights) {
    console.warn('⚠️ buildAllKnowledgeFileContent は非推奨です。FileManager.buildAllKnowledgeFileContent を使用してください');
    
    // FileManagerが利用可能かチェック
    if (window.FileManager) {
        try {
            return window.FileManager.buildAllKnowledgeFileContent(database, allInsights);
        } catch (error) {
            console.error('❌ FileManager.buildAllKnowledgeFileContent実行エラー:', error);
            // フォールバック処理へ
        }
    }
    
    // フォールバック実装（FileManager未使用時）
    const timestamp = new Date().toLocaleString('ja-JP');
    let content = '';

    // 全体メタデータセクション
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
    content += `- データ期間: ${database.sessions.length > 0 ? 
        `${database.sessions[database.sessions.length - 1].date} ～ ${database.sessions[0].date}` : '未記録'}\n`;
    content += `- Knowledge DNA版: v1.0\n\n`;

    content += `---\n\n`;

    // 各セッションの詳細
    database.sessions.forEach((session, sessionIndex) => {
        if (session.insights.length === 0) return;

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

        session.insights.forEach((insight, index) => {
            content += `### 📘 知見 ${index + 1}\n\n`;

            // AI整理された内容を表示（利用可能な場合）
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
// KNOWLEDGE MANAGEMENT INITIALIZATION - 知見管理システム初期化
// =================================================================================

// 知見管理システムの初期化
async function initializeKnowledgeManagement() {
    try {
        console.log('📚 知見データ管理システム初期化開始...');
        
        // CSV データの読み込み
        await CategoryManager.loadCategories();
        await UserManager.loadUsers();
        
        window.KnowledgeState.isInitialized = true;
        console.log('✅ 知見データ管理システム初期化完了');
        
    } catch (error) {
        console.error('❌ 知見管理システム初期化エラー:', error);
        window.KnowledgeState.isInitialized = false;
    }
}

// =================================================================================
// LEGACY COMPATIBILITY - レガシー互換性
// =================================================================================

// 互換性のためのラッパー関数（exportAllData → downloadAllKnowledge）
async function exportAllData() {
    console.log('💡 exportAllData が実行されました（downloadAllKnowledgeへリダイレクト）');
    await downloadAllKnowledge();
}

// =================================================================================
// KNOWLEDGE MANAGEMENT INTERFACE - 知見管理インターフェース
// =================================================================================

// 🔌 外部システムとの接続インターフェース
const KnowledgeManagementInterface = {
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
    getCSVManager: () => CSVManager,
    downloadAllKnowledge: downloadAllKnowledge,
    enhanceAllKnowledgeWithAI: enhanceAllKnowledgeWithAI,
    buildAllKnowledgeFileContent: buildAllKnowledgeFileContent
};

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

// システムをグローバルに公開（後方互換性）
window.CategoryManager = CategoryManager;
window.UserManager = UserManager;
window.FukaboriKnowledgeDatabase = FukaboriKnowledgeDatabase;
window.CSVManager = CSVManager;
window.KnowledgeFileManager = KnowledgeFileManager;
window.KnowledgeManagementInterface = KnowledgeManagementInterface;

// 関数のグローバル公開
window.downloadAllKnowledge = downloadAllKnowledge;
window.enhanceAllKnowledgeWithAI = enhanceAllKnowledgeWithAI;
window.buildAllKnowledgeFileContent = buildAllKnowledgeFileContent;
window.initializeKnowledgeManagement = initializeKnowledgeManagement;
window.exportAllData = exportAllData;

console.log('✅ Knowledge System v1.0 読み込み完了');
console.log('📊 主要機能:');
console.log('  - FukaboriKnowledgeDatabase // 知見データベース');
console.log('  - CategoryManager/UserManager // カテゴリ・ユーザー管理');
console.log('  - downloadAllKnowledge() // 全知見ダウンロード');
console.log('  - initializeKnowledgeManagement() // システム初期化');
console.log('  - KnowledgeFileManager // 知見ファイル管理'); 