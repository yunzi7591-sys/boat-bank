"use client";

import { useBetStore } from '@/store/bet-store';
import { Button } from '@/components/ui/button';
import { unrollCombinations, BOAT_COLORS } from '@/lib/bet-logic';
import { memo, useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OddsMap {
    [oddsType: string]: { data: Record<string, number>; fetchedAt: string };
}

/**
 * 金額入力（一括用）- memo化してフォーカス維持
 */
const AmountInput = memo(function AmountInput({
    onAmountChange,
}: {
    onAmountChange: (amount: number) => void;
}) {
    const [text, setText] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = e.target.value.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
        const raw = normalized.replace(/[^0-9]/g, '');
        setText(raw);
        onAmountChange((parseInt(raw, 10) || 0) * 100);
    };

    return (
        <div className="flex flex-col gap-2">
            <Label className="text-xs font-bold text-slate-500">1点あたりの金額</Label>
            <div className="flex items-center gap-0 bg-white rounded-lg border border-slate-200">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    value={text}
                    placeholder="0"
                    onChange={handleChange}
                    onFocus={() => {
                        setTimeout(() => {
                            inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                        }, 300);
                    }}
                    style={{
                        fontSize: '16px',
                        touchAction: 'manipulation',
                        WebkitUserSelect: 'text',
                        userSelect: 'text',
                    }}
                    className="flex-1 font-bold text-slate-900 px-3 py-3 text-right bg-transparent rounded-lg appearance-none border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0"
                />
                <span className="text-base font-bold text-slate-400 pr-3 whitespace-nowrap select-none">00円</span>
            </div>
        </div>
    );
});

interface FundAllocationViewProps {
    odds?: OddsMap;
}

