"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 斬撃は +30度で画面中心を通る線。 line: y = 50 + tan(30) * (x - 50)
// 各テキストが斬線の上側 (UR=upper-right) か 下側 (LL=lower-left) かを事前計算
const SCAM_PHRASES: Array<{
    text: string;
    x: string;
    y: string;
    rotate: number;
    size: string;
    side: "UR" | "LL";
}> = [
    { text: "100%的中保証！", x: "10%", y: "20%", rotate: -8, size: "text-4xl sm:text-5xl", side: "UR" },
    { text: "情報料10万円！", x: "55%", y: "12%", rotate: 5, size: "text-3xl sm:text-4xl", side: "UR" },
    { text: "絶対に勝てる買い目", x: "5%", y: "45%", rotate: -3, size: "text-2xl sm:text-3xl", side: "LL" },
    { text: "あなただけに特別情報", x: "50%", y: "38%", rotate: 8, size: "text-3xl sm:text-4xl", side: "UR" },
    { text: "今だけ無料公開！", x: "15%", y: "65%", rotate: 4, size: "text-3xl sm:text-4xl", side: "LL" },
    { text: "1レース50万円", x: "55%", y: "60%", rotate: -6, size: "text-2xl sm:text-3xl", side: "LL" },
    { text: "プロが選んだ的中buy目", x: "20%", y: "82%", rotate: -2, size: "text-2xl sm:text-3xl", side: "LL" },
    { text: "未公開情報あり", x: "60%", y: "78%", rotate: 6, size: "text-2xl sm:text-3xl", side: "LL" },
];

// 斬線+30度の垂直方向ベクトル（画面が切れる方向）
// UR側: (cos(-60), sin(-60)) = (0.5, -0.866) → 右上へ
// LL側: 反対方向 → 左下へ
const SPLIT_DISTANCE = 380;
const SPLIT_DX = 0.5 * SPLIT_DISTANCE;
const SPLIT_DY = -0.866 * SPLIT_DISTANCE;

const STORAGE_KEY = "lp-intro-played";

