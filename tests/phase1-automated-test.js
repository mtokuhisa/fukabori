/**
 * Phase 1: VoiceProcessingManager 自動テストスイート
 * ================================================
 * Node.js環境での自動テスト（シミュレーション）
 */

const fs = require('fs');
const path = require('path');

class Phase1AutomatedTest {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        console.log(logEntry);
        this.testResults.push({ timestamp, level, message });
    }

    async runAllTests() {
        this.log('info', '🚀 Phase 1 自動テスト開始');
        
        try {
            // Test 1: ファイル存在確認
            await this.testFileExistence();
            
            // Test 2: HTMLファイル統合確認
            await this.testHTMLIntegration();
            
            // Test 3: JavaScript構文チェック
            await this.testJavaScriptSyntax();
            
            // Test 4: VoiceProcessingManagerクラス構造確認
            await this.testClassStructure();
            
            // Test 5: script.js統合確認
            await this.testScriptIntegration();
            
            this.generateTestReport();
            
        } catch (error) {
            this.log('error', `テスト実行エラー: ${error.message}`);
        }
    }

    async testFileExistence() {
        this.log('info', '📁 Test 1: ファイル存在確認');
        
        const requiredFiles = [
            'app/voice-processing-manager.js',
            'app/script.js',
            '深堀くん.html'
        ];
        
        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                this.log('success', `✅ ${file} 存在確認`);
            } else {
                this.log('error', `❌ ${file} が見つかりません`);
                throw new Error(`必須ファイル ${file} が存在しません`);
            }
        }
    }

    async testHTMLIntegration() {
        this.log('info', '🔗 Test 2: HTMLファイル統合確認');
        
        const htmlContent = fs.readFileSync('深堀くん.html', 'utf8');
        
        // VoiceProcessingManagerの読み込み確認
        if (htmlContent.includes('voice-processing-manager.js')) {
            this.log('success', '✅ voice-processing-manager.js の読み込み確認');
        } else {
            this.log('error', '❌ voice-processing-manager.js の読み込みが見つかりません');
        }
        
        // script.jsの読み込み確認
        if (htmlContent.includes('app/script.js')) {
            this.log('success', '✅ script.js の読み込み確認');
        } else {
            this.log('error', '❌ script.js の読み込みが見つかりません');
        }
        
        // 読み込み順序確認（voice-processing-manager.js が script.js より前）
        const vpManagerIndex = htmlContent.indexOf('voice-processing-manager.js');
        const scriptIndex = htmlContent.indexOf('app/script.js');
        
        if (vpManagerIndex < scriptIndex && vpManagerIndex !== -1) {
            this.log('success', '✅ スクリプト読み込み順序が正しい');
        } else {
            this.log('warning', '⚠️ スクリプト読み込み順序を確認してください');
        }
    }

    async testJavaScriptSyntax() {
        this.log('info', '🔍 Test 3: JavaScript構文チェック');
        
        const files = [
            'app/voice-processing-manager.js',
            'app/script.js'
        ];
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // 基本的な構文チェック
                if (this.checkBasicSyntax(content)) {
                    this.log('success', `✅ ${file} 基本構文OK`);
                } else {
                    this.log('warning', `⚠️ ${file} 構文に注意が必要な箇所があります`);
                }
                
            } catch (error) {
                this.log('error', `❌ ${file} 読み込みエラー: ${error.message}`);
            }
        }
    }

    checkBasicSyntax(content) {
        // 基本的な構文チェック
        const issues = [];
        
        // 括弧の対応確認
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            issues.push('括弧の対応に問題があります');
        }
        
        // async/await構文確認
        const asyncFunctions = content.match(/async\s+function/g);
        if (asyncFunctions && asyncFunctions.length > 0) {
            this.log('info', `async関数 ${asyncFunctions.length}個 検出`);
        }
        
        return issues.length === 0;
    }

    async testClassStructure() {
        this.log('info', '🏗️ Test 4: VoiceProcessingManagerクラス構造確認');
        
        const content = fs.readFileSync('app/voice-processing-manager.js', 'utf8');
        
        // 必須メソッドの存在確認
        const requiredMethods = [
            'constructor',
            'initialize',
            'processFinalTranscript',
            'callOriginalProcessor',
            'fallbackToOriginal',
            'log',
            'getStats',
            'getDebugInfo'
        ];
        
        for (const method of requiredMethods) {
            if (content.includes(method)) {
                this.log('success', `✅ ${method} メソッド確認`);
            } else {
                this.log('error', `❌ ${method} メソッドが見つかりません`);
            }
        }
        
        // デバッグ関数の存在確認
        if (content.includes('VoiceProcessingManagerDebug')) {
            this.log('success', '✅ デバッグ関数群 確認');
        } else {
            this.log('error', '❌ デバッグ関数群が見つかりません');
        }
        
        // グローバル公開確認
        if (content.includes('global.window.VoiceProcessingManager')) {
            this.log('success', '✅ グローバル公開 確認');
        } else {
            this.log('error', '❌ グローバル公開が見つかりません');
        }
    }

    async testScriptIntegration() {
        this.log('info', '🔄 Test 5: script.js統合確認');
        
        const content = fs.readFileSync('app/script.js', 'utf8');
        
        // processFinalTranscriptOriginal関数確認
        if (content.includes('processFinalTranscriptOriginal')) {
            this.log('success', '✅ processFinalTranscriptOriginal関数 確認');
        } else {
            this.log('error', '❌ processFinalTranscriptOriginal関数が見つかりません');
        }
        
        // 新しいprocessFinalTranscript関数確認
        const newProcessFunctionPattern = /async function processFinalTranscript\(text\) \{[\s\S]*?VoiceProcessingManager/;
        if (newProcessFunctionPattern.test(content)) {
            this.log('success', '✅ 新しいprocessFinalTranscript関数 確認');
        } else {
            this.log('error', '❌ 新しいprocessFinalTranscript関数の統合に問題があります');
        }
        
        // フォールバック機能確認
        if (content.includes('processFinalTranscriptOriginal')) {
            this.log('success', '✅ フォールバック機能 確認');
        } else {
            this.log('error', '❌ フォールバック機能が見つかりません');
        }
    }

    generateTestReport() {
        const duration = Date.now() - this.startTime;
        const successCount = this.testResults.filter(r => r.level === 'success').length;
        const errorCount = this.testResults.filter(r => r.level === 'error').length;
        const warningCount = this.testResults.filter(r => r.level === 'warning').length;
        
        this.log('info', '📊 テスト結果サマリー');
        this.log('info', `実行時間: ${duration}ms`);
        this.log('info', `成功: ${successCount}, エラー: ${errorCount}, 警告: ${warningCount}`);
        
        const report = {
            timestamp: new Date().toISOString(),
            duration,
            results: {
                success: successCount,
                error: errorCount,
                warning: warningCount,
                total: this.testResults.length
            },
            details: this.testResults
        };
        
        // レポートファイル保存
        fs.writeFileSync('phase1-test-report.json', JSON.stringify(report, null, 2));
        this.log('info', '📝 テストレポート保存: phase1-test-report.json');
        
        if (errorCount === 0) {
            this.log('success', '🎉 Phase 1 自動テスト 全て成功！');
            return true;
        } else {
            this.log('error', '❌ Phase 1 自動テスト 問題が検出されました');
            return false;
        }
    }
}

// テスト実行
if (require.main === module) {
    const tester = new Phase1AutomatedTest();
    tester.runAllTests()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('テスト実行失敗:', error);
            process.exit(1);
        });
}

module.exports = Phase1AutomatedTest; 