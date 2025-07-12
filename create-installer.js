#!/usr/bin/env node

/**
 * 深堀くん - インストーラー作成スクリプト
 * Electronベースのスタンドアロンアプリケーション生成
 */

const fs = require('fs');
const path = require('path');

// パッケージ設定
const packageConfig = {
  "name": "fukabori-app",
  "version": "0.7.2",
  "description": "深堀くん - AIインタビューアプリ",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build-win": "electron-builder --win",
    "build-mac": "electron-builder --mac",
    "build-linux": "electron-builder --linux"
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "electron-builder": "^24.6.4"
  },
  "build": {
    "appId": "com.fukabori.app",
    "productName": "深堀くん",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "深堀くん.html",
      "app/**/*",
      "config/**/*",
      "assets/**/*",
      "manifest.json",
      "sw.js"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/fukabori_logo.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/fukabori_logo.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/fukabori_logo.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
};

// Electronメインプロセス
const mainJs = `
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// アプリケーション設定
const isDev = process.env.NODE_ENV === 'development';
let mainWindow;

// メインウィンドウの作成
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, 'assets/fukabori_logo.png'),
    title: '深堀くん - AIインタビューアプリ',
    show: false,
    titleBarStyle: 'default'
  });

  // HTMLファイルの読み込み
  mainWindow.loadFile('深堀くん.html');

  // ウィンドウの準備完了時に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 開発モードでDevToolsを開く
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // ウィンドウが閉じられた時の処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 外部リンクをデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // メニューバーの設定
  createMenu();
}

// メニューバーの作成
function createMenu() {
  const template = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '新しいセッション',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.reload()');
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '編集',
      submenu: [
        { label: '元に戻す', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'やり直し', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '切り取り', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'コピー', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '貼り付け', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '表示',
      submenu: [
        { label: '再読み込み', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '強制再読み込み', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '開発者ツール', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '実際のサイズ', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '拡大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '縮小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全画面表示', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'バージョン情報',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'バージョン情報',
              message: '深堀くん v0.7.2',
              detail: 'AIインタビューアプリ\\n\\nねほりーの・はほりーのがあなたの知見を深掘り',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// アプリケーションの準備完了
app.whenReady().then(createWindow);

// 全てのウィンドウが閉じられた時の処理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーションがアクティブになった時の処理
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// セキュリティ設定
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
`;

// インストーラー作成関数
function createInstaller() {
  console.log('🔧 深堀くん インストーラー作成開始...');

  // package.jsonの作成
  fs.writeFileSync('package-electron.json', JSON.stringify(packageConfig, null, 2));
  console.log('✅ package-electron.json 作成完了');

  // main.jsの作成
  fs.writeFileSync('main.js', mainJs);
  console.log('✅ main.js 作成完了');

  // ビルド手順の表示
  console.log(`
🚀 インストーラー作成手順:

1. 依存関係のインストール:
   npm install --save-dev electron electron-builder

2. パッケージ設定の更新:
   cp package-electron.json package.json

3. アイコンファイルの準備:
   - Windows: assets/fukabori_logo.ico (256x256)
   - macOS: assets/fukabori_logo.icns (512x512)
   - Linux: assets/fukabori_logo.png (512x512)

4. ビルド実行:
   npm run build-win    # Windows用インストーラー
   npm run build-mac    # macOS用インストーラー
   npm run build-linux  # Linux用インストーラー

5. 配布:
   dist/フォルダに生成されたインストーラーを配布

📦 生成されるファイル:
- Windows: 深堀くん Setup 0.7.2.exe
- macOS: 深堀くん-0.7.2.dmg
- Linux: 深堀くん-0.7.2.AppImage
`);
}

// スクリプト実行
if (require.main === module) {
  createInstaller();
}

module.exports = { createInstaller, packageConfig, mainJs }; 