export function IntroAnimation() {
    const [phase, setPhase] = useState<"hidden" | "ready" | "scams" | "slash" | "split" | "fadeout" | "done">("hidden");
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        try {
            if (sessionStorage.getItem(STORAGE_KEY)) {
                setPhase("done");
                return;
            }
        } catch {}
        setPhase("ready");
    }, []);

    const startAnimation = () => {
        if (phase !== "ready") return;

        // タップ直後に「ミュート再生→停止」で音声をアンロック（後で鳴らせるようにする）
        const audio = audioRef.current;
        if (audio) {
            audio.muted = true;
            audio.play().then(() => {
                audio.pause();
                audio.currentTime = 0;
                audio.muted = false;
            }).catch(() => {});
        }

        setPhase("scams");
        setTimeout(() => {
            // 斬撃と同時に音再生（アンロック済みなので鳴る）
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
            }
            setPhase("slash");
        }, 1300);
        setTimeout(() => setPhase("split"), 2300);
        setTimeout(() => setPhase("fadeout"), 3200);
        setTimeout(() => {
            setPhase("done");
            try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
        }, 3900);
    };

    const skip = () => {
        setPhase("done");
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    };

    if (phase === "done" || phase === "hidden") return null;

    return (
        <AnimatePresence>
            <motion.div
                key="intro"
                onClick={phase === "ready" ? startAnimation : skip}
                initial={{ opacity: 1 }}
                animate={
                    phase === "fadeout"
                        ? { opacity: 0 }
                        : phase === "slash"
                        ? { opacity: 1, x: [0, -10, 12, -8, 6, -4, 0], y: [0, 6, -8, 4, -6, 2, 0] }
                        : { opacity: 1 }
                }
                transition={
                    phase === "fadeout"
                        ? { duration: 0.7, ease: "easeInOut" }
                        : phase === "slash"
                        ? { duration: 0.5, ease: "easeOut" }
                        : { duration: 0.3 }
                }
                className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden cursor-pointer select-none"
                aria-label="オープニングアニメーション"
            >
                <audio ref={audioRef} src="/sounds/slash.mp3" preload="auto" />

                {/* 背景グリッド */}
                <div
                    className="absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
                        `,
                        backgroundSize: "32px 32px",
                    }}
                />

                {/* 「タップして開始」初期画面 */}
                {phase === "ready" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-50"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                            className="flex items-center gap-2 mb-6"
                        >
                            <span className="bg-[#533afd] text-white font-black text-lg px-3 py-1 rounded-md tracking-tight">
                                BOAT
                            </span>
                            <span className="font-extrabold text-3xl text-white tracking-wide">
                                BANK
                            </span>
                        </motion.div>
                        <p className="text-white/80 text-sm tracking-widest mb-2">タップで開始</p>
                        <motion.div
                            animate={{ y: [0, 6, 0] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                            className="text-white/40 text-xs"
                        >
                            ▼
                        </motion.div>
                    </motion.div>
                )}

                {/* 悪徳予想屋の煽り文句 */}
                {phase !== "ready" && SCAM_PHRASES.map((p, i) => {
                    const splitX = p.side === "UR" ? SPLIT_DX : -SPLIT_DX;
                    const splitY = p.side === "UR" ? SPLIT_DY : -SPLIT_DY;
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={
                                phase === "split" || phase === "fadeout"
                                    ? {
                                          opacity: [1, 0],
                                          scale: [1, 0.8],
                                          x: [0, splitX],
                                          y: [0, splitY],
                                          filter: "blur(8px)",
                                      }
                                    : { opacity: 1, scale: 1 }
                            }
                            transition={{
                                duration: phase === "split" ? 0.8 : 0.3,
                                delay: phase === "scams" ? i * 0.06 : 0,
                                ease: phase === "split" ? "easeIn" : "easeOut",
                            }}
                            className={`absolute font-black text-yellow-300 whitespace-nowrap ${p.size}`}
                            style={{
                                left: p.x,
                                top: p.y,
                                transform: `rotate(${p.rotate}deg)`,
                                textShadow: "0 0 20px rgba(255, 200, 0, 0.4)",
                                fontFamily: '"Noto Sans JP", sans-serif',
                            }}
                        >
                            {p.text}
                        </motion.div>
                    );
                })}

                {/* 中央のダーティ・テキスト（悪徳予想屋本体）：斬線で2つに分かれる */}
                {phase !== "ready" && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={
                        phase === "split" || phase === "fadeout"
                            ? {
                                  opacity: [1, 0],
                                  x: [0, SPLIT_DX],
                                  y: [0, SPLIT_DY],
                                  filter: "blur(6px)",
                              }
                            : phase === "slash"
                            ? { opacity: 1, scale: [1, 1.08, 1] }
                            : { opacity: 1, scale: 1 }
                    }
                    transition={
                        phase === "split"
                            ? { duration: 0.8, ease: "easeIn" }
                            : phase === "slash"
                            ? { duration: 0.4, ease: "easeOut" }
                            : { duration: 0.6, delay: 0.4, ease: [0.2, 0.8, 0.3, 1] }
                    }
                    className="relative z-10 text-center pointer-events-none px-4"
                >
                    {/* 警告マーク */}
                    <motion.div
                        animate={phase === "scams" || phase === "slash" ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.8 }}
                        transition={{ duration: 1.2, repeat: phase === "scams" ? Infinity : 0 }}
                        className="inline-block mb-3"
                    >
                        <span className="text-yellow-400 text-3xl sm:text-4xl font-black tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                            ⚠ WARNING ⚠
                        </span>
                    </motion.div>

                    {/* メインテキスト：悪徳予想屋 */}
                    <p
                        className="font-black text-7xl sm:text-9xl tracking-tighter leading-none mb-2"
                        style={{
                            background: "linear-gradient(180deg, #ff4d6d 0%, #ff0040 40%, #c1001f 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            filter: "drop-shadow(0 0 20px rgba(255, 0, 80, 0.7)) drop-shadow(0 0 40px rgba(255, 0, 0, 0.4))",
                            textShadow: "0 0 60px rgba(255,0,80,0.8)",
                        }}
                    >
                        悪徳予想屋
                    </p>

                    {/* 英語サブタイトル */}
                    <p className="text-white/70 text-sm sm:text-base tracking-[0.4em] font-bold mb-1">
                        FRAUDULENT TIPSTERS
                    </p>

                    {/* 装飾ライン */}
                    <div className="flex items-center justify-center gap-3 mt-2">
                        <span className="h-px w-12 bg-red-500/60" />
                        <span className="text-red-400 text-xs font-bold tracking-widest">DANGER</span>
                        <span className="h-px w-12 bg-red-500/60" />
                    </div>
                </motion.div>
                )}

                {/* 斬撃エフェクト：赤い斜めの刀身が画面を左上から右下へ切り裂く */}
                <AnimatePresence>
                    {phase === "slash" && (
                        <motion.div
                            key="slash-container"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 pointer-events-none overflow-hidden"
                        >
                            {/* 親レイヤーで +30度回転（左上 → 右下に伸びる線） */}
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ transform: "rotate(30deg)" }}
                            >
                                <motion.div
                                    initial={{ x: "-150vw", opacity: 1 }}
                                    animate={{ x: "150vw", opacity: [1, 1, 1, 0.8, 0] }}
                                    transition={{ duration: 1.0, ease: [0.3, 0, 0.4, 1], times: [0, 0.5, 0.8, 0.9, 1] }}
                                    style={{
                                        width: "100vw",
                                        height: "22px",
                                        background: "linear-gradient(90deg, transparent 0%, rgba(255,0,64,0.9) 10%, #ff0040 50%, rgba(255,0,64,0.9) 90%, transparent 100%)",
                                        boxShadow: "0 0 80px #ff0040, 0 0 160px #ff0040, 0 0 240px rgba(255,0,64,0.9)",
                                        filter: "blur(0.5px)",
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 斬撃の閃光（中央通過時の一瞬の白フラッシュ） */}
                {phase === "slash" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0, 0.9, 0, 0] }}
                        transition={{ duration: 1.0, times: [0, 0.35, 0.45, 0.55, 1] }}
                        className="absolute inset-0 bg-white z-30 pointer-events-none"
                    />
                )}

                {/* 「BOAT BANK / データーで勝つ」テキスト */}
                {(phase === "split" || phase === "fadeout") && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-40"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#533afd] text-white font-black text-base sm:text-xl px-3 py-1 rounded-md tracking-tight">
                                BOAT
                            </span>
                            <span className="font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
                                BANK
                            </span>
                        </div>
                        <p className="text-white text-base sm:text-lg font-bold tracking-widest">
                            データーで勝つ
                        </p>
                    </motion.div>
                )}

                {/* スキップボタン */}
                {phase !== "ready" && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); skip(); }}
                        className="absolute top-4 right-4 text-white/50 hover:text-white text-xs tracking-widest z-50"
                    >
                        SKIP →
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
