"use client";

import { useBetStore } from '@/store/bet-store';
import { VerticalGrid } from '@/components/betting/VerticalGrid';
import { FundAllocationView } from '@/components/betting/FundAllocationView';
import { BetListCart } from '@/components/cart/BetListCart';
import { Button } from '@/components/ui/button';
import { BetType } from '@/lib/bet-logic';
import { cn } from '@/lib/utils';
import { useState, Suspense } from 'react';

const BET_TYPES: { type: BetType; label: string }[] = [
    { type: '3TR', label: '3連単' },
    { type: '3PL', label: '3連複' },
    { type: '2TR', label: '2連単' },
    { type: '2PL', label: '2連複' },
    { type: 'WIN', label: '単勝' },
];

export default function PredictPage() {
    const { activeBetType, setBetType, cart, clearSelections } = useBetStore();
    const [viewCart, setViewCart] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
            <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-extrabold italic tracking-tight">BOAT BANK</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white hover:bg-white/20 bg-transparent"
                        onClick={() => setViewCart(!viewCart)}
                    >
                        {viewCart ? 'マークシートへ' : `カート (${cart.length})`}
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col">
                {!viewCart ? (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Bet Type Tabs */}
                        <div className="flex bg-white rounded-md p-1 grid-cols-5 border shadow-sm mb-4">
                            {BET_TYPES.map(({ type, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setBetType(type)}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-bold rounded-sm transition-all",
                                        activeBetType === type
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "text-neutral-500 hover:bg-neutral-100"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm w-full flex flex-col items-center">
                            <div className="w-full flex justify-end mb-2">
                                <Button variant="ghost" size="sm" onClick={clearSelections} className="text-xs text-neutral-500 h-6">
                                    クリア
                                </Button>
                            </div>
                            <VerticalGrid />
                        </div>

                        <FundAllocationView />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4">ベットリスト</h2>
                        <Suspense fallback={<div className="text-center p-8">Loading cart...</div>}>
                            <BetListCart />
                        </Suspense>
                    </div>
                )}
            </main>
        </div>
    );
}
