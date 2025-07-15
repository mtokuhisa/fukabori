// =================================================================================
// 深堀くん - DataManager v2.0
// Phase 2-2: データ構造管理・知見追加・カテゴリ管理・ユーザー管理・データ永続化
// =================================================================================

/**
 * DataManager - データ管理専用モジュール
 * 
 * 【責任範囲】
 * - データ構造管理（KnowledgeState）
 * - 知見追加・管理（addInsight）
 * - カテゴリ管理（CategoryManager）
 * - ユーザー管理（UserManager）
 * - データ永続化（FukaboriKnowledgeDatabase）
 * - データ検索・フィルタリング
 * 
 * 【設計原則】
 * - 単一責任：データ管理機能のみに特化
 * - 後方互換性：既存APIを100%保持
 * - エラーハンドリング：try-catch、フォールバック機能
 * - 依存関係管理：KnowledgeFileManagerInterfaceを通じた安全なアクセス
 */

class DataManager {
    constructor() {
        this.interface = null;
        this.initialized = false;
        this.dataState = null;
        this.categoryManager = null;
        this.userManager = null;
        this.databaseManager = null;
        
        console.log('📊 DataManager: 初期化開始');
    }

    // =================================================================================
    // INITIALIZATION - 初期化
    // =================================================================================

    /**
     * DataManager初期化
     */
    async initialize() {
        try {
            console.log('🔧 DataManager: 初期化プロセス開始');

            // インターフェース確保
            this.interface = this._ensureInterface();

            // データ状態管理の初期化
            this._initializeDataState();

            // サブモジュールの初期化
            await this._initializeSubModules();

            this.initialized = true;
            console.log('✅ DataManager: 初期化完了');
            
            return true;

        } catch (error) {
            console.error('❌ DataManager: 初期化エラー:', error);
            throw error;
        }
    }

    /**
     * データ状態の初期化
     */
    _initializeDataState() {
        if (!window.KnowledgeState) {
            window.KnowledgeState = {
                currentSession: null,
                categories: [],
                users: [],
                insights: [],
                qualityThreshold: 0.7,
                isInitialized: false
            };
        }
        this.dataState = window.KnowledgeState;
        console.log('📋 DataManager: データ状態初期化完了');
    }

    /**
     * サブモジュールの初期化
     */
    async _initializeSubModules() {
        // カテゴリマネージャーの初期化（knowledge-system.jsで定義済みのものを使用）
        this.categoryManager = window.CategoryManager || new CategoryManager();
        if (this.categoryManager.initialize) {
        await this.categoryManager.initialize();
        }

        // ユーザーマネージャーの初期化（knowledge-system.jsで定義済みのものを使用）
        this.userManager = window.UserManager || null;
        if (this.userManager && this.userManager.initialize) {
        await this.userManager.initialize();
        }

        // データベースマネージャーの初期化
        this.databaseManager = new DatabaseManager();
        await this.databaseManager.initialize();

        console.log('🔧 DataManager: サブモジュール初期化完了');
    }

    // =================================================================================
    // INSIGHT MANAGEMENT - 知見管理
    // =================================================================================

    /**
     * 知見追加
     * @param {string} insight - 知見内容
     * @param {Object} context - コンテキスト
     * @param {Object} quality - 品質スコア
     * @returns {Object} 追加された知見エントリ
     */
    addInsight(insight, context, quality) {
        try {
            console.log('📝 DataManager: 知見追加開始');

            // 入力検証
            if (!insight || typeof insight !== 'string') {
                throw new Error('知見内容が無効です');
            }

            // 現在のセッション確認
            const currentSession = this.getCurrentSession();
            if (!currentSession) {
                console.warn('⚠️ DataManager: アクティブなセッションがありません');
                return null;
            }

            // 知見エントリの作成
            const insightEntry = this._createInsightEntry(insight, context, quality);

            // セッションに追加
            const success = this._addInsightToSession(currentSession, insightEntry);
            if (!success) {
                throw new Error('セッションへの知見追加に失敗しました');
            }

            console.log('✅ DataManager: 知見追加完了:', insightEntry.id);
            return insightEntry;

        } catch (error) {
            console.error('❌ DataManager: 知見追加エラー:', error);
            throw error;
        }
    }

