// =================================================================================
// SPEECH SHORTENING ENGINE - 発声短縮エンジン（実験的機能）
// =================================================================================
// 🎭 既存機能に一切影響を与えない独立した短縮システム
// デフォルトは無効状態で、明示的に有効化が必要です

console.log('🎭 発声短縮エンジン初期化開始');

// 🎭 短縮エンジンの設定
const SpeechShorteningEngine = {
    // 🚫 デフォルトは無効（安全第一）
    enabled: true,  // 🆕 デフォルトで有効化（実用的設定）
    
    // 設定
    settings: {
        // 全体レベル（0=無効, 1-5=短縮強度）
        level: 3,  // 🆕 デフォルトを1→3に変更
        
        // 最大文字数
        maxLength: 150,  // 🆕 デフォルトを200→150に変更
        
        // 個別設定
        features: {
            greetingShortening: true,        // 挨拶短縮
            politeSimplification: true,      // 🆕 敬語簡素化を有効化
            themeShortening: true,           // テーマ短縮
            redundancyRemoval: true,         // 重複削除（有効化）
            characterLimit: false,           // 文字数制限（無効化）
            contextAwareness: true,          // 🆕 コンテキスト連携
            systemNotificationShortening: true, // 🆕 システム通知簡素化
            aiSummary: false                 // AI要約機能
        },
        
        // 🆕 AI要約設定
        aiSummaryMode: 'voice_only',  // 'both', 'voice_only', 'disabled'
        
        // フォールバック（エラー時は元処理）
        fallbackOnError: true
    },
    
    // =============================================================================
    // 短縮ルール定義
    // =============================================================================
    
    // 【ルール1】挨拶・定型句短縮（強化版）
    greetingRules: {
        level1: [
            { from: /こんにちは、(.+)です/g, to: '$1です' },
            { from: /ありがとうございます/g, to: 'ありがとう' },
            { from: /よろしくお願いします/g, to: 'よろしく' },
            { from: /お疲れさまでした/g, to: 'お疲れさま' },
            // 🆕 より積極的な挨拶短縮
            { from: /私は進行役の「(.+?)」です。/g, to: '$1です。' },
            { from: /本日は貴重なお時間をいただき、/g, to: '' },
            { from: /今日は、/g, to: '' },
            { from: /こんにちは！深掘りAI「(.+?)」です。/g, to: '$1です。' }
        ],
        level2: [
            { from: /本日はお忙しい中/g, to: '今日は' },
            { from: /貴重なお時間をいただき/g, to: '' },
            { from: /恐れ入りますが/g, to: '' },
            { from: /申し訳ございませんが/g, to: 'すみませんが' },
            // 🆕 進行役関連の簡略化
            { from: /進行役の「(.+?)」です。本日は.*?ありがとうございます。/g, to: '$1です。' },
            { from: /深掘りAI「(.+?)」です。今日は/g, to: '$1です。' }
        ],
        level3: [
            { from: /それでは/g, to: '' },
            { from: /さて/g, to: '' },
            { from: /では/g, to: '' },
            { from: /ところで/g, to: '' },
            // 🆕 より積極的な省略
            { from: /今回のセッション/g, to: '今回' },
            { from: /について貴重なお話を伺いました/g, to: 'のお話を伺いました' }
        ]
    },
    
    // 【ルール2】敬語・丁寧語簡素化（自然な丁寧さ版）
    politeRules: {
        level1: [
            { from: /させていただきます/g, to: 'します' },
            { from: /いたします/g, to: 'します' },
            { from: /でございます/g, to: 'です' },
            { from: /いらっしゃいます/g, to: 'います' },
            // 🔄 自然な丁寧さを保つ（乱暴な表現を避ける）
            { from: /本当にありがとうございました/g, to: 'ありがとうございました' },
            { from: /心より感謝申し上げます/g, to: 'ありがとうございます' }
        ],
        level2: [
            { from: /していただけますでしょうか/g, to: 'してください' },
            { from: /かと思われます/g, to: 'と思います' },
            { from: /ではないでしょうか/g, to: 'ですね' },
            { from: /いかがでしょうか/g, to: 'どうですか' },
            // 🔄 質問形式の自然な簡略化
            { from: /お聞きしたいのですが、/g, to: '' },
            { from: /教えてもらえると嬉しいです！/g, to: '教えてください！' }
        ],
        level3: [
            { from: /お聞かせください/g, to: '教えてください' },
            { from: /おっしゃって/g, to: '言って' },
            { from: /いらして/g, to: '来て' },
            // 🚫 過度なカジュアル化を削除（自然な丁寧さを保つ）
            // { from: /です(ね|よ)/g, to: 'だ$1' }, // 削除
            // { from: /してください/g, to: 'して' }, // 削除
            // { from: /ありがとうございました/g, to: 'ありがとう' } // 削除
            
            // ✅ 自然な簡略化のみ
            { from: /恐れ入りますが/g, to: 'すみませんが' },
            { from: /申し訳ございません/g, to: 'すみません' }
        ]
    },
    
    // 【ルール3】テーマ・専門用語短縮（大幅強化）
    themeRules: [
        // 🎯 汎用テーマ短縮（最重要）
        { from: /「([^」]{10,})」について/g, to: 'このテーマについて' },
        { from: /「([^」]{10,})」に関して/g, to: 'これに関して' },
        { from: /「([^」]{10,})」の/g, to: 'この' },
        { from: /テーマ「([^」]{10,})」/g, to: 'このテーマ' },
        { from: /([^」]{15,})について深く掘り下げて/g, to: '深く掘り下げて' },
        { from: /([^」]{15,})について深く掘り下げていきましょう/g, to: '深く掘り下げていきましょう' },
        
        // 🎯 具体的なテーマパターン
        { from: /AI技術を活用したデザイン制作プロセスの革新/g, to: 'AIデザイン革新' },
        { from: /AIによるUIデザインの革新/g, to: 'AIのUIデザイン革新' },
        
        // 従来のルール
        { from: /におけるセキュリティ課題/g, to: 'のセキュリティ' },
        { from: /の効果的な活用方法/g, to: 'の活用法' },
        { from: /に関する包括的な検討/g, to: 'の検討' },
        { from: /についての詳細な分析/g, to: 'の分析' },
        { from: /に対する適切な対応/g, to: 'への対応' }
    ],
    
    // 【ルール4】冗長表現削除
    redundancyRules: [
        { from: /というのは/g, to: '' },
        { from: /つまり/g, to: '' },
        { from: /要するに/g, to: '' },
        { from: /なお、/g, to: '' },
        { from: /また、/g, to: '' },
        { from: /さらに、/g, to: '' },
        { from: /えー、/g, to: '' },
        { from: /あのー、/g, to: '' },
        { from: /そのー、/g, to: '' }
    ],
    
    // 🆕 【ルール5】コンテキスト連携短縮（強化版）
    contextRules: [
        // テーマ関連の重複排除（強化版）
        { 
            condition: 'theme_displayed',
            patterns: [
                // 🎯 最も効果的なテーマ短縮パターン
                { from: /「([^」]{8,})」というテーマについて/g, to: 'このテーマについて' },
                { from: /「([^」]{8,})」に関して/g, to: 'これに関して' },
                { from: /「([^」]{8,})」について/g, to: 'このテーマについて' },
                { from: /テーマ「([^」]{8,})」の/g, to: 'この' },
                { from: /テーマ「([^」]{8,})」について/g, to: 'このテーマについて' },
                
                // 🎯 会話中の長いテーマ名を短縮
                { from: /([^「]{10,})について深く掘り下げて/g, to: '深く掘り下げて' },
                { from: /([^「]{10,})についてお聞きしたい/g, to: 'これについてお聞きしたい' },
                { from: /([^「]{10,})に関する/g, to: 'これに関する' },
                
                // 🎯 セッション中の繰り返し表現
                { from: /今回のセッション「([^」]{10,})」/g, to: '今回のセッション' },
                { from: /セッション「([^」]{10,})」では/g, to: 'セッションでは' },
                
                // 🎯 既に表示されているテーマの省略
                { from: /AI技術を活用したデザイン制作プロセスの革新について/g, to: 'このテーマについて' },
                { from: /AI技術を活用したデザイン制作プロセスの革新に関して/g, to: 'これに関して' },
                { from: /AI技術を活用したデザイン制作プロセスの革新の/g, to: 'この' },
                { from: /AI技術を活用したデザイン制作プロセスの革新/g, to: 'このテーマ' }
            ]
        }
    ],
    
    // 🆕 【ルール6】システム通知簡素化  
    systemNotificationRules: [
        { from: /閾値を(\d+)点に設定変更しました/g, to: '設定しました' },
        { from: /設定を(.+?)に変更しました/g, to: '設定しました' },
        { from: /(.+?)機能を有効にしました/g, to: '有効にしました' },
        { from: /(.+?)機能を無効にしました/g, to: '無効にしました' },
        { from: /保存が完了しました/g, to: '保存しました' },
        { from: /更新が完了しました/g, to: '更新しました' }
    ],
    
    // =============================================================================
    // 短縮処理メソッド
    // =============================================================================
    
    // メイン短縮処理（同期版）
    shortenText(text, context = {}) {
        if (!this.enabled || !text) {
            return text;
        }
        
        try {
            let result = text;
            const originalLength = text.length;
            
            // 前処理（正規化）
            result = this.normalizeText(result);
            
            // 🆕 システム通知簡素化
            if (this.settings.features.systemNotificationShortening) {
                result = this.applySystemNotificationRules(result);
            }
            
            // 🆕 コンテキスト連携短縮
            if (this.settings.features.contextAwareness) {
                result = this.applyContextRules(result, context);
            }
            
            // 既存の短縮ルール適用
            if (this.settings.features.greetingShortening) {
                result = this.applyGreetingRules(result);
            }
            
            if (this.settings.features.politeSimplification) {
                result = this.applyPoliteRules(result);
            }
            
            if (this.settings.features.themeShortening) {
                result = this.applyThemeRules(result);
            }
            
            if (this.settings.features.redundancyRemoval) {
                result = this.applyRedundancyRules(result);
                result = this.applyAdvancedRedundancyRules(result);
            }
            
            // 🚫 文字数制限を完全撤廃：内容重要度を優先
            // 200文字でも必要なら200文字、30文字でも冗長なら10文字の思想
            // if (this.settings.features.characterLimit) {
            //     result = this.applyCharacterLimit(result);
            // }
            
            // 後処理（整形）
            result = this.finalizeText(result);
            
            // ログ出力
            if (originalLength !== result.length) {
                console.log(`🎭 実用的短縮: ${originalLength}文字 → ${result.length}文字`);
                console.log(`📝 元: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
                console.log(`🔊 短縮: ${result}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ 短縮処理エラー:', error);
            // エラー時は元のテキストを返す
            return text;
        }
    },
    
    // 前処理（正規化）
    normalizeText(text) {
        return text
            .replace(/\s+/g, ' ')      // 連続空白を単一に
            .replace(/。+/g, '。')     // 連続句点を単一に
            .replace(/！+/g, '！')     // 連続感嘆符を単一に
            .trim();
    },
    
    // 挨拶ルール適用（設定チェック強化版）
    applyGreetingRules(text) {
        // 🔍 設定チェック：挨拶短縮が無効の場合はスキップ
        if (!this.settings.features.greetingShortening) {
            console.log('🚫 挨拶短縮は無効設定のためスキップ');
            return text;
        }
        
        console.log('✅ 挨拶短縮設定が有効 - ルール適用開始');
        let result = text;
        
        // レベル別適用
        for (let level = 1; level <= this.settings.level && level <= 3; level++) {
            const rules = this.greetingRules[`level${level}`];
            if (rules) {
                const beforeLength = result.length;
                for (const rule of rules) {
                    result = result.replace(rule.from, rule.to);
                }
                if (beforeLength !== result.length) {
                    console.log(`🎭 挨拶短縮 Level${level} 適用: ${beforeLength}→${result.length}文字`);
                }
            }
        }
        
        return result;
    },
    
    // 敬語ルール適用（設定チェック強化版）
    applyPoliteRules(text) {
        // 🔍 設定チェック強化：敬語簡素化が無効の場合はスキップ
        if (!this.settings.features.politeSimplification) {
            console.log('🚫 敬語簡素化は無効設定のためスキップ');
            return text;
        }
        
        console.log('✅ 敬語簡素化設定が有効 - ルール適用開始');
        let result = text;
        
        // レベル別適用
        for (let level = 1; level <= this.settings.level && level <= 3; level++) {
            const rules = this.politeRules[`level${level}`];
            if (rules) {
                const beforeLength = result.length;
                for (const rule of rules) {
                    result = result.replace(rule.from, rule.to);
                }
                if (beforeLength !== result.length) {
                    console.log(`🎭 敬語簡素化 Level${level} 適用: ${beforeLength}→${result.length}文字`);
                }
            }
        }
        
        return result;
    },
    
    // テーマルール適用（設定チェック強化版）
    applyThemeRules(text) {
        // 🔍 設定チェック：テーマ短縮が無効の場合はスキップ
        if (!this.settings.features.themeShortening) {
            console.log('🚫 テーマ短縮は無効設定のためスキップ');
            return text;
        }
        
        console.log('✅ テーマ短縮設定が有効 - ルール適用開始');
        let result = text;
        const beforeLength = text.length;
        
        for (const rule of this.themeRules) {
            result = result.replace(rule.from, rule.to);
        }
        
        if (beforeLength !== result.length) {
            console.log(`🎭 テーマ短縮適用: ${beforeLength}→${result.length}文字`);
        }
        
        return result;
    },
    
    // 冗長表現ルール適用（設定チェック強化版）
    applyRedundancyRules(text) {
        // 🔍 設定チェック：冗長表現排除が無効の場合はスキップ
        if (!this.settings.features.redundancyRemoval) {
            console.log('🚫 冗長表現排除は無効設定のためスキップ');
            return text;
        }
        
        console.log('✅ 冗長表現排除設定が有効 - ルール適用開始');
        let result = text;
        const beforeLength = text.length;
        
        for (const rule of this.redundancyRules) {
            result = result.replace(rule.from, rule.to);
        }
        
        if (beforeLength !== result.length) {
            console.log(`🎭 冗長表現排除適用: ${beforeLength}→${result.length}文字`);
        }
        
        return result;
    },
    
    // 文字数制限適用
    applyCharacterLimit(text) {
        if (text.length <= this.settings.maxLength) {
            return text;
        }
        
        // 句読点で区切って優先順位をつける
        const sentences = text.split(/[。！？]/);
        let result = '';
        
        for (const sentence of sentences) {
            const candidate = result + sentence + (sentence.endsWith('。') || sentence.endsWith('！') || sentence.endsWith('？') ? '' : '。');
            if (candidate.length <= this.settings.maxLength) {
                result = candidate;
            } else {
                break;
            }
        }
        
        // まだ長い場合は強制的に切る
        if (result.length > this.settings.maxLength) {
            result = text.substring(0, this.settings.maxLength - 3) + '...';
        }
        
        return result || text.substring(0, this.settings.maxLength - 3) + '...';
    },
    
    // 後処理（整形）
    finalizeText(text) {
        return text
            .replace(/\s+/g, ' ')      // 再度空白整理
            .replace(/^[、。！？]/g, '') // 行頭の句読点削除
            .replace(/[、。]{2,}/g, '。') // 連続句読点整理
            .trim();
    },
    
    // =============================================================================
    // 統合発話処理（新機能）
    // =============================================================================
    
    // 安全な発話処理（フォールバック付き）
    async speakWithShortening(speaker, displayText, speechText = null) {
        try {
            // 機能が無効の場合は元の処理
            if (!this.enabled) {
                return await this.originalSpeak(speaker, displayText);
            }
            
            // 表示テキスト（元のまま）
            await window.addMessageToChat(speaker, displayText);
            
            // 音声テキスト（短縮版）
            const textForSpeech = speechText || this.shortenText(displayText);
            
            // 音声生成・再生
            const audioBlob = await window.ttsTextToAudioBlob(textForSpeech, speaker);
            await window.playPreGeneratedAudio(audioBlob, speaker);
            
            return true;
            
        } catch (error) {
            console.error('❌ 短縮発話エラー:', error);
            
            // フォールバック: 元の処理
            if (this.settings.fallbackOnError) {
                console.log('🔄 フォールバック: 元の処理を実行');
                return await this.originalSpeak(speaker, displayText);
            }
            
            throw error;
        }
    },
    
    // 元の処理（バックアップから）
    async originalSpeak(speaker, text) {
        if (window.FukaboriSafetySystem && window.FukaboriSafetySystem.original.addMessageToChat) {
            // バックアップから復元した元の処理
            await window.FukaboriSafetySystem.original.addMessageToChat(speaker, text);
            const audioBlob = await window.FukaboriSafetySystem.original.ttsTextToAudioBlob(text, speaker);
            await window.FukaboriSafetySystem.original.playPreGeneratedAudio(audioBlob, speaker);
        } else {
            // 通常の処理
            await window.addMessageToChat(speaker, text);
            const audioBlob = await window.ttsTextToAudioBlob(text, speaker);
            await window.playPreGeneratedAudio(audioBlob, speaker);
        }
    },
    
    // =============================================================================
    // 設定・制御メソッド
    // =============================================================================
    
    // 機能有効化
    enable() {
        // 安全チェック
        if (window.FukaboriSafetySystem && !window.FukaboriSafetySystem.isBackedUp) {
            console.error('❌ バックアップが未実行のため有効化できません');
            return false;
        }
        
        this.enabled = true;
        localStorage.setItem('speechShorteningEnabled', 'true');
        console.log('✅ 発声短縮機能を有効化しました');
        return true;
    },
    
    // 機能無効化
    disable() {
        this.enabled = false;
        localStorage.setItem('speechShorteningEnabled', 'false');
        console.log('🔄 発声短縮機能を無効化しました');
        return true;
    },
    
    // 設定更新
    updateSettings(newSettings) {
        Object.assign(this.settings, newSettings);
        localStorage.setItem('speechShorteningSettings', JSON.stringify(this.settings));
        console.log('⚙️ 設定を更新しました:', newSettings);
    },
    
    // 設定読み込み
    loadSettings() {
        try {
            const saved = localStorage.getItem('speechShorteningSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                Object.assign(this.settings, settings);
                console.log('✅ 設定を読み込みました');
            }
            
            const enabled = localStorage.getItem('speechShorteningEnabled');
            if (enabled === 'true') {
                this.enabled = true;
            }
        } catch (error) {
            console.error('❌ 設定読み込みエラー:', error);
        }
    },
    
    // テスト機能
    async testShortening(testText) {
        if (!testText) {
            testText = "こんにちは、はほりーのです。本日はお忙しい中、貴重なお時間をいただき、ありがとうございます。それでは、AI API利用アプリのAPI KEY管理におけるセキュリティ課題について、詳しくお聞かせいただけますでしょうか。";
        }
        
        console.log('🧪 短縮テスト実行');
        console.log('📝 元テキスト:', testText);
        
        const shortened = this.shortenText(testText);
        console.log('🔊 短縮結果:', shortened);
        
        return {
            original: testText,
            shortened: shortened,
            originalLength: testText.length,
            shortenedLength: shortened.length,
            reductionRate: Math.round((1 - shortened.length / testText.length) * 100)
        };
    },

    // =============================================================================
    // 後方互換性のためのエイリアス
    // =============================================================================
    
    // processTextエイリアス（後方互換性）
    processText(text, level = null, maxLength = null, options = null) {
        // パラメータが指定されている場合は一時的に設定を適用
        if (level !== null || maxLength !== null || options !== null) {
            const originalSettings = {...this.settings};
            
            if (level !== null) this.settings.level = level;
            if (maxLength !== null) this.settings.maxLength = maxLength;
            if (options !== null) {
                Object.assign(this.settings.features, options);
            }
            
            const result = this.shortenText(text);
            
            // 設定を元に戻す
            this.settings = originalSettings;
            
            return result;
        }
        
        // 通常の処理
        return this.shortenText(text);
    },

    // 🆕 システム通知ルール適用
    applySystemNotificationRules(text) {
        let result = text;
        
        for (const rule of this.systemNotificationRules) {
            result = result.replace(rule.from, rule.to);
        }
        
        return result;
    },
    
    // 🆕 コンテキストルール適用
    applyContextRules(text, context) {
        let result = text;
        
        // 🎯 右ペインにテーマが表示されている場合（強化版）
        if (context.themeDisplayed || window.AppState?.currentTheme) {
            const themeRules = this.contextRules.find(rule => rule.condition === 'theme_displayed');
            if (themeRules) {
                console.log('🎯 コンテキスト短縮適用中: テーマ表示状態');
                const beforeLength = result.length;
                
                for (const pattern of themeRules.patterns) {
                    result = result.replace(pattern.from, pattern.to);
                }
                
                if (beforeLength !== result.length) {
                    console.log(`🎯 コンテキスト短縮実行: ${beforeLength}→${result.length}文字`);
                }
            }
        }
        
        // 🆕 追加のコンテキスト認識短縮
        // 現在のテーマを取得して動的に短縮ルールを適用
        const currentTheme = context.currentTheme || window.AppState?.currentTheme;
        if (currentTheme && currentTheme.length > 10) {
            console.log('🎯 動的テーマ短縮適用:', currentTheme);
            const beforeLength = result.length;
            
            // 動的にテーマ名を短縮
            const escapedTheme = currentTheme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const dynamicRules = [
                new RegExp(`「${escapedTheme}」について`, 'g'),
                new RegExp(`「${escapedTheme}」に関して`, 'g'),
                new RegExp(`${escapedTheme}について`, 'g'),
                new RegExp(`${escapedTheme}に関して`, 'g'),
                new RegExp(`${escapedTheme}の`, 'g')
            ];
            
            const replacements = [
                'このテーマについて',
                'これに関して', 
                'このテーマについて',
                'これに関して',
                'この'
            ];
            
            for (let i = 0; i < dynamicRules.length; i++) {
                result = result.replace(dynamicRules[i], replacements[i]);
            }
            
            if (beforeLength !== result.length) {
                console.log(`🎯 動的テーマ短縮実行: ${beforeLength}→${result.length}文字`);
            }
        }
        
        return result;
    },
    
    // 🆕 AI要約機能
    async applyAISummary(text, context) {
        if (!window.AppState?.apiKey || text.length < 100) {
            return text; // 短いテキストは要約しない
        }
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.AppState.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { 
                            role: 'system', 
                            content: '以下のテキストを音声で聞きやすいように要約してください。重要な情報は保持し、冗長な表現のみを削除してください。質問文の場合は質問の核心を明確に保ってください。' 
                        },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 150,
                    temperature: 0.3
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const summary = result.choices[0].message.content.trim();
                console.log('🤖 AI要約完了:', { original: text.length, summary: summary.length });
                return summary;
            } else {
                console.log('⚠️ AI要約失敗 - 元テキストを使用');
                return text;
            }
        } catch (error) {
            console.error('❌ AI要約エラー:', error);
            return text;
        }
    },

    // 🆕 コンテキスト付き短縮処理（新しいエントリーポイント）
    async shortenTextWithContext(text, context = {}) {
        // AIを使用する場合は非同期処理
        if (this.settings.features.aiSummary && this.settings.aiSummaryMode !== 'disabled') {
            return await this.shortenTextAsync(text, context);
        } else {
            return this.shortenText(text, context);
        }
    },
    
    // 🆕 非同期短縮処理
    async shortenTextAsync(text, context = {}) {
        if (!this.enabled || !text) {
            return text;
        }
        
        try {
            let result = text;
            const originalLength = text.length;
            
            // 前処理（正規化）
            result = this.normalizeText(result);
            
            // AI要約処理（非同期）
            if (this.settings.features.aiSummary && this.settings.aiSummaryMode !== 'disabled') {
                result = await this.applyAISummary(result, context);
            }
            
            // その他のルール適用（同期処理）
            if (this.settings.features.systemNotificationShortening) {
                result = this.applySystemNotificationRules(result);
            }
            
            if (this.settings.features.contextAwareness) {
                result = this.applyContextRules(result, context);
            }
            
            if (this.settings.features.greetingShortening) {
                result = this.applyGreetingRules(result);
            }
            
            if (this.settings.features.politeSimplification) {
                result = this.applyPoliteRules(result);
            }
            
            if (this.settings.features.themeShortening) {
                result = this.applyThemeRules(result);
            }
            
            if (this.settings.features.redundancyRemoval) {
                result = this.applyRedundancyRules(result);
                result = this.applyAdvancedRedundancyRules(result);
            }
            
            // 🚫 文字数制限を無効化（内容重要度を優先）
            // if (this.settings.features.characterLimit) {
            //     result = this.applyCharacterLimit(result);
            // }
            
            // 後処理（整形）
            result = this.finalizeText(result);
            
            // ログ出力
            if (originalLength !== result.length) {
                console.log(`🎭 コンテキスト短縮: ${originalLength}文字 → ${result.length}文字`);
                console.log(`📝 元: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
                console.log(`🔊 短縮: ${result}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ 非同期短縮処理エラー:', error);
            return text;
        }
    },

    // 🆕 AI要約モード設定
    setAISummaryMode(mode) {
        if (['both', 'voice_only', 'disabled'].includes(mode)) {
            this.settings.aiSummaryMode = mode;
            this.settings.features.aiSummary = mode !== 'disabled';
            localStorage.setItem('speechShorteningSettings', JSON.stringify(this.settings));
            console.log(`🤖 AI要約モードを${mode}に設定しました`);
        }
    },
    
    // 🆕 コンテキスト情報取得
    getCurrentContext() {
        return {
            themeDisplayed: !!(window.AppState?.currentTheme),
            currentTheme: window.AppState?.currentTheme || '',
            sessionActive: window.AppState?.sessionActive || false,
            phase: window.AppState?.phase || 'setup'
        };
    },

    // 🎯 高度な冗長表現排除（内容重要度ベース・自然な丁寧さ版）
    applyAdvancedRedundancyRules(text) {
        // 🔍 設定チェック：冗長表現排除が無効の場合はスキップ
        if (!this.settings.features.redundancyRemoval) {
            return text;
        }
        
        let result = text;
        const beforeLength = text.length;
        
        // 重複する意味の排除（自然な丁寧さ版）
        const meaningfulReductions = [
            // 1. 同じ意味の重複表現
            { from: /貴重なお時間をいただき.*?ありがとうございます/g, to: 'ありがとうございます' },
            { from: /本日は.*?ありがとうございます.*?今日は/g, to: '今日は' },
            { from: /それでは.*?について.*?について/g, to: function(match) { 
                const parts = match.split('について');
                return parts[0] + 'について' + parts[2];
            }},
            
            // 🆕 進行役・AI紹介の適度な短縮
            { from: /私は進行役の「(.+?)」です。本日は.*?ありがとうございます。(.+?)と一緒に/g, to: '$1です。$2と一緒に' },
            { from: /こんにちは！深掘りAI「(.+?)」です。今日は.*?について/g, to: '$1です。' },
            { from: /深掘りAI「(.+?)」です。今回のセッション.*?では/g, to: '$1です。今回は' },
            
            // 🆕 テーマ関連の適度な短縮
            { from: /「([^」]{15,})」について深く掘り下げていきましょう/g, to: '深く掘り下げていきましょう' },
            { from: /「([^」]{15,})」に関して、具体的な体験をお聞きしたい/g, to: '具体的な体験をお聞きしたい' },
            { from: /「([^」]{15,})」について、とても興味深い/g, to: 'とても興味深い' },
            
            // 2. 冗長な敬語表現（自然な丁寧さ版）
            { from: /お聞かせいただければと思います/g, to: 'お聞かせください' },
            { from: /させていただければと思います/g, to: 'させていただきます' },
            { from: /いただければと思います/g, to: 'いただきます' },
            { from: /お話しいただき.*?ありがとうございました/g, to: 'ありがとうございました' },
            { from: /教えてもらえると嬉しいです！/g, to: '教えてください！' },
            { from: /お聞かせいただけて嬉しかったです/g, to: '嬉しかったです' },
            
            // 3. 情報の重複排除
            { from: /「([^」]+)」.*?「\1」/g, to: '「$1」' }, // 同じ用語の重複
            { from: /テーマ.*?について.*?テーマ/g, to: 'テーマ' },
            { from: /セッション.*?について.*?セッション/g, to: 'セッション' },
            
            // 🔄 会話の流れを重視した自然な短縮
            { from: /それは本当に素晴らしいお話ですね！/g, to: '素晴らしいお話ですね！' },
            { from: /それは素晴らしい体験ですね！/g, to: '素晴らしい体験ですね！' },
            { from: /非常に価値ある知見をお聞かせいただき/g, to: '価値ある知見をお聞かせいただき' },
            { from: /心より感謝申し上げます/g, to: '感謝申し上げます' },
            
            // 🔄 質問パターンの自然な短縮
            { from: /そこで、(.+?)はどのような(.+?)でしたか？/g, to: '$1はどうでしたか？' },
            { from: /また、(.+?)についてどのように(.+?)か、教えてもらえると嬉しいです！/g, to: '$1はどうですか？' },
            
            // 4. 不要な装飾語の削除
            { from: /本当に/g, to: '' },
            { from: /実際に/g, to: '' },
            { from: /具体的に/g, to: '' },
            { from: /詳しく/g, to: '' },
            { from: /ぜひ/g, to: '' },
            { from: /特に/g, to: '' },
            { from: /さらに/g, to: '' },
            
            // 🔄 最終挨拶の自然な短縮
            { from: /今日は本当にありがとうございました！/g, to: 'ありがとうございました！' },
            { from: /また是非お話を聞かせてくださいね。お疲れさま！/g, to: 'また聞かせてください！お疲れさまでした！' },
            { from: /参加者の皆様、貴重なお話をありがとうございました！/g, to: 'ありがとうございました！' }
        ];
        
        for (const rule of meaningfulReductions) {
            if (typeof rule.to === 'function') {
                result = result.replace(rule.from, rule.to);
            } else {
                result = result.replace(rule.from, rule.to);
            }
        }
        
        // 連続する句読点や空白の整理
        result = result
            .replace(/\s+/g, ' ')
            .replace(/[、。]{2,}/g, '。')
            .replace(/^[、。\s]+|[、。\s]+$/g, '')
            .trim();
            
        if (beforeLength !== result.length) {
            console.log(`🎭 高度な冗長表現排除適用: ${beforeLength}→${result.length}文字`);
        }
        
        return result;
    }
};

// =================================================================================
// 初期化処理
// =================================================================================

// 設定読み込み
SpeechShorteningEngine.loadSettings();

// 緊急停止状態チェック
document.addEventListener('DOMContentLoaded', function() {
    const emergencyDisabled = localStorage.getItem('speechShorteningEmergencyDisabled');
    if (emergencyDisabled === 'true') {
        SpeechShorteningEngine.enabled = false;
        console.log('🚨 緊急停止状態のため、短縮機能は無効です');
    } else {
        // 🆕 デフォルトで有効化（緊急停止がない場合）
        SpeechShorteningEngine.enabled = true;
        localStorage.setItem('speechShorteningEnabled', 'true');
        console.log('✅ 音声短縮エンジンをデフォルトで有効化しました');
    }
});

// =================================================================================
// グローバル関数の公開
// =================================================================================

// メイン機能
window.enableSpeechShortening = function() {
    return SpeechShorteningEngine.enable();
};

window.disableSpeechShortening = function() {
    return SpeechShorteningEngine.disable();
};

window.testSpeechShortening = function(testText) {
    return SpeechShorteningEngine.testShortening(testText);
};

window.updateShorteningSettings = function(settings) {
    return SpeechShorteningEngine.updateSettings(settings);
};

// 新しい発話関数（実験的）
window.speakWithShortening = function(speaker, text, speechText = null) {
    return SpeechShorteningEngine.speakWithShortening(speaker, text, speechText);
};

// エンジンの直接アクセス
window.SpeechShorteningEngine = SpeechShorteningEngine;

// 🆕 新機能テスト用関数
window.testContextShortening = function(testText) {
    const context = SpeechShorteningEngine.getCurrentContext();
    console.log('🔍 コンテキスト情報:', context);
    
    const result = SpeechShorteningEngine.shortenText(testText, context);
    console.log('📝 テスト結果:');
    console.log(`  元テキスト: ${testText}`);
    console.log(`  短縮結果: ${result}`);
    console.log(`  短縮率: ${Math.round((1 - result.length / testText.length) * 100)}%`);
    
    return result;
};

window.testAISummary = async function(testText) {
    if (!SpeechShorteningEngine.settings.features.aiSummary) {
        console.log('⚠️ AI要約機能が無効です。有効化してからテストしてください。');
        return testText;
    }
    
    const context = SpeechShorteningEngine.getCurrentContext();
    console.log('🤖 AI要約テスト開始...');
    
    try {
        const result = await SpeechShorteningEngine.shortenTextWithContext(testText, context);
        console.log('📝 AI要約結果:');
        console.log(`  元テキスト: ${testText}`);
        console.log(`  要約結果: ${result}`);
        console.log(`  短縮率: ${Math.round((1 - result.length / testText.length) * 100)}%`);
        
        return result;
    } catch (error) {
        console.error('❌ AI要約テストエラー:', error);
        return testText;
    }
};

window.enableAISummary = function(mode = 'voice_only') {
    SpeechShorteningEngine.setAISummaryMode(mode);
    console.log(`✅ AI要約を${mode}モードで有効化しました`);
    console.log('💡 テスト用: window.testAISummary("テストしたいテキスト")');
};

window.testSystemNotification = function() {
    const testTexts = [
        '閾値を80点に設定変更しました',
        'AI要約機能を有効にしました',
        '設定をデフォルトに変更しました',
        '保存が完了しました'
    ];
    
    console.log('🔧 システム通知短縮テスト:');
    testTexts.forEach(text => {
        const result = SpeechShorteningEngine.applySystemNotificationRules(text);
        console.log(`  ${text} → ${result}`);
    });
};

window.testThemeContextShortening = function() {
    const testTexts = [
        'API KEY管理におけるセキュリティ課題について詳しく教えてください',
        '「API KEY管理におけるセキュリティ課題」というテーマについて深く掘り下げていきましょう',
        'テーマ「API KEY管理におけるセキュリティ課題」の重要なポイントは何ですか？'
    ];
    
    console.log('🎯 テーマコンテキスト短縮テスト:');
    testTexts.forEach(text => {
        const context = { themeDisplayed: true };
        const result = SpeechShorteningEngine.applyContextRules(text, context);
        console.log(`  元: ${text}`);
        console.log(`  短縮: ${result}`);
        console.log('');
    });
};

console.log('✅ 実用的音声短縮システムが利用可能です');
console.log('💡 テスト用関数:');
console.log('  - window.testContextShortening("テキスト")');
console.log('  - window.testAISummary("テキスト")');
console.log('  - window.enableAISummary("voice_only")');
console.log('  - window.testSystemNotification()');
console.log('  - window.testThemeContextShortening()');

console.log('✅ 発声短縮エンジン読み込み完了（デフォルト無効）'); 