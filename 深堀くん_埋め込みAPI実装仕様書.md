# 深堀くんv2.0 - 埋め込みAPI Key実装仕様書

## 🎯 プロジェクト概要

**目的**: 企業配布向けの暗号化API Key埋め込み機能を既存システムに統合  
**方針**: 最大限のリスクヘッジ・段階的実装・既存システム最大活用  
**セキュリティ**: 利便性重視（セキュリティリスクは承知の上）

---

## 🔐 暗号化仕様

### **二重暗号化システム**
```
[API Key] 
    ↓ 埋め込み時暗号化（パスワード: "irobakuf"）
[埋め込み暗号化データ] 
    ↓ ユーザー認証時復号化
[生API Key] 
    ↓ ローカル保存時再暗号化（パスワード: ユーザー設定） 
[LocalStorage暗号化データ]
```

### **復号化パスワード**
- **固定パスワード**: `"irobakuf"`
- **用途**: アプリ埋め込み暗号化データの復号化
- **ユーザー入力**: Step0画面で「企業パスワード」として入力

---

## 📋 完全TODO一覧

### **Phase 0: 完全バックアップ・準備フェーズ**
- [ ] **backup_001**: 実装前完全バックアップ作成 - 全ファイル
- [ ] **backup_002**: git stash/commit で現在状態保存
- [ ] **backup_003**: ローカルサーバーでの動作確認・スクリーンショット撮影
- [ ] **analysis_001**: API key関連の全関数・依存関係の最終確認
- [ ] **analysis_002**: 既存テストケース実行・結果記録
- [ ] **preparation_001**: 暗号化用テストAPI key準備
- [ ] **preparation_002**: 企業パスワード確認（"irobakuf"）

### **Phase 1: 暗号化基盤構築フェーズ**
- [ ] **phase1_001**: 暗号化スクリプト作成 (tools/encrypt-api-key.js)
- [ ] **phase1_002**: 埋め込みAPI key管理クラス設計・実装 (app/embedded-api-manager.js)
- [ ] **phase1_003**: 既存CryptoJS活用の暗号化・復号化ロジック実装
- [ ] **phase1_004**: 単体テスト作成・実行 (tests/embedded-api-test.html)
- [ ] **phase1_005**: セキュリティテスト (復号化成功・失敗パターン)
- [ ] **phase1_006**: メモリクリア機能実装・テスト

### **Phase 2: 既存システム統合フェーズ**
- [ ] **phase2_001**: StorageManager拡張 - 埋め込みAPI keyサポート追加
- [ ] **phase2_002**: 優先順位制御ロジック実装 (getApiKeyWithPriority)
- [ ] **phase2_003**: isApiKeyConfigured関数拡張 - 埋め込みAPI key考慮
- [ ] **phase2_004**: AppState拡張 - apiKeySourceフィールド追加
- [ ] **phase2_005**: testApiConnection統合 - 埋め込みAPI key対応
- [ ] **phase2_006**: 統合テスト - 既存機能との整合性確認

### **Phase 3: UI統合・Step0拡張フェーズ**
- [ ] **phase3_001**: Step0システム拡張 - 企業パスワード入力オプション追加
- [ ] **phase3_002**: 深堀くん.html修正 - 企業パスワードUI追加
- [ ] **phase3_003**: ApiKeySetupModule拡張 - 企業認証機能追加
- [ ] **phase3_004**: メッセージ表示統合 - 企業認証用メッセージ追加
- [ ] **phase3_005**: UIテスト - 企業パスワード入力フロー確認
- [ ] **phase3_006**: レスポンシブデザイン確認 - モバイル表示テスト

### **Phase 4: 最終テスト・デプロイフェーズ**
- [ ] **phase4_001**: 総合テスト - 全シナリオテスト実行
- [ ] **phase4_002**: 回帰テスト - 既存機能全体の動作確認
- [ ] **phase4_003**: パフォーマンステスト - 起動時間・メモリ使用量確認
- [ ] **phase4_004**: エラーハンドリングテスト - 不正パスワード等
- [ ] **phase4_005**: ユーザーマニュアル作成 - 企業パスワード設定ガイド
- [ ] **phase4_006**: ロールバック手順書作成 - 緊急時復旧方法

---

## 🏗️ 技術仕様詳細

### **既存システム活用**
- **暗号化ライブラリ**: 既存CryptoJS (https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js)
- **暗号化方式**: 既存AES + PBKDF2 (1000回反復)
- **パスワードハッシュ**: 既存hashPassword関数活用
- **メッセージ表示**: 既存window.showMessage活用
- **UI**: 既存Step0システム拡張

### **優先順位制御ロジック**
```javascript
function getApiKeyWithPriority() {
    // 1. 設定画面API key (最優先)
    if (window.StorageManager.apiKey.getCount() > 0) {
        return loadUserApiKey();
    }
    
    // 2. 埋め込み企業API key
    if (isEmbeddedApiKeyAuthenticated()) {
        return getEmbeddedApiKey();
    }
    
    // 3. 未設定
    return null;
}
```

### **状態管理拡張**
```javascript
// AppState拡張（最小限）
AppState.apiKeySource = 'user' | 'embedded' | null;
AppState.embeddedAuthenticated = false;

// LocalStorage追加項目
localStorage: {
    'fukabori_embedded_auth': 'authenticated' | null,
    'fukabori_embedded_feature': 'true' | 'false'
}
```

---

## 📁 ファイル構成