    /**
     * 知見エントリの作成
     */
    _createInsightEntry(insight, context, quality) {
        return {
            id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: insight,
            context: context || {},
            quality_scores: {
                confidence: quality?.confidence || 0.8,
                importance: quality?.importance || this._calculateImportance(insight, context)
            },
            timestamp: new Date().toISOString(),
            conversation_context: context?.related_conversation || [],
            categories: [],
            keywords: [],
            dna_enhanced: false
        };
    }

    /**
     * 知見の重要度計算
     */
    _calculateImportance(insight, context) {
        try {
            if (typeof insight !== 'string') {
                return 0.5;
            }

            const baseScore = 0.5;
            const lengthBonus = Math.min(insight.length / 100, 0.3);
            const contextBonus = context && Object.keys(context).length > 0 ? 0.2 : 0;
            
            return Math.min(baseScore + lengthBonus + contextBonus, 1.0);
        } catch (error) {
            console.warn('⚠️ DataManager: 重要度計算エラー:', error);
            return 0.5;
        }
    }

    /**
     * セッションへの知見追加
     */
    _addInsightToSession(session, insightEntry) {
        try {
            if (!session.insights) {
                session.insights = [];
            }

            session.insights.push(insightEntry);
            this.setCurrentSession(session);
            return true;

        } catch (error) {
            console.error('❌ DataManager: セッションへの知見追加エラー:', error);
            return false;
        }
    }

    /**
     * 知見の品質フィルタリング
     */
    filterInsightsByQuality(insights, threshold = null) {
        try {
            const qualityThreshold = threshold || this.dataState.qualityThreshold;
            
            return insights.filter(insight => {
                const importance = insight.quality_scores?.importance || 0.5;
                const confidence = insight.quality_scores?.confidence || 0.5;
                const averageScore = (importance + confidence) / 2;
                
                return averageScore >= qualityThreshold;
            });

        } catch (error) {
            console.error('❌ DataManager: 品質フィルタリングエラー:', error);
            return insights;
        }
    }

    // =================================================================================
    // SESSION MANAGEMENT - セッション管理
    // =================================================================================

    /**
     * 現在のセッション取得
     */
    getCurrentSession() {
        try {
            return this.dataState?.currentSession || null;
        } catch (error) {
            console.error('❌ DataManager: セッション取得エラー:', error);
            return null;
        }
    }

    /**
     * 現在のセッション設定
     */
    setCurrentSession(session) {
        try {
            if (!this.dataState) {
                throw new Error('DataState が未初期化です');
            }

            this.dataState.currentSession = session;
            console.log('📋 DataManager: セッション設定完了');
            return true;

        } catch (error) {
            console.error('❌ DataManager: セッション設定エラー:', error);
            return false;
        }
    }

    /**
     * セッション統計情報取得
     */
    getSessionStats(session = null) {
        try {
            const targetSession = session || this.getCurrentSession();
            if (!targetSession) {
                return null;
            }

            const insights = targetSession.insights || [];
            const totalInsights = insights.length;
            const averageImportance = this._calculateAverageImportance(insights);
            const aiEnhancedCount = insights.filter(i => i.dna_enhanced).length;

            return {
                totalInsights,
                averageImportance,
                aiEnhancedCount,
                aiEnhancedRatio: totalInsights > 0 ? aiEnhancedCount / totalInsights : 0
            };

        } catch (error) {
            console.error('❌ DataManager: セッション統計エラー:', error);
            return null;
        }
    }

    /**
     * 平均重要度計算
     */
    _calculateAverageImportance(insights) {
        if (!insights || insights.length === 0) return 0;

        const total = insights.reduce((sum, insight) => {
            return sum + (insight.quality_scores?.importance || 0.5);
        }, 0);

        return Math.round((total / insights.length) * 100);
    }

    // =================================================================================
    // CATEGORY MANAGEMENT - カテゴリ管理
    // =================================================================================

    /**
     * カテゴリ一覧取得
     */
    getCategories() {
        try {
            return this.dataState?.categories || [];
        } catch (error) {
            console.error('❌ DataManager: カテゴリ取得エラー:', error);
            return [];
        }
    }

    /**
     * カテゴリ検証
     */
    validateCategory(categoryName) {
        try {
            return this.categoryManager?.validateCategory(categoryName) || false;
        } catch (error) {
            console.error('❌ DataManager: カテゴリ検証エラー:', error);
            return false;
        }
    }

    /**
     * カテゴリ選択プロンプト
     */
    async promptCategorySelection() {
        try {
            return await this.categoryManager?.promptCategorySelection() || '一般';
        } catch (error) {
            console.error('❌ DataManager: カテゴリ選択エラー:', error);
            return '一般';
        }
    }

