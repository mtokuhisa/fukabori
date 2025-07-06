/**
 * 深堀くん - 更新履歴データ
 * 全ての更新履歴を管理
 */

window.CHANGELOG_DATA = [
    {
        version: "v0.7.0",
        date: "2024-12-28",
        type: "major",
        title: "継続的音声認識システム完全修正 - マイク許可アラート問題解決",
        changes: [
            "🎯 マイク許可アラート完全解決（7-9回 → 1回・実際のユーザー体験で確認済み）",
            "🚀 start()呼び出し最適化（9回 → 1回・900%改善）",
            "📈 音声認識効率性向上（11% → 100%・909%改善）",
            "🎤 「マイク許可は一回だけ」ルール完全実現",
            "🔧 ContinuousRecognitionManager実装（真の継続的音声認識システム・556行）",
            "🛑 handleEnd()自動再開停止（マイク許可アラート根本原因解決）",
            "❌ immediateRestart()・preemptiveRestart()無効化（予期しない再開防止）",
            "📊 統計情報正確化（実際のマイク許可要求回数を正確表示）",
            "🧪 ContinuousRecognitionTester実装（自動テスト・監視システム・621行）",
            "🏆 A+～D品質グレード評価・マイク許可アラート自動カウント",
            "🎮 UIテストシステム完全実装（1,124行）",
            "📱 test-knowledge-file-manager.html（リアルタイム状態監視ダッシュボード）",
            "🔍 test-simple.html（シンプルテストUI・335行）",
            "🔄 統計リセット機能（quickResetStats()・現在セッション継続テスト対応）",
            "🎯 3階層テスト戦略確立（Tier 1:完全UI化・Tier 2:部分UI化・Tier 3:コンソール）",
            "🔧 リファクタリング成果統合（Phase 4-4-4完了・モーダル制御統合システム分離）",
            "⚡ app.js大幅軽量化（2,960→2,855行・3.5%削減・累計4,145行約59%削減）",
            "🏗️ 高品質モジュール群作成（evaluation-bridge.js・ui-helpers.js・modal-controller.js・global-exports.js）",
            "🎨 音声のみでの会話完全実現（会話に集中できる重要原則の実現）",
            "🛡️ 品質監視システム（リアルタイム品質評価・自動最適化機能）",
            "📊 合計新機能実装（約2,636行・継続的音声認識+自動テスト+UIテスト+統計機能）"
        ],
        category: ["継続的音声認識", "マイク許可", "自動テスト", "UIテスト", "統計管理", "品質監視", "リファクタリング", "音声UX", "システム最適化", "モジュール化"]
    },
    {
        version: "v0.6.0",
        date: "2025-06-30",
        type: "major",
        title: "Advanced Analytics - 高度分析機能実装",
        changes: [
            "🧬 Knowledge DNAシステム実装（AI知見整理・関係性分析）",
            "🎤 VoiceKnowledgeSystem実装（音声ベース知見品質評価）",
            "🎯 QualityAssessmentSystem実装（5段階詳細評価・自動記録閾値）",
            "📊 高度インフォグラフィック機能実装（Vis.js + Chart.js + D3.js）",
            "🌐 Knowledge DNAネットワーク可視化（セッション・知見関係性）",
            "📈 品質トレンド・AI強化進捗チャート生成",
            "🔗 関係性マトリクス・時系列パターン分析",
            "🗣️ 音声コマンド認識（閾値変更・設定確認等）",
            "🤖 詳細評価スピーチ（はほりーのによる品質説明）",
            "📋 統計管理強化（自動/手動/拒否件数追跡）",
            "🎨 深堀くんテーマ連動（5種テーマ対応）",
            "⚡ 完全独立InfographicSystemクラス（安全設計）",
            "🔄 非同期ライブラリ読み込み・代替表示",
            "🎛️ FukaboriKnowledgeDatabase グローバル公開"
        ],
        category: ["Knowledge DNA", "音声評価", "可視化", "AI分析", "インフォグラフィック", "品質管理", "ネットワーク分析"]
    },
    {
        version: "v0.5.3",
        date: "2025-06-27",
        type: "minor",
        title: "ファイル処理大幅強化・AI OCR実装",
        changes: [
            "script.jsのリファクタリング、ファイル分割",
            "マイク許可ダイアログ頻繁表示問題を完全修正（一回だけルール絶対遵守）",
            "Excel形式（.xlsx/.xls）対応追加（SheetJS v0.18.5使用）",
            "PDF・Word・PowerPoint完全対応（PDF.js/Mammoth/JSZip使用）",
            "AI OCR機能実装（OpenAI Vision API・画像化PDF対応）",
            "PDF処理品質向上（位置情報考慮・文字化け対策・品質監視）",
            "ファイル添付制御強化（未ログイン時完全無効化・視覚的フィードバック）",
            "カスタムファイル入力UI実装（分かりやすい状態表示）",
            "エラーUX大幅改善（専門用語排除・戻るボタン・詳細案内）",
            "テーマ選択デフォルト変更（全選択→未選択・ユーザー選択重視）",
            "段階的進行状況表示（ファイル形式別メッセージ・リアルタイム更新）",
            "動的ライブラリ読み込み最適化（初期読み込み時間への影響回避）",
            "音声認識安定化（自動再開間隔延長・エラー回復機能強化）"
        ],
        category: ["ファイル処理", "AI OCR", "音声認識", "UI/UX", "エラーハンドリング", "ログイン制御", "品質向上"]
    },
    {
        version: "v0.5.2",
        date: "2025-06-26",
        type: "minor",
        title: "ファイル処理大幅強化・AI OCR実装",
        changes: [
            "マイク許可ダイアログ頻繁表示問題を完全修正（一回だけルール絶対遵守）",
            "Excel形式（.xlsx/.xls）対応追加（SheetJS v0.18.5使用）",
            "PDF・Word・PowerPoint完全対応（PDF.js/Mammoth/JSZip使用）",
            "AI OCR機能実装（OpenAI Vision API・画像化PDF対応）",
            "PDF処理品質向上（位置情報考慮・文字化け対策・品質監視）",
            "ファイル添付制御強化（未ログイン時完全無効化・視覚的フィードバック）",
            "カスタムファイル入力UI実装（分かりやすい状態表示）",
            "エラーUX大幅改善（専門用語排除・戻るボタン・詳細案内）",
            "テーマ選択デフォルト変更（全選択→未選択・ユーザー選択重視）",
            "段階的進行状況表示（ファイル形式別メッセージ・リアルタイム更新）",
            "動的ライブラリ読み込み最適化（初期読み込み時間への影響回避）",
            "音声認識安定化（自動再開間隔延長・エラー回復機能強化）"
        ],
        category: ["ファイル処理", "AI OCR", "音声認識", "UI/UX", "エラーハンドリング", "ログイン制御", "品質向上"]
    },
    {
        version: "v0.5.1",
        date: "2025-06-25",
        type: "patch",
        title: "UI・UX修正とテーマ統一",
        changes: [
            "左ペイン縦書き表示問題を修正（!important CSS強制適用）",
            "右ペイン知見表示を2行・大文字に改善",
            "音声認識重複開始エラーを修正",
            "overview.html・changelog.htmlテーマ統一（ブルーガラス風）",
            "assets画像パス修正（正確なファイル名に対応）",
            "画像表示修正（fukabori_logo.png、nehori_avatar.png、hahori_avatar.png）",
            "changelog.htmlリンク機能確認・更新履歴反映"
        ],
        category: ["バグ修正", "UI改善", "デザイン統一", "画像表示", "ナビゲーション", "音声機能", "ファイル管理"]
    },
    {
        version: "v0.5.0",
        date: "2025-06-24",
        type: "major",
        title: "リファクタリング実装",
        changes: [
            "HTMLファイルを分離（5137行→軽量化）",
            "CSS・JavaScript統合ファイル作成",
            "設定管理システム統合",
            "プロンプト管理システム実装",
            "モジュール化アーキテクチャ導入",
            "メンテナンス性大幅向上",
            "ランチャー機能追加"
        ],
        category: ["アーキテクチャ", "メンテナンス性", "開発効率"]
    },
    {
        version: "v0.4.4",
        date: "2025-06-22",
        type: "minor",
        title: "ナビゲーション機能追加",
        changes: [
            "概要・技術仕様・更新履歴ページ追加",
            "ログイン画面にナビゲーションボタン設置",
            "CSV+JavaScript更新履歴システム",
            "統合開発ルール管理",
            "リンク管理システム実装",
            "CORSエラー対応"
        ],
        category: ["ナビゲーション", "データ管理", "開発ルール"]
    },
    {
        version: "v0.4.3",
        date: "2025-06-22",
        type: "minor",
        title: "UI改善とデザイン調整",
        changes: [
            "左ペインスクロール機能追加",
            "メインロゴの上下余白調整",
            "「AIパートナー」テキスト削除",
            "右ペインの項目順序変更",
            "レスポンシブ対応強化"
        ],
        category: ["UI/UX", "デザイン", "レスポンシブ"]
    },
    {
        version: "v0.4.2",
        date: "2025-06-22",
        type: "patch",
        title: "音声認識技術確認",
        changes: [
            "Web Speech API採用確認",
            "Whisper比較検討",
            "プライバシー保護強化",
            "コスト効率性確認",
            "リアルタイム性能最適化"
        ],
        category: ["音声認識", "技術選定", "性能"]
    },
    {
        version: "v0.4.1",
        date: "2025-06-22",
        type: "minor",
        title: "キャラクター機能強化",
        changes: [
            "ねほりーの・はほりーの個性強化",
            "キャラクター別プロンプト実装",
            "音声合成キャラクター対応",
            "対話スタイル差別化",
            "ユーザー選択機能追加"
        ],
        category: ["キャラクター", "AI", "音声合成"]
    },
    {
        version: "v0.4.0",
        date: "2025-06-21",
        type: "major",
        title: "音声合成機能実装",
        changes: [
            "OpenAI TTS API統合",
            "6種類の音声選択機能",
            "自動再生オプション",
            "音声速度調整",
            "音声品質最適化"
        ],
        category: ["音声合成", "TTS", "ユーザビリティ"]
    },
    {
        version: "v0.3.0",
        date: "2025-06-21",
        type: "major",
        title: "ファイルアップロード機能",
        changes: [
            "PDF・Word・テキスト対応",
            "ファイル内容解析",
            "文書ベース深掘り対話",
            "セキュリティ強化",
            "エラーハンドリング改善"
        ],
        category: ["ファイル処理", "文書解析", "セキュリティ"]
    },
    {
        version: "v0.2.2",
        date: "2025-06-21",
        type: "minor",
        title: "データ管理機能実装",
        changes: [
            "セッション保存・読み込み",
            "履歴管理システム",
            "データエクスポート機能",
            "暗号化ストレージ",
            "バックアップ機能"
        ],
        category: ["データ管理", "セキュリティ", "バックアップ"]
    },
    {
        version: "v0.2.1",
        date: "2025-06-21",
        type: "minor",
        title: "テーマシステム実装",
        changes: [
            "4種類テーマ追加",
            "ガラスモルフィズムデザイン",
            "ダークモード対応",
            "カラフルテーマ実装",
            "ユーザー設定保存"
        ],
        category: ["UI/UX", "テーマ", "デザイン"]
    },
    {
        version: "v0.2.0",
        date: "2025-06-21",
        type: "minor",
        title: "音声認識機能実装",
        changes: [
            "Web Speech API統合",
            "リアルタイム音声認識",
            "音声コマンド対応",
            "マイクボタン実装",
            "エラーハンドリング"
        ],
        category: ["音声認識", "リアルタイム", "UI"]
    },
    {
        version: "v0.1.0",
        date: "2025-06-21",
        type: "major",
        title: "初回リリース",
        changes: [
            "基本AI対話機能",
            "OpenAI API統合",
            "深掘りインタビュー機能",
            "知見抽出機能",
            "基本UI実装"
        ],
        category: ["基本機能", "AI対話", "初回リリース"]
    }
];

// 統計情報自動計算
window.CHANGELOG_STATS = {
    totalReleases: window.CHANGELOG_DATA.length,
    majorReleases: window.CHANGELOG_DATA.filter(item => item.type === 'major').length,
    minorReleases: window.CHANGELOG_DATA.filter(item => item.type === 'minor').length,
    patchReleases: window.CHANGELOG_DATA.filter(item => item.type === 'patch').length,
    totalChanges: window.CHANGELOG_DATA.reduce((sum, item) => sum + item.changes.length, 0),
    latestVersion: window.CHANGELOG_DATA[0].version,
    latestDate: window.CHANGELOG_DATA[0].date,
    developmentDays: Math.ceil((new Date(window.CHANGELOG_DATA[0].date) - new Date(window.CHANGELOG_DATA[window.CHANGELOG_DATA.length - 1].date)) / (1000 * 60 * 60 * 24)) + 1
};

console.log('📊 更新履歴データ読み込み完了:', window.CHANGELOG_STATS.totalReleases, '件'); 