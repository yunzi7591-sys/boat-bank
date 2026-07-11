"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { settleRacePredictions } from "@/lib/evaluate";
import { syncTodaySchedule, syncOfficialGradeAndDay, syncTodayResults, syncAndSaveSingleResult } from "@/lib/boatrace-api";
import { revalidatePath } from "next/cache";
import { errorMessage } from "@/lib/errors";
import { jstBusinessRaceDate } from "@/lib/business-day";

// Function removed

export async function triggerSyncSchedule() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const result = await syncTodaySchedule();
        revalidatePath('/admin');
        return result;
    } catch (e) {
        return { success: false, error: errorMessage(e) };
    }
}

export async function triggerSyncScrape() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const result = await syncOfficialGradeAndDay();
        revalidatePath('/admin');
        return result;
    } catch (e) {
        return { success: false, error: errorMessage(e) };
    }
}

export async function triggerApiEvaluation(formData: FormData) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const placeName = formData.get("placeName") as string;
        const raceNumber = parseInt(formData.get("raceNumber") as string);

        // 1. Fetch and save race result (scraping + API fallback)
        // 深夜2時(26時)までは前日扱い
        const raceDate = jstBusinessRaceDate();

        await syncAndSaveSingleResult(placeName, raceNumber, raceDate);

        // 2. Evaluate
        await settleRacePredictions(placeName, raceNumber, raceDate);

        revalidatePath('/admin');
        revalidatePath('/mypage');
        revalidatePath('/predictions');
        revalidatePath('/ranking');

        return { success: true };
    } catch (e) {
        return { success: false, error: errorMessage(e) };
    }
}

export async function triggerResultSyncBulk() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') return { success: false, error: "Unauthorized" };

        const syncRes = await syncTodayResults({}); // Unlimited manual sync
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
            races: processedRaces.map((r) => `${r.placeName} R${r.raceNumber}`).join(', ')
        };
    } catch (e) {
        return { success: false, error: errorMessage(e) };
    }
}
