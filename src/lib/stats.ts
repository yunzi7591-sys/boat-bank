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

export interface UserPointsDetail {
    points: number;        // 保有ポイント（恒久）
    dailyPoints: number;   // 毎日付与ポイント（翌日リセット）
    totalPoints: number;   // 合計（points + dailyPoints）
    totalEarned: number;   // 通算獲得pt（SELL_PREDICTIONの合計）
    monthEarned: number;   // 今月獲得pt
}

export async function getUserPointsDetail(userId: string): Promise<UserPointsDetail> {
    // ユーザーの保有ポイントを取得
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { points: true, dailyPoints: true },
    });

    // JST基準で今月の範囲を算出（JST = UTC+9）
    const nowUtc = new Date();
    const jstOffsetMs = 9 * 60 * 60 * 1000;
    const nowJst = new Date(nowUtc.getTime() + jstOffsetMs);
    const jstYear = nowJst.getUTCFullYear();
    const jstMonth = nowJst.getUTCMonth(); // 0-indexed
    // 今月1日 00:00 JST → UTC
    const monthStartUtc = new Date(Date.UTC(jstYear, jstMonth, 1) - jstOffsetMs);
    // 来月1日 00:00 JST → UTC
    const monthEndUtc = new Date(Date.UTC(jstYear, jstMonth + 1, 1) - jstOffsetMs);

    // SELL_PREDICTION の通算合計と今月合計を並行取得
    const [totalAgg, monthAgg] = await Promise.all([
        prisma.transaction.aggregate({
            where: { userId, action: "SELL_PREDICTION" },
            _sum: { points: true },
        }),
        prisma.transaction.aggregate({
            where: {
                userId,
                action: "SELL_PREDICTION",
                createdAt: { gte: monthStartUtc, lt: monthEndUtc },
            },
            _sum: { points: true },
        }),
    ]);

    const totalEarned = totalAgg._sum.points ?? 0;
    const monthEarned = monthAgg._sum.points ?? 0;

    return {
        points: user.points,
        dailyPoints: user.dailyPoints,
        totalPoints: user.points + user.dailyPoints,
        totalEarned,
        monthEarned,
    };
}

