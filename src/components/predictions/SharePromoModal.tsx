"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Coins, Sparkles, X as XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { claimShareReward } from "@/actions/share";
import { toast } from "sonner";
import { useSharePromoStore } from "@/store/share-modal-store";

export function SharePromoModal() {
    const payload = useSharePromoStore((s) => s.payload);
    const close = useSharePromoStore((s) => s.close);
    const [loading, setLoading] = useState(false);

    const open = payload !== null;
    const placeName = payload?.placeName ?? "";
    const raceNumber = payload?.raceNumber ?? 0;
    const predictionId = payload?.predictionId ?? "";

    const shareUrl = `https://boatbank.jp/predictions/${predictionId}`;
    const shareText = `${placeName} ${raceNumber}R の予想を購入しました🚤`;
    const intentUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    const handleShare = async () => {
        if (!predictionId) return;
        setLoading(true);
        try {
            window.open(intentUrl, "_blank", "noopener,noreferrer");
            const result = await claimShareReward(predictionId);
            if (result.success) {
                toast.success(`+${result.awardedPoints}pt 獲得しました`);
            } else {
                toast.error(result.error || "ポイント付与に失敗しました");
            }
        } finally {
            setLoading(false);
            close();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && close()}>
            <DialogContent className="max-w-sm p-0 border-0 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white rounded-2xl">
                <DialogTitle className="sr-only">Xでシェアしてポイント獲得</DialogTitle>

                <div className="relative px-6 pt-8 pb-6 text-center">

                    {/* Sparkles */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="absolute top-4 right-6"
                    >
                        <Sparkles className="w-5 h-5 text-sky-300" />
                    </motion.div>

                    {/* Header */}
                    <motion.p
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-xs font-bold tracking-widest text-sky-300 uppercase mb-2"
                    >
                        Share & Earn
                    </motion.p>

                    <motion.h2
                        initial={{ y: -5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg font-bold mb-4"
                    >
                        購入ありがとうございます！
                    </motion.h2>

                    {/* Points card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-5 mb-4 border border-white/20"
                    >
                        <p className="text-[10px] font-bold tracking-wider text-white/70 uppercase mb-1">シェアで獲得</p>
                        <div className="flex items-center justify-center gap-2">
                            <Coins className="w-6 h-6 text-amber-300" />
                            <span className="text-4xl font-black tabular-nums">+50</span>
                            <span className="text-lg font-bold text-white/80 mt-2">pt</span>
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xs text-white/60 mb-5 leading-relaxed"
                    >
                        この予想をXでシェアすると50ptゲット！<br />
                        <span className="text-[10px]">※ シェア報酬は1時間に2回までです</span>
                    </motion.p>

                    {/* Share button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={handleShare}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mb-2"
                    >
                        <XIcon className="w-4 h-4" />
                        {loading ? "処理中..." : "Xでシェアして50ptもらう"}
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={close}
                        disabled={loading}
                        className="w-full text-white/60 hover:text-white font-semibold py-2 text-sm transition-colors"
                    >
                        あとで
                    </motion.button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
