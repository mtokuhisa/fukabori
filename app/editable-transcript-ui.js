/**
 * EditableTranscriptUI - リアルタイム文字起こし編集UI制御システム
 * =====================================================================
 * 
 * 【責任範囲】
 * - contenteditable制御（有効化・無効化）
 * - イベントハンドリング（キーボード・マウス操作）
 * - 視覚フィードバック（編集状態の表示）
 * - DOM操作の最適化（性能重視）
 * 
 * 【設計原則】
 * - UI専用コンポーネント（ビジネスロジック分離）
 * - 性能最適化（contenteditable使用による負荷を最小化）
 * - アクセシビリティ対応（キーボード操作支援）
 * - 既存デザインとの調和（深堀くんUIとの統合）
 * 
 * バージョン: v1.0 (Phase A)
 * 作成日: 2025年7月24日
 */

(function(global) {
    'use strict';
    
    // =================================================================================
    // UI CONFIGURATION - UI設定
    // =================================================================================
    
    const EDITABLE_UI_CONFIG = {
        // 編集状態の視覚スタイル
        EDITING_STYLES: {
            border: '2px solid #3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            outline: 'none',
            cursor: 'text'
        },
        
        // 非編集状態のスタイル
        NORMAL_STYLES: {
            border: '4px solid #3498db', // 元のスタイルを維持
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            cursor: 'pointer'
        },
        
        // アニメーション設定
        TRANSITION_DURATION: '0.2s',
        
        // プレースホルダー
        EDIT_PLACEHOLDER: '文字起こし内容を編集できます...（ESC: キャンセル, Enter: 完了）',
        
        // デバッグモード
        DEBUG_MODE: true
    };
    
    // =================================================================================
    // MAIN CLASS - EditableTranscriptUI
    // =================================================================================
    
    class EditableTranscriptUI {
        constructor(transcriptElement) {
            this.element = transcriptElement;
            this.isContentEditable = false;
            this.originalStyles = {};
            this.editingIndicator = null;
            
            // イベントリスナー参照保持（削除用）
            this.eventListeners = new Map();
            
            // 初期状態の保存
            this.saveOriginalStyles();
            
            console.log('🎨 EditableTranscriptUI 初期化完了');
        }
        
        // =============================================================================
        // INITIALIZATION - 初期化
        // =============================================================================
        
        /**
         * 元のスタイルを保存
         */
        saveOriginalStyles() {
            if (!this.element) return;
            
            const computedStyle = window.getComputedStyle(this.element);
            this.originalStyles = {
                border: this.element.style.border || computedStyle.border,
                backgroundColor: this.element.style.backgroundColor || computedStyle.backgroundColor,
                outline: this.element.style.outline || computedStyle.outline,
                cursor: this.element.style.cursor || computedStyle.cursor,
                contentEditable: this.element.contentEditable
            };
            
            if (EDITABLE_UI_CONFIG.DEBUG_MODE) {
                console.log('💾 元のスタイル保存完了:', this.originalStyles);
            }
        }
        
        // =============================================================================
        // CONTENTEDITABLE CONTROL - contenteditable制御
        // =============================================================================
        
        /**
         * 編集モード有効化
         */
        enableEditing() {
            if (!this.element) {
                console.error('❌ transcriptDisplay要素が見つかりません');
                return false;
            }
            
            if (this.isContentEditable) {
                console.log('⚠️ 既に編集モードです');
                return true;
            }
            
            try {
                console.log('🎯 編集モード有効化開始');
                
                // contenteditable有効化
                this.element.contentEditable = 'true';
                this.isContentEditable = true;
                
                // 編集用スタイル適用
                this.applyEditingStyles();
                
                // 編集状態インジケーター表示
                this.showEditingIndicator();
                
                // イベントリスナー設定
                this.setupEditingEventListeners();
                
                // フォーカス設定
                this.element.focus();
                
                // カーソルを末尾に移動
                this.setCursorToEnd();
                
                console.log('✅ 編集モード有効化完了');
                return true;
                
            } catch (error) {
                console.error('❌ 編集モード有効化エラー:', error);
                this.disableEditing(); // 失敗時はクリーンアップ
                return false;
            }
        }
        
        /**
         * 編集モード無効化
         */
        disableEditing() {
            if (!this.element) return true;
            
            try {
                console.log('🎯 編集モード無効化開始');
                
                // contenteditable無効化
                this.element.contentEditable = 'false';
                this.isContentEditable = false;
                
                // 元のスタイルに復元
                this.restoreOriginalStyles();
                
                // 編集状態インジケーター非表示
                this.hideEditingIndicator();
                
                // イベントリスナー削除
                this.removeEditingEventListeners();
                
                // フォーカス解除
                this.element.blur();
                
                console.log('✅ 編集モード無効化完了');
                return true;
                
            } catch (error) {
                console.error('❌ 編集モード無効化エラー:', error);
                return false;
            }
        }
        
        // =============================================================================
        // STYLE MANAGEMENT - スタイル管理
        // =============================================================================
        
        /**
         * 編集用スタイル適用
         */
        applyEditingStyles() {
            if (!this.element) return;
            
            // CSS Transitionを設定
            this.element.style.transition = `all ${EDITABLE_UI_CONFIG.TRANSITION_DURATION} ease`;
            
            // 編集用スタイルを適用
            Object.assign(this.element.style, EDITABLE_UI_CONFIG.EDITING_STYLES);
            
            // プレースホルダー属性設定（空の場合）
            if (!this.element.textContent.trim()) {
                this.element.setAttribute('data-placeholder', EDITABLE_UI_CONFIG.EDIT_PLACEHOLDER);
                this.element.classList.add('editing-placeholder');
            }
            
            if (EDITABLE_UI_CONFIG.DEBUG_MODE) {
                console.log('🎨 編集用スタイル適用完了');
            }
        }
        
        /**
         * 元のスタイルに復元
         */
        restoreOriginalStyles() {
            if (!this.element) return;
            
            // 保存されたスタイルを復元
            Object.assign(this.element.style, EDITABLE_UI_CONFIG.NORMAL_STYLES);
            
            // プレースホルダー関連をクリーンアップ
            this.element.removeAttribute('data-placeholder');
            this.element.classList.remove('editing-placeholder');
            
            // Transition削除
            this.element.style.transition = '';
            
            if (EDITABLE_UI_CONFIG.DEBUG_MODE) {
                console.log('🔄 元のスタイル復元完了');
            }
        }
        
        // =============================================================================
        // EVENT HANDLING - イベントハンドリング
        // =============================================================================
        
        /**
         * 編集用イベントリスナー設定
         */
        setupEditingEventListeners() {
            if (!this.element) return;
            
            // キーボードイベント
            const keydownHandler = (event) => this.handleKeyEvents(event);
            this.element.addEventListener('keydown', keydownHandler);
            this.eventListeners.set('keydown', keydownHandler);
            
            // 入力イベント（リアルタイム検証用）
            const inputHandler = (event) => this.handleInputEvents(event);
            this.element.addEventListener('input', inputHandler);
            this.eventListeners.set('input', inputHandler);
            
            // フォーカスアウトイベント
            const blurHandler = (event) => this.handleBlurEvents(event);
            this.element.addEventListener('blur', blurHandler);
            this.eventListeners.set('blur', blurHandler);
            
            // ペーストイベント
            const pasteHandler = (event) => this.handlePasteEvents(event);
            this.element.addEventListener('paste', pasteHandler);
            this.eventListeners.set('paste', pasteHandler);
            
            console.log('👂 編集用イベントリスナー設定完了');
        }
        
        /**
         * 編集用イベントリスナー削除
         */
        removeEditingEventListeners() {
            if (!this.element) return;
            
            this.eventListeners.forEach((handler, eventType) => {
                this.element.removeEventListener(eventType, handler);
            });
            this.eventListeners.clear();
            
            console.log('🚫 編集用イベントリスナー削除完了');
        }
        
        /**
         * キーイベント処理
         */
        handleKeyEvents(event) {
            if (!this.isContentEditable) return;
            
            switch (event.key) {
                case 'Enter':
                    if (!event.shiftKey) {
                        // Enterキー単体: 編集完了
                        event.preventDefault();
                        this.triggerEditComplete();
                    }
                    // Shift+Enter: 改行（デフォルト動作）
                    break;
                    
                case 'Escape':
                    // ESCキー: 編集キャンセル
                    event.preventDefault();
                    this.triggerEditCancel();
                    break;
                    
                case 'Tab':
                    // Tabキー: 編集完了
                    event.preventDefault();
                    this.triggerEditComplete();
                    break;
                    
                default:
                    // その他のキー: プレースホルダー管理
                    this.managePlaceholder();
                    break;
            }
        }
        
        /**
         * 入力イベント処理
         */
        handleInputEvents(event) {
            // プレースホルダー管理
            this.managePlaceholder();
            
            // リアルタイム検証（必要に応じて）
            this.validateInput();
        }
        
        /**
         * フォーカスアウトイベント処理
         */
        handleBlurEvents(event) {
            // 編集完了として処理（オプション）
            // NOTE: ユーザビリティを考慮して無効化可能
            if (EDITABLE_UI_CONFIG.AUTO_COMPLETE_ON_BLUR) {
                this.triggerEditComplete();
            }
        }
        
        /**
         * ペーストイベント処理
         */
        handlePasteEvents(event) {
            // プレーンテキストのみ許可
            event.preventDefault();
            
            const paste = (event.clipboardData || window.clipboardData).getData('text');
            const cleanPaste = this.sanitizeText(paste);
            
            // カーソル位置に挿入
            document.execCommand('insertText', false, cleanPaste);
            
            console.log('📋 ペースト処理完了:', cleanPaste.substring(0, 50));
        }
        
        // =============================================================================
        // UI FEEDBACK - 視覚フィードバック
        // =============================================================================
        
        /**
         * 編集状態インジケーター表示
         */
        showEditingIndicator() {
            // 既存のインジケーターがあれば削除
            this.hideEditingIndicator();
            
            // 新しいインジケーター作成
            this.editingIndicator = document.createElement('div');
            this.editingIndicator.className = 'transcript-editing-indicator';
            this.editingIndicator.innerHTML = '✏️ 編集中...（ESC: キャンセル, Enter: 完了）';
            
            // スタイル設定
            Object.assign(this.editingIndicator.style, {
                position: 'absolute',
                top: '-25px',
                left: '0',
                fontSize: '12px',
                color: '#3498db',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: '1000',
                animation: 'fadeIn 0.2s ease'
            });
            
            // 要素の親に追加
            if (this.element.parentElement) {
                this.element.parentElement.style.position = 'relative';
                this.element.parentElement.appendChild(this.editingIndicator);
            }
            
            console.log('📍 編集インジケーター表示');
        }
        
        /**
         * 編集状態インジケーター非表示
         */
        hideEditingIndicator() {
            if (this.editingIndicator) {
                this.editingIndicator.remove();
                this.editingIndicator = null;
                console.log('🚫 編集インジケーター非表示');
            }
        }
        
        // =============================================================================
        // UTILITY FUNCTIONS - ユーティリティ関数
        // =============================================================================
        
        /**
         * カーソルを末尾に移動
         */
        setCursorToEnd() {
            if (!this.element) return;
            
            try {
                const range = document.createRange();
                const selection = window.getSelection();
                
                range.selectNodeContents(this.element);
                range.collapse(false); // 末尾に移動
                
                selection.removeAllRanges();
                selection.addRange(range);
                
                if (EDITABLE_UI_CONFIG.DEBUG_MODE) {
                    console.log('🎯 カーソル末尾移動完了');
                }
            } catch (error) {
                console.error('❌ カーソル移動エラー:', error);
            }
        }
        
        /**
         * プレースホルダー管理
         */
        managePlaceholder() {
            if (!this.element) return;
            
            const hasContent = this.element.textContent.trim().length > 0;
            
            if (hasContent) {
                this.element.classList.remove('editing-placeholder');
            } else {
                this.element.classList.add('editing-placeholder');
            }
        }
        
        /**
         * テキストサニタイズ
         */
        sanitizeText(text) {
            // HTMLタグ除去、改行正規化
            return text.replace(/<[^>]*>/g, '').replace(/\r\n/g, '\n');
        }
        
        /**
         * 入力検証
         */
        validateInput() {
            // 文字数制限などの検証（必要に応じて実装）
            const text = this.element.textContent || '';
            const maxLength = 2000; // 最大文字数
            
            if (text.length > maxLength) {
                console.warn('⚠️ 文字数制限超過:', text.length);
                // 制限超過時の処理（必要に応じて）
            }
        }
        
        /**
         * 編集完了トリガー
         */
        triggerEditComplete() {
            console.log('✅ 編集完了トリガー');
            
            // カスタムイベント発火
            const event = new CustomEvent('transcriptEditComplete', {
                detail: {
                    text: this.element.textContent || '',
                    originalText: this.originalText
                }
            });
            this.element.dispatchEvent(event);
        }
        
        /**
         * 編集キャンセルトリガー
         */
        triggerEditCancel() {
            console.log('🚫 編集キャンセルトリガー');
            
            // カスタムイベント発火
            const event = new CustomEvent('transcriptEditCancel');
            this.element.dispatchEvent(event);
        }
        
        // =============================================================================
        // STATE & DEBUG - 状態・デバッグ
        // =============================================================================
        
        /**
         * 現在の状態取得
         */
        getState() {
            return {
                isContentEditable: this.isContentEditable,
                hasElement: !!this.element,
                hasEditingIndicator: !!this.editingIndicator,
                currentText: this.element?.textContent || '',
                eventListenersCount: this.eventListeners.size
            };
        }
        
        /**
         * デバッグ状態出力
         */
        debugStatus() {
            if (!EDITABLE_UI_CONFIG.DEBUG_MODE) return;
            
            console.log('🔍 EditableTranscriptUI デバッグ状態:');
            console.table(this.getState());
        }
    }
    
    // =================================================================================
    // CSS INJECTION - スタイル注入
    // =================================================================================
    
    // 編集関連のCSSスタイルを動的に注入
    function injectEditingStyles() {
        const existingStyle = document.getElementById('transcript-editing-styles');
        if (existingStyle) return; // 既に注入済み
        
        const style = document.createElement('style');
        style.id = 'transcript-editing-styles';
        style.textContent = `
            /* リアルタイム文字起こし編集用スタイル */
            .transcript-display[contenteditable="true"] {
                min-height: 80px;
                resize: vertical;
                overflow-y: auto;
            }
            
            .transcript-display.editing-placeholder::before {
                content: attr(data-placeholder);
                color: #999;
                font-style: italic;
                pointer-events: none;
            }
            
            .transcript-display.editing-placeholder:focus::before {
                display: none;
            }
            
            /* フェードインアニメーション */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            
            /* 編集インジケーター */
            .transcript-editing-indicator {
                user-select: none;
                pointer-events: none;
            }
        `;
        
        document.head.appendChild(style);
        console.log('🎨 編集用CSSスタイル注入完了');
    }
    
    // =================================================================================
    // GLOBAL EXPORT - グローバル公開
    // =================================================================================
    
    // スタイル注入実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectEditingStyles);
    } else {
        injectEditingStyles();
    }
    
    // グローバルに公開
    global.EditableTranscriptUI = EditableTranscriptUI;
    global.EDITABLE_UI_CONFIG = EDITABLE_UI_CONFIG;
    
    console.log('✅ editable-transcript-ui.js 読み込み完了');

})(window); 