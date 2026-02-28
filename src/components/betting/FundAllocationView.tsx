"use client";

import { useBetStore } from '@/store/bet-store';
import { Button } from '@/components/ui/button';
import { unrollCombinations, BetType } from '@/lib/bet-logic';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FundAllocationView() {
    const { activeBetType, selections, addFormationToCart } = useBetStore();

    const unrolled = useMemo(() => unrollCombinations(activeBetType, selections), [activeBetType, selections]);

    if (unrolled.length === 0) {
        return (
            <div className="w-full max-w-sm mt-6 p-4 border rounded-md text-center text-sm text-neutral-500 bg-neutral-50 transition-all">
                枠番を選択してください
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-lg">
                    展開買い目 ({unrolled.length}点)
                </h3>
                <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {activeBetType}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                {unrolled.map((comb) => (
                    <div key={comb.id} className="flex justify-center border rounded py-1 px-2 bg-white font-mono text-lg font-bold">
                        {comb.id}
                    </div>
                ))}
            </div>

            <div className="mt-2 pt-4 border-t border-dashed">
                <Button
                    className="w-full font-bold bg-blue-600 hover:bg-blue-700 h-12 text-md"
                    onClick={addFormationToCart}
                >
                    ベットリストに追加 ({unrolled.length}点)
                </Button>
            </div>
        </div>
    );
}
