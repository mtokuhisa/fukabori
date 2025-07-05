# 現状復元ガイド

## 現在の安全な状態
- **Git Commit**: `2e5d0da` - Step1.1: 依存関係の詳細調査完了
- **物理バックアップ**: `backups/20250705_153121_step1_investigation/`
- **日時**: 2025年7月5日 15:31

## 復元方法

### 1. Gitによる復元（推奨）
```bash
# 現在の状態に戻す
git reset --hard 2e5d0da

# または、前の安定状態に戻す
git reset --hard 528ccd6  # APIキー設定分離後の状態
```

### 2. 物理バックアップからの復元
```bash
# 全体復元
cp -r backups/20250705_153121_step1_investigation/app/ ./
cp backups/20250705_153121_step1_investigation/深堀くん.html ./
cp -r backups/20250705_153121_step1_investigation/config/ ./

# 個別ファイル復元
cp backups/20250705_153121_step1_investigation/app/script.js app/
cp backups/20250705_153121_step1_investigation/app/utils.js app/
```

### 3. 復元後の確認
```bash
# ファイルサイズ確認
ls -la app/script.js  # 309,942 bytes であることを確認
ls -la app/utils.js   # 4,312 bytes であることを確認

# 動作確認
open 深堀くん.html  # ブラウザで開いて基本動作確認
```

## 調査で発見した問題点

### 修正が必要な箇所
1. **app/script.js**
   - `showMessage()` 直接呼び出し: 85箇所 → `window.showMessage()` に変更
   - `hashPassword()` 直接呼び出し: 6箇所 → `window.hashPassword()` に変更

2. **app/file-processing.js**
   - 独自showMessage実装の削除（line 57）

3. **app/knowledge-management.js**
   - 直接呼び出しをwindow経由に統一

### 正常な箇所
- **app/api-key-setup.js**: 全てwindow経由で正しい
- **app/utils.js**: 関数定義とグローバル露出は正常

## 次のステップ（Step1.2）の準備
- 問題箇所の特定完了
- 修正方針の決定完了
- 安全な復元ポイントの確保完了

**注意**: Step1.2実行前に必ず現在の状態をコミットすること 