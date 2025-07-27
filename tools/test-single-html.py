#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん SharePoint配布版 - 自動テストスクリプト
==============================================

生成された単一HTMLファイルの品質・動作を自動検証

テスト項目:
- HTML構造の整合性
- CSS/JavaScriptのインライン化確認
- 画像のBase64化確認
- PWA関連コードの削除確認
- ファイルサイズ・パフォーマンス確認

使用方法:
    python3 tools/test-single-html.py [HTMLファイルパス]
"""

import os
import re
import sys
from pathlib import Path
import base64
from urllib.parse import urlparse


class SingleHtmlTester:
    def __init__(self, html_file_path):
        """
        テスターの初期化
        
        Args:
            html_file_path: テスト対象のHTMLファイルパス
        """
        self.html_file_path = Path(html_file_path)
        self.html_content = ""
        self.test_results = {
            "html_structure": {"passed": 0, "failed": 0, "details": []},
            "css_inline": {"passed": 0, "failed": 0, "details": []},
            "js_inline": {"passed": 0, "failed": 0, "details": []},
            "image_base64": {"passed": 0, "failed": 0, "details": []},
            "pwa_removal": {"passed": 0, "failed": 0, "details": []},
            "performance": {"passed": 0, "failed": 0, "details": []}
        }
        
        print(f"🧪 深堀くん SharePoint配布版 自動テスト開始")
        print(f"📁 テスト対象: {self.html_file_path}")
        print("-" * 60)

    def load_html_content(self):
        """HTMLファイルを読み込む"""
        try:
            with open(self.html_file_path, 'r', encoding='utf-8') as f:
                self.html_content = f.read()
            print(f"✅ HTMLファイル読み込み完了 ({len(self.html_content):,} bytes)")
            return True
        except Exception as e:
            print(f"❌ HTMLファイル読み込み失敗: {e}")
            return False

    def test_html_structure(self):
        """HTML構造の整合性テスト"""
        print("🏗️  HTML構造テスト開始...")
        
        tests = [
            ("DOCTYPE宣言", r'<!DOCTYPE html>', "HTML5のDOCTYPE宣言が存在する"),
            ("HTMLタグ", r'<html[^>]*>', "HTMLタグが存在する"),
            ("headタグ", r'<head[^>]*>.*</head>', "headタグが存在する"),
            ("bodyタグ", r'<body[^>]*>.*</body>', "bodyタグが存在する"),
            ("titleタグ", r'<title[^>]*>.*</title>', "titleタグが存在する"),
            ("文字エンコーディング", r'<meta[^>]*charset[^>]*>', "文字エンコーディングが指定されている"),
            ("ビューポート", r'<meta[^>]*viewport[^>]*>', "ビューポートが設定されている"),
        ]
        
        for test_name, pattern, description in tests:
            if re.search(pattern, self.html_content, re.DOTALL | re.IGNORECASE):
                self.test_results["html_structure"]["passed"] += 1
                self.test_results["html_structure"]["details"].append(f"✅ {test_name}: {description}")
                print(f"  ✅ {test_name}")
            else:
                self.test_results["html_structure"]["failed"] += 1
                self.test_results["html_structure"]["details"].append(f"❌ {test_name}: {description}")
                print(f"  ❌ {test_name}")

    def test_css_inline(self):
        """CSSインライン化テスト"""
        print("🎨 CSSインライン化テスト開始...")
        
        # <style>タグの存在確認
        style_tags = re.findall(r'<style[^>]*>(.*?)</style>', self.html_content, re.DOTALL)
        if style_tags:
            self.test_results["css_inline"]["passed"] += 1
            self.test_results["css_inline"]["details"].append(f"✅ <style>タグ: {len(style_tags)}個のスタイルブロックが存在")
            print(f"  ✅ <style>タグ: {len(style_tags)}個")
            
            # CSS内容の分析
            total_css_length = sum(len(style) for style in style_tags)
            self.test_results["css_inline"]["details"].append(f"📊 CSS総サイズ: {total_css_length:,} 文字")
            print(f"  📊 CSS総サイズ: {total_css_length:,} 文字")
        else:
            self.test_results["css_inline"]["failed"] += 1
            self.test_results["css_inline"]["details"].append("❌ <style>タグが見つかりません")
            print("  ❌ <style>タグが見つかりません")
        
        # 外部CSSリンクの残存確認（あってはいけない）
        external_css = re.findall(r'<link[^>]*rel="stylesheet"[^>]*>', self.html_content)
        if external_css:
            self.test_results["css_inline"]["failed"] += 1
            self.test_results["css_inline"]["details"].append(f"❌ 外部CSSリンクが残存: {len(external_css)}個")
            print(f"  ❌ 外部CSSリンクが残存: {len(external_css)}個")
        else:
            self.test_results["css_inline"]["passed"] += 1
            self.test_results["css_inline"]["details"].append("✅ 外部CSSリンクは全て除去済み")
            print("  ✅ 外部CSSリンクは全て除去済み")

    def test_js_inline(self):
        """JavaScriptインライン化テスト"""
        print("⚡ JavaScriptインライン化テスト開始...")
        
        # <script>タグ（インライン）の存在確認
        inline_scripts = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', self.html_content, re.DOTALL)
        if inline_scripts:
            self.test_results["js_inline"]["passed"] += 1
            self.test_results["js_inline"]["details"].append(f"✅ インライン<script>タグ: {len(inline_scripts)}個")
            print(f"  ✅ インライン<script>タグ: {len(inline_scripts)}個")
            
            # JavaScript内容の分析
            total_js_length = sum(len(script) for script in inline_scripts)
            self.test_results["js_inline"]["details"].append(f"📊 JavaScript総サイズ: {total_js_length:,} 文字")
            print(f"  📊 JavaScript総サイズ: {total_js_length:,} 文字")
        else:
            self.test_results["js_inline"]["failed"] += 1
            self.test_results["js_inline"]["details"].append("❌ インライン<script>タグが見つかりません")
            print("  ❌ インライン<script>タグが見つかりません")
        
        # 外部JSファイル参照の残存確認（CDNは除く）
        external_js = re.findall(r'<script[^>]*src="([^"]+)"[^>]*></script>', self.html_content)
        local_js = [js for js in external_js if not js.startswith('https://')]
        
        if local_js:
            self.test_results["js_inline"]["failed"] += 1
            self.test_results["js_inline"]["details"].append(f"❌ ローカルJSファイル参照が残存: {len(local_js)}個")
            print(f"  ❌ ローカルJSファイル参照が残存: {len(local_js)}個")
            for js in local_js[:3]:  # 最初の3個だけ表示
                print(f"    - {js}")
        else:
            self.test_results["js_inline"]["passed"] += 1
            self.test_results["js_inline"]["details"].append("✅ ローカルJSファイル参照は全て除去済み")
            print("  ✅ ローカルJSファイル参照は全て除去済み")
        
        # CDNファイル参照の確認（残っているべき）
        cdn_js = [js for js in external_js if js.startswith('https://')]
        if cdn_js:
            self.test_results["js_inline"]["passed"] += 1
            self.test_results["js_inline"]["details"].append(f"✅ CDNファイル参照: {len(cdn_js)}個（保持）")
            print(f"  ✅ CDNファイル参照: {len(cdn_js)}個（保持）")

    def test_image_base64(self):
        """画像Base64化テスト"""
        print("🖼️  画像Base64化テスト開始...")
        
        # data URI形式の画像を検索
        data_uri_images = re.findall(r'(?:src|url\()"?(data:image/[^";\)]+)"?', self.html_content)
        if data_uri_images:
            self.test_results["image_base64"]["passed"] += 1
            self.test_results["image_base64"]["details"].append(f"✅ Base64画像: {len(data_uri_images)}個")
            print(f"  ✅ Base64画像: {len(data_uri_images)}個")
            
            # Base64データサイズの分析
            total_base64_size = 0
            for data_uri in data_uri_images:
                # data:image/png;base64,... の形式からBase64部分を抽出
                if ';base64,' in data_uri:
                    base64_data = data_uri.split(';base64,')[1]
                    total_base64_size += len(base64_data)
            
            # Base64は元サイズの約4/3倍なので、元画像サイズを推定
            estimated_original_size = int(total_base64_size * 3 / 4)
            self.test_results["image_base64"]["details"].append(f"📊 推定元画像サイズ: {estimated_original_size:,} bytes")
            print(f"  📊 推定元画像サイズ: {estimated_original_size:,} bytes")
        else:
            self.test_results["image_base64"]["failed"] += 1
            self.test_results["image_base64"]["details"].append("❌ Base64画像が見つかりません")
            print("  ❌ Base64画像が見つかりません")
        
        # 外部画像参照の残存確認（あってはいけない）
        external_images = re.findall(r'<img[^>]*src="([^"]+)"[^>]*>', self.html_content)
        local_images = [img for img in external_images if not img.startswith(('http://', 'https://', 'data:'))]
        
        if local_images:
            self.test_results["image_base64"]["failed"] += 1
            self.test_results["image_base64"]["details"].append(f"❌ ローカル画像参照が残存: {len(local_images)}個")
            print(f"  ❌ ローカル画像参照が残存: {len(local_images)}個")
        else:
            self.test_results["image_base64"]["passed"] += 1
            self.test_results["image_base64"]["details"].append("✅ ローカル画像参照は全て除去済み")
            print("  ✅ ローカル画像参照は全て除去済み")

    def test_pwa_removal(self):
        """PWA関連コード削除テスト"""
        print("🔧 PWA関連削除テスト開始...")
        
        pwa_checks = [
            ("manifest.json参照", r'<link[^>]*rel="manifest"[^>]*>', "manifest.jsonへのリンクが削除されている"),
            ("Service Worker登録", r'navigator\.serviceWorker\.register', "Service Worker登録コードが削除されている"),
            ("Apple Touch Icon", r'<link[^>]*rel="apple-touch-icon"[^>]*>', "Apple Touch Iconが削除されている"),
            ("manifest.json fetch", r'fetch\(["\'][^"\']*manifest\.json["\']', "manifest.json fetchが削除されている"),
        ]
        
        for test_name, pattern, description in pwa_checks:
            if re.search(pattern, self.html_content, re.IGNORECASE):
                self.test_results["pwa_removal"]["failed"] += 1
                self.test_results["pwa_removal"]["details"].append(f"❌ {test_name}: {description}（残存）")
                print(f"  ❌ {test_name}（残存）")
            else:
                self.test_results["pwa_removal"]["passed"] += 1
                self.test_results["pwa_removal"]["details"].append(f"✅ {test_name}: {description}")
                print(f"  ✅ {test_name}")

    def test_performance(self):
        """パフォーマンステスト"""
        print("⚡ パフォーマンステスト開始...")
        
        file_size = len(self.html_content)
        
        # ファイルサイズ評価
        if file_size < 5 * 1024 * 1024:  # 5MB未満
            self.test_results["performance"]["passed"] += 1
            self.test_results["performance"]["details"].append(f"✅ ファイルサイズ: {file_size:,} bytes (< 5MB)")
            print(f"  ✅ ファイルサイズ: {file_size:,} bytes")
        else:
            self.test_results["performance"]["failed"] += 1
            self.test_results["performance"]["details"].append(f"⚠️  ファイルサイズ: {file_size:,} bytes (> 5MB)")
            print(f"  ⚠️  ファイルサイズ: {file_size:,} bytes")
        
        # HTML行数チェック
        line_count = len(self.html_content.split('\n'))
        self.test_results["performance"]["details"].append(f"📊 HTML行数: {line_count:,} 行")
        print(f"  📊 HTML行数: {line_count:,} 行")
        
        # 圧縮率の推定（gzip想定）
        estimated_gzip_size = file_size // 3  # 概算
        self.test_results["performance"]["details"].append(f"📊 推定gzip圧縮後: {estimated_gzip_size:,} bytes")
        print(f"  📊 推定gzip圧縮後: {estimated_gzip_size:,} bytes")

    def run_all_tests(self):
        """全テストを実行"""
        if not self.load_html_content():
            return False
        
        self.test_html_structure()
        self.test_css_inline()
        self.test_js_inline()
        self.test_image_base64()
        self.test_pwa_removal()
        self.test_performance()
        
        return True

    def generate_report(self):
        """テスト結果レポートを生成"""
        print("\n" + "=" * 60)
        print("📊 テスト結果サマリー")
        print("=" * 60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL" if passed == 0 else "⚠️  PARTIAL"
            print(f"{category.replace('_', ' ').title()}: {status} ({passed} passed, {failed} failed)")
        
        print("-" * 60)
        overall_status = "✅ 全テスト合格" if total_failed == 0 else f"⚠️  {total_failed}個のテストが失敗"
        print(f"総合結果: {overall_status} ({total_passed} passed, {total_failed} failed)")
        
        # 成功率計算
        if total_passed + total_failed > 0:
            success_rate = (total_passed / (total_passed + total_failed)) * 100
            print(f"成功率: {success_rate:.1f}%")
        
        print("=" * 60)
        
        return total_failed == 0


def main():
    """メイン実行関数"""
    if len(sys.argv) < 2:
        # 最新のSharePoint配布版ファイルを自動検索
        current_dir = Path.cwd()
        sharepoint_files = list(current_dir.glob("深堀くん_SharePoint配布版_*.html"))
        
        if not sharepoint_files:
            print("❌ SharePoint配布版ファイルが見つかりません")
            print("使用方法: python3 tools/test-single-html.py [HTMLファイルパス]")
            return 1
        
        # 最新ファイルを選択（ファイル名でソート）
        html_file = sorted(sharepoint_files)[-1]
        print(f"🔍 最新ファイルを自動選択: {html_file.name}")
    else:
        html_file = Path(sys.argv[1])
    
    if not html_file.exists():
        print(f"❌ ファイルが見つかりません: {html_file}")
        return 1
    
    tester = SingleHtmlTester(html_file)
    
    if not tester.run_all_tests():
        print("❌ テスト実行に失敗しました")
        return 1
    
    success = tester.generate_report()
    
    if success:
        print("\n🎉 SharePoint配布版は正常に生成されています！")
        print("📁 このファイルをSharePointにアップロードして使用できます。")
    else:
        print("\n⚠️  一部テストが失敗しました。詳細を確認してください。")
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main()) 