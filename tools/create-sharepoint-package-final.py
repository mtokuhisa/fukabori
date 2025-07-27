#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん SharePoint配布パッケージ - 最終配布版作成スクリプト
========================================================

単一HTMLファイル化されたSharePoint配布版を
企業配布用の完全なパッケージとして作成

含まれる内容:
- 単一HTMLファイル（深堀くん_SharePoint配布版_xxx.html）
- 配布手順書（SharePoint_配布手順.md）
- 検証ツール（verify-sharepoint-deployment.py）
- トラブルシューティングガイド

使用方法:
    python3 tools/create-sharepoint-package-final.py
"""

import os
import shutil
import zipfile
from pathlib import Path
from datetime import datetime


class SharePointFinalPackageCreator:
    def __init__(self, source_dir=None, output_dir=None):
        """
        最終パッケージ作成の初期化
        
        Args:
            source_dir: ソースディレクトリ（デフォルト: 現在のディレクトリ）
            output_dir: 出力ディレクトリ（デフォルト: ソースディレクトリ）
        """
        self.source_dir = Path(source_dir) if source_dir else Path.cwd()
        self.output_dir = Path(output_dir) if output_dir else self.source_dir
        self.build_time = datetime.now()
        self.package_name = f"深堀くんv0.7.6-SharePoint企業配布版_{self.build_time.strftime('%Y%m%d_%H%M%S')}"
        self.temp_dir = self.output_dir / "temp_final_package"
        
        print(f"📦 深堀くん SharePoint企業配布版パッケージ作成開始")
        print(f"📁 ソースディレクトリ: {self.source_dir}")
        print(f"📁 出力ディレクトリ: {self.output_dir}")
        print(f"📦 パッケージ名: {self.package_name}")
        print("-" * 60)

    def find_latest_single_html(self):
        """最新の単一HTMLファイルを検索"""
        sharepoint_files = list(self.source_dir.glob("深堀くん_SharePoint配布版_*.html"))
        
        if not sharepoint_files:
            print("❌ SharePoint配布版HTMLファイルが見つかりません")
            return None
        
        # 最新ファイルを選択（ファイル名でソート）
        latest_file = sorted(sharepoint_files)[-1]
        print(f"✅ 最新HTMLファイル発見: {latest_file.name}")
        return latest_file

    def create_deployment_guide(self):
        """配布手順書を作成"""
        guide_content = f"""# 深堀くん SharePoint配布手順書

**作成日**: {self.build_time.strftime('%Y年%m月%d日 %H:%M:%S')}  
**バージョン**: v0.7.6  
**対象**: SharePoint Online / SharePoint Server

---

## 🎯 概要

この配布版は、深堀くんをSharePoint環境で完全に動作させるために最適化された単一HTMLファイルです。
全ての依存関係（CSS、JavaScript、画像）が埋め込まれており、SharePointにアップロードするだけで使用できます。

## 📋 配布手順

### Step 1: SharePointサイトにアクセス
1. 対象のSharePointサイトにアクセス
2. ドキュメントライブラリを開く
3. 適切なフォルダを選択（推奨：`アプリ` または `ツール` フォルダ）

### Step 2: HTMLファイルのアップロード
1. 「アップロード」→「ファイル」を選択
2. `深堀くん_SharePoint配布版_v0.7.6_xxx.html` をアップロード
3. アップロード完了を確認

### Step 3: 共有設定
1. アップロードしたファイルを右クリック
2. 「共有」を選択
3. 適切な権限を設定：
   - **組織内の全員**: 全社配布の場合
   - **特定のユーザー**: 限定配布の場合
4. 「リンクのコピー」でアクセスURLを取得

### Step 4: 動作確認
1. 共有リンクをブラウザで開く
2. 深堀くんが正常に表示されることを確認
3. マイク許可ダイアログが表示されることを確認
4. 音声認識が動作することを確認

## ✅ 動作確認チェックリスト

