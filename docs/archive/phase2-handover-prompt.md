# 深堀くんv2.0 Phase 2実装 - 引き継ぎプロンプト

**対象**: 新規AIエージェント（AI統合専門）  
**作業**: Phase 2: AI会話継続機能実装  
**前提**: Phase 0-1完了済み、Phase 2実装準備完了

---

## 🎯 **あなたの担当作業**

**深堀くんv2.0の音声認識システム改善 Phase 2を実装してください。**

### **Phase 2の目的**
- **テーマ変更要望の検出・伝達システム**の実装
- **質問変更要望の検出・伝達システム**の実装  
- **AI promptへの要望組み込み機能**の実装

---

## 📋 **現在の完了状況（重要）**

### ✅ **Phase 0: 準備・ロールバック（完了済み）**
- 7/19レガシーシステムへの安全なロールバック完了
- 複雑化した音声関連ファイル40個→削除完了
- システム全体の動作確認完了

### ✅ **Phase 1: voice-processing-manager.js基盤構築（完了済み）**
- **`app/voice-processing-manager.js`（313行、11KB）**実装完了
- **VoiceProcessingManagerクラス**完全実装済み：
  ```javascript
  // 実装済み機能
  - constructor() ✅
  - async initialize() ✅
  - async processFinalTranscript(text) ✅ (基本仲介機能のみ)
  - async callOriginalProcessor(text) ✅
  - async fallbackToOriginal(text) ✅
  - log(level, message) ✅
  - getStats() ✅
  - getDebugInfo() ✅
  - VoiceProcessingManagerDebug（デバッグ関数群）✅
  ```

- **`app/script.js`統合**完了済み：
  ```javascript
  // 実装済み構造
  async function processFinalTranscriptOriginal(text) { /* バックアップ版 */ }
  async function processFinalTranscript(text) { 
      // VoiceProcessingManager経由の新関数（フォールバック付き）
  }
  ```

- **`深堀くん.html`読み込み順序**調整完了：
  ```html
  <!-- Phase 1: VoiceProcessingManager 基盤システム -->
  <script src="app/voice-processing-manager.js?v=1.0"></script>
  <!-- メインスクリプト -->
  <script src="app/script.js?v=0.8.0"></script>
  ```

- **テスト結果**: 自動テスト20成功/0エラー/1軽微警告
- **動作確認**: 従来機能100%保持、フォールバック機能正常

---

## 🔧 **Phase 2で実装すべき具体的機能**

### **2.1: テーマ変更要望検出・伝達システム**

#### **対象パターン（音声認識改善計画.mdより）**
```javascript
// 検出すべき音声パターン
const themeChangePatterns = [
    'テーマ変更',
    'テーマを変えて',
    'テーマ変更、もっと技術的に',
    'テーマ変更、[具体的要望]',
    // その他のバリエーション
];
```

#### **実装要件**
1. **音声パターンの正確な検出**
   - 基本パターン「テーマ変更」の確実な認識
   - 具体的要望「テーマ変更、[要望内容]」の抽出
   - 誤検出の防止（部分マッチの回避）

2. **要望内容のAI prompt組み込み**
   - 要望内容の抽出・構造化
   - 現在のAI promptシステムとの統合
   - 新テーマ生成への要望反映

3. **既存の`handleThemeChange()`関数との連携**
   - 既存処理を破壊せずに拡張
   - 要望がない場合の従来動作保持
   - エラー時のフォールバック

#### **実装場所**
```javascript
// app/voice-processing-manager.js内のprocessFinalTranscript()に追加
async processFinalTranscript(text) {
    // Phase 1: 基本的な仲介処理（実装済み）
    
    // Phase 2: テーマ変更要望検出・処理（実装対象）
    const themeChangeRequest = this.detectThemeChangeRequest(text);
    if (themeChangeRequest) {
        return await this.handleThemeChangeWithRequest(themeChangeRequest);
    }
    
    // Phase 2: 質問変更要望検出・処理（実装対象）
    const questionChangeRequest = this.detectQuestionChangeRequest(text);
    if (questionChangeRequest) {
        return await this.handleQuestionChangeWithRequest(questionChangeRequest);
    }
    
    // Phase 1: 従来のprocessFinalTranscript呼び出し（実装済み）
    const result = await this.callOriginalProcessor(text);
}
```

