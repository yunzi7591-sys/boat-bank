"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { setUserRating, clearUserRating } from "@/actions/rating";
import { toast } from "sonner";

/**
 * 予想家への星評価（星のみ・1人1件）。
 * タップで評価、同じ星をもう一度タップで取り消し。
 */
export function StarRating({
    targetUserId,
    initialMyRating,
    canRate,
}: {
    targetUserId: string;
    initialMyRating: number | null;
    canRate: boolean;
}) {
    const [myRating, setMyRating] = useState<number | null>(initialMyRating);
    const [isPending, startTransition] = useTransition();

    if (!canRate) return null;

    const handleTap = (value: number) => {
        if (isPending) return;
        startTransition(async () => {
            if (myRating === value) {
                const res = await clearUserRating(targetUserId);
                if (res.success) {
                    setMyRating(null);
                    toast.success("評価を取り消しました", { position: "top-center" });
                } else {
                    toast.error(res.error || "取り消しに失敗しました", { position: "top-center" });
                }
                return;
            }
            const res = await setUserRating(targetUserId, value);
            if (res.success) {
                setMyRating(value);
                toast.success(`★${value} で評価しました`, { position: "top-center" });
            } else {
                toast.error(res.error || "評価に失敗しました", { position: "top-center" });
            }
        });
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#64748d]">この予想家を評価:</span>
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(v => (
                    <button
                        key={v}
                        type="button"
                        aria-label={`星${v}で評価`}
                        onClick={() => handleTap(v)}
                        disabled={isPending}
                        className="p-1 active:scale-90 transition-transform disabled:opacity-60"
                    >
                        <Star
                            className={`w-5 h-5 ${myRating && v <= myRating ? "fill-amber-400 text-amber-400" : "text-[#cbd5e1]"}`}
                        />
                    </button>
                ))}
            </div>
            {myRating && <span className="text-[10px] text-[#94a3b8]">タップで変更・同じ星で取り消し</span>}
        </div>
    );
}