export async function getUserVenueStats(userId: string): Promise<VenueStats[]> {
    // マイページ: UserBetのみ
    const userBets = await prisma.userBet.findMany({
        where: { userId },
        select: {
            placeName: true,
            isSettled: true,
            isHit: true,
            betAmount: true,
            hitAmount: true,
        },
    });

    const venueMap = new Map<string, { inv: number; ref: number; hit: number; total: number }>();

    for (const bet of userBets) {
        if (!bet.placeName) continue;
        const entry = venueMap.get(bet.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
        entry.inv += bet.betAmount || 0;
        entry.total++;
        if (bet.isSettled) {
            entry.ref += bet.hitAmount || 0;
            if (bet.isHit) entry.hit++;
        }
        venueMap.set(bet.placeName, entry);
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

export async function getPublicUserStats(userId: string): Promise<UserStats> {
    const predictions = await prisma.prediction.findMany({
        where: { authorId: userId, isPrivate: false },
        select: {
            isSettled: true,
            isHit: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true,
        },
    });

    let totalInvestment = 0;
    let totalRefund = 0;
    let hitCount = 0;
    let totalPredictions = predictions.length;

    for (const pred of predictions) {
        totalInvestment += pred.betAmount || 0;
        if (pred.isSettled) {
            totalRefund += (pred.hitAmount || 0) + (pred.refundAmount || 0);
            if (pred.isHit) hitCount++;
        }
    }

    const recoveryRate = totalInvestment > 0 ? (totalRefund / totalInvestment) * 100 : 0;

    return {
        totalInvestment,
        totalRefund,
        recoveryRate,
        hitCount,
        totalPredictions,
    };
}

export async function getPublicDailyStats(
    userId: string,
    year: number,
    month: number
): Promise<DailyPnL[]> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));

    const predictions = await prisma.prediction.findMany({
        where: {
            authorId: userId,
            isPrivate: false,
            raceDate: { gte, lt },
        },
        select: {
            raceDate: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true,
            isSettled: true,
        },
    });

    const dayMap = new Map<string, { inv: number; ref: number; count: number }>();

    for (const pred of predictions) {
        const dateStr = pred.raceDate.toISOString().slice(0, 10);
        const entry = dayMap.get(dateStr) || { inv: 0, ref: 0, count: 0 };
        entry.inv += pred.betAmount || 0;
        if (pred.isSettled) {
            entry.ref += (pred.hitAmount || 0) + (pred.refundAmount || 0);
        }
        entry.count++;
        dayMap.set(dateStr, entry);
    }

    return Array.from(dayMap.entries())
        .map(([date, d]) => ({
            date,
            investment: d.inv,
            refund: d.ref,
            pnl: d.ref - d.inv,
            predictions: d.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getPublicDailyPredictions(
    userId: string,
    year: number,
    month: number
): Promise<{ [date: string]: DailyPredictionItem[] }> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));

    const predictions = await prisma.prediction.findMany({
        where: {
            authorId: userId,
            isPrivate: false,
            raceDate: { gte, lt },
        },
        select: {
            id: true,
            raceDate: true,
            placeName: true,
            raceNumber: true,
            predictedNumbers: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true,
            isSettled: true,
            isHit: true,
        },
        orderBy: [{ raceDate: "asc" }, { placeName: "asc" }, { raceNumber: "asc" }],
    });

    const result: { [date: string]: DailyPredictionItem[] } = {};

    for (const pred of predictions) {
        const dateStr = pred.raceDate.toISOString().slice(0, 10);
        if (!result[dateStr]) {
            result[dateStr] = [];
        }
        const pn = pred.predictedNumbers as { type?: string; combination?: string } | null;
        result[dateStr].push({
            id: pred.id,
            source: 'prediction',
            placeName: pred.placeName,
            raceNumber: pred.raceNumber,
            betType: pn?.type ?? undefined,
            combination: pn?.combination ?? undefined,
            betAmount: pred.betAmount || 0,
            hitAmount: pred.isSettled ? (pred.hitAmount || 0) : 0,
            refundAmount: pred.isSettled ? (pred.refundAmount || 0) : 0,
            isSettled: pred.isSettled,
            isHit: pred.isHit,
        });
    }

    return result;
}

export async function getUserStats(userId: string): Promise<UserStats> {
    // マイページ: UserBet（自分の賭け記録）のみ
    const userBets = await prisma.userBet.findMany({
        where: { userId },
        select: {
            placeName: true,
            raceNumber: true,
            raceDate: true,
            betAmount: true,
            isSettled: true,
            isHit: true,
            hitAmount: true,
        },
    });

    let totalInvestment = 0;
    let totalRefund = 0;

    const raceMap = new Map<string, { settled: boolean; hit: boolean }>();

    for (const bet of userBets) {
        totalInvestment += bet.betAmount || 0;
        if (bet.isSettled) {
            totalRefund += bet.hitAmount || 0;
        }
        const key = `bet-${bet.placeName}-${bet.raceNumber}-${bet.raceDate?.toISOString()}`;
        const race = raceMap.get(key) || { settled: false, hit: false };
        if (bet.isSettled) race.settled = true;
        if (bet.isHit) race.hit = true;
        raceMap.set(key, race);
    }

    const totalPredictions = raceMap.size;
    const hitCount = Array.from(raceMap.values()).filter(r => r.hit).length;
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

/**
 * 公開プロフィール用: Prediction (isPrivate: false) ベース
 */
export async function getUserVenueStatsWithPeriod(
    userId: string,
    period: Period
): Promise<VenueStatsWithPeriod[]> {
    const dateRange = buildDateRange(period);

    const where: Record<string, unknown> = { authorId: userId, isPrivate: false };
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

    const venueMap = new Map<string, { inv: number; ref: number; hit: number; total: number }>();

    for (const pred of predictions) {
        const entry = venueMap.get(pred.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
        entry.inv += pred.betAmount || 0;
        entry.total++;
        if (pred.isSettled) {
            entry.ref += (pred.hitAmount || 0) + (pred.refundAmount || 0);
            if (pred.isHit) entry.hit++;
        }
        venueMap.set(pred.placeName, entry);
    }

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

/**
 * マイページ用: UserBet ベース
 */
/**
 * マイページ用: 1クエリで全UserBetを取得し、通算/年/月別に分割
 */
export async function getPrivateVenueStatsAll(userId: string): Promise<{
    all: VenueStatsWithPeriod[];
    year: VenueStatsWithPeriod[];
    monthly: { [key: string]: VenueStatsWithPeriod[] };
}> {
    const currentYear = new Date().getFullYear();

    const userBets = await prisma.userBet.findMany({
        where: { userId },
        select: { placeName: true, raceDate: true, isSettled: true, isHit: true, betAmount: true, hitAmount: true },
    });

    function buildFromBets(bets: typeof userBets): VenueStatsWithPeriod[] {
        const map = new Map<string, { inv: number; ref: number; hit: number; total: number }>();
        for (const bet of bets) {
            if (!bet.placeName) continue;
            const e = map.get(bet.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
            e.inv += bet.betAmount || 0;
            e.total++;
            if (bet.isSettled) { e.ref += bet.hitAmount || 0; if (bet.isHit) e.hit++; }
            map.set(bet.placeName, e);
        }
        return VENUES.map(v => {
            const d = map.get(v.name) || { inv: 0, ref: 0, hit: 0, total: 0 };
            return { placeName: v.name, venueId: v.id, totalInvestment: d.inv, totalRefund: d.ref, recoveryRate: d.inv > 0 ? (d.ref / d.inv) * 100 : 0, hitCount: d.hit, totalPredictions: d.total };
        });
    }

    const allStats = buildFromBets(userBets);
    const yearBets = userBets.filter(b => b.raceDate && b.raceDate.getUTCFullYear() === currentYear);
    const yearStats = buildFromBets(yearBets);

    const monthly: { [key: string]: VenueStatsWithPeriod[] } = {};
    for (let m = 0; m < 12; m++) {
        const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const monthBets = yearBets.filter(b => b.raceDate && b.raceDate.getUTCMonth() === m);
        monthly[key] = buildFromBets(monthBets);
    }

    return { all: allStats, year: yearStats, monthly };
}

/**
 * 公開プロフィール用: 1クエリで全Predictionを取得し分割
 */
export async function getPublicVenueStatsAll(userId: string): Promise<{
    all: VenueStatsWithPeriod[];
    year: VenueStatsWithPeriod[];
    monthly: { [key: string]: VenueStatsWithPeriod[] };
}> {
    const currentYear = new Date().getFullYear();

    const predictions = await prisma.prediction.findMany({
        where: { authorId: userId, isPrivate: false },
        select: { placeName: true, raceDate: true, isSettled: true, isHit: true, betAmount: true, hitAmount: true, refundAmount: true },
    });

    function buildFromPreds(preds: typeof predictions): VenueStatsWithPeriod[] {
        const map = new Map<string, { inv: number; ref: number; hit: number; total: number }>();
        for (const p of preds) {
            const e = map.get(p.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
            e.inv += p.betAmount || 0;
            e.total++;
            if (p.isSettled) { e.ref += (p.hitAmount || 0) + (p.refundAmount || 0); if (p.isHit) e.hit++; }
            map.set(p.placeName, e);
        }
        return VENUES.map(v => {
            const d = map.get(v.name) || { inv: 0, ref: 0, hit: 0, total: 0 };
            return { placeName: v.name, venueId: v.id, totalInvestment: d.inv, totalRefund: d.ref, recoveryRate: d.inv > 0 ? (d.ref / d.inv) * 100 : 0, hitCount: d.hit, totalPredictions: d.total };
        });
    }

    const allStats = buildFromPreds(predictions);
    const yearPreds = predictions.filter(p => p.raceDate.getUTCFullYear() === currentYear);
    const yearStats = buildFromPreds(yearPreds);

    const monthly: { [key: string]: VenueStatsWithPeriod[] } = {};
    for (let m = 0; m < 12; m++) {
        const key = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const monthPreds = yearPreds.filter(p => p.raceDate.getUTCMonth() === m);
        monthly[key] = buildFromPreds(monthPreds);
    }

    return { all: allStats, year: yearStats, monthly };
}

export async function getPrivateVenueStatsWithPeriod(
    userId: string,
    period: Period
): Promise<VenueStatsWithPeriod[]> {
    const dateRange = buildDateRange(period);

    const where: Record<string, unknown> = { userId };
    if (dateRange) {
        where.raceDate = { gte: dateRange.gte, lt: dateRange.lt };
    }

    const userBets = await prisma.userBet.findMany({
        where,
        select: {
            placeName: true,
            isSettled: true,
            isHit: true,
            betAmount: true,
            hitAmount: true,
        },
    });

    const venueMap = new Map<string, { inv: number; ref: number; hit: number; total: number }>();

    for (const bet of userBets) {
        if (!bet.placeName) continue;
        const entry = venueMap.get(bet.placeName) || { inv: 0, ref: 0, hit: 0, total: 0 };
        entry.inv += bet.betAmount || 0;
        entry.total++;
        if (bet.isSettled) {
            entry.ref += bet.hitAmount || 0;
            if (bet.isHit) entry.hit++;
        }
        venueMap.set(bet.placeName, entry);
    }

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

// --- Daily predictions (per-race detail) ---

export interface DailyPredictionItem {
    id: string;
    source: 'prediction' | 'userbet';
    placeName: string;
    raceNumber: number;
    betType?: string;
    combination?: string;
    betAmount: number;
    hitAmount: number;
    refundAmount?: number;
    isSettled: boolean;
    isHit: boolean;
}

/**
 * 指定月の日ごとの予想一覧を返す（レース単位の詳細）
 */
export async function getUserDailyPredictions(
    userId: string,
    year: number,
    month: number
): Promise<{ [date: string]: DailyPredictionItem[] }> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));

    // マイページ: UserBetのみ
    const userBets = await prisma.userBet.findMany({
        where: { userId, raceDate: { gte, lt } },
        select: { id: true, raceDate: true, placeName: true, raceNumber: true, betType: true, combination: true, betAmount: true, hitAmount: true, refundAmount: true, isSettled: true, isHit: true },
        orderBy: [{ raceDate: "asc" }, { placeName: "asc" }, { raceNumber: "asc" }],
    });

    const result: { [date: string]: DailyPredictionItem[] } = {};

    for (const bet of userBets) {
        if (!bet.raceDate || !bet.placeName || !bet.raceNumber) continue;
        const dateStr = bet.raceDate.toISOString().slice(0, 10);
        if (!result[dateStr]) result[dateStr] = [];
        result[dateStr].push({
            id: bet.id,
            source: 'userbet',
            placeName: bet.placeName,
            raceNumber: bet.raceNumber,
            betType: bet.betType ?? undefined,
            combination: bet.combination ?? undefined,
            betAmount: bet.betAmount || 0,
            hitAmount: bet.isSettled ? (bet.hitAmount || 0) : 0,
            refundAmount: bet.isSettled ? (bet.refundAmount || 0) : 0,
            isSettled: bet.isSettled,
            isHit: bet.isHit,
        });
    }

    return result;
}

// --- Calendar stats ---

export interface DailyPnL {
    date: string; // "2026-04-01"
    investment: number;
    refund: number;
    pnl: number; // refund - investment
    predictions: number;
}

export interface MonthlyPnL {
    month: string; // "2026-01"
    investment: number;
    refund: number;
    pnl: number;
    predictions: number;
}

/**
 * 指定月の各日の収支を返す（予想がない日は含めない）
 */
export async function getUserDailyStats(
    userId: string,
    year: number,
    month: number
): Promise<DailyPnL[]> {
    const gte = new Date(Date.UTC(year, month - 1, 1));
    const lt = new Date(Date.UTC(year, month, 1));

    // マイページ: UserBetのみ
    const userBets = await prisma.userBet.findMany({
        where: { userId, raceDate: { gte, lt } },
        select: { raceDate: true, betAmount: true, hitAmount: true, isSettled: true },
    });

    const dayMap = new Map<string, { inv: number; ref: number; count: number }>();

    for (const bet of userBets) {
        if (!bet.raceDate) continue;
        const dateStr = bet.raceDate.toISOString().slice(0, 10);
        const entry = dayMap.get(dateStr) || { inv: 0, ref: 0, count: 0 };
        entry.inv += bet.betAmount || 0;
        if (bet.isSettled) entry.ref += bet.hitAmount || 0;
        entry.count++;
        dayMap.set(dateStr, entry);
    }

    return Array.from(dayMap.entries())
        .map(([date, d]) => ({ date, investment: d.inv, refund: d.ref, pnl: d.ref - d.inv, predictions: d.count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 指定年の月別収支サマリーを返す（1月〜12月の12件、予想がない月も0で含める）
 */
export async function getUserMonthlyPnL(
    userId: string,
    year: number
): Promise<MonthlyPnL[]> {
    const gte = new Date(Date.UTC(year, 0, 1));
    const lt = new Date(Date.UTC(year + 1, 0, 1));

    const predictions = await prisma.prediction.findMany({
        where: {
            authorId: userId,
            raceDate: { gte, lt },
        },
        select: {
            raceDate: true,
            betAmount: true,
            hitAmount: true,
            refundAmount: true,
            isSettled: true,
        },
    });

    const monthMap = new Map<string, { inv: number; ref: number; count: number }>();

    for (const pred of predictions) {
        const d = pred.raceDate;
        const monthStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        const entry = monthMap.get(monthStr) || { inv: 0, ref: 0, count: 0 };
        entry.inv += pred.betAmount || 0;
        if (pred.isSettled) {
            entry.ref += (pred.hitAmount || 0) + (pred.refundAmount || 0);
        }
        entry.count++;
        monthMap.set(monthStr, entry);
    }

    // Always return 12 months
    return Array.from({ length: 12 }, (_, i) => {
        const m = String(i + 1).padStart(2, "0");
        const monthStr = `${year}-${m}`;
        const d = monthMap.get(monthStr) || { inv: 0, ref: 0, count: 0 };
        return {
            month: monthStr,
            investment: d.inv,
            refund: d.ref,
            pnl: d.ref - d.inv,
            predictions: d.count,
        };
    });
}
