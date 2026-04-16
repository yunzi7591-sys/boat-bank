"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markNotificationsAsRead() {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.notification.updateMany({
        where: {
            userId: session.user.id,
            isRead: false
        },
        data: {
            isRead: true
        }
    });

    revalidatePath('/', 'layout');
}

export async function updateNotificationSettings(settings: {
    notifySale: boolean;
    notifyNewPrediction: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            notifySale: settings.notifySale,
            notifyNewPrediction: settings.notifyNewPrediction,
        },
    });

    revalidatePath('/notifications');
    return { success: true };
}
