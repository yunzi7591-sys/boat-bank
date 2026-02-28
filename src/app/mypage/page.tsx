import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/stats";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DemoEvalButton } from "@/components/mypage/DemoEvalButton";
import { ProfileEditModal } from "@/components/mypage/ProfileEditModal";
import { Button } from "@/components/ui/button";

export default async function MyPage() {
    const session = await auth();
    if (!session?.user?.id) notFound();

    const userId = session.user.id;

    // Fetch full user for points
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, points: true, role: true, bio: true }
    });

    if (!user) notFound();

    // 1. Get Calculated Stats
    const stats = await getUserStats(userId);

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
        <div className="min-h-screen bg-slate-50 font-sans pb-24">

            {/* Header Profile */}
            <div className="bg-slate-900 text-white p-6 pb-12 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4 border border-slate-700/50 p-2 pr-6 rounded-full bg-slate-800/50 backdrop-blur-sm">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold text-xl shadow-inner border-2 border-slate-200">
                                {user.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-lg font-extrabold tracking-tight">{user.name}</h1>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-bold tracking-widest mb-0.5 uppercase">Available Balance</p>
                            <p className="text-3xl font-black tracking-tight">{user.points.toLocaleString()} <span className="text-sm font-bold text-slate-400">pt</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col mb-4">
                        <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
                            {user.bio || "自己紹介が未設定です。"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ProfileEditModal initialName={user.name || ""} initialBio={user.bio || ""} />
                        <Link href={`/users/${userId}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold rounded-full text-slate-300 hover:bg-slate-800 hover:text-white">
                                公開プロフィールを確認
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 mb-8 z-10 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className={`shadow-lg border-2 ${isPositiveReturn ? 'border-red-500 bg-red-50' : 'border-neutral-200'}`}>
                        <CardHeader className="py-3 px-4 pb-2">
                            <CardTitle className="text-sm text-neutral-500 font-bold">通算回収率</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className={`text-4xl font-extrabold ${isPositiveReturn ? 'text-red-600' : 'text-neutral-800'}`}>
                                {stats.recoveryRate.toFixed(1)}<span className="text-xl">%</span>
                            </p>
                            {isPositiveReturn && <p className="text-xs text-red-500 font-bold mt-1">Excellent!</p>}
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader className="py-3 px-4 pb-2">
                            <CardTitle className="text-sm text-neutral-500 font-bold">総回収額</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-2xl font-bold">{stats.totalRefund.toLocaleString()} <span className="text-sm text-neutral-500">pt</span></p>
                            <p className="text-xs text-neutral-500 mt-1">的中: {stats.hitCount}R</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md">
                        <CardHeader className="py-3 px-4 pb-2">
                            <CardTitle className="text-sm text-neutral-500 font-bold">総投資額 (販売分)</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <p className="text-2xl font-bold">{stats.totalInvestment.toLocaleString()} <span className="text-sm text-neutral-500">pt</span></p>
                            <p className="text-xs text-neutral-500 mt-1">予想提供: {stats.totalPredictions}R</p>
                        </CardContent>
                    </Card>
                </div>
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
                                        <Card className="hover:border-blue-300 transition-colors cursor-pointer shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-500"></div>
                                            <CardContent className="p-4 pl-6 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-blue-600 font-bold mb-1">{pred.placeName} {pred.raceNumber}R</p>
                                                    <p className="font-bold text-lg">{pred.title}</p>
                                                    <p className="text-xs text-neutral-400 mt-2">{new Date(pred.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <span className="text-sm font-bold text-neutral-600">{pred.price} pt</span>

                                                    {/* Result Badge */}
                                                    {!pred.resultChecked ? (
                                                        <Badge variant="outline" className="text-neutral-500 border-neutral-300 bg-neutral-50">🕒 結果待ち</Badge>
                                                    ) : pred.isHit ? (
                                                        <Badge className="bg-red-500 text-white border-red-600 shadow-sm animate-pulse">
                                                            🎯 的中 (+{pred.refundAmount} pt)
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
                                        <Card className="hover:border-yellow-300 transition-colors cursor-pointer shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-yellow-500"></div>
                                            <CardContent className="p-4 pl-6 flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-blue-600 font-bold mb-1">{pred.placeName} {pred.raceNumber}R</p>
                                                    <p className="font-bold text-lg">{pred.title}</p>
                                                    <p className="text-xs text-neutral-500 mt-1">著者: {pred.author?.name || 'Unknown'}</p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <span className="text-sm font-bold text-yellow-600">購入済み</span>
                                                    {/* Result Badge for Buyer */}
                                                    {pred.resultChecked && (
                                                        pred.isHit ? (
                                                            <Badge className="bg-red-500 text-white">🎯 的中</Badge>
                                                        ) : (
                                                            <Badge variant="secondary">❌ 不的中</Badge>
                                                        )
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

            {/* Admin Demo Evaluation Trigger */}
            {user.role === 'ADMIN' && (
                <div className="max-w-4xl mx-auto px-4 mt-12 opacity-50 hover:opacity-100 transition-opacity">
                    <DemoEvalButton />
                </div>
            )}

        </div>
    );
}
