"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { settleRacePredictions } from "@/lib/evaluate";
import { syncTodaySchedule, fetchAndSaveRaceResult, syncOfficialGradeAndDay, syncTodayResults } from "@/lib/boatrace-api";
import { revalidatePath } from "next/cache";

// Function removed

export async function triggerSyncSchedule() {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const result = await syncTodaySchedule();
        revalidatePath('/admin');
        return result;
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function triggerSyncScrape() {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const result = await syncOfficialGradeAndDay();
        revalidatePath('/admin');
        return result;
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function triggerApiEvaluation(formData: FormData) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const placeName = formData.get("placeName") as string;
        const raceNumber = parseInt(formData.get("raceNumber") as string);

        // 1. Fetch from API and save to RaceResult
        const apiRes = await fetchAndSaveRaceResult(placeName, raceNumber);
        if (!apiRes.success) {
            return { success: false, error: apiRes.error || "Failed to fetch from API" };
        }

        // 2. Evaluate
        const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
        const currentDate = new Date(todayStr);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const raceDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

        await settleRacePredictions(placeName, raceNumber, raceDate);

        revalidatePath('/admin');
        revalidatePath('/mypage');
        revalidatePath('/predictions');
        revalidatePath('/ranking');

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function triggerResultSyncBulk() {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const syncRes = await syncTodayResults();
        if (!syncRes.success) {
            return { success: false, error: syncRes.error };
        }

        const processedRaces = syncRes.processedRaces || [];
        let settlementCount = 0;
        for (const race of processedRaces) {
            await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
            settlementCount++;
        }

        revalidatePath('/admin');
        revalidatePath('/mypage');
        revalidatePath('/predictions');
        revalidatePath('/ranking');
        revalidatePath('/wallet');

        return {
            success: true,
            syncedCount: syncRes.count,
            settlementProcessedCount: settlementCount,
            races: processedRaces.map((r: any) => `${r.placeName} R${r.raceNumber}`).join(', ')
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
