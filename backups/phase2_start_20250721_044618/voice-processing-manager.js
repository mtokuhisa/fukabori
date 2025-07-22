/**
 * VoiceProcessingManager v1.0 (Phase 1)
 * ----------------------------------------
 * 音声コマンドシステムの新しい統一処理管理システム
 * 
 * Phase 1: 基盤構築
 * - 従来機能の完全保持
 * - script.jsとの安全な連携
 * - デバッグ・ログシステム
 */

(function(global) {
    'use strict';
    
    if (!global || !global.window) {
        console.error('VoiceProcessingManager: window オブジェクトが見つかりません');
        return;
    }

    class VoiceProcessingManager {
        constructor() {
            this.isInitialized = false;
            this.debugMode = true;
            this.version = '1.0-phase1';
            
            // 処理統計
            this.stats = {
                totalProcessed: 0,
                themeChangeRequests: 0,
                questionChangeRequests: 0,
                fallbackCalls: 0,
                errorCount: 0,
                startTime: Date.now()
            };
            
            // デバッグログ
            this.debugLog = [];
            this.maxLogEntries = 100;
            
            console.log(`🚀 VoiceProcessingManager v${this.version} 初期化開始`);
        }
        
        /**
         * 初期化処理
         */
        async initialize() {
            if (this.isInitialized) {
                this.log('warn', 'VoiceProcessingManager は既に初期化済みです');
                return true;
            }
            
            try {
                // 従来システムとの連携確認
                if (typeof window.processFinalTranscript !== 'function') {
                    throw new Error('従来のprocessFinalTranscript関数が見つかりません');
                }
                
                this.isInitialized = true;
                this.log('info', 'VoiceProcessingManager 初期化完了');
                return true;
                
            } catch (error) {
                this.log('error', `初期化エラー: ${error.message}`);
                return false;
            }
        }
        
        /**
         * メイン音声処理関数（Phase 1: 基本仲介機能）
         */
        async processFinalTranscript(text) {
            if (!this.isInitialized) {
                this.log('warn', '未初期化状態 - フォールバックに移行');
                return await this.fallbackToOriginal(text);
            }
            
            const startTime = performance.now();
            this.stats.totalProcessed++;
            
            try {
                this.log('info', `音声処理開始: "${text}"`);
                
                // Phase 1: 基本的な仲介処理
                // TODO Phase 2: テーマ変更要望検出・処理
                // TODO Phase 2: 質問変更要望検出・処理
                // TODO Phase 3: 削除コマンド改良処理
                
                // 従来のprocessFinalTranscript呼び出し
                const result = await this.callOriginalProcessor(text);
                
                const duration = performance.now() - startTime;
                this.log('info', `音声処理完了 (${duration.toFixed(2)}ms)`);
                
                return result;
                
            } catch (error) {
                this.stats.errorCount++;
                this.log('error', `処理エラー: ${error.message}`);
                
                // エラー時はフォールバックを実行
                return await this.fallbackToOriginal(text);
            }
        }
        
        /**
         * 従来のprocessFinalTranscript呼び出し
         */
        async callOriginalProcessor(text) {
            if (typeof window.processFinalTranscriptOriginal === 'function') {
                return await window.processFinalTranscriptOriginal(text);
            }
            
            // フォールバック: グローバルのprocessFinalTranscriptを直接呼び出し
            if (typeof window.processFinalTranscript === 'function') {
                // 一時的に自分自身を無効化して無限ループを防ぐ
                const temp = window.processFinalTranscript;
                window.processFinalTranscript = null;
                
                try {
                    const result = await temp(text);
                    window.processFinalTranscript = temp;
                    return result;
                } catch (error) {
                    window.processFinalTranscript = temp;
                    throw error;
                }
            }
            
            throw new Error('従来のprocessFinalTranscript関数が利用できません');
        }
        
        /**
         * フォールバック処理
         */
        async fallbackToOriginal(text) {
            this.stats.fallbackCalls++;
            this.log('warn', `フォールバック実行: "${text}"`);
            
            try {
                return await this.callOriginalProcessor(text);
            } catch (error) {
                this.log('error', `フォールバック失敗: ${error.message}`);
                throw error;
            }
        }
        
        /**
         * デバッグログ記録
         */
        log(level, message) {
            const timestamp = new Date().toISOString();
            const logEntry = {
                timestamp,
                level,
                message,
                stats: { ...this.stats }
            };
            
            // ログ保存
            this.debugLog.push(logEntry);
            if (this.debugLog.length > this.maxLogEntries) {
                this.debugLog.shift();
            }
            
            // コンソール出力
            if (this.debugMode) {
                const prefix = `[VoiceProcessingManager]`;
                switch (level) {
                    case 'error':
                        console.error(`${prefix} ❌ ${message}`);
                        break;
                    case 'warn':
                        console.warn(`${prefix} ⚠️ ${message}`);
                        break;
                    case 'info':
                        console.info(`${prefix} ℹ️ ${message}`);
                        break;
                    default:
                        console.log(`${prefix} ${message}`);
                }
            }
        }
        
        /**
         * 統計情報取得
         */
        getStats() {
            const runtime = Date.now() - this.stats.startTime;
            return {
                ...this.stats,
                runtime,
                averageProcessingTime: this.stats.totalProcessed > 0 
                    ? runtime / this.stats.totalProcessed 
                    : 0
            };
        }
        
        /**
         * デバッグ情報取得
         */
        getDebugInfo() {
            return {
                version: this.version,
                initialized: this.isInitialized,
                debugMode: this.debugMode,
                stats: this.getStats(),
                recentLogs: this.debugLog.slice(-10)
            };
        }
    }
    
    // グローバル公開
    global.window.VoiceProcessingManager = VoiceProcessingManager;
    
    // =================================================================================
    // Phase 1: デバッグ・テスト関数群
    // =================================================================================
    
    // グローバルデバッグ関数
    global.window.VoiceProcessingManagerDebug = {
        // インスタンス取得
        getInstance: () => global.window.voiceProcessingManagerInstance,
        
        // デバッグ情報表示
        showDebugInfo: () => {
            const instance = global.window.voiceProcessingManagerInstance;
            if (instance) {
                const info = instance.getDebugInfo();
                console.group('🔍 VoiceProcessingManager Debug Info');
                console.table(info.stats);
                console.log('Recent Logs:', info.recentLogs);
                console.groupEnd();
                return info;
            } else {
                console.warn('VoiceProcessingManager インスタンスが見つかりません');
                return null;
            }
        },
        
        // 統計情報リセット
        resetStats: () => {
            const instance = global.window.voiceProcessingManagerInstance;
            if (instance) {
                instance.stats = {
                    totalProcessed: 0,
                    themeChangeRequests: 0,
                    questionChangeRequests: 0,
                    fallbackCalls: 0,
                    errorCount: 0,
                    startTime: Date.now()
                };
                instance.debugLog = [];
                console.log('✅ VoiceProcessingManager 統計情報をリセット');
                return true;
            }
            return false;
        },
        
        // テスト実行
        runBasicTest: async () => {
            console.group('🧪 VoiceProcessingManager Basic Test');
            
            try {
                const testCases = [
                    'テスト音声入力',
                    'どうぞ',
                    'テーマ変更してください'
                ];
                
                const results = [];
                
                for (const testCase of testCases) {
                    console.log(`Testing: "${testCase}"`);
                    const startTime = performance.now();
                    
                    try {
                        const result = await global.window.processFinalTranscript(testCase);
                        const duration = performance.now() - startTime;
                        
                        results.push({
                            input: testCase,
                            success: true,
                            duration: duration.toFixed(2) + 'ms',
                            result: result
                        });
                        
                        console.log(`✅ Success (${duration.toFixed(2)}ms)`);
                    } catch (error) {
                        results.push({
                            input: testCase,
                            success: false,
                            error: error.message
                        });
                        console.error(`❌ Error: ${error.message}`);
                    }
                }
                
                console.table(results);
                console.groupEnd();
                
                return results;
                
            } catch (error) {
                console.error('テスト実行エラー:', error);
                console.groupEnd();
                return null;
            }
        }
    };
    
    console.log('📦 VoiceProcessingManager クラス定義完了');
    console.log('🔧 デバッグ関数: window.VoiceProcessingManagerDebug で利用可能');

})(typeof window !== 'undefined' ? { window } : global); 