### **2.2: 質問変更要望検出・伝達システム**

#### **対象パターン（音声認識改善計画.mdより）**
```javascript
// 検出すべき音声パターン
const questionChangePatterns = [
    '質問変更',
    '別の質問',
    '質問を変えて',
    '質問変更、もっと具体的に',
    '質問変更、[具体的要望]',
    // その他のバリエーション
];
```

#### **実装要件**
1. **音声パターンの正確な検出**
2. **要望内容のAI prompt組み込み**
3. **既存の`handleQuestionChange()`関数との連携**

### **2.3: AI prompt組み込み機能**

#### **既存AI promptシステムの調査**
現在のシステムで以下を確認してください：
```javascript
// 調査対象（script.js内）
- handleThemeChange() 関数の実装
- handleQuestionChange() 関数の実装  
- AI promptの構造・形式
- テーマ生成・質問生成のAPIコール部分
```

#### **要望組み込み実装**
- 抽出した要望をAI promptに自然に組み込む
- 生成品質の向上を図る
- エラー時の従来動作保証

---

## 🛠️ **実装手順（推奨）**

### **Step 1: 既存システム調査（30分）**
```javascript
// 確認すべき関数・システム
1. script.js内のhandleThemeChange()実装確認
2. script.js内のhandleQuestionChange()実装確認
3. AI promptの現在の構造確認
4. VoiceProcessingManagerのprocessFinalTranscript()の現在の実装確認
```

### **Step 2: テーマ変更要望検出実装（2-3時間）**
```javascript
// app/voice-processing-manager.js に追加
detectThemeChangeRequest(text) {
    // パターンマッチング実装
    // 要望内容抽出実装
    // 戻り値の構造化
}

async handleThemeChangeWithRequest(request) {
    // 既存handleThemeChange()との統合
    // AI promptへの要望組み込み
    // エラーハンドリング
}
```

### **Step 3: 質問変更要望検出実装（2-3時間）**
```javascript
// app/voice-processing-manager.js に追加
detectQuestionChangeRequest(text) {
    // パターンマッチング実装
    // 要望内容抽出実装
}

async handleQuestionChangeWithRequest(request) {
    // 既存handleQuestionChange()との統合
    // AI promptへの要望組み込み
}
```

### **Step 4: 統合・テスト（2時間）**
```javascript
// 統合テスト実装
window.debugPhase2 = {
    testThemeChange: async () => { /* テスト実装 */ },
    testQuestionChange: async () => { /* テスト実装 */ },
    testAIPromptIntegration: async () => { /* テスト実装 */ }
};
```

---

## ⚠️ **重要な制約・注意事項**

### **絶対遵守事項**
1. **既存機能の完全保護**: `handleThemeChange()`, `handleQuestionChange()`を破壊しない
2. **フォールバック完備**: エラー時は必ず従来処理に戻す
3. **処理時間厳守**: 100ms以内での処理完了
4. **デバッグログ充実**: 全ての処理でログ出力

### **Phase 1との連携**
```javascript
// 既存のVoiceProcessingManager機能を活用
this.log('info', `テーマ変更要望検出: "${request.content}"`);
this.stats.themeChangeRequests++; // 統計に記録
```

### **エラーハンドリング必須**
```javascript
try {
    // Phase 2の新機能実装
} catch (error) {
    this.log('error', `Phase 2処理エラー: ${error.message}`);
    // 必ず従来処理にフォールバック
    return await this.callOriginalProcessor(text);
}
```

---

## 🧪 **テスト要件**

### **Phase 2完了条件（音声認識改善計画.mdより）**
- [ ] テーマ変更要望伝達: 90%以上成功
- [ ] 質問変更要望伝達: 90%以上成功  
- [ ] AI prompt組み込み: 100%成功

### **テストケース例**
```javascript
// 実装すべきテストケース
const testCases = [
    { input: 'テーマ変更', expected: 'theme_change_basic' },
    { input: 'テーマ変更、もっと技術的に', expected: 'theme_change_with_request' },
    { input: '質問変更', expected: 'question_change_basic' },
    { input: '質問変更、もっと具体的に', expected: 'question_change_with_request' },
    { input: '通常の音声入力', expected: 'fallback_to_original' }
];
```

