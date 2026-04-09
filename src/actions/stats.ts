"use server";

import { auth } from "@/auth";
import { getUserDailyStats, getUserDailyPredictions, DailyPredictionItem } from "@/lib/stats";

export async function fetchDailyStats(year: number, month: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [], dailyPredictions: {} as { [date: string]: DailyPredictionItem[] } };

    const [data, dailyPredictions] = await Promise.all([
        getUserDailyStats(session.user.id, year, month),
        getUserDailyPredictions(session.user.id, year, month),
    ]);
    return { success: true, data, dailyPredictions };
}
