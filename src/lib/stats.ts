import { prisma } from "@/lib/prisma";
import { Formation } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";
import { VENUES } from "@/lib/constants/venues";

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

export interface VenueStatsWithPeriod {
    placeName: string;
    venueId: string;
    totalInvestment: number;
    totalRefund: number;
    recoveryRate: number;
    hitCount: number;
    totalPredictions: number;
}

type Period = "all" | "year" | string; // "all", "year", or "YYYY-MM"

function buildDateRange(period: Period): { gte: Date; lt: Date } | null {
    if (period === "all") return null;

    // JST is UTC+9. raceDate is stored as UTC 00:00 representing JST date,
    // so we can compare directly without offset adjustment.
    if (period === "year") {
        const now = new Date();
        const year = now.getFullYear();
        return {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
        };
    }

    // Month format: "YYYY-MM"
    const match = period.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid period format: ${period}. Expected "all", "year", or "YYYY-MM".`);
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10); // 1-12

    const gte = new Date(Date.UTC(year, month - 1, 1));
    // Next month's first day
    const lt = new Date(Date.UTC(year, month, 1));

    return { gte, lt };
}

export async function getUserVenueStatsWithPeriod(
    userId: string,
    period: Period
): Promise<VenueStatsWithPeriod[]> {
    const dateRange = buildDateRange(period);

    const where: Record<string, unknown> = { authorId: userId };
    if (dateRange) {
        where.raceDate = { gte: dateRange.gte, lt: dateRange.lt };
    }

    const predictions = await prisma.prediction.findMany({
        where,
        select: {
            placeName: true,
            isSettled: true,
            isHit: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true,
        },
    });

    // Aggregate by placeName
    const venueMap = new Map<string, { inv: number; ref: number; hit: number; total: number }>();

    for (const pred of predictions) {
        const entry = venueMap.get(pred.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
        entry.inv += pred.betAmount || 0;
        entry.total++;
        if (pred.isSettled) {
            entry.ref += pred.hitAmount || pred.refundAmount || 0;
            if (pred.isHit) entry.hit++;
        }
        venueMap.set(pred.placeName, entry);
    }

    // Return all 24 venues, filling in zeros for venues with no predictions
    return VENUES.map((venue) => {
        const d = venueMap.get(venue.name) || { inv: 0, ref: 0, hit: 0, total: 0 };
        return {
            placeName: venue.name,
            venueId: venue.id,
            totalInvestment: d.inv,
            totalRefund: d.ref,
            recoveryRate: d.inv > 0 ? (d.ref / d.inv) * 100 : 0,
            hitCount: d.hit,
            totalPredictions: d.total,
        };
    });
}
