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

export const revalidate = 60; // Cache for 60 seconds

export default async function RankingPage() {
    // 1. Fetch all users
    const users = await prisma.user.findMany({
        select: { id: true, name: true }
    });

    // 2. Fetch all checked predictions
    const predictions = await prisma.prediction.findMany({
        where: { resultChecked: true },
        select: { authorId: true, predictedNumbers: true, isHit: true, refundAmount: true }
    });

    // 3. Aggregate stats per user
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

    // 4. Calculate Final Metrics & Apply Threshold (>= 5 predictions)
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

    // 5. Sort lists
    const recoveryRanking = [...rankedUsers].sort((a, b) => b.recoveryRate - a.recoveryRate);
    const hitRateRanking = [...rankedUsers].sort((a, b) => b.hitRate - a.hitRate);

    const renderRankingList = (list: RankUser[], type: 'recovery' | 'hit') => {
        if (list.length === 0) {
            return (
                <div className="text-center py-12 px-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Trophy className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-500 font-bold mb-1">ランキング集計中</p>
                    <p className="text-xs text-slate-400">判定済みの予想が5レース以上あるユーザーが表示されます。</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-3">
                {list.map((user, index) => {
                    const isTop3 = index < 3;
                    const medalColors = ["text-yellow-400 bg-yellow-50", "text-slate-400 bg-slate-100", "text-amber-600 bg-amber-50"];
                    const medalColor = index < 3 ? medalColors[index] : "text-slate-500 bg-slate-50";

                    const valueStr = type === 'recovery'
                        ? `${user.recoveryRate.toFixed(1)}%`
                        : `${user.hitRate.toFixed(1)}%`;

                    return (
                        <Link href={`/users/${user.id}`} key={user.id}>
                            <Card className={`relative overflow-hidden transition-all hover:scale-[1.02] border-0 shadow-sm ${index === 0 ? 'ring-2 ring-yellow-400 shadow-yellow-100' : 'bg-white'}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shadow-sm ${medalColor}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-slate-800">{user.name}</p>
                                            <p className="text-xs text-slate-400 font-semibold">{user.totalPredictions} Races Evaluated</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-0.5">
                                            {type === 'recovery' ? 'Recovery' : 'Hit Rate'}
                                        </p>
                                        <p className={`text-xl font-black ${type === 'recovery' && user.recoveryRate >= 100 ? 'text-red-500' : 'text-slate-700'}`}>
                                            {valueStr}
                                        </p>
                                    </div>
                                </CardContent>
                                {index === 0 && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-10 rotate-45 transform translate-x-8 -translate-y-8" />
                                )}
                            </Card>
                        </Link>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header section */}
            <div className="bg-slate-900 text-white p-6 pb-12 rounded-b-3xl shadow-lg">
                <div className="max-w-md mx-auto pt-2">
                    <h1 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Top Investors Ranking
                    </h1>
                    <p className="text-sm text-slate-400 font-medium">
                        BOAT BANK で最も結果を出している予想家ランキング。実績（5R以上）のある猛者のみが名を連ねます。
                    </p>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
                <Tabs defaultValue="recovery" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-white shadow-sm border border-slate-100 rounded-xl">
                        <TabsTrigger value="recovery" className="font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg transition-all">
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                            回収率ランキング
                        </TabsTrigger>
                        <TabsTrigger value="hit" className="font-bold text-xs data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-lg transition-all">
                            <Target className="w-3.5 h-3.5 mr-1.5" />
                            的中率ランキング
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
