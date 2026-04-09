"use server";

import { auth } from "@/auth";
import { getUserDailyStats } from "@/lib/stats";

export async function fetchDailyStats(year: number, month: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [] };

    const data = await getUserDailyStats(session.user.id, year, month);
    return { success: true, data };
}
