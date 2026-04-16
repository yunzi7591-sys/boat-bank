import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
    "mailto:support@boatbank.jp",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
);

/**
 * 特定ユーザーにプッシュ通知を送信し、同時にDB通知も作成する
 */
export async function sendPushNotification(
    userId: string,
    type: string,
    message: string,
    url?: string,
) {
    // 1. DB通知を作成
    await prisma.notification.create({
        data: { userId, type, message },
    });

    // 2. プッシュ通知を送信
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    });

    const payload = JSON.stringify({
        title: "BOAT BANK",
        body: message,
        url: url || "/",
        icon: "/icon-192x192.png",
    });

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload,
                );
            } catch (err: any) {
                // 410 Gone = 購読が無効化された → 削除
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
