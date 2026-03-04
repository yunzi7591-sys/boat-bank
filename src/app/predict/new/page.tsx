"use client";

import { useBetStore } from '@/store/bet-store';
import { VerticalGrid, MockRacer } from '@/components/betting/VerticalGrid';
import { FundAllocationView } from '@/components/betting/FundAllocationView';
import { BetListCart } from '@/components/cart/BetListCart';
import { Button } from '@/components/ui/button';
import { BetType } from '@/lib/bet-logic';
import { cn } from '@/lib/utils';
import { useState, Suspense } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, Trash2, Clock, MapPin, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { RaceSelector } from '@/components/betting/RaceSelector';
import { getRaceEntriesAndSchedule } from '@/actions/race';

const BET_TYPES: { type: BetType; label: string }[] = [
    { type: '3TR', label: '3連単' },
    { type: '3PL', label: '3連複' },
    { type: '2TR', label: '2連単' },
    { type: '2PL', label: '2連複' },
    { type: 'WIN', label: '単勝' },
];

function PredictContent() {
    const searchParams = useSearchParams();
    const placeId = searchParams.get('placeId');
    const raceNumberString = searchParams.get('raceNumber');

    const { activeBetType, setBetType, cart, clearSelections } = useBetStore();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [raceData, setRaceData] = useState<any>(null);

    useEffect(() => {
        if (!placeId || !raceNumberString) {
            setIsLoading(false);
            return;
        }

        const fetchRaceInfo = async () => {
            setIsLoading(true);
            const res = await getRaceEntriesAndSchedule(placeId, parseInt(raceNumberString, 10));
            if (res.success) {
                setRaceData(res);
            }
            setIsLoading(false);
        };
        fetchRaceInfo();
    }, [placeId, raceNumberString]);

    if (!placeId || !raceNumberString) {
        return <RaceSelector />;
    }

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                    <p className="text-slate-500 font-bold text-sm">出走表を取得中...</p>
                </div>
            </div>
        );
    }

    const totalCartItems = cart.reduce((acc, f) => acc + f.combinations.length, 0);
    const totalCartAmount = cart.reduce((acc, f) => acc + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

    const venueName = raceData?.venue?.name || `ボートレース${placeId}`;
    const rNum = parseInt(raceNumberString, 10);

    // Fallback info if schedule not available
    const schedule = raceData?.schedule;
    let deadlineStr = "未定";
    let titleStr = "一般戦";
    if (schedule && schedule.deadlineAt) {
        deadlineStr = new Date(schedule.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });
        titleStr = `${schedule.grade} ${schedule.day}`;
    }

    const currentRace = {
        stadium_name: venueName,
        race_number: rNum,
        race_title: titleStr,
        closed_at: deadlineStr,
    };

    const entries = raceData?.entries || [];

    // Map entries to VerticalGrid racers format
    const currentRacers: MockRacer[] = entries.map((entry: any) => {
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
    });

    return (
        <div className="relative min-h-[100dvh] bg-slate-50 flex flex-col font-sans pb-[160px]">
            {/* Header */}
            <header className="bg-white px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sticky top-0 z-20 flex justify-between items-center">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">買い目作成</h1>
                <Button variant="ghost" size="sm" onClick={clearSelections} className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-neutral-100 hover:bg-neutral-200 h-8 rounded-full px-4">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    クリア
                </Button>
            </header>

            <main className="flex-1 w-full max-w-xl mx-auto p-4 flex flex-col items-center">

                {/* 1. Race Header UI */}
                <div className="w-full bg-white rounded-2xl p-4 sm:p-5 mb-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-10"></div>
                    <div>
                        <h2 className="text-[17px] font-black tracking-tight">{currentRace.stadium_name}</h2>
                        <span className="bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm h-fit mt-0.5 shadow-sm">
                            {currentRace.race_number}R
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-sm border border-slate-200">
                            {currentRace.race_title}
                        </span>
                        <div className="flex items-center gap-1 text-slate-500 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold tracking-widest">
                                締切 {currentRace.closed_at}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bet Type Selector */}
                <div className="flex w-full bg-slate-200/50 rounded-xl p-1 mb-6 shadow-inner">
                    {BET_TYPES.map(({ type, label }) => (
                        <button
                            key={type}
                            onClick={() => setBetType(type)}
                            className={cn(
                                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 relative",
                                activeBetType === type
                                    ? "bg-white text-blue-700 shadow-sm"
                                    : "text-slate-500 hover:bg-white/50"
                            )}
                        >
                            {activeBetType === type && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
                                />
                            )}
                            <span className="relative z-10">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Marksheet Form */}
                <div className="w-full bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="mt-4 flex pb-8 w-full justify-center">
                        {currentRacers.length > 0 ? (
                            <VerticalGrid racers={currentRacers} />
                        ) : (
                            <div className="w-full max-w-lg py-12 text-center bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
                                <p className="text-sm font-bold text-slate-500 mb-1">出走表データが同期されていません</p>
                                <p className="text-xs text-slate-400">現在1〜6枠の枠番のみで予想が可能です。</p>
                                <div className="mt-6">
                                    <VerticalGrid />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full mt-6">
                    <FundAllocationView />
                </div>
            </main >

            {/* Floating Cart Drawer Trigger */}
            <AnimatePresence>
                {
                    cart.length > 0 && !isCartOpen && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-[84px] left-0 right-0 z-30 px-4 flex justify-center w-full max-w-md mx-auto"
                        >
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="bg-slate-900 text-white w-full rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-800 p-2 rounded-xl relative">
                                        <ShoppingCart className="w-5 h-5 text-blue-400" />
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                                            {totalCartItems}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs text-slate-400 font-bold">カート合計金額</span>
                                        <span className="text-lg font-black tracking-tight">{totalCartAmount.toLocaleString()} <span className="text-xs font-medium text-slate-400">pt</span></span>
                                    </div>
                                </div>
                                <div className="flex items-center text-sm font-bold text-blue-400">
                                    確認する
                                    <ChevronUp className="w-4 h-4 ml-1" />
                                </div>
                            </button>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Full Screen Cart Drawer */}
            <AnimatePresence>
                {
                    isCartOpen && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 z-50 bg-slate-50 flex flex-col w-full max-w-md mx-auto"
                        >
                            <header className="bg-white px-4 py-4 shadow-sm flex items-center justify-between z-10">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    ベットリスト確認
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)} className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600">
                                    <ChevronDown className="w-5 h-5" />
                                </Button>
                            </header>
                            <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
                                <Suspense fallback={<div className="text-center p-8 text-slate-400 font-bold animate-pulse">読み込み中...</div>}>
                                    <BetListCart deadlineAt={schedule?.deadlineAt ? new Date(schedule.deadlineAt) : null} />
                                </Suspense>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}

export default function NewPredictionPage() {
    return (
        <Suspense fallback={<div className="w-full p-8 text-center text-slate-400">読み込み中...</div>}>
            <PredictContent />
        </Suspense>
    );
}
