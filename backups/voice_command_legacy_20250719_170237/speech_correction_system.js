// =================================================================================
// 音声訂正システム（SpeechCorrectionSystem）- バックアップ
// =================================================================================
// script.js 3899-4128行目より抽出
// 機能: 削除・置換コマンドの処理

const SpeechCorrectionSystem = {
    // 削除コマンドパターン
    deletionPatterns: [
        '削除', '消して', '文字消して', 'クリア',
        '間違い', 'やり直し', 'リセット', '文字削除',
        '消去', '文字消去', '全部削除', '全部消して'
    ],
    
    // 部分削除パターン（正規表現）
    partialDeletionPatterns: [
        /最後の(\d+)文字?削除/,
        /最後の(\d+)文字?消して/,
        /(\d+)文字?削除/,
        /(\d+)文字?消して/,
        /「(.+?)」削除/,
        /「(.+?)」消して/,
        /「(.+?)」を削除/,
        /「(.+?)」を消して/
    ],
    
    // 置換パターン
    replacementPatterns: [
        /^(.+?)は(.+?)の(.+?)にして$/,
        /^(.+?)を(.+?)にして$/,
        /^(.+?)は(.+?)にして$/,
        /^(.+?)を(.+?)に変えて$/,
        /^(.+?)を(.+?)に置き換えて$/
    ],
    
    // 現在の入力履歴
    currentInput: '',
    
    // 訂正コマンド検出
    detectCorrectionCommand(text) {
        const cleanText = text.trim();
        
        // 1. 削除コマンドチェック
        const deletionResult = this.checkDeletionCommand(cleanText);
        if (deletionResult) {
            return { type: 'deletion', ...deletionResult };
        }
        
        // 2. 置換コマンドチェック
        const replacementResult = this.checkReplacementCommand(cleanText);
        if (replacementResult) {
            return { type: 'replacement', ...replacementResult };
        }
        
        // 3. 通常の入力として処理
        return { type: 'normal', text: cleanText };
    },
    
    // 削除コマンドチェック
    checkDeletionCommand(text) {
        // 全削除パターン
        if (this.deletionPatterns.some(pattern => text === pattern)) {
            return { action: 'clear_all' };
        }
        
        // 部分削除パターン
        for (const pattern of this.partialDeletionPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[1] && !isNaN(match[1])) {
                    // 数字指定の削除
                    return { action: 'delete_characters', count: parseInt(match[1]) };
                } else if (match[1]) {
                    // 文字列指定の削除
                    return { action: 'delete_string', target: match[1] };
                }
            }
        }
        
        return null;
    },
    
    // 置換コマンドチェック
    checkReplacementCommand(text) {
        for (const pattern of this.replacementPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[3]) {
                    // 文脈付き置換: AはBのCにして
                    return {
                        action: 'replace_text',
                        target: match[1],
                        context: match[2],
                        replacement: match[3]
                    };
                } else if (match[2]) {
                    // 単純置換: AをBにして
                    return {
                        action: 'replace_text',
                        target: match[1],
                        replacement: match[2]
                    };
                }
            }
        }
        
        return null;
    },
    
    // 現在の入力を設定
    setCurrentInput(text) {
        this.currentInput = text || '';
        console.log('📝 現在の入力設定:', this.currentInput.substring(0, 50) + '...');
    },
    
    // 現在の入力を取得
    getCurrentInput() {
        return this.currentInput;
    },
    
    // 訂正処理の実行
    async executeCorrectionCommand(command) {
        console.log('🔧 音声訂正コマンド実行:', command);
        
        switch (command.action) {
            case 'clear_all':
                return this.clearAllText();
                
            case 'delete_characters':
                return this.deleteLastCharacters(command.count);
                
            case 'delete_string':
                return this.deleteSpecificString(command.target);
                
            case 'replace_text':
                return this.replaceText(command.target, command.replacement, command.context);
                
            default:
                return { success: false, message: '不明な訂正コマンドです' };
        }
    },
    
    // 全文削除
    clearAllText() {
        this.currentInput = '';
        return {
            success: true,
            feedback: '全て削除しました'
        };
    },
    
    // 末尾から指定文字数削除
    deleteLastCharacters(count) {
        if (!this.currentInput) {
            return {
                success: false,
                message: '削除する文字がありません'
            };
        }
        
        const originalLength = this.currentInput.length;
        this.currentInput = this.currentInput.substring(0, Math.max(0, originalLength - count));
        const deletedCount = originalLength - this.currentInput.length;
        
        return {
            success: true,
            feedback: `${deletedCount}文字削除しました`
        };
    },
    
    // 特定文字列削除
    deleteSpecificString(target) {
        if (!this.currentInput.includes(target)) {
            return {
                success: false,
                message: `「${target}」が見つかりません`
            };
        }
        
        this.currentInput = this.currentInput.replace(target, '');
        return {
            success: true,
            feedback: `「${target}」を削除しました`
        };
    },
    
    // テキスト置換
    replaceText(target, replacement, context = null) {
        if (!this.currentInput.includes(target)) {
            return {
                success: false,
                message: `「${target}」が見つかりません`
            };
        }
        
        if (context) {
            // 文脈を考慮した置換
            // 例: 「車内は会社の社内にして」
            // targetが複数ある場合、contextに近いものを優先
            const contextIndex = this.currentInput.indexOf(context);
            
            if (contextIndex === -1) {
                // 文脈が見つからない場合は通常の置換
                this.currentInput = this.currentInput.replace(target, replacement);
            } else {
                // 文脈の前後で最も近いtargetを置換
                const beforeContext = this.currentInput.substring(0, contextIndex);
                const afterContext = this.currentInput.substring(contextIndex);
                
                const targetInAfter = afterContext.indexOf(target);
                const targetInBefore = beforeContext.lastIndexOf(target);
                
                if (targetInAfter !== -1 && (targetInBefore === -1 || targetInAfter < beforeContext.length - targetInBefore)) {
                    // 文脈の後の方が近い
                    this.currentInput = beforeContext + afterContext.replace(target, replacement);
                } else if (targetInBefore !== -1) {
                    // 文脈の前の方が近い
                    const beforeTarget = beforeContext.substring(0, targetInBefore);
                    const afterTarget = beforeContext.substring(targetInBefore + target.length);
                    this.currentInput = beforeTarget + replacement + afterTarget + afterContext;
                }
            }
            
            return {
                success: true,
                feedback: `「${target}」を「${replacement}」に置き換えました`
            };
        } else {
            // 単純置換
            this.currentInput = this.currentInput.replace(target, replacement);
            return {
                success: true,
                feedback: `「${target}」を「${replacement}」に置き換えました`
            };
        }
    },
    
    // デバッグ用: 現在の入力を表示
    debugShowCurrentInput() {
        console.log('=== 現在の入力内容 ===');
        console.log(this.currentInput);
        console.log('文字数:', this.currentInput.length);
        console.log('===================');
    }
};

// グローバルテスト関数
window.testCorrectionCommand = (command) => {
    console.log('🧪 音声訂正コマンドテスト:', command);
    const result = SpeechCorrectionSystem.detectCorrectionCommand(command);
    console.log('結果:', result);
    return result;
}; 