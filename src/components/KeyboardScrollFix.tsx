"use client";

import { useEffect } from "react";

/**
 * iOS WebView のキーボード表示後に layout / scroll が崩れる問題への対処。
 * - 入力欄 blur 後に main のスクロール領域を強制リフロー（overflow toggle で再計算）
 * - スクロール位置リセット
 * - visualViewport の resize でも検知して補正
 */
export function KeyboardScrollFix() {
    useEffect(() => {
        const forceMainReflow = () => {
            try {
                const main = document.querySelector("main") as HTMLElement | null;
                if (!main) return;
                const savedScroll = main.scrollTop;
                // overflow を toggle してブラウザにスクロール領域を再計算させる
                const originalOverflow = main.style.overflow;
                main.style.overflow = "hidden";
                // 強制 reflow
                void main.offsetHeight;
                main.style.overflow = originalOverflow || "";
                // height も一瞬触って再計算を促す
                const originalHeight = main.style.height;
                main.style.height = "auto";
                void main.offsetHeight;
                main.style.height = originalHeight;
                // スクロール位置を復元
                main.scrollTop = savedScroll;
            } catch {}
        };

        const resetScrollPosition = () => {
            try {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            } catch {}
        };

        const handleFocusOut = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const tag = target.tagName?.toLowerCase();
            if (tag !== "input" && tag !== "textarea" && tag !== "select") return;
            // キーボードが完全に閉じるタイミングで複数回リフロー
            setTimeout(() => { resetScrollPosition(); forceMainReflow(); }, 100);
            setTimeout(() => { resetScrollPosition(); forceMainReflow(); }, 350);
            setTimeout(() => { forceMainReflow(); }, 700);
        };

        const handleViewportResize = () => {
            // visualViewport が変わった = キーボード開閉
            setTimeout(forceMainReflow, 150);
        };

        window.addEventListener("focusout", handleFocusOut, true);

        let viewportListener: (() => void) | null = null;
        if (typeof window !== "undefined" && window.visualViewport) {
            viewportListener = handleViewportResize;
            window.visualViewport.addEventListener("resize", viewportListener);
        }

        return () => {
            window.removeEventListener("focusout", handleFocusOut, true);
            if (viewportListener && window.visualViewport) {
                window.visualViewport.removeEventListener("resize", viewportListener);
            }
        };
    }, []);

    return null;
}
