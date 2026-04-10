import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats, getUserDailyStats, getUserDailyPredictions } from "@/lib/stats";
import { CalendarPnLWrapper } from "@/components/mypage/CalendarPnLWrapper";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DemoEvalButton } from "@/components/mypage/DemoEvalButton";
import { ProfileEditModal } from "@/components/mypage/ProfileEditModal";
import { AccountSettings } from "@/components/mypage/AccountSettings";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default async function MyPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    // Fetch full user for points
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, points: true, role: true, bio: true, link: true }
    });

    if (!user) notFound();

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
    });

    // 3. Get Purchased Predictions
    const purchases = await prisma.transaction.findMany({
        where: { userId, action: 'BUY_PREDICTION' },
        include: {
            prediction: {
                include: { author: { select: { name: true } } }
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
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-light tracking-tight">{user.name}</h1>
                                {user.role === 'ADMIN' && (
                                    <span className="text-[9px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded">ADMIN</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-bold tracking-widest mb-0.5 uppercase">Points</p>
                            <p className="text-3xl font-light tracking-tight">{user.points.toLocaleString()} <span className="text-sm font-bold text-slate-400">pt</span></p>
                        </div>
                    </div>

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
                <div className="bg-white border border-[#e5edf5] rounded-lg p-4" style={{ boxShadow: 'rgba(50,50,93,0.25) 0px 13px 27px -5px, rgba(0,0,0,0.1) 0px 8px 16px -8px' }}>
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
            <div className="max-w-4xl mx-auto px-4 mb-8 flex flex-col gap-2">
                <Link href="/mypage/venues">
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                        <div>
                            <h3 className="text-sm font-bold text-[#061b31]">詳細成績</h3>
                            <p className="text-xs text-[#64748d] mt-0.5">24場の回収率・収支を確認</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#64748d]" />
                    </div>
                </Link>
                <Link href={`/users/${userId}`}>
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                        <div>
                            <h3 className="text-sm font-bold text-[#061b31]">公開プロフィール</h3>
                            <p className="text-xs text-[#64748d] mt-0.5">他のユーザーから見えるプロフィールを確認</p>
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
                        <div className="grid gap-4">
                            {publishedPredictions.length === 0 ? (
                                <p className="text-center text-neutral-500 py-8 bg-white rounded-lg border">公開した予想はありません</p>
                            ) : (
                                publishedPredictions.map(pred => (
                                    <Link href={`/predictions/${pred.id}`} key={pred.id}>
                                        <Card className="hover:border-[#b9b9f9] transition-colors cursor-pointer shadow-sm relative overflow-hidden rounded-lg">
                                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#533afd]"></div>
                                            <CardContent className="p-4 pl-6 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-[#533afd] font-bold mb-1">{pred.placeName} {pred.raceNumber}R</p>
                                                    <p className="font-bold text-lg">{pred.title}</p>
                                                    <p className="text-xs text-neutral-400 mt-2">{new Date(pred.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <span className="text-sm font-bold text-neutral-600">{pred.price} 円</span>

                                                    {/* Result Badge */}
                                                    {!pred.isSettled ? (
                                                        <Badge variant="outline" className="text-[#64748d] border-[#e5edf5] bg-[#f6f8fa]">🕒 結果待ち</Badge>
                                                    ) : pred.isHit ? (
                                                        <Badge className="bg-[#15be53] text-white border-[#15be53] shadow-sm animate-pulse">
                                                            🎯 的中 (+{pred.hitAmount || pred.refundAmount} 円)
                                                        </Badge>
                                                    ) : pred.hitAmount && pred.hitAmount > 0 ? (
                                                        // Point gain without hit means full refund
                                                        <Badge className="bg-[#9b6829] text-white border-[#9b6829] shadow-sm">
                                                            ↩️ 返還 (+{pred.hitAmount} 円)
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-neutral-600">❌ 不的中</Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="purchased">
                        <div className="grid gap-4">
                            {purchasedPredictions.length === 0 ? (
                                <p className="text-center text-neutral-500 py-8 bg-white rounded-lg border">購入した予想はありません</p>
                            ) : (
                                purchasedPredictions.map(pred => (
                                    <Link href={`/predictions/${pred.id}`} key={pred.id}>
                                        <Card className="hover:border-[#b9b9f9] transition-colors cursor-pointer shadow-sm relative overflow-hidden rounded-lg">
                                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#9b6829]"></div>
                                            <CardContent className="p-4 pl-6 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-[#533afd] font-bold mb-1">{pred.placeName} {pred.raceNumber}R</p>
                                                    <p className="font-bold text-lg">{pred.title}</p>
                                                    <p className="text-xs text-[#64748d] mt-1">著者: {pred.author?.name || 'Unknown'}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <span className="text-sm font-bold text-[#9b6829]">購入済み</span>
                                                    {/* Result Badge for Buyer */}
                                                    {!pred.isSettled ? (
                                                        null // Wait
                                                    ) : pred.isHit ? (
                                                        <Badge className="bg-[#15be53] text-white">🎯 的中</Badge>
                                                    ) : pred.hitAmount && pred.hitAmount > 0 ? (
                                                        <Badge className="bg-[#9b6829] text-white">↩️ 返還</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">❌ 不的中</Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
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
