import { prisma } from "@/lib/prisma";
import { Formation } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";

export interface UserStats {
    totalInvestment: number;
    totalRefund: number;
    recoveryRate: number;
    hitCount: number;
    totalPredictions: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
    const predictions = await prisma.prediction.findMany({
        where: { authorId: userId },
        select: {
            predictedNumbers: true,
            resultChecked: true,
            isHit: true,
            refundAmount: true,
        },
    });

    let totalInvestment = 0;
    let totalRefund = 0;
    let hitCount = 0;
    let totalPredictions = predictions.length;

    for (const pred of predictions) {
        // 1. Calculate investment for all published predictions
        try {
            const formations: Formation[] = parseJsonSafely<Formation[]>(pred.predictedNumbers);
            const predInvestment = formations.reduce((sum, f) => {
                return sum + f.combinations.reduce((sub, c) => sub + c.amount, 0);
            }, 0);
            totalInvestment += predInvestment;
        } catch (e) {
            console.error("Failed to parse predictedNumbers for investment sum");
        }

        // 2. Accumulate refunds and hits only for evaluated predictions
        if (pred.resultChecked) {
            totalRefund += pred.refundAmount;
            if (pred.isHit) hitCount++;
        }
    }

    // Calculate recovery rate
    const recoveryRate = totalInvestment > 0 ? (totalRefund / totalInvestment) * 100 : 0;

    return {
        totalInvestment,
        totalRefund,
        recoveryRate,
        hitCount,
        totalPredictions,
    };
}
