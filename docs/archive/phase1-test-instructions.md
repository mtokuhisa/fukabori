# Phase 1: VoiceProcessingManager 基盤構築 - テスト手順書

## 🎯 テスト目的
- VoiceProcessingManagerが正常に動作すること
- 従来機能が完全に保持されていること  
- デバッグ・ログシステムが正常に動作すること

## 🚀 テスト環境
- URL: http://localhost:8000/深堀くん.html
- ブラウザ: Chrome推奨
- 開発者コンソールを開いて実行

## 📋 テスト手順

### Step 1: 基本動作確認
1. ブラウザで深堀くんを開く
2. 開発者コンソールで以下のコマンドを実行：

```javascript
// VoiceProcessingManagerの存在確認
console.log('VoiceProcessingManager:', typeof window.VoiceProcessingManager);

// デバッグ機能確認
console.log('Debug Functions:', typeof window.VoiceProcessingManagerDebug);
```

**期待結果**: 
- `VoiceProcessingManager: "function"`
- `Debug Functions: "object"`

### Step 2: 初期化テスト
```javascript
// 基本テスト実行
await VoiceProcessingManagerDebug.runBasicTest();
```

**期待結果**: 
- 3つのテストケースが実行される
- エラーが発生しないこと
- テスト結果が表格で表示される

### Step 3: デバッグ情報確認
```javascript
// デバッグ情報表示
VoiceProcessingManagerDebug.showDebugInfo();
```

**期待結果**: 
- 統計情報（Stats）が表示される
- ログ履歴（Recent Logs）が表示される
- エラーが発生しないこと

### Step 4: 従来機能テスト
1. セッション開始まで進む
2. 音声認識を開始
3. 以下のテストケースを試す：

#### 基本コマンド
- [ ] 「どうぞ」→ AI応答開始
- [ ] 「テーマ変更」→ テーマ変更処理
- [ ] 「質問変更」→ 質問変更処理

#### 削除コマンド（既知の問題）
- [ ] 「削除」→ 全削除実行（Phase 3で改良予定）
- [ ] 「クリア」→ 全削除実行（Phase 3で改良予定）

### Step 5: パフォーマンス確認
```javascript
// 統計情報確認
const stats = VoiceProcessingManagerDebug.showDebugInfo();
console.log('Average Processing Time:', stats.stats.averageProcessingTime + 'ms');
```

**期待結果**: 
- 平均処理時間が100ms以内
- エラー率が0%またはごく低い値

## ✅ 完了条件
- [ ] 全てのコンソールテストが成功
- [ ] 従来の音声コマンドが正常動作
- [ ] デバッグ機能が正常動作
- [ ] パフォーマンス要件達成（100ms以内）

## 🔧 トラブルシューティング

### エラー: "VoiceProcessingManager is not defined"
**原因**: ファイル読み込み順序の問題
**対処**: ブラウザを再読み込み

### エラー: "processFinalTranscript is not a function"
**原因**: script.js統合の問題
**対処**: 開発者コンソールで `typeof processFinalTranscript` 確認

### テスト実行時のエラー
**原因**: 音声認識システムの初期化問題
**対処**: セッション開始後に再テスト

## 📊 期待されるログ出力例
```
🚀 VoiceProcessingManager v1.0-phase1 初期化開始
📦 VoiceProcessingManager クラス定義完了
🔧 デバッグ関数: window.VoiceProcessingManagerDebug で利用可能
[VoiceProcessingManager] ℹ️ VoiceProcessingManager 初期化完了
[VoiceProcessingManager] ℹ️ 音声処理開始: "テスト音声入力"
[VoiceProcessingManager] ℹ️ 音声処理完了 (xx.xxms)
``` 