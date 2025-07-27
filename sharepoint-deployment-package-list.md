# SharePoint配布パッケージ - ファイル一覧

**作成日**: 2025年7月26日  
**対象**: 深堀くんv0.7.6 SharePoint配布版  
**Phase 1-3-1実装**: 配布に必要なファイル一覧の確定

---

## ✅ **必須ファイル（SharePoint配布対象）**

### 🌐 **メインファイル**
- `深堀くん.html` - メインHTMLファイル（エントリーポイント）

### 📁 **appフォルダ（25ファイル）**
```
app/
├── ai-manager.js
├── api-key-setup.js
├── data-manager.js
├── editable-transcript-ui.js
├── embedded-api-manager.js
├── file-manager.js
├── file-processing.js
├── knowledge-file-manager-interface.js
├── knowledge-management.js
├── knowledge-system.js
├── phase-manager.js
├── script.js
├── session-controller.js
├── session-manager.js
├── session-start-manager.js
├── state-integration-adapter.js
├── storage-manager.js
├── style.css
├── transcript-edit-manager.js
├── ui-advanced.js
├── ui-basic.js
├── ui-manager.js
├── ui-screens.js
├── ui-state-display.js
├── unified-state-manager.js
├── unified-state-manager/
│   ├── core.js
│   ├── styles.css
│   ├── ui-module.js
│   └── voice-module.js
├── utils.js
├── voice-core.js
├── voice-error-handler.js
├── voice-phase2-manager.js
├── voice-processing-manager.js
└── voice-recognition-manager.js
```

### ⚙️ **configフォルダ（12ファイル）**
```
config/
├── app_config_loader.js
├── app_settings.js
├── categories_data.js
├── categories.csv
├── changelog_data.js
├── infographic_system.js
├── phase2_integration.js
├── prompts.js
├── safety_backup.js
├── speech_shortening_engine.js
├── speech_shortening_phase2.js
├── user_names_data.js
├── user_names.csv
└── voice_config.js
```

### 🖼️ **assetsフォルダ（4ファイル）**
```
assets/
├── fukabori_copy.png
├── fukabori_logo_main.png
├── fukabori_logo_wb.png
├── fukabori_logo.png
├── hahori_avatar.png
└── nehori_avatar.png
```

### 📱 **PWA関連ファイル**
```
├── manifest.json
├── sw.js
├── service-worker.js
└── favicon.ico
```

### 📄 **pagesフォルダ（5ファイル）**
```
pages/
├── changelog.html
├── faq.html
├── overview.html
├── screenshots.html
└── technical.html
```

---

## ❌ **除外ファイル（SharePoint配布不要）**

### 🧪 **テスト・開発用ファイル**
```
tests/ - フォルダ全体除外
backups/ - フォルダ全体除外
tools/ - フォルダ全体除外

ルートディレクトリの開発用ファイル:
├── test-delete-fix.js
├── quick-test.js
├── voice-delete-integration-test.js
├── version-verification-test.js
├── disable_dev_mode.html
└── package.json（npm関連は不要）
└── package-lock.json
```

### 📝 **ドキュメント・報告書**
```
docs/
reports/
画面キャプチャ/
深堀くん_埋め込みAPI実装仕様書.md
```

---

## 📊 **ファイル統計**

### 必須ファイル合計
- **メインファイル**: 1個
- **app/**: 25個のJSファイル + 1個のCSSファイル + unified-state-manager/サブフォルダ
- **config/**: 12個
- **assets/**: 6個 
- **pages/**: 5個
- **PWA**: 4個
- **合計**: 約53個のファイル

### 除外ファイル合計
- **tests/**: 約30個以上
- **backups/**: 約100個以上  
- **docs/**: 約20個以上
- **開発用**: 約10個
- **合計**: 約160個以上のファイルを除外

---

## 🏗️ **配布パッケージ作成手順**

### Step 1: 必須ファイルのコピー
```bash
# SharePoint配布用フォルダ作成
mkdir sharepoint-deployment-package

# 必須ファイルのコピー
cp 深堀くん.html sharepoint-deployment-package/
cp -r app/ sharepoint-deployment-package/
cp -r config/ sharepoint-deployment-package/
cp -r assets/ sharepoint-deployment-package/
cp -r pages/ sharepoint-deployment-package/
cp manifest.json sharepoint-deployment-package/
cp sw.js sharepoint-deployment-package/
cp service-worker.js sharepoint-deployment-package/
cp favicon.ico sharepoint-deployment-package/
```

### Step 2: 不要ファイルのクリーンアップ
```bash
# バックアップファイルの削除
rm -f sharepoint-deployment-package/app/*.backup
rm -f sharepoint-deployment-package/app/*.bak
rm -f sharepoint-deployment-package/app/*.broken

# 開発用ファイルの削除（念のため）
rm -f sharepoint-deployment-package/test-*.js
rm -f sharepoint-deployment-package/quick-test.js
rm -f sharepoint-deployment-package/voice-delete-integration-test.js
rm -f sharepoint-deployment-package/version-verification-test.js
```

### Step 3: ZIP圧縮
```bash
cd sharepoint-deployment-package
zip -r ../深堀くんv0.7.6-SharePoint配布版.zip .
```

---

## ✅ **検証チェックリスト**

### 必須ファイル存在確認
- [ ] 深堀くん.html（メインエントリーポイント）
- [ ] app/style.css（メインスタイル）
- [ ] app/script.js（メインロジック）
- [ ] config/app_settings.js（基本設定）
- [ ] assets/fukabori_logo.png（メインロゴ）
- [ ] manifest.json（PWA設定）

### 不要ファイル除外確認
- [ ] testsフォルダが含まれていない
- [ ] backupsフォルダが含まれていない
- [ ] test-delete-fix.js等のテスト用ファイルが含まれていない
- [ ] .bakや.backupファイルが含まれていない

### パス整合性確認
- [ ] HTMLファイルから全ファイルへの相対パス参照が正しい
- [ ] CSSファイルから画像ファイルへの相対パス参照が正しい
- [ ] Service Worker登録パスが相対パスになっている

---

**更新履歴**:
- 2025年7月26日: 初回作成（Phase 1-3-1実装） 