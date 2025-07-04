// =================================================================================
// PHASE 2: 発声短縮実用拡張システム  
// =================================================================================
// 実際のセッション統合、統計収集、効果測定機能

console.log('🚀 Phase 2: 発声短縮実用拡張システム読み込み開始');

// =================================================================================
// Phase 2: 統計収集・効果測定システム
// =================================================================================

const SpeechShorteningPhase2 = {
    // 統計データ
    statistics: {
        totalProcessed: 0,
        totalOriginalChars: 0,
        totalShortenedChars: 0,
        averageReduction: 0,
        sessionCount: 0,
        lastUpdated: null,
        history: []
    },
    
    // Phase 2設定
    settings: {
        autoApplyInSession: true,
        collectStatistics: true,
        showRealtimeStats: true,
        logDetailedResults: false,
        maxHistoryEntries: 100
    },
    
    // 初期化
    init() {
        this.loadStatistics();
        this.loadSettings();
        console.log('📊 Phase 2: 統計収集システム初期化完了');
    },
    
    // 統計記録
    recordShorteningResult(originalText, shortenedText, speaker, context = 'test') {
        const result = {
            timestamp: new Date().toISOString(),
            speaker: speaker,
            context: context,
            originalLength: originalText.length,
            shortenedLength: shortenedText.length,
            reductionRate: Math.round((1 - shortenedText.length / originalText.length) * 100),
            originalText: this.settings.logDetailedResults ? originalText : originalText.substring(0, 50) + '...',
            shortenedText: this.settings.logDetailedResults ? shortenedText : shortenedText.substring(0, 50) + '...'
        };
        
        // 統計更新
        this.statistics.totalProcessed++;
        this.statistics.totalOriginalChars += result.originalLength;
        this.statistics.totalShortenedChars += result.shortenedLength;
        this.statistics.averageReduction = Math.round(
            (1 - this.statistics.totalShortenedChars / this.statistics.totalOriginalChars) * 100
        );
        this.statistics.lastUpdated = new Date().toISOString();
        
        // 履歴追加
        this.statistics.history.unshift(result);
        if (this.statistics.history.length > this.settings.maxHistoryEntries) {
            this.statistics.history.pop();
        }
        
        // 保存
        this.saveStatistics();
        
        // リアルタイム表示更新
        if (this.settings.showRealtimeStats) {
            this.updateRealtimeDisplay();
        }
        
        console.log(`📊 Phase 2統計記録: ${result.reductionRate}%短縮 (${result.originalLength}→${result.shortenedLength}文字)`);
        
        return result;
    },
    
    // セッション開始時の統計リセット
    startSession() {
        this.statistics.sessionCount++;
        this.saveStatistics();
        console.log(`🎬 Phase 2: セッション${this.statistics.sessionCount}開始`);
    },
    
    // 統計表示更新
    updateRealtimeDisplay() {
        const statsDisplay = document.getElementById('phase2StatsDisplay');
        if (statsDisplay) {
            statsDisplay.innerHTML = `
                <div class="phase2-stats">
                    <div class="stats-item">
                        <span class="stats-label">累計処理数:</span>
                        <span class="stats-value">${this.statistics.totalProcessed}回</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">平均短縮率:</span>
                        <span class="stats-value">${this.statistics.averageReduction}%</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">文字数削減:</span>
                        <span class="stats-value">${this.statistics.totalOriginalChars - this.statistics.totalShortenedChars}文字</span>
                    </div>
                    <div class="stats-item">
                        <span class="stats-label">セッション数:</span>
                        <span class="stats-value">${this.statistics.sessionCount}回</span>
                    </div>
                </div>
            `;
        }
    },
    
    // 設定保存
    saveSettings() {
        localStorage.setItem('speechShorteningPhase2Settings', JSON.stringify(this.settings));
    },
    
    // 設定読み込み
    loadSettings() {
        try {
            const saved = localStorage.getItem('speechShorteningPhase2Settings');
            if (saved) {
                Object.assign(this.settings, JSON.parse(saved));
            }
        } catch (error) {
            console.error('❌ Phase 2設定読み込みエラー:', error);
        }
    },
    
    // 統計保存
    saveStatistics() {
        localStorage.setItem('speechShorteningPhase2Stats', JSON.stringify(this.statistics));
    },
    
    // 統計読み込み
    loadStatistics() {
        try {
            const saved = localStorage.getItem('speechShorteningPhase2Stats');
            if (saved) {
                Object.assign(this.statistics, JSON.parse(saved));
            }
        } catch (error) {
            console.error('❌ Phase 2統計読み込みエラー:', error);
        }
    },
    
    // 統計レポート生成
    generateStatisticsReport() {
        const report = {
            summary: {
                totalProcessed: this.statistics.totalProcessed,
                averageReduction: this.statistics.averageReduction,
                totalCharsSaved: this.statistics.totalOriginalChars - this.statistics.totalShortenedChars,
                sessionCount: this.statistics.sessionCount,
                reportGenerated: new Date().toISOString()
            },
            recentHistory: this.statistics.history.slice(0, 10),
            reductionByContext: this.getReductionByContext(),
            reductionBySpeaker: this.getReductionBySpeaker()
        };
        
        return report;
    },
    
    // コンテキスト別短縮率
    getReductionByContext() {
        const contextStats = {};
        this.statistics.history.forEach(entry => {
            if (!contextStats[entry.context]) {
                contextStats[entry.context] = { count: 0, totalReduction: 0 };
            }
            contextStats[entry.context].count++;
            contextStats[entry.context].totalReduction += entry.reductionRate;
        });
        
        Object.keys(contextStats).forEach(context => {
            contextStats[context].averageReduction = Math.round(
                contextStats[context].totalReduction / contextStats[context].count
            );
        });
        
        return contextStats;
    },
    
    // スピーカー別短縮率
    getReductionBySpeaker() {
        const speakerStats = {};
        this.statistics.history.forEach(entry => {
            if (!speakerStats[entry.speaker]) {
                speakerStats[entry.speaker] = { count: 0, totalReduction: 0 };
            }
            speakerStats[entry.speaker].count++;
            speakerStats[entry.speaker].totalReduction += entry.reductionRate;
        });
        
        Object.keys(speakerStats).forEach(speaker => {
            speakerStats[speaker].averageReduction = Math.round(
                speakerStats[speaker].totalReduction / speakerStats[speaker].count
            );
        });
        
        return speakerStats;
    }
};