export function FundAllocationView({ odds }: FundAllocationViewProps) {
    const { activeBetType, selections, addFormationToCart } = useBetStore();
    const [amount, setAmount] = useState(0);
    const [mode, setMode] = useState<"bulk" | "individual">("bulk");
    const [individualAmounts, setIndividualAmounts] = useState<Record<string, number>>({});

    const unrolled = useMemo(() => unrollCombinations(activeBetType, selections), [activeBetType, selections]);

    // モード切替時に個別金額を初期化
    const switchMode = (newMode: "bulk" | "individual") => {
        if (newMode === "individual" && mode === "bulk") {
            // 一括金額を個別に適用
            const init: Record<string, number> = {};
            for (const c of unrolled) {
                init[c.id] = amount;
            }
            setIndividualAmounts(init);
        }
        setMode(newMode);
    };

    // オッズ取得
    const getOdds = (combId: string): number | null => {
        if (!odds) return null;
        const entry = odds[activeBetType];
        if (!entry?.data) return null;
        return entry.data[combId] || null;
    };

    if (unrolled.length === 0) {
        return (
            <div className="w-full mt-6 p-6 border-2 border-dashed border-neutral-200 rounded-xl text-center text-sm font-medium text-neutral-400 bg-neutral-50/50 transition-all">
                枠番を選択してください
            </div>
        );
    }

    const individualTotal = Object.values(individualAmounts).reduce((s, v) => s + v, 0);
    const bulkTotal = unrolled.length * amount;
    const totalAmount = mode === "bulk" ? bulkTotal : individualTotal;

    const handleAddToCart = () => {
        if (mode === "individual") {
            // 個別金額でカートに追加
            const { activeBetType: bt, selections: sel } = useBetStore.getState();
            const combs = unrollCombinations(bt, sel);
            if (combs.length === 0) return;

            const combinationsWithAmount = combs.map(c => ({
                ...c,
                amount: individualAmounts[c.id] || 0,
            }));

            const generateId = () => Math.random().toString(36).substring(2, 9);
            const newFormation = {
                id: generateId(),
                betType: bt,
                selections: JSON.parse(JSON.stringify(sel)),
                combinations: combinationsWithAmount,
                totalExpectedAmount: 0,
                isIndividualAmount: true,
            };

            useBetStore.setState((state) => ({
                cart: [...state.cart, newFormation],
                selections: { first: [], second: [], third: [] },
            }));

            const total = combinationsWithAmount.reduce((s, c) => s + c.amount, 0);
            const { toast } = require('sonner');
            toast.success(`カートに追加しました（${combs.length}点）`, {
                position: 'top-center',
                description: `${total > 0 ? `${total.toLocaleString()}円` : '金額未設定'}`,
                duration: 2000,
            });

            setIndividualAmounts({});
            setMode("bulk");
        } else {
            addFormationToCart(amount);
        }
    };

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

            {/* モード切替 */}
            <div className="flex bg-slate-100 rounded-md p-0.5 w-fit">
                <button
                    onClick={() => switchMode("bulk")}
                    className={cn(
                        "text-[11px] font-bold px-3 py-1.5 rounded transition-all",
                        mode === "bulk" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                    )}
                >
                    一括金額
                </button>
                <button
                    onClick={() => switchMode("individual")}
                    className={cn(
                        "text-[11px] font-bold px-3 py-1.5 rounded transition-all",
                        mode === "individual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                    )}
                >
                    個別設定
                </button>
            </div>

            {mode === "bulk" ? (
                <>
                    {/* 買い目一覧（コンパクト） */}
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pb-2 pr-2">
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
                        <AmountInput onAmountChange={setAmount} />
                        <div className="flex justify-between items-center py-2 px-1">
                            <span className="text-sm font-bold text-slate-500">合計ベット額</span>
                            <span className="text-2xl font-black text-blue-700 tracking-tight">{bulkTotal.toLocaleString()}<span className="text-sm font-bold ml-0.5">円</span></span>
                            <span className="text-xs text-slate-400 ml-1">({unrolled.length}点 × {amount.toLocaleString()}円)</span>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* 個別設定モード */}
                    <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
                        {unrolled.map((comb) => {
                            const oddsVal = getOdds(comb.id);
                            const amt = individualAmounts[comb.id] || 0;
                            return (
                                <div key={comb.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                                    {/* 買い目番号 */}
                                    <div className="flex items-center gap-0.5 min-w-[70px]">
                                        {comb.id.split(/[-=]/).map((n, i, arr) => {
                                            const colorObj = BOAT_COLORS.find(c => c.no === Number(n));
                                            return (
                                                <span key={i} className="flex items-center">
                                                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${colorObj?.colorCls || 'bg-slate-200 text-slate-800'}`}>
                                                        {n}
                                                    </span>
                                                    {i < arr.length - 1 && <span className="mx-0.5 text-neutral-300 text-xs">-</span>}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* オッズ */}
                                    <div className="min-w-[50px] text-right">
                                        {oddsVal ? (
                                            <span className="text-[11px] font-bold text-amber-600">{oddsVal.toFixed(1)}倍</span>
                                        ) : (
                                            <span className="text-[10px] text-slate-300">-</span>
                                        )}
                                    </div>

                                    {/* 金額入力 */}
                                    <div className="flex-1 flex items-center justify-end">
                                        <div className="w-28 flex items-center bg-white border border-slate-200 rounded-md focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={amt > 0 ? Math.floor(amt / 100) : ''}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                                    setIndividualAmounts(prev => ({ ...prev, [comb.id]: (parseInt(raw) || 0) * 100 }));
                                                }}
                                                placeholder="0"
                                                style={{ fontSize: '16px' }}
                                                className="flex-1 w-0 h-8 text-right font-bold text-sm bg-transparent px-2 appearance-none outline-none border-0"
                                            />
                                            <span className="text-sm font-bold text-slate-400 pr-2 whitespace-nowrap select-none">00円</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* オッズ注意書き */}
                    {odds && Object.keys(odds).length > 0 && odds[activeBetType] && (
                        <div className="text-center">
                            <p className="text-[10px] text-amber-500">
                                参考オッズ（{new Date(odds[activeBetType].fetchedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}時点） / 確定オッズとは異なります
                            </p>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center py-2 px-1">
                            <span className="text-sm font-bold text-slate-500">合計ベット額</span>
                            <span className="text-2xl font-black text-blue-700 tracking-tight">{individualTotal.toLocaleString()}<span className="text-sm font-bold ml-0.5">円</span></span>
                        </div>
                    </div>
                </>
            )}

            <Button
                className="w-full font-bold bg-blue-600 hover:bg-blue-700 h-14 text-lg rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                onClick={handleAddToCart}
                disabled={totalAmount <= 0}
            >
                カートに追加
            </Button>
        </div>
    );
}
