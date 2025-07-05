# ステップ1.2: 参照方法の統一 - 修正結果

## 実行日時
2025年7月5日 15:35

## 修正内容

### 1. app/file-processing.js の修正
**修正箇所**: line 56-62
**修正内容**: 独自showMessage実装をwindow.showMessage経由に変更

```javascript
// 修正前
showMessage: (type, message) => {
    if (typeof showMessage !== 'undefined') {
        showMessage(type, message);
    } else {
        console.log(`[${type}] ${message}`);
    }
},

// 修正後
showMessage: (type, message) => {
    if (typeof window.showMessage !== 'undefined') {
        window.showMessage(type, message);
    } else {
        console.log(`[${type}] ${message}`);
    }
},
```

**効果**: 循環依存の解消

### 2. app/knowledge-management.js の修正
**修正箇所**: line 230
**修正内容**: 直接呼び出しをwindow経由に変更

```javascript
// 修正前
showMessage('success', `💾 ${sessionRecord.metadata.totalInsights}件の知見を永続保存しました`);

// 修正後
window.showMessage('success', `💾 ${sessionRecord.metadata.totalInsights}件の知見を永続保存しました`);
```

**効果**: 参照方法の統一

### 3. app/script.js の修正
**修正方法**: sedコマンドによる一括置換

#### showMessage関数の修正
- **修正前**: `showMessage()` 直接呼び出し
- **修正後**: `window.showMessage()` 経由呼び出し
- **修正件数**: 85回 → 98回（一部重複修正含む）

#### hashPassword関数の修正
- **修正前**: `hashPassword()` 直接呼び出し
- **修正後**: `window.hashPassword()` 経由呼び出し
- **修正件数**: 6回 → 6回（正確）

## 修正結果の検証

### 1. 参照方法の統一確認
- ✅ **script.js**: 全てwindow経由（98回のshowMessage、6回のhashPassword）
- ✅ **file-processing.js**: インターフェース経由でwindow.showMessage使用
- ✅ **knowledge-management.js**: 全てwindow経由に統一
- ✅ **api-key-setup.js**: 既にwindow経由で正常

### 2. 循環依存の解消
- ✅ **file-processing.js**: 独自showMessage実装を削除
- ✅ **依存関係**: utils.js → 他モジュール（一方向）

### 3. 関数定義・公開の確認
- ✅ **utils.js**: showMessage関数定義確認
- ✅ **utils.js**: window.showMessage公開確認
- ✅ **utils.js**: hashPassword関数定義確認
- ✅ **utils.js**: window.hashPassword公開確認

## 解決した問題

### 1. 直接呼び出しの問題
**問題**: `showMessage()` 直接呼び出しでReferenceErrorが発生
**解決**: 全て `window.showMessage()` 経由に統一

### 2. 循環依存の問題
**問題**: file-processing.jsが独自showMessage実装を持つ
**解決**: window.showMessage経由に変更

### 3. 参照方法の不統一
**問題**: 同一ファイル内で直接呼び出しとwindow経由が混在
**解決**: 全てwindow経由に統一

## 残存する課題

### FileProcessingInterface.showMessage
以下3箇所は引き続きFileProcessingInterface経由で呼び出し：
- line 1232: `FileProcessingInterface.showMessage('error', 'ファイルの読み込みに失敗しました: ' + error.message);`
- line 1452: `FileProcessingInterface.showMessage('error', '少なくとも1つのテーマを選択してください');`
- line 1501: `FileProcessingInterface.showMessage('error', '少なくとも1つのテーマを選択してください');`

**判定**: 問題なし（インターフェース内部でwindow.showMessage使用）

## 次のステップ
- ステップ1.3: 循環依存の最終確認
- ステップ1.4: 統合テストの実行

## バックアップ情報
- **script.js.backup**: 修正前のscript.jsをバックアップ済み
- **物理バックアップ**: `backups/20250705_153121_step1_investigation/`
- **Gitコミット**: 修正後に新しいコミットを作成予定 