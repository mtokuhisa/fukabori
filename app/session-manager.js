// =================================================================================
// SESSION MANAGER - セッション終了システム
// =================================================================================
// 単一責任: セッション終了の完全な処理（確認→状態変更→最終処理→データ保存→リセット）
// 新ルール適用: 行数制限なし、単一機能の完全な処理に限定

/**
 * セッション終了管理システム
 * 責任範囲: セッション終了の完全なライフサイクル管理
 */
const SessionEndManager = {
    
    /**
     * メインセッション終了処理
     * セッション終了の完全な責任を担う
     */
    async endSession() {
        console.log('💡 SessionEndManager.endSession が実行されました');
        
        // 1. 事前チェック
        if (!window.AppState.sessionActive) {
            window.showMessage('info', 'セッションは既に終了しています');
            return false;
        }
        
        // 2. ユーザー確認
        const confirmed = confirm('セッションを終了しますか？\n会話データは保存されます。');
        if (!confirmed) {
            return false;
        }
        
        try {
            // 3. 活動停止処理
            this.stopAllActivities();
            
            // 4. フェーズ変更
            window.AppState.phase = window.PHASES.SUMMARY;
            this.updateSessionStatus('セッション終了中...', window.AppState.currentTheme);
            
            // 5. 最終処理実行
            await this.executeFinalSequence();
            
            // 6. データ保存
            await this.saveSessionData();
            
            // 7. 状態リセット
            this.resetSessionState();
            
            // 8. UI更新
            this.updateSessionStatus('セッション完了', window.AppState.currentTheme);
            window.showMessage('success', 'セッションを終了しました');
            
            console.log('✅ セッション終了完了');
            return true;
            
        } catch (error) {
            console.error('❌ セッション終了エラー:', error);
            window.showMessage('error', 'セッション終了中にエラーが発生しました');
            return false;
        }
    },
    
    /**
     * 全活動停止処理
     * 音声認識・音声再生の完全停止
     */
    stopAllActivities() {
        console.log('🛑 全活動停止処理開始');
        
        try {
            // 全活動強制停止
            if (typeof forceStopAllActivity === 'function') {
                forceStopAllActivity();
            }
            
            // 音声制御管理システムによる音声停止
            if (window.AudioControlManager) {
                window.AudioControlManager.forceStopAllAudio('session_end');
            }
            
            console.log('✅ 全活動停止完了');
        } catch (error) {
            console.error('❌ 活動停止エラー:', error);
        }
    },
    
    /**
     * 最終シーケンス実行
     * はほりーの最終まとめ → ねほりーの最終挨拶
     */
    async executeFinalSequence() {
        console.log('🎭 最終シーケンス開始');
        
        try {
            // はほりーのによる知見のまとめ
            await this.generateFinalSummary();
            
            // ねほりーのによる最終挨拶
            await this.generateFinalGreeting();
            
            console.log('✅ 最終シーケンス完了');
        } catch (error) {
            console.error('❌ 最終シーケンスエラー:', error);
            throw error;
        }
    },
    
    /**
     * 最終まとめ生成（はほりーの）
     * セッション全体の振り返りと知見のまとめ
     */
    async generateFinalSummary() {
        console.log('🎭 はほりーのによる最終まとめを生成中...');
        
        try {
            const knowledgeCount = window.AppState.extractedKnowledge.length;
            const summaryPrompt = window.AI_PROMPTS?.SESSION_SUMMARY ? 
                window.AI_PROMPTS.SESSION_SUMMARY(
                    window.AppState.currentTheme, 
                    window.AppState.conversationHistory, 
                    window.AppState.extractedKnowledge
                ) :
                `テーマ「${window.AppState.currentTheme}」について行った深掘りインタビューのセッション全体を振り返り、抽出された${knowledgeCount}件の知見をまとめて最終的な感謝の言葉を述べてください。`;
            
            const summaryMessage = await gptMessagesToCharacterResponse([
                { role: 'user', content: summaryPrompt }
            ], window.SPEAKERS.HAHORI);
            
            // 表示は長く、発声は短くする統合処理
            if (typeof addMessageToChatWithSpeech === 'function') {
                await addMessageToChatWithSpeech(window.SPEAKERS.HAHORI, summaryMessage);
            } else {
                // フォールバック: 通常の処理
                await addMessageToChat(window.SPEAKERS.HAHORI, summaryMessage);
                const audioBlob = await ttsTextToAudioBlob(summaryMessage, window.SPEAKERS.HAHORI);
                await playPreGeneratedAudio(audioBlob, window.SPEAKERS.HAHORI);
            }
            
            console.log('✅ はほりーのの最終まとめ完了');
            
        } catch (error) {
            console.error('❌ 最終まとめ生成エラー:', error);
            
            // フォールバック処理
            const fallbackMessage = `本日は貴重なお時間をいただき、ありがとうございました。${window.AppState.extractedKnowledge.length}件の価値ある知見を抽出させていただきました。`;
            await addMessageToChat(window.SPEAKERS.HAHORI, fallbackMessage);
            const audioBlob = await ttsTextToAudioBlob(fallbackMessage, window.SPEAKERS.HAHORI);
            await playPreGeneratedAudio(audioBlob, window.SPEAKERS.HAHORI);
        }
    },
    
    /**
     * 最終挨拶生成（ねほりーの）
     * セッション終了の感謝とお別れの挨拶
     */
    async generateFinalGreeting() {
        console.log('🎭 ねほりーのによる最終挨拶を生成中...');
        
        try {
            const greetingMessage = `今日は本当にありがとうございました！${window.AppState.currentTheme}について、とても興味深いお話を聞かせていただけて嬉しかったです。また是非お話を聞かせてくださいね。お疲れさまでした！`;
            
            await addMessageToChat(window.SPEAKERS.NEHORI, greetingMessage);
            const audioBlob = await ttsTextToAudioBlob(greetingMessage, window.SPEAKERS.NEHORI);
            await playPreGeneratedAudio(audioBlob, window.SPEAKERS.NEHORI);
            
            console.log('✅ ねほりーのの最終挨拶完了');
            
        } catch (error) {
            console.error('❌ 最終挨拶生成エラー:', error);
            
            // フォールバック処理
            const fallbackMessage = 'ありがとうございました！またお話を聞かせてくださいね。';
            await addMessageToChat(window.SPEAKERS.NEHORI, fallbackMessage);
            const audioBlob = await ttsTextToAudioBlob(fallbackMessage, window.SPEAKERS.NEHORI);
            await playPreGeneratedAudio(audioBlob, window.SPEAKERS.NEHORI);
        }
    },
    
    /**
     * セッションデータ保存
     * 会話履歴と知見の永続化
     */
    async saveSessionData() {
        console.log('💾 セッションデータ保存開始');
        
        try {
            if (window.AppState.conversationHistory.length > 0) {
                // セッションデータ構築
                const sessionData = {
                    theme: window.AppState.currentTheme,
                    conversationHistory: [...window.AppState.conversationHistory],
                    extractedKnowledge: [...window.AppState.extractedKnowledge],
                    startTime: window.AppState.sessionStartTime,
                    endTime: new Date()
                };
                
                // 全セッション履歴に追加
                window.AppState.allSessions.push(sessionData);
                
                // 知見永続化: LocalStorageに保存
                if (window.AppState.extractedKnowledge.length > 0) {
                    if (window.FukaboriKnowledgeDatabase) {
                        window.FukaboriKnowledgeDatabase.addSession({
                            theme: window.AppState.currentTheme,
                            insights: [...window.AppState.extractedKnowledge],
                            startTime: window.AppState.sessionStartTime
                        });
                        console.log('✅ 知見データベースに保存完了');
                    }
                }
                
                console.log('✅ セッションデータ保存完了');
            } else {
                console.log('📝 保存対象の会話履歴がありません');
            }
        } catch (error) {
            console.error('❌ セッションデータ保存エラー:', error);
        }
    },
    
    /**
     * セッション状態リセット
     * AppStateの完全なクリーンアップ
     */
    resetSessionState() {
        console.log('🔄 セッション状態リセット開始');
        
        try {
            // セッション状態のリセット
            window.AppState.sessionActive = false;
            window.AppState.phase = window.PHASES.CLOSING;
            window.AppState.currentSpeaker = window.SPEAKERS.NULL;
            
            console.log('✅ セッション状態リセット完了');
        } catch (error) {
            console.error('❌ セッション状態リセットエラー:', error);
        }
    },
    
    /**
     * セッション状態表示更新
     * UIの状態表示を更新
     */
    updateSessionStatus(status, theme) {
        try {
            if (typeof updateSessionStatus === 'function') {
                updateSessionStatus(status, theme);
            } else {
                console.warn('⚠️ updateSessionStatus関数が見つかりません');
            }
        } catch (error) {
            console.error('❌ セッション状態表示更新エラー:', error);
        }
    },
    
    /**
     * 音声コマンドによるセッション終了ハンドラー
     * 音声認識からの終了要求処理
     */
    async handleSessionEndCommand() {
        console.log('💡 音声コマンドによるセッション終了要求');
        return await this.endSession();
    },
    
    /**
     * ログイン画面復帰処理
     * セッションデータをリセットしてログイン画面に戻る
     */
    returnToLogin() {
        console.log('💡 SessionEndManager.returnToLogin が実行されました');
        
        const confirmed = confirm('ログイン画面に戻りますか？\n現在のセッションデータは失われますが、ログイン状態とテーマ設定は保持されます。');
        if (!confirmed) {
            return false;
        }
        
        try {
            // セッションデータをリセット（ただしログイン・テーマ状態は保持）
            window.AppState.conversationHistory = [];
            window.AppState.extractedKnowledge = [];
            window.AppState.currentTheme = ''; // セッション中のテーマをクリア
            window.AppState.phase = window.PHASES.SETUP;
            window.AppState.currentSpeaker = window.SPEAKERS.NULL;
            window.AppState.sessionActive = false;
            
            // UI状態をリセット
            this.updateSessionStatus('準備中...', '未設定');
            if (window.updateKnowledgeDisplay) {
                window.updateKnowledgeDisplay();
            }
            
            // 音声認識を停止
            if (window.AppState.speechRecognition && window.AppState.speechRecognition.stop) {
                window.AppState.speechRecognition.stop();
            }
            
            // チャット履歴をクリア
            const messagesContainer = window.UIManager?.DOMUtils?.get('messagesContainer');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            
            // ログイン画面を表示
            if (window.showLoginScreen) {
                window.showLoginScreen();
            }
            if (window.hideMainScreen) {
                window.hideMainScreen();
            }
            
            // 状態復元（ログイン・テーマ状態を保持）
            setTimeout(async () => {
                if (typeof restoreApplicationState === 'function') {
                    await restoreApplicationState();
                    console.log('🔄 ログイン画面復帰時の状態復元完了');
                }
            }, 100);
            
            console.log('✅ ログイン画面に戻りました（状態保持機能付き）');
            return true;
            
        } catch (error) {
            console.error('❌ ログイン画面復帰エラー:', error);
            return false;
        }
    }
};

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

// メインモジュールをグローバルに公開
window.SessionEndManager = SessionEndManager;

// 後方互換性のためのラッパー関数
window.endConversationSession = () => SessionEndManager.endSession();
window.generateFinalSummary = () => SessionEndManager.generateFinalSummary();
window.generateFinalGreeting = () => SessionEndManager.generateFinalGreeting();
window.handleSessionEnd = () => SessionEndManager.handleSessionEndCommand();
window.returnToLogin = () => SessionEndManager.returnToLogin();

console.log('✅ SessionEndManager モジュール初期化完了'); 