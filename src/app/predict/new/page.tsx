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
import { RaceSelector } from '@/components/betting/RaceSelector';

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

    if (!placeId || !raceNumberString) {
        return <RaceSelector />;
    }

    const totalCartItems = cart.reduce((acc, f) => acc + f.combinations.length, 0);
    const totalCartAmount = cart.reduce((acc, f) => acc + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

    // MOCK DATA based on OpenAPI structure for UI validation
    const mockRace = {
        stadium_name: `ボートレース${placeId}`,
        race_number: parseInt(raceNumberString, 10),
        race_title: "デイリースポーツ杯争奪戦",
        closed_at: "16:30",
    };

    const mockRacers: MockRacer[] = [
        { boatNumber: 1, name: "峰 竜太", class: "A1", color: "bg-white text-black border-slate-200" },
        { boatNumber: 2, name: "毒島 誠", class: "A1", color: "bg-black text-white" },
        { boatNumber: 3, name: "桐生 順平", class: "A1", color: "bg-red-600 text-white" },
        { boatNumber: 4, name: "松井 繁", class: "A1", color: "bg-blue-600 text-white" },
        { boatNumber: 5, name: "白井 英治", class: "A1", color: "bg-yellow-400 text-black" },
        { boatNumber: 6, name: "瓜生 正義", class: "A1", color: "bg-green-600 text-white" }
    ];

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
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {mockRace.stadium_name}
                            </span>
                            <span className="text-slate-400 text-xs font-bold">・</span>
                            <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                締切 {mockRace.closed_at}
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span className="text-blue-600">{mockRace.race_number}R</span>
                            <span className="opacity-90">{mockRace.race_title}</span>
                        </h2>
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
                    <VerticalGrid racers={mockRacers} />
                </div>

                <div className="w-full mt-6">
                    <FundAllocationView />
                </div>
            </main>

            {/* Floating Cart Drawer Trigger */}
            <AnimatePresence>
                {cart.length > 0 && !isCartOpen && (
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
                )}
            </AnimatePresence>

            {/* Full Screen Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
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
                                <BetListCart />
                            </Suspense>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function NewPredictionPage() {
    return (
        <Suspense fallback={<div className="w-full p-8 text-center text-slate-400">読み込み中...</div>}>
            <PredictContent />
        </Suspense>
    );
}
