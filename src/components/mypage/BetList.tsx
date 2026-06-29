"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const BET_TYPE_LABELS: Record<string, string> = {
    "3TR": "3連単",
    "3PL": "3連複",
    "2TR": "2連単",
    "2PL": "2連複",
    WIN: "単勝",
};

export interface BetItem {
    id: string;
    placeName: string | null;
    raceNumber: number | null;
    raceDate: string | null;
    betType: string | null;
    combination: string | null;
    betAmount: number;
    hitAmount: number;
    refundAmount: number;
    isSettled: boolean;
    isHit: boolean;
}

interface RaceGroup {
    key: string;
    placeName: string | null;
    raceNumber: number | null;
    raceDate: string | null;
    bets: BetItem[];
    totalBet: number;
    totalPayout: number;
    anySettled: boolean;
    anyHit: boolean;
    anyRefund: boolean;
}

function groupByRace(items: BetItem[]): RaceGroup[] {
    const map = new Map<string, RaceGroup>();
    for (const bet of items) {
        const key = `${bet.placeName}-${bet.raceNumber}-${bet.raceDate}`;
        let g = map.get(key);
        if (!g) {
            g = {
                key,
                placeName: bet.placeName,
                raceNumber: bet.raceNumber,
                raceDate: bet.raceDate,
                bets: [],
                totalBet: 0,
                totalPayout: 0,
                anySettled: false,
                anyHit: false,
                anyRefund: false,
            };
            map.set(key, g);
        }
        g.bets.push(bet);
        g.totalBet += bet.betAmount;
        g.totalPayout += bet.hitAmount + bet.refundAmount;
        if (bet.isSettled) g.anySettled = true;
        if (bet.isHit) g.anyHit = true;
        if (bet.refundAmount > 0) g.anyRefund = true;
    }
    return Array.from(map.values());
}

const PAGE_SIZE = 5;

export function BetList({ items }: { items: BetItem[] }) {
    const [page, setPage] = useState(0);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const races = groupByRace(items);
    const totalPages = Math.ceil(races.length / PAGE_SIZE);
    const visible = races.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const toggle = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (races.length === 0) {
        return <p className="text-center text-[#64748d] py-8 bg-white rounded-lg border border-[#e5edf5]">登録した収支はありません</p>;
    }

    return (
        <div>
            <div className="space-y-2">
                {visible.map(race => {
                    const isOpen = expanded.has(race.key);
                    return (
                        <div
                            key={race.key}
                            className={`border rounded-lg overflow-hidden ${race.anySettled && race.anyHit ? 'bg-amber-50/70 border-amber-200' : race.anySettled && !race.anyHit && race.anyRefund ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white border-[#e5edf5]'}`}
                        >
                            <button
                                type="button"
                                onClick={() => toggle(race.key)}
                                className="w-full text-left p-3 hover:bg-black/[0.02] transition-colors"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold bg-[#061b31] text-white px-1.5 py-0.5 rounded">{race.placeName} {race.raceNumber}R</span>
                                        {race.raceDate && (
                                            <span className="text-[10px] text-[#64748d]">{new Date(race.raceDate).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
                                        )}
                                    </div>
                                    {!race.anySettled ? (
                                        <span className="text-[10px] text-[#64748d] bg-[#f6f8fa] px-1.5 py-0.5 rounded">結果待ち</span>
                                    ) : race.anyHit ? (
                                        <span className="text-[10px] font-bold text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded">的中</span>
                                    ) : race.anyRefund ? (
                                        <span className="text-[10px] font-bold text-[#ca8a04] bg-[#ca8a04]/10 px-1.5 py-0.5 rounded">返還</span>
                                    ) : (
                                        <span className="text-[10px] text-[#64748d] bg-[#f6f8fa] px-1.5 py-0.5 rounded">不的中</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748d]">
                                        <span>投資 {race.totalBet.toLocaleString()}円</span>
                                        {race.anySettled && (
                                            <>
                                                <span className="text-[#cbd5e1]">→</span>
                                                <span className={race.totalPayout > 0 ? "font-bold text-[#533afd]" : ""}>払戻 {race.totalPayout.toLocaleString()}円</span>
                                            </>
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-[#94a3b8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {isOpen && (
                                <div className="border-t border-black/[0.06] px-3 py-2 space-y-1.5 bg-white/40">
                                    <p className="text-[10px] font-bold text-[#94a3b8]">買い目</p>
                                    {race.bets.map(bet => {
                                        const label = bet.betType ? (BET_TYPE_LABELS[bet.betType] || bet.betType) : "";
                                        const payout = bet.hitAmount + bet.refundAmount;
                                        return (
                                            <div key={bet.id} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    {label && <span className="text-[10px] font-bold text-[#64748d] bg-[#f1f5f9] px-1.5 py-0.5 rounded">{label}</span>}
                                                    <span className={`font-bold tabular-nums ${bet.isSettled && bet.isHit ? 'text-[#533afd]' : 'text-[#061b31]'}`}>{bet.combination || "—"}</span>
                                                </div>
                                                <div className="text-[11px] text-[#64748d] tabular-nums">
                                                    {bet.betAmount.toLocaleString()}円
                                                    {bet.isSettled && (
                                                        <span className={payout > 0 ? "ml-1 font-bold text-[#533afd]" : "ml-1"}> → {payout.toLocaleString()}円</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-md text-[#64748d] hover:bg-[#f6f8fa] disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#64748d]">{page + 1} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="p-1.5 rounded-md text-[#64748d] hover:bg-[#f6f8fa] disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
