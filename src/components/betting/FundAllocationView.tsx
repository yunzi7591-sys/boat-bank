"use client";

import { useBetStore } from '@/store/bet-store';
import { Button } from '@/components/ui/button';
import { unrollCombinations, BetType, BOAT_COLORS } from '@/lib/bet-logic';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FundAllocationView() {
    const { activeBetType, selections, addFormationToCart } = useBetStore();
    const [amount, setAmount] = useState(100);
    const [inputValue, setInputValue] = useState("1");

    const unrolled = useMemo(() => unrollCombinations(activeBetType, selections), [activeBetType, selections]);

    if (unrolled.length === 0) {
        return (
            <div className="w-full mt-6 p-6 border-2 border-dashed border-neutral-200 rounded-xl text-center text-sm font-medium text-neutral-400 bg-neutral-50/50 transition-all">
                枠番を選択してください
            </div>
        );
    }

    const handleAddAmount = (add: number) => {
        setAmount((prev) => {
            const next = prev + add;
            setInputValue(String(next / 100));
            return next;
        });
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
                        {comb.id.split(/[-=]/).map((n, i, arr) => {
                            const colorObj = BOAT_COLORS.find(c => c.no === Number(n));
                            return (
                                <span key={i} className="flex items-center">
                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${colorObj?.colorCls || 'bg-slate-200 text-slate-800'}`}>
                                        {n}
                                    </span>
                                    {i < arr.length - 1 && <span className="mx-0.5 text-neutral-300">-</span>}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold text-slate-500">1点あたりの金額</Label>
                    <div className="flex items-center gap-0 bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <input
                            ref={(el) => { if (el) el.setAttribute('inputmode', 'numeric'); }}
                            type="number"
                            min={0}
                            value={amount}
                            onChange={(e) => {
                                const v = Math.max(0, Math.floor(Number(e.target.value)));
                                setAmount(v);
                                setInputValue(String(v));
                            }}
                            className="flex-1 text-xl font-bold text-slate-900 px-3 py-2 text-right border-none outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ fontSize: '20px' }}
                        />
                        <span className="text-base font-bold text-slate-400 pr-3 whitespace-nowrap">円</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" onClick={() => { setAmount(p => { const n = p + 100; setInputValue(String(n)); return n; }); }} className="flex-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">+100</Button>
                        <Button variant="outline" size="sm" onClick={() => { setAmount(p => { const n = p + 500; setInputValue(String(n)); return n; }); }} className="flex-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">+500</Button>
                        <Button variant="outline" size="sm" onClick={() => { setAmount(p => { const n = p + 1000; setInputValue(String(n)); return n; }); }} className="flex-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50">+1000</Button>
                        <Button variant="default" size="sm" onClick={() => { setAmount(0); setInputValue("0"); }} className="flex-1 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700">C</Button>
                    </div>
                </div>

                <div className="flex justify-between items-center py-2 px-1">
                    <span className="text-sm font-bold text-slate-500">合計ベット額</span>
                    <span className="text-2xl font-black text-blue-700 tracking-tight">{(unrolled.length * amount).toLocaleString()}<span className="text-sm font-bold ml-0.5">円</span></span>
                    <span className="text-xs text-slate-400 ml-1">({unrolled.length}点 × {amount.toLocaleString()}円)</span>
                </div>

                <Button
                    className="w-full font-bold bg-blue-600 hover:bg-blue-700 h-14 text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                    onClick={handleAddToCart}
                    disabled={amount <= 0}
                >
                    カートに追加
                </Button>
            </div>
        </div>
    );
}
