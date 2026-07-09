import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MarketTabs } from "@/components/market/MarketTabs";
import { ReloadButton } from "@/components/ReloadButton";
import { A8Banner } from "@/components/ads/A8Banner";
import { A8_BANNER_BOTTOM } from "@/components/ads/A8BannerConfig";

export const revalidate = 0;

export default async function MarketPage() {
    const session = await auth();
    const userId = session?.user?.id;

    // アンロック制のコンテンツ（見解本文・買い目）は一覧のクライアント送信データに含めない
    const toTimelineCard = <T extends { commentary: string | null; analysisComment: string | null; predictedNumbers: unknown }>(p: T) => {
        const { commentary, analysisComment, predictedNumbers, ...rest } = p;
        return { ...rest, hasCommentary: !!commentary?.trim() };
    };

    // internal + external の公開予想（締切前のみ）
    const now = new Date();
    const allPredictions = await prisma.prediction.findMany({
        where: { isPrivate: false, deadlineAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
            author: { select: { name: true, role: true } },
            _count: { select: { transactions: { where: { action: { in: ["BUY_PREDICTION", "SUBSCRIBER_UNLOCK"] } } } } },
        }
    });

    let followingPredictions: typeof allPredictions = [];
    let followingIds: string[] = [];

    if (userId) {
        const follows = await prisma.follows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });

        followingIds = follows.map(f => f.followingId);

        if (followingIds.length > 0) {
            followingPredictions = await prisma.prediction.findMany({
                where: { authorId: { in: followingIds }, isPrivate: false, deadlineAt: { gt: now } },
                orderBy: { createdAt: 'desc' },
                take: 30,
                include: {
                    author: { select: { name: true, role: true } },
                    _count: { select: { transactions: { where: { action: { in: ["BUY_PREDICTION", "SUBSCRIBER_UNLOCK"] } } } } },
                }
            });
        }
    }

    return (
        <div className="min-h-full pb-20">
            <div className="bg-white border-b border-[#e5edf5] px-4 pt-5 pb-2 sticky top-0 z-40">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-light text-[#061b31]">マーケット</h1>
                    <ReloadButton className="text-[#64748d]" />
                </div>

                <MarketTabs
                    allPredictions={allPredictions.map(toTimelineCard)}
                    followingPredictions={followingPredictions.map(toTimelineCard)}
                    userId={userId}
                    followingIds={followingIds}
                />
            </div>

            {/* A8 広告バナー */}
            <A8Banner {...A8_BANNER_BOTTOM} />
        </div>
    );
}
