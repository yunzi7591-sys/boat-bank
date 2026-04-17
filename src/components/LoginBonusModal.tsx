"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Flame, Coins, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
    streak: number;
    dailyPoints: number;
    isStreakUp: boolean;
};

export function LoginBonusModal({ streak, dailyPoints, isStreakUp }: Props) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setOpen(true), 250);
        return () => clearTimeout(t);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-sm p-0 border-0 overflow-hidden bg-gradient-to-br from-[#1c1e54] via-[#2d2f7a] to-[#533afd] text-white rounded-2xl">
                <DialogTitle className="sr-only">ログインボーナス</DialogTitle>

                <div className="relative px-6 pt-8 pb-6 text-center">

                    {/* Sparkles */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="absolute top-4 right-6"
                    >
                        <Sparkles className="w-5 h-5 text-amber-300" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="absolute top-10 left-6"
                    >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                    </motion.div>

                    {/* Header */}
                    <motion.p
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-xs font-bold tracking-widest text-amber-300 uppercase mb-2"
                    >
                        Login Bonus
                    </motion.p>

                    {/* Streak */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                        className="flex items-center justify-center gap-2 mb-1"
                    >
                        <Flame className="w-6 h-6 text-orange-400" />
                        <span className="text-3xl font-black tabular-nums">{streak}</span>
                        <span className="text-sm font-semibold text-white/80 mt-2">日連続</span>
                    </motion.div>

                    {isStreakUp && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-[11px] font-bold text-amber-300 mb-3"
                        >
                            🎉 レベルアップ！
                        </motion.p>
                    )}

                    {/* Points */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-5 mt-4 mb-5 border border-white/20"
                    >
                        <p className="text-[10px] font-bold tracking-wider text-white/70 uppercase mb-1">本日のデイリーポイント</p>
                        <div className="flex items-center justify-center gap-2">
                            <Coins className="w-6 h-6 text-amber-300" />
                            <span className="text-4xl font-black tabular-nums">{dailyPoints.toLocaleString()}</span>
                            <span className="text-lg font-bold text-white/80 mt-2">pt</span>
                        </div>
                    </motion.div>

                    {/* Next tier hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-[11px] text-white/60 mb-4"
                    >
                        {streak < 3
                            ? `あと${3 - streak}日連続で500pt/日にアップ`
                            : streak < 7
                                ? `あと${7 - streak}日連続で700pt/日にアップ`
                                : "最高ランク達成！このまま連続ログインを続けよう"}
                    </motion.p>

                    {/* Close button */}
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => setOpen(false)}
                        className="w-full bg-white text-[#1c1e54] font-bold py-3 rounded-xl hover:bg-white/90 transition-colors"
                    >
                        受け取る
                    </motion.button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
