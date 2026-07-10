import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { Trophy, TrendingUp, Coins } from "lucide-react";
import { RankingClient } from "@/components/ranking/RankingClient";
import { VENUES } from "@/lib/constants/venues";

export const revalidate = 60;

export const metadata = {
    title: "予想家ランキング | BOAT BANK",
    description: "競艇予想家の回収率・的中率ランキング。成績はすべて自動集計で公開。当たる予想家をフォローしてガチ予想を受け取ろう。",
    alternates: { canonical: "https://boatbank.jp/ranking" },
};

interface RankEntry {
    id: string;
    name: string;
    role: string;
    value: number;
    sub: string;
    races?: number;
}

// ログインユーザーに依存しない重い集計は60秒キャッシュする
const getRankingAggregation = unstable_cache(
    async () => {
        // 公開予想(isPrivate: false)のみで集計
        const [predictions, users] = await Promise.all([
            prisma.prediction.findMany({
                where: { isSettled: true, isPrivate: false },
                select: { authorId: true, placeName: true, betAmount: true, hitAmount: true, refundAmount: true, isHit: true, raceDate: true },
            }),
            prisma.user.findMany({
                select: { id: true, name: true, role: true },
            }),
        ]);
        const userNameMap = new Map(users.map(u => [u.id, u.name || "Unknown"]));
        const userRoleMap = new Map(users.map(u => [u.id, u.role]));

        // 当月の範囲（回収率・収支・獲得ptの当月集計で共通利用）
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
        const monthPredictions = predictions.filter(p => p.raceDate >= monthStart && p.raceDate < monthEnd);

        // --- 回収率ランキング（全場+各場） ---
        function buildRecoveryRanking(preds: typeof predictions, minRaces: number): RankEntry[] {
            const map = new Map<string, { inv: number; ref: number; count: number }>();
            for (const pred of preds) {
                const entry = map.get(pred.authorId) || { inv: 0, ref: 0, count: 0 };
                entry.inv += pred.betAmount || 0;
                entry.ref += pred.hitAmount || pred.refundAmount || 0;
                entry.count++;
                map.set(pred.authorId, entry);
            }
            const ranking: RankEntry[] = [];
            for (const [userId, stats] of map) {
                if (userRoleMap.get(userId) === 'ADMIN') continue; // 公式アカウントは除外
                if (stats.count < minRaces) continue;
                ranking.push({
                    id: userId,
                    name: userNameMap.get(userId) || "Unknown",
                role: userRoleMap.get(userId) || "BUYER",
                    value: stats.inv > 0 ? (stats.ref / stats.inv) * 100 : 0,
                    sub: `${stats.count}R`,
                    races: stats.count,
                });
            }
            return ranking.sort((a, b) => b.value - a.value);
        }

        // --- 収支ランキング（全場、回収額 - 投資額の合計） ---
        function buildBalanceRanking(preds: typeof predictions): RankEntry[] {
            const map = new Map<string, { balance: number; count: number }>();
            for (const pred of preds) {
                const entry = map.get(pred.authorId) || { balance: 0, count: 0 };
                entry.balance += (pred.hitAmount || pred.refundAmount || 0) - (pred.betAmount || 0);
                entry.count++;
                map.set(pred.authorId, entry);
            }
            const ranking: RankEntry[] = [];
            for (const [userId, stats] of map) {
                if (userRoleMap.get(userId) === 'ADMIN') continue; // 公式アカウントは除外
                if (stats.count < 10) continue;
                ranking.push({
                    id: userId,
                    name: userNameMap.get(userId) || "Unknown",
                    role: userRoleMap.get(userId) || "BUYER",
                    value: stats.balance,
                    sub: `${stats.count}R`,
                });
            }
            return ranking.sort((a, b) => b.value - a.value);
        }

        // 回収率: 最低10R以上で集計（10R/100Rの絞り込みはクライアント側のプルダウンで切替）
        const recoveryAll = buildRecoveryRanking(predictions, 10);
        const recoveryAllMonth = buildRecoveryRanking(monthPredictions, 10);
        const recoveryByVenue: { [venue: string]: RankEntry[] } = {};
        const recoveryByVenueMonth: { [venue: string]: RankEntry[] } = {};
        for (const venue of VENUES) {
            recoveryByVenue[venue.name] = buildRecoveryRanking(predictions.filter(p => p.placeName === venue.name), 10);
            recoveryByVenueMonth[venue.name] = buildRecoveryRanking(monthPredictions.filter(p => p.placeName === venue.name), 10);
        }

        // 収支: 全場 × 全期間・当月
        const balanceAll = buildBalanceRanking(predictions);
        const balanceAllMonth = buildBalanceRanking(monthPredictions);

        return {
            recoveryAll,
            recoveryAllMonth,
            recoveryByVenue,
            recoveryByVenueMonth,
            balanceAll,
            balanceAllMonth,
            currentMonth: now.getMonth() + 1,
        };
    },
    ["ranking-aggregation"],
    { revalidate: 60 },
);

export default async function RankingPage() {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const {
        recoveryAll,
        recoveryAllMonth,
        recoveryByVenue,
        recoveryByVenueMonth,
        balanceAll,
        balanceAllMonth,
        currentMonth,
    } = await getRankingAggregation();

    // --- イベントランキング（アクティブ優先、なければ最新の終了イベント）---
    let targetEvent = await prisma.event.findFirst({ where: { isActive: true } });
    if (!targetEvent) {
        targetEvent = await prisma.event.findFirst({ where: { isActive: false }, orderBy: { endDate: 'desc' } });
    }
    let eventRanking: RankEntry[] = [];
    let eventName = "";
    let eventEnded = false;
    if (targetEvent) {
        eventName = targetEvent.name;
        eventEnded = !targetEvent.isActive;
        const participants = await prisma.eventParticipant.findMany({
            where: { eventId: targetEvent.id },
            orderBy: { points: 'desc' },
            include: { user: { select: { name: true, role: true } } },
        });
        eventRanking = participants
            .filter(p => p.user.role !== 'ADMIN') // 公式アカウントは除外
            .map(p => ({
                id: p.userId,
                name: p.user.name || "Unknown",
                role: p.user.role,
                value: p.points,
                sub: eventName,
            }));
    }

    return (
        <div className="min-h-screen pb-24">
            <div className="bg-[#1c1e54] text-white px-5 pt-7 pb-10">
                <h1 className="text-xl font-light mb-1 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    ランキング
                </h1>
                <p className="text-sm text-slate-400">予想家の実績ランキング</p>
            </div>

            <div className="px-4 -mt-4 relative z-10">
                <RankingClient
                    recoveryAll={recoveryAll}
                    recoveryAllMonth={recoveryAllMonth}
                    recoveryByVenue={recoveryByVenue}
                    recoveryByVenueMonth={recoveryByVenueMonth}
                    balanceAll={balanceAll}
                    balanceAllMonth={balanceAllMonth}
                    currentMonth={currentMonth}
                    eventRanking={eventRanking}
                    eventName={eventName}
                    eventEnded={eventEnded}
                    currentUserId={currentUserId}
                />
            </div>

        </div>
    );
}
