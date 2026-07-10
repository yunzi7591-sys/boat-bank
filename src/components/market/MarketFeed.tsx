"use client";

import { useState } from "react";
import { TimelineCard } from "./TimelineCard";
import type { TimelineCardPrediction } from "@/lib/types";

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
    predictions: TimelineCardPrediction[];
    currentUserId?: string;
    followingIds?: string[];
}) {
    const followingSet = new Set(followingIds);
    const [internalSort, setInternalSort] = useState<SortMode>("new");

    // 分類
    const internal = predictions.filter(p => p.publishType === "internal");
    const external = predictions.filter(p => p.publishType === "external");

    // ソート（人気順は閲覧数基準）
    const sortFn = (a: any, b: any, mode: SortMode) => {
        if (mode === "popular") {
            return (b.viewCount || 0) - (a.viewCount || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    const sortedInternal = [...internal].sort((a, b) => sortFn(a, b, internalSort));

    return (
        <div className="space-y-6">
            {/* 予想 */}
            {internal.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#061b31]">予想</h3>
                        <SortToggle value={internalSort} onChange={setInternalSort} />
                    </div>
                    {sortedInternal.map(pred => (
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

            {internal.length === 0 && external.length === 0 && (
                <div className="py-16 text-center text-[#64748d]">
                    <p className="font-semibold">フィードがありません</p>
                </div>
            )}
        </div>
    );
}
