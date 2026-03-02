"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { settleRacePredictions } from "@/lib/evaluate";
import { syncTodaySchedule, fetchAndSaveRaceResult } from "@/lib/boatrace-api";
import { revalidatePath } from "next/cache";

export async function submitManualResult(formData: FormData) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Unauthorized");

    const placeName = formData.get("placeName") as string;
    const raceNumber = parseInt(formData.get("raceNumber") as string);
    const dateStr = formData.get("raceDate") as string;
    const raceDate = dateStr ? new Date(dateStr) : new Date();

    const first = parseInt(formData.get("first") as string);
    const second = parseInt(formData.get("second") as string);
    const third = parseInt(formData.get("third") as string);

    // Refunds
    const winPayout = parseInt(formData.get("winPayout") as string);
    const p2TRPayout = parseInt(formData.get("p2TRPayout") as string);
    const p3TRPayout = parseInt(formData.get("p3TRPayout") as string);

    const payoutsData = [
        { type: "3TR", numbers: `${first}-${second}-${third}`, amount: p3TRPayout },
        { type: "2TR", numbers: `${first}-${second}`, amount: p2TRPayout },
        { type: "WIN", numbers: `${first}`, amount: winPayout },
    ];
    const refundedBoats: number[] = [];

    await prisma.raceResult.upsert({
        where: {
            placeName_raceNumber_raceDate: {
                placeName,
                raceNumber,
                raceDate,
            },
        },
        update: {
            firstPlace: first,
            secondPlace: second,
            thirdPlace: third,
            payouts: payoutsData,
            refunds: refundedBoats,
        },
        create: {
            placeName,
            raceNumber,
            raceDate,
            firstPlace: first,
            secondPlace: second,
            thirdPlace: third,
            payouts: payoutsData,
            refunds: refundedBoats,
        },
    });

    await settleRacePredictions(placeName, raceNumber, raceDate);
    revalidatePath('/admin');
    revalidatePath('/mypage');
}

export async function triggerBatchEvaluation(formData: FormData) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMIN') throw new Error("Unauthorized");

    // In a real app we would find all distinct placeName/raceNumber/raceDate pairs that are unresolved.
    // For MVP, if we trigger this, we'll just return a success message assuming external chron handles the real loop.
    revalidatePath('/admin');
}

export async function triggerDemoEvaluation(placeName: string, raceNumber: number, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const first = parseInt(formData.get("first") as string) || 1;
    const second = parseInt(formData.get("second") as string) || 2;
    const third = parseInt(formData.get("third") as string) || 3;
    const payout = parseInt(formData.get("payout") as string) || 1540;

    const payoutsData = [
        { type: "3TR", numbers: `${first}-${second}-${third}`, amount: payout },
        { type: "2TR", numbers: `${first}-${second}`, amount: Math.floor(payout / 3) },
        { type: "WIN", numbers: `${first}`, amount: 300 },
    ];
    const refundedBoats: number[] = [];

    const raceDate = new Date(); // Using today for simplicity

    await prisma.raceResult.upsert({
        where: {
            placeName_raceNumber_raceDate: {
                placeName,
                raceNumber,
                raceDate,
            },
        },
        update: {
            firstPlace: first,
            secondPlace: second,
            thirdPlace: third,
            payouts: payoutsData,
            refunds: refundedBoats,
        },
        create: {
            placeName,
            raceNumber,
            raceDate,
            firstPlace: first,
            secondPlace: second,
            thirdPlace: third,
            payouts: payoutsData,
            refunds: refundedBoats,
        },
    });

    const result = await settleRacePredictions(placeName, raceNumber, raceDate);
    revalidatePath('/mypage');
    revalidatePath('/predictions');

    return result;
}

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
