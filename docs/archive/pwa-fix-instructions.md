# 深堀くんv0.7.5 Service Worker修正後の確認手順

## 🔧 **修正内容**
- **問題**: 削除済みの `voice-ui-manager.js` がキャッシュリストに残存
- **解決**: キャッシュリストから削除済みファイルを除去、v0.7.5対応ファイルのみ記載

## 🚀 **確認手順**

### Step 1: ブラウザキャッシュクリア
```
1. 開発者ツール（F12）を開く
2. Application → Storage → Clear storage
3. 「Clear site data」クリック
```

### Step 2: ハードリロード
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Step 3: Service Worker再登録確認
```
期待されるコンソール出力:
🔧 Service Worker インストール開始
📦 キャッシュを開きました  
✅ Service Worker インストール成功
🎯 深堀くん Service Worker 読み込み完了
✅ Service Worker 登録成功 (v0.7.5)
```

### Step 4: PWAインストールテスト
```
1. アドレスバーの📱アイコン確認
2. インストール実行
3. 「深堀くん - AIインタビューアプリ」として追加確認
```

### Step 5: オフライン動作確認
```
1. Network → Offline チェック
2. ページリロード
3. 正常表示確認
```

## ✅ **成功パターン**

### コンソール出力（成功時）
```
🔍 深堀くんv0.7.5 バージョン統一確認テスト開始
✅ マニフェストバージョン正常 (実際: 0.7.5)
✅ Service Worker バージョン正常
🎯 発見されたキャッシュ: fukabori-kun-v0.7.5-emergency-fix
✅ HTML内バージョン統一完了
📊 v0.7.5参照数: 25
🎉 深堀くんv0.7.5 バージョン統一完了！
🚀 PWA化準備完了
```

## 🚨 **エラー発生時**

### Service Worker インストール失敗が続く場合
```
1. ブラウザを完全終了
2. 再起動後にアクセス
3. それでも失敗する場合は、別のブラウザでテスト
```

### 古いキャッシュが残る場合
```javascript
// コンソールで実行
await caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);
location.reload();
```

---

**修正日**: 2025年7月22日  
**対応バージョン**: v0.7.5-emergency-fix 