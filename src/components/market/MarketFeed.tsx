"use client";

import { useState } from "react";
import { TimelineCard } from "./TimelineCard";

type SortMode = "popular" | "new";

function SortToggle({ value, onChange }: { value: SortMode; onChange: (v: SortMode) => void }) {
    return (
        <div className="flex gap-1 bg-[#f6f8fa] rounded-md p-0.5">
            <button
                onClick={() => onChange("popular")}
                className={`text-[10px] font-bold px-2 py-1 rounded ${value === "popular" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}
            >
                人気順
            </button>
            <button
                onClick={() => onChange("new")}
                className={`text-[10px] font-bold px-2 py-1 rounded ${value === "new" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"}`}
            >
                新着順
            </button>
        </div>
    );
}

export function MarketFeed({
    predictions,
    currentUserId,
    followingIds = [],
}: {
    predictions: any[];
    currentUserId?: string;
    followingIds?: string[];
}) {
    const followingSet = new Set(followingIds);
    const [paidSort, setPaidSort] = useState<SortMode>("new");
    const [freeSort, setFreeSort] = useState<SortMode>("new");

    // 分類
    const paid = predictions.filter(p => p.publishType === "internal" && p.price > 0);
    const free = predictions.filter(p => p.publishType === "internal" && p.price === 0);
    const external = predictions.filter(p => p.publishType === "external");

    // ソート
    const sortFn = (a: any, b: any, mode: SortMode) => {
        if (mode === "popular") {
            return (b._count?.transactions || 0) - (a._count?.transactions || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    const sortedPaid = [...paid].sort((a, b) => sortFn(a, b, paidSort));
    const sortedFree = [...free].sort((a, b) => sortFn(a, b, freeSort));

    return (
        <div className="space-y-6">
            {/* 有料予想 */}
            {paid.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#061b31]">有料予想</h3>
                        <SortToggle value={paidSort} onChange={setPaidSort} />
                    </div>
                    {sortedPaid.map(pred => (
                        <TimelineCard key={pred.id} prediction={pred} currentUserId={currentUserId} isFollowingAuthor={currentUserId ? followingSet.has(pred.authorId) : false} />
                    ))}
                </section>
            )}

            {/* 無料予想 */}
            {free.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#061b31]">無料予想</h3>
                        <SortToggle value={freeSort} onChange={setFreeSort} />
                    </div>
                    {sortedFree.map(pred => (
                        <TimelineCard key={pred.id} prediction={pred} currentUserId={currentUserId} isFollowingAuthor={currentUserId ? followingSet.has(pred.authorId) : false} />
                    ))}
                </section>
            )}

            {/* 他サイト予想 */}
            {external.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#061b31]">他サイト予想</h3>
                        <span className="text-[10px] text-[#64748d]">新着順</span>
                    </div>
                    {external.map(pred => (
                        <TimelineCard key={pred.id} prediction={pred} currentUserId={currentUserId} isFollowingAuthor={currentUserId ? followingSet.has(pred.authorId) : false} />
                    ))}
                </section>
            )}

            {paid.length === 0 && free.length === 0 && external.length === 0 && (
                <div className="py-16 text-center text-[#64748d]">
                    <p className="font-semibold">フィードがありません</p>
                </div>
            )}
        </div>
    );
}