---

## 📁 **重要ファイル・参照先**

### **編集対象ファイル**
- `app/voice-processing-manager.js` (メイン実装)
- 必要に応じて `app/script.js` (既存関数調査・小修正)

### **参照すべきファイル**
- `docs/音声認識改善計画.md` (全体要件)
- `docs/開発ガイドライン.md` (制約・品質基準)
- `phase1-test-report.json` (Phase 1テスト結果)
- `phase1-browser-test.html` (テスト環境例)

### **現在の環境**
- ローカルサーバー: `http://localhost:8000` で稼働中
- ブラウザテスト: 開発者コンソールでテスト可能
- 既存システム: 完全に動作中、破壊厳禁

---

## 🚀 **実装開始コマンド**

作業開始時に以下を実行してください：

```bash
# 作業環境確認
ls -la app/voice-processing-manager.js  # Phase 1成果物確認
curl -I http://localhost:8000/深堀くん.html  # ローカルサーバー確認

# Phase 2開始前バックアップ
BACKUP_DIR="backups/phase2_start_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r app/voice-processing-manager.js app/script.js 深堀くん.html "$BACKUP_DIR/"
echo "Phase 2開始前バックアップ: $BACKUP_DIR"
```

---

## 📞 **完了報告形式**

Phase 2完了時は以下の形式で報告してください：

```markdown
## Phase 2: AI会話継続機能実装 - 完了報告

### 実装した機能
- [ ] テーマ変更要望検出・伝達システム
- [ ] 質問変更要望検出・伝達システム  
- [ ] AI prompt組み込み機能

### テスト結果
- テーマ変更要望成功率: xx%
- 質問変更要望成功率: xx%  
- AI prompt組み込み成功率: xx%

### 実装ファイル
- app/voice-processing-manager.js: xx行追加

### 次Phaseへの申し送り
- (問題・制約事項があれば記載)
```

---

## 📋 **新規チャット向け実行プロンプト**

```markdown
深堀くんv2.0の音声認識システム改善 **Phase 2: AI会話継続機能実装**を担当してください。

@docs/音声認識改善計画.md @phase2-handover-prompt.md @PHASE2_START_CHECKLIST.md

**Phase 2実装内容**:
1. **テーマ変更要望の検出・伝達システム** - 「テーマ変更、もっと技術的に」等の要望をAI promptに組み込み
2. **質問変更要望の検出・伝達システム** - 「質問変更、もっと具体的に」等の要望をAI promptに組み込み
3. **AI prompt組み込み機能** - 既存 `handleThemeChange()`, `handleQuestionChange()` との安全な統合

**重要な前提**:
- ✅ **Phase 0-1完了済み**: 7/19ロールバック完了、`voice-processing-manager.js`(313行)実装済み
- ✅ **動作中システム**: 全機能正常稼働中、破壊絶対禁止
- ✅ **テスト合格済み**: 自動テスト20成功/0エラー、フォールバック機能完備
- ⚠️ **制約厳守**: 処理時間100ms以内、既存機能完全保護、エラー時フォールバック必須

**実装対象ファイル**:
- メイン: `app/voice-processing-manager.js` への機能追加
- 調査: `app/script.js` の既存関数 `handleThemeChange()`, `handleQuestionChange()`

**完了条件** (音声認識改善計画.mdより):
- [ ] テーマ変更要望伝達: 90%以上成功  
- [ ] 質問変更要望伝達: 90%以上成功
- [ ] AI prompt組み込み: 100%成功

**環境**: ローカルサーバー http://localhost:8000 稼働中

必ず `PHASE2_START_CHECKLIST.md` の全項目確認後、バックアップ作成してから実装開始してください。Phase 0-1の成果を破壊せず、安全で確実なPhase 2実装をお願いします。
```

---

**最重要**: 上記プロンプトで新規チャットを開始し、リンクされたファイルを必ず熟読してから実装を開始してください。Phase 0-1の成果を破壊せず、確実にPhase 2を実装することが最優先です。

**作業開始準備完了です。Phase 2実装を開始してください！** 