import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trophy, TrendingUp, Coins } from "lucide-react";
import { RankingClient } from "@/components/ranking/RankingClient";
import { VENUES } from "@/lib/constants/venues";

export const revalidate = 60;

interface RankEntry {
    id: string;
    name: string;
    role: string;
    value: number;
    sub: string;
}

export default async function RankingPage() {
    // 公開予想(isPrivate: false)のみで集計
    const predictions = await prisma.prediction.findMany({
        where: { isSettled: true, isPrivate: false },
        select: { authorId: true, placeName: true, betAmount: true, hitAmount: true, refundAmount: true, isHit: true, raceDate: true },
    });

    // 獲得pt: transactionsのSELL_PREDICTIONを集計
    const sellTransactions = await prisma.transaction.findMany({
        where: { action: "SELL_PREDICTION" },
        select: { userId: true, points: true, createdAt: true },
    });

    const users = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
    });
    const userNameMap = new Map(users.map(u => [u.id, u.name || "Unknown"]));
    const userRoleMap = new Map(users.map(u => [u.id, u.role]));

    // --- 回収率ランキング（全場+各場） ---
    function buildRecoveryRanking(preds: typeof predictions): RankEntry[] {
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
            if (stats.count < 3) continue;
            ranking.push({
                id: userId,
                name: userNameMap.get(userId) || "Unknown",
            role: userRoleMap.get(userId) || "BUYER",
                value: stats.inv > 0 ? (stats.ref / stats.inv) * 100 : 0,
                sub: `${stats.count}R`,
            });
        }
        return ranking.sort((a, b) => b.value - a.value);
    }

    // 全場
    const recoveryAll = buildRecoveryRanking(predictions);

    // 全24場（データがない場も空配列で含める）
    const recoveryByVenue: { [venue: string]: RankEntry[] } = {};
    for (const venue of VENUES) {
        const venuePreds = predictions.filter(p => p.placeName === venue.name);
        recoveryByVenue[venue.name] = buildRecoveryRanking(venuePreds);
    }

    // --- 獲得ptランキング(通算) ---
    const ptAllMap = new Map<string, number>();
    for (const tx of sellTransactions) {
        ptAllMap.set(tx.userId, (ptAllMap.get(tx.userId) || 0) + tx.points);
    }

    const ptAllRanking: RankEntry[] = [];
    for (const [userId, pts] of ptAllMap) {
        ptAllRanking.push({
            id: userId,
            name: userNameMap.get(userId) || "Unknown",
            role: userRoleMap.get(userId) || "BUYER",
            value: pts,
            sub: "通算",
        });
    }
    ptAllRanking.sort((a, b) => b.value - a.value);

    // --- 獲得ptランキング(今月) ---
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

    const ptMonthMap = new Map<string, number>();
    for (const tx of sellTransactions) {
        if (tx.createdAt >= monthStart && tx.createdAt < monthEnd) {
            ptMonthMap.set(tx.userId, (ptMonthMap.get(tx.userId) || 0) + tx.points);
        }
    }

    const ptMonthRanking: RankEntry[] = [];
    for (const [userId, pts] of ptMonthMap) {
        ptMonthRanking.push({
            id: userId,
            name: userNameMap.get(userId) || "Unknown",
            role: userRoleMap.get(userId) || "BUYER",
            value: pts,
            sub: `${now.getMonth() + 1}月`,
        });
    }
    ptMonthRanking.sort((a, b) => b.value - a.value);

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
                    recoveryByVenue={recoveryByVenue}
                    ptAllRanking={ptAllRanking}
                    ptMonthRanking={ptMonthRanking}
                    currentMonth={now.getMonth() + 1}
                />
            </div>
        </div>
    );
}