```
深堀アプリ/
├── app/
│   ├── embedded-api-manager.js     # 新規：埋め込みAPI管理
│   ├── storage-manager.js          # 拡張：優先順位制御追加
│   ├── api-key-setup.js           # 拡張：企業パスワード対応
│   └── script.js                  # 軽微修正：統合呼び出し
├── tools/
│   └── encrypt-api-key.js         # 新規：暗号化スクリプト
├── tests/
│   ├── embedded-api-test.html     # 新規：単体テスト
│   └── integration-test.html      # 拡張：統合テスト
└── 深堀くん.html                  # 軽微修正：UI拡張
```

---

## 🛡️ リスクヘッジ戦略

### **1. 完全バックアップ**
```bash
# 実装前完全バックアップ
backup_embedded_api_$(date +%Y%m%d_%H%M%S)/
├── 全ソースファイル
├── 現在のLive環境スクリーンショット  
├── 既存テスト結果
└── 設定ファイル群
```

### **2. 機能フラグ制御**
```javascript
// 緊急ロールバック用関数（常時利用可能）
window.emergencyRollback = function() {
    localStorage.setItem('fukabori_embedded_feature', 'false');
    localStorage.removeItem('fukabori_embedded_auth');
    location.reload();
};
```

### **3. エラーハンドリング**
```javascript
// 全ての新機能をtry-catch囲い
try {
    // 新機能実行
} catch (error) {
    console.error('埋め込みAPI機能エラー:', error);
    // 既存システムにフォールバック
    return fallbackToOriginalSystem();
}
```

---

## 📚 既存システム参考資料

### **重要ファイル一覧**
| ファイル | 役割 | 重要度 |
|----------|------|--------|
| `app/storage-manager.js` | 暗号化・LocalStorage管理 | ⭐⭐⭐⭐⭐ |
| `app/api-key-setup.js` | Step0システム・初回設定 | ⭐⭐⭐⭐⭐ |
| `深堀くん.html` | UI・モーダル定義 | ⭐⭐⭐⭐ |
| `app/script.js` | メイン処理・API接続テスト | ⭐⭐⭐⭐ |
| `app/utils.js` | ハッシュ化・暗号化ユーティリティ | ⭐⭐⭐ |

### **既存暗号化システム**
```javascript
// app/storage-manager.js - 行48-61
function encryptApiKey(apiKey, password) {
    const key = CryptoJS.PBKDF2(password, 'fukabori-salt', {
        keySize: 256/32,
        iterations: 1000
    });
    const encrypted = CryptoJS.AES.encrypt(apiKey, key.toString());
    return encrypted.toString();
}
```

### **既存パスワードハッシュ**
```javascript
// app/utils.js - 行115-130
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
```

### **既存API接続テスト**
```javascript
// app/script.js - 行3302-3370
async function testApiConnection() {
    if (!AppState.apiKey) {
        return false;
    }
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AppState.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('❌ API接続テストエラー:', error);
        return false;
    }
}
```

---

## 🔍 既存システム状態管理

### **AppState構造**
```javascript
// app/script.js内で定義
const AppState = {
    apiKey: null,           // 現在のAPI key
    sessionActive: false,   // セッション状態
    currentTheme: null,     // 現在のテーマ
    // 拡張予定
    apiKeySource: null,     // 'user' | 'embedded' | null
    embeddedAuthenticated: false
};
```

### **LocalStorage使用状況**
```javascript
// 既存のLocalStorageキー
'fukabori_encrypted_key_${passwordHash}' // 暗号化API key
'fukabori_key_timestamp_${passwordHash}' // API key保存時刻
'fukabori_password_hashes'               // パスワードハッシュリスト
'fukabori_login_state'                   // ログイン状態
'fukabori_theme_input'                   // テーマ入力状態

// 追加予定キー
'fukabori_embedded_auth'                 // 企業認証状態
'fukabori_embedded_feature'              // 機能有効/無効フラグ
```

---

## 🚀 実装開始手順

### **開発環境準備**
1. ローカルサーバー起動: `python3 -m http.server 8000`
2. ブラウザでアクセス: `http://localhost:8000/深堀くん.html`
3. 開発者ツール開く: コンソール・ネットワークタブ確認

### **Phase 0から開始**
```bash
# 実装前バックアップ
mkdir backup_embedded_api_$(date +%Y%m%d_%H%M%S)
cp -r app/ backup_embedded_api_*/
cp 深堀くん.html backup_embedded_api_*/

# 現在の動作確認・スクリーンショット撮影
# → ブラウザで深堀くん.htmlを開いて動作確認
```

---

## ⚡ 重要な実装ポイント

### **1. 既存システムとの共存**
- 既存のAPI key管理機能は完全保持
- 新機能は既存機能に影響を与えない設計
- 優先順位: 設定画面API key > 埋め込みAPI key

### **2. セキュリティ配慮（現実的範囲）**
- 復号化後は既存の暗号化システムで再保護
- メモリクリア機能実装
- タイムアウト機能（30分）
- 機能無効化フラグ

### **3. UI/UX統合**
- 既存Step0システムの自然な拡張
- 既存デザインシステムの完全活用
- エラーメッセージの一貫性

---

## 📞 サポート・トラブルシューティング

### **緊急ロールバック**
```javascript
// ブラウザコンソールで実行
window.emergencyRollback();
```

### **デバッグ用関数**
```javascript
// 開発中のデバッグ用
window.debugEmbeddedApi = function() {
    console.log('AppState:', AppState);
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Embedded auth:', localStorage.getItem('fukabori_embedded_auth'));
};
```

---

## ✅ 実装完了基準

- [ ] 全TODOアイテムの完了
- [ ] 既存機能の完全動作確認
- [ ] 企業パスワード認証フローの動作確認
- [ ] エラーハンドリングの動作確認
- [ ] パフォーマンスの問題なし
- [ ] ロールバック手順の動作確認

---

**実装開始準備完了！Phase 0のバックアップから段階的に開始してください。** 