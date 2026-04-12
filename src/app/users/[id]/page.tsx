import { prisma } from "@/lib/prisma";
import { getPublicUserStats, getPublicDailyStats, getPublicDailyPredictions } from "@/lib/stats";
import { fetchPublicDailyStats } from "@/actions/stats";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/market/FollowButton";
import { CalendarPnLWrapper } from "@/components/mypage/CalendarPnLWrapper";
import { auth } from "@/auth";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PredictionList } from "@/components/mypage/PredictionList";

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    const currentUserId = session?.user?.id;
    const userId = params.id;

    // Fetch user profile (Public view: No points/private data exposed)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true, bio: true, link: true,
            _count: { select: { followers: true, following: true } },
        }
    });

    if (!user) notFound();

    const followerCount = user._count.followers;
    const followingCount = user._count.following;

    // 1. Get Calculated Stats for this user (public predictions only)
    const stats = await getPublicUserStats(userId);
    const isPositiveReturn = stats.recoveryRate >= 100;

    // 1b. Calendar data (public predictions only)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [dailyStats, dailyPredictions] = await Promise.all([
        getPublicDailyStats(userId, currentYear, currentMonth),
        getPublicDailyPredictions(userId, currentYear, currentMonth),
    ]);

    // 2. Get Published Predictions (public only)
    const publishedPredictions = await prisma.prediction.findMany({
        where: { authorId: userId, isPrivate: false, publishType: "internal" },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { transactions: { where: { action: "BUY_PREDICTION" } } } } },
    });

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUserId) {
        const followRecord = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: userId,
                }
            }
        });
        isFollowing = !!followRecord;
    }

    // Bind the server action with userId for calendar month switching
    const boundFetchPublicDailyStats = async (year: number, month: number) => {
        "use server";
        return fetchPublicDailyStats(userId, year, month);
    };

    return (
        <div className="min-h-screen bg-white font-sans pb-24">

            {/* Header Profile */}
            <div className="bg-[#1c1e54] text-white p-6 pb-12 rounded-b-lg shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-18px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-3">
                        <ArrowLeft className="w-4 h-4" />
                        戻る
                    </Link>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-light tracking-tight">{user.name}</h1>
                                {user.role === 'ADMIN' && (
                                    <span className="text-[9px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded">公式</span>
                                )}
                            </div>
                        </div>

                        {currentUserId && currentUserId !== userId && (
                            <div className="mt-2">
                                <FollowButton targetUserId={userId} initialIsFollowing={isFollowing} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-2 text-sm">
                        <span className="text-white"><span className="font-bold">{followingCount}</span> <span className="text-slate-400 text-xs">フォロー中</span></span>
                        <span className="text-white"><span className="font-bold">{followerCount}</span> <span className="text-slate-400 text-xs">フォロワー</span></span>
                    </div>

                    <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
                        {user.bio || "自己紹介が未設定です。"}
                    </p>
                    {user.link && (
                        <a href={user.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#b9b9f9] hover:text-white transition-colors mt-2">
                            🔗 {user.link.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 mb-6 z-10 relative">
                <div className="bg-white border border-[#e5edf5] rounded-lg p-4" style={{ boxShadow: 'rgba(50,50,93,0.25) 0px 13px 27px -5px, rgba(0,0,0,0.1) 0px 8px 16px -8px' }}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[10px] font-bold text-[#64748d] uppercase tracking-wider">回収率</p>
                            <p className={`text-4xl font-light tabular-nums tracking-tight ${isPositiveReturn && stats.totalInvestment > 0 ? 'text-[#533afd]' : 'text-[#061b31]'}`}>
                                {stats.totalInvestment === 0 ? "0.0" : stats.recoveryRate.toFixed(1)}<span className="text-lg ml-0.5">%</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-[#64748d] uppercase tracking-wider">収支</p>
                            <p className={`text-2xl font-light tabular-nums tracking-tight ${stats.totalRefund - stats.totalInvestment >= 0 ? 'text-[#533afd]' : 'text-[#ea2261]'}`}>
                                {stats.totalRefund - stats.totalInvestment >= 0 ? '+' : ''}{(stats.totalRefund - stats.totalInvestment).toLocaleString()}<span className="text-xs ml-0.5">円</span>
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#e5edf5]">
                        <div>
                            <p className="text-[10px] text-[#64748d] font-bold">投資額</p>
                            <p className="text-sm font-bold text-[#061b31] tabular-nums">{stats.totalInvestment.toLocaleString()}<span className="text-[10px] text-[#64748d] ml-0.5">円</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[#64748d] font-bold">回収額</p>
                            <p className="text-sm font-bold text-[#061b31] tabular-nums">{stats.totalRefund.toLocaleString()}<span className="text-[10px] text-[#64748d] ml-0.5">円</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[#64748d] font-bold">的中</p>
                            <p className="text-sm font-bold text-[#061b31] tabular-nums">{stats.hitCount}<span className="text-[10px] text-[#64748d] ml-0.5">/ {stats.totalPredictions}R</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Venue Stats Link */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
                <Link href={`/users/${userId}/venues`}>
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                        <div>
                            <h3 className="text-sm font-bold text-[#061b31]">詳細成績</h3>
                            <p className="text-xs text-[#64748d] mt-0.5">24場の回収率・収支を確認</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#64748d]" />
                    </div>
                </Link>
            </div>

            {/* Calendar PnL */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
                <CalendarPnLWrapper
                    userId={userId}
                    initialDailyStats={dailyStats}
                    initialDailyPredictions={dailyPredictions}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                    fetchAction={boundFetchPublicDailyStats}
                />
            </div>

            {/* Published Predictions */}
            <div className="max-w-4xl mx-auto px-4">
                <h3 className="text-xs font-bold text-[#64748d] mb-3">公開した予想 ({publishedPredictions.length})</h3>
                <PredictionList items={publishedPredictions.map(pred => ({
                    id: pred.id,
                    placeName: pred.placeName,
                    raceNumber: pred.raceNumber,
                    title: pred.title,
                    price: pred.price,
                    isSettled: pred.isSettled,
                    isHit: pred.isHit,
                    refundAmount: pred.refundAmount,
                    createdAt: pred.createdAt.toISOString(),
                    purchaseCount: pred._count?.transactions || 0,
                }))} />
            </div>
        </div>
    );
}
