self.addEventListener("push", (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: data.icon || "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: { url: data.url || "/" },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "BOAT BANK", options)
    );
});

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
