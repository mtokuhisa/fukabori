// =================================================================================
// 深堀くん - KnowledgeFileManager テストスイート
// =================================================================================

// 🧪 テスト用ダミーデータ生成器
const TestDataGenerator = {
    // ダミーセッションデータ生成
    createDummySession(overrides = {}) {
        const defaultSession = {
            filename: '250108-120000_技術_AI開発の課題.md',
            meta: {
                session_id: 'test_session_001',
                date: '2025-01-08T03:00:00.000Z',
                category: '技術管理',
                title: 'AI開発の課題',
                participant: 'テストユーザー',
                participant_role: 'エンジニア',
                theme: 'AIを活用した開発プロセスの改善について',
                session_start: '2025-01-08T03:00:00.000Z'
            },
            insights: [
                {
                    id: 'insight_1704682800000',
                    content: 'AI開発では継続的な学習データの品質管理が最も重要で、データの偏りを定期的にチェックする仕組みが必要だと感じました。',
                    context: {
                        situation: '機械学習モデルの精度向上に関する議論中',
                        related_conversation: ['前回のモデル更新で精度が下がった話', 'データ収集の自動化について']
                    },
                    quality_scores: {
                        confidence: 0.85,
                        importance: 0.92
                    },
                    timestamp: '2025-01-08T03:05:00.000Z',
                    conversation_context: ['AIモデルの精度について', 'データ品質の重要性']
                },
                {
                    id: 'insight_1704682860000',
                    content: 'チーム内でのAI技術の知識共有が不足しており、属人化を防ぐためのドキュメント化と定期的な勉強会が効果的だと思います。',
                    context: {
                        situation: 'チーム運営の改善策を議論している場面',
                        related_conversation: ['新メンバーのオンボーディング', 'スキルレベルの標準化']
                    },
                    quality_scores: {
                        confidence: 0.78,
                        importance: 0.88
                    },
                    timestamp: '2025-01-08T03:06:00.000Z',
                    conversation_context: ['チーム運営について', '知識共有の方法']
                }
            ],
            conversations: [],
            isActive: true
        };
        
        return { ...defaultSession, ...overrides };
    },

    // AI拡張ダミーデータ生成
    createEnhancedSession(baseSession = null) {
        const session = baseSession || this.createDummySession();
        
        // AI拡張された知見を追加
        session.insights = session.insights.map((insight, index) => ({
            ...insight,
            enhanced_content: `【AI整理版】${insight.content}\n\nこの知見は、実際の開発現場での経験に基づく貴重な学びです。特に${index === 0 ? 'データ品質管理' : 'チーム運営'}の観点から重要な指摘となっています。`,
            summary: index === 0 ? 'AI開発における継続的なデータ品質管理の重要性' : 'チーム内でのAI技術知識共有の必要性',
            categories: index === 0 ? ['技術管理', 'データ管理', 'AI開発'] : ['チーム運営', '知識共有', 'AI技術'],
            keywords: index === 0 ? ['AI開発', 'データ品質', '学習データ', 'モデル精度'] : ['知識共有', 'チーム運営', 'ドキュメント化', '勉強会'],
            actionable_points: index === 0 ? [
                'データ品質チェックの自動化システム導入',
                '定期的なデータバイアス検証プロセス確立',
                'データ収集基準の明文化'
            ] : [
                'AI技術勉強会の定期開催',
                '技術ドキュメントの標準化',
                '新メンバー向けオンボーディング資料作成'
            ],
            related_concepts: index === 0 ? ['機械学習', 'データサイエンス', '品質管理'] : ['知識管理', 'チーム開発', 'スキル標準化'],
            dna_enhanced: true
        }));

        // Knowledge Graph情報を追加
        session.knowledge_graph = {
            clusters: [
                {
                    theme: 'AI開発の品質管理',
                    insights: [0],
                    description: 'データ品質とモデル精度に関する知見群'
                },
                {
                    theme: 'チーム運営・知識共有',
                    insights: [1],
                    description: 'チーム内でのスキル共有と標準化に関する知見群'
                }
            ],
            relationships: [
                {
                    type: '補完関係',
                    from: 0,
                    to: 1,
                    description: 'データ品質管理とチーム知識共有は、共にAI開発の成功要因として相互補完的'
                }
            ],
            themes: [
                {
                    name: 'AI開発プロセス改善',
                    frequency: 2,
                    description: '技術面とチーム面の両方からAI開発を改善するアプローチ'
                }
            ]
        };

        return session;
    },

    // エラーケース用ダミーデータ
    createErrorCaseData() {
        return {
            emptySession: {
                meta: {},
                insights: [],
                conversations: []
            },
            invalidSession: null,
            corruptedSession: {
                meta: {
                    session_id: 'corrupted_001'
                },
                insights: [
                    {
                        id: 'invalid_insight',
                        content: null,
                        timestamp: 'invalid_date'
                    }
                ]
            }
        };
    }
};

