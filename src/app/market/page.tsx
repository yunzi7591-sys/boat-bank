import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineCard } from "@/components/market/TimelineCard";
import { Globe, Users } from "lucide-react";

export const revalidate = 0; // Always fresh feed

export default async function MarketPage() {
    const session = await auth();
    const userId = session?.user?.id;

    // 1. Fetch Global Timeline
    const allPredictions = await prisma.prediction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { author: { select: { name: true } } }
    });

    // 2. Fetch Following Timeline
    let followingPredictions: typeof allPredictions = [];
    let followingSet = new Set<string>();

    if (userId) {
        const follows = await prisma.follows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        const followingIds = follows.map(f => f.followingId);
        followingIds.forEach(id => followingSet.add(id));

        if (followingIds.length > 0) {
            followingPredictions = await prisma.prediction.findMany({
                where: { authorId: { in: followingIds } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { author: { select: { name: true } } }
            });
        }
    }

    return (
        <div className="min-h-full bg-slate-50 pb-20">

            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-4 pt-6 pb-2 sticky top-[64px] z-40">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Market</h1>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="w-full h-11 bg-slate-100/80 p-1 rounded-xl">
                        <TabsTrigger
                            value="all"
                            className="w-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg font-bold text-slate-500"
                        >
                            <Globe className="w-4 h-4 mr-2" />
                            全員
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="w-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg font-bold text-slate-500"
                            disabled={!userId}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            フォロー中
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="all" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                            {allPredictions.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">フィードがありません</div>
                            ) : (
                                allPredictions.map(pred => (
                                    <TimelineCard
                                        key={pred.id}
                                        prediction={pred}
                                        currentUserId={userId}
                                        isFollowingAuthor={userId ? followingSet.has(pred.authorId) : false}
                                    />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="following" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                            {!userId ? (
                                <div className="py-12 text-center text-slate-400">ログインしてフォロー機能を利用する</div>
                            ) : followingPredictions.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <p className="font-bold text-slate-600 mb-2">フィードが空です</p>
                                    <p className="text-sm">お気に入りの予想家をフォローしましょう</p>
                                </div>
                            ) : (
                                followingPredictions.map(pred => (
                                    <TimelineCard
                                        key={pred.id}
                                        prediction={pred}
                                        currentUserId={userId}
                                        isFollowingAuthor={true}
                                    />
                                ))
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

        </div>
    );
}
