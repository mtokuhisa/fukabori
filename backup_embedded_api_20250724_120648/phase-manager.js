// =================================================================================
// PHASE MANAGER - フェーズ管理システム
// =================================================================================
// 単一責任: フェーズ管理の完全な処理（定義→遷移→状態管理→UI更新）
// 新ルール適用: 行数制限なし、単一機能の完全な処理に限定

/**
 * フェーズ管理システム
 * 責任範囲: アプリケーションフェーズの完全なライフサイクル管理
 */
const PhaseManager = {
    
    /**
     * フェーズ定義
     * アプリケーションの状態遷移を定義
     */
    PHASES: {
        SETUP: 'setup',
        WARMUP: 'warmup',
        DEEPDIVE: 'deepdive',
        SUMMARY: 'summary',
        CLOSING: 'closing'
    },
    
    /**
     * フェーズ遷移マップ
     * 許可されたフェーズ遷移を定義
     */
    PHASE_TRANSITIONS: {
        setup: ['warmup'],
        warmup: ['deepdive'],
        deepdive: ['summary'],
        summary: ['closing'],
        closing: ['setup']
    },
    
    /**
     * フェーズ表示名マップ
     * UI表示用の日本語名
     */
    PHASE_DISPLAY_NAMES: {
        setup: '準備中',
        warmup: 'ウォームアップ中',
        deepdive: '深掘り中',
        summary: 'まとめ中',
        closing: '終了中'
    },
    
    /**
     * フェーズ状態管理
     * 現在のフェーズ状態を管理
     */
    state: {
        currentPhase: 'setup',
        previousPhase: null,
        transitionInProgress: false,
        transitionStartTime: null,
        phaseHistory: []
    },
    
    /**
     * フェーズ初期化
     * フェーズ管理システムを初期化
     */
    initialize() {
        console.log('🎯 PhaseManager 初期化開始');
        
        try {
            // 状態初期化
            this.state.currentPhase = this.PHASES.SETUP;
            this.state.previousPhase = null;
            this.state.transitionInProgress = false;
            this.state.transitionStartTime = null;
            this.state.phaseHistory = [];
            
            // AppStateとの同期
            if (window.AppState) {
                window.AppState.phase = this.PHASES.SETUP;
            }
            
            console.log('✅ PhaseManager 初期化完了');
            return true;
            
        } catch (error) {
            console.error('❌ PhaseManager 初期化エラー:', error);
            return false;
        }
    },
    
    /**
     * フェーズ遷移実行
     * 指定されたフェーズへの遷移を実行
     */
    async transitionToPhase(targetPhase, context = {}) {
        console.log(`🎯 フェーズ遷移開始: ${this.state.currentPhase} → ${targetPhase}`);
        
        // 遷移中チェック
        if (this.state.transitionInProgress) {
            console.warn('⚠️ フェーズ遷移が既に進行中です');
            return false;
        }
        
        // 遷移可能性チェック
        if (!this.canTransitionTo(targetPhase)) {
            console.error(`❌ 不正なフェーズ遷移: ${this.state.currentPhase} → ${targetPhase}`);
            return false;
        }
        
        try {
            // 遷移開始
            this.state.transitionInProgress = true;
            this.state.transitionStartTime = new Date();
            
            // 遷移前処理
            await this.executePreTransitionActions(this.state.currentPhase, targetPhase, context);
            
            // フェーズ変更
            this.state.previousPhase = this.state.currentPhase;
            this.state.currentPhase = targetPhase;
            
            // AppStateとの同期
            if (window.AppState) {
                window.AppState.phase = targetPhase;
            }
            
            // 履歴記録
            this.state.phaseHistory.push({
                fromPhase: this.state.previousPhase,
                toPhase: targetPhase,
                timestamp: new Date(),
                context: context
            });
            
            // 遷移後処理
            await this.executePostTransitionActions(this.state.previousPhase, targetPhase, context);
            
            // UI更新
            this.updatePhaseUI(targetPhase, context);
            
            console.log(`✅ フェーズ遷移完了: ${this.state.previousPhase} → ${targetPhase}`);
            return true;
            
        } catch (error) {
            console.error('❌ フェーズ遷移エラー:', error);
            return false;
        } finally {
            // 遷移完了
            this.state.transitionInProgress = false;
            this.state.transitionStartTime = null;
        }
    },
    
    /**
     * フェーズ遷移可能性チェック
     * 指定されたフェーズへの遷移が可能かチェック
     */
    canTransitionTo(targetPhase) {
        const currentPhase = this.state.currentPhase;
        const allowedTransitions = this.PHASE_TRANSITIONS[currentPhase] || [];
        
        // 同じフェーズへの遷移は許可（状態更新のため）
        if (currentPhase === targetPhase) {
            return true;
        }
        
        // 許可された遷移かチェック
        return allowedTransitions.includes(targetPhase);
    },
    
    /**
     * 遷移前処理実行
     * フェーズ遷移前の処理を実行
     */
    async executePreTransitionActions(fromPhase, toPhase, context) {
        console.log(`🔄 遷移前処理実行: ${fromPhase} → ${toPhase}`);
        
        try {
            // フェーズ別の遷移前処理
            switch (fromPhase) {
                case this.PHASES.SETUP:
                    await this.handleSetupExit(context);
                    break;
                case this.PHASES.WARMUP:
                    await this.handleWarmupExit(context);
                    break;
                case this.PHASES.DEEPDIVE:
                    await this.handleDeepdiveExit(context);
                    break;
                case this.PHASES.SUMMARY:
                    await this.handleSummaryExit(context);
                    break;
                case this.PHASES.CLOSING:
                    await this.handleClosingExit(context);
                    break;
            }
            
            console.log(`✅ 遷移前処理完了: ${fromPhase}`);
            
        } catch (error) {
            console.error(`❌ 遷移前処理エラー (${fromPhase}):`, error);
            throw error;
        }
    },
    
    /**
     * 遷移後処理実行
     * フェーズ遷移後の処理を実行
     */
    async executePostTransitionActions(fromPhase, toPhase, context) {
        console.log(`🔄 遷移後処理実行: ${fromPhase} → ${toPhase}`);
        
        try {
            // フェーズ別の遷移後処理
            switch (toPhase) {
                case this.PHASES.SETUP:
                    await this.handleSetupEntry(context);
                    break;
                case this.PHASES.WARMUP:
                    await this.handleWarmupEntry(context);
                    break;
                case this.PHASES.DEEPDIVE:
                    await this.handleDeepdiveEntry(context);
                    break;
                case this.PHASES.SUMMARY:
                    await this.handleSummaryEntry(context);
                    break;
                case this.PHASES.CLOSING:
                    await this.handleClosingEntry(context);
                    break;
            }
            
            console.log(`✅ 遷移後処理完了: ${toPhase}`);
            
        } catch (error) {
            console.error(`❌ 遷移後処理エラー (${toPhase}):`, error);
            throw error;
        }
    },
    
    /**
     * セットアップフェーズ退出処理
     */
    async handleSetupExit(context) {
        console.log('🔄 セットアップフェーズ退出処理');
        // セットアップ終了時の処理（必要に応じて実装）
    },
    
    /**
     * ウォームアップフェーズ退出処理
     */
    async handleWarmupExit(context) {
        console.log('🔄 ウォームアップフェーズ退出処理');
        // ウォームアップ終了時の処理（必要に応じて実装）
    },
    
    /**
     * 深掘りフェーズ退出処理
     */
    async handleDeepdiveExit(context) {
        console.log('🔄 深掘りフェーズ退出処理');
        // 深掘り終了時の処理（必要に応じて実装）
    },
    
    /**
     * まとめフェーズ退出処理
     */
    async handleSummaryExit(context) {
        console.log('🔄 まとめフェーズ退出処理');
        // まとめ終了時の処理（必要に応じて実装）
    },
    
    /**
     * 終了フェーズ退出処理
     */
    async handleClosingExit(context) {
        console.log('🔄 終了フェーズ退出処理');
        // 終了フェーズ退出時の処理（必要に応じて実装）
    },
    
    /**
     * セットアップフェーズ入場処理
     */
    async handleSetupEntry(context) {
        console.log('🔄 セットアップフェーズ入場処理');
        // セットアップ開始時の処理（必要に応じて実装）
    },
    
    /**
     * ウォームアップフェーズ入場処理
     */
    async handleWarmupEntry(context) {
        console.log('🔄 ウォームアップフェーズ入場処理');
        // ウォームアップ開始時の処理（必要に応じて実装）
    },
    
    /**
     * 深掘りフェーズ入場処理
     */
    async handleDeepdiveEntry(context) {
        console.log('🔄 深掘りフェーズ入場処理');
        // 深掘り開始時の処理（必要に応じて実装）
    },
    
    /**
     * まとめフェーズ入場処理
     */
    async handleSummaryEntry(context) {
        console.log('🔄 まとめフェーズ入場処理');
        // まとめ開始時の処理（必要に応じて実装）
    },
    
    /**
     * 終了フェーズ入場処理
     */
    async handleClosingEntry(context) {
        console.log('🔄 終了フェーズ入場処理');
        // 終了開始時の処理（必要に応じて実装）
    },
    
    /**
     * フェーズUI更新
     * フェーズ変更に応じてUIを更新
     */
    updatePhaseUI(phase, context = {}) {
        console.log(`🎨 フェーズUI更新: ${phase}`);
        
        try {
            // セッション状態表示の更新
            const displayName = this.PHASE_DISPLAY_NAMES[phase] || phase;
            const theme = context.theme || window.AppState?.currentTheme || '未設定';
            
            // updateSessionStatus関数の呼び出し
            if (typeof updateSessionStatus === 'function') {
                updateSessionStatus(displayName, theme);
            } else {
                console.warn('⚠️ updateSessionStatus関数が見つかりません');
            }
            
            // フェーズ固有のUI更新
            this.updatePhaseSpecificUI(phase, context);
            
            console.log(`✅ フェーズUI更新完了: ${phase}`);
            
        } catch (error) {
            console.error('❌ フェーズUI更新エラー:', error);
        }
    },
    
    /**
     * フェーズ固有UI更新
     * 各フェーズに特化したUI更新
     */
    updatePhaseSpecificUI(phase, context) {
        switch (phase) {
            case this.PHASES.SETUP:
                this.updateSetupUI(context);
                break;
            case this.PHASES.WARMUP:
                this.updateWarmupUI(context);
                break;
            case this.PHASES.DEEPDIVE:
                this.updateDeepdiveUI(context);
                break;
            case this.PHASES.SUMMARY:
                this.updateSummaryUI(context);
                break;
            case this.PHASES.CLOSING:
                this.updateClosingUI(context);
                break;
        }
    },
    
    /**
     * セットアップUI更新
     */
    updateSetupUI(context) {
        console.log('🎨 セットアップUI更新');
        // セットアップ時のUI更新（必要に応じて実装）
    },
    
    /**
     * ウォームアップUI更新
     */
    updateWarmupUI(context) {
        console.log('🎨 ウォームアップUI更新');
        // ウォームアップ時のUI更新（必要に応じて実装）
    },
    
    /**
     * 深掘りUI更新
     */
    updateDeepdiveUI(context) {
        console.log('🎨 深掘りUI更新');
        // 深掘り時のUI更新（必要に応じて実装）
    },
    
    /**
     * まとめUI更新
     */
    updateSummaryUI(context) {
        console.log('🎨 まとめUI更新');
        // まとめ時のUI更新（必要に応じて実装）
    },
    
    /**
     * 終了UI更新
     */
    updateClosingUI(context) {
        console.log('🎨 終了UI更新');
        // 終了時のUI更新（必要に応じて実装）
    },
    
    /**
     * 現在のフェーズ取得
     */
    getCurrentPhase() {
        return this.state.currentPhase;
    },
    
    /**
     * 前のフェーズ取得
     */
    getPreviousPhase() {
        return this.state.previousPhase;
    },
    
    /**
     * フェーズ履歴取得
     */
    getPhaseHistory() {
        return [...this.state.phaseHistory];
    },
    
    /**
     * フェーズ状態取得
     */
    getPhaseState() {
        return {
            currentPhase: this.state.currentPhase,
            previousPhase: this.state.previousPhase,
            transitionInProgress: this.state.transitionInProgress,
            transitionStartTime: this.state.transitionStartTime,
            phaseHistory: this.getPhaseHistory()
        };
    },
    
    /**
     * フェーズリセット
     * フェーズ状態を初期状態にリセット
     */
    resetPhase() {
        console.log('🔄 フェーズリセット実行');
        
        try {
            this.state.currentPhase = this.PHASES.SETUP;
            this.state.previousPhase = null;
            this.state.transitionInProgress = false;
            this.state.transitionStartTime = null;
            this.state.phaseHistory = [];
            
            // AppStateとの同期
            if (window.AppState) {
                window.AppState.phase = this.PHASES.SETUP;
            }
            
            // UI更新
            this.updatePhaseUI(this.PHASES.SETUP);
            
            console.log('✅ フェーズリセット完了');
            return true;
            
        } catch (error) {
            console.error('❌ フェーズリセットエラー:', error);
            return false;
        }
    },
    
    /**
     * フェーズ診断
     * 現在のフェーズ状態を診断
     */
    diagnosePhase() {
        const diagnosis = {
            currentPhase: this.state.currentPhase,
            previousPhase: this.state.previousPhase,
            transitionInProgress: this.state.transitionInProgress,
            appStatePhase: window.AppState?.phase,
            syncStatus: this.state.currentPhase === window.AppState?.phase ? 'synced' : 'out_of_sync',
            phaseHistoryCount: this.state.phaseHistory.length,
            lastTransition: this.state.phaseHistory[this.state.phaseHistory.length - 1] || null
        };
        
        console.log('📊 フェーズ診断結果:', diagnosis);
        return diagnosis;
    }
};

// =================================================================================
// GLOBAL EXPORTS - グローバル公開
// =================================================================================

// メインモジュールをグローバルに公開
window.PhaseManager = PhaseManager;

// PHASES定数をグローバルに公開（後方互換性）
window.PHASES = PhaseManager.PHASES;

// 後方互換性のためのヘルパー関数
window.getCurrentPhase = () => PhaseManager.getCurrentPhase();
window.transitionToPhase = (phase, context) => PhaseManager.transitionToPhase(phase, context);
window.resetPhase = () => PhaseManager.resetPhase();

console.log('✅ PhaseManager モジュール初期化完了'); 