- [ ] HTMLファイルが正常に表示される
- [ ] CSS スタイルが適用されている
- [ ] ロゴ・アバター画像が表示される
- [ ] マイク許可ダイアログが表示される
- [ ] 音声認識が動作する
- [ ] AI応答が正常に動作する
- [ ] リアルタイム編集機能が動作する

## 🔧 トラブルシューティング

### 問題: ファイルが開けない
**原因**: ファイル形式制限  
**解決**: 管理者にHTMLファイルの許可を依頼

### 問題: スタイルが崩れている
**原因**: ブラウザキャッシュ  
**解決**: Ctrl+F5 でハードリフレッシュ

### 問題: マイクが動作しない
**原因**: HTTPS接続が必要  
**解決**: SharePointのHTTPS URLを使用

### 問題: 音声認識が動作しない
**原因**: ブラウザの音声認識設定  
**解決**: Chrome/Edge の最新版を使用

## 📊 技術仕様

- **ファイルサイズ**: 約1.4MB
- **推定gzip圧縮後**: 約470KB
- **対応ブラウザ**: Chrome 80+, Edge 80+, Firefox 75+
- **必要権限**: マイクアクセス許可
- **ネットワーク**: HTTPS接続必須

## 🛡️ セキュリティ考慮事項

- 全てのコードが単一ファイルに含まれ、外部依存なし
- PWA機能は無効化済み（Service Worker削除）
- ローカルストレージのみ使用（サーバー送信なし）
- OpenAI API キーはユーザー個別設定

## 📞 サポート

技術的な問題や質問がある場合は、IT管理者にお問い合わせください。

---

**注意**: このファイルは自動生成されています。
編集が必要な場合は、元のソースファイルを修正してリビルドしてください。
"""
        
        guide_path = self.temp_dir / "SharePoint_配布手順.md"
        with open(guide_path, 'w', encoding='utf-8') as f:
            f.write(guide_content)
        
        print("✅ 配布手順書作成完了")
        return guide_path

    def create_verification_tool(self):
        """検証ツールを作成"""
        tool_content = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SharePoint配布版検証ツール
========================

SharePoint環境での深堀くん動作を検証するためのツール

使用方法:
    python3 verify-sharepoint-deployment.py <SharePoint_URL>
"""

import sys
import requests
from urllib.parse import urlparse

