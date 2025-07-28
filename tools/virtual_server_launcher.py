#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深堀くん 仮想サーバランチャー v1.0
ダブルクリック起動 → HTTPSサーバ → ブラウザ自動起動
"""

import os
import sys
import ssl
import socket
import threading
import webbrowser
import subprocess
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import json
import tempfile
import shutil

class FukaboriServerHandler(SimpleHTTPRequestHandler):
    """深堀くん専用HTTPSサーバハンドラー"""
    
    def __init__(self, *args, **kwargs):
        # 静的ファイルのルートディレクトリを設定
        super().__init__(*args, directory=get_app_directory(), **kwargs)
    
    def end_headers(self):
        # CORS対応とセキュリティヘッダー追加
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # マイク許可のための追加ヘッダー
        self.send_header('Feature-Policy', 'microphone *')
        self.send_header('Permissions-Policy', 'microphone=*')
        super().end_headers()
    
    def do_GET(self):
        """GETリクエストハンドラー"""
        # ルートアクセス時は深堀くん.htmlにリダイレクト
        if self.path == '/':
            self.path = '/深堀くん.html'
        
        # ログ出力（デバッグ用）
        print(f"📁 リクエスト: {self.path}")
        super().do_GET()
    
    def log_message(self, format, *args):
        """ログメッセージをカスタマイズ"""
        print(f"🌐 サーバ: {format % args}")

def get_app_directory():
    """アプリケーションディレクトリを取得"""
    if getattr(sys, 'frozen', False):
        # PyInstallerでビルドされた場合
        if hasattr(sys, '_MEIPASS'):
            # onedirモード: 実行時の一時解凍ディレクトリ（_internal内のファイルにアクセス）
            return sys._MEIPASS
        else:
            # onefileモード: 実行ファイルのディレクトリ
            return os.path.dirname(sys.executable)
    else:
        # 開発環境の場合
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def find_free_port(start_port=8443):
    """利用可能なポートを見つける"""
    for port in range(start_port, start_port + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    raise RuntimeError("利用可能なポートが見つかりません")

def generate_self_signed_cert(cert_dir):
    """自己署名SSL証明書を生成"""
    cert_file = os.path.join(cert_dir, 'server.crt')
    key_file = os.path.join(cert_dir, 'server.key')
    
    # 既に存在する場合はそのまま使用
    if os.path.exists(cert_file) and os.path.exists(key_file):
        print("✅ 既存のSSL証明書を使用")
        return cert_file, key_file
    
    try:
        # OpenSSLコマンドで証明書生成
        cmd = [
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-keyout', key_file,
            '-out', cert_file, '-days', '365', '-nodes', '-subj',
            '/C=JP/ST=Tokyo/L=Tokyo/O=FukaboriKun/OU=VirtualServer/CN=localhost'
        ]
        
        print("🔐 SSL証明書を生成中...")
        subprocess.run(cmd, check=True, capture_output=True)
        print("✅ SSL証明書生成完了")
        return cert_file, key_file
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        # OpenSSLが利用できない場合のPython代替実装
        print("⚠️ OpenSSLが見つかりません。Python内蔵機能で証明書生成...")
        return generate_cert_with_python(cert_dir)

def generate_cert_with_python(cert_dir):
    """Python内蔵ライブラリで証明書生成"""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        import datetime
        import ipaddress
        
        # 秘密鍵生成
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # 証明書内容設定
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "JP"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Tokyo"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Tokyo"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "FukaboriKun"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])
        
        # 証明書生成
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # ファイル保存
        cert_file = os.path.join(cert_dir, 'server.crt')
        key_file = os.path.join(cert_dir, 'server.key')
        
        with open(cert_file, 'wb') as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        with open(key_file, 'wb') as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        print("✅ Python証明書生成完了")
        return cert_file, key_file
        
    except ImportError:
        print("❌ cryptographyライブラリが必要です")
        print("💡 pip install cryptography でインストールしてください")
        return create_simple_cert(cert_dir)

def create_simple_cert(cert_dir):
    """最小限の証明書ファイル作成（開発用）"""
    print("⚠️ 簡易証明書を作成（HTTPS無効モード）")
    cert_file = os.path.join(cert_dir, 'server.crt')
    key_file = os.path.join(cert_dir, 'server.key')
    
    # 空ファイル作成（HTTPモードで起動）
    with open(cert_file, 'w') as f:
        f.write("")
    with open(key_file, 'w') as f:
        f.write("")
    
    return None, None  # HTTPモードを示すためNoneを返す

def start_server(port, cert_file, key_file):
    """HTTPSサーバを起動"""
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, FukaboriServerHandler)
    
    if cert_file and key_file and os.path.getsize(cert_file) > 0:
        # HTTPS設定
        try:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(cert_file, key_file)
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            protocol = "https"
            print(f"🔒 HTTPSサーバ起動: https://localhost:{port}")
        except Exception as e:
            print(f"⚠️ HTTPS設定エラー: {e}")
            print("🔄 HTTPモードで起動します")
            protocol = "http"
    else:
        # HTTP設定
        protocol = "http"
        print(f"🌐 HTTPサーバ起動: http://localhost:{port}")
    
    # ブラウザ起動（サーバ起動後に実行）
    def launch_browser():
        time.sleep(1)  # サーバ起動待ち
        url = f"{protocol}://localhost:{port}/"
        print(f"🚀 ブラウザ起動: {url}")
        webbrowser.open(url)
    
    browser_thread = threading.Thread(target=launch_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    try:
        print("✅ 深堀くん仮想サーバ起動完了！")
        print("💡 終了するには Ctrl+C を押してください")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 サーバを停止中...")
        httpd.shutdown()
        print("✅ サーバ停止完了")

def main():
    """メイン処理"""
    print("="*50)
    print("🎯 深堀くん仮想サーバランチャー v1.0")
    print("="*50)
    
    try:
        # 作業ディレクトリを確認
        app_dir = get_app_directory()
        print(f"📁 アプリディレクトリ: {app_dir}")
        
        # 必要ファイルの存在確認
        html_file = os.path.join(app_dir, "深堀くん.html")
        if not os.path.exists(html_file):
            print("❌ 深堀くん.htmlが見つかりません")
            print(f"📁 確認場所: {html_file}")
            input("Enterキーを押して終了...")
            return
        
        print("✅ 深堀くんファイル確認完了")
        
        # 一時ディレクトリで証明書作成
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"🔐 証明書格納先: {temp_dir}")
            
            # 利用可能ポートを検索
            port = find_free_port()
            print(f"🌐 使用ポート: {port}")
            
            # SSL証明書生成
            cert_file, key_file = generate_self_signed_cert(temp_dir)
            
            # 作業ディレクトリを変更
            os.chdir(app_dir)
            print(f"📂 作業ディレクトリ変更: {app_dir}")
            
            # サーバ起動
            start_server(port, cert_file, key_file)
    
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        input("Enterキーを押して終了...")

if __name__ == "__main__":
    main() 