import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineCard } from "@/components/market/TimelineCard";
import { Globe, Users } from "lucide-react";

export const revalidate = 0;

export default async function MarketPage() {
    const session = await auth();
    const userId = session?.user?.id;

    const allPredictions = await prisma.prediction.findMany({
        where: { isPrivate: false, publishType: "internal" },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            author: { select: { name: true } },
            _count: { select: { transactions: { where: { action: "BUY_PREDICTION" } } } },
        }
    });

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
                where: { authorId: { in: followingIds }, isPrivate: false, publishType: "internal" },
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    author: { select: { name: true } },
                    _count: { select: { transactions: { where: { action: "BUY_PREDICTION" } } } },
                }
            });
        }
    }

    return (
        <div className="min-h-full pb-20">
            <div className="bg-white border-b border-[#e5edf5] px-4 pt-5 pb-2 sticky top-[56px] z-40">
                <h1 className="text-xl font-light text-[#061b31] mb-4">マーケット</h1>

                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="w-full h-10 bg-[#f6f8fa] p-1 rounded-lg">
                        <TabsTrigger
                            value="all"
                            className="w-full data-[state=active]:bg-white data-[state=active]:text-[#533afd] data-[state=active]:shadow-sm rounded-md font-semibold text-sm text-[#64748d]"
                        >
                            <Globe className="w-3.5 h-3.5 mr-1.5" />
                            全員
                        </TabsTrigger>
                        <TabsTrigger
                            value="following"
                            className="w-full data-[state=active]:bg-white data-[state=active]:text-[#533afd] data-[state=active]:shadow-sm rounded-md font-semibold text-sm text-[#64748d]"
                            disabled={!userId}
                        >
                            <Users className="w-3.5 h-3.5 mr-1.5" />
                            フォロー中
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="all" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                            {allPredictions.length === 0 ? (
                                <div className="py-16 text-center text-[#64748d]">
                                    <p className="font-semibold">フィードがありません</p>
                                </div>
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
                                <div className="py-16 text-center text-[#64748d]">ログインしてフォロー機能を利用する</div>
                            ) : followingPredictions.length === 0 ? (
                                <div className="py-16 text-center text-[#64748d]">
                                    <p className="font-semibold text-[#061b31] mb-1">フィードが空です</p>
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
