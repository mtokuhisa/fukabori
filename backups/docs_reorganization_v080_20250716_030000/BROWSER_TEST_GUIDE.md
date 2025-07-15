# ブラウザ動作確認ガイド - Step1.2修正効果の検証

## 実行日時
2025年7月5日 15:50

## 事前確認（完了済み）
- ✅ JavaScript構文エラー: 全ファイル正常
- ✅ utils.js関数定義: 5個全て正常
- ✅ window公開: 全関数が利用可能
- ✅ 理論的検証: showMessage、hashPassword動作確認済み

## ブラウザテスト手順

### 🚀 基本動作確認

#### 1. アプリケーション起動テスト
```
1. 深堀くん.htmlをブラウザで開く
2. 開発者ツール（F12）でコンソールを開く
3. エラーメッセージが表示されないことを確認

期待結果:
- ReferenceError: showMessage is not defined が出ない
- ReferenceError: hashPassword is not defined が出ない
- 正常にログイン画面が表示される
```

#### 2. utils.js関数の動作確認
```
コンソールで以下を実行:

// showMessage関数のテスト
window.showMessage('info', 'テストメッセージ');

// hashPassword関数のテスト
window.hashPassword('testpassword');

期待結果:
- showMessage: メッセージが表示される（コンソールまたはUI）
- hashPassword: ハッシュ値が返される（例: "f9w8wr"）
```

### 🔧 APIキー設定テスト

#### 3. APIキー設定モーダル
```
1. 「その他設定」ボタンをクリック
2. APIキー設定モーダルが開くことを確認
3. APIキー入力フィールドにテスト値を入力
4. パスワード設定を行う

期待結果:
- モーダルが正常に開く
- エラーメッセージが適切に表示される
- window.showMessage()が正常に動作する
```

### 📁 ファイル処理テスト

#### 4. ファイル添付機能
```
1. ログイン完了後、ファイル添付ボタンをクリック
2. ファイル選択ダイアログが開くことを確認
3. テストファイル（PDF、Excel等）を選択

期待結果:
- ファイル選択が正常に動作
- エラー時にFileProcessingInterface.showMessage()が動作
- 内部でwindow.showMessage()が呼ばれる
```

### 🧠 知見管理テスト

#### 5. 知見保存機能
```
1. セッション中に知見が抽出される場面を作る
2. 知見保存時のメッセージを確認
3. 知見ダウンロード機能をテスト

期待結果:
- 知見保存時にwindow.showMessage()でメッセージ表示
- ダウンロード時にwindow.downloadTextFile()が動作
- エラーなく処理が完了
```

## 🚨 確認すべきエラーパターン

### 以前発生していた問題（解決済み）
```javascript
// これらのエラーが出ないことを確認
ReferenceError: showMessage is not defined
ReferenceError: hashPassword is not defined
```

### 新しく注意すべき点
```javascript
// これらは正常な動作
window.showMessage is not a function  // utils.js読み込み前の場合
TypeError: Cannot read property 'showMessage' of undefined  // window未定義の場合
```

## 📊 成功基準

### ✅ 必須項目
1. **起動時エラーなし**: ReferenceErrorが発生しない
2. **基本機能動作**: ログイン、設定、ファイル処理が正常
3. **メッセージ表示**: エラー・成功メッセージが適切に表示
4. **APIキー機能**: 暗号化・復号化が正常に動作

### 🎯 改善確認項目
1. **安定性向上**: 以前のエラーが解消されている
2. **一貫性**: 全モジュールで統一されたメッセージ表示
3. **パフォーマンス**: 読み込み時間に大きな変化がない

## 🐛 問題が発生した場合

### デバッグ手順
```javascript
// コンソールで実行して状況確認
console.log('utils.js読み込み確認:', typeof window.showMessage);
console.log('関数一覧:', Object.keys(window).filter(k => k.includes('Message')));

// 詳細なエラー情報を確認
window.onerror = function(msg, url, line, col, error) {
    console.error('エラー詳細:', {msg, url, line, col, error});
};
```

### 復元方法
```bash
# 問題が発生した場合の復元
git reset --hard 4d49884  # Step1.3完了時点
# または
git reset --hard f1387d3  # Step1.1完了時点
```

## 📝 テスト結果の記録

### 記録フォーマット
```
日時: 2025年7月5日 XX:XX
ブラウザ: Chrome/Firefox/Safari XX.X
OS: macOS/Windows XX

✅/❌ 起動時エラー確認:
✅/❌ utils.js関数動作:
✅/❌ APIキー設定:
✅/❌ ファイル処理:
✅/❌ 知見管理:

コメント:
```

## 🎉 期待される改善効果

### Before（修正前）
- ReferenceError頻発
- 機能の不安定性
- 依存関係の混乱

### After（修正後）
- エラーの解消
- 安定した動作
- 明確な依存関係

---

**このテストガイドに従って動作確認を行っていただき、結果をお教えください。問題が発生した場合は、エラーメッセージとブラウザのコンソール情報をお知らせいただければ、すぐに対応いたします。** 