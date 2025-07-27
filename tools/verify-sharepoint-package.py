#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん SharePoint配布パッケージ検証ツール
Phase 1-3-3実装: ファイル構成検証スクリプト

Usage:
    python3 tools/verify-sharepoint-package.py [path/to/package/directory]
    
Features:
- 必須ファイルの存在確認
- 不要ファイルの除外確認
- 相対パス参照の整合性チェック
- HTMLファイル内のリンク検証
- パッケージ品質評価
"""

import os
import re
import zipfile
from pathlib import Path
from typing import List, Dict, Tuple
import json

class SharePointPackageVerifier:
    def __init__(self, package_path=None):
        if package_path:
            self.package_path = Path(package_path)
        else:
            # デフォルトで現在のディレクトリをチェック
            self.package_path = Path.cwd()
        
        self.verification_results = {
            "required_files": {"status": "pending", "details": []},
            "excluded_files": {"status": "pending", "details": []},
            "relative_paths": {"status": "pending", "details": []},
            "html_links": {"status": "pending", "details": []},
            "overall_score": 0
        }
        
        # 必須ファイル定義
        self.required_files = [
            "深堀くん.html",
            "app/style.css",
            "app/script.js",
            "config/app_settings.js",
            "assets/fukabori_logo.png",
            "manifest.json"
        ]
        
        # 必須フォルダ定義
        self.required_folders = [
            "app", "config", "assets", "pages"
        ]
        
        # 除外すべきファイル・フォルダ
        self.excluded_items = [
            "tests", "backups", "tools", "docs", "reports",
            "test-delete-fix.js", "quick-test.js", 
            "voice-delete-integration-test.js", 
            "version-verification-test.js"
        ]
    
    def verify_package(self):
        """パッケージの完全検証を実行"""
        print("=" * 60)
        print("🔍 深堀くん SharePoint配布パッケージ検証開始")
        print("=" * 60)
        print(f"📁 検証対象: {self.package_path}")
        print()
        
        # Step 1: 必須ファイルの存在確認
        self._verify_required_files()
        
        # Step 2: 不要ファイルの除外確認
        self._verify_excluded_files()
        
        # Step 3: 相対パス参照の検証
        self._verify_relative_paths()
        
        # Step 4: HTMLリンクの検証
        self._verify_html_links()
        
        # Step 5: 総合評価
        self._calculate_overall_score()
        
        # Step 6: 結果レポート
        self._generate_verification_report()
        
        return self.verification_results
    
    def _verify_required_files(self):
        """必須ファイルの存在確認"""
        print("📋 必須ファイルの存在確認中...")
        
        missing_files = []
        existing_files = []
        
        # 必須ファイルのチェック
        for file_path in self.required_files:
            full_path = self.package_path / file_path
            if full_path.exists():
                existing_files.append(file_path)
                print(f"  ✅ {file_path}")
            else:
                missing_files.append(file_path)
                print(f"  ❌ {file_path} (見つかりません)")
        
        # 必須フォルダのチェック
        missing_folders = []
        existing_folders = []
        
        for folder_path in self.required_folders:
            full_path = self.package_path / folder_path
            if full_path.exists() and full_path.is_dir():
                existing_folders.append(folder_path)
                file_count = len(list(full_path.rglob("*")))
                print(f"  ✅ {folder_path}/ ({file_count}ファイル)")
            else:
                missing_folders.append(folder_path)
                print(f"  ❌ {folder_path}/ (見つかりません)")
        
        # 結果の記録
        if not missing_files and not missing_folders:
            self.verification_results["required_files"]["status"] = "pass"
            print("✅ 必須ファイル確認: 合格")
        else:
            self.verification_results["required_files"]["status"] = "fail"
            print("❌ 必須ファイル確認: 不合格")
        
        self.verification_results["required_files"]["details"] = {
            "existing_files": existing_files,
            "missing_files": missing_files,
            "existing_folders": existing_folders,
            "missing_folders": missing_folders
        }
        print()
    
    def _verify_excluded_files(self):
        """不要ファイルの除外確認"""
        print("🧹 不要ファイルの除外確認中...")
        
        found_excluded_items = []
        
        for item in self.excluded_items:
            item_path = self.package_path / item
            if item_path.exists():
                found_excluded_items.append(item)
                if item_path.is_dir():
                    print(f"  ❌ {item}/ (除外すべきフォルダが存在)")
                else:
                    print(f"  ❌ {item} (除外すべきファイルが存在)")
        
        # バックアップファイルパターンのチェック
        backup_patterns = ["*.backup", "*.bak", "*.broken", "*_backup.html"]
        found_backup_files = []
        
        for pattern in backup_patterns:
            for backup_file in self.package_path.rglob(pattern):
                found_backup_files.append(str(backup_file.relative_to(self.package_path)))
                print(f"  ❌ {backup_file.relative_to(self.package_path)} (バックアップファイル)")
        
        # 結果の記録
        if not found_excluded_items and not found_backup_files:
            self.verification_results["excluded_files"]["status"] = "pass"
            print("✅ 不要ファイル除外確認: 合格")
        else:
            self.verification_results["excluded_files"]["status"] = "fail"
            print("❌ 不要ファイル除外確認: 不合格")
        
        self.verification_results["excluded_files"]["details"] = {
            "found_excluded_items": found_excluded_items,
            "found_backup_files": found_backup_files
        }
        print()
    
    def _verify_relative_paths(self):
        """相対パス参照の検証"""
        print("🔗 相対パス参照の検証中...")
        
        main_html = self.package_path / "深堀くん.html"
        if not main_html.exists():
            self.verification_results["relative_paths"]["status"] = "fail"
            self.verification_results["relative_paths"]["details"] = ["メインHTMLファイルが見つかりません"]
            print("❌ メインHTMLファイルが見つかりません")
            print()
            return
        
        path_issues = []
        correct_paths = []
        
        try:
            with open(main_html, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # script要素のsrc属性をチェック
            script_pattern = r'<script[^>]+src=["\']([^"\']+)["\']'
            script_matches = re.findall(script_pattern, html_content)
            
            for src_path in script_matches:
                if src_path.startswith('http'):
                    # CDNリンクは除外
                    continue
                elif src_path.startswith('./'):
                    correct_paths.append(f"script: {src_path}")
                    print(f"  ✅ script: {src_path}")
                elif src_path.startswith('/'):
                    path_issues.append(f"script: {src_path} (絶対パス)")
                    print(f"  ❌ script: {src_path} (絶対パス)")
                else:
                    # 相対パスだが、./で始まっていない
                    if not src_path.startswith('app/') and not src_path.startswith('config/'):
                        path_issues.append(f"script: {src_path} (相対パス不正)")
                        print(f"  ⚠️ script: {src_path} (./を推奨)")
            
            # link要素のhref属性をチェック
            link_pattern = r'<link[^>]+href=["\']([^"\']+)["\']'
            link_matches = re.findall(link_pattern, html_content)
            
            for href_path in link_matches:
                if href_path.startswith('http'):
                    continue
                elif href_path.startswith('./'):
                    correct_paths.append(f"link: {href_path}")
                    print(f"  ✅ link: {href_path}")
                elif href_path.startswith('/'):
                    path_issues.append(f"link: {href_path} (絶対パス)")
                    print(f"  ❌ link: {href_path} (絶対パス)")
            
            # img要素のsrc属性をチェック
            img_pattern = r'<img[^>]+src=["\']([^"\']+)["\']'
            img_matches = re.findall(img_pattern, html_content)
            
            for img_src in img_matches:
                if img_src.startswith('./'):
                    correct_paths.append(f"img: {img_src}")
                    print(f"  ✅ img: {img_src}")
                elif img_src.startswith('/'):
                    path_issues.append(f"img: {img_src} (絶対パス)")
                    print(f"  ❌ img: {img_src} (絶対パス)")
            
        except Exception as e:
            path_issues.append(f"HTMLファイル読み取りエラー: {e}")
            print(f"  ❌ HTMLファイル読み取りエラー: {e}")
        
        # 結果の記録
        if not path_issues:
            self.verification_results["relative_paths"]["status"] = "pass"
            print("✅ 相対パス参照検証: 合格")
        else:
            self.verification_results["relative_paths"]["status"] = "fail"
            print("❌ 相対パス参照検証: 不合格")
        
        self.verification_results["relative_paths"]["details"] = {
            "correct_paths": correct_paths,
            "path_issues": path_issues
        }
        print()
    
    def _verify_html_links(self):
        """HTMLリンクの検証"""
        print("🌐 HTMLリンクの検証中...")
        
        main_html = self.package_path / "深堀くん.html"
        if not main_html.exists():
            self.verification_results["html_links"]["status"] = "fail"
            self.verification_results["html_links"]["details"] = ["メインHTMLファイルが見つかりません"]
            print()
            return
        
        broken_links = []
        valid_links = []
        
        try:
            with open(main_html, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            # ページ遷移のリンクをチェック
            onclick_pattern = r"onclick=[\"']window\.location\.href=['\"]([^'\"]+)['\"]"
            onclick_matches = re.findall(onclick_pattern, html_content)
            
            for link_path in onclick_matches:
                if link_path.startswith('./pages/'):
                    target_file = self.package_path / link_path[2:]  # ./を除去
                    if target_file.exists():
                        valid_links.append(link_path)
                        print(f"  ✅ {link_path}")
                    else:
                        broken_links.append(link_path)
                        print(f"  ❌ {link_path} (リンク先が見つかりません)")
                else:
                    print(f"  ℹ️ {link_path} (外部リンクまたは特殊パス)")
            
        except Exception as e:
            broken_links.append(f"HTMLファイル読み取りエラー: {e}")
            print(f"  ❌ HTMLファイル読み取りエラー: {e}")
        
        # 結果の記録
        if not broken_links:
            self.verification_results["html_links"]["status"] = "pass"
            print("✅ HTMLリンク検証: 合格")
        else:
            self.verification_results["html_links"]["status"] = "fail"
            print("❌ HTMLリンク検証: 不合格")
        
        self.verification_results["html_links"]["details"] = {
            "valid_links": valid_links,
            "broken_links": broken_links
        }
        print()
    
    def _calculate_overall_score(self):
        """総合評価の計算"""
        score = 0
        max_score = 4
        
        for category in ["required_files", "excluded_files", "relative_paths", "html_links"]:
            if self.verification_results[category]["status"] == "pass":
                score += 1
        
        self.verification_results["overall_score"] = score
        percentage = (score / max_score) * 100
        
        print(f"📊 総合評価: {score}/{max_score} ({percentage:.1f}%)")
        
        if score == max_score:
            print("🎉 完璧！SharePoint配布準備完了")
        elif score >= 3:
            print("✅ 良好。軽微な問題があります")
        elif score >= 2:
            print("⚠️ 注意。重要な問題があります")
        else:
            print("❌ 不合格。多数の問題があります")
        print()
    
    def _generate_verification_report(self):
        """検証レポートの生成"""
        print("=" * 60)
        print("📝 検証レポート")
        print("=" * 60)
        
        # 詳細レポートをJSONファイルに保存
        report_path = self.package_path / "sharepoint_verification_report.json"
        
        report_data = {
            "package_path": str(self.package_path),
            "verification_date": __import__('datetime').datetime.now().isoformat(),
            "results": self.verification_results
        }
        
        try:
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)
            print(f"📄 詳細レポート保存: {report_path}")
        except Exception as e:
            print(f"⚠️ レポート保存エラー: {e}")
        
        # 修正すべき問題の表示
        print("\n🔧 修正が必要な問題:")
        
        for category, result in self.verification_results.items():
            if category == "overall_score":
                continue
            
            if result["status"] == "fail":
                print(f"  ❌ {category}")
                if "details" in result:
                    details = result["details"]
                    if isinstance(details, dict):
                        for key, value in details.items():
                            if value:  # 空でない場合のみ表示
                                print(f"    - {key}: {value}")
                    elif isinstance(details, list):
                        for detail in details:
                            print(f"    - {detail}")
        
        print("\n" + "=" * 60)

def main():
    """メイン実行関数"""
    import sys
    
    print("深堀くん SharePoint配布パッケージ検証ツール v1.0")
    print("Phase 1-3-3実装: ファイル構成検証\n")
    
    # 引数から検証対象パスを取得
    if len(sys.argv) > 1:
        package_path = sys.argv[1]
    else:
        package_path = None
    
    try:
        verifier = SharePointPackageVerifier(package_path)
        results = verifier.verify_package()
        
        # 終了コードを設定
        if results["overall_score"] == 4:
            print("🎉 検証完了: パッケージは配布準備完了です!")
            return 0
        elif results["overall_score"] >= 2:
            print("⚠️ 検証完了: 問題がありますが、基本的な配布は可能です")
            return 1
        else:
            print("❌ 検証失敗: 重大な問題があります。修正が必要です")
            return 2
    
    except Exception as e:
        print(f"❌ 検証エラー: {e}")
        return 3

if __name__ == "__main__":
    exit(main()) 