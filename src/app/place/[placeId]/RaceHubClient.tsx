"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, PenTool, Lock, Clock } from "lucide-react";
import { MarketFeed } from "@/components/market/MarketFeed";
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
    const tabsRef = useRef<HTMLDivElement>(null);

    // 初期表示時にアクティブタブまでスクロール
    useEffect(() => {
        if (tabsRef.current) {
            const activeBtn = tabsRef.current.children[initialActiveRace - 1] as HTMLElement;
            if (activeBtn) {
                activeBtn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [initialActiveRace]);

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
            <div className="bg-[#f8fafc] border-b shadow-sm sticky top-[60px] z-10">
                <div ref={tabsRef} className="flex overflow-x-auto gap-2 p-3 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                                <div className={`flex flex-col items-center justify-center w-[54px] h-[58px] rounded-xl border-2 transition-all duration-200 ${isActive ? 'border-blue-600 bg-blue-50 shadow-md scale-105' : rFinished ? 'border-slate-100 bg-slate-50 opacity-50' : 'border-slate-100 bg-white opacity-80 hover:bg-slate-50'
                                    }`}>
                                    <span className={`text-[15px] font-black ${isActive ? 'text-blue-900' : rFinished ? 'text-slate-300' : 'text-slate-700'}`}>
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
                <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(50,50,93,0.08)] border border-slate-100 flex items-center justify-between">
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
                <div className="bg-white rounded-lg p-3 shadow-[0_2px_8px_rgba(50,50,93,0.08)] border border-slate-100">
                    <h3 className="text-[11px] font-bold text-slate-500 mb-2">出走表</h3>
                    <div className="flex flex-col gap-1">
                        {currentRacers.length > 0 ? (
                            currentRacers.map((racer) => (
                                <div key={racer.boatNumber} className="flex items-center p-1.5 rounded-md hover:bg-slate-50 transition-colors">
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-black text-base border-2 ${racer.color}`}>
                                        {racer.boatNumber}
                                    </div>
                                    <div className="ml-2 flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded-sm ${racer.class.includes('A1') ? "bg-yellow-100 text-yellow-800" :
                                            racer.class.includes('A2') ? "bg-slate-200 text-slate-800" :
                                                racer.class.includes('B1') ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                            }`}>
                                            {racer.class}
                                        </span>
                                        <span className="text-[13px] font-bold text-slate-800 tracking-tight">
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
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
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
                                            '3TR': '3連単', '3PL': '3連複', '2TR': '2連単', '2PL': '2連複', 'WIDE': '拡連複', 'WIN': '単勝', 'PLACE': '複勝'
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

            {/* Action Buttons */}
            <div className="px-4 mt-4 flex gap-2">
                {isFinished ? (
                    <div className="flex-1 bg-slate-100 border border-slate-200 rounded-lg p-3 opacity-50 text-center">
                        <p className="text-xs font-bold text-slate-400">販売は締め切りました</p>
                    </div>
                ) : (
                    <Link href={`/predict?placeId=${venue.id}&raceNumber=${activeRaceNumber}&isPrivate=false`} className="flex-1">
                        <div className="bg-[#533afd] text-white rounded-lg p-3 text-center hover:bg-[#4434d4] active:scale-[0.98] transition-all">
                            <p className="text-xs font-bold">予想を販売・公開</p>
                        </div>
                    </Link>
                )}
                <Link href={`/predict?placeId=${venue.id}&raceNumber=${activeRaceNumber}&isPrivate=true`} className="flex-1">
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-3 text-center hover:border-[#b9b9f9] active:scale-[0.98] transition-all">
                        <p className="text-xs font-bold text-[#061b31]">賭けを登録（非公開）</p>
                    </div>
                </Link>
            </div>

            {/* Market Preview */}
            <div className="px-4 mt-10">
                <h3 className="text-[13px] font-extrabold text-[#061b31] tracking-wider mb-3">このレースの予想</h3>
                {marketPredictions.length === 0 ? (
                    <div className="bg-white border border-[#e5edf5] rounded-lg p-8 flex flex-col items-center justify-center text-center">
                        <Clock className="w-8 h-8 text-slate-200 mb-2" />
                        <p className="text-sm font-bold text-[#64748d]">現在、このレースの予想はありません。</p>
                        <p className="text-[10px] text-[#64748d] mt-1">一番乗りで予想を販売してみましょう！</p>
                    </div>
                ) : (
                    <MarketFeed predictions={marketPredictions} />
                )}
            </div>

        </div>
    );
}
