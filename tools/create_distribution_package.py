#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん仮想サーバ - 企業配布パッケージ作成スクリプト
"""

import os
import sys
import shutil
import zipfile
from datetime import datetime
import platform

def create_distribution_package():
    """企業配布用パッケージを作成"""
    print("="*60)
    print("🏢 深堀くん企業配布パッケージ作成中...")
    print("="*60)
    
    # バージョン情報
    version = "v0.7.6-VirtualServer"
    date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # プラットフォーム判定
    system = platform.system()
    if system == "Darwin":
        platform_name = "macOS"
        app_path = "dist/深堀くん.app"
        executable_path = "dist/深堀くん"
    elif system == "Windows":  
        platform_name = "Windows"
        app_path = "dist/深堀くん.exe" 
        executable_path = "dist/深堀くん"
    else:
        platform_name = "Linux"
        app_path = "dist/深堀くん"
        executable_path = "dist/深堀くん"
    
    # パッケージ名
    package_name = f"深堀くん{version}-{platform_name}配布版_{date_str}"
    package_dir = f"dist/{package_name}"
    
    print(f"📦 パッケージ名: {package_name}")
    print(f"🖥️ プラットフォーム: {platform_name}")
    
    # パッケージディレクトリ作成
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)
    
    # ファイルをコピー
    print("📁 ファイルコピー中...")
    
    try:
        # .appバンドル（macOS）または実行ファイル（Windows/Linux）をコピー
        if os.path.exists(app_path):
            if platform_name == "macOS":
                print(f"  📱 {app_path} をコピー中...")
                shutil.copytree(app_path, f"{package_dir}/深堀くん.app")
            else:
                print(f"  🗂️ {app_path} をコピー中...")
                shutil.copy2(app_path, f"{package_dir}/")
        
        # onedirモードのディレクトリもコピー（オプション）
        if os.path.exists(executable_path) and os.path.isdir(executable_path):
            print(f"  📂 {executable_path}/ をコピー中...")
            shutil.copytree(executable_path, f"{package_dir}/深堀くん-portable")
        
        print("✅ ファイルコピー完了")
        
    except Exception as e:
        print(f"❌ ファイルコピーエラー: {e}")
        return False
    
    # 使用説明書作成
    print("📝 使用説明書作成中...")
    create_readme(package_dir, version, platform_name)
    
    # ZIPファイル作成
    print("🗜️ ZIPパッケージ作成中...")
    zip_path = f"{package_dir}.zip"
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, os.path.dirname(package_dir))
                zipf.write(file_path, arc_path)
                print(f"  ➕ {arc_path}")
    
    # サイズ確認
    zip_size = os.path.getsize(zip_path) / (1024 * 1024)  # MB
    print(f"✅ ZIPパッケージ作成完了: {zip_path}")
    print(f"📊 ファイルサイズ: {zip_size:.1f} MB")
    
    # 配布用ディレクトリは削除（ZIPがあるため）
    shutil.rmtree(package_dir)
    
    return True

def create_readme(package_dir, version, platform_name):
    """使用説明書（README）を作成"""
    
    if platform_name == "macOS":
        installation_steps = """
## 📱 macOS版インストール手順

### 方法1: .appファイル直接実行（推奨）
1. `深堀くん.app` をダブルクリック
2. 「開発元が未確認」の警告が出た場合:
   - 右クリック → 「開く」を選択
   - 「開く」ボタンをクリック
3. 自動でブラウザが起動し、深堀くんが開始されます

### 方法2: Portable版
1. `深堀くん-portable` フォルダ内の `深堀くん` をダブルクリック
2. 同様の手順でブラウザが起動します

### ⚠️ セキュリティ設定
初回実行時に「システム環境設定 > セキュリティとプライバシー」で許可が必要な場合があります。
"""
        
    elif platform_name == "Windows":
        installation_steps = """
## 🖥️ Windows版インストール手順

### 方法1: 実行ファイル直接実行（推奨）
1. `深堀くん.exe` をダブルクリック
2. Windows Defenderの警告が出た場合:
   - 「詳細情報」をクリック
   - 「実行」ボタンをクリック
3. 自動でブラウザが起動し、深堀くんが開始されます

### 方法2: Portable版
1. `深堀くん-portable` フォルダ内の `深堀くん.exe` をダブルクリック
2. 同様の手順でブラウザが起動します

### 🔒 ファイアウォール設定
初回実行時にWindowsファイアウォールの許可ダイアログが表示される場合があります。
「プライベートネットワーク」へのアクセスを許可してください。
"""
    else:
        installation_steps = """
