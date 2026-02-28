"use client";

import { useState } from "react";
import { unlockPrediction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export function UnlockButton({ predictionId, price, isClosed = false }: { predictionId: string, price: number, isClosed?: boolean }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUnlock = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await unlockPrediction(predictionId);
            if (result?.success) {
                // Page gets revalidated by server action
            } else {
                setError(result?.error || "Failed to unlock prediction.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                onClick={handleUnlock}
                disabled={loading || isClosed}
                className={`h-12 px-8 text-sm font-bold shadow-xl rounded-xl transition-all ${isClosed
                        ? "bg-slate-200 text-slate-400 shadow-none hover:bg-slate-200 hover:scale-100 cursor-not-allowed border border-slate-300"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 hover:scale-105"
                    }`}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isClosed ? (
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                ) : (
                    <Lock className="w-4 h-4 mr-2 text-slate-400" />
                )}

                {isClosed ? "販売終了" : "この情報をアンロック"}
                <span className={`ml-2 font-normal ${isClosed ? "text-slate-300" : "text-slate-400"}`}>|</span>
                <span className={`ml-2 font-black ${isClosed ? "text-slate-400" : "text-green-400"}`}>{price} pt</span>
            </Button>
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
        </div>
    );
}
