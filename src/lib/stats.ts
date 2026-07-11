import { prisma } from "@/lib/prisma";
import { Formation, normalizeCombo } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";
import { VENUES } from "@/lib/constants/venues";

export interface UserStats {
    totalInvestment: number;
    totalRefund: number;
    recoveryRate: number;
    hitCount: number;
    totalPredictions: number;
    /** 1Rあたりの平均買い目点数（買い目のある予想が無い場合は null） */
    avgCombosPerRace: number | null;
    /** 的中した買い目の平均オッズ（的中が無い場合は null） */
    avgHitOdds: number | null;
}

export interface VenueStats {
    placeName: string;
    totalInvestment: number;
    totalRefund: number;
    recoveryRate: number;
    hitCount: number;
    totalPredictions: number;
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
            predictedNumbers: true,
            placeName: true,
            raceNumber: true,
            raceDate: true,
        },
    });

    let totalInvestment = 0;
    let totalRefund = 0;
    let hitCount = 0;
    const totalPredictions = predictions.length;

    // 1Rあたりの平均買い目点数
    let combosTotal = 0;
    let combosRaces = 0;

    for (const pred of predictions) {
        totalInvestment += pred.betAmount || 0;
        if (pred.isSettled) {
            totalRefund += (pred.hitAmount || 0) + (pred.refundAmount || 0);
            if (pred.isHit) hitCount++;
        }
        try {
            const formations = parseJsonSafely<Formation[]>(pred.predictedNumbers);
            const count = formations.reduce((sum, f) => sum + (f.combinations?.length || 0), 0);
            if (count > 0) {
                combosTotal += count;
                combosRaces++;
            }
        } catch { }
    }

    // 平均的中オッズ: 的中予想のレース結果（払戻）と買い目を突き合わせて算出
    const hitPredictions = predictions.filter(p => p.isSettled && p.isHit);
    let avgHitOdds: number | null = null;
    if (hitPredictions.length > 0) {
        const results = await prisma.raceResult.findMany({
            where: {
                OR: hitPredictions.map(p => ({
                    placeName: p.placeName,
                    raceNumber: p.raceNumber,
                    raceDate: p.raceDate,
                })),
            },
            select: { placeName: true, raceNumber: true, raceDate: true, payouts: true },
        });
        const resultMap = new Map(
            results.map(r => [`${r.placeName}-${r.raceNumber}-${r.raceDate.getTime()}`, r]),
        );

        const hitOddsList: number[] = [];
        for (const pred of hitPredictions) {
            const result = resultMap.get(`${pred.placeName}-${pred.raceNumber}-${pred.raceDate.getTime()}`);
            if (!result?.payouts) continue;
            try {
                const payouts = (typeof result.payouts === "string" ? JSON.parse(result.payouts) : result.payouts) as { type: string; numbers: string; amount: number }[];
                const formations = parseJsonSafely<Formation[]>(pred.predictedNumbers);
                for (const f of formations) {
                    const officialPayouts = payouts.filter(p => p.type === f.betType);
                    for (const c of f.combinations || []) {
                        for (const op of officialPayouts) {
                            if (normalizeCombo(c.id, f.betType) === normalizeCombo(op.numbers, f.betType)) {
                                hitOddsList.push(op.amount / 100); // 100円あたり払戻 → 倍率
                            }
                        }
                    }
                }
            } catch { }
        }
        if (hitOddsList.length > 0) {
            avgHitOdds = hitOddsList.reduce((a, b) => a + b, 0) / hitOddsList.length;
        }
    }

    const recoveryRate = totalInvestment > 0 ? (totalRefund / totalInvestment) * 100 : 0;

    return {
        totalInvestment,
        totalRefund,
        recoveryRate,
        hitCount,
        totalPredictions,
        avgCombosPerRace: combosRaces > 0 ? combosTotal / combosRaces : null,
        avgHitOdds,
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
            refundAmount: true,
        },
    });

    let totalInvestment = 0;
    let totalRefund = 0;

    const raceMap = new Map<string, { settled: boolean; hit: boolean }>();
    // 的中した買い目のオッズ（払戻 ÷ 賭け金）。返還は除外
    const hitOddsList: number[] = [];

    for (const bet of userBets) {
        totalInvestment += bet.betAmount || 0;
        if (bet.isSettled) {
            totalRefund += (bet.hitAmount || 0) + (bet.refundAmount || 0);
            if (bet.isHit && (bet.betAmount || 0) > 0 && (bet.hitAmount || 0) > 0) {
                hitOddsList.push((bet.hitAmount || 0) / (bet.betAmount || 1));
            }
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
        // 1行 = 1買い目なので、レース数で割れば1Rあたりの平均買い目点数になる
        avgCombosPerRace: totalPredictions > 0 ? userBets.length / totalPredictions : null,
        avgHitOdds: hitOddsList.length > 0 ? hitOddsList.reduce((a, b) => a + b, 0) / hitOddsList.length : null,
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
 * マイページ用: UserBet ベース
 */
/**
 * マイページ用: 1クエリで全UserBetを取得し、通算/年/月別に分割
 */
export type RaceType = "morning" | "day" | "nighter" | "midnight";

const RACE_TYPES: RaceType[] = ["morning", "day", "nighter", "midnight"];

function classifyRaceType(deadlineAt: Date): RaceType {
    const hour = deadlineAt.getUTCHours() + 9;
    const adjustedHour = hour >= 24 ? hour - 24 : hour;
    const minutes = deadlineAt.getUTCMinutes();
    const timeInMinutes = adjustedHour * 60 + minutes;

    if (timeInMinutes <= 540) return "morning";       // 〜9:00
    if (timeInMinutes <= 780) return "day";            // 〜13:00
    if (timeInMinutes <= 960) return "nighter";        // 〜16:00
    return "midnight";                                 // 16:00〜
}

async function buildRaceTypeMap(placeNameDates: { placeName: string; raceDate: Date }[]): Promise<Map<string, RaceType>> {
    if (placeNameDates.length === 0) return new Map();

    const schedules = await prisma.raceSchedule.findMany({
        where: { raceNumber: 1 },
        select: { placeName: true, raceDate: true, deadlineAt: true },
    });

    const raceTypeMap = new Map<string, RaceType>();
    for (const s of schedules) {
        raceTypeMap.set(`${s.placeName}|${s.raceDate.toISOString()}`, classifyRaceType(s.deadlineAt));
    }
    return raceTypeMap;
}

export type PeriodStats = {
    all: VenueStatsWithPeriod[];
    year: VenueStatsWithPeriod[];
    monthly: { [key: string]: VenueStatsWithPeriod[] };
};

// --- グレード別 + 開催形態別 統計 (組み合わせ自由) ---

// グレードの並び順（フィルタ表示順）
export const GRADE_VALUES = ["一般", "G1", "G2", "G3", "SG"] as const;
export type Grade = (typeof GRADE_VALUES)[number];

/**
 * 1レース分の集計を最小単位（会場×開催形態×グレード×月）にまとめたもの。
 * クライアント側でこれを期間・開催形態・グレードで自由に絞って24場に再集計する。
 */
export interface StatsLeaf {
    venueId: string;
    placeName: string;
    raceType: RaceType | null; // 解決できない場合 null
    grade: Grade | null;       // 解決できない場合 null
    ym: string;                // "2026-05"
    inv: number;               // 投資額
    ref: number;               // 回収額
    hit: number;               // 的中数
    total: number;             // 件数
}

const NAME_TO_VENUE_ID = new Map(VENUES.map((v) => [v.name, v.id]));

// レースの平均間隔（約30分）。残りレースが1本しかないときの1R締切推定に使う。
const AVG_RACE_INTERVAL_MS = 30 * 60 * 1000;

/**
 * その日・その場に残っているレース群から「1R相当の締切時刻」を推定し、開催形態を分類する。
 *
 * 開催形態は本来1R（一番早いレース）の締切時刻で決まるが、cleanup-unused-races で
 * 使われていないR1が消えることがある。その場合に残った最小Rの締切をそのまま使うと、
 * 本来より遅い時刻になり、ナイターがミッドナイトに誤分類される。
 * そこで、残ったレースの締切間隔から1R相当の締切を逆算して分類する。
 * - R1が残っていればそのまま
 * - 2レース以上残っていれば実測間隔で外挿（正確）
 * - 1レースしか残っていなければ平均間隔でフォールバック
 */
function classifyOpeningType(races: { raceNumber: number; deadlineAt: Date }[]): RaceType {
    let min = races[0];
    let max = races[0];
    for (const r of races) {
        if (r.raceNumber < min.raceNumber) min = r;
        if (r.raceNumber > max.raceNumber) max = r;
    }

    let r1Deadline: Date;
    if (min.raceNumber === 1) {
        r1Deadline = min.deadlineAt;
    } else if (max.raceNumber > min.raceNumber) {
        // 実測間隔 = (最遅締切 - 最早締切) / (Rの差)。これで1R締切を逆算。
        const interval = (max.deadlineAt.getTime() - min.deadlineAt.getTime()) / (max.raceNumber - min.raceNumber);
        r1Deadline = new Date(min.deadlineAt.getTime() - (min.raceNumber - 1) * interval);
    } else {
        // 残り1本のみ: 平均間隔で近似
        r1Deadline = new Date(min.deadlineAt.getTime() - (min.raceNumber - 1) * AVG_RACE_INTERVAL_MS);
    }

    return classifyRaceType(r1Deadline);
}

/**
 * RaceSchedule から (placeName|raceDateISO) → grade / raceType のマップを作る。
 * グレードは「その日のその場」共通なので任意のレースから取得。
 * 開催形態(raceType)は、その日・その場に残るレース群から1R締切を推定して分類する。
 */
async function buildScheduleMaps(): Promise<{
    gradeMap: Map<string, Grade>;
    raceTypeMap: Map<string, RaceType>;
}> {
    const schedules = await prisma.raceSchedule.findMany({
        select: { placeName: true, raceDate: true, raceNumber: true, deadlineAt: true, grade: true },
    });

    const gradeMap = new Map<string, Grade>();
    // (placeName|raceDate) ごとに残っているレースを集約する
    const racesByKey = new Map<string, { raceNumber: number; deadlineAt: Date }[]>();

    const validGrades = new Set<string>(GRADE_VALUES);

    for (const s of schedules) {
        const key = `${s.placeName}|${s.raceDate.toISOString()}`;

        if (s.grade && validGrades.has(s.grade) && !gradeMap.has(key)) {
            gradeMap.set(key, s.grade as Grade);
        }

        const arr = racesByKey.get(key) ?? [];
        arr.push({ raceNumber: s.raceNumber, deadlineAt: s.deadlineAt });
        racesByKey.set(key, arr);
    }

    const raceTypeMap = new Map<string, RaceType>();
    for (const [key, races] of racesByKey) {
        raceTypeMap.set(key, classifyOpeningType(races));
    }

    return { gradeMap, raceTypeMap };
}

interface RaceRow {
    placeName: string | null;
    raceDate: Date | null;
    inv: number;
    ref: number;
    settled: boolean;
    hit: boolean;
}

function buildLeaves(
    rows: RaceRow[],
    gradeMap: Map<string, Grade>,
    raceTypeMap: Map<string, RaceType>
): StatsLeaf[] {
    const leafMap = new Map<string, StatsLeaf>();

    for (const r of rows) {
        if (!r.placeName || !r.raceDate) continue;
        const venueId = NAME_TO_VENUE_ID.get(r.placeName);
        if (!venueId) continue;

        const key = `${r.placeName}|${r.raceDate.toISOString()}`;
        const grade = gradeMap.get(key) ?? null;
        const raceType = raceTypeMap.get(key) ?? null;
        const ym = `${r.raceDate.getUTCFullYear()}-${String(r.raceDate.getUTCMonth() + 1).padStart(2, "0")}`;

        const leafKey = `${venueId}|${raceType ?? "?"}|${grade ?? "?"}|${ym}`;
        const leaf = leafMap.get(leafKey) ?? {
            venueId,
            placeName: r.placeName,
            raceType,
            grade,
            ym,
            inv: 0,
            ref: 0,
            hit: 0,
            total: 0,
        };
        leaf.inv += r.inv;
        leaf.total++;
        if (r.settled) {
            leaf.ref += r.ref;
            if (r.hit) leaf.hit++;
        }
        leafMap.set(leafKey, leaf);
    }

    return Array.from(leafMap.values());
}

/**
 * マイページ用（UserBetベース）: 開催形態×グレードで自由集計するための葉データ
 */
export async function getPrivateStatsLeaves(userId: string): Promise<StatsLeaf[]> {
    const [userBets, maps] = await Promise.all([
        prisma.userBet.findMany({
            where: { userId },
            select: { placeName: true, raceDate: true, betAmount: true, hitAmount: true, refundAmount: true, isSettled: true, isHit: true },
        }),
        buildScheduleMaps(),
    ]);

    const rows: RaceRow[] = userBets.map((b) => ({
        placeName: b.placeName,
        raceDate: b.raceDate,
        inv: b.betAmount || 0,
        ref: (b.hitAmount || 0) + (b.refundAmount || 0),
        settled: b.isSettled,
        hit: b.isHit,
    }));

    return buildLeaves(rows, maps.gradeMap, maps.raceTypeMap);
}

/**
 * サブスク未加入者向けのプレビュー用ダミーデータ。
 * ぼかし表示の背景としてグリッドを成立させるためだけのサンプル値であり、
 * 実ユーザーの成績は一切含めない（タダ見え対策）。
 */
export function buildSampleStatsLeaves(year: number): StatsLeaf[] {
    const samples: Array<{ inv: number; ref: number; hit: number; total: number }> = [
        { inv: 48000, ref: 52800, hit: 7, total: 22 },
        { inv: 36000, ref: 29500, hit: 5, total: 18 },
        { inv: 54000, ref: 61200, hit: 9, total: 25 },
        { inv: 30000, ref: 24000, hit: 4, total: 15 },
        { inv: 42000, ref: 45600, hit: 6, total: 20 },
        { inv: 27000, ref: 21300, hit: 3, total: 12 },
        { inv: 60000, ref: 70800, hit: 11, total: 28 },
        { inv: 33000, ref: 28900, hit: 5, total: 16 },
    ];
    const ym = `${year}-01`;
    return VENUES.slice(0, samples.length).map((v, i) => ({
        venueId: v.id,
        placeName: v.name,
        raceType: null,
        grade: null,
        ym,
        ...samples[i],
    }));
}

/**
 * 公開プロフィール用（Predictionベース）: 開催形態×グレードで自由集計するための葉データ
 */
export async function getPublicStatsLeaves(userId: string): Promise<StatsLeaf[]> {
    const [predictions, maps] = await Promise.all([
        prisma.prediction.findMany({
            where: { authorId: userId, isPrivate: false },
            select: { placeName: true, raceDate: true, betAmount: true, hitAmount: true, refundAmount: true, isSettled: true, isHit: true },
        }),
        buildScheduleMaps(),
    ]);

    const rows: RaceRow[] = predictions.map((p) => ({
        placeName: p.placeName,
        raceDate: p.raceDate,
        inv: p.betAmount || 0,
        ref: (p.hitAmount || 0) + (p.refundAmount || 0),
        settled: p.isSettled,
        hit: p.isHit,
    }));

    return buildLeaves(rows, maps.gradeMap, maps.raceTypeMap);
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
        select: { raceDate: true, betAmount: true, hitAmount: true, refundAmount: true, isSettled: true },
    });

    const dayMap = new Map<string, { inv: number; ref: number; count: number }>();

    for (const bet of userBets) {
        if (!bet.raceDate) continue;
        const dateStr = bet.raceDate.toISOString().slice(0, 10);
        const entry = dayMap.get(dateStr) || { inv: 0, ref: 0, count: 0 };
        entry.inv += bet.betAmount || 0;
        if (bet.isSettled) entry.ref += (bet.hitAmount || 0) + (bet.refundAmount || 0);
        entry.count++;
        dayMap.set(dateStr, entry);
    }

    return Array.from(dayMap.entries())
        .map(([date, d]) => ({ date, investment: d.inv, refund: d.ref, pnl: d.ref - d.inv, predictions: d.count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