// =================================================================================
// Phase 2: 実用テスト機能
// =================================================================================

// 拡張テスト文セット
const Phase2TestTexts = [
    // 長い挨拶パターン
    'こんにちは、私は深堀AIアシスタントのねほりーのです。本日はお忙しい中、貴重なお時間をいただき、誠にありがとうございます。さて、今回のテーマ「AI技術を活用したデザイン制作プロセスの革新」について、非常に興味深い内容ですね。このテーマについて、もう少し詳しく掘り下げてお聞かせいただけませんでしょうか？特に、従来の制作プロセスとの違いや、導入における課題などがございましたら、ぜひお聞かせください。',
    
    // 知見確認パターン
    'ありがとうございました。大変興味深いお話をお聞かせいただき、誠にありがとうございました。お聞かせいただいた内容から、以下のような貴重な知見を抽出させていただきました：「AI技術を活用したデザイン制作では、従来の人間中心のクリエイティブプロセスに、機械学習による自動生成と最適化機能を組み合わせることで、効率性と創造性の両立が可能となり、特にアイデア発想段階での多様性確保と、細部調整での精度向上が重要な成功要因となる」。この知見の内容について、正確に理解できているでしょうか？もし修正や追加がございましたら、お聞かseください。',
    
    // 冗長表現多用パターン
    'それは本当に素晴らしいお話ですね。つまり、要するに、具体的には、どのような場面で、どのような課題があり、それをどのように解決されたのでしょうか？また、さらに、その過程において、えー、あのー、どのような工夫や、そのー、配慮をされたのか、なお、その結果として得られた成果や学びについても、また、今後への活用可能性についても、もう少し詳しくお聞かせいただければと思います。ちなみに、他の類似事例との比較や、業界全体への影響などについても、もしよろしければお聞かせください。',
    
    // 実際の深堀くん発言パターン
    'なるほど、非常に興味深いご指摘ですね。確かに、AI技術の導入において、人間のクリエイティビティとの調和は重要な課題となりますね。そこで、もう少し具体的にお聞きしたいのですが、実際の制作現場において、AIツールを活用する際の、チームメンバーとの連携や、品質管理のプロセスについて、どのような工夫をされているのでしょうか？特に、AIが生成した素材と、人間が制作した素材を組み合わせる際の、品質基準の設定や、最終的な品質判断における人間の役割について、詳しくお聞かせいただけませんでしょうか？'
];