    // =================================================================================
    // USER MANAGEMENT - ユーザー管理
    // =================================================================================

    /**
     * ユーザー一覧取得
     */
    getUsers() {
        try {
            return this.dataState?.users || [];
        } catch (error) {
            console.error('❌ DataManager: ユーザー取得エラー:', error);
            return [];
        }
    }

    /**
     * ユーザーマッチング
     */
    matchUser(nickname) {
        try {
            return this.userManager?.matchUser(nickname) || null;
        } catch (error) {
            console.error('❌ DataManager: ユーザーマッチングエラー:', error);
            return null;
        }
    }

    /**
     * ユーザー確認
     */
    async confirmUser(nickname) {
        try {
            return await this.userManager?.confirmUser(nickname) || null;
        } catch (error) {
            console.error('❌ DataManager: ユーザー確認エラー:', error);
            return null;
        }
    }

    // =================================================================================
    // DATABASE MANAGEMENT - データベース管理
    // =================================================================================

    /**
     * データベース読み込み
     */
    loadDatabase() {
        try {
            return this.databaseManager?.load() || null;
        } catch (error) {
            console.error('❌ DataManager: データベース読み込みエラー:', error);
            return null;
        }
    }

    /**
     * データベース保存
     */
    saveDatabase(database) {
        try {
            return this.databaseManager?.save(database) || false;
        } catch (error) {
            console.error('❌ DataManager: データベース保存エラー:', error);
            return false;
        }
    }

    /**
     * セッションをデータベースに追加
     */
    addSessionToDatabase(sessionData) {
        try {
            return this.databaseManager?.addSession(sessionData) || null;
        } catch (error) {
            console.error('❌ DataManager: セッション追加エラー:', error);
            return null;
        }
    }

    // =================================================================================
    // DATA SEARCH & FILTERING - データ検索・フィルタリング
    // =================================================================================

    /**
     * 知見検索
     */
    searchInsights(query, options = {}) {
        try {
            const session = this.getCurrentSession();
            if (!session || !session.insights) {
                return [];
            }

            let results = session.insights;

            // テキスト検索
            if (query && typeof query === 'string') {
                results = results.filter(insight => 
                    insight.content.toLowerCase().includes(query.toLowerCase()) ||
                    (insight.keywords && insight.keywords.some(k => k.toLowerCase().includes(query.toLowerCase())))
                );
            }

            // カテゴリフィルタ
            if (options.category) {
                results = results.filter(insight => 
                    insight.categories && insight.categories.includes(options.category)
                );
            }

            // 品質フィルタ
            if (options.minQuality) {
                results = this.filterInsightsByQuality(results, options.minQuality);
            }

            // 日付フィルタ
            if (options.fromDate || options.toDate) {
                results = results.filter(insight => {
                    const insightDate = new Date(insight.timestamp);
                    if (options.fromDate && insightDate < new Date(options.fromDate)) return false;
                    if (options.toDate && insightDate > new Date(options.toDate)) return false;
                    return true;
                });
            }

            return results;

        } catch (error) {
            console.error('❌ DataManager: 知見検索エラー:', error);
            return [];
        }
    }

    // =================================================================================
    // UTILITY METHODS - ユーティリティ
    // =================================================================================

    /**
     * インターフェース確保
     */
    _ensureInterface() {
        if (!this.interface) {
            if (typeof window.KnowledgeFileManagerInterface !== 'undefined') {
                this.interface = window.KnowledgeFileManagerInterface;
            } else {
                throw new Error('KnowledgeFileManagerInterface が利用できません');
            }
        }
        return this.interface;
    }

    /**
     * 初期化状態確認
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * データ状態取得
     */
    getDataState() {
        return this.dataState;
    }

    /**
     * 詳細情報出力
     */
    logDataInfo() {
        try {
            const session = this.getCurrentSession();
            const stats = this.getSessionStats();
            
            console.log('📊 DataManager 状態情報:');
            console.log('  - 初期化済み:', this.initialized);
            console.log('  - 現在のセッション:', session ? session.meta?.session_id : 'なし');
            console.log('  - カテゴリ数:', this.getCategories().length);
            console.log('  - ユーザー数:', this.getUsers().length);
            if (stats) {
                console.log('  - 知見数:', stats.totalInsights);
                console.log('  - 平均重要度:', stats.averageImportance + '%');
                console.log('  - AI拡張済み:', stats.aiEnhancedCount);
            }

        } catch (error) {
            console.error('❌ DataManager: 情報出力エラー:', error);
        }
    }
}

