"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockBySubscription } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";

/**
 * 会員特典で締切後・当日の予想をアンロックするボタン（pt消費なし）。
 * 締切前の購入と同じく、明示的な操作でアンロックする。
 */
export function SubscriberUnlockButton({ predictionId }: { predictionId: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleUnlock = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await unlockBySubscription(predictionId);
            if (result?.success) {
                router.refresh();
            } else {
                setError(result?.error || "アンロックに失敗しました。");
                setLoading(false);
            }
        } catch {
            setError("エラーが発生しました。");
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                onClick={handleUnlock}
                disabled={loading}
                className="h-12 px-8 text-sm font-bold shadow-xl rounded-xl transition-all bg-[#533afd] hover:bg-[#4434d4] text-white shadow-[#533afd]/20 hover:scale-105"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Crown className="w-4 h-4 mr-2" />
                )}
                会員特典でアンロック
                <span className="ml-2 font-normal text-white/60">|</span>
                <span className="ml-2 font-black text-emerald-300">0 pt</span>
            </Button>
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
        </div>
    );
}
