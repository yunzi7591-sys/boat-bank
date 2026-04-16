import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { markNotificationsAsRead } from "@/actions/notification";
import { NotificationList } from "@/components/NotificationList";
import { PushNotificationManager } from "@/components/PushNotificationManager";

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // 開いた時点で既読にする
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