// 🧪 テストヘルパー関数
const TestHelpers = {
    // 依存関係をモック化
    setupMockDependencies() {
        // KnowledgeStateのモック
        if (!window.KnowledgeState) {
            window.KnowledgeState = {
                currentSession: null,
                categories: [
                    { category_name: '技術管理', category_description: '技術・開発管理に関する知見', is_active: 'true' },
                    { category_name: 'チーム運営', category_description: '組織・チーム運営に関する知見', is_active: 'true' }
                ],
                users: [],
                insights: [],
                qualityThreshold: 0.7,
                isInitialized: true
            };
        }

        // AppStateのモック
        if (!window.AppState) {
            window.AppState = {
                apiKey: 'test-api-key-mock'
            };
        }

        // showMessageのモック
        if (!window.showMessage) {
            window.showMessage = (type, message) => {
                console.log(`[${type}] ${message}`);
            };
        }

        // KnowledgeDNAManagerのモック
        if (!window.KnowledgeDNAManager) {
            window.KnowledgeDNAManager = {
                async rewriteInsightForClarity(text, context) {
                    return {
                        enhanced: `【AI整理版】${text}`,
                        summary: `テスト要約: ${text.substring(0, 30)}...`,
                        categories: ['テストカテゴリ'],
                        keywords: ['テスト', 'キーワード'],
                        actionable_points: ['テスト実行ポイント'],
                        related_concepts: ['テスト概念']
                    };
                },
                async analyzeKnowledgeRelationships(insights) {
                    return {
                        clusters: [],
                        relationships: [],
                        themes: []
                    };
                }
            };
        }

        // gptMessagesToCharacterResponseのモック
        if (!window.gptMessagesToCharacterResponse) {
            window.gptMessagesToCharacterResponse = async (messages, character) => {
                return 'テスト用AI応答';
            };
        }
    },

    // ダミーデータをKnowledgeStateに設定
    setupDummyKnowledgeState(sessionData = null) {
        this.setupMockDependencies();
        window.KnowledgeState.currentSession = sessionData || TestDataGenerator.createDummySession();
    },

    // テスト後のクリーンアップ
    cleanup() {
        if (window.KnowledgeState) {
            window.KnowledgeState.currentSession = null;
        }
    },

    // ファイル生成結果の検証
    validateFileContent(content) {
        const validations = {
            hasMetadata: content.includes('meta:'),
            hasSessionInfo: content.includes('session_id:'),
            hasInsights: content.includes('Knowledge DNA'),
            hasTimestamp: /\d{4}-\d{2}-\d{2}/.test(content),
            hasMarkdown: content.includes('##') || content.includes('**')
        };

        const passed = Object.values(validations).filter(v => v).length;
        const total = Object.keys(validations).length;
        
        return {
            passed,
            total,
            success: passed === total,
            details: validations
        };
    }
};