## 🐧 Linux版インストール手順

### 実行方法
1. `深堀くん` ファイルに実行権限を付与:
   ```bash
   chmod +x 深堀くん
   ```
2. ダブルクリックまたはターミナルから実行:
   ```bash
   ./深堀くん
   ```
3. 自動でブラウザが起動し、深堀くんが開始されます

### 📦 必要パッケージ
- Python 3.7以上（通常は内蔵されています）
- Webブラウザ（Chrome、Firefox、Safari等）
"""

    readme_content = f"""# 深堀くん {version} - {platform_name}配布版

## 🎯 概要
深堀くんは「ねほりーの」「はほりーの」があなたの知見を深掘りするAIインタビューアプリです。
この配布版は**仮想サーバ方式**で、ダブルクリックするだけでHTTPSサーバが起動し、
ブラウザで深堀くんを利用できます。

## ✨ 特徴
- 🚀 **ワンクリック起動**: ダブルクリックだけで即座に利用開始
- 🔒 **HTTPS対応**: SSL証明書自動生成でマイク許可が1回のみ
- 📱 **ブラウザ自動起動**: サーバ起動と同時にブラウザが開きます
- 🔐 **ローカル実行**: インターネット接続不要（OpenAI API除く）
- 💾 **ポータブル**: USB等で持ち運び可能

{installation_steps}

## 🌐 使用方法

### 1. アプリ起動
上記の手順でアプリを起動すると、以下のような表示が出ます:
```
==================================================
🎯 深堀くん仮想サーバランチャー v1.0
==================================================
📁 アプリディレクトリ: [パス]
✅ 深堀くんファイル確認完了
🔐 SSL証明書生成完了
🔒 HTTPSサーバ起動: https://localhost:8443
✅ 深堀くん仮想サーバ起動完了！
🚀 ブラウザ起動: https://localhost:8443/
```

### 2. ブラウザでアクセス
自動でブラウザが起動し、`https://localhost:8443` で深堀くんが表示されます。

### 3. 初回設定
1. OpenAI APIキーの設定
2. パスワードの設定（暗号化保存用）
3. マイク許可（初回のみ）

### 4. 使用開始
設定完了後、すぐに音声インタビューを開始できます！

## 🛑 アプリ終了
- ターミナル/コマンドプロンプトで `Ctrl+C`
- または単純にウィンドウを閉じてください

## 🔧 トラブルシューティング

### ブラウザが起動しない場合
手動で `https://localhost:8443` にアクセスしてください。

### ポートが使用中の場合
アプリが自動で別のポート（8444、8445等）を選択します。
表示されるURLを確認してください。

### マイク許可について
- HTTPSによる接続のため、初回のみマイク許可が必要です
- 許可後は自動で音声認識が開始されます

### SSL証明書警告について
自己署名証明書のため「安全でない」警告が出ますが、
「詳細設定」→「localhost:8443にアクセスする」で継続してください。

## 🆘 サポート

### システム要件
- OS: {platform_name}
- メモリ: 4GB以上推奨
- ストレージ: 100MB以上の空き容量
- インターネット接続: OpenAI API使用時のみ必要

### ログ確認
問題が発生した場合、起動時の出力メッセージを確認してください。

### よくある質問
1. **Q: インターネット接続は必要ですか？**
   A: OpenAI APIとの通信時のみ必要です。ローカル機能は全てオフラインで動作します。

2. **Q: ファイアウォールの設定は必要ですか？**
   A: localhostのみの通信のため、通常は設定不要です。

3. **Q: 複数人で同時使用できますか？**
   A: 1つのインスタンスで1人ずつの利用を推奨します。

## 📝 更新履歴
- {version}: 仮想サーバ方式初版リリース
- v0.7.6: リアルタイム文字起こし編集機能対応
- 統一状態管理システム統合

## 📄 ライセンス
このソフトウェアは研究・教育・業務利用を目的として配布されています。

---
**作成日**: {datetime.now().strftime("%Y年%m月%d日")}
**バージョン**: {version}
**プラットフォーム**: {platform_name}
"""

    readme_path = os.path.join(package_dir, "README.md")
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"✅ README.md作成完了: {readme_path}")

if __name__ == "__main__":
    success = create_distribution_package()
    if success:
        print("\n🎉 企業配布パッケージ作成完了！")
        print("📦 作成されたZIPファイルを配布してください")
    else:
        print("\n❌ パッケージ作成に失敗しました")
        sys.exit(1) 