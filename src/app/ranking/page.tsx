import { prisma } from "@/lib/prisma";
import { Formation } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Target } from "lucide-react";

interface RankUser {
    id: string;
    name: string;
    totalPredictions: number;
    recoveryRate: number;
    hitRate: number;
}

export const revalidate = 60;

export default async function RankingPage() {
    const users = await prisma.user.findMany({
        select: { id: true, name: true }
    });

    const predictions = await prisma.prediction.findMany({
        where: { resultChecked: true },
        select: { authorId: true, predictedNumbers: true, isHit: true, refundAmount: true }
    });

    const userStatsMap = new Map<string, { totalInvestment: number, totalRefund: number, hits: number, count: number }>();

    for (const pred of predictions) {
        if (!userStatsMap.has(pred.authorId)) {
            userStatsMap.set(pred.authorId, { totalInvestment: 0, totalRefund: 0, hits: 0, count: 0 });
        }

        const stats = userStatsMap.get(pred.authorId)!;
        stats.count += 1;

        if (pred.isHit) {
            stats.hits += 1;
        }
        stats.totalRefund += pred.refundAmount;

        try {
            const formations: Formation[] = parseJsonSafely<Formation[]>(pred.predictedNumbers);
            const investment = formations.reduce((sum, f) => sum + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);
            stats.totalInvestment += investment;
        } catch (e) {
            // Ignore parse errors
        }
    }

    const rankedUsers: RankUser[] = [];

    for (const user of users) {
        const stats = userStatsMap.get(user.id);
        if (stats && stats.count >= 5) {
            const recoveryRate = stats.totalInvestment > 0 ? (stats.totalRefund / stats.totalInvestment) * 100 : 0;
            const hitRate = (stats.hits / stats.count) * 100;

            rankedUsers.push({
                id: user.id,
                name: user.name || "Unknown",
                totalPredictions: stats.count,
                recoveryRate,
                hitRate,
            });
        }
    }

    const recoveryRanking = [...rankedUsers].sort((a, b) => b.recoveryRate - a.recoveryRate);
    const hitRateRanking = [...rankedUsers].sort((a, b) => b.hitRate - a.hitRate);

    const renderRankingList = (list: RankUser[], type: 'recovery' | 'hit') => {
        if (list.length === 0) {
            return (
                <div className="text-center py-16 px-4">
                    <Trophy className="w-10 h-10 mx-auto text-[#e5edf5] mb-3" />
                    <p className="text-[#64748d] font-semibold mb-1">ランキング集計中</p>
                    <p className="text-xs text-[#64748d]">判定済みの予想が5レース以上あるユーザーが表示されます</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-2">
                {list.map((user, index) => {
                    const medalColors = [
                        "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
                        "bg-[#f6f8fa] text-[#64748d] ring-1 ring-[#e5edf5]",
                        "bg-orange-50 text-orange-500 ring-1 ring-orange-200",
                    ];
                    const medalColor = index < 3 ? medalColors[index] : "bg-[#f6f8fa] text-[#64748d]";

                    const valueStr = type === 'recovery'
                        ? `${user.recoveryRate.toFixed(1)}%`
                        : `${user.hitRate.toFixed(1)}%`;

                    return (
                        <Link href={`/users/${user.id}`} key={user.id}>
                            <div className={`bg-white border rounded-lg p-4 flex items-center justify-between transition-colors hover:border-[#b9b9f9] ${index === 0 ? 'border-amber-200 shadow-sm' : 'border-[#e5edf5]'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm ${medalColor}`}>
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[#061b31] text-[15px]">{user.name}</p>
                                        <p className="text-[11px] text-[#64748d] font-medium">{user.totalPredictions}R 判定済み</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-light tabular-nums ${type === 'recovery' && user.recoveryRate >= 100 ? 'text-[#533afd]' : 'text-[#061b31]'}`}>
                                        {valueStr}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Header */}
            <div className="bg-[#1c1e54] text-white px-5 pt-7 pb-10">
                <h1 className="text-xl font-light mb-1 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    ランキング
                </h1>
                <p className="text-sm text-slate-400">
                    実績5R以上の予想家ランキング
                </p>
            </div>

            <div className="px-4 -mt-4 relative z-10">
                <Tabs defaultValue="recovery" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4 h-11 bg-white shadow-sm border border-[#e5edf5] rounded-lg p-1">
                        <TabsTrigger value="recovery" className="font-semibold text-sm data-[state=active]:bg-[#533afd] data-[state=active]:text-white rounded-md transition-all">
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                            回収率
                        </TabsTrigger>
                        <TabsTrigger value="hit" className="font-semibold text-sm data-[state=active]:bg-[#533afd] data-[state=active]:text-white rounded-md transition-all">
                            <Target className="w-3.5 h-3.5 mr-1.5" />
                            的中率
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recovery" className="mt-0">
                        {renderRankingList(recoveryRanking, 'recovery')}
                    </TabsContent>

                    <TabsContent value="hit" className="mt-0">
                        {renderRankingList(hitRateRanking, 'hit')}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