def verify_sharepoint_deployment(url):
    """SharePoint配布版の動作を検証"""
    print(f"🔍 SharePoint配布版検証開始: {url}")
    print("-" * 50)
    
    try:
        # HTTP接続テスト
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            print("✅ HTTP接続: 成功")
            
            # HTTPS確認
            parsed_url = urlparse(url)
            if parsed_url.scheme == 'https':
                print("✅ HTTPS接続: 確認")
            else:
                print("⚠️  HTTPS接続: HTTPが使用されています（音声認識に影響の可能性）")
            
            # HTML内容確認
            content = response.text
            
            # 基本要素の確認
            checks = [
                ("深堀くんタイトル", "深堀くん" in content),
                ("CSS埋め込み", "<style>" in content),
                ("JavaScript埋め込み", "<script>" in content and "app_settings" in content),
                ("Base64画像", "data:image/" in content),
                ("PWA削除", "manifest.json" not in content),
            ]
            
            for check_name, result in checks:
                status = "✅" if result else "❌"
                print(f"{status} {check_name}: {'確認' if result else '未確認'}")
            
            print("-" * 50)
            print("📊 検証完了")
            
            all_passed = all(result for _, result in checks)
            if all_passed:
                print("🎉 全ての検証項目が合格しました！")
                return True
            else:
                print("⚠️  一部検証項目で問題が検出されました")
                return False
                
        else:
            print(f"❌ HTTP接続失敗: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ 検証エラー: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("使用方法: python3 verify-sharepoint-deployment.py <SharePoint_URL>")
        return 1
    
    url = sys.argv[1]
    success = verify_sharepoint_deployment(url)
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
'''
        
        tool_path = self.temp_dir / "verify-sharepoint-deployment.py"
        with open(tool_path, 'w', encoding='utf-8') as f:
            f.write(tool_content)
        
        # 実行権限を付与
        os.chmod(tool_path, 0o755)
        
        print("✅ 検証ツール作成完了")
        return tool_path

    def create_readme(self, html_file_name):
        """README.mdを作成"""
        readme_content = f"""# 深堀くん SharePoint企業配布版

**バージョン**: v0.7.6  
**作成日**: {self.build_time.strftime('%Y年%m月%d日 %H:%M:%S')}  
**パッケージ内容**: SharePoint配布用最適化版

## 📦 パッケージ内容

1. **{html_file_name}**  
   - 深堀くん本体（単一HTMLファイル）
   - 全ての依存関係を埋め込み済み
   - SharePointに直接アップロード可能

2. **SharePoint_配布手順.md**  
   - 詳細な配布手順書
   - トラブルシューティングガイド
   - 動作確認チェックリスト

3. **verify-sharepoint-deployment.py**  
   - 配布後の動作検証ツール
   - 自動テスト機能付き

## 🚀 クイックスタート

1. SharePointドキュメントライブラリに `{html_file_name}` をアップロード
2. ファイルを共有設定
3. 共有リンクでアクセス
4. マイク許可を設定
5. 利用開始！

## 📋 システム要件

- **ブラウザ**: Chrome 80+, Edge 80+, Firefox 75+
- **接続**: HTTPS必須
- **権限**: マイクアクセス許可
- **環境**: SharePoint Online / SharePoint Server

## 🔧 特徴

- ✅ 外部依存関係ゼロ
- ✅ PWA機能削除（SharePoint最適化）
- ✅ 画像Base64埋め込み
- ✅ CSS/JavaScript完全インライン化
- ✅ 1.4MBの軽量ファイル

## 📞 サポート

詳細は `SharePoint_配布手順.md` を参照してください。

---

**注意**: このパッケージは自動生成されています。
"""
        
        readme_path = self.temp_dir / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        print("✅ README.md作成完了")
        return readme_path

    def create_final_package(self):
        """最終パッケージを作成"""
        try:
            # 最新の単一HTMLファイルを検索
            html_file = self.find_latest_single_html()
            if not html_file:
                return False
            
            # 一時ディレクトリ作成
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
            self.temp_dir.mkdir(parents=True)
            
            # HTMLファイルをコピー
            shutil.copy2(html_file, self.temp_dir)
            print(f"✅ HTMLファイルコピー完了: {html_file.name}")
            
            # 配布手順書作成
            self.create_deployment_guide()
            
            # 検証ツール作成
            self.create_verification_tool()
            
            # README作成
            self.create_readme(html_file.name)
            
            # ZIPファイル作成
            zip_path = self.output_dir / f"{self.package_name}.zip"
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in self.temp_dir.rglob('*'):
                    if file_path.is_file():
                        arcname = file_path.relative_to(self.temp_dir)
                        zipf.write(file_path, arcname)
            
            # 一時ディレクトリ削除
            shutil.rmtree(self.temp_dir)
            
            # 結果報告
            zip_size = zip_path.stat().st_size
            print("-" * 60)
            print("🎉 SharePoint企業配布版パッケージ作成完了!")
            print(f"📁 出力ファイル: {zip_path}")
            print(f"📊 パッケージサイズ: {zip_size:,} bytes")
            print(f"📦 含まれるファイル:")
            print(f"   - {html_file.name}")
            print(f"   - SharePoint_配布手順.md")
            print(f"   - verify-sharepoint-deployment.py")
            print(f"   - README.md")
            print("-" * 60)
            
            return True
            
        except Exception as e:
            print(f"❌ パッケージ作成エラー: {e}")
            return False


def main():
    """メイン実行関数"""
    creator = SharePointFinalPackageCreator()
    success = creator.create_final_package()
    
    if success:
        print("✅ SharePoint企業配布版の作成が完了しました！")
        print("📁 作成されたZIPファイルを企業内で配布してください。")
    else:
        print("❌ パッケージ作成に失敗しました。")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 