// =================================================================================
// CATEGORY MANAGER - カテゴリ管理サブモジュール
// =================================================================================

// CategoryManagerクラス定義（knowledge-system.jsと重複を避けるため削除）
// knowledge-system.jsで定義済みのCategoryManagerを使用

/*
class CategoryManager {
    constructor() {
        this.categories = [];
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🏷️ CategoryManager: 初期化開始');
            await this.loadCategories();
            this.initialized = true;
            console.log('✅ CategoryManager: 初期化完了');
        } catch (error) {
            console.error('❌ CategoryManager: 初期化エラー:', error);
            throw error;
        }
    }

    async loadCategories() {
        try {
            const categories = await this._loadCSV('categories.csv');
            this.categories = categories.filter(cat => cat.is_active === 'true');
            window.KnowledgeState.categories = this.categories;
            
            console.log('✅ カテゴリ読み込み完了:', this.categories.length, '件');
            return this.categories;

        } catch (error) {
            console.error('❌ カテゴリ読み込みエラー:', error);
            // フォールバックデータ
            this.categories = this._getFallbackCategories();
            window.KnowledgeState.categories = this.categories;
            return this.categories;
        }
    }

    validateCategory(categoryName) {
        return this.categories.some(cat => cat.category_name === categoryName);
    }

    async promptCategorySelection() {
        if (this.categories.length === 0) {
            return '一般';
        }

        const categoryNames = this.categories.map(cat => cat.category_name);
        return categoryNames[0]; // 暫定的に最初のカテゴリーを返す
    }

    async _loadCSV(filename) {
        try {
            const response = await fetch(`config/${filename}`);
            if (!response.ok) {
                throw new Error(`CSV読み込み失敗: ${filename}`);
            }
            const csvText = await response.text();
            return this._parseCSV(csvText);
        } catch (error) {
            console.log(`📁 CSV読み込みエラー (${filename}) - フォールバックデータを使用`);
            return this._getFallbackCategories();
        }
    }

    _parseCSV(csvText) {
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
    }

    _getFallbackCategories() {
        return [
            { category_name: '営業手法', category_description: '営業・顧客対応に関する知見', is_active: 'true' },
            { category_name: 'コミュニケ', category_description: 'コミュニケーション・対人関係', is_active: 'true' },
            { category_name: '技術管理', category_description: '技術・開発管理に関する知見', is_active: 'true' },
            { category_name: '組織運営', category_description: '組織・チーム運営に関する知見', is_active: 'true' }
        ];
    }
}
*/

// =================================================================================
// USER MANAGER - ユーザー管理サブモジュール
// =================================================================================

// UserManagerクラス定義（knowledge-system.jsと重複を避けるため削除）
// knowledge-system.jsで定義済みのUserManagerオブジェクトを使用

/*
class UserManager {
    constructor() {
        this.users = [];
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('👤 UserManager: 初期化開始');
            await this.loadUsers();
            this.initialized = true;
            console.log('✅ UserManager: 初期化完了');
        } catch (error) {
            console.error('❌ UserManager: 初期化エラー:', error);
            throw error;
        }
    }

    async loadUsers() {
        try {
            const users = await this._loadCSV('user_names.csv');
            this.users = users.filter(user => user.is_active === 'true');
            window.KnowledgeState.users = this.users;
            
            console.log('✅ ユーザー一覧読み込み完了:', this.users.length, '件');
            return this.users;

        } catch (error) {
            console.error('❌ ユーザー一覧読み込みエラー:', error);
            // フォールバックデータ
            this.users = this._getFallbackUsers();
            window.KnowledgeState.users = this.users;
            return this.users;
        }
    }

    matchUser(nickname) {
        const matches = this.users.filter(user => 
            user.nickname.toLowerCase() === nickname.toLowerCase()
        );
        return matches.length > 0 ? matches[0] : null;
    }

    async confirmUser(nickname) {
        const match = this.matchUser(nickname);
        if (match) {
            return match;
        }
        
        // 新規ユーザーの場合
        return {
            nickname: nickname,
            formal_name: nickname,
            department: '未設定',
            role: '未設定',
            is_new: true
        };
    }

    async _loadCSV(filename) {
        try {
            const response = await fetch(`config/${filename}`);
            if (!response.ok) {
                throw new Error(`CSV読み込み失敗: ${filename}`);
            }
            const csvText = await response.text();
            return this._parseCSV(csvText);
        } catch (error) {
            console.log(`📁 CSV読み込みエラー (${filename}) - フォールバックデータを使用`);
            return this._getFallbackUsers();
        }
    }

    _parseCSV(csvText) {
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
    }

    _getFallbackUsers() {
        return [
            { nickname: 'admin', formal_name: '管理者', department: 'システム', role: '管理者', is_active: 'true' }
        ];
    }
}
*/

