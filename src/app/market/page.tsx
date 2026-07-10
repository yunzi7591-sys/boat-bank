import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MarketTabs } from "@/components/market/MarketTabs";
import { ReloadButton } from "@/components/ReloadButton";

export const revalidate = 0;

export const metadata = {
    title: "予想マーケット | BOAT BANK",
    description: "本日の競艇（ボートレース）予想一覧。無料予想・pt予想を毎日更新。回収率を公開している予想家のガチ予想をチェック。",
    alternates: { canonical: "https://boatbank.jp/market" },
};

export default async function MarketPage() {
    const session = await auth();
    const userId = session?.user?.id;

    // 一覧に見解本文・買い目は不要なため送らない（見解の有無だけ hasCommentary で渡す）
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

        </div>
    );
}