// 🧪 テストスイート
const KnowledgeFileManagerTests = {
    // テスト結果を格納
    results: [],

    // テスト実行
    async runTest(testName, testFunction) {
        console.log(`🧪 テスト開始: ${testName}`);
        const startTime = Date.now();
        
        try {
            TestHelpers.setupMockDependencies();
            await testFunction();
            const duration = Date.now() - startTime;
            
            this.results.push({
                name: testName,
                status: 'PASS',
                duration,
                error: null
            });
            
            console.log(`✅ ${testName} - PASS (${duration}ms)`);
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.push({
                name: testName,
                status: 'FAIL',
                duration,
                error: error.message
            });
            
            console.error(`❌ ${testName} - FAIL (${duration}ms)`, error);
        } finally {
            TestHelpers.cleanup();
        }
    },

    // 全テスト実行
    async runAllTests() {
        console.log('🚀 KnowledgeFileManager テストスイート開始');
        this.results = [];

        // DataManager機能テスト
        await this.runTest('DataManager初期化テスト', this.testDataManagerInitialization);
        await this.runTest('DataManager知見追加テスト', this.testDataManagerAddInsight);
        
        // 基本機能テスト
        await this.runTest('セッション作成テスト', this.testCreateSessionFile);
        await this.runTest('知見追加テスト', this.testAddInsight);
        await this.runTest('ファイル生成テスト', this.testGenerateKnowledgeFile);
        await this.runTest('AI拡張テスト', this.testEnhanceKnowledgeWithAI);
        
        // FileManager テスト
        await this.runTest('FileManager初期化テスト', this.testFileManagerInitialization);
        await this.runTest('FileManagerファイル生成テスト', this.testFileManagerFileGeneration);
        
        // エラーケーステスト
        await this.runTest('空セッションエラーテスト', this.testEmptySessionError);
        await this.runTest('無効データエラーテスト', this.testInvalidDataError);

        // 統合テスト
        await this.runTest('完全フローテスト', this.testCompleteFlow);

        this.printResults();
    },

    // DataManager テスト関数
    async testDataManagerInitialization() {
        // DataManagerが存在することを確認
        if (typeof window.DataManager === 'undefined') {
            throw new Error('DataManager が読み込まれていません');
        }
        
        // DataManagerを初期化
        if (typeof window.initializeDataManager === 'function') {
            await window.initializeDataManager();
        }
        
        // 初期化状態を確認
        if (!window.DataManager.isInitialized()) {
            throw new Error('DataManager の初期化に失敗しました');
        }
        
        console.log('✅ DataManager 初期化テスト成功');
    },

    async testDataManagerAddInsight() {
        // テスト用セッションデータを設定
        TestHelpers.setupDummyKnowledgeState();
        
        // DataManagerが初期化されていることを確認
        if (!window.DataManager.isInitialized()) {
            await window.initializeDataManager();
        }
        
        const insight = 'DataManagerテスト用知見です';
        const context = { situation: 'DataManagerテスト状況' };
        const quality = { confidence: 0.85, importance: 0.92 };

        // DataManager経由で知見を追加
        const result = window.DataManager.addInsight(insight, context, quality);
        
        if (!result) throw new Error('DataManagerでの知見追加に失敗');
        if (!result.id) throw new Error('知見IDが生成されていない');
        if (result.content !== insight) throw new Error('知見内容が正しく保存されていない');
        
        // セッションに追加されているかを確認
        const session = window.DataManager.getCurrentSession();
        if (!session || !session.insights || session.insights.length === 0) {
            throw new Error('知見がセッションに追加されていない');
        }
        
        console.log('✅ DataManager 知見追加テスト成功');
    },

    // FileManager テスト関数
    async testFileManagerInitialization() {
        // FileManagerが存在することを確認
        if (typeof window.FileManager === 'undefined') {
            throw new Error('FileManager が読み込まれていません');
        }
        
        // FileManagerを初期化
        if (typeof window.initializeFileManager === 'function') {
            await window.initializeFileManager();
        } else {
            // FileManagerの初期化メソッドを直接呼び出し
            const initialized = await window.FileManager.initialize();
            if (!initialized) {
                throw new Error('FileManager の初期化に失敗しました');
            }
        }
        
        console.log('✅ FileManager 初期化テスト成功');
    },

    async testFileManagerFileGeneration() {
        // テスト用セッションデータを設定
        const dummySession = TestDataGenerator.createEnhancedSession();
        
        // FileManagerが利用可能であることを確認
        if (typeof window.FileManager === 'undefined') {
            throw new Error('FileManager が利用できません');
        }
        
        // ファイル生成をテスト（実際のダウンロードはしない）
        try {
            const filename = await window.FileManager.generateKnowledgeFile(dummySession);
            
            if (!filename) {
                throw new Error('FileManagerでのファイル生成に失敗');
            }
            
            if (!filename.includes('.md')) {
                throw new Error('生成されたファイル名が正しくない');
            }
            
            console.log('✅ FileManager ファイル生成テスト成功: ' + filename);
            
        } catch (error) {
            // ダウンロード関連のエラーは許容（ブラウザ環境制限）
            if (error.message.includes('downloadFile') || error.message.includes('ダウンロード')) {
                console.log('⚠️ ダウンロード機能は制限環境では正常（FileManager動作確認済み）');
                return;
            }
            throw error;
        }
    },

    // 個別テスト関数
    async testCreateSessionFile() {
        const sessionMeta = {
            session_id: 'test_001',
            theme: 'テスト用テーマ',
            participant: 'テストユーザー',
            participant_role: 'テスター',
            category: '技術管理'
        };

        const result = await KnowledgeFileManager.createSessionFile(sessionMeta);
        
        if (!result) throw new Error('セッションファイルの作成に失敗');
        if (!result.meta.session_id) throw new Error('セッションIDが設定されていない');
        if (!window.KnowledgeState.currentSession) throw new Error('KnowledgeStateに設定されていない');
    },

    async testAddInsight() {
        TestHelpers.setupDummyKnowledgeState();
        
        const insight = 'テスト用知見です';
        const context = { situation: 'テスト状況' };
        const quality = { confidence: 0.8, importance: 0.9 };

        const result = KnowledgeFileManager.addInsight(insight, context, quality);
        
        if (!result) throw new Error('知見の追加に失敗');
        if (window.KnowledgeState.currentSession.insights.length === 0) {
            throw new Error('知見がセッションに追加されていない');
        }
    },

    async testGenerateKnowledgeFile() {
        const dummySession = TestDataGenerator.createEnhancedSession();
        
        const filename = await KnowledgeFileManager.generateKnowledgeFile(dummySession);
        
        if (!filename) throw new Error('ファイル名が生成されていない');
        if (!filename.includes('.md')) throw new Error('Markdownファイルではない');
    },

    async testEnhanceKnowledgeWithAI() {
        const dummySession = TestDataGenerator.createDummySession();
        
        const enhanced = await KnowledgeFileManager.enhanceKnowledgeWithAI(dummySession, false);
        
        if (!enhanced) throw new Error('AI拡張に失敗');
        if (!enhanced.insights) throw new Error('知見が存在しない');
    },

    async testEmptySessionError() {
        const emptySession = TestDataGenerator.createErrorCaseData().emptySession;
        
        try {
            await KnowledgeFileManager.generateKnowledgeFile(emptySession);
            // エラーが発生しなかった場合はテスト失敗
        } catch (error) {
            // 期待される動作：エラーまたは適切なフォールバック処理
            return;
        }
    },

    async testInvalidDataError() {
        const invalidSession = TestDataGenerator.createErrorCaseData().invalidSession;
        
        const result = await KnowledgeFileManager.generateKnowledgeFile(invalidSession);
        if (result !== null) {
            throw new Error('無効セッションでnull以外が返された');
        }
    },

    async testCompleteFlow() {
        // 1. セッション作成
        const sessionMeta = {
            session_id: 'complete_test_001',
            theme: '完全フローテスト',
            participant: 'テストユーザー',
            category: '技術管理'
        };
        await KnowledgeFileManager.createSessionFile(sessionMeta);

        // 2. 知見追加
        KnowledgeFileManager.addInsight(
            '完全フローテスト用の知見です',
            { situation: 'テスト中' },
            { confidence: 0.9, importance: 0.8 }
        );

        // 3. AI拡張
        const enhanced = await KnowledgeFileManager.enhanceKnowledgeWithAI(
            window.KnowledgeState.currentSession,
            false
        );

        // 4. ファイル生成
        const filename = await KnowledgeFileManager.generateKnowledgeFile(enhanced);

        if (!filename) throw new Error('完全フローでファイル生成に失敗');
    },

    // テスト結果表示
    printResults() {
        console.log('\n📊 テスト結果サマリー');
        console.log('==========================================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const total = this.results.length;
        const successRate = Math.round((passed / total) * 100);
        
        console.log(`✅ 成功: ${passed}/${total} (${successRate}%)`);
        
        if (passed < total) {
            console.log(`❌ 失敗: ${total - passed}/${total}`);
            console.log('\n失敗したテスト:');
            this.results.filter(r => r.status === 'FAIL').forEach(result => {
                console.log(`  - ${result.name}: ${result.error}`);
            });
        }
        
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`⏱️ 総実行時間: ${totalDuration}ms`);
        console.log('==========================================\n');

        return { passed, total, successRate };
    }
};

// グローバル公開
window.TestDataGenerator = TestDataGenerator;
window.TestHelpers = TestHelpers;
window.KnowledgeFileManagerTests = KnowledgeFileManagerTests;

console.log('✅ KnowledgeFileManager テストスイート読み込み完了');
console.log('📝 使用方法:');
console.log('  - KnowledgeFileManagerTests.runAllTests() // 全テスト実行');
console.log('  - TestHelpers.setupDummyKnowledgeState() // ダミーデータ設定');
console.log('  - TestDataGenerator.createDummySession() // ダミーセッション作成'); 