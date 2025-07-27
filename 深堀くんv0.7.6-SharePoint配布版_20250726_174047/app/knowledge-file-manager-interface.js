// =================================================================================
// 深堀くん - KnowledgeFileManager 依存関係インターフェース
// Phase 1: 最小リスク・段階的分離
// =================================================================================

/**
 * KnowledgeFileManagerの外部依存関係を抽象化するインターフェース
 * 
 * 目的:
 * 1. 外部システムとの結合度を下げる
 * 2. テスト時のモック化を容易にする
 * 3. 将来的な依存関係の変更に対応
 * 4. エラーハンドリングを統一化
 */
const KnowledgeFileManagerInterface = {
    
    // =================================================================================
    // STATE MANAGEMENT - 状態管理インターフェース
    // =================================================================================
    
    /**
     * KnowledgeStateへの安全なアクセス
     */
    state: {
        // 現在のセッション取得
        getCurrentSession() {
            try {
                return window.KnowledgeState?.currentSession || null;
            } catch (error) {
                console.warn('⚠️ KnowledgeState.currentSession取得エラー:', error);
                return null;
            }
        },

        // 現在のセッション設定
        setCurrentSession(session) {
            try {
                if (!window.KnowledgeState) {
                    throw new Error('KnowledgeState が未初期化です');
                }
                window.KnowledgeState.currentSession = session;
                return true;
            } catch (error) {
                console.error('❌ KnowledgeState.currentSession設定エラー:', error);
                return false;
            }
        },

        // カテゴリ一覧取得
        getCategories() {
            try {
                return window.KnowledgeState?.categories || [];
            } catch (error) {
                console.warn('⚠️ KnowledgeState.categories取得エラー:', error);
                return [];
            }
        },

        // 初期化状態確認
        isInitialized() {
            try {
                return window.KnowledgeState?.isInitialized === true;
            } catch (error) {
                console.warn('⚠️ KnowledgeState初期化状態確認エラー:', error);
                return false;
            }
        },

        // 知見をセッションに追加
        addInsightToSession(insightEntry) {
            try {
                const session = this.getCurrentSession();
                if (!session) {
                    throw new Error('アクティブなセッションがありません');
                }
                
                if (!session.insights) {
                    session.insights = [];
                }
                
                session.insights.push(insightEntry);
                return true;
            } catch (error) {
                console.error('❌ セッションへの知見追加エラー:', error);
                return false;
            }
        }
    },

    // =================================================================================
    // API MANAGEMENT - API管理インターフェース
    // =================================================================================
    
    /**
     * APIキーへの安全なアクセス
     */
    api: {
        // APIキー取得
        getApiKey() {
            try {
                return window.AppState?.apiKey || null;
            } catch (error) {
                console.warn('⚠️ AppState.apiKey取得エラー:', error);
                return null;
            }
        },

        // APIキー有効性確認
        hasValidApiKey() {
            const apiKey = this.getApiKey();
            return apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0;
        }
    },

    // =================================================================================
    // UI MANAGEMENT - UI管理インターフェース
    // =================================================================================
    
    /**
     * UI操作への安全なアクセス
     */
    ui: {
        // メッセージ表示
        showMessage(type, message) {
            try {
                if (typeof window.showMessage === 'function') {
                    window.showMessage(type, message);
                } else {
                    // フォールバック: コンソール出力
                    console.log(`[${type.toUpperCase()}] ${message}`);
                }
            } catch (error) {
                console.error('❌ メッセージ表示エラー:', error);
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        },

        // プログレス表示（情報メッセージ）
        showProgress(message) {
            this.showMessage('info', message);
        },

        // 成功メッセージ表示
        showSuccess(message) {
            this.showMessage('success', message);
        },

        // エラーメッセージ表示
        showError(message) {
            this.showMessage('error', message);
        },

        // 警告メッセージ表示
        showWarning(message) {
            this.showMessage('warning', message);
        }
    },

    // =================================================================================
    // AI INTEGRATION - AI統合インターフェース
    // =================================================================================
    
    /**
     * AI機能への安全なアクセス
     */
    ai: {
        // KnowledgeDNAManagerの取得
        getDNAManager() {
            try {
                return window.KnowledgeDNAManager || null;
            } catch (error) {
                console.warn('⚠️ KnowledgeDNAManager取得エラー:', error);
                return null;
            }
        },

        // GPT応答関数の取得
        getGPTFunction() {
            try {
                return window.gptMessagesToCharacterResponse || null;
            } catch (error) {
                console.warn('⚠️ gptMessagesToCharacterResponse取得エラー:', error);
                return null;
            }
        },

        // 知見リライト処理
        async rewriteInsight(insightText, context) {
            try {
                const dnaManager = this.getDNAManager();
                if (!dnaManager || typeof dnaManager.rewriteInsightForClarity !== 'function') {
                    console.warn('⚠️ KnowledgeDNAManager.rewriteInsightForClarity が利用できません');
                    return {
                        enhanced: insightText,
                        summary: '情報不足のため整理をスキップしました',
                        categories: [],
                        keywords: []
                    };
                }

                return await dnaManager.rewriteInsightForClarity(insightText, context);
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

        // 関係性分析処理
        async analyzeRelationships(insights) {
            try {
                const dnaManager = this.getDNAManager();
                if (!dnaManager || typeof dnaManager.analyzeKnowledgeRelationships !== 'function') {
                    console.warn('⚠️ KnowledgeDNAManager.analyzeKnowledgeRelationships が利用できません');
                    return {
                        clusters: [],
                        relationships: [],
                        themes: []
                    };
                }

                return await dnaManager.analyzeKnowledgeRelationships(insights);
            } catch (error) {
                console.error('❌ 関係性分析エラー:', error);
                return {
                    clusters: [],
                    relationships: [],
                    themes: []
                };
            }
        }
    },

    // =================================================================================
    // FILE MANAGEMENT - ファイル管理インターフェース
    // =================================================================================
    
    /**
     * ファイル操作への安全なアクセス
     */
    file: {
        // ファイルダウンロード処理
        downloadFile(content, filename) {
            try {
                const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                return true;
            } catch (error) {
                console.error('❌ ファイルダウンロードエラー:', error);
                return false;
            }
        }
    },

    // =================================================================================
    // VALIDATION - 検証機能
    // =================================================================================
    
    /**
     * 依存関係の検証
     */
    validation: {
        // 全依存関係の確認
        validateAllDependencies() {
            const results = {
                state: !!window.KnowledgeState,
                api: !!window.AppState?.apiKey,
                ui: typeof window.showMessage === 'function',
                ai_dna: !!window.KnowledgeDNAManager,
                ai_gpt: typeof window.gptMessagesToCharacterResponse === 'function'
            };

            const missing = Object.entries(results)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            return {
                allValid: missing.length === 0,
                missing,
                details: results
            };
        },

        // 最小必要依存関係の確認
        validateMinimalDependencies() {
            const minimal = ['state', 'ui'];
            const validation = this.validateAllDependencies();
            
            const criticalMissing = validation.missing.filter(dep => minimal.includes(dep));
            
            return {
                valid: criticalMissing.length === 0,
                missing: criticalMissing,
                canOperate: criticalMissing.length === 0
            };
        }
    },

    // =================================================================================
    // INITIALIZATION - 初期化
    // =================================================================================
    
    /**
     * インターフェースの初期化
     */
    async initialize() {
        console.log('🔧 KnowledgeFileManagerInterface 初期化開始...');
        
        try {
            // 依存関係の検証
            const validation = this.validation.validateAllDependencies();
            
            if (validation.missing.length > 0) {
                console.warn('⚠️ 不足している依存関係:', validation.missing);
            }

            // 最小依存関係の確認
            const minimal = this.validation.validateMinimalDependencies();
            
            if (!minimal.valid) {
                throw new Error(`必須依存関係が不足: ${minimal.missing.join(', ')}`);
            }

            console.log('✅ KnowledgeFileManagerInterface 初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ KnowledgeFileManagerInterface 初期化エラー:', error);
            return false;
        }
    }
};

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

// インターフェースをグローバルに公開
window.KnowledgeFileManagerInterface = KnowledgeFileManagerInterface;

console.log('✅ KnowledgeFileManagerInterface 読み込み完了');
console.log('📝 使用方法:');
console.log('  - KnowledgeFileManagerInterface.initialize() // 初期化');
console.log('  - KnowledgeFileManagerInterface.validation.validateAllDependencies() // 依存関係確認');
console.log('  - KnowledgeFileManagerInterface.state.getCurrentSession() // セッション取得'); 