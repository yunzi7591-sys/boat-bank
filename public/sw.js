const CACHE_NAME = "boatbank-v1";
const OFFLINE_URL = "/offline";

// インストール時にオフラインページをキャッシュ
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL]))
    );
    self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ネットワークリクエストのハンドリング
self.addEventListener("fetch", (event) => {
    // ナビゲーションリクエスト（ページ遷移）のみ対象
    if (event.request.mode !== "navigate") return;

    event.respondWith(
        fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
});

// プッシュ通知受信
self.addEventListener("push", (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: data.icon || "/icon-192x192.png",
        badge: "/favicon-96x96.png",
        data: { url: data.url || "/" },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "BOAT BANK", options)
    );
});

// 通知クリック
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/";
    event.waitUntil(
        clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});
