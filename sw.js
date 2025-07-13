// 深堀くん - Service Worker
// PWA対応：オフライン機能、キャッシュ管理、バックグラウンド同期

const CACHE_NAME = 'fukabori-v0.8.0-voice-system';
const OFFLINE_URL = '/深堀くん.html';

// キャッシュするリソース
const urlsToCache = [
  '/深堀くん.html',
  '/app/style.css',
  '/app/script.js',
  '/app/utils.js',
  '/app/voice-core.js',
  '/app/ui-manager.js',
  '/app/ui-screens.js',
  '/app/ui-basic.js',
  '/app/ui-advanced.js',
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
  '/app/phase-manager.js',
  '/app/session-start-manager.js',
  '/app/voice-phase2-manager.js',
  '/app/voice-error-handler.js',
  '/app/voice-ui-manager.js',
  '/app/unified-state-manager/voice-module.js',
  '/config/app_config_loader.js',
  '/config/app_settings.js',
  '/config/voice_config.js',
  '/config/prompts.js',
  '/config/categories.csv',
  '/config/user_names.csv',
  '/assets/fukabori_logo.png',
  '/assets/fukabori_logo_main.png',
  '/assets/nehori_avatar.png',
  '/assets/hahori_avatar.png',
  '/manifest.json'
];

// Service Worker インストール
self.addEventListener('install', event => {
  console.log('🔧 Service Worker インストール中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker インストール完了');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker インストールエラー:', error);
      })
  );
});

// Service Worker アクティベーション
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker アクティベーション中...');
  
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
      return self.clients.claim();
    })
  );
});

// フェッチイベント（ネットワーク要求の処理）
self.addEventListener('fetch', event => {
  // Chrome拡張のリクエストを除外
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // OpenAI API呼び出しはキャッシュしない
  if (event.request.url.includes('api.openai.com')) {
    return;
  }
  
  // 外部CDN（PDF.js、SheetJS等）はネットワーク優先
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // CDN失敗時はエラーを返す（フォールバック機能が処理）
          return new Response('CDN unavailable', { status: 503 });
        })
    );
    return;
  }
  
  // その他のリソースはキャッシュファーストで処理
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにある場合はキャッシュを返す
        if (response) {
          return response;
        }
        
        // ネットワークから取得を試行
        return fetch(event.request)
          .then(response => {
            // 有効なレスポンスでない場合
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // ネットワークエラー時はオフラインページを返す
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 バックグラウンド同期実行');
    event.waitUntil(doBackgroundSync());
  }
});

// プッシュ通知（将来の拡張用）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('📢 プッシュ通知受信:', data);
    
    const options = {
      body: data.body || '深堀くんから通知があります',
      icon: '/assets/fukabori_logo.png',
      badge: '/assets/fukabori_logo.png',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '深堀くん', options)
    );
  }
});

// バックグラウンド同期の実装
async function doBackgroundSync() {
  try {
    // 保存されたデータの同期処理
    console.log('🔄 データ同期処理を実行');
    
    // 実装例：保存された知見データの処理
    const pendingData = await getPendingData();
    if (pendingData.length > 0) {
      console.log(`📊 ${pendingData.length}件のデータを同期中...`);
      // 同期処理の実装
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('❌ バックグラウンド同期エラー:', error);
    return Promise.reject(error);
  }
}

// 保留データの取得
async function getPendingData() {
  // IndexedDBまたはlocalStorageから保留データを取得
  return [];
}

console.log('✅ Service Worker 読み込み完了 - 深堀くん PWA対応'); 