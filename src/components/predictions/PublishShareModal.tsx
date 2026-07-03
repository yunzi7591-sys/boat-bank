"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, X as XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { usePublishShareStore } from "@/store/publish-share-store";

/**
 * 予想を公開した直後に画面中央へ出す「Xに投稿」ポップ。
 * ポイント報酬は付けず、リンク付きでXの投稿画面を開くだけのシンプルな拡散導線。
 */
export function PublishShareModal() {
    const payload = usePublishShareStore((s) => s.payload);
    const close = usePublishShareStore((s) => s.close);

    const open = payload !== null;
    const placeName = payload?.placeName ?? "";
    const raceNumber = payload?.raceNumber ?? 0;
    const predictionId = payload?.predictionId ?? "";

    const shareText = `${placeName} ${raceNumber}R の予想を公開しました🚤`;

    const handleShare = () => {
        if (!predictionId) return;
        // OGP画像を先に温めてからXへ（カード表示を確実にする）
        fetch(`/api/og/warmup?id=${predictionId}`, { cache: "no-store" }).catch(() => {});
        const cacheBuster = Date.now().toString(36);
        const shareUrl = `https://boatbank.jp/predictions/${predictionId}?ref=${cacheBuster}`;
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(intentUrl, "_blank", "noopener,noreferrer");
        close();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && close()}>
            <DialogContent className="max-w-sm p-0 border-0 overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white rounded-2xl">
                <DialogTitle className="sr-only">Xに投稿して予想を広める</DialogTitle>

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
                        Share on X
                    </motion.p>

                    <motion.h2
                        initial={{ y: -5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg font-bold mb-3"
                    >
                        予想を公開しました！
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-white/70 mb-6 leading-relaxed"
                    >
                        Xでシェアして、あなたの予想を広めよう。<br />
                        リンク付きでそのまま投稿できます。
                    </motion.p>

                    {/* Share button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={handleShare}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-white/90 transition-colors flex items-center justify-center gap-2 mb-2"
                    >
                        <XIcon className="w-4 h-4" />
                        Xに投稿する
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        onClick={close}
                        className="w-full text-white/60 hover:text-white font-semibold py-2 text-sm transition-colors"
                    >
                        あとで
                    </motion.button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
