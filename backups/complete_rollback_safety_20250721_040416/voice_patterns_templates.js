// =================================================================================
// 音声パターン・テンプレート定義 - バックアップ
// =================================================================================
// config/prompts.js 194-250行目より抽出
// 知見評価システム用の音声パターンとテンプレート

// 🎤 音声ベース知見評価用パターン
const VoicePatterns = {
    // 知見確認用コマンド（70点未満時）
    APPROVAL_PATTERNS: [
        'はい', 'OK', 'オーケー', 'いいです', 'そうです',
        '記録して', '保存して', 'その通り', '正しい', 'いいね'
    ],
    
    REJECTION_PATTERNS: [
        'いいえ', 'NO', 'ノー', '違う', '修正',
        'ちがいます', 'そうじゃない', 'やり直し', 'スキップ', '削除'
    ],
    
    DETAIL_PATTERNS: [
        '詳しく', '説明', '詳細', 'もっと',
        'なぜ', '理由', '根拠', '詳しく教えて'
    ],
    
    // 閾値変更用パターン
    THRESHOLD_PATTERNS: [
        /閾値を(\d+)点?に変更/,
        /基準を(\d+)点?にして/,
        /(\d+)点?以上で自動記録/,
        /設定を(\d+)に変更/
    ],
    
    // 設定確認パターン
    SETTINGS_INQUIRY_PATTERNS: [
        '現在の設定は', '設定を教えて', '閾値は何点',
        'いまの基準は', '設定確認', '現在の閾値は'
    ],
    
    // デフォルト復帰パターン
    DEFAULT_RESET_PATTERNS: [
        'デフォルトに戻して', '初期設定に戻して', '70点に戻して',
        'リセット', '設定をリセット'
    ],
    
    // 自動記録オフパターン
    AUTO_RECORD_OFF_PATTERNS: [
        '自動記録オフ', '全て確認', '全部確認して',
        '自動記録を停止', '手動確認のみ'
    ]
};

// 🎵 音声発話テンプレート
const VoiceTemplates = {
    // 自動記録時
    AUTO_RECORD: (knowledgeTitle, totalScore) => 
        `「${knowledgeTitle}」という知見を抽出しました。${totalScore}点の高評価でしたので、自動的に記録いたします。`,
    
    // 確認要求時
    CONFIRMATION_REQUEST: (knowledgeTitle, totalScore) => 
        `「${knowledgeTitle}」という知見を抽出しました。評価は${totalScore}点です。この知見を記録しますか？`,
    
    // 閾値変更確認
    THRESHOLD_CHANGE: (newThreshold) => 
        `承知いたしました。自動記録の基準を${newThreshold}点に変更しました。`,
    
    // 現在の設定通知
    CURRENT_SETTINGS: (threshold) => 
        `現在の自動記録基準は${threshold}点です。この点数以上の知見は自動的に記録されます。`,
    
    // 詳細説明
    DETAILED_EXPLANATION: (evaluation) => {
        const confidence = Math.round(evaluation.confidence * 100);
        const importance = Math.round(evaluation.importance * 100);
        const actionability = Math.round(evaluation.actionability * 100);
        
        return `この知見の詳細評価をお伝えします。
信頼性は${confidence}点で、${confidence >= 70 ? '具体的で根拠が明確' : '少し曖昧な部分がある'}です。
重要性は${importance}点で、${importance >= 70 ? 'ビジネス価値が高い' : '限定的な価値'}と評価されました。
実行可能性は${actionability}点で、${actionability >= 70 ? '他の人も活用しやすい' : '適用が限定的'}です。
${evaluation.reason}`;
    },
    
    // 知見承認時
    KNOWLEDGE_ACCEPTED: () => 
        `承知いたしました。知見を記録しました。`,
    
    // 知見拒否時
    KNOWLEDGE_REJECTED: () => 
        `承知いたしました。この知見は記録せずに次に進みます。`,
    
    // 認識エラー時
    RECOGNITION_ERROR: () => 
        `申し訳ございません、聞き取れませんでした。もう一度「はい」か「いいえ」でお答えください。`
};

// ========== 追加のパターン定義（その他の部分から収集）==========

// SmartVoicePanelManager関連のパターン
const VoiceCommandPatterns = {
    // 基本コマンド
    BASIC_COMMANDS: {
        permission: 'どうぞ',
        end_session: ['終了して', 'おわりして', 'セッション終了'],
        theme_change: ['テーマ変更', 'テーマを変え'],
        question_change: ['質問変更', '質問を変え', '別の質問'],
    },
    
    // 文字編集コマンド
    EDIT_COMMANDS: {
        delete_all: ['削除', '消して', 'クリア'],
        delete_old: ['文字消して', 'もじけして', 'クリアして'],
        replacement: '置換'
    },
    
    // 承認関連（汎用）
    GENERAL_APPROVAL: ['どうぞ', 'ドウゾ', 'どーぞ'],
    
    // 状態依存コマンド
    CONTEXTUAL_COMMANDS: {
        waiting_permission: 'どうぞ',
        knowledge_confirmation: ['はい/いいえ', '詳しく'],
        session_active: ['終了して', '質問変更', 'テーマ変更']
    }
};

// ========== バックアップ情報 ==========
// 抽出元:
// - config/prompts.js（VoicePatterns, VoiceTemplates）
// - app/script.js（コマンドパターン定義）
// 
// 用途:
// - 知見評価システムでの音声コマンド認識
// - 承認・拒否・設定変更の処理
// - 音声フィードバックのテンプレート 