/**
 * 深堀くん - 更新履歴データ
 * 全ての更新履歴を管理
 */

window.CHANGELOG_DATA = [
    {
        version: "v0.7.6",
        date: "2025-07-26",
        type: "major",
        title: "リアルタイム文字起こし編集機能実装 - ユーザー修正機能追加",
        changes: [
            "🎯 ユーザーによる文字起こし内容の修正機能追加（Phase A完了・実用レベル達成）",
            "📝 TranscriptEditManager実装（完全新規・編集状態管理・音声認識統合制御）",
            "🎨 EditableTranscriptUI実装（contenteditable制御・視覚フィードバック・キーボード操作）",
            "🔄 StateUpdateController実装（循環参照防止・アトミック状態更新・同期制御）",
            "⚡ リアルタイム編集機能（文字起こし表示の直接編集・即時反映・元文章復元防止）",
            "🎵 音声認識統合（編集中の自動制御・既存一時停止ボタンとの完全連携）",
            "📊 AppState完全同期（currentTranscript・transcriptHistory統合更新・データ整合性保証）",
            "🔧 統一状態管理強化（既存システムとの完全統合・緊急無効化機能・安全性向上）",
            "✨ 編集UI実装（編集状態の視覚表示・境界線強調・プレースホルダー表示）",
            "⌨️ キーボード操作対応（ESC: 編集キャンセル・Shift+Enter: 編集完了・直感的操作）",
            "🛡️ 性能最適化完了（contenteditable影響1.46倍・LOWリスクレベル・実装GO判定）",
            "🎯 段階的実装設計（Phase A基本機能完了・Phase B一時停止統合準備・Phase Cキーボード会話準備）",
            "📋 実装統計（TranscriptEditManager: 759行・EditableTranscriptUI: 588行・新規機能約1,347行）",
            "🧪 包括的テストフレームワーク（性能テスト・統合テスト・緊急無効化テスト完備）",
            "📖 詳細ドキュメント整備（設計書・TODO管理・実装ガイドライン完備）",
            "🔗 既存機能完全保護（音声コマンドシステム・統一状態管理・全機能との互換性確保）"
        ],
        category: ["文字起こし編集", "リアルタイム編集", "UI改善", "音声認識統合", "状態管理", "性能最適化", "段階的実装", "ユーザビリティ", "既存機能保護", "テストフレームワーク"]
    },
    {
        version: "v0.7.5",
        date: "2025-07-22",
        type: "emergency",
        title: "緊急修復プロジェクト: 音声認識システム根本修正完了",
        changes: [
            "🚨 設計災害級問題の完全解決（forceStopAllActivity関数による根本的問題の修正）",
            "🔴 音声認識完全停止問題解決（○文字削除後の永続的停止 → 透明継続システムで自動復旧）",
            "🔴 AI重複応答問題解決（削除後の「どうぞ」なし自動応答 → 単一処理パスで正常化）",
            "🔴 一時停止ボタン故障修正（ユーザー意図と逆動作・エラー発生 → 完全正常動作）",
            "🎯 forceStopAllActivity関数の完全削除（app/script.js・深堀くん.html・session-manager.js）",
            "🔧 VoiceUIManager完全削除（app/voice-ui-manager.js・211行削除・競合システム排除）",
            "⚡ 統一状態管理システムへの完全移行（UnifiedStateManager一元制御・複数システム統合）",
            "🚀 透明継続システム実装（30秒無音制限の完全克服・ユーザー非認知での自動継続）",
            "🤫 no-speechエラー対応（「無音は正常」思想の実現・手動復旧不要）",
            "🔄 一時停止ボタンUI統合（updatePauseResumeButton・定期監視システム）",
            "⚡ VoiceProcessingManager簡素化（双重処理問題解決・直接委譲実装）",
            "🛡️ 安全なセッション終了（SessionEndManager・統一状態管理経由制御）",
            "🧪 統合テストフレームワーク構築（unified-state-manager-fix-test.js・transparent-continuation-quick-test.js）",
            "📊 パフォーマンス大幅改善（音声認識安定性100%・UI応答性向上・処理速度向上）",
            "🔧 修正ファイル詳細（6ファイル・500行超の根本修正・app/voice-ui-manager.js完全削除）",
            "🎨 ユーザー体験劇的改善（シームレス音声体験・直感的操作・信頼性向上）",
            "💡 技術革新（マッチポンプ設計完全除去・統一状態管理完全移行・透明継続システム）",
            "🏅 品質保証（全テストケース成功・30秒無音後自動継続・システム統合実現）"
        ],
        category: ["緊急修復", "音声認識", "システム統合", "透明継続", "一時停止ボタン", "統一状態管理", "テストフレームワーク", "パフォーマンス", "ユーザー体験", "技術革新"]
    },
    {
        version: "v0.7.4",
        date: "2025-07-16",
        type: "minor",
        title: "UI調整・改善: リアルタイム文字起こし表示位置問題解決後の仕上げ",
        changes: [
            "🎯 UIの視覚的統一性向上（文字起こし表示位置問題解決後の仕上げ調整）",
            "🎨 ユーザビリティ向上（ボタン間隔拡大・罫線太さ調整・吹き出し配置統一）",
            "✨ デザイン洗練（テーマ欄の装飾削除・区切り線追加による視覚的整理）",
            "🔧 一時停止と終了ボタンの間隔拡大（gap: 10px → 20px・2倍拡大・誤操作防止）",
            "📏 リアルタイム文字起こし上の罫線強化（border-top: 1px → 3px・視覚的区別明確化）",
            "💬 AIキャラクターの吹き出し配置統一（margin-left: 10px追加・視覚的統一）",
            "🎨 テーマ欄のデザイン洗練（装飾的罫線削除・区切り線追加）",
            "🏗️ 修正ファイル2ファイル（app/style.css・深堀くん.html）",
            "📊 修正箇所4箇所（CSS: 3箇所・HTML: 1箇所）",
            "✅ 既存機能完全保持・UIレスポンシブ対応確認済み"
        ],
        category: ["UI改善", "ユーザビリティ", "デザイン", "視覚的統一", "操作性", "レスポンシブ"]
    },
    {
        version: "v0.7.3",
        date: "2025-07-15",
        type: "patch",
        title: "システム安定性向上・準備作業",
        changes: [
            "🚧 システム安定化作業実施",
            "🔧 内部システム調整・最適化",
            "📋 次期アップデート準備作業",
            "🛡️ セキュリティ・パフォーマンス改善",
            "✅ 既存機能の互換性保持"
        ],
        category: ["安定性", "最適化", "準備作業", "セキュリティ", "パフォーマンス"]
    },
    {
        version: "v0.7.2",
        date: "2025-07-11",
        type: "major",
        title: "no-speech対策・UI状態表示システム実装",
        changes: [
            "🎯 no-speech後の不正終了問題解決（ignoreNextEndフラグでhandleEnd無視機能実装）",
            "🎨 UI状態表示システム実装（マイクボタン下部にリアルタイム状態テキスト表示）",
            "🔧 エラー種別対応強化（「！」表示→具体的エラー内容表示への改善）",
            "📈 継続的音声認識安定性向上（新機能統合による信頼性向上）",
            "🛠️ VoiceErrorHandler新機能（146行の専用エラーハンドラー実装）",
            "🎤 handleNoSpeechError()実装（no-speechを正常動作として扱う）",
            "🚫 ignoreNextEndフラグ（no-speech→handleEnd→不正終了の流れを断絶）",
            "🎨 VoiceUIManager新機能（211行のUI管理システム実装）",
            "📊 状態テキスト表示（マイクボタン下部に状況説明テキスト）",
            "🌈 ビジュアルフィードバック（状態別色変更・アイコン表示）",
            "🔗 ContinuousRecognitionManager統合（既存クラスに新機能初期化メソッド追加）",
            "📋 解決対象問題4項目（エラー停止・start()呼び出し・エラー表示・マイクボタン無反応）",
            "🏗️ モジュール化設計（新機能は独立ファイルで実装・script.js分割回避）",
            "📊 実装統計（合計約600行の新機能実装）"
        ],
        category: ["no-speech対策", "UI状態表示", "エラーハンドリング", "音声認識", "VoiceErrorHandler", "VoiceUIManager", "継続性", "安定性"]
    },
    {
        version: "v0.7.1",
        date: "2025-07-09",
        type: "major",
        title: "継続的音声認識システム安定性向上とテスト機能充実",
        changes: [
            "🎯 マイク許可要求大幅削減（7-9回 → 1回・88-93%削減）",
            "🚀 start()呼び出し最適化（複数回 → 1回・900%改善）",
            "📈 効率性大幅向上（11% → 100%・909%改善）",
            "⏱️ 継続性実証（28分間の無中断動作確認済み）",
            "🏆 総合評価A+（完璧）達成",
            "🔧 連続エラー後の遅延再開（最大3秒の遅延で安定性確保）",
            "🔄 連続エラー回数制限（10回超過でシステムリセット）",
            "🛡️ システムリセット機能（統計情報・状態の完全リセット後に自動再開）",
            "📊 エラー状態の適切な通知（「エラー停止中・クリックで再開」表示）",
            "🔍 監視システム根本改善（無音時間監視の完全廃止・45秒監視撤廃）",
            "🎯 SpeechRecognitionオブジェクト実態監視（10秒間隔で稼働状態確認）",
            "🧠 深堀アプリ特性対応（0-180秒の考慮時間は監視対象外）",
            "🔄 時間監視→状態監視（根本的なパラダイムシフト）",
            "🧪 テスト機能大幅追加（エラー回復・ネットワーク・中断・オーディオエラーの手動発生）",
            "📋 修正ファイル1ファイル（app/script.js・315行追加・36行修正）"
        ],
        category: ["音声認識", "安定性", "マイク許可", "継続性", "テスト機能", "監視システム", "エラーハンドリング", "パフォーマンス"]
    },
    {
        version: "v0.7.0",
        date: "2025-07-04",
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