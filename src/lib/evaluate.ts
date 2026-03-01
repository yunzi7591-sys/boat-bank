import { prisma } from "@/lib/prisma";
import { Formation, Combination } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";

export interface RefundData {
    type: string; // "3TR" (3連単), "2TR" (2連単) 等
    numbers: string; // "1-2-3" 等
    amount: number; // 100円あたりの払戻金 (例: 1540)
}

/**
 * Executes evaluation against all un-checked predictions for a specific race.
 */
export async function evaluateRaceBatch(placeName: string, raceNumber: number, raceDate: Date) {
    const raceResult = await prisma.raceResult.findUnique({
        where: { placeName_raceNumber_raceDate: { placeName, raceNumber, raceDate } },
    });

    if (!raceResult) throw new Error("Race result not found");

    const predictions = await prisma.prediction.findMany({
        where: { placeName, raceNumber, raceDate, resultChecked: false },
    });

    let refundsList: RefundData[] = [];
    try {
        refundsList = parseJsonSafely<RefundData[]>(raceResult.refunds);
    } catch (e) {
        console.error("Failed to parse refunds JSON", e);
        return { success: false, evaluatedCount: 0 };
    }

    let evaluatedCount = 0;

    for (const pred of predictions) {
        let formations: Formation[] = [];
        try {
            formations = parseJsonSafely<Formation[]>(pred.predictedNumbers);
        } catch (e) {
            continue; // Skip invalid formats
        }

        let isHit = false;
        let totalRefundAmount = 0;

        for (const formation of formations) {
            // Find the official refund data for this bet type
            const officialRefundForType = refundsList.find(r => r.type === formation.betType);

            if (!officialRefundForType) continue;

            for (const comb of formation.combinations) {
                // If the combination matches the official winning numbers
                if (comb.id === officialRefundForType.numbers) {
                    isHit = true;
                    // Calculate refund based on 100pt standard odds
                    const payout = Math.floor((officialRefundForType.amount / 100) * comb.amount);
                    totalRefundAmount += payout;
                }
            }
        }

        // Update prediction in DB
        await prisma.prediction.update({
            where: { id: pred.id },
            data: {
                resultChecked: true,
                isHit,
                refundAmount: totalRefundAmount,
            },
        });

        evaluatedCount++;
    }

    return { success: true, evaluatedCount };
}

/**
 * Executes evaluation for a single prediction if the official result is available.
 */
export async function evaluatePrediction(predictionId: string) {
    const pred = await prisma.prediction.findUnique({
        where: { id: predictionId, resultChecked: false },
    });
    if (!pred) return null;

    const raceResult = await prisma.raceResult.findUnique({
        where: { placeName_raceNumber_raceDate: { placeName: pred.placeName, raceNumber: pred.raceNumber, raceDate: pred.raceDate } },
    });
    if (!raceResult) return null;

    let refundsList: RefundData[] = [];
    try {
        refundsList = parseJsonSafely<RefundData[]>(raceResult.refunds);
    } catch (e) {
        return null;
    }

    let formations: Formation[] = [];
    try {
        formations = parseJsonSafely<Formation[]>(pred.predictedNumbers);
    } catch (e) {
        return null;
    }

    let isHit = false;
    let totalRefundAmount = 0;

    for (const formation of formations) {
        const officialRefundForType = refundsList.find(r => r.type === formation.betType);
        if (!officialRefundForType) continue;

        for (const comb of formation.combinations) {
            if (comb.id === officialRefundForType.numbers) {
                isHit = true;
                const payout = Math.floor((officialRefundForType.amount / 100) * comb.amount);
                totalRefundAmount += payout;
            }
        }
    }

    await prisma.prediction.update({
        where: { id: pred.id },
        data: {
            resultChecked: true,
            isHit,
            refundAmount: totalRefundAmount,
        },
    });

    return { isHit, refundAmount: totalRefundAmount };
}
