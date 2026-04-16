import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { markNotificationsAsRead } from "@/actions/notification";
import { NotificationList } from "@/components/NotificationList";
import { NotificationSettings } from "@/components/NotificationSettings";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { Settings } from "lucide-react";

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

            {/* 通知設定 */}
            <div className="border-b border-[#e5edf5]">
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Settings className="w-3.5 h-3.5 text-[#94a3b8]" />
                        <h2 className="text-xs font-bold text-[#94a3b8]">通知設定</h2>
                    </div>
                </div>
                <NotificationSettings
                    initialSettings={{
                        notifySale: user?.notifySale ?? true,
                        notifyNewPrediction: user?.notifyNewPrediction ?? true,
                    }}
                />
            </div>

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
