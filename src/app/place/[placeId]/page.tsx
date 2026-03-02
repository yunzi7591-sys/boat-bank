import { VENUES } from "@/lib/constants/venues";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, MapPin, PenTool, Lock, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BOAT_COLORS } from "@/lib/bet-logic";

export default async function PlacePage(props: {
    params: Promise<{ placeId: string }>;
    searchParams: Promise<{ race?: string }>;
}) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    const venue = VENUES.find(v => v.id === params.placeId);

    if (!venue) {
        return <div className="p-8 text-center text-red-500 font-bold">会場が見つかりません</div>;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch today's schedule for this venue
    const schedules = await prisma.raceSchedule.findMany({
        where: {
            placeName: venue.name,
            raceDate: new Date(todayStr)
        },
        orderBy: { raceNumber: 'asc' }
    });

    const activeRaceNumber = searchParams.race ? parseInt(searchParams.race) : 1;
    const currentSchedule = schedules.find(s => s.raceNumber === activeRaceNumber);
    const isFinished = currentSchedule ? new Date(currentSchedule.deadlineAt) < new Date() : false;

    // Fetch public predictions for the active race
    const marketPredictions = await prisma.prediction.findMany({
        where: {
            placeName: venue.name,
            raceNumber: activeRaceNumber,
            raceDate: new Date(todayStr),
            isPrivate: false,
        },
        include: {
            author: { select: { name: true, image: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Fetch Race Result if available
    const raceResult = await prisma.raceResult.findUnique({
        where: {
            placeName_raceNumber_raceDate: {
                placeName: venue.name,
                raceNumber: activeRaceNumber,
                raceDate: new Date(todayStr)
            }
        }
    });

    // Parse payouts safely
    let payoutsList: any[] = [];
    if (raceResult?.payouts) {
        if (typeof raceResult.payouts === 'string') {
            try { payoutsList = JSON.parse(raceResult.payouts); } catch (e) { }
        } else {
            payoutsList = raceResult.payouts as any[];
        }
    }
    const refundsList: number[] = raceResult?.refunds || [];

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center shadow-md sticky top-0 z-20">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1 text-center font-black text-lg tracking-wider flex items-center justify-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {venue.name}
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Race Selection Tabs (1-12) */}
            <div className="bg-white border-b shadow-sm sticky top-[60px] z-10">
                <div className="flex overflow-x-auto gap-2 p-3 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {Array.from({ length: 12 }).map((_, i) => {
                        const rNum = i + 1;
                        const sched = schedules.find(s => s.raceNumber === rNum);
                        const rFinished = sched ? new Date(sched.deadlineAt) < new Date() : false;
                        const isActive = activeRaceNumber === rNum;

                        const colorObj = BOAT_COLORS.find(c => c.no === rNum) || { colorCls: 'bg-slate-200 text-slate-800' };

                        return (
                            <Link href={`/place/${venue.id}?race=${rNum}`} key={rNum} className="snap-center shrink-0">
                                <div className={`flex flex-col items-center justify-center w-[54px] h-[58px] rounded-xl border-2 transition-all ${isActive ? 'border-blue-600 bg-blue-50 shadow-md scale-105' : 'border-slate-100 bg-white opacity-80'
                                    }`}>
                                    <span className={`text-[15px] font-black ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {rNum}
                                        <span className="text-[10px] ml-[1px]">R</span>
                                    </span>
                                    {isActive && <div className={`h-1 w-6 mt-1 rounded-full ${colorObj.colorCls}`}></div>}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Active Race Status */}
            <div className="px-4 pt-6 pb-2">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-800 text-white font-black px-2 py-0.5 rounded text-sm">{activeRaceNumber}R</span>
                            <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                {currentSchedule ? currentSchedule.deadlineAt.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }) : '未定'} 締切
                            </span>
                        </div>
                        <h2 className="text-[10px] font-bold text-slate-500">
                            ※出走表・オッズは公式等をご確認ください
                        </h2>
                    </div>
                    <div className={`text-xs font-black px-3 py-1.5 rounded-full ${isFinished ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'
                        }`}>
                        {isFinished ? '発売終了' : '受付中'}
                    </div>
                </div>
            </div>

            {/* Race Result Section */}
            {raceResult && (
                <div className="px-4 mt-4">
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[13px] font-extrabold text-yellow-800 tracking-wider flex items-center gap-1.5">
                                🏆 確定結果
                            </h3>
                        </div>

                        {refundsList.length > 0 && (
                            <div className="mb-3 bg-red-100 border border-red-200 text-red-800 text-xs font-bold p-2 rounded-lg flex items-center gap-1">
                                ⚠️ 返還艇あり: {refundsList.join(", ")}号艇
                            </div>
                        )}

                        <div className="flex justify-around items-end bg-white/60 p-3 rounded-xl border border-yellow-100 mb-3">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 mb-1">1着</span>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-sm ${BOAT_COLORS.find(c => c.no === raceResult.firstPlace)?.colorCls || 'bg-slate-200'}`}>
                                    {raceResult.firstPlace}
                                </div>
                            </div>
                            <div className="flex flex-col items-center pb-1">
                                <span className="text-[10px] font-black text-slate-400 mb-1">2着</span>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${BOAT_COLORS.find(c => c.no === raceResult.secondPlace)?.colorCls || 'bg-slate-200'}`}>
                                    {raceResult.secondPlace}
                                </div>
                            </div>
                            <div className="flex flex-col items-center pb-2">
                                <span className="text-[10px] font-black text-slate-400 mb-1">3着</span>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${BOAT_COLORS.find(c => c.no === raceResult.thirdPlace)?.colorCls || 'bg-slate-200'}`}>
                                    {raceResult.thirdPlace}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            {payoutsList.filter((p: any) => p.type === '3TR').map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded-md border border-yellow-100">
                                    <span className="font-bold text-yellow-800">3連単 {p.numbers}</span>
                                    <span className="font-black text-lg text-slate-800">¥{p.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3 Main Action Hub Cards */}
            <div className="px-4 mt-6 space-y-4">
                <h3 className="text-[13px] font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5 mb-2">
                    <PenTool className="w-4 h-4 text-blue-600" /> TAKE ACTION
                </h3>

                <Link href={`/predict?placeId=${venue.id}&raceNumber=${activeRaceNumber}&isPrivate=false`}>
                    <Card className={`border-2 shadow-md transition-transform hover:scale-[1.02] active:scale-95 ${isFinished ? 'opacity-50 pointer-events-none grayscale' : 'border-blue-200 bg-gradient-to-br from-white to-blue-50'
                        }`}>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                <PenTool className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-blue-900 text-[15px] mb-0.5">予想を販売・公開する</h4>
                                <p className="text-[11px] font-bold text-blue-600/80 leading-snug">自信の予想をマーケットに並べて、ポイントを稼ぎましょう！</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href={`/predict?placeId=${venue.id}&raceNumber=${activeRaceNumber}&isPrivate=true`}>
                    <Card className={`border shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${isFinished ? 'opacity-50 pointer-events-none grayscale' : 'border-slate-200 bg-white'
                        }`}>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="bg-slate-800 text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 text-[15px] mb-0.5">自分の賭けを登録（非公開）</h4>
                                <p className="text-[11px] font-bold text-slate-500 leading-snug">タイムラインには出さず、自身の収支ポートフォリオ用として保存します。</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Market Preview */}
            <div className="px-4 mt-10">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                    <h3 className="text-[13px] font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-emerald-600" /> MARKET PREDICTIONS
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-sm">
                        {marketPredictions.length}件の予想
                    </span>
                </div>

                {marketPredictions.length === 0 ? (
                    <div className="bg-white border rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                        <Clock className="w-8 h-8 text-slate-200 mb-2" />
                        <p className="text-sm font-bold text-slate-500">現在、このレースの予想はありません。</p>
                        <p className="text-[10px] text-slate-400 mt-1">一番乗りで予想を販売してみましょう！</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {marketPredictions.map(pred => (
                            <Link href={`/predictions/${pred.id}`} key={pred.id}>
                                <Card className="border-none shadow-sm rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-100 transition-all bg-white">
                                    <div className="p-4 flex gap-4 items-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-100">
                                            {pred.author.image ? (
                                                <img src={pred.author.image} alt="Author" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                                                    {pred.author.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black text-slate-800 truncate mb-0.5">{pred.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <span className="text-slate-600">{pred.author.name}</span>
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${pred.price === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {pred.price === 0 ? '無料' : `${pred.price} pt`}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-300">
                                                👀 {pred.viewCount}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
