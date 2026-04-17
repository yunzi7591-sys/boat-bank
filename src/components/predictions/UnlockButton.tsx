"use client";

import { useState } from "react";
import { unlockPrediction } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Clock } from "lucide-react";
import { SharePromoModal } from "@/components/predictions/SharePromoModal";

type Props = {
    predictionId: string;
    price: number;
    isClosed?: boolean;
    placeName?: string;
    raceNumber?: number;
    authorId?: string;
    currentUserId?: string;
};

export function UnlockButton({ predictionId, price, isClosed = false, placeName, raceNumber, authorId, currentUserId }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);

    const handleUnlock = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await unlockPrediction(predictionId);
            if (result?.success) {
                const isOthers = authorId && currentUserId && authorId !== currentUserId;
                if (isOthers && price > 0 && placeName && raceNumber) {
                    setShowShareModal(true);
                }
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

            {placeName && raceNumber && (
                <SharePromoModal
                    open={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    predictionId={predictionId}
                    placeName={placeName}
                    raceNumber={raceNumber}
                />
            )}
        </div>
    );
}
