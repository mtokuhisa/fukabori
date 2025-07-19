# 既存音声コマンドシステム バックアップ

作成日: 2025-01-19 17:02:37  
目的: 新音声コマンドシステム（VoiceCommandCore）実装前の既存機能保存

## 📋 バックアップ内容

### 1. voice_command_functions.js
- **processFinalTranscript()** - メイン音声処理関数
- **processKnowledgeConfirmation()** - 知見確認コマンド処理
- **handleThresholdChangeCommand()** - 閾値変更処理
- **getContextualCommands()** - 動的コマンド判定

### 2. speech_correction_system.js
- **SpeechCorrectionSystem** - 音声訂正システム全体
- 削除コマンド処理（全削除、部分削除、文字列削除）
- 置換コマンド処理（単純置換、文脈考慮置換）
- テスト用グローバル関数

### 3. voice_patterns_templates.js
- **VoicePatterns** - 音声認識パターン定義
- **VoiceTemplates** - 音声応答テンプレート
- **VoiceCommandPatterns** - 追加のコマンドパターン

## 🔧 現在動作している機能

### 基本コマンド
- ✅ 「どうぞ」 - AI応答開始
- ✅ 「終了して」「セッション終了」 - セッション終了
- ✅ 「テーマ変更」「テーマを変え」 - テーマ変更
- ✅ 「質問変更」「別の質問」 - 質問変更

### 文字編集コマンド
- ✅ 「削除」「消して」「クリア」 - 全文削除
- ✅ 「3文字削除」「最後の5文字消して」 - 部分削除
- ✅ 「AをBにして」 - 単純置換
- ✅ 「AはBのCにして」 - 文脈考慮置換

### 知見評価コマンド
- ✅ 「はい」「OK」「記録して」 - 知見承認
- ✅ 「いいえ」「違う」「スキップ」 - 知見拒否
- ✅ 「詳しく」「説明」 - 詳細説明要求
- ✅ 「閾値を80点に変更」 - 自動記録閾値変更
- ✅ 「現在の設定は」 - 設定確認

## 📊 システム構成

```
音声入力
  ↓
processFinalTranscript()
  ├─ 特別コマンド判定（どうぞ、テーマ変更等）
  ├─ SpeechCorrectionSystem（削除・置換）
  ├─ 各種ハンドラー呼び出し
  └─ handleUserTextInput()
      └─ processKnowledgeConfirmation()（知見確認時）
```

## ⚠️ 新システム実装時の注意事項

1. **既存機能との互換性維持**
   - 現在のコマンドは全て新システムでも動作すること
   - 特に知見評価の「はい/いいえ」は重要

2. **段階的移行**
   - フィーチャーフラグで新旧切り替え可能に
   - 並行稼働期間を設ける

3. **テスト項目**
   - 全ての既存コマンドの動作確認
   - エッジケースの処理（空文字、長文等）
   - 音声フィードバックの適切性

## 🔄 復元方法

このバックアップから既存機能を復元する場合：

1. 各ファイルの内容を対応する場所にコピー
2. 必要な依存関係（AppState、VoiceKnowledgeSystem等）を確認
3. グローバル関数の公開を再設定

## 📝 関連ドキュメント

- `docs/音声コマンド整備_包括的要件定義・設計書.md` - 新システム要件
- `docs/VOICE_COMMAND_ARCHITECTURE.md` - 新アーキテクチャ設計
- `docs/VOICE_COMMAND_TASK_DEFINITION.md` - 実装タスク定義 