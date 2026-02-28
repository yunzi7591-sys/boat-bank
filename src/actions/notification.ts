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

    revalidatePath('/', 'layout'); // Revalidate header across all pages
}
