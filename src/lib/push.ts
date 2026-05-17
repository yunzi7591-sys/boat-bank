import webpush from "web-push";
import apn from "@parse/node-apn";
import { prisma } from "@/lib/prisma";
import { getApnsProvider, getApnsBundleId } from "@/lib/apns";

let vapidConfigured = false;

function ensureVapid() {
    if (vapidConfigured) return true;
    const rawPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const rawPrivate = process.env.VAPID_PRIVATE_KEY;
    if (!rawPublic || !rawPrivate) {
        console.warn("[Push] VAPID keys not configured, skipping push notification");
        return false;
    }
    const publicKey = rawPublic.trim().replace(/^["']|["']$/g, "");
    const privateKey = rawPrivate.trim().replace(/^["']|["']$/g, "");
    try {
        webpush.setVapidDetails("mailto:support@boatbank.jp", publicKey, privateKey);
    } catch (e) {
        console.error("[Push] VAPID setup failed", e);
        return false;
    }
    vapidConfigured = true;
    return true;
}

/**
 * ユーザーの通知設定をチェックして、この通知タイプを受け取るか判定
 */
async function shouldNotify(userId: string, type: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notifySale: true, notifyNewPrediction: true },
    });
    if (!user) return false;

    if (type === "SALE" && !user.notifySale) return false;
    if (type === "NEW_PREDICTION" && !user.notifyNewPrediction) return false;
    return true;
}

/**
 * 特定ユーザーにプッシュ通知を送信し、同時にDB通知も作成する
 */
export async function sendPushNotification(
    userId: string,
    type: string,
    message: string,
    url?: string,
) {
    // 0. 通知設定チェック
    if (!(await shouldNotify(userId, type))) return { sent: 0, total: 0 };

    // 1. DB通知を作成
    await prisma.notification.create({
        data: { userId, type, message, url: url || null },
    });

    // 2. プッシュ通知を送信
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    });
    if (subscriptions.length === 0) return { sent: 0, total: 0 };

    const webPayload = JSON.stringify({
        title: "BOAT BANK",
        body: message,
        url: url || "/",
        icon: "/icon-192x192.png",
    });

    const vapidReady = ensureVapid();
    const apnsProvider = getApnsProvider();

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            if (sub.platform === "ios") {
                if (!apnsProvider) return;
                const note = new apn.Notification();
                note.alert = { title: "BOAT BANK", body: message };
                note.sound = "default";
                note.topic = getApnsBundleId();
                if (url) note.payload = { url };
                const deviceToken = sub.endpoint.startsWith("ios:")
                    ? sub.endpoint.slice(4)
                    : sub.endpoint;
                try {
                    const res = await apnsProvider.send(note, deviceToken);
                    if (res.failed && res.failed.length > 0) {
                        const reason = res.failed[0].response?.reason;
                        if (reason === "BadDeviceToken" || reason === "Unregistered") {
                            await prisma.pushSubscription.delete({ where: { id: sub.id } });
                        }
                    }
                } catch (err) {
                    console.error("[APNs] send failed", err);
                    throw err;
                }
                return;
            }

            // Web push
            if (!vapidReady || !sub.p256dh || !sub.auth) return;
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    webPayload,
                );
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } });
                }
                throw err;
            }
        }),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return { sent, total: subscriptions.length };
}

/**
 * 複数ユーザーにプッシュ通知を一括送信
 */
export async function sendPushToMultipleUsers(
    userIds: string[],
    type: string,
    message: string,
    url?: string,
) {
    for (const userId of userIds) {
        try {
            await sendPushNotification(userId, type, message, url);
        } catch {
            // 個別のエラーは無視して続行
        }
    }
}
