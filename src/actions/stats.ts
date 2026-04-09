"use server";

import { auth } from "@/auth";
import { getUserDailyStats, getUserDailyPredictions, getPublicDailyStats, getPublicDailyPredictions, DailyPredictionItem } from "@/lib/stats";

export async function fetchDailyStats(year: number, month: number) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, data: [], dailyPredictions: {} as { [date: string]: DailyPredictionItem[] } };

    const [data, dailyPredictions] = await Promise.all([
        getUserDailyStats(session.user.id, year, month),
        getUserDailyPredictions(session.user.id, year, month),
    ]);
    return { success: true, data, dailyPredictions };
}

export async function fetchPublicDailyStats(userId: string, year: number, month: number) {
    const [data, dailyPredictions] = await Promise.all([
        getPublicDailyStats(userId, year, month),
        getPublicDailyPredictions(userId, year, month),
    ]);
    return { success: true, data, dailyPredictions };
}
