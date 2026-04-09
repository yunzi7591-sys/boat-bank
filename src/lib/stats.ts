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

export interface VenueStats {
    placeName: string;
    totalInvestment: number;
    totalRefund: number;
    recoveryRate: number;
    hitCount: number;
    totalPredictions: number;
}

export async function getUserVenueStats(userId: string): Promise<VenueStats[]> {
    const predictions = await prisma.prediction.findMany({
        where: { authorId: userId },
        select: {
            placeName: true,
            isSettled: true,
            isHit: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true,
        },
    });

    const venueMap = new Map<string, { inv: number; ref: number; hit: number; total: number }>();

    for (const pred of predictions) {
        const entry = venueMap.get(pred.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
        entry.inv += pred.betAmount || 0;
        entry.total++;
        if (pred.isSettled) {
            entry.ref += (pred.hitAmount || pred.refundAmount || 0);
            if (pred.isHit) entry.hit++;
        }
        venueMap.set(pred.placeName, entry);
    }

    return Array.from(venueMap.entries())
        .map(([placeName, d]) => ({
            placeName,
            totalInvestment: d.inv,
            totalRefund: d.ref,
            recoveryRate: d.inv > 0 ? (d.ref / d.inv) * 100 : 0,
            hitCount: d.hit,
            totalPredictions: d.total,
        }))
        .sort((a, b) => b.totalPredictions - a.totalPredictions);
}

export async function getUserStats(userId: string): Promise<UserStats> {
    const predictions = await prisma.prediction.findMany({
        where: { authorId: userId },
        select: {
            isSettled: true,
            isHit: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true, // fallback
        },
    });

    let totalInvestment = 0;
    let totalRefund = 0; // Total returned to the user (wins + refunds)
    let hitCount = 0;
    let totalPredictions = predictions.length;

    for (const pred of predictions) {
        // sum up all bets made by the user
        totalInvestment += pred.betAmount || 0;

        // sum up all returns
        if (pred.isSettled) {
            // Using hitAmount as the unified field for earned points (includes refunds and wins)
            totalRefund += (pred.hitAmount || pred.refundAmount || 0);
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
