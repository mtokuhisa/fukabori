#!/usr/bin/env python3
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
