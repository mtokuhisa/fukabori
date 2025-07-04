# 🗺️ 深堀くん 依存関係マップ

**作成日**: 2025年1月11日  
**更新日**: 2025年1月11日

このドキュメントは、深堀くんアプリのモジュール間の依存関係を詳細に記録します。

---

## 📁 ファイル構成

### **読み込み順序**（深堀くん.html）
```html
1. app/utils.js          - ユーティリティ関数
2. app/file-processing.js - ファイル処理システム
3. app/knowledge-management.js - 知見管理システム
4. app/script.js         - メインスクリプト
```

---

## 🌐 グローバル変数

### **window.KnowledgeState**
- **定義場所**: script.js:8
- **使用場所**: 
  - knowledge-management.js（多数）
  - CategoryManager、UserManager

### **window.AppState** 
- **定義場所**: script.js内（詳細位置要確認）
- **使用場所**:
  - file-processing.js（29箇所以上）
  - knowledge-management.js（5箇所）
  - script.js（全体）

### **window.stateManager**
- **定義場所**: script.js:18
- **使用場所**: script.js内の音声システム

---

## 📊 モジュール依存関係

### **1. app/utils.js**
**外部依存**: なし  
**提供機能**:
- `showMessage()` - メッセージ表示
- `downloadTextFile()` - ファイルダウンロード
- `encryptApiKey()`, `decryptApiKey()`, `hashPassword()` - 暗号化

**公開方法**:
```javascript
window.showMessage = showMessage;
window.downloadTextFile = downloadTextFile;
window.encryptApiKey = encryptApiKey;
// ... など
```

### **2. app/file-processing.js**
**外部依存**:
- `AppState`（29箇所以上）
  - `.apiKey`
  - `.extractedThemes`
  - `.documentContext`
  - `.currentDocument`
  - `.selectedThemes`
  - `.currentTheme`
  - `.selectedThemeDetails`
  - `.themeSummaries`
- `window.AI_PROMPTS`
- `saveThemeInputState()` （script.js）
- `updateAnalysisProgress()` （自己定義）

**提供機能**:
- `FileProcessingInterface` - ファイル処理API
- PDF/Excel/Word/PowerPoint処理
- GPTテーマ抽出
- テーマ選択UI

### **3. app/knowledge-management.js**
**外部依存**:
- `window.KnowledgeState`（多数）
- `window.AppState?.apiKey`（5箇所）
- `window.gptMessagesToCharacterResponse()` （script.js）
- `window.showMessage()` （utils.js）
- `window.downloadTextFile()` （utils.js）

**提供機能**:
- `CSVManager` - CSV処理
- `CategoryManager` - カテゴリ管理
- `UserManager` - ユーザー管理
- `FukaboriKnowledgeDatabase` - 知見DB
- `KnowledgeDNAManager` - 知見整理
- `QualityAssessmentSystem` - 品質評価
- `downloadAllKnowledge()` - 全知見DL

### **4. app/script.js**
**外部依存**:
- utils.js の全機能
- file-processing.js の`FileProcessingInterface`
- knowledge-management.js の全機能

**提供機能**:
- `AppState` - アプリ全体の状態管理
- `gptMessagesToCharacterResponse()` - GPT API呼び出し
- `VoiceKnowledgeSystem` - 音声知見評価（中核）
- `processDeepdiveUserResponse()` - 会話処理（中核）
- その他多数の機能

---

## ⚠️ 循環依存

### **問題のあるパターン**
1. **knowledge-management.js → script.js → knowledge-management.js**
   - knowledge-management.jsが`window.gptMessagesToCharacterResponse()`を使用
   - script.jsが`KnowledgeDNAManager`等を使用

2. **file-processing.js → script.js → file-processing.js**
   - file-processing.jsが`AppState`と`saveThemeInputState()`を使用
   - script.jsが`FileProcessingInterface`を使用

---

## 🔴 中核システムの依存関係

### **VoiceKnowledgeSystem（絶対保護）**
- **場所**: script.js:6502-6987
- **被依存**:
  - `processDeepdiveUserResponse()` (2996行目)
- **依存先**:
  - `QualityAssessmentSystem` (knowledge-management.js)
  - `addMessageToChat()` (script.js)
  - `ttsTextToAudioBlob()` (script.js)
  - `playPreGeneratedAudio()` (script.js)

### **processDeepdiveUserResponse（絶対保護）**
- **場所**: script.js:2987行目付近
- **依存先**:
  - `VoiceKnowledgeSystem.processKnowledgeWithVoiceEvaluation()`
  - `KnowledgeFileManager.addInsight()`

---

## 💡 リファクタリング推奨事項

### **1. AppState依存の解決**
- `AppStateInterface`を作成し、必要な部分のみを公開
- 各モジュールは直接AppStateを参照せず、インターフェース経由でアクセス

### **2. GPT API呼び出しの共通化**
- `gptMessagesToCharacterResponse()`を独立モジュールに移動
- API呼び出しロジックの一元化

### **3. 音声テンプレートの分離**
- `VoiceTemplates`、`VoicePatterns`を独立ファイルに
- 設定値の外部化

### **4. UI更新関数の統合**
- DOM操作関連の関数を`ui-utils.js`に統合
- イベントハンドラーの整理

---

## 📝 注意事項

1. **モジュール読み込み順序は絶対厳守**
   - utils.js → file-processing.js → knowledge-management.js → script.js

2. **中核システムへの変更は禁止**
   - VoiceKnowledgeSystem
   - processDeepdiveUserResponse
   - processKnowledgeWithVoiceEvaluation

3. **グローバル変数の扱い**
   - 新規モジュールでは極力グローバル変数を作らない
   - 既存のグローバル変数への依存は最小限に 