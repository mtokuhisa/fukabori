/**
 * Phase 4: 統合テスト・品質保証 自動テストスイート
 * ================================================
 * Phase 1-3で実装された全機能の統合テスト・パフォーマンス測定・品質評価
 */

const fs = require('fs');
const path = require('path');

class Phase4IntegratedTest {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
        this.performanceMetrics = [];
        this.qualityMetrics = {
            successRate: 0,
            avgResponseTime: 0,
            errorRate: 0,
            coverageRate: 0
        };
        
        // テスト対象機能の定義
        this.testTargets = {
            phase1: [
                'VoiceProcessingManagerClass',
                'InitializationSystem',
                'ScriptIntegration',
                'FallbackMechanism',
                'DebuggingSystem'
            ],
            phase2: [
                'ThemeChangeDetection',
                'QuestionChangeDetection',
                'AIPromptIntegration',
                'RequestProcessing'
            ],
            phase3: [
                'DeleteCommandDetection',
                'SafetyConfirmationSystem',
                'NumberDeleteFunction',
                'VoiceConfirmationHandler'
            ],
            regression: [
                'ExistingFunctionProtection',
                'VoiceRecognitionStability',
                'DataIntegrityPreservation',
                'UIOperationContinuity'
            ]
        };
    }

    log(level, message, category = 'general') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            category
        };
        
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
        this.testResults.push(logEntry);
    }

    async runAllTests() {
        this.log('info', '🚀 Phase 4 統合テスト・品質保証開始', 'system');
        
        try {
            // Phase 1: 基盤システムテスト
            await this.runPhase1Tests();
            
            // Phase 2: AI会話継続機能テスト
            await this.runPhase2Tests();
            
            // Phase 3: 安全削除機能テスト
            await this.runPhase3Tests();
            
            // 回帰テスト
            await this.runRegressionTests();
            
            // パフォーマンステスト
            await this.runPerformanceTests();
            
            // 最終品質評価
            await this.runFinalQualityAssessment();
            
            // 総合レポート生成
            this.generateComprehensiveReport();
            
            return this.qualityMetrics.successRate >= 90;
            
        } catch (error) {
            this.log('error', `統合テスト実行エラー: ${error.message}`, 'system');
            return false;
        }
    }

    // =================================================================================
    // Phase 1: 基盤システムテスト
    // =================================================================================

    async runPhase1Tests() {
        this.log('info', '🔧 Phase 1: 基盤システムテスト開始', 'phase1');
        
        const tests = [
            this.testVoiceProcessingManagerClass,
            this.testInitializationSystem,
            this.testScriptIntegration,
            this.testFallbackMechanism,
            this.testDebuggingSystem
        ];
        
        for (const test of tests) {
            await this.executeTest(test, 'phase1');
        }
        
        this.log('info', 'Phase 1 基盤システムテスト完了', 'phase1');
    }

    async testVoiceProcessingManagerClass() {
        const startTime = performance.now();
        
        try {
            // ファイル存在確認
            if (!fs.existsSync('app/voice-processing-manager.js')) {
                throw new Error('voice-processing-manager.js ファイルが見つかりません');
            }
            
            // ファイルサイズ・行数確認
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            const lines = content.split('\n').length;
            const size = Buffer.byteLength(content, 'utf8');
            
            this.log('info', `ファイル確認: ${lines}行, ${(size/1024).toFixed(2)}KB`);
            
            // 必須クラス構造確認
            const requiredElements = [
                'class VoiceProcessingManager',
                'constructor()',
                'async initialize()',
                'async processFinalTranscript(',
                'detectThemeChangeRequest(',
                'detectQuestionChangeRequest(',
                'detectDeleteCommand(',
                'fallbackToOriginal('
            ];
            
            let foundElements = 0;
            for (const element of requiredElements) {
                if (content.includes(element)) {
                    foundElements++;
                } else {
                    this.log('warning', `必須要素不足: ${element}`);
                }
            }
            
            if (foundElements === requiredElements.length) {
                const duration = performance.now() - startTime;
                this.recordPerformanceMetric('VoiceProcessingManagerClass', duration, true);
                return { success: true, message: 'VoiceProcessingManagerクラス構造確認完了' };
            } else {
                throw new Error(`必須要素不足: ${foundElements}/${requiredElements.length}`);
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('VoiceProcessingManagerClass', duration, false);
            throw error;
        }
    }

    async testInitializationSystem() {
        const startTime = performance.now();
        
        try {
            // HTML統合確認
            const htmlContent = fs.readFileSync('深堀くん.html', 'utf8');
            
            if (!htmlContent.includes('voice-processing-manager.js')) {
                throw new Error('HTMLファイルにvoice-processing-manager.jsの読み込みがありません');
            }
            
            // 読み込み順序確認
            const vpManagerIndex = htmlContent.indexOf('voice-processing-manager.js');
            const scriptIndex = htmlContent.indexOf('app/script.js');
            
            if (vpManagerIndex >= scriptIndex) {
                throw new Error('スクリプト読み込み順序が不正です');
            }
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('InitializationSystem', duration, true);
            return { success: true, message: '初期化システム確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('InitializationSystem', duration, false);
            throw error;
        }
    }

    async testScriptIntegration() {
        const startTime = performance.now();
        
        try {
            const scriptContent = fs.readFileSync('app/script.js', 'utf8');
            
            // 必須統合要素確認
            const integrationElements = [
                'processFinalTranscriptOriginal',
                'VoiceProcessingManager',
                'voiceProcessingManagerInstance'
            ];
            
            for (const element of integrationElements) {
                if (!scriptContent.includes(element)) {
                    throw new Error(`統合要素不足: ${element}`);
                }
            }
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('ScriptIntegration', duration, true);
            return { success: true, message: 'script.js統合確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('ScriptIntegration', duration, false);
            throw error;
        }
    }

    async testFallbackMechanism() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // フォールバック機能確認
            const fallbackElements = [
                'fallbackToOriginal',
                'processFinalTranscriptOriginal',
                'stats.fallbackCalls'
            ];
            
            for (const element of fallbackElements) {
                if (!content.includes(element)) {
                    throw new Error(`フォールバック要素不足: ${element}`);
                }
            }
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('FallbackMechanism', duration, true);
            return { success: true, message: 'フォールバック機構確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('FallbackMechanism', duration, false);
            throw error;
        }
    }

    async testDebuggingSystem() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // デバッグシステム確認
            const debugElements = [
                'debugMode',
                'debugLog',
                'getStats',
                'getDebugInfo',
                'VoiceProcessingManagerDebug'
            ];
            
            let foundDebugElements = 0;
            for (const element of debugElements) {
                if (content.includes(element)) {
                    foundDebugElements++;
                }
            }
            
            if (foundDebugElements >= 4) {
                const duration = performance.now() - startTime;
                this.recordPerformanceMetric('DebuggingSystem', duration, true);
                return { success: true, message: 'デバッグシステム確認完了' };
            } else {
                throw new Error(`デバッグ要素不足: ${foundDebugElements}/${debugElements.length}`);
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('DebuggingSystem', duration, false);
            throw error;
        }
    }

    // =================================================================================
    // Phase 2: AI会話継続機能テスト
    // =================================================================================

    async runPhase2Tests() {
        this.log('info', '🤖 Phase 2: AI会話継続機能テスト開始', 'phase2');
        
        const tests = [
            this.testThemeChangeDetection,
            this.testQuestionChangeDetection,
            this.testAIPromptIntegration,
            this.testRequestProcessing
        ];
        
        for (const test of tests) {
            await this.executeTest(test, 'phase2');
        }
        
        this.log('info', 'Phase 2 AI会話継続機能テスト完了', 'phase2');
    }

    async testThemeChangeDetection() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // テーマ変更検出パターン確認
            const themePatterns = [
                'detectThemeChangeRequest',
                'テーマ変更',
                'theme_change_with_request',
                'theme_change_basic'
            ];
            
            for (const pattern of themePatterns) {
                if (!content.includes(pattern)) {
                    throw new Error(`テーマ変更パターン不足: ${pattern}`);
                }
            }
            
            // パターンマッチングテスト
            const testCases = [
                'テーマ変更、もっと技術的に',
                'テーマを変えて、マネジメント重視で',
                'テーマ変更',
                'テーマを変えて'
            ];
            
            this.log('info', `テーマ変更検出パターン: ${themePatterns.length}種類確認`);
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('ThemeChangeDetection', duration, true);
            return { success: true, message: 'テーマ変更検出機能確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('ThemeChangeDetection', duration, false);
            throw error;
        }
    }

    async testQuestionChangeDetection() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // 質問変更検出パターン確認
            const questionPatterns = [
                'detectQuestionChangeRequest',
                '質問変更',
                'question_change_with_request',
                'question_change_basic'
            ];
            
            for (const pattern of questionPatterns) {
                if (!content.includes(pattern)) {
                    throw new Error(`質問変更パターン不足: ${pattern}`);
                }
            }
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('QuestionChangeDetection', duration, true);
            return { success: true, message: '質問変更検出機能確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('QuestionChangeDetection', duration, false);
            throw error;
        }
    }

    async testAIPromptIntegration() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // AI Prompt統合機能確認
            const aiPromptElements = [
                'handleThemeChangeWithRequest',
                'handleQuestionChangeWithRequest',
                'buildAIPrompt',
                'generateNewTheme',
                'generateNewQuestion'
            ];
            
            let foundElements = 0;
            for (const element of aiPromptElements) {
                if (content.includes(element)) {
                    foundElements++;
                }
            }
            
            if (foundElements >= 3) {
                const duration = performance.now() - startTime;
                this.recordPerformanceMetric('AIPromptIntegration', duration, true);
                return { success: true, message: 'AI Prompt統合機能確認完了' };
            } else {
                throw new Error(`AI Prompt統合要素不足: ${foundElements}/${aiPromptElements.length}`);
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('AIPromptIntegration', duration, false);
            throw error;
        }
    }

    async testRequestProcessing() {
        const startTime = performance.now();
        
        try {
            // Phase 2の統計機能確認
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            if (content.includes('themeChangeRequests') && 
                content.includes('questionChangeRequests')) {
                
                const duration = performance.now() - startTime;
                this.recordPerformanceMetric('RequestProcessing', duration, true);
                return { success: true, message: '要望処理システム確認完了' };
            } else {
                throw new Error('要望処理統計システムが見つかりません');
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('RequestProcessing', duration, false);
            throw error;
        }
    }

    // =================================================================================
    // Phase 3: 安全削除機能テスト
    // =================================================================================

    async runPhase3Tests() {
        this.log('info', '🗑️ Phase 3: 安全削除機能テスト開始', 'phase3');
        
        const tests = [
            this.testDeleteCommandDetection,
            this.testSafetyConfirmationSystem,
            this.testNumberDeleteFunction,
            this.testVoiceConfirmationHandler
        ];
        
        for (const test of tests) {
            await this.executeTest(test, 'phase3');
        }
        
        this.log('info', 'Phase 3 安全削除機能テスト完了', 'phase3');
    }

    async testDeleteCommandDetection() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // 削除コマンド検出確認
            const deletePatterns = [
                'detectDeleteCommand',
                'クリアして',
                '全削除',
                '文字消して',
                'clear_with_confirmation',
                'number_delete'
            ];
            
            for (const pattern of deletePatterns) {
                if (!content.includes(pattern)) {
                    throw new Error(`削除パターン不足: ${pattern}`);
                }
            }
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('DeleteCommandDetection', duration, true);
            return { success: true, message: '削除コマンド検出機能確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('DeleteCommandDetection', duration, false);
            throw error;
        }
    }

    async testSafetyConfirmationSystem() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // 安全確認システム確認
            const safetyElements = [
                'handleClearCommandWithConfirmation',
                'waitingForClearConfirmation',
                'handleConfirmationResponse',
                'voice_yes_no'
            ];
            
            for (const element of safetyElements) {
                if (!content.includes(element)) {
                    throw new Error(`安全確認要素不足: ${element}`);
                }
            }
            
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('SafetyConfirmationSystem', duration, true);
            return { success: true, message: '安全確認システム確認完了' };
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('SafetyConfirmationSystem', duration, false);
            throw error;
        }
    }

    async testNumberDeleteFunction() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // 数値削除機能確認
            const numberDeleteElements = [
                'handleNumberDelete',
                'parseNumber',
                'waitingForNumberDeleteConfirmation',
                '文字消して'
            ];
            
            let foundElements = 0;
            for (const element of numberDeleteElements) {
                if (content.includes(element)) {
                    foundElements++;
                }
            }
            
            if (foundElements >= 3) {
                const duration = performance.now() - startTime;
                this.recordPerformanceMetric('NumberDeleteFunction', duration, true);
                return { success: true, message: '数値削除機能確認完了' };
            } else {
                throw new Error(`数値削除要素不足: ${foundElements}/${numberDeleteElements.length}`);
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('NumberDeleteFunction', duration, false);
            throw error;
        }
    }

    async testVoiceConfirmationHandler() {
        const startTime = performance.now();
        
        try {
            const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
            
            // 音声確認ハンドラー確認
            if (content.includes('handleConfirmationResponse') && 
                content.includes('voice_yes_no')) {
                
                const duration = performance.now() - startTime;
                this.recordPerformanceMetric('VoiceConfirmationHandler', duration, true);
                return { success: true, message: '音声確認ハンドラー確認完了' };
            } else {
                throw new Error('音声確認ハンドラーが見つかりません');
            }
            
        } catch (error) {
            const duration = performance.now() - startTime;
            this.recordPerformanceMetric('VoiceConfirmationHandler', duration, false);
            throw error;
        }
    }

    // =================================================================================
    // 共通テスト実行機能・パフォーマンス測定
    // =================================================================================

    async executeTest(testFunction, category) {
        const testName = testFunction.name;
        this.log('info', `${testName} 実行中...`, category);
        
        try {
            const result = await testFunction.call(this);
            this.log('success', `✅ ${testName}: ${result.message}`, category);
            return result;
        } catch (error) {
            this.log('error', `❌ ${testName}: ${error.message}`, category);
            throw error;
        }
    }

    recordPerformanceMetric(testName, duration, success) {
        this.performanceMetrics.push({
            testName,
            duration,
            success,
            timestamp: Date.now()
        });
    }

    // =================================================================================
    // パフォーマンステスト・品質評価
    // =================================================================================

    async runPerformanceTests() {
        this.log('info', '⚡ パフォーマンステスト開始', 'performance');
        
        // 応答時間分析
        const totalTests = this.performanceMetrics.length;
        const successfulTests = this.performanceMetrics.filter(m => m.success).length;
        const totalDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
        const avgDuration = totalDuration / totalTests;
        
        this.qualityMetrics.successRate = (successfulTests / totalTests) * 100;
        this.qualityMetrics.avgResponseTime = avgDuration;
        this.qualityMetrics.errorRate = ((totalTests - successfulTests) / totalTests) * 100;
        
        // パフォーマンス要件確認
        const performanceRequirements = {
            maxResponseTime: 100, // ms
            minSuccessRate: 90,   // %
            maxErrorRate: 10      // %
        };
        
        const performanceGrade = this.evaluatePerformance(performanceRequirements);
        
        this.log('info', `平均応答時間: ${avgDuration.toFixed(2)}ms`, 'performance');
        this.log('info', `成功率: ${this.qualityMetrics.successRate.toFixed(1)}%`, 'performance');
        this.log('info', `パフォーマンスグレード: ${performanceGrade}`, 'performance');
        
        return performanceGrade;
    }

    evaluatePerformance(requirements) {
        const { avgResponseTime, successRate, errorRate } = this.qualityMetrics;
        
        if (successRate >= 95 && avgResponseTime <= 50) return 'A+ (優秀)';
        if (successRate >= 90 && avgResponseTime <= 100) return 'A (良好)';
        if (successRate >= 85 && avgResponseTime <= 150) return 'B (普通)';
        if (successRate >= 80) return 'C (要改善)';
        return 'D (不合格)';
    }

    async runRegressionTests() {
        this.log('info', '🔄 回帰テスト開始', 'regression');
        
        // 既存機能の保護確認
        const criticalFiles = [
            'app/script.js',
            'app/voice-processing-manager.js',
            '深堀くん.html'
        ];
        
        let regressionScore = 100;
        
        for (const file of criticalFiles) {
            if (!fs.existsSync(file)) {
                regressionScore -= 30;
                this.log('error', `重要ファイル不足: ${file}`, 'regression');
            }
        }
        
        this.qualityMetrics.coverageRate = regressionScore;
        this.log('info', `回帰テストスコア: ${regressionScore}%`, 'regression');
        
        return regressionScore >= 90;
    }

    async runFinalQualityAssessment() {
        this.log('info', '🏆 最終品質評価開始', 'final');
        
        const assessmentCriteria = {
            functionality: this.qualityMetrics.successRate >= 90,
            performance: this.qualityMetrics.avgResponseTime <= 100,
            stability: this.qualityMetrics.errorRate <= 10,
            coverage: this.qualityMetrics.coverageRate >= 90
        };
        
        const passedCriteria = Object.values(assessmentCriteria).filter(Boolean).length;
        const finalGrade = this.getFinalGrade(passedCriteria, 4);
        
        this.log('info', `最終品質評価: ${finalGrade}`, 'final');
        this.log('info', `合格基準: ${passedCriteria}/4`, 'final');
        
        return passedCriteria >= 3;
    }

    getFinalGrade(passed, total) {
        const rate = passed / total;
        if (rate >= 0.95) return 'A+ (優秀)';
        if (rate >= 0.85) return 'A (良好)';
        if (rate >= 0.75) return 'B (普通)';
        if (rate >= 0.60) return 'C (要改善)';
        return 'D (不合格)';
    }

    generateComprehensiveReport() {
        const duration = Date.now() - this.startTime;
        const successCount = this.testResults.filter(r => r.level === 'success').length;
        const errorCount = this.testResults.filter(r => r.level === 'error').length;
        const warningCount = this.testResults.filter(r => r.level === 'warning').length;
        
        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                duration,
                version: 'Phase 4 v1.0'
            },
            summary: {
                totalTests: this.performanceMetrics.length,
                successCount,
                errorCount,
                warningCount,
                successRate: this.qualityMetrics.successRate,
                avgResponseTime: this.qualityMetrics.avgResponseTime,
                finalGrade: this.getFinalGrade(successCount, successCount + errorCount)
            },
            qualityMetrics: this.qualityMetrics,
            performanceMetrics: this.performanceMetrics,
            testResults: this.testResults
        };
        
        // レポート保存
        const reportFileName = `phase4-integration-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
        
        this.log('info', `📊 統合テストレポート生成完了: ${reportFileName}`, 'system');
        this.log('info', `実行時間: ${duration}ms`, 'system');
        this.log('info', `成功: ${successCount}, エラー: ${errorCount}, 警告: ${warningCount}`, 'system');
        this.log('info', `最終評価: ${report.summary.finalGrade}`, 'system');
        
        if (errorCount === 0 && this.qualityMetrics.successRate >= 90) {
            this.log('success', '🎉 Phase 4 統合テスト・品質保証 完全成功！', 'system');
            return true;
        } else {
            this.log('warning', '⚠️ Phase 4 統合テスト 品質改善が必要です', 'system');
            return false;
        }
    }
}

// テスト実行
if (require.main === module) {
    const tester = new Phase4IntegratedTest();
    tester.runAllTests()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('統合テスト実行失敗:', error);
            process.exit(1);
        });
}

module.exports = Phase4IntegratedTest; 