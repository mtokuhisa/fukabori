# ステップ1.1: 現状詳細調査結果

## 1.1.1 HTMLファイルでの読み込み状況

### 確認結果: ✅ 正常
```html
<!-- 深堀くん.html での読み込み順序 -->
<script src="app/utils.js"></script>          <!-- 1番目: 基礎ユーティリティ -->
<script src="app/file-processing.js"></script> <!-- 2番目: ファイル処理 -->
<script src="app/knowledge-management.js"></script> <!-- 3番目: 知見管理 -->
<script src="app/api-key-setup.js"></script>  <!-- 4番目: APIキー設定 -->
<script src="app/script.js"></script>         <!-- 5番目: メインスクリプト -->
```

**判定**: 読み込み順序は正しい。utils.jsが最初に読み込まれている。

## 1.1.2 関数定義の確認

### utils.js の関数定義状況: ✅ 正常

#### showMessage関数
- **定義**: line 13-32
- **グローバル露出**: 
  - `window.FukaboriUtils.showMessage` (line 58)
  - `window.showMessage` (line 60) ← 直接参照用

#### hashPassword関数
- **定義**: line 106-115
- **グローバル露出**:
  - `window.FukaboriUtils.hashPassword` (line 119)
  - `window.hashPassword` (line 123) ← 直接参照用

#### その他の関数
- `downloadTextFile`: 正常に定義・露出
- `encryptApiKey`: 正常に定義・露出
- `decryptApiKey`: 正常に定義・露出

**判定**: 関数定義とグローバル露出は正しく実装されている。

## 1.1.3 関数呼び出しパターンの詳細

### script.js での呼び出しパターン

#### showMessage関数: 🚨 問題発見
- **直接呼び出し**: 85回（全て `showMessage()` 形式）
- **window経由呼び出し**: 0回
- **問題**: 全て直接呼び出しで、window経由の参照がない

**具体例**:
```javascript
// line 616: showMessage('info', '長時間セッションにより再開します...');
// line 2103: showMessage('error', message);
// line 5127: showMessage('error', `音声テストに失敗しました: ${error.message}`);
```

#### hashPassword関数: 🚨 問題発見
- **直接呼び出し**: 6回（全て `hashPassword()` 形式）
- **window経由呼び出し**: 0回
- **使用箇所**:
  - line 4037: `const passwordHash = hashPassword(password);`
  - line 4049: `const passwordHash = hashPassword(password);`
  - line 4075: `const passwordHash = hashPassword(password);`
  - line 4651: `const passwordHash = hashPassword(password);`
  - line 4693: `const passwordHash = hashPassword(password);`
  - line 4788: `const oldPasswordHash = hashPassword(currentPassword);`

### 他モジュールでの呼び出しパターン

#### file-processing.js: 🚨 混在問題発見
- **独自実装**: line 57 `showMessage(type, message);`
- **インターフェース経由**: line 1232, 1452, 1501 `FileProcessingInterface.showMessage()`
- **問題**: 独自実装とインターフェース経由の混在

#### api-key-setup.js: ✅ 正常
- **window経由**: 4回（全て `window.showMessage()` 形式）
- **問題なし**: 正しいパターンで統一されている

#### knowledge-management.js: 🚨 問題発見
- **直接呼び出し**: `showMessage()` 形式
- **window経由**: `window.downloadTextFile()` 形式
- **問題**: 同一ファイル内で参照方法が混在

## 問題の根本原因

### 1. 参照方法の不統一
- **script.js**: 全て直接呼び出し（85回）
- **api-key-setup.js**: 全てwindow経由（正しい）
- **knowledge-management.js**: 混在
- **file-processing.js**: 独自実装 + インターフェース経由

### 2. スコープの問題
直接呼び出し `showMessage()` は、以下の条件で動作する：
- 関数がグローバルスコープに存在する
- または、同一スコープ内で定義されている

現在のエラーは、直接呼び出しがグローバルスコープで関数を見つけられないことが原因。

### 3. タイミングの問題
utils.jsの読み込みは正しいが、関数の実行タイミングで問題が発生している可能性。

## 解決策の方向性

### 最優先対応
1. **script.js**: 85回の `showMessage()` → `window.showMessage()` に変更
2. **script.js**: 6回の `hashPassword()` → `window.hashPassword()` に変更
3. **file-processing.js**: 独自showMessage実装の削除
4. **knowledge-management.js**: 直接呼び出しをwindow経由に統一

### 統一ルール
**全モジュール**: `window.関数名()` 形式で統一

## 次のステップ
ステップ1.2: 参照方法の統一（修正フェーズ）の実行準備完了 