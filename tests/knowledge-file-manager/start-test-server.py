#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん - KnowledgeFileManager テストツール サーバー

Usage:
    python3 start-test-server.py
    
    または
    
    python start-test-server.py
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

def main():
    # ポート設定
    PORT = 8080
    
    # 現在のディレクトリを確認
    current_dir = Path.cwd()
    test_file = current_dir / "test-knowledge-file-manager.html"
    
    print("=" * 60)
    print("🧪 深堀くん - KnowledgeFileManager テストツール")
    print("=" * 60)
    
    # テストファイルの存在確認
    if not test_file.exists():
        print("❌ エラー: test-knowledge-file-manager.html が見つかりません")
        print(f"現在のディレクトリ: {current_dir}")
        print("\n以下を確認してください:")
        print("1. 正しいディレクトリにいるか")
        print("2. test-knowledge-file-manager.html ファイルが存在するか")
        sys.exit(1)
    
    # 必要なファイルの確認
    required_files = [
        "app/script.js",
        "app/knowledge-file-manager-interface.js", 
        "app/test-knowledge-file-manager.js",
        "app/test-runner.js"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not (current_dir / file_path).exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("⚠️ 警告: 以下のファイルが見つかりません:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n一部の機能が動作しない可能性があります。")
        
        response = input("\n続行しますか？ (y/N): ").lower()
        if response != 'y':
            print("テストサーバーを停止します。")
            sys.exit(0)
    
    try:
        # HTTPサーバーの設定
        class Handler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(current_dir), **kwargs)
            
            def log_message(self, format, *args):
                # ログメッセージをカスタマイズ
                print(f"📁 {self.address_string()} - {format % args}")
        
        # サーバー起動
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            server_url = f"http://localhost:{PORT}"
            test_url = f"{server_url}/test-knowledge-file-manager.html"
            
            print(f"✅ テストサーバーを起動しました")
            print(f"📡 サーバーURL: {server_url}")
            print(f"🧪 テストページ: {test_url}")
            print("\n" + "=" * 60)
            print("📋 使用方法:")
            print("1. ブラウザで以下のURLを開いてください:")
            print(f"   {test_url}")
            print("2. 「🚀 全テスト実行」ボタンをクリック")
            print("3. テスト結果を確認")
            print("\n" + "=" * 60)
            print("🔧 サーバー制御:")
            print("- Ctrl+C でサーバーを停止")
            print("- ブラウザを閉じてもサーバーは継続します")
            print("=" * 60)
            
            # ブラウザを自動で開く
            try:
                print(f"\n🌐 ブラウザでテストページを開いています...")
                webbrowser.open(test_url)
            except Exception as e:
                print(f"⚠️ ブラウザの自動起動に失敗: {e}")
                print(f"手動で以下のURLを開いてください: {test_url}")
            
            print(f"\n🎯 テストサーバー実行中 (ポート {PORT})")
            print("Ctrl+C で停止してください\n")
            
            # サーバー実行
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 テストサーバーを停止しました")
        print("✨ お疲れ様でした！")
        
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ エラー: ポート {PORT} は既に使用されています")
            print("\n解決方法:")
            print("1. 他のテストサーバーが起動していないか確認")
            print("2. 別のアプリケーションがそのポートを使用していないか確認")
            print("3. しばらく待ってから再実行")
            
            # 代替ポートを提案
            alternative_port = PORT + 1
            print(f"\n代替案: ポート {alternative_port} で起動を試みますか？ (y/N): ", end="")
            response = input().lower()
            if response == 'y':
                try:
                    with socketserver.TCPServer(("", alternative_port), Handler) as httpd:
                        test_url = f"http://localhost:{alternative_port}/test-knowledge-file-manager.html"
                        print(f"✅ 代替ポート {alternative_port} でサーバーを起動しました")
                        print(f"🧪 テストページ: {test_url}")
                        webbrowser.open(test_url)
                        httpd.serve_forever()
                except KeyboardInterrupt:
                    print("\n\n🛑 テストサーバーを停止しました")
        else:
            print(f"❌ サーバー起動エラー: {e}")
        
    except Exception as e:
        print(f"❌ 予期しないエラーが発生しました: {e}")
        print("詳細な情報が必要な場合は、開発者にお問い合わせください。")

if __name__ == "__main__":
    main() 