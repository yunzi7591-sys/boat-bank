"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, PenTool, Lock, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BOAT_COLORS } from "@/lib/bet-logic";

export function RaceHubClient({
    venue,
    schedules,
    allMarketPredictions,
    allRaceResults,
    allRaceEntries,
    initialActiveRace
}: {
    venue: any,
    schedules: any[],
    allMarketPredictions: any[],
    allRaceResults: any[],
    allRaceEntries?: any[],
    initialActiveRace: number
}) {
    const router = useRouter();
    const [activeRaceNumber, setActiveRaceNumber] = useState(initialActiveRace);

    // Filter data for the active race
    const currentSchedule = schedules.find(s => s.raceNumber === activeRaceNumber);
    const isFinished = currentSchedule ? new Date(currentSchedule.deadlineAt) < new Date() : false;

    const marketPredictions = allMarketPredictions.filter(p => p.raceNumber === activeRaceNumber);
    const raceResult = allRaceResults.find(r => r.raceNumber === activeRaceNumber);

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

    let arrivalsList: any[] = [];
    if (raceResult?.arrivals) {
        if (typeof raceResult.arrivals === 'string') {
            try { arrivalsList = JSON.parse(raceResult.arrivals); } catch (e) { }
        } else {
            arrivalsList = raceResult.arrivals as any[];
        }
    }

    const handleTabClick = (rNum: number) => {
        setActiveRaceNumber(rNum);
        // Optional: Update URL smoothly without triggering a hard server fetch
        window.history.replaceState(null, '', `/place/${venue.id}?race=${rNum}`);
    };

    const activeEntries = (allRaceEntries || []).filter(e => e.raceNumber === activeRaceNumber);
    const currentRacers = activeEntries.map(entry => {
        let colorClasses = "bg-white text-slate-900 border-slate-200";
        if (entry.boatNumber === 1) colorClasses = "bg-white text-slate-900 border-slate-200";
        else if (entry.boatNumber === 2) colorClasses = "bg-slate-900 text-white border-slate-900";
        else if (entry.boatNumber === 3) colorClasses = "bg-red-600 text-white border-red-600";
        else if (entry.boatNumber === 4) colorClasses = "bg-blue-600 text-white border-blue-600";
        else if (entry.boatNumber === 5) colorClasses = "bg-yellow-400 text-slate-900 border-yellow-400";
        else if (entry.boatNumber === 6) colorClasses = "bg-emerald-600 text-white border-emerald-600";

        return {
            boatNumber: entry.boatNumber,
            name: entry.racer?.name || "選手情報なし",
            class: entry.racer?.grade || "B1",
            color: colorClasses
        };
    }).sort((a, b) => a.boatNumber - b.boatNumber);

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
                            <button
                                key={rNum}
                                onClick={() => handleTabClick(rNum)}
                                className="snap-center shrink-0 cursor-pointer focus:outline-none"
                            >
                                <div className={`flex flex-col items-center justify-center w-[54px] h-[58px] rounded-xl border-2 transition-all duration-200 ${isActive ? 'border-blue-600 bg-blue-50 shadow-md scale-105' : 'border-slate-100 bg-white opacity-80 hover:bg-slate-50'
                                    }`}>
                                    <span className={`text-[15px] font-black ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {rNum}
                                        <span className="text-[10px] ml-[1px]">R</span>
                                    </span>
                                    {isActive && <div className={`h-1 w-6 mt-1 rounded-full ${colorObj.colorCls}`}></div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Race Status */}
            <div className="px-4 pt-6 pb-2">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-800 text-white font-black px-2 py-0.5 rounded text-sm">{activeRaceNumber}R</span>
                            <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                                {currentSchedule ? new Date(currentSchedule.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' }) : '未定'} 締切
                            </span>
                        </div>
                    </div>
                    <div className={`text-xs font-black px-3 py-1.5 rounded-full ${isFinished ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'
                        }`}>
                        {isFinished ? '発売終了' : '受付中'}
                    </div>
                </div>
            </div>

            {/* Entry List Section */}
            <div className="px-4 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <h3 className="text-[13px] font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5">
                            📋 出走表 <span className="text-[10px] text-slate-400 font-bold ml-1">Entry List</span>
                        </h3>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {currentRacers.length > 0 ? (
                            currentRacers.map((racer) => (
                                <div key={racer.boatNumber} className="flex items-center bg-slate-50/80 p-2 rounded-xl border border-slate-100/60 hover:bg-slate-50 hover:border-slate-200 transition-colors">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xl shadow-sm border-2 ${racer.color}`}>
                                        {racer.boatNumber}
                                    </div>
                                    <div className="ml-3 flex flex-col justify-center">
                                        <span className={`text-[10px] font-bold leading-none px-1.5 py-0.5 rounded-sm w-fit mb-0.5 shadow-sm ${racer.class.includes('A1') ? "bg-gradient-to-r from-yellow-200 to-yellow-100 text-yellow-800 border border-yellow-200" :
                                            racer.class.includes('A2') ? "bg-slate-200 text-slate-800 border border-slate-200" :
                                                racer.class.includes('B1') ? "bg-red-100 text-red-800 border border-red-100" : "bg-blue-100 text-blue-800 border border-blue-100"
                                            }`}>
                                            {racer.class}
                                        </span>
                                        <span className="text-[15px] font-black text-slate-800 tracking-tight leading-none mt-0.5">
                                            {racer.name.replace(/\s+/g, '')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center bg-slate-50/50 border border-slate-200/60 border-dashed rounded-xl flex flex-col items-center justify-center">
                                <p className="text-xs font-bold text-slate-500 mb-1">出走表データが同期されていません</p>
                                <p className="text-[10px] text-slate-400">このレースはまだエントリー情報が取得できていません</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Race Result Section with All Payouts Details */}
            {raceResult && (
                <div className="px-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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

                        <div className="flex flex-col gap-2 bg-white/60 p-3 rounded-xl border border-yellow-100 mb-4">
                            <span className="text-xs font-black text-slate-500 mb-1 border-b pb-1 flex justify-between">
                                <span>🪧 上位着順</span>
                            </span>

                            {/* Top 3 Arrivals Display UI */}
                            {arrivalsList.length > 0 ? (
                                <div className="space-y-2 pt-1">
                                    {arrivalsList.filter((a: any) => a.place >= 1 && a.place <= 3).map((arrival: any, idx: number) => {
                                        const c = BOAT_COLORS.find(bc => bc.no === arrival.boatNumber);
                                        return (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-8 flex items-center justify-center shrink-0">
                                                    <span className={`text-[11px] font-black ${arrival.place === 1 ? 'text-yellow-600' :
                                                        arrival.place === 2 ? 'text-slate-400' :
                                                            'text-orange-400'
                                                        }`}>
                                                        {arrival.place}着
                                                    </span>
                                                </div>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${c?.colorCls || 'bg-slate-200'}`}>
                                                    {arrival.boatNumber}
                                                </div>
                                                <div className="text-sm font-bold text-slate-800 tracking-wider">
                                                    {arrival.racerName && arrival.racerName !== 'undefined undefined' && arrival.racerName.trim() !== '' ? arrival.racerName : `選手情報なし`}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex justify-around items-end pt-2 pb-2">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black text-yellow-600 mb-1">1着</span>
                                        <div className={`w-11 h-11 border-2 border-yellow-400 rounded-full flex items-center justify-center text-xl font-black shadow-md ${BOAT_COLORS.find(c => c.no === raceResult.firstPlace)?.colorCls || 'bg-slate-200'}`}>
                                            {raceResult.firstPlace}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center pb-1">
                                        <span className="text-[10px] font-black text-slate-400 mb-1">2着</span>
                                        <div className={`w-9 h-9 border-2 border-slate-300 rounded-full flex items-center justify-center text-base font-black shadow-sm ${BOAT_COLORS.find(c => c.no === raceResult.secondPlace)?.colorCls || 'bg-slate-200'}`}>
                                            {raceResult.secondPlace}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center pb-2">
                                        <span className="text-[10px] font-black text-orange-400 mb-1">3着</span>
                                        <div className={`w-7 h-7 border-2 border-orange-200 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${BOAT_COLORS.find(c => c.no === raceResult.thirdPlace)?.colorCls || 'bg-slate-200'}`}>
                                            {raceResult.thirdPlace}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All Payouts Grid UI */}
                        {payoutsList.length > 0 && (
                            <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden shadow-sm">
                                <div className="bg-yellow-50 px-3 py-2 border-b border-yellow-100 flex items-center gap-1.5">
                                    <span className="text-xs font-black text-yellow-800">💰 払戻金一覧</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {payoutsList.map((p: any, idx: number) => {
                                        const typeLabels: Record<string, string> = {
                                            '3TR': '3連単', '3PL': '3連複', '2TR': '2連単', '2PL': '2連複', 'WIN': '単勝'
                                        };
                                        const isMain = p.type === '3TR';
                                        return (
                                            <div key={idx} className={`flex items-center justify-between p-2.5 px-3 ${isMain ? 'bg-yellow-50/30' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold w-10 ${isMain ? 'text-yellow-700' : 'text-slate-500'}`}>
                                                        {typeLabels[p.type] || p.type}
                                                    </span>
                                                    <span className={`font-black font-mono tracking-widest ${isMain ? 'text-base text-yellow-900' : 'text-sm text-slate-700'}`}>
                                                        {p.numbers}
                                                    </span>
                                                </div>
                                                <span className={`font-black font-mono ${isMain ? 'text-lg text-red-600' : 'text-base text-slate-800'}`}>
                                                    <span className="text-xs mr-0.5">¥</span>{p.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3 Main Action Hub Cards */}
            <div className={`px-4 mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100 fill-both`}>
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
            <div className={`px-4 mt-10 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-both`}>
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
                        {marketPredictions.map((pred: any) => (
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
