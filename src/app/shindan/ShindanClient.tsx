"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { QUESTIONS, calcType, type Pole } from "@/lib/shindan";

export function ShindanClient() {
    const router = useRouter();
    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState<Pole[]>([]);
    const [finishing, setFinishing] = useState(false);

    const current = answers.length;
    const question = QUESTIONS[current];

    const selectOption = (pole: Pole) => {
        if (finishing) return;
        const next = [...answers, pole];
        if (next.length >= QUESTIONS.length) {
            setFinishing(true);
            const result = calcType(next);
            router.push(`/shindan/${result.slug}`);
            return;
        }
        setAnswers(next);
    };

    if (!started) {
        return (
            <div className="px-1 py-8 text-center text-white">
                <p className="text-[11px] font-bold tracking-[0.2em] text-white/70 mb-2">BOAT BANK presents</p>
                <h1 className="text-3xl font-black mb-3">ギャンブラー診断</h1>
                <p className="text-sm text-white/85 leading-relaxed mb-4">
                    30の質問で、あなたの舟券スタイルを丸裸に。
                    <br />
                    当てはまる方を直感で選ぶだけ。
                </p>
                <div className="flex justify-center gap-2 mb-6">
                    {["全8タイプ", "30問", "約2分", "無料"].map(t => (
                        <span key={t} className="text-[11px] font-bold bg-white/15 border border-white/20 rounded-full px-2.5 py-1">{t}</span>
                    ))}
                </div>
                <div className="flex justify-center gap-2 mb-7">
                    {["nekketsu", "shokunin", "banshou", "yumeoi"].map(s => (
                        <div key={s} className="w-16 h-16 bg-white rounded-xl overflow-hidden">
                            <Image src={`/shindan/char-${s}.png`} alt="" width={64} height={64} />
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setStarted(true)}
                    className="w-full max-w-xs mx-auto block bg-[#533afd] hover:bg-[#4434d4] active:scale-[0.98] transition-all text-white font-black text-lg rounded-xl py-4 shadow-lg"
                >
                    診断をはじめる
                </button>
                <p className="text-[11px] text-white/60 mt-3">登録不要でそのまま遊べます</p>
            </div>
        );
    }

    if (finishing || !question) {
        return (
            <div className="bg-white border border-[#e5edf5] rounded-2xl px-5 py-16 text-center">
                <p className="text-sm font-bold text-[#061b31] animate-pulse">診断結果を集計中…</p>
            </div>
        );
    }

    const progress = (current / QUESTIONS.length) * 100;

    return (
        <div className="bg-white border border-[#e5edf5] rounded-2xl px-5 py-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#64748d]">Q{current + 1} / {QUESTIONS.length}</span>
                {current > 0 && (
                    <button
                        onClick={() => setAnswers(answers.slice(0, -1))}
                        className="text-[11px] font-bold text-[#533afd]"
                    >
                        ← 前の質問に戻る
                    </button>
                )}
            </div>
            <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mb-6">
                <div className="h-full bg-[#533afd] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Question */}
            <h2 key={current} className="text-base font-bold text-[#061b31] leading-relaxed mb-5 min-h-[3rem]">
                {question.text}
            </h2>

            <div className="flex flex-col gap-3">
                {question.options.map((opt) => (
                    <button
                        key={opt.text}
                        onClick={() => selectOption(opt.pole)}
                        className="w-full text-left border border-[#dde5ef] hover:border-[#533afd] hover:bg-[#533afd]/5 active:scale-[0.99] transition-all rounded-xl px-4 py-4 text-sm font-semibold text-[#273951]"
                    >
                        {opt.text}
                    </button>
                ))}
            </div>
        </div>
    );
}
