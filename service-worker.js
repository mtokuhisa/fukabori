// 深堀くん - Service Worker v0.7.5
// PWA機能とオフライン対応

// Electron環境では Service Worker を完全無効化
if (typeof importScripts === 'function') {
  // Service Worker環境でのElectron判定
  try {
    if (self.location.protocol === 'file:' || 
        self.location.href.includes('app.asar') || 
        self.location.href.includes('electron') ||
        self.location.href.includes('AppData')) {
      console.log('🚫 Service Worker: Electron環境検出 - 動作を完全停止');
      
      // 全イベントを無効化
      self.addEventListener('install', event => {
        console.log('🚫 Service Worker Install: Electron環境のためスキップ');
        event.waitUntil(self.skipWaiting());
      });
      
      self.addEventListener('activate', event => {
        console.log('🚫 Service Worker Activate: Electron環境のためスキップ');
        event.waitUntil(self.clients.claim());
      });
      
      self.addEventListener('fetch', event => {
        console.log('🚫 Service Worker Fetch: Electron環境のためスキップ -', event.request.url);
        // 何もしない - Electronのネイティブ処理に任せる
        return;
      });
      
      console.log('✅ Service Worker: Electron環境用設定完了');
      // 以降の処理をスキップ
    }
  } catch (error) {
    console.log('⚠️ Service Worker環境判定エラー:', error);
  }
}

const CACHE_NAME = 'fukabori-kun-v0.7.5-emergency-fix';
const urlsToCache = [
  '/深堀くん.html',
  '/app/style.css',
  '/app/script.js',
  '/app/utils.js',
  // 🔧 統一状態管理システム（モジュール化版）
  '/app/unified-state-manager/voice-module.js',
  '/app/unified-state-manager/ui-module.js', 
  '/app/unified-state-manager/core.js',
  '/app/unified-state-manager.js',
  '/app/unified-state-manager/styles.css',
  // 🔧 状態統合アダプター
  '/app/state-integration-adapter.js',
  '/app/ui-state-display.js',
  // 音声システム
  '/app/voice-core.js',
  '/app/voice-phase2-manager.js',
  '/app/voice-error-handler.js',
  '/app/voice-processing-manager.js',
  // UI/DOM操作管理
  '/app/ui-manager.js',
  '/app/ui-screens.js',
  '/app/ui-basic.js',
  '/app/ui-advanced.js',
  // システム管理
  '/app/storage-manager.js',
  '/app/file-processing.js',
  '/app/knowledge-system.js',
  '/app/session-controller.js',
  '/app/data-manager.js',
  '/app/file-manager.js',
  '/app/ai-manager.js',
  '/app/knowledge-file-manager-interface.js',
  '/app/api-key-setup.js',
  '/app/session-manager.js',
  '/app/session-start-manager.js',
  '/app/phase-manager.js',
  // 設定ファイル
  '/config/app_settings.js',
  '/config/prompts.js',
  '/config/voice_config.js',
  '/config/app_config_loader.js',
  '/config/categories.csv',
  '/config/user_names.csv',
  // アセット
  '/assets/fukabori_logo_main.png',
  '/assets/fukabori_logo.png',
  '/assets/nehori_avatar.png',
  '/assets/hahori_avatar.png',
  '/favicon.ico',
  '/manifest.json'
];

// Service Worker インストール
self.addEventListener('install', event => {
  console.log('🔧 Service Worker インストール開始');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker インストール完了');
        console.log('📱 PWA インストール要件チェック完了');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker インストール失敗:', error);
        console.error('📱 PWA インストールに影響する可能性があります');
      })
  );
});

// Service Worker アクティベーション
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker アクティベーション開始');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker アクティベーション完了');
      self.clients.claim();
    })
  );
});

// ネットワークリクエストの処理（Electron対応）
self.addEventListener('fetch', event => {
  // Chrome拡張機能のリクエストは無視
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // DevToolsのリクエストは無視
  if (event.request.url.includes('/.well-known/appspecific/')) {
    return;
  }

  // Electronでのfile://プロトコルとapp.asarパスは完全無視
  if (event.request.url.startsWith('file://') || 
      event.request.url.includes('app.asar') ||
      event.request.url.includes('AppData') ||
      event.request.url.includes('electron')) {
    console.log('🚫 Service Worker Fetch: Electron環境パス検出 - 処理をスキップ:', event.request.url);
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュから見つかった場合はそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then(response => {
          // レスポンスが有効でない場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(error => {
          console.log('⚠️ ネットワークリクエスト失敗:', event.request.url, error);
          throw error;
        });
      })
      .catch(() => {
        // オフライン時のフォールバック
        if (event.request.destination === 'document') {
          return caches.match('/深堀くん.html');
        }
      })
  );
});

// プッシュ通知の処理（将来の機能拡張用）
self.addEventListener('push', event => {
  console.log('📱 プッシュ通知受信:', event);
  // 将来的にプッシュ通知機能を追加する場合はここに実装
});

// 通知クリックの処理
self.addEventListener('notificationclick', event => {
  console.log('🔔 通知クリック:', event);
  event.notification.close();
  
  // アプリを開く
  event.waitUntil(
    clients.matchAll().then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/深堀くん.html');
      }
    })
  );
});

console.log('🎯 深堀くん Service Worker 読み込み完了'); 