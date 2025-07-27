#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん SharePoint配布対応 - 単一HTMLファイル化ビルドスクリプト
=================================================================

開発効率とSharePoint配布を両立するビルドシステム

機能:
- CSS/JavaScriptファイルのインライン化
- 画像ファイルのBase64エンコード化
- PWA関連コード（manifest.json、Service Worker）の削除
- テスト用スクリプト参照の削除
- HTML minify処理（コメント・空白削除）
- バージョン・ビルド日時の自動挿入

使用方法:
    python3 tools/build-single-html.py

出力:
    深堀くん_SharePoint配布版_v0.7.6_YYYYMMDD_HHMMSS.html
"""

import os
import re
import base64
import mimetypes
from pathlib import Path
from datetime import datetime
import json


class SingleHtmlBuilder:
    def __init__(self, source_dir=None, output_dir=None):
        """
        ビルダーの初期化
        
        Args:
            source_dir: ソースディレクトリ（デフォルト: 現在のディレクトリ）
            output_dir: 出力ディレクトリ（デフォルト: ソースディレクトリ）
        """
        self.source_dir = Path(source_dir) if source_dir else Path.cwd()
        self.output_dir = Path(output_dir) if output_dir else self.source_dir
        self.version = "v0.7.6"
        self.build_time = datetime.now()
        self.output_filename = f"深堀くん_SharePoint配布版_{self.version}_{self.build_time.strftime('%Y%m%d_%H%M%S')}.html"
        
        # 統計情報
        self.stats = {
            "css_files": 0,
            "js_files": 0,
            "images": 0,
            "removed_pwa_refs": 0,
            "removed_test_refs": 0,
            "original_size": 0,
            "final_size": 0
        }
        
        print(f"🚀 深堀くん 単一HTMLファイル化ビルド開始")
        print(f"📁 ソースディレクトリ: {self.source_dir}")
        print(f"📁 出力ディレクトリ: {self.output_dir}")
        print(f"📦 出力ファイル名: {self.output_filename}")
        print("-" * 60)

    def read_file_safe(self, file_path):
        """
        ファイルを安全に読み込む（エラーハンドリング付き）
        
        Args:
            file_path: 読み込むファイルのパス
            
        Returns:
            str: ファイル内容（読み込み失敗時は空文字）
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"⚠️  ファイル読み込みエラー: {file_path} - {e}")
            return ""

    def encode_image_to_base64(self, image_path):
        """
        画像ファイルをBase64エンコードしてdata URIに変換
        
        Args:
            image_path: 画像ファイルのパス
            
        Returns:
            str: data URI形式の文字列
        """
        try:
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            # MIME typeを取得
            mime_type, _ = mimetypes.guess_type(image_path)
            if not mime_type:
                mime_type = 'image/png'  # デフォルト
            
            # Base64エンコード
            base64_data = base64.b64encode(image_data).decode('utf-8')
            data_uri = f"data:{mime_type};base64,{base64_data}"
            
            print(f"✅ 画像Base64化: {image_path.name} ({len(image_data):,} bytes)")
            self.stats["images"] += 1
            return data_uri
            
        except Exception as e:
            print(f"❌ 画像Base64化エラー: {image_path} - {e}")
            return str(image_path)  # 元のパスを返す

    def inline_css_files(self, html_content):
        """
        CSSファイルをインライン化
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: CSSがインライン化されたHTML内容
        """
        print("🎨 CSS ファイルのインライン化開始...")
        
        # <link rel="stylesheet" ...> パターンを検索
        css_link_pattern = r'<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>'
        css_links = re.findall(css_link_pattern, html_content)
        
        combined_css = ""
        
        for css_href in css_links:
            # クエリパラメータを除去
            css_href_clean = css_href.split('?')[0]
            # 相対パスを解決
            css_path = self.source_dir / css_href_clean.lstrip('./')
            
            if css_path.exists():
                css_content = self.read_file_safe(css_path)
                if css_content:
                    # 画像パスをBase64に変換（CSS内の背景画像など）
                    css_content = self.replace_image_urls_in_css(css_content)
                    combined_css += f"\n/* === {css_path.name} === */\n{css_content}\n"
                    print(f"✅ CSS読み込み: {css_path.name}")
                    self.stats["css_files"] += 1
            else:
                print(f"⚠️  CSSファイル未発見: {css_path}")
        
        # <link>タグを<style>タグに置換
        if combined_css:
            style_tag = f'<style>\n{combined_css}\n</style>'
            html_content = re.sub(css_link_pattern, '', html_content)
            html_content = html_content.replace('</head>', f'{style_tag}\n</head>')
        
        return html_content

    def replace_image_urls_in_css(self, css_content):
        """
        CSS内の画像URLをBase64 data URIに置換
        
        Args:
            css_content: CSS内容
            
        Returns:
            str: 画像URLが置換されたCSS内容
        """
        # url(...) パターンを検索
        url_pattern = r'url\(["\']?([^)]+)["\']?\)'
        
        def replace_url(match):
            url = match.group(1).strip('\'"')
            
            # 外部URLは変更しない
            if url.startswith(('http://', 'https://', 'data:')):
                return match.group(0)
            
            # 相対パスを解決
            image_path = self.source_dir / url.lstrip('./')
            
            if image_path.exists() and image_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
                data_uri = self.encode_image_to_base64(image_path)
                return f'url({data_uri})'
            
            return match.group(0)
        
        return re.sub(url_pattern, replace_url, css_content)

    def inline_js_files(self, html_content):
        """
        JavaScriptファイルをインライン化
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: JavaScriptがインライン化されたHTML内容
        """
        print("⚡ JavaScript ファイルのインライン化開始...")
        
        # <script src="..."></script> パターンを検索（外部CDNは除外）
        js_script_pattern = r'<script\s+src="([^"]+)"[^>]*></script>'
        js_scripts = re.findall(js_script_pattern, html_content)
        
        combined_js = ""
        
        for js_src in js_scripts:
            # 外部CDN（https://）は除外
            if js_src.startswith('https://'):
                continue
            
            # クエリパラメータを除去
            js_src_clean = js_src.split('?')[0]
            # 相対パスを解決
            js_path = self.source_dir / js_src_clean.lstrip('./')
            
            if js_path.exists():
                js_content = self.read_file_safe(js_path)
                if js_content:
                    combined_js += f"\n/* === {js_path.name} === */\n{js_content}\n"
                    print(f"✅ JS読み込み: {js_path.name}")
                    self.stats["js_files"] += 1
                    
                    # 該当する<script>タグを削除
                    pattern = f'<script\\s+src="{re.escape(js_src)}"[^>]*></script>'
                    html_content = re.sub(pattern, '', html_content)
            else:
                print(f"⚠️  JSファイル未発見: {js_path}")
        
        # 結合したJavaScriptを</body>の直前に挿入
        if combined_js:
            script_tag = f'<script>\n{combined_js}\n</script>'
            html_content = html_content.replace('</body>', f'{script_tag}\n</body>')
        
        return html_content

    def replace_image_sources(self, html_content):
        """
        HTML内の画像ソースをBase64 data URIに置換
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: 画像ソースが置換されたHTML内容
        """
        print("🖼️  HTML内画像のBase64化開始...")
        
        # <img src="..."> パターンを検索
        img_pattern = r'<img\s+([^>]*?)src="([^"]+)"([^>]*?)>'
        
        def replace_img(match):
            before_src = match.group(1)
            src_url = match.group(2)
            after_src = match.group(3)
            
            # 外部URLは変更しない
            if src_url.startswith(('http://', 'https://', 'data:')):
                return match.group(0)
            
            # 相対パスを解決
            image_path = self.source_dir / src_url.lstrip('./')
            
            if image_path.exists():
                data_uri = self.encode_image_to_base64(image_path)
                return f'<img {before_src}src="{data_uri}"{after_src}>'
            
            return match.group(0)
        
        return re.sub(img_pattern, replace_img, html_content)

    def remove_pwa_references(self, html_content):
        """
        PWA関連の参照を削除
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: PWA参照が削除されたHTML内容
        """
        print("🔧 PWA関連コードの削除開始...")
        
        # 削除対象パターン
        pwa_patterns = [
            r'<link\s+rel="manifest"[^>]*>',  # manifest.json
            r'<link\s+rel="apple-touch-icon"[^>]*>',  # Apple touch icon
            r'navigator\.serviceWorker\.register\([^)]+\)[^;]*;?',  # Service Worker登録
            r'fetch\(["\']\.?/?manifest\.json["\'][^)]*\)[^;]*;?',  # manifest.json fetch
        ]
        
        for pattern in pwa_patterns:
            matches = re.findall(pattern, html_content)
            if matches:
                self.stats["removed_pwa_refs"] += len(matches)
                html_content = re.sub(pattern, '', html_content)
                print(f"✅ PWA参照削除: {len(matches)}個のパターンを削除")
        
        return html_content

    def remove_test_references(self, html_content):
        """
        テスト用スクリプト参照を削除
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: テスト参照が削除されたHTML内容
        """
        print("🧪 テスト用コードの削除開始...")
        
        # テスト用ファイルのパターン
        test_patterns = [
            r'<script\s+src="[^"]*test[^"]*"[^>]*></script>',  # testを含むファイル
            r'<script\s+src="[^"]*quick-test[^"]*"[^>]*></script>',  # quick-test
            r'<script\s+src="[^"]*version-verification[^"]*"[^>]*></script>',  # version-verification
            r'<script\s+src="[^"]*voice-delete-integration[^"]*"[^>]*></script>',  # voice-delete-integration
        ]
        
        for pattern in test_patterns:
            matches = re.findall(pattern, html_content)
            if matches:
                self.stats["removed_test_refs"] += len(matches)
                html_content = re.sub(pattern, '', html_content)
                print(f"✅ テスト参照削除: {len(matches)}個のパターンを削除")
        
        return html_content

    def minify_html(self, html_content):
        """
        HTML minify処理（コメント・不要な空白削除）
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: minify済みHTML内容
        """
        print("🗜️  HTML minify処理開始...")
        
        # HTMLコメント削除（ただし、重要なコメントは保持）
        html_content = re.sub(r'<!--(?!.*?🔧|.*?✅|.*?📱).*?-->', '', html_content, flags=re.DOTALL)
        
        # 複数の空白・改行を単一に
        html_content = re.sub(r'\n\s*\n', '\n', html_content)
        html_content = re.sub(r'[ \t]+', ' ', html_content)
        
        # 行頭・行末の空白削除
        lines = html_content.split('\n')
        lines = [line.strip() for line in lines if line.strip()]
        html_content = '\n'.join(lines)
        
        return html_content

    def insert_build_info(self, html_content):
        """
        ビルド情報をHTMLに挿入
        
        Args:
            html_content: HTML内容
            
        Returns:
            str: ビルド情報が挿入されたHTML内容
        """
        build_info = f"""
<!-- 
🚀 深堀くん SharePoint配布版 自動生成ファイル
📦 バージョン: {self.version}
🕐 ビルド日時: {self.build_time.strftime('%Y年%m月%d日 %H:%M:%S')}
📊 統計:
   - CSS files: {self.stats['css_files']}
   - JS files: {self.stats['js_files']}
   - Images: {self.stats['images']}
   - PWA refs removed: {self.stats['removed_pwa_refs']}
   - Test refs removed: {self.stats['removed_test_refs']}
🔧 このファイルは自動生成されています。編集する場合は元のソースファイルを修正してリビルドしてください。
-->
"""
        
        # <head>タグの直後に挿入
        html_content = html_content.replace('<head>', f'<head>{build_info}')
        
        return html_content

    def build(self):
        """
        メインビルド処理
        
        Returns:
            bool: ビルド成功時True
        """
        try:
            # 元のHTMLファイルを読み込み
            source_html_path = self.source_dir / "深堀くん.html"
            if not source_html_path.exists():
                print(f"❌ ソースHTMLファイルが見つかりません: {source_html_path}")
                return False
            
            html_content = self.read_file_safe(source_html_path)
            if not html_content:
                print("❌ HTMLファイルの読み込みに失敗しました")
                return False
            
            self.stats["original_size"] = len(html_content)
            print(f"📄 元ファイルサイズ: {self.stats['original_size']:,} bytes")
            
            # 処理実行
            html_content = self.remove_test_references(html_content)
            html_content = self.remove_pwa_references(html_content)
            html_content = self.inline_css_files(html_content)
            html_content = self.inline_js_files(html_content)
            html_content = self.replace_image_sources(html_content)
            html_content = self.minify_html(html_content)
            html_content = self.insert_build_info(html_content)
            
            self.stats["final_size"] = len(html_content)
            
            # 出力ファイルに書き込み
            output_path = self.output_dir / self.output_filename
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # 結果報告
            print("-" * 60)
            print("🎉 ビルド完了!")
            print(f"📁 出力ファイル: {output_path}")
            print(f"📊 最終ファイルサイズ: {self.stats['final_size']:,} bytes")
            print(f"📈 サイズ変化: {self.stats['final_size'] - self.stats['original_size']:+,} bytes")
            print(f"🎨 CSS files: {self.stats['css_files']}")
            print(f"⚡ JS files: {self.stats['js_files']}")
            print(f"🖼️  Images: {self.stats['images']}")
            print(f"🔧 PWA refs removed: {self.stats['removed_pwa_refs']}")
            print(f"🧪 Test refs removed: {self.stats['removed_test_refs']}")
            print("-" * 60)
            
            return True
            
        except Exception as e:
            print(f"❌ ビルドエラー: {e}")
            return False


def main():
    """メイン実行関数"""
    builder = SingleHtmlBuilder()
    success = builder.build()
    
    if success:
        print("✅ SharePoint配布版の生成が完了しました！")
        print(f"📁 生成されたファイルをSharePointにアップロードしてください。")
    else:
        print("❌ ビルドに失敗しました。")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 