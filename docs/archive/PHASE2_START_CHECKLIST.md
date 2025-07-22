# Phase 2開始前チェックリスト

**新規AIエージェント必読** - Phase 2実装開始前の確認事項

---

## 📋 **開始前必須確認（すべて✅が必要）**

### **1. 前提資料の読了確認**
- [ ] `docs/音声認識改善計画.md` - 全体計画とPhase 2要件
- [ ] `phase2-handover-prompt.md` - 詳細な引き継ぎ指示
- [ ] `docs/開発ガイドライン.md` - 制約・品質基準
- [ ] `docs/技術仕様・依存関係.md` - システム構成理解

### **2. Phase 0-1完了状況の確認**
- [ ] `app/voice-processing-manager.js` (313行、11KB) 存在確認
- [ ] `phase1-test-report.json` テスト結果確認（20成功/0エラー）
- [ ] `深堀くん.html` にVoiceProcessingManager読み込み確認
- [ ] ローカルサーバー http://localhost:8000 稼働確認

### **3. 実装対象の理解確認**
- [ ] テーマ変更要望検出システムの要件理解
- [ ] 質問変更要望検出システムの要件理解
- [ ] AI prompt組み込み機能の要件理解
- [ ] 既存 `handleThemeChange()`, `handleQuestionChange()` 関数の調査計画

### **4. 制約事項の理解確認**
- [ ] 既存機能の完全保護（破壊絶対禁止）
- [ ] 処理時間厳守（100ms以内）
- [ ] フォールバック機能必須実装
- [ ] デバッグログ充実の必要性

### **5. 環境・ツール確認**
- [ ] Node.js、ブラウザ環境での作業準備完了
- [ ] バックアップコマンドの実行準備完了
- [ ] テストケース実装計画の理解

---

## 🚨 **重要注意事項**

### **絶対に実行してはいけない操作**
- ❌ `app/voice-processing-manager.js` の既存メソッドの削除・変更
- ❌ `app/script.js` の `processFinalTranscriptOriginal()` 削除
- ❌ `深堀くん.html` のスクリプト読み込み順序変更
- ❌ バックアップなしでの実装開始

### **必須実行事項**
- ✅ 実装開始前の完全バックアップ作成
- ✅ 各機能実装後の動作確認
- ✅ エラー時のフォールバック動作確認
- ✅ デバッグログの適切な出力

---

## 📞 **開始準備完了の確認**

全ての項目を確認後、以下を実行してPhase 2を開始してください：

```bash
# Phase 2開始宣言
echo "✅ Phase 2実装開始準備完了"
echo "📅 開始時刻: $(date)"
echo "🎯 実装対象: AI会話継続機能"

# 環境確認
ls -la app/voice-processing-manager.js
curl -I http://localhost:8000/深堀くん.html

# バックアップ実行
BACKUP_DIR="backups/phase2_start_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r app/voice-processing-manager.js app/script.js 深堀くん.html "$BACKUP_DIR/"
echo "バックアップ完了: $BACKUP_DIR"
```

---

**Phase 2実装開始準備完了！安全で確実な実装を開始してください。** 