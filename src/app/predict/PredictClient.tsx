"use client";

import { useBetStore } from '@/store/bet-store';
import { VerticalGrid, MockRacer } from '@/components/betting/VerticalGrid';
import { FundAllocationView } from '@/components/betting/FundAllocationView';
import { BetListCart } from '@/components/cart/BetListCart';
import { Button } from '@/components/ui/button';
import { BetType } from '@/lib/bet-logic';
import { cn } from '@/lib/utils';
import { useState, Suspense, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BET_TYPES: { type: BetType; label: string }[] = [
    { type: '3TR', label: '3連単' },
    { type: '3PL', label: '3連複' },
    { type: '2TR', label: '2連単' },
    { type: '2PL', label: '2連複' },
    { type: 'WIN', label: '単勝' },
];

interface PredictClientProps {
    venue: { id: string; name: string } | null;
    raceNumber: number;
    racers: MockRacer[];
}

export default function PredictClient({ venue, raceNumber, racers }: PredictClientProps) {
    const { activeBetType, setBetType, cart, clearSelections } = useBetStore();
    const [viewCart, setViewCart] = useState(false);

    // If venue is missing, we show a fallback or simple header
    const venueName = venue?.name || '不明な会場';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center h-[60px]">
                <div className="flex items-center gap-2">
                    <Link href={venue ? `/place/${venue.id}` : "/"}>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800 h-9 w-9">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5 tracking-wider">VOTING UI</span>
                        <h1 className="text-sm font-black tracking-tight leading-none">
                            {venueName} {raceNumber}R
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/20 hover:bg-white/10 bg-transparent h-8 font-black text-[11px] px-3 rounded-full"
                        onClick={() => setViewCart(!viewCart)}
                    >
                        {viewCart ? '← 投票する' : `カート (${cart.length})`}
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col pb-24">
                {!viewCart ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Bet Type Tabs */}
                        <div className="flex bg-white rounded-xl p-1.5 grid-cols-5 border border-slate-200 shadow-sm mb-6">
                            {BET_TYPES.map(({ type, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setBetType(type)}
                                    className={cn(
                                        "flex-1 py-2 text-[11px] font-black rounded-lg transition-all",
                                        activeBetType === type
                                            ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                                            : "text-slate-400 hover:bg-slate-50"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-full flex flex-col items-center">
                            <div className="w-full flex justify-between items-center mb-4 border-b border-slate-50 pb-2">
                                <span className="text-[11px] font-black text-slate-400 tracking-wider">MARKSHEET</span>
                                <Button variant="ghost" size="sm" onClick={clearSelections} className="text-[10px] font-bold text-slate-400 h-6 px-2 hover:bg-slate-50">
                                    リセット
                                </Button>
                            </div>
                            <VerticalGrid racers={racers} />
                        </div>

                        <div className="mt-8">
                            <FundAllocationView />
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">ベットリスト</h2>
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{cart.length}件</span>
                        </div>
                        <Suspense fallback={
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mb-4"></div>
                                <p className="text-sm font-bold">カートを読み込み中...</p>
                            </div>
                        }>
                            <BetListCart />
                        </Suspense>
                    </div>
                )}
            </main>
        </div>
    );
}
