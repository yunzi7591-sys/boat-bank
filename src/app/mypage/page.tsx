import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats, getUserDailyStats, getUserDailyPredictions } from "@/lib/stats";
import { CalendarPnLWrapper } from "@/components/mypage/CalendarPnLWrapper";
import { notFound, redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { DemoEvalButton } from "@/components/mypage/DemoEvalButton";
import { ProfileEditModal } from "@/components/mypage/ProfileEditModal";
import { AccountSettings } from "@/components/mypage/AccountSettings";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { ReloadButton } from "@/components/ReloadButton";
import { PredictionList } from "@/components/mypage/PredictionList";

export default async function MyPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    // Fetch full user for points
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, points: true, role: true, bio: true, link: true,
            _count: { select: { followers: true, following: true } },
        }
    });

    if (!user) notFound();

    const followerCount = user._count.followers;
    const followingCount = user._count.following;

    // 1. Get Calculated Stats
    const stats = await getUserStats(userId);

    // 1b. Calendar data
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [dailyStats, dailyPredictions] = await Promise.all([
        getUserDailyStats(userId, currentYear, currentMonth),
        getUserDailyPredictions(userId, currentYear, currentMonth),
    ]);

    // 2. Get Published Predictions
    const publishedPredictions = await prisma.prediction.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
            id: true,
            placeName: true,
            raceNumber: true,
            title: true,
            price: true,
            isSettled: true,
            isHit: true,
            refundAmount: true,
            createdAt: true,
            _count: { select: { transactions: { where: { action: "BUY_PREDICTION" } } } },
        },
    });

    // 3. Get Purchased Predictions
    const purchases = await prisma.transaction.findMany({
        where: { userId, action: 'BUY_PREDICTION' },
        take: 30,
        select: {
            prediction: {
                select: {
                    id: true,
                    placeName: true,
                    raceNumber: true,
                    title: true,
                    price: true,
                    isSettled: true,
                    isHit: true,
                    refundAmount: true,
                    createdAt: true,
                    author: { select: { name: true } },
                    _count: { select: { transactions: { where: { action: "BUY_PREDICTION" } } } },
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    const purchasedPredictions = purchases.map(p => p.prediction).filter(p => p !== null);

    const isPositiveReturn = stats.recoveryRate >= 100;

    return (
        <div className="min-h-screen bg-white font-sans pb-24">

            {/* Header Profile */}
            <div className="bg-[#1c1e54] text-white p-6 pb-12 rounded-b-lg shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-18px_rgba(0,0,0,0.1)] relative overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-light tracking-tight">{user.name}</h1>
                            {user.role === 'ADMIN' && (
                                <span className="text-[9px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded">公式</span>
                            )}
                            {user.role === 'MONITOR' && (
                                <span className="text-[9px] font-black bg-sky-400 text-sky-900 px-1.5 py-0.5 rounded">モニター</span>
                            )}
                            </div>
                            <ReloadButton className="text-white/60" />
                        </div>
                    </div>

                    <Link href="/mypage/follows" className="flex items-center gap-4 mb-3 text-sm hover:opacity-80 transition-opacity">
                        <span className="text-white"><span className="font-bold">{followingCount}</span> <span className="text-slate-400 text-xs">フォロー中</span></span>
                        <span className="text-white"><span className="font-bold">{followerCount}</span> <span className="text-slate-400 text-xs">フォロワー</span></span>
                    </Link>

                    <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-sm mb-2">
                        {user.bio || "自己紹介が未設定です。"}
                    </p>

                    {user.link && (
                        <a href={user.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#b9b9f9] hover:text-white transition-colors mb-3">
                            🔗 {user.link.replace(/^https?:\/\//, '')}
                        </a>
                    )}

                    <div className="flex items-center gap-3">
                        <ProfileEditModal initialName={user.name || ""} initialBio={user.bio || ""} initialLink={user.link || ""} />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 mb-6 z-10 relative">
                <div className="bg-white border border-[#e5edf5] rounded-lg p-4" style={{ boxShadow: 'rgba(50,50,93,0.3) 0px 13px 27px -5px, rgba(0,0,0,0.15) 0px 8px 16px -8px' }}>
                    {/* Recovery Rate - Hero */}
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

                    {/* Detail Row */}
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
            <div className="max-w-4xl mx-auto px-4 mb-8 flex flex-col gap-2 border-b border-[#e5edf5] pb-8">
                <Link href="/mypage/venues">
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between hover:scale-[1.01] transition-transform" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                        <div>
                            <h3 className="text-sm font-bold text-[#061b31]">詳細成績</h3>
                            <p className="text-xs text-[#64748d] mt-0.5">24場の回収率・収支を確認</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#64748d]" />
                    </div>
                </Link>
                <Link href={`/users/${userId}`}>
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between hover:scale-[1.01] transition-transform" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                        <div>
                            <h3 className="text-sm font-bold text-[#061b31]">公開プロフィール</h3>
                            <p className="text-xs text-[#64748d] mt-0.5">他のユーザーから見えるプロフィールを確認</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#64748d]" />
                    </div>
                </Link>
            </div>

            {/* Calendar PnL */}
            <div className="max-w-4xl mx-auto px-4 mb-8 border-b border-[#e5edf5] pb-8">
                <CalendarPnLWrapper
                    userId={userId}
                    initialDailyStats={dailyStats}
                    initialDailyPredictions={dailyPredictions}
                    currentYear={currentYear}
                    currentMonth={currentMonth}
                />
            </div>

            {/* Tabs Section */}
            <div className="max-w-4xl mx-auto px-4">
                <Tabs defaultValue="published" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="published" className="font-bold">公開した予想 ({publishedPredictions.length})</TabsTrigger>
                        <TabsTrigger value="purchased" className="font-bold">購入した予想 ({purchasedPredictions.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="published">
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
                    </TabsContent>

                    <TabsContent value="purchased">
                        <PredictionList showAuthor items={purchasedPredictions.map(pred => ({
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
                            authorName: pred.author?.name || undefined,
                        }))} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Account Settings Menu */}
            <div className="max-w-4xl mx-auto px-4 mt-8 pb-12">
                <AccountSettings />
            </div>

            {/* Admin Demo Evaluation Trigger */}
            {user.role === 'ADMIN' && (
                <div className="max-w-4xl mx-auto px-4 mt-6 opacity-50 hover:opacity-100 transition-opacity">
                    <DemoEvalButton />
                </div>
            )}

        </div>
    );
}