// Phase 2実用テスト実行
window.runPhase2Test = function() {
    console.log('🧪 Phase 2: 実用テスト開始');
    
    const testResults = [];
    
    for (let i = 0; i < Phase2TestTexts.length; i++) {
        const originalText = Phase2TestTexts[i];
        
        try {
            // Phase 1システムを使用
            const shortenedText = SpeechShorteningManager.processTextWithShortening ?
                SpeechShorteningManager.processTextWithShortening(originalText, 'nehori') :
                originalText;
            
            // 統計記録
            const result = SpeechShorteningPhase2.recordShorteningResult(
                originalText, shortenedText, 'nehori', 'phase2_test'
            );
            
            testResults.push(result);
            
            console.log(`📋 Phase 2テスト ${i + 1}:`);
            console.log(`📝 元テキスト (${originalText.length}文字): ${originalText.substring(0, 100)}...`);
            console.log(`🔊 短縮後 (${shortenedText.length}文字): ${shortenedText.substring(0, 100)}...`);
            console.log(`📊 短縮率: ${result.reductionRate}%`);
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Phase 2テスト ${i + 1} エラー:`, error);
        }
    }
    
    // 結果サマリー
    const totalReduction = testResults.reduce((sum, r) => sum + r.reductionRate, 0);
    const averageReduction = Math.round(totalReduction / testResults.length);
    
    console.log('🎯 Phase 2テスト結果サマリー:');
    console.log(`平均短縮率: ${averageReduction}%`);
    console.log(`最高短縮率: ${Math.max(...testResults.map(r => r.reductionRate))}%`);
    console.log(`最低短縮率: ${Math.min(...testResults.map(r => r.reductionRate))}%`);
    
    showMessage('success', `Phase 2実用テスト完了: 平均${averageReduction}%短縮`);
    
    return testResults;
};

// Phase 2統計表示
window.showPhase2Statistics = function() {
    const report = SpeechShorteningPhase2.generateStatisticsReport();
    
    const debugInfo = document.getElementById('debugInfoContent');
    const debugDisplay = document.getElementById('shorteningDebugInfo');
    
    if (debugInfo && debugDisplay) {
        debugInfo.textContent = JSON.stringify(report, null, 2);
        debugDisplay.style.display = 'block';
    }
    
    console.log('📊 Phase 2統計レポート:', report);
    showMessage('info', 'Phase 2統計レポートを表示しました');
};

// Phase 2統計リセット
window.resetPhase2Statistics = function() {
    if (confirm('Phase 2の統計データをリセットしますか？')) {
        SpeechShorteningPhase2.statistics = {
            totalProcessed: 0,
            totalOriginalChars: 0,
            totalShortenedChars: 0,
            averageReduction: 0,
            sessionCount: 0,
            lastUpdated: null,
            history: []
        };
        
        SpeechShorteningPhase2.saveStatistics();
        SpeechShorteningPhase2.updateRealtimeDisplay();
        
        showMessage('success', 'Phase 2統計データをリセットしました');
        console.log('🔄 Phase 2統計データリセット完了');
    }
};

// =================================================================================
// Phase 2: セッション統合機能（修正版）
// =================================================================================

// Phase 2統合診断とセットアップ
function setupPhase2Integration() {
    console.log('🔍 Phase 2統合診断開始');
    console.log('1. SpeechShorteningPhase2:', !!window.SpeechShorteningPhase2);
    console.log('2. SpeechShorteningManager:', !!window.SpeechShorteningManager);
    console.log('3. addMessageToChatWithSpeech:', typeof window.addMessageToChatWithSpeech);
    
    if (window.SpeechShorteningPhase2) {
        console.log('4. autoApplyInSession:', window.SpeechShorteningPhase2.settings.autoApplyInSession);
    }
    
    if (window.SpeechShorteningManager) {
        console.log('5. Phase1 enabled:', window.SpeechShorteningManager.settings.enabled);
    }
    
    // addMessageToChatWithSpeech関数が存在する場合のみラップ
    if (typeof window.addMessageToChatWithSpeech === 'function') {
        // 既にラップ済みかチェック
        if (window.addMessageToChatWithSpeech._phase2Wrapped) {
            console.log('✅ Phase 2統合は既に適用済みです');
            return;
        }
        
        // 元の関数をバックアップ
        const originalFunction = window.addMessageToChatWithSpeech;
        
        // 新しい関数で置き換え
        window.addMessageToChatWithSpeech = async function(speaker, displayText, speechText = null) {
            console.log('🚀 Phase 2統合機能が呼び出されました');
            
            try {
                // Phase 2自動適用が有効かチェック
                const phase2Enabled = SpeechShorteningPhase2.settings.autoApplyInSession;
                const phase1Available = window.SpeechShorteningManager && SpeechShorteningManager.settings.enabled;
                
                console.log('📊 Phase 2条件チェック:', {
                    phase2Enabled,
                    phase1Available,
                    textLength: displayText.length
                });
                
                if (phase2Enabled && phase1Available) {
                    console.log('🎯 Phase 2短縮処理を実行します');
                    
                    // Phase 1のシステムを使用して短縮
                    const shortenedText = await SpeechShorteningManager.processTextWithShortening(displayText, speaker);
                    
                    // 統計記録（短縮が発生した場合のみ）
                    if (displayText !== shortenedText) {
                        const result = SpeechShorteningPhase2.recordShorteningResult(
                            displayText, shortenedText, speaker, 'session'
                        );
                        console.log('📈 Phase 2統計記録完了:', result);
                    }
                    
                    // 短縮されたテキストで音声生成
                    return await originalFunction(speaker, displayText, shortenedText);
                } else {
                    console.log('💤 Phase 2条件未満、通常処理を実行');
                    // 通常処理
                    return await originalFunction(speaker, displayText, speechText);
                }
            } catch (error) {
                console.error('❌ Phase 2セッション統合エラー:', error);
                // エラー時は元の処理
                return await originalFunction(speaker, displayText, speechText);
            }
        };
        
        // ラップ済みマーク
        window.addMessageToChatWithSpeech._phase2Wrapped = true;
        
        console.log('✅ Phase 2統合機能を適用しました');
    } else {
        console.warn('⚠️ addMessageToChatWithSpeech関数が見つかりません。1秒後に再試行します。');
        setTimeout(setupPhase2Integration, 1000);
    }
}

// 初期化時とDOMContentLoaded後に統合をセットアップ
setupPhase2Integration();

// DOMContentLoaded後にも再度確認
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupPhase2Integration, 500);
});

// グローバル公開
window.SpeechShorteningPhase2 = SpeechShorteningPhase2;

// 初期化
SpeechShorteningPhase2.init();

console.log('✅ Phase 2: 発声短縮実用拡張システム読み込み完了');
console.log('📋 利用可能な機能: runPhase2Test(), showPhase2Statistics(), resetPhase2Statistics()'); 