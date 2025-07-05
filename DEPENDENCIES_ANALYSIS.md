# 深堀くんアプリ - 依存関係分析結果

## 現在のモジュール構成

### 1. ファイル読み込み順序（深堀くん.html）
```
1. app/utils.js          ← 基礎ユーティリティ
2. app/file-processing.js ← ファイル処理機能
3. app/knowledge-management.js ← 知見管理機能
4. app/api-key-setup.js  ← APIキー設定機能
5. app/script.js         ← メインスクリプト（7,651行）
```

### 2. 各モジュールの提供機能

#### app/utils.js (基礎モジュール)
**提供する関数:**
- `showMessage(type, message)` - メッセージ表示
- `downloadTextFile(content, filename)` - テキストファイルダウンロード
- `encryptApiKey(apiKey, password)` - APIキー暗号化
- `decryptApiKey(encryptedKey, password)` - APIキー復号化
- `hashPassword(password)` - パスワードハッシュ化

**グローバル露出:**
- `window.showMessage`
- `window.downloadTextFile`
- `window.encryptApiKey`
- `window.decryptApiKey`
- `window.hashPassword`
- `window.FukaboriUtils.*`

#### app/file-processing.js
**依存関係:**
- `showMessage()` ← utils.js（但し、独自の実装も持つ）

**提供する機能:**
- ファイル選択・処理
- Excel/PDF/Word/PowerPoint解析
- テーマ抽出・分析

#### app/knowledge-management.js
**依存関係:**
- `showMessage()` ← utils.js
- `downloadTextFile()` ← utils.js

**提供する機能:**
- 知見データ管理
- CSV管理
- 知見品質評価システム

#### app/api-key-setup.js
**依存関係:**
- `window.showMessage()` ← utils.js

**提供する機能:**
- APIキー設定モーダル
- APIキー検証

#### app/script.js (メインスクリプト - 7,651行)
**依存関係:**
- `showMessage()` ← utils.js（85回使用）
- `downloadTextFile()` ← utils.js（1回使用）
- `encryptApiKey()` ← utils.js（1回使用）
- `decryptApiKey()` ← utils.js（1回使用）
- `hashPassword()` ← utils.js（6回使用）

**提供する機能:**
- 音声認識システム
- 会話制御
- UI管理（DOMUtils含む）
- セッション管理
- 状態管理

## 詳細な依存関係マップ

### utils.js関数の使用状況

#### showMessage() - 85回使用（script.js内）
**主な使用箇所:**
- エラーハンドリング: 45回
- 成功メッセージ: 25回
- 情報メッセージ: 15回

**使用パターン:**
```javascript
showMessage('error', 'エラーメッセージ');
showMessage('success', '成功メッセージ');
showMessage('info', '情報メッセージ');
showMessage('warning', '警告メッセージ');
```

#### hashPassword() - 6回使用（script.js内）
**使用箇所:**
- `saveEncryptedApiKey()` - line 4037
- `loadEncryptedApiKey()` - line 4049
- `hasApiKeyForPassword()` - line 4075
- `clearSavedApiKey()` - line 4651, 4693
- `changePassword()` - line 4788

#### その他の関数
- `encryptApiKey()` - 1回使用（line 4036）
- `decryptApiKey()` - 1回使用（line 4058）
- `downloadTextFile()` - 1回使用（line 3964）

### 他モジュールでの依存関係

#### file-processing.js
- `showMessage()` - 4回使用（但し、独自実装との混在）
- 独自のshowMessage実装も存在（line 57）

#### knowledge-management.js
- `showMessage()` - 8回使用
- `downloadTextFile()` - 1回使用

#### api-key-setup.js
- `window.showMessage()` - 4回使用

## 依存関係の問題点

### 1. 重大な依存関係の問題
- **script.js** が **utils.js** の関数を94回使用している
- utils.jsが読み込まれているにも関わらず、エラーが発生する状況がある
- 特に`showMessage`と`hashPassword`でエラーが頻発

### 2. 循環依存の可能性
- file-processing.jsが独自の`showMessage`実装を持ちながら、utils.jsにも依存
- 各モジュールが`window`オブジェクトを通じて相互参照

### 3. モジュール分離の課題
- script.js（7,651行）が巨大すぎて編集困難
- UI関連機能（DOMUtils等）がscript.jsに残存
- 適切なモジュール境界が不明確

### 4. 関数参照の不統一
- 直接呼び出し: `showMessage()`
- window経由: `window.showMessage()`
- 混在による予期しない動作

## 推奨される解決策

### 段階1: 依存関係の安定化
1. utils.jsの読み込み確認と修正
2. 全モジュールでの関数参照方法の統一
3. 循環依存の解消

### 段階2: script.jsの段階的分離
1. UI関連機能の分離（DOMUtils, ErrorHandler等）
2. 音声システムの分離
3. セッション管理の分離

### 段階3: アーキテクチャの再設計
1. 明確なモジュール境界の定義
2. 依存関係の一方向化
3. 自動テストの導入

## 次のアクション

**最優先**: utils.jsの関数が正しく動作しない原因の特定と修正
**その後**: script.jsの段階的リファクタリング計画の策定

## ファイルサイズ情報

- `app/script.js`: 309,942 bytes (7,651行) - 編集困難
- `app/utils.js`: 4,312 bytes (123行) - 編集可能
- `app/file-processing.js`: 71,021 bytes (1,753行) - 編集困難
- `app/knowledge-management.js`: 52,150 bytes (826行) - 編集可能
- `app/api-key-setup.js`: 24,323 bytes (596行) - 編集可能 