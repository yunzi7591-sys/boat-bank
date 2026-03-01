"use client";

import { useBetStore } from '@/store/bet-store';
import { Button } from '@/components/ui/button';
import { unrollCombinations, BetType } from '@/lib/bet-logic';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FundAllocationView() {
    const { activeBetType, selections, addFormationToCart } = useBetStore();
    const [amount, setAmount] = useState(100);

    const unrolled = useMemo(() => unrollCombinations(activeBetType, selections), [activeBetType, selections]);

    if (unrolled.length === 0) {
        return (
            <div className="w-full mt-6 p-6 border-2 border-dashed border-neutral-200 rounded-xl text-center text-sm font-medium text-neutral-400 bg-neutral-50/50 transition-all">
                枠番を選択してください
            </div>
        );
    }

    const handleAddAmount = (add: number) => {
        setAmount((prev) => prev + add);
    };

    const handleAddToCart = () => {
        addFormationToCart(amount);
    }

    return (
        <div className="w-full mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-slate-800">
                    展開買い目 <span className="text-sm text-neutral-500 font-normal">({unrolled.length}点)</span>
                </h3>
                <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full shadow-sm">
                    {activeBetType}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pb-2 pr-2 custom-scrollbar">
                {unrolled.map((comb) => (
                    <div key={comb.id} className="flex justify-center items-center border border-slate-200 rounded-lg py-1.5 px-2 bg-white shadow-sm font-mono text-base font-bold text-slate-700">
                        {comb.id.split('-').map((n, i, arr) => (
                            <span key={i} className="flex items-center">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs text-white bg-boat-${n}`}>
                                    {n}
                                </span>
                                {i < arr.length - 1 && <span className="mx-0.5 text-neutral-300">-</span>}
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold text-slate-500">1点あたりの金額 (pt)</Label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min={100}
                            step={100}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="text-lg font-bold text-slate-900 border-slate-300 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" onClick={() => handleAddAmount(100)} className="flex-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">+100</Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddAmount(500)} className="flex-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">+500</Button>
                        <Button variant="outline" size="sm" onClick={() => handleAddAmount(1000)} className="flex-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">+1000</Button>
                        <Button variant="default" size="sm" onClick={() => setAmount(100)} className="flex-1 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700">クリア</Button>
                    </div>
                </div>

                <div className="flex justify-between items-center py-2 px-1">
                    <span className="text-sm font-bold text-slate-500">合計ベット額</span>
                    <span className="text-2xl font-black text-blue-700 tracking-tight">{(unrolled.length * amount).toLocaleString()} <span className="text-sm font-bold">pt</span></span>
                </div>

                <Button
                    className="w-full font-bold bg-blue-600 hover:bg-blue-700 h-14 text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    onClick={handleAddToCart}
                >
                    カートに追加
                </Button>
            </div>
        </div>
    );
}
