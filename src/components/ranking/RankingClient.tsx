"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Coins, Trophy } from "lucide-react";

interface RankEntry {
    id: string;
    name: string;
    role: string;
    value: number;
    sub: string;
}

function RankList({ list, type }: { list: RankEntry[]; type: "recovery" | "pt" }) {
    if (list.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <Trophy className="w-10 h-10 mx-auto text-[#e5edf5] mb-3" />
                <p className="text-[#64748d] font-semibold mb-1">ランキング集計中</p>
                <p className="text-xs text-[#64748d]">
                    {type === "recovery" ? "判定済みの予想が3R以上あるユーザーが表示されます" : "予想を販売してポイントを獲得しましょう"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {list.map((entry, index) => {
                const medalColors = [
                    "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
                    "bg-[#f6f8fa] text-[#64748d] ring-1 ring-[#e5edf5]",
                    "bg-orange-50 text-orange-500 ring-1 ring-orange-200",
                ];
                const medalColor = index < 3 ? medalColors[index] : "bg-[#f6f8fa] text-[#64748d]";

                return (
                    <Link href={`/users/${entry.id}`} key={entry.id}>
                        <div className={`bg-white border rounded-lg p-4 flex items-center justify-between transition-colors hover:border-[#b9b9f9] ${index === 0 ? 'border-amber-200 shadow-sm' : 'border-[#e5edf5]'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm ${medalColor}`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-[#061b31] text-[15px] flex items-center gap-1.5">{entry.name}{entry.role === 'ADMIN' && <span className="text-[8px] font-black bg-amber-400 text-amber-900 px-1 py-0.5 rounded leading-none">公式</span>}</p>
                                    <p className="text-[11px] text-[#64748d] font-medium">{entry.sub}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-lg font-light tabular-nums ${type === "recovery" && entry.value >= 100 ? 'text-[#533afd]' : 'text-[#061b31]'}`}>
                                    {type === "recovery" ? `${entry.value.toFixed(1)}%` : `${entry.value.toLocaleString()}pt`}
                                </p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export function RankingClient({
    recoveryAll,
    recoveryByVenue,
    ptAllRanking,
    ptMonthRanking,
    currentMonth,
}: {
    recoveryAll: RankEntry[];
    recoveryByVenue: { [venue: string]: RankEntry[] };
    ptAllRanking: RankEntry[];
    ptMonthRanking: RankEntry[];
    currentMonth: number;
}) {
    const [activeTab, setActiveTab] = useState<"recovery" | "pt">("recovery");
    const [ptPeriod, setPtPeriod] = useState<"all" | "month">("all");
    const [selectedVenue, setSelectedVenue] = useState<string>("all");

    const venueNames = Object.keys(recoveryByVenue).sort();
    const currentRecovery = selectedVenue === "all" ? recoveryAll : (recoveryByVenue[selectedVenue] || []);

    return (
        <div>
            {/* Main tabs */}
            <div className="grid grid-cols-2 mb-4 h-11 bg-white shadow-sm border border-[#e5edf5] rounded-lg p-1">
                <button
                    onClick={() => setActiveTab("recovery")}
                    className={`font-semibold text-sm rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "recovery" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    回収率
                </button>
                <button
                    onClick={() => setActiveTab("pt")}
                    className={`font-semibold text-sm rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "pt" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    <Coins className="w-3.5 h-3.5" />
                    獲得pt
                </button>
            </div>

            {activeTab === "recovery" && (
                <>
                    <select
                        value={selectedVenue}
                        onChange={(e) => setSelectedVenue(e.target.value)}
                        className="mb-3 w-full bg-white border border-[#e5edf5] rounded-lg px-3 py-2 text-sm font-bold text-[#061b31] focus:outline-none focus:ring-2 focus:ring-[#533afd]"
                    >
                        <option value="all">全場</option>
                        {venueNames.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                    <RankList list={currentRecovery} type="recovery" />
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

                    <RankList list={ptPeriod === "all" ? ptAllRanking : ptMonthRanking} type="pt" />
                </>
            )}
        </div>
    );
}
