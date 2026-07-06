"use client";

import { useState } from "react";
import { Globe, Users } from "lucide-react";
import { MarketFeed } from "@/components/market/MarketFeed";
import type { TimelineCardPrediction } from "@/lib/types";

type Tab = "all" | "following";

/**
 * マーケットのタブ（全員 / フォロー中）。
 * Android初回ロード時にSSRで両タブの中身が同時描画される「二重表示」を防ぐため、
 * アクティブなタブの中身だけを条件レンダリングでDOMに出すクライアント部品にしている。
 */
export function MarketTabs({
    allPredictions,
    followingPredictions,
    userId,
    followingIds = [],
}: {
    allPredictions: TimelineCardPrediction[];
    followingPredictions: TimelineCardPrediction[];
    userId?: string;
    followingIds?: string[];
}) {
    const [tab, setTab] = useState<Tab>("all");

    return (
        <div className="w-full">
            <div className="w-full h-10 bg-[#f6f8fa] p-1 rounded-lg flex gap-1">
                <button
                    type="button"
                    onClick={() => setTab("all")}
                    className={`w-full flex items-center justify-center rounded-md font-semibold text-sm transition-colors ${
                        tab === "all" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"
                    }`}
                >
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    全員
                </button>
                <button
                    type="button"
                    onClick={() => userId && setTab("following")}
                    disabled={!userId}
                    className={`w-full flex items-center justify-center rounded-md font-semibold text-sm transition-colors disabled:opacity-40 ${
                        tab === "following" ? "bg-white text-[#533afd] shadow-sm" : "text-[#64748d]"
                    }`}
                >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    フォロー中
                </button>
            </div>

            <div className="mt-4 bg-[#f8fafc] rounded-lg p-2">
                {tab === "all" ? (
                    <MarketFeed predictions={allPredictions} currentUserId={userId} followingIds={followingIds} />
                ) : !userId ? (
                    <div className="py-16 text-center text-[#64748d]">ログインしてフォロー機能を利用する</div>
                ) : followingPredictions.length === 0 ? (
                    <div className="py-16 text-center text-[#64748d]">
                        <p className="font-semibold text-[#061b31] mb-1">フィードが空です</p>
                        <p className="text-sm">お気に入りの予想家をフォローしましょう</p>
                    </div>
                ) : (
                    <MarketFeed predictions={followingPredictions} currentUserId={userId} followingIds={followingIds} />
                )}
            </div>
        </div>
    );
}
