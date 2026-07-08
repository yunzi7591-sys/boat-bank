"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Coins, Trophy, Wallet } from "lucide-react";

interface RankEntry {
    id: string;
    name: string;
    role: string;
    value: number;
    sub: string;
    races?: number;
}

type RankType = "recovery" | "pt" | "balance";

function formatValue(entry: RankEntry, type: RankType): string {
    if (type === "recovery") return `${entry.value.toFixed(1)}%`;
    if (type === "balance") return `${entry.value >= 0 ? "+" : "−"}${Math.abs(entry.value).toLocaleString()}円`;
    return `${entry.value.toLocaleString()}pt`;
}

function valueColor(entry: RankEntry, type: RankType): string {
    if (type === "recovery") return entry.value >= 100 ? "text-[#533afd]" : "text-[#061b31]";
    if (type === "balance") return entry.value > 0 ? "text-[#533afd]" : entry.value < 0 ? "text-red-500" : "text-[#061b31]";
    return "text-[#061b31]";
}

function RankRow({ entry, rank, type, isYou }: { entry: RankEntry; rank: number; type: RankType; isYou?: boolean }) {
    const medalColors = [
        "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
        "bg-[#f6f8fa] text-[#64748d] ring-1 ring-[#e5edf5]",
        "bg-orange-50 text-orange-500 ring-1 ring-orange-200",
    ];
    const medalColor = rank <= 3 ? medalColors[rank - 1] : "bg-[#f6f8fa] text-[#64748d]";

    return (
        <Link href={`/users/${entry.id}`}>
            <div className={`border rounded-lg p-3 flex items-center justify-between transition-colors hover:border-[#b9b9f9] ${rank === 1 ? 'border-amber-200 shadow-sm' : 'border-[#e5edf5]'} ${isYou ? 'bg-[#533afd]/5 border-[#533afd]/30' : 'bg-white'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm ${isYou ? 'bg-[#533afd] text-white' : medalColor}`}>
                        {rank}
                    </div>
                    <div>
                        <p className="font-bold text-[#061b31] text-sm flex items-center gap-1.5">
                            {entry.name}
                            {entry.role === 'ADMIN' && <span className="text-[8px] font-black bg-amber-400 text-amber-900 px-1 py-0.5 rounded leading-none">公式</span>}
                            {isYou && <span className="text-[8px] font-black bg-[#533afd] text-white px-1 py-0.5 rounded leading-none">YOU</span>}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-base font-light tabular-nums ${valueColor(entry, type)}`}>
                        {formatValue(entry, type)}
                    </p>
                    {(type === "recovery" || type === "balance") && (
                        <p className="text-[10px] text-[#64748d] tabular-nums leading-none mt-0.5">{entry.sub}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}

function PeriodToggle({ period, onChange, allLabel, monthLabel }: { period: "all" | "month"; onChange: (p: "all" | "month") => void; allLabel: string; monthLabel: string }) {
    return (
        <div className="flex gap-1 mb-3 bg-[#f6f8fa] rounded-md p-0.5 w-fit">
            <button
                onClick={() => onChange("all")}
                className={`text-xs font-bold px-3 py-1.5 rounded ${period === "all" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}
            >
                {allLabel}
            </button>
            <button
                onClick={() => onChange("month")}
                className={`text-xs font-bold px-3 py-1.5 rounded ${period === "month" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}
            >
                {monthLabel}
            </button>
        </div>
    );
}

function RankList({ list, type, currentUserId, minRaces = 10 }: { list: RankEntry[]; type: RankType; currentUserId?: string; minRaces?: number }) {
    if (list.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <Trophy className="w-10 h-10 mx-auto text-[#e5edf5] mb-3" />
                <p className="text-[#64748d] font-semibold mb-1">ランキング集計中</p>
                <p className="text-xs text-[#64748d]">
                    {type === "recovery" || type === "balance" ? `判定済みの予想が${minRaces}R以上あるユーザーが表示されます` : "予想を公開してポイントを獲得しましょう"}
                </p>
            </div>
        );
    }

    const top10 = list.slice(0, 10);
    const myIndex = currentUserId ? list.findIndex(e => e.id === currentUserId) : -1;
    const inTop10 = myIndex >= 0 && myIndex < 10;

    return (
        <div className="flex flex-col gap-1.5">
            {top10.map((entry, index) => (
                <RankRow key={entry.id} entry={entry} rank={index + 1} type={type} isYou={currentUserId === entry.id} />
            ))}

            {currentUserId && myIndex >= 0 && !inTop10 && (
                <>
                    <div className="text-center text-[10px] text-[#64748d] py-1">・・・</div>
                    <RankRow entry={list[myIndex]} rank={myIndex + 1} type={type} isYou />
                </>
            )}

            {currentUserId && myIndex < 0 && (
                <div className="mt-2 text-center text-xs text-[#64748d] bg-[#f8fafc] rounded-lg p-3">
                    あなたはまだランキングに入っていません
                </div>
            )}
        </div>
    );
}

export function RankingClient({
    recoveryAll,
    recoveryAllMonth,
    recoveryByVenue,
    recoveryByVenueMonth,
    balanceAll,
    balanceAllMonth,
    ptAllRanking,
    ptMonthRanking,
    currentMonth,
    eventRanking = [],
    eventName = "",
    eventEnded = false,
    currentUserId,
}: {
    recoveryAll: RankEntry[];
    recoveryAllMonth: RankEntry[];
    recoveryByVenue: { [venue: string]: RankEntry[] };
    recoveryByVenueMonth: { [venue: string]: RankEntry[] };
    balanceAll: RankEntry[];
    balanceAllMonth: RankEntry[];
    ptAllRanking: RankEntry[];
    ptMonthRanking: RankEntry[];
    currentMonth: number;
    eventRanking?: RankEntry[];
    eventName?: string;
    eventEnded?: boolean;
    currentUserId?: string;
}) {
    const hasEvent = eventRanking.length > 0;
    const [activeTab, setActiveTab] = useState<"recovery" | "balance" | "pt" | "event">("recovery");
    const [recoveryPeriod, setRecoveryPeriod] = useState<"all" | "month">("all");
    const [balancePeriod, setBalancePeriod] = useState<"all" | "month">("all");
    const [ptPeriod, setPtPeriod] = useState<"all" | "month">("all");
    const [selectedVenue, setSelectedVenue] = useState<string>("all");
    const [recoveryMinRaces, setRecoveryMinRaces] = useState<number>(100);

    const venueNames = Object.keys(recoveryByVenue).sort();
    const recoverySource = recoveryPeriod === "all"
        ? { all: recoveryAll, byVenue: recoveryByVenue }
        : { all: recoveryAllMonth, byVenue: recoveryByVenueMonth };
    const recoveryBase = selectedVenue === "all" ? recoverySource.all : (recoverySource.byVenue[selectedVenue] || []);
    const currentRecovery = recoveryBase.filter(e => (e.races ?? 0) >= recoveryMinRaces);

    return (
        <div>
            {/* Main tabs: 回収率 → 収支 → 獲得pt → 限定pt */}
            <div className={`grid ${hasEvent ? 'grid-cols-4' : 'grid-cols-3'} mb-4 h-11 bg-white shadow-sm border border-[#e5edf5] rounded-lg p-1`}>
                <button
                    onClick={() => setActiveTab("recovery")}
                    className={`font-semibold text-sm rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === "recovery" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    回収率
                </button>
                <button
                    onClick={() => setActiveTab("balance")}
                    className={`font-semibold text-sm rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === "balance" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    <Wallet className="w-3.5 h-3.5" />
                    収支
                </button>
                <button
                    onClick={() => setActiveTab("pt")}
                    className={`font-semibold text-sm rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === "pt" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    <Coins className="w-3.5 h-3.5" />
                    獲得pt
                </button>
                {hasEvent && (
                    <button
                        onClick={() => setActiveTab("event")}
                        className={`font-semibold text-xs rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === "event" ? "bg-amber-500 text-white" : "text-amber-600"}`}
                    >
                        🏆 限定pt
                    </button>
                )}
            </div>

            {activeTab === "event" && (
                <>
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <span className="text-sm font-bold text-amber-800">{eventName}</span>
                        {eventEnded && <span className="text-[10px] text-amber-600 ml-2">（終了）</span>}
                    </div>
                    <RankList list={eventRanking} type="pt" currentUserId={currentUserId} />
                </>
            )}

            {activeTab === "recovery" && (
                <>
                    <PeriodToggle period={recoveryPeriod} onChange={setRecoveryPeriod} allLabel="全期間" monthLabel={`${currentMonth}月`} />
                    <div className="flex gap-2 mb-3">
                        <select
                            value={selectedVenue}
                            onChange={(e) => setSelectedVenue(e.target.value)}
                            className="flex-1 bg-white border border-[#e5edf5] rounded-lg px-3 py-2 text-sm font-bold text-[#061b31] focus:outline-none focus:ring-2 focus:ring-[#533afd]"
                        >
                            <option value="all">全場</option>
                            {venueNames.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                        <select
                            value={recoveryMinRaces}
                            onChange={(e) => setRecoveryMinRaces(Number(e.target.value))}
                            className="w-32 bg-white border border-[#e5edf5] rounded-lg px-3 py-2 text-sm font-bold text-[#061b31] focus:outline-none focus:ring-2 focus:ring-[#533afd]"
                        >
                            <option value={100}>100R以上</option>
                            <option value={10}>10R以上</option>
                        </select>
                    </div>
                    <RankList list={currentRecovery} type="recovery" currentUserId={currentUserId} minRaces={recoveryMinRaces} />
                    <p className="mt-3 text-[10px] text-[#64748d] leading-relaxed text-center px-2">
                        ※ このランキングは、判定済みの予想が{recoveryMinRaces}R以上あるユーザーが対象です
                    </p>
                </>
            )}

            {activeTab === "balance" && (
                <>
                    <PeriodToggle period={balancePeriod} onChange={setBalancePeriod} allLabel="全期間" monthLabel={`${currentMonth}月`} />
                    <RankList list={balancePeriod === "all" ? balanceAll : balanceAllMonth} type="balance" currentUserId={currentUserId} />
                </>
            )}

            {activeTab === "pt" && (
                <>
                    <div className="flex gap-1 mb-3 bg-[#f6f8fa] rounded-md p-0.5 w-fit">
                        <button
                            onClick={() => setPtPeriod("all")}
                            className={`text-xs font-bold px-3 py-1.5 rounded ${ptPeriod === "all" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}
                        >
                            通算
                        </button>
                        <button
                            onClick={() => setPtPeriod("month")}
                            className={`text-xs font-bold px-3 py-1.5 rounded ${ptPeriod === "month" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}
                        >
                            {currentMonth}月
                        </button>
                    </div>

                    <RankList list={ptPeriod === "all" ? ptAllRanking : ptMonthRanking} type="pt" currentUserId={currentUserId} />
                </>
            )}
        </div>
    );
}