// =================================================================================
// DATABASE MANAGER - データベース管理サブモジュール
// =================================================================================

class DatabaseManager {
    constructor() {
        this.storageKey = 'fukabori_knowledge_database';
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🗄️ DatabaseManager: 初期化開始');
            this.initialized = true;
            console.log('✅ DatabaseManager: 初期化完了');
        } catch (error) {
            console.error('❌ DatabaseManager: 初期化エラー:', error);
            throw error;
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) {
                return this._getEmptyDatabase();
            }
            
            const data = JSON.parse(saved);
            console.log(`📋 知見データベース読み込み: ${data.totalSessions}セッション, ${data.totalInsights}知見`);
            return data;

        } catch (error) {
            console.error('❌ 知見データベース読み込みエラー:', error);
            return this._getEmptyDatabase();
        }
    }

    save(database) {
        try {
            database.lastUpdate = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(database));
            console.log(`💾 知見データベース保存完了: ${database.totalSessions}セッション, ${database.totalInsights}知見`);
            return true;

        } catch (error) {
            console.error('❌ 知見データベース保存エラー:', error);
            return false;
        }
    }

    addSession(sessionData) {
        try {
            const database = this.load();
            
            const sessionRecord = {
                sessionId: `session_${this._formatTimestamp(new Date())}`,
                date: new Date().toISOString().split('T')[0],
                theme: sessionData.theme || 'テーマ未設定',
                participant: sessionData.participant || 'ユーザー',
                insights: sessionData.insights || [],
                metadata: {
                    startTime: sessionData.startTime,
                    endTime: new Date().toISOString(),
                    totalInsights: (sessionData.insights || []).length,
                    category: sessionData.category || '汎用',
                    sessionDuration: sessionData.startTime ? 
                        Math.round((new Date() - new Date(sessionData.startTime)) / 1000 / 60) : 0
                }
            };

            database.sessions.unshift(sessionRecord);
            database.totalSessions = database.sessions.length;
            database.totalInsights = database.sessions.reduce((total, session) => 
                total + session.insights.length, 0);

            this.save(database);
            console.log(`✅ セッション知見を永続化: ${sessionRecord.metadata.totalInsights}知見`);
            
            return sessionRecord;

        } catch (error) {
            console.error('❌ セッション知見追加エラー:', error);
            return null;
        }
    }

    _getEmptyDatabase() {
        return {
            sessions: [],
            totalSessions: 0,
            totalInsights: 0,
            lastUpdate: new Date().toISOString()
        };
    }

    _formatTimestamp(date) {
        const yy = String(date.getFullYear()).slice(-2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${yy}${mm}${dd}-${hh}${min}${ss}`;
    }
}

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

// DataManagerインスタンスの作成とグローバル公開
window.DataManager = new DataManager();

// サブモジュールもグローバル公開（後方互換性のため）
// CategoryManagerはknowledge-system.jsで定義済みのため、重複を避ける
// コメントアウトされたクラスは使用しない
window.UserManager = UserManager;
window.DatabaseManager = DatabaseManager;

// 初期化済みフラグ
window.DataManagerInitialized = false;

// 初期化関数
window.initializeDataManager = async function() {
    try {
        if (!window.DataManagerInitialized) {
            await window.DataManager.initialize();
            window.DataManagerInitialized = true;
            console.log('✅ DataManager: グローバル初期化完了');
        }
    } catch (error) {
        console.error('❌ DataManager: グローバル初期化エラー:', error);
        throw error;
    }
};

console.log('📊 DataManager v2.0: モジュール読み込み完了');
console.log('📝 使用方法:');
console.log('  - await initializeDataManager() // 初期化');
console.log('  - DataManager.addInsight(text, context, quality) // 知見追加');
console.log('  - DataManager.getCategories() // カテゴリ取得');
console.log('  - DataManager.searchInsights(query, options) // 知見検索'); 