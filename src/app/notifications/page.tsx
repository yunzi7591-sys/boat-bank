import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { markNotificationsAsRead } from "@/actions/notification";
import { NotificationList } from "@/components/NotificationList";
import { NotificationSettings } from "@/components/NotificationSettings";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { InstallBanner } from "@/components/InstallBanner";
import { A8Banner, A8_BANNER_BOTTOM } from "@/components/ads/A8Banner";

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [user, notifications] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notifySale: true, notifyNewPrediction: true },
        }),
        prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
    ]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount > 0) {
        await markNotificationsAsRead();
    }

    return (
        <div className="min-h-screen bg-white pb-24">
            <div className="px-4 pt-5 pb-3 border-b border-[#e5edf5] sticky top-[56px] z-40 bg-white">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-light text-[#061b31]">通知</h1>
                    <PushNotificationManager />
                </div>
            </div>

            {/* インストール促進 */}
            <InstallBanner />

            {/* 通知設定（アコーディオン） */}
            <div className="border-b border-[#e5edf5]">
                <NotificationSettings
                    initialSettings={{
                        notifySale: user?.notifySale ?? true,
                        notifyNewPrediction: user?.notifyNewPrediction ?? true,
                    }}
                />
            </div>

            {/* A8 広告バナー */}
            <A8Banner {...A8_BANNER_BOTTOM} />

            {/* 通知一覧 */}
            <NotificationList
                notifications={notifications.map((n) => ({
                    id: n.id,
                    message: n.message,
                    type: n.type,
                    isRead: n.isRead,
                    createdAt: n.createdAt.toISOString(),
                }))}
            />
        </div>
    );
}
