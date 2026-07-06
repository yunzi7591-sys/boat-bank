"use client";

import { useEffect } from "react";

/**
 * 予期せぬエラー時のフォールバック画面（App Router のエラーバウンダリ）。
 * Next.js 標準の英語エラー画面の代わりに、日本語＋再読み込み導線を表示する。
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[app/error]", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f0ff] flex items-center justify-center mb-5">
                <span className="text-3xl" aria-hidden="true">⚠️</span>
            </div>
            <h1 className="text-lg font-black text-[#061b31] mb-2">
                問題が発生しました
            </h1>
            <p className="text-sm text-[#64748d] leading-relaxed mb-6 max-w-xs">
                一時的な通信エラーの可能性があります。少し時間をおいて、もう一度お試しください。
            </p>
            <button
                onClick={reset}
                className="bg-[#533afd] hover:bg-[#432ae0] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
                再読み込みする
            </button>
            <a
                href="/"
                className="mt-3 text-sm text-[#64748d] hover:text-[#533afd] font-semibold transition-colors"
            >
                ホームに戻る
            </a>
        </div>
    );
}
