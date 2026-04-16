"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            setPermission("unsupported");
            return;
        }
        setPermission(Notification.permission);

        // 既に購読済みか確認
        navigator.serviceWorker.ready.then((reg) => {
            reg.pushManager.getSubscription().then((sub) => {
                setIsSubscribed(!!sub);
            });
        });
    }, []);

    const subscribe = async () => {
        try {
            // Service Worker登録
            const reg = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;

            // 通知許可
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== "granted") {
                toast.error("通知が許可されませんでした");
                return;
            }

            // Push購読
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            });

            // サーバーに購読情報を送信
            const res = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!))),
                        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!))),
                    },
                }),
            });

            if (res.ok) {
                setIsSubscribed(true);
                toast.success("プッシュ通知をONにしました");
            }
        } catch (e: any) {
            console.error("[Push] Subscribe error:", e);
            toast.error("通知の設定に失敗しました");
        }
    };

    if (permission === "unsupported") return null;

    if (isSubscribed || permission === "granted") {
        return null; // 既に有効
    }

    return (
        <button
            onClick={subscribe}
            className="flex items-center gap-1.5 bg-[#533afd] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-[#4434d4] transition-colors"
        >
            <Bell className="w-3.5 h-3.5" />
            通知をON
        </button>
    );
}
