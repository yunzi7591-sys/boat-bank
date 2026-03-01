import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/stats";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FollowButton } from "@/components/market/FollowButton";
import { auth } from "@/auth";

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    const currentUserId = session?.user?.id;
    const userId = params.id;

    // Fetch user profile (Public view: No points/private data exposed)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true, bio: true }
    });

    if (!user) notFound();

    // 1. Get Calculated Stats for this user
    const stats = await getUserStats(userId);
    const isPositiveReturn = stats.recoveryRate >= 100;

    // 2. Get Published Predictions
    const publishedPredictions = await prisma.prediction.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
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

                        {currentUserId && currentUserId !== userId && (
                            <div className="mt-2">
                                <FollowButton targetUserId={userId} initialIsFollowing={isFollowing} />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-sm">
                            {user.bio || "自己紹介が未設定です。"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 mb-8 z-10 relative">
                <div className="grid grid-cols-2 gap-4">
                    <Card className={`shadow-lg border-2 ${isPositiveReturn ? 'border-red-500 bg-red-50' : 'border-neutral-200'} p-4`}>
                        <p className="text-xs text-neutral-500 font-bold mb-1">通算回収率 (Recovery Rate)</p>
                        <p className={`text-3xl font-extrabold ${isPositiveReturn ? 'text-red-600' : 'text-neutral-800'}`}>
                            {stats.recoveryRate.toFixed(1)}<span className="text-lg">%</span>
                        </p>
                    </Card>

                    <Card className="shadow-md p-4">
                        <p className="text-xs text-neutral-500 font-bold mb-1">予想提供数</p>
                        <p className="text-3xl font-extrabold text-slate-800">
                            {stats.totalPredictions}<span className="text-lg font-medium text-slate-500 ml-1">R</span>
                        </p>
                    </Card>
                </div>
            </div>

            {/* Predictions List */}
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Published Predictions</h2>
                <div className="grid gap-4">
                    {publishedPredictions.length === 0 ? (
                        <p className="text-center text-neutral-500 py-8 bg-white rounded-lg border">公開された予想はありません</p>
                    ) : (
                        publishedPredictions.map(pred => (
                            <Link href={`/predictions/${pred.id}`} key={pred.id}>
                                <Card className="hover:border-blue-300 transition-colors cursor-pointer shadow-sm relative overflow-hidden bg-white">
                                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-slate-900"></div>
                                    <CardContent className="p-4 pl-6 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold mb-0.5">{pred.placeName} {pred.raceNumber}R</p>
                                            <p className="font-bold text-base text-slate-800">{pred.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-2">{new Date(pred.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className="text-sm font-black text-green-500">{pred.price} pt</span>

                                            {/* Result Badge */}
                                            {!pred.resultChecked ? (
                                                <Badge variant="outline" className="text-slate-400 border-slate-200 bg-slate-50 text-[10px]">受付中 / 結果待ち</Badge>
                                            ) : pred.isHit ? (
                                                <Badge className="bg-red-500 text-white border-red-600 shadow-sm animate-pulse text-[10px]">
                                                    🎯 的中 (+{pred.refundAmount} pt)
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-slate-500 text-[10px]">❌ 不的中</Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
