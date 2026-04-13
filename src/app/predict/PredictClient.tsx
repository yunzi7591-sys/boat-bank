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

interface OddsMap {
    [oddsType: string]: { data: Record<string, number>; fetchedAt: string };
}

interface PredictClientProps {
    venue: { id: string; name: string } | null;
    raceNumber: number;
    racers: MockRacer[];
    userPoints?: number;
    isPrivate?: boolean;
    deadlineAt?: string | null;
    eventId?: string | null;
    eventPoints?: number | null;
    raceDate?: string | null;
}

export default function PredictClient({ venue, raceNumber, racers, userPoints, isPrivate, deadlineAt, eventId, eventPoints, raceDate }: PredictClientProps) {
    const { activeBetType, setBetType, cart, clearSelections } = useBetStore();
    const [viewCart, setViewCart] = useState(false);
    const [publishType, setPublishType] = useState<"internal" | "external" | null>(isPrivate ? null : null);
    const [odds, setOdds] = useState<OddsMap>({});

    useEffect(() => {
        if (!venue || !raceDate) return;
        const fetchOdds = () => {
            fetch(`/api/odds?placeName=${encodeURIComponent(venue.name)}&raceNumber=${raceNumber}&raceDate=${encodeURIComponent(raceDate)}`)
                .then(r => r.json())
                .then(data => { if (data && !data.error) setOdds(data); })
                .catch(() => {});
        };
        fetchOdds();
        const timer = setInterval(fetchOdds, 60_000);
        return () => clearInterval(timer);
    }, [venue, raceNumber, raceDate]);

    const venueName = venue?.name || '不明な会場';

    // 公開予想の場合、最初に投稿先選択を表示
    if (!isPrivate && !publishType) {
        return (
            <div className="min-h-screen bg-white flex flex-col font-sans">
                <header className="bg-white px-4 py-3 border-b border-[#e5edf5] sticky top-0 z-10 flex items-center gap-2">
                    <Link href={venue ? `/place/${venue.id}` : "/"}>
                        <Button variant="ghost" size="icon" className="text-[#64748d] hover:bg-[#f6f8fa] h-9 w-9">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-base font-bold text-[#061b31]">{venueName} {raceNumber}R</h1>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-6">
                    <h2 className="text-lg font-bold text-[#061b31] mb-2">投稿先を選択</h2>
                    <p className="text-sm text-[#64748d] mb-8 text-center">予想をどこに公開しますか？</p>
                    <div className="w-full max-w-sm flex flex-col gap-3">
                        <button
                            onClick={() => setPublishType("internal")}
                            className="w-full p-5 bg-white border-2 border-[#e5edf5] rounded-lg text-left hover:border-[#533afd] transition-colors"
                            style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}
                        >
                            <h3 className="text-base font-bold text-[#061b31] mb-1">自サイトで販売</h3>
                            <p className="text-xs text-[#64748d]">買い目を公開して他ユーザーに販売します</p>
                        </button>
                        <button
                            onClick={() => setPublishType("external")}
                            className="w-full p-5 bg-white border-2 border-[#e5edf5] rounded-lg text-left hover:border-[#533afd] transition-colors"
                            style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}
                        >
                            <h3 className="text-base font-bold text-[#061b31] mb-1">他サイトへ誘導</h3>
                            <p className="text-xs text-[#64748d]">外部サイトのURLを設定し、買い目は収支記録用に非公開で保存</p>
                            <span className="inline-block mt-2 text-[10px] font-bold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded">100pt消費</span>
                        </button>
                    </div>
                </main>
            </div>
        );
    }

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
                        <span className="text-[10px] font-bold text-slate-400 leading-none mb-0.5 tracking-wider">
                            {eventId ? 'EVENT BETTING' : 'VOTING UI'}
                        </span>
                        <h1 className="text-sm font-black tracking-tight leading-none">
                            {venueName} {raceNumber}R
                        </h1>
                        {eventId && eventPoints != null && (
                            <span className="text-[10px] font-bold text-amber-400 leading-none mt-0.5">
                                限定pt残高: {eventPoints.toLocaleString()}pt
                            </span>
                        )}
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
                        <div className="mb-6">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">ベットリスト</h2>
                                <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">{cart.length}件</span>
                            </div>
                            {cart.length > 0 && (() => {
                                const totalCombs = cart.reduce((sum, f) => sum + f.combinations.length, 0);
                                const totalAmt = cart.reduce((sum, f) => sum + f.combinations.reduce((s, c) => s + c.amount, 0), 0);
                                return (
                                    <div className="mt-3 bg-slate-900 rounded-lg px-4 py-3 flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400">合計 {totalCombs}点</span>
                                        <span className="text-lg font-black text-white">¥{totalAmt.toLocaleString()}</span>
                                    </div>
                                );
                            })()}
                        </div>
                        <Suspense fallback={
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mb-4"></div>
                                <p className="text-sm font-bold">カートを読み込み中...</p>
                            </div>
                        }>
                            <BetListCart deadlineAt={deadlineAt ? new Date(deadlineAt) : null} userPoints={userPoints} initialPublishType={publishType || undefined} eventId={eventId || undefined} eventPoints={eventPoints ?? undefined} odds={odds} />
                        </Suspense>
                    </div>
                )}
            </main>
        </div>
    );
}
