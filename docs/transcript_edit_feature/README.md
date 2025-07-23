# リアルタイム文字起こし編集機能 - 実装設計書

**作成日**: 2025年7月24日  
**バージョン**: v1.0  
**担当**: 深堀くんv2.0開発チーム  

---

## 🎯 **プロジェクト概要**

### 目的
リアルタイム文字起こし表示（`transcriptDisplay`）をユーザー編集可能にし、誤認識修正や手動入力による会話参加を実現する。ただし、**音声認識のリアルタイム性能を損なわない**ことを最優先とする。

### 機能スコープ
- ✅ **リアルタイム文字起こしの編集機能** (contenteditable)
- ✅ **編集中の音声認識一時停止** (既存ボタン活用)
- ✅ **キーボード入力による会話機能** (複雑性によってはオプション)
- ❌ **音声認識辞書・学習機能** (Web Speech API制約により除外)

---

## 📊 **性能評価結果**

### テスト環境
- **テストページ**: `tests/performance-editable-test.html`
- **測定項目**: DOM更新処理時間（1000回平均）
- **ブラウザ**: Chrome on macOS

### 測定結果
| モード | 平均時間(ms) | 最大時間(ms) | baseline比率 |
|--------|-------------|-------------|-------------|
| baseline (通常div) | 0.0005 | 0.10 | 1.00× |
| contenteditable (編集なし) | 0.0006 | 0.10 | 1.20× |
| contenteditable (編集中) | 0.0007 | 0.10 | 1.46× |

### リスク評価
- **Risk Level: LOW** ⭐️
- **判定基準**: 1.46倍 < 1.5倍（安全域）
- **結論**: **実装GO** - リアルタイム性能への影響は無視できるレベル

---

## 🏗 **システムアーキテクチャ**

### データフロー
```
音声認識 → VoiceModule → TranscriptEditManager → EditableTranscriptUI
                              ↓
                    AppState.currentTranscript ← ユーザー編集
                              ↓
                     handleUserTextInput() (キーボード会話)
```

### モジュール構成
```
app/
├── transcript-edit-manager.js    # メイン編集制御
├── editable-transcript-ui.js     # UI専用コンポーネント
└── ui-basic.js                   # 既存ファイル（微修正のみ）
```

---

## 🧩 **コンポーネント設計**

### TranscriptEditManager
**責任**: 編集状態管理、音声認識制御統合、データ同期

```javascript
class TranscriptEditManager {
    constructor() {
        this.isEditing = false;
        this.originalText = '';
        this.pauseController = null; // 既存一時停止ボタン制御
    }
    
    // 編集開始時の処理
    async startEditing()
    
    // 編集完了時の処理  
    async finishEditing(newText)
    
    // 既存一時停止ボタンとの連携
    togglePauseForEditing(shouldPause)
}
```

### EditableTranscriptUI
**責任**: contenteditable制御、イベントハンドリング、視覚フィードバック

```javascript
class EditableTranscriptUI {
    constructor(transcriptElement) {
        this.element = transcriptElement;
        this.isContentEditable = false;
    }
    
    // contenteditable有効化
    enableEditing()
    
    // Enter送信、ESCキャンセル処理
    handleKeyEvents(event)
    
    // 視覚的な編集状態表示
    updateEditingIndicator(isEditing)
}
```

---

## 🔗 **既存システム統合**

### 影響を受けるファイル
1. **app/ui-basic.js** 
   - `updateTranscriptDisplay()` 関数の微修正
   - 編集中は音声認識からの更新を一時停止

2. **app/script.js**
   - TranscriptEditManager初期化処理の追加
   - `handleUserTextInput()` との連携強化

3. **深堀くん.html**
   - 新JSファイルの読み込み追加のみ

### 保護すべき既存機能
- ✅ Phase 1音声コマンドシステム (VoiceProcessingManager)
- ✅ 統一状態管理システム (UnifiedStateManager)  
- ✅ リアルタイム音声認識の継続性
- ✅ 一時停止ボタンの既存動作

---

## ⚙️ **実装戦略**

### フェーズ分け
- **Phase A**: 基本編集UI実装（1-2日）
- **Phase B**: 一時停止統合（1日）
- **Phase C**: キーボード会話機能（1日、複雑性によってはスキップ）

### リスクヘッジ策
1. **緊急無効化フラグ**: 単一設定で編集機能を完全無効化
2. **完全フォールバック**: 既存transcriptDisplay表示への即座復元
3. **段階的実装**: 各フェーズで動作確認後に次フェーズ移行

---

## 📋 **参照ドキュメント**

### 必読資料
- [開発ガイドライン](../開発ガイドライン.md)
- [技術仕様・依存関係](../技術仕様・依存関係.md)
- [深堀くん設計仕様書](../深堀くん_設計仕様書.md)

### プロジェクト管理
- [実装TODO一覧](TODO.md) ⭐️
- [パフォーマンステスト結果](../../tests/performance-editable-test.html)

### 関連システム
- `app/unified-state-manager/voice-module.js` - 音声認識統合
- `app/voice-processing-manager.js` - 音声コマンド処理
- `app/ui-basic.js` - transcript表示制御

---

## 🚨 **重要な制約・注意事項**

### 設計思想の遵守
- **「音声認識性能 > 編集機能」**: 性能劣化が確認された場合は即座に機能を無効化
- **既存機能の完全保護**: 動作中の機能に一切の破壊的変更を加えない
- **段階的・安全優先実装**: 各段階で完全テスト後に次段階移行

### Web Speech API制約
- 外部辞書未対応のため学習機能は実装しない
- 認識精度向上は「ユーザー修正の利便性向上」に留める

---

**最終更新**: 2025年7月24日  
**ステータス**: 設計完了・実装準備完了  
**次アクション**: [TODO.md](TODO.md)の Phase A 開始 