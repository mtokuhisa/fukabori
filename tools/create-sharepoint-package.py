#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん SharePoint配布パッケージ作成ツール
Phase 1-3-2実装: SharePoint配布用ZIP作成スクリプト

Usage:
    python3 tools/create-sharepoint-package.py
    
Features:
- 必要ファイルのみを自動選別
- 不要ファイルの自動除外
- 相対パス整合性チェック
- ZIP圧縮パッケージ生成
"""

import os
import shutil
import zipfile
import json
from datetime import datetime
from pathlib import Path

# 配布対象ファイル・フォルダの定義
REQUIRED_FILES = {
    # メインファイル
    "main": [
        "深堀くん.html"
    ],
    
    # PWA関連ファイル
    "pwa": [
        "manifest.json",
        "sw.js", 
        "service-worker.js",
        "favicon.ico"
    ],
    
    # フォルダ（全体をコピー）
    "folders": [
        "app",
        "config", 
        "assets",
        "pages"
    ]
}

# 除外対象ファイル・フォルダの定義
EXCLUDED_ITEMS = {
    # フォルダ全体を除外
    "folders": [
        "tests",
        "backups", 
        "tools",
        "docs",
        "reports",
        "画面キャプチャ",
        "backup_embedded_api_20250724_120640",
        "backup_embedded_api_20250724_120648"
    ],
    
    # 個別ファイルを除外
    "files": [
        "test-delete-fix.js",
        "quick-test.js", 
        "voice-delete-integration-test.js",
        "version-verification-test.js",
        "disable_dev_mode.html",
        "package.json",
        "package-lock.json",
        "深堀くん_埋め込みAPI実装仕様書.md",
        "sharepoint-deployment-package-list.md"
    ],
    
    # パターンマッチで除外
    "patterns": [
        "*.backup",
        "*.bak", 
        "*.broken",
        "*.cleanup_backup_*",
        "*_backup.html"
    ]
}

class SharePointPackageCreator:
    def __init__(self, source_dir=None, output_dir=None):
        self.source_dir = Path(source_dir) if source_dir else Path.cwd()
        self.output_dir = Path(output_dir) if output_dir else self.source_dir
        self.package_name = f"深堀くんv0.7.6-SharePoint配布版_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.temp_dir = self.output_dir / "temp_sharepoint_package"
        
        # 統計情報
        self.stats = {
            "copied_files": 0,
            "excluded_files": 0,
            "total_size": 0,
            "excluded_size": 0
        }
    
    def create_package(self):
        """SharePoint配布パッケージを作成"""
        print("=" * 60)
        print("🚀 深堀くん SharePoint配布パッケージ作成開始")
        print("=" * 60)
        
        try:
            # Step 1: 一時ディレクトリ準備
            self._prepare_temp_directory()
            
            # Step 2: 必要ファイルのコピー
            self._copy_required_files()
            
            # Step 3: 不要ファイルのクリーンアップ
            self._cleanup_unwanted_files()
            
            # Step 4: パス整合性チェック
            self._verify_path_consistency()
            
            # Step 5: ZIP圧縮
            zip_path = self._create_zip_package()
            
            # Step 6: 一時ディレクトリ削除
            self._cleanup_temp_directory()
            
            # Step 7: 結果レポート
            self._generate_report(zip_path)
            
            return zip_path
            
        except Exception as e:
            print(f"❌ エラー: パッケージ作成に失敗しました: {e}")
            self._cleanup_temp_directory()
            raise
    
    def _prepare_temp_directory(self):
        """一時ディレクトリの準備"""
        print("📁 一時ディレクトリを準備中...")
        
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
        
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        print(f"✅ 一時ディレクトリ作成: {self.temp_dir}")
    
    def _copy_required_files(self):
        """必要ファイルのコピー"""
        print("📋 必要ファイルをコピー中...")
        
        # メインファイルのコピー
        for file_name in REQUIRED_FILES["main"]:
            src_path = self.source_dir / file_name
            if src_path.exists():
                dst_path = self.temp_dir / file_name
                shutil.copy2(src_path, dst_path)
                self.stats["copied_files"] += 1
                self.stats["total_size"] += src_path.stat().st_size
                print(f"  📄 {file_name}")
            else:
                print(f"  ⚠️ メインファイルが見つかりません: {file_name}")
        
        # PWAファイルのコピー
        for file_name in REQUIRED_FILES["pwa"]:
            src_path = self.source_dir / file_name
            if src_path.exists():
                dst_path = self.temp_dir / file_name
                shutil.copy2(src_path, dst_path)
                self.stats["copied_files"] += 1
                self.stats["total_size"] += src_path.stat().st_size
                print(f"  📱 {file_name}")
            else:
                print(f"  ℹ️ PWAファイルがオプション: {file_name}")
        
        # フォルダのコピー
        for folder_name in REQUIRED_FILES["folders"]:
            src_path = self.source_dir / folder_name
            if src_path.exists() and src_path.is_dir():
                dst_path = self.temp_dir / folder_name
                shutil.copytree(src_path, dst_path)
                
                # フォルダ内のファイル数をカウント
                folder_files = list(src_path.rglob("*"))
                folder_file_count = len([f for f in folder_files if f.is_file()])
                folder_size = sum(f.stat().st_size for f in folder_files if f.is_file())
                
                self.stats["copied_files"] += folder_file_count
                self.stats["total_size"] += folder_size
                print(f"  📁 {folder_name}/ ({folder_file_count}ファイル)")
            else:
                print(f"  ⚠️ フォルダが見つかりません: {folder_name}")
        
        print(f"✅ 必要ファイルコピー完了: {self.stats['copied_files']}ファイル")
    
    def _cleanup_unwanted_files(self):
        """不要ファイルのクリーンアップ"""
        print("🧹 不要ファイルをクリーンアップ中...")
        
        # バックアップファイルの削除（パターンマッチ）
        for pattern in EXCLUDED_ITEMS["patterns"]:
            for unwanted_file in self.temp_dir.rglob(pattern):
                if unwanted_file.is_file():
                    file_size = unwanted_file.stat().st_size
                    unwanted_file.unlink()
                    self.stats["excluded_files"] += 1
                    self.stats["excluded_size"] += file_size
                    print(f"  🗑️ 削除: {unwanted_file.relative_to(self.temp_dir)}")
        
        print(f"✅ 不要ファイル削除完了: {self.stats['excluded_files']}ファイル")
    
    def _verify_path_consistency(self):
        """パス整合性チェック"""
        print("🔍 パス整合性をチェック中...")
        
        main_html = self.temp_dir / "深堀くん.html"
        if not main_html.exists():
            raise FileNotFoundError("メインHTMLファイルが見つかりません")
        
        # 必須フォルダの存在確認
        required_folders = ["app", "config", "assets"]
        missing_folders = []
        
        for folder in required_folders:
            folder_path = self.temp_dir / folder
            if not folder_path.exists():
                missing_folders.append(folder)
        
        if missing_folders:
            raise FileNotFoundError(f"必須フォルダが見つかりません: {missing_folders}")
        
        # 重要ファイルの存在確認
        important_files = [
            "app/style.css",
            "app/script.js", 
            "config/app_settings.js",
            "assets/fukabori_logo.png"
        ]
        
        missing_files = []
        for file_path in important_files:
            if not (self.temp_dir / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            print(f"  ⚠️ 重要ファイルが見つかりません: {missing_files}")
        else:
            print("  ✅ 重要ファイルの存在確認完了")
        
        print("✅ パス整合性チェック完了")
    
    def _create_zip_package(self):
        """ZIP圧縮パッケージの作成"""
        print("📦 ZIP圧縮パッケージ作成中...")
        
        zip_path = self.output_dir / f"{self.package_name}.zip"
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in self.temp_dir.rglob("*"):
                if file_path.is_file():
                    arc_name = file_path.relative_to(self.temp_dir)
                    zipf.write(file_path, arc_name)
        
        zip_size = zip_path.stat().st_size
        print(f"✅ ZIP圧縮完了: {zip_path}")
        print(f"  📦 圧縮後サイズ: {zip_size / 1024 / 1024:.2f} MB")
        
        return zip_path
    
    def _cleanup_temp_directory(self):
        """一時ディレクトリの削除"""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
            print("🧹 一時ディレクトリを削除しました")
    
    def _generate_report(self, zip_path):
        """作成レポートの生成"""
        print("=" * 60)
        print("📊 SharePoint配布パッケージ作成完了")
        print("=" * 60)
        
        print(f"📦 パッケージ名: {self.package_name}.zip")
        print(f"📍 保存場所: {zip_path}")
        print(f"📄 含まれるファイル数: {self.stats['copied_files']}個")
        print(f"📏 パッケージサイズ: {self.stats['total_size'] / 1024 / 1024:.2f} MB")
        print(f"🗑️ 除外されたファイル数: {self.stats['excluded_files']}個")
        print(f"💾 削減されたサイズ: {self.stats['excluded_size'] / 1024 / 1024:.2f} MB")
        
        print("\n" + "=" * 60)
        print("🚀 SharePoint配布手順:")
        print("1. 作成されたZIPファイルを展開")
        print("2. SharePointのドキュメントライブラリにアップロード")
        print("3. 深堀くん.htmlをブラウザで開く")
        print("4. HTTPS環境での動作を確認")
        print("=" * 60)
        
        # レポートファイルの作成
        report_path = self.output_dir / f"{self.package_name}_report.json"
        report_data = {
            "package_name": self.package_name,
            "created_at": datetime.now().isoformat(),
            "zip_path": str(zip_path),
            "statistics": self.stats,
            "required_files": REQUIRED_FILES,
            "excluded_items": EXCLUDED_ITEMS
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        
        print(f"📝 詳細レポート: {report_path}")

def main():
    """メイン実行関数"""
    print("深堀くん SharePoint配布パッケージ作成ツール v1.0")
    print("Phase 1-3-2実装: 自動化パッケージ作成\n")
    
    try:
        creator = SharePointPackageCreator()
        zip_path = creator.create_package()
        
        print(f"\n🎉 成功: SharePoint配布パッケージが作成されました!")
        print(f"📦 {zip_path}")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ 失敗: {e}")
        return 1

if __name__ == "__main__":
    exit(main()) 