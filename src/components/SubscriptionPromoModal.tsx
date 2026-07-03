"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, X } from "lucide-react";
import { isNativeApp } from "@/lib/platform";
import { isLoginBonusOpen, onLoginBonusClosed } from "@/lib/modal-coordination";

// 最後にポップアップを見せた日時（端末ローカル）
const LAST_SHOWN_KEY = "subscription-promo-last-shown-at";
// 表示間隔: 週2回まで（約3.5日に1回）
const SHOW_INTERVAL_MS = 3.5 * 24 * 60 * 60 * 1000;
// 起動直後は避け、画面が落ち着いてから出す
const SHOW_DELAY_MS = 2500;
// ログインボーナスが閉じられてから出すまでの間
const AFTER_BONUS_DELAY_MS = 1000;

/**
 * サブスク勧誘ポップアップ（ネイティブアプリ限定）
 *
 * 未加入のログインユーザーがアプリを開いたとき、週1回を上限に
 * 会員プラン（初月無料）を案内するモーダルを表示する。
 *
 * - enabled: サーバー側で判定した「ログイン済み かつ 未加入」フラグ
 */
export function SubscriptionPromoModal({ enabled }: { enabled: boolean }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!enabled) return;
        // アプリ内のみ（Webでは何もしない）
        if (!isNativeApp()) return;

        try {
            const last = Number(localStorage.getItem(LAST_SHOWN_KEY) ?? 0);
            if (last && Date.now() - last < SHOW_INTERVAL_MS) return;
        } catch {
            return;
        }

        let cancelled = false;
        let afterBonusTimer: ReturnType<typeof setTimeout> | null = null;
        let removeListener: (() => void) | null = null;

        const reveal = () => {
            if (cancelled) return;
            setOpen(true);
            // 表示した時点で記録（閉じ方によらず週1回を守る）
            try {
                localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
            } catch {}
        };

        const timer = setTimeout(() => {
            if (cancelled) return;
            // ログインボーナスのポップアップが出ていたら、閉じられるまで待つ
            if (isLoginBonusOpen()) {
                removeListener = onLoginBonusClosed(() => {
                    afterBonusTimer = setTimeout(reveal, AFTER_BONUS_DELAY_MS);
                });
            } else {
                reveal();
            }
        }, SHOW_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
            if (afterBonusTimer) clearTimeout(afterBonusTimer);
            if (removeListener) removeListener();
        };
    }, [enabled]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
            onClick={() => setOpen(false)}
        >
            <div
                role="dialog"
                aria-label="会員プランのご案内"
                className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative bg-gradient-to-r from-[#533afd] to-[#7c3aed] px-5 py-4">
                    <button
                        type="button"
                        aria-label="閉じる"
                        className="absolute top-3 right-3 text-white/70 hover:text-white p-1"
                        onClick={() => setOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="bg-white/20 rounded-full p-2">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white/80">BOAT BANK スタンダード</p>
                            <p className="text-sm font-black text-white">🎁 いまなら初月無料</p>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-5">
                    <p className="font-bold text-[#061b31] text-sm mb-2">
                        負けている場、把握できていますか？
                    </p>
                    <p className="text-xs text-[#64748d] leading-relaxed mb-1">
                        24場ごとの回収率・収支がすべて見られます。
                        苦手な場がわかれば、無駄な舟券が減る。
                    </p>
                    <p className="text-xs font-bold text-emerald-600 mb-4">
                        月500円 — 舟券1点分。初月は無料。
                    </p>

                    <button
                        type="button"
                        className="w-full bg-[#533afd] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#4125d1] transition-colors shadow-md"
                        onClick={() => {
                            setOpen(false);
                            router.push("/subscribe");
                        }}
                    >
                        初月無料で試す
                    </button>
                    <button
                        type="button"
                        className="w-full mt-2 text-xs text-[#64748d] py-2 hover:text-[#061b31]"
                        onClick={() => setOpen(false)}
                    >
                        あとで
                    </button>
                </div>
            </div>
        </div>
    );
}
