"use client";

import { useMemo } from "react";

interface EventBetItem {
    id: string;
    placeName: string;
    raceNumber: number;
    raceDate: string;
    betType: string;
    combination: string;
    betAmount: number;
    hitAmount: number;
    refundAmount: number;
    isSettled: boolean;
    isHit: boolean;
}

interface DayData {
    date: string;
    label: string;
    pnl: number;
    cumulative: number;
}

export function EventBetHistory({ bets, initialPt }: { bets: EventBetItem[]; initialPt: number }) {
    // 日別の収支を計算
    const { dailyData, raceGroups } = useMemo(() => {
        // レースごとにグループ化
        const raceMap = new Map<string, EventBetItem[]>();
        for (const bet of bets) {
            const key = `${bet.raceDate.slice(0, 10)}-${bet.placeName}-${bet.raceNumber}`;
            const arr = raceMap.get(key) || [];
            arr.push(bet);
            raceMap.set(key, arr);
        }

        // レースグループを配列化
        const groups = Array.from(raceMap.entries()).map(([key, items]) => {
            const totalBet = items.reduce((s, i) => s + i.betAmount, 0);
            const totalHit = items.reduce((s, i) => s + i.hitAmount, 0);
            const totalRefund = items.reduce((s, i) => s + i.refundAmount, 0);
            const allSettled = items.every(i => i.isSettled);
            const pnl = totalHit + totalRefund - totalBet;
            return {
                key,
                date: items[0].raceDate.slice(0, 10),
                placeName: items[0].placeName,
                raceNumber: items[0].raceNumber,
                totalBet,
                totalReturn: totalHit + totalRefund,
                pnl,
                allSettled,
                anyHit: items.some(i => i.isHit),
            };
        });

        // 日別PnL
        const dayMap = new Map<string, number>();
        for (const g of groups) {
            if (!g.allSettled) continue;
            dayMap.set(g.date, (dayMap.get(g.date) || 0) + g.pnl);
        }

        const days = Array.from(dayMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, pnl]) => ({ date, pnl }));

        let cumulative = 0;
        const dailyData: DayData[] = days.map(d => {
            cumulative += d.pnl;
            const md = new Date(d.date);
            return {
                date: d.date,
                label: `${md.getMonth() + 1}/${md.getDate()}`,
                pnl: d.pnl,
                cumulative,
            };
        });

        return { dailyData, raceGroups: groups };
    }, [bets]);

    // グラフの最大・最小値
    const maxVal = Math.max(...dailyData.map(d => d.cumulative), 0);
    const minVal = Math.min(...dailyData.map(d => d.cumulative), 0);
    const range = maxVal - minVal || 1;

    return (
        <div className="space-y-4">
            {/* 日別累計 折れ線グラフ */}
            {dailyData.length > 0 && (() => {
                const W = 320;
                const H = 140;
                const PAD = { top: 10, right: 10, bottom: 24, left: 10 };
                const chartW = W - PAD.left - PAD.right;
                const chartH = H - PAD.top - PAD.bottom;
                const allValues = [0, ...dailyData.map(d => d.cumulative)];
                const yMax = Math.max(...allValues);
                const yMin = Math.min(...allValues);
                const yRange = yMax - yMin || 1;
                const toX = (i: number) => PAD.left + (i / Math.max(dailyData.length - 1, 1)) * chartW;
                const toY = (v: number) => PAD.top + chartH - ((v - yMin) / yRange) * chartH;
                const zeroY = toY(0);
                const points = dailyData.map((d, i) => `${toX(i)},${toY(d.cumulative)}`).join(' ');
                const fillPoints = `${toX(0)},${zeroY} ${points} ${toX(dailyData.length - 1)},${zeroY}`;
                const lastVal = dailyData[dailyData.length - 1]?.cumulative || 0;
                const isPositive = lastVal >= 0;

                return (
                    <div className="bg-white rounded-lg border border-[#e5edf5] p-4" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-[#64748d]">累計損益</h3>
                            <span className={`text-sm font-bold ${isPositive ? 'text-[#533afd]' : 'text-[#ea2261]'}`}>
                                {isPositive ? '+' : ''}{lastVal.toLocaleString()}円
                            </span>
                        </div>
                        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                            {/* ゼロライン */}
                            <line x1={PAD.left} y1={zeroY} x2={W - PAD.right} y2={zeroY} stroke="#e5edf5" strokeWidth="1" strokeDasharray="4 2" />
                            {/* 塗り */}
                            <polygon points={fillPoints} fill={isPositive ? 'rgba(83,58,253,0.1)' : 'rgba(234,34,97,0.1)'} />
                            {/* 線 */}
                            <polyline points={points} fill="none" stroke={isPositive ? '#533afd' : '#ea2261'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {/* ドット */}
                            {dailyData.map((d, i) => (
                                <circle key={d.date} cx={toX(i)} cy={toY(d.cumulative)} r="3.5" fill="white" stroke={d.cumulative >= 0 ? '#533afd' : '#ea2261'} strokeWidth="2" />
                            ))}
                            {/* 日付ラベル */}
                            {dailyData.map((d, i) => (
                                <text key={`l-${d.date}`} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748d">{d.label}</text>
                            ))}
                        </svg>
                    </div>
                );
            })()}

            {/* レースごとの収支 */}
            <div className="bg-white rounded-lg border border-[#e5edf5] p-4" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                <h3 className="text-xs font-bold text-[#64748d] mb-3">レース別収支</h3>
                {raceGroups.length === 0 ? (
                    <p className="text-center text-[#64748d] text-xs py-6">まだ賭けがありません</p>
                ) : (
                    <div className="space-y-1.5">
                        {/* ヘッダー */}
                        <div className="grid grid-cols-[1fr_60px_60px_60px] gap-1 text-[9px] font-bold text-[#64748d] pb-1 border-b border-[#e5edf5]">
                            <span>レース</span>
                            <span className="text-right">投資</span>
                            <span className="text-right">回収</span>
                            <span className="text-right">利益</span>
                        </div>
                        {raceGroups.map(g => {
                            const dateObj = new Date(g.date);
                            const dateLabel = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                            return (
                                <div key={g.key} className={`grid grid-cols-[1fr_60px_60px_60px] gap-1 text-[11px] py-1.5 rounded ${g.anyHit ? 'bg-amber-50/70' : ''}`}>
                                    <span className="font-bold text-[#061b31]">
                                        <span className="text-[9px] text-[#64748d] mr-1">{dateLabel}</span>
                                        {g.placeName} {g.raceNumber}R
                                    </span>
                                    <span className="text-right tabular-nums text-[#64748d]">{g.totalBet.toLocaleString()}</span>
                                    <span className="text-right tabular-nums text-[#061b31]">
                                        {g.allSettled ? g.totalReturn.toLocaleString() : '-'}
                                    </span>
                                    <span className={`text-right tabular-nums font-bold ${!g.allSettled ? 'text-[#64748d]' : g.pnl > 0 ? 'text-[#533afd]' : g.pnl < 0 ? 'text-[#ea2261]' : 'text-[#64748d]'}`}>
                                        {!g.allSettled ? '待ち' : `${g.pnl >= 0 ? '+' : ''}${g.pnl.toLocaleString()}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
