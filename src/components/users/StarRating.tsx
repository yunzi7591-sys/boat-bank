"use client";

import { useState, useEffect, useTransition } from "react";
import { Star } from "lucide-react";
import { setUserRating, clearUserRating } from "@/actions/rating";
import { toast } from "sonner";

/**
 * 予想家への星評価（星のみ・1人1件）。
 * タップで評価、同じ星をもう一度タップで取り消し。
 * 評価の操作はアプリ版のみ（Webでは案内のみ表示）。
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
    const [isNativeApp, setIsNativeApp] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        import("@capacitor/core")
            .then(({ Capacitor }) => { if (!cancelled) setIsNativeApp(Capacitor.isNativePlatform()); })
            .catch(() => { if (!cancelled) setIsNativeApp(false); });
        return () => { cancelled = true; };
    }, []);

    if (!canRate) return null;
    if (isNativeApp === null) return null; // 判定中は何も出さない（チラつき防止）

    if (!isNativeApp) {
        return (
            <p className="text-[11px] text-[#94a3b8]">
                ⭐ 予想家の評価はアプリ版から行えます
            </p>
        );
    }

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
