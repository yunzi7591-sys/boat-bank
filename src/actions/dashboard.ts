"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserDashboardData() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: "Unauthorized" };
        }

        const bets = await prisma.userBet.findMany({
            where: { userId: session.user.id },
            include: { race: true },
            orderBy: { createdAt: 'desc' }
        });

        return { bets };
    } catch (error) {
        console.error("Dashboard fetch error:", error);
        return { error: "Failed to fetch dashboard data" };
    }
}
