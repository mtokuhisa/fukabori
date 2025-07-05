# Step1 Investigation Backup - #午後

## バックアップ内容
- app/script.js (309,942 bytes) - メインスクリプト
- app/utils.js (4,312 bytes) - ユーティリティ関数
- app/file-processing.js (71,021 bytes) - ファイル処理
- app/knowledge-management.js (52,150 bytes) - 知見管理
- app/api-key-setup.js (24,323 bytes) - APIキー設定
- 深堀くん.html (71,353 bytes) - メインHTML
- config/ - 設定ファイル群

## 復元方法
```bash
# 全体復元
cp -r backups/20250705_153121_step1_investigation/app/ ./
cp backups/20250705_153121_step1_investigation/深堀くん.html ./
cp -r backups/20250705_153121_step1_investigation/config/ ./

# 個別復元例
cp backups/20250705_153121_step1_investigation/app/script.js app/
```

## 状態
- git commit: 未実行（調査段階）
- 問題発見: showMessage直接呼び出し85回、hashPassword直接呼び出し6回
- 修正前の安全な状態
