// 深堀くんアプリ v2.0 - SessionController
// Session Management System for Fukabori-kun App

// =================================================================================
// SESSION CONTROLLER - セッション制御システム
// =================================================================================

/**
 * SessionController - セッション制御専用モジュール
 * 
 * 責任範囲:
 * - セッション作成・初期化
 * - セッションメタデータ管理
 * - セッション状態管理
 * - タイムスタンプ管理
 * - タイトル要約生成
 * 
 * 依存関係:
 * - KnowledgeFileManagerInterface (状態管理)
 * - window.KnowledgeState (グローバル状態)
 * 
 * 注意: SessionEndManagerとは分離されており、セッション終了処理は含まない
 */

const SessionController = {
    // 依存関係インターフェース
    interface: null,
    
    // =================================================================================
    // 初期化
    // =================================================================================
    
    init() {
        console.log('🎯 SessionController初期化開始');
        try {
            this._ensureInterface();
            console.log('✅ SessionController初期化完了');
        } catch (error) {
            console.error('❌ SessionController初期化エラー:', error);
            throw error;
        }
    },
    
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
    
    // =================================================================================
    // セッション作成・初期化
    // =================================================================================
    
    /**
     * セッションファイルの作成
     * @param {Object} sessionMeta - セッションメタデータ
     * @returns {Object} - 作成されたセッションオブジェクト
     */
    async createSessionFile(sessionMeta) {
        const iface = this._ensureInterface();
        
        try {
            const timestamp = this.formatTimestamp(new Date());
            const category = sessionMeta.category || 'その他';
            const titleSummary = this.generateTitleSummary(sessionMeta.theme);
            
            const filename = `${timestamp}_${category}_${titleSummary}.md`;
            
            const knowledgeFile = {
                filename: filename,
                meta: {
                    session_id: sessionMeta.session_id,
                    date: new Date().toISOString(),
                    category: category,
                    title: titleSummary,
                    participant: sessionMeta.participant || 'ゲスト',
                    participant_role: sessionMeta.participant_role || 'ユーザー',
                    theme: sessionMeta.theme,
                    session_start: new Date().toISOString()
                },
                insights: [],
                conversations: [],
                isActive: true
            };
            
            // インターフェース経由でセッション設定
            const success = iface.state.setCurrentSession(knowledgeFile);
            if (!success) {
                throw new Error('セッションファイルの設定に失敗しました');
            }
            
            console.log('✅ 知見セッションファイル初期化:', filename);
            
            return knowledgeFile;
            
        } catch (error) {
            console.error('❌ セッションファイル作成エラー:', error);
            throw error;
        }
    },
    
    /**
     * 新しいセッションの開始
     * @param {Object} options - セッション開始オプション
     * @returns {Object} - 開始されたセッション
     */
    async startSession(options = {}) {
        const sessionMeta = {
            session_id: options.session_id || `session_${Date.now()}`,
            theme: options.theme || 'セッション',
            participant: options.participant || 'ゲスト',
            participant_role: options.participant_role || 'ユーザー',
            category: options.category || 'その他'
        };
        
        try {
            console.log('🎯 新しいセッション開始:', sessionMeta);
            const session = await this.createSessionFile(sessionMeta);
            console.log('✅ セッション開始完了:', session.meta.session_id);
            return session;
        } catch (error) {
            console.error('❌ セッション開始エラー:', error);
            throw error;
        }
    },
    
    // =================================================================================
    // セッション状態管理
    // =================================================================================
    
    /**
     * 現在のセッションを取得
     * @returns {Object|null} - 現在のセッション
     */
    getCurrentSession() {
        try {
            const iface = this._ensureInterface();
            return iface.state.getCurrentSession();
        } catch (error) {
            console.error('❌ セッション取得エラー:', error);
            return null;
        }
    },
    
    /**
     * セッションを設定
     * @param {Object} session - セッションオブジェクト
     * @returns {boolean} - 成功/失敗
     */
    setCurrentSession(session) {
        try {
            const iface = this._ensureInterface();
            return iface.state.setCurrentSession(session);
        } catch (error) {
            console.error('❌ セッション設定エラー:', error);
            return false;
        }
    },
    
    /**
     * セッションにデータを追加
     * @param {Object} data - 追加するデータ
     * @returns {boolean} - 成功/失敗
     */
    addDataToSession(data) {
        try {
            const iface = this._ensureInterface();
            const session = iface.state.getCurrentSession();
            
            if (!session) {
                console.warn('⚠️ アクティブなセッションがありません');
                return false;
            }
            
            // データの種類に応じて適切なフィールドに追加
            if (data.type === 'insight') {
                return iface.state.addInsightToSession(data);
            } else if (data.type === 'conversation') {
                return iface.state.addConversationToSession(data);
            }
            
            console.warn('⚠️ サポートされていないデータタイプ:', data.type);
            return false;
            
        } catch (error) {
            console.error('❌ データ追加エラー:', error);
            return false;
        }
    },
    
    /**
     * セッションメタデータの更新
     * @param {Object} updates - 更新するメタデータ
     * @returns {boolean} - 成功/失敗
     */
    updateSessionMeta(updates) {
        try {
            const iface = this._ensureInterface();
            const session = iface.state.getCurrentSession();
            
            if (!session) {
                console.warn('⚠️ アクティブなセッションがありません');
                return false;
            }
            
            // メタデータの更新
            Object.assign(session.meta, updates);
            
            // 更新されたセッションを保存
            const success = iface.state.setCurrentSession(session);
            
            if (success) {
                console.log('✅ セッションメタデータ更新:', updates);
            }
            
            return success;
            
        } catch (error) {
            console.error('❌ メタデータ更新エラー:', error);
            return false;
        }
    },
    
    /**
     * セッションの一時停止
     * @returns {boolean} - 成功/失敗
     */
    pauseSession() {
        try {
            const session = this.getCurrentSession();
            
            if (!session) {
                console.warn('⚠️ アクティブなセッションがありません');
                return false;
            }
            
            return this.updateSessionMeta({
                status: 'paused',
                paused_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ セッション一時停止エラー:', error);
            return false;
        }
    },
    
    /**
     * セッションの再開
     * @returns {boolean} - 成功/失敗
     */
    resumeSession() {
        try {
            const session = this.getCurrentSession();
            
            if (!session) {
                console.warn('⚠️ アクティブなセッションがありません');
                return false;
            }
            
            return this.updateSessionMeta({
                status: 'active',
                resumed_at: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ セッション再開エラー:', error);
            return false;
        }
    },
    
    // =================================================================================
    // ユーティリティ機能
    // =================================================================================
    
    /**
     * タイムスタンプフォーマット (YYMMDD-HHMMSS)
     * @param {Date} date - フォーマットする日付
     * @returns {string} - フォーマットされたタイムスタンプ
     */
    formatTimestamp(date) {
        const yy = String(date.getFullYear()).slice(2);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        
        return `${yy}${mm}${dd}-${hh}${min}${ss}`;
    },
    
    /**
     * タイトル要約生成（20文字以内）
     * @param {string} theme - 元のテーマ
     * @returns {string} - 要約されたタイトル
     */
    generateTitleSummary(theme) {
        if (!theme) return 'セッション記録';
        
        try {
            // 基本的な要約処理
            let summary = theme.replace(/[「」]/g, '').trim();
            if (summary.length > 20) {
                summary = summary.substring(0, 17) + '...';
            }
            
            return summary;
            
        } catch (error) {
            console.error('❌ タイトル要約生成エラー:', error);
            return 'セッション記録';
        }
    },
    
    /**
     * セッション統計情報の取得
     * @param {Object} session - セッション（指定しない場合は現在のセッション）
     * @returns {Object} - 統計情報
     */
    getSessionStats(session = null) {
        try {
            const targetSession = session || this.getCurrentSession();
            
            if (!targetSession) {
                return {
                    session_id: null,
                    duration: 0,
                    insights_count: 0,
                    conversations_count: 0,
                    theme: null,
                    participant: null,
                    is_active: false
                };
            }
            
            const startTime = new Date(targetSession.meta.session_start);
            const endTime = targetSession.meta.session_end ? 
                new Date(targetSession.meta.session_end) : new Date();
            
            const duration = Math.round((endTime - startTime) / 1000 / 60); // 分単位
            
            return {
                session_id: targetSession.meta.session_id,
                duration: duration,
                insights_count: targetSession.insights?.length || 0,
                conversations_count: targetSession.conversations?.length || 0,
                theme: targetSession.meta.theme,
                participant: targetSession.meta.participant,
                category: targetSession.meta.category,
                is_active: targetSession.isActive,
                status: targetSession.meta.status || 'active'
            };
            
        } catch (error) {
            console.error('❌ セッション統計取得エラー:', error);
            return {
                session_id: null,
                duration: 0,
                insights_count: 0,
                conversations_count: 0,
                theme: null,
                participant: null,
                is_active: false,
                error: error.message
            };
        }
    },
    
    /**
     * セッションの検証
     * @param {Object} session - 検証するセッション
     * @returns {boolean} - セッションが有効かどうか
     */
    validateSession(session) {
        try {
            if (!session) {
                console.warn('⚠️ セッションがnullまたはundefinedです');
                return false;
            }
            
            // 必須フィールドの確認
            const requiredFields = ['filename', 'meta', 'insights'];
            for (const field of requiredFields) {
                if (!session.hasOwnProperty(field)) {
                    console.warn(`⚠️ セッションに必須フィールド ${field} がありません`);
                    return false;
                }
            }
            
            // メタデータの確認
            const requiredMeta = ['session_id', 'date', 'theme'];
            for (const field of requiredMeta) {
                if (!session.meta.hasOwnProperty(field)) {
                    console.warn(`⚠️ セッションメタデータに必須フィールド ${field} がありません`);
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ セッション検証エラー:', error);
            return false;
        }
    },
    
    // =================================================================================
    // デバッグ・ログ機能
    // =================================================================================
    
    /**
     * セッション情報の表示
     * @param {Object} session - 表示するセッション（指定しない場合は現在のセッション）
     */
    logSessionInfo(session = null) {
        try {
            const targetSession = session || this.getCurrentSession();
            
            if (!targetSession) {
                console.log('📋 アクティブなセッションがありません');
                return;
            }
            
            const stats = this.getSessionStats(targetSession);
            
            console.log('📋 セッション情報:');
            console.log(`  ID: ${stats.session_id}`);
            console.log(`  テーマ: ${stats.theme}`);
            console.log(`  参加者: ${stats.participant}`);
            console.log(`  カテゴリー: ${stats.category}`);
            console.log(`  継続時間: ${stats.duration}分`);
            console.log(`  知見数: ${stats.insights_count}`);
            console.log(`  会話数: ${stats.conversations_count}`);
            console.log(`  ステータス: ${stats.status}`);
            console.log(`  アクティブ: ${stats.is_active}`);
            
        } catch (error) {
            console.error('❌ セッション情報表示エラー:', error);
        }
    },
    
    /**
     * 全セッション情報の表示
     */
    logAllSessionInfo() {
        try {
            console.log('📋 SessionController情報:');
            console.log(`  インターフェース: ${this.interface ? 'OK' : 'NG'}`);
            
            const current = this.getCurrentSession();
            if (current) {
                console.log('  現在のセッション:');
                this.logSessionInfo(current);
            } else {
                console.log('  現在のセッション: なし');
            }
            
        } catch (error) {
            console.error('❌ 全セッション情報表示エラー:', error);
        }
    }
};

// =================================================================================
// グローバル公開
// =================================================================================

// SessionControllerをグローバルに公開
window.SessionController = SessionController;

// 後方互換性のための関数
window.createKnowledgeSession = async function(sessionMeta) {
    console.warn('⚠️ createKnowledgeSession は非推奨です。SessionController.createSessionFile を使用してください');
    return await SessionController.createSessionFile(sessionMeta);
};

window.getCurrentKnowledgeSession = function() {
    console.warn('⚠️ getCurrentKnowledgeSession は非推奨です。SessionController.getCurrentSession を使用してください');
    return SessionController.getCurrentSession();
};

window.getSessionStats = function(session = null) {
    console.warn('⚠️ getSessionStats は非推奨です。SessionController.getSessionStats を使用してください');
    return SessionController.getSessionStats(session);
};

console.log('✅ SessionController（セッション制御システム）読み込み完了'); 