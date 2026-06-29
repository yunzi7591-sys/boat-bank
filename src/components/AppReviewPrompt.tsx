"use client";

import { useEffect } from "react";
import { isNativeApp, isIOS } from "@/lib/platform";

// 初回起動日を保存しておくキー（端末ローカル）
const FIRST_SEEN_KEY = "app-first-seen-at";
// レビューを促した記録（一度促したら二度と促さない）
const REVIEW_ASKED_KEY = "app-review-asked-v1";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * App Store レビュー促進（iOS / StoreKit）
 *
 * 「初回ダウンロードから3日以上アプリを開いている人」に対して、
 * アプリ内からシームレスに評価ダイアログ（SKStoreReviewController）を表示する。
 *
 * - accountCreatedAt: ログイン中ユーザーのアカウント作成日時(ISO文字列)。
 *   既存ユーザーは登録が3日以上前 → 即対象になる。
 */
export function AppReviewPrompt({ accountCreatedAt }: { accountCreatedAt?: string | null }) {
    useEffect(() => {
        // ネイティブiOSアプリ内でのみ動作（Web/Androidでは何もしない）
        if (!isNativeApp() || !isIOS()) return;

        // すでに一度促していたら終了
        try {
            if (localStorage.getItem(REVIEW_ASKED_KEY)) return;
        } catch {
            return;
        }

        // 「初回ダウンロード(初回起動)」の起点日を決める
        let firstSeen: number | null = null;
        try {
            const stored = localStorage.getItem(FIRST_SEEN_KEY);
            if (stored) {
                firstSeen = Number(stored);
            }
        } catch {}

        if (!firstSeen || Number.isNaN(firstSeen)) {
            // 未保存なら起点を決めて保存
            //  - ログイン済み: アカウント作成日（既存ユーザーを即対象にするため）
            //  - 未ログイン: 今（この端末での初回起動）
            const fromAccount = accountCreatedAt ? new Date(accountCreatedAt).getTime() : NaN;
            firstSeen = !Number.isNaN(fromAccount) ? fromAccount : Date.now();
            try {
                localStorage.setItem(FIRST_SEEN_KEY, String(firstSeen));
            } catch {}
        }

        // 初回から3日未満ならまだ促さない
        if (Date.now() - firstSeen < THREE_DAYS_MS) return;

        let cancelled = false;
        // 起動直後の連打を避け、画面が落ち着いてから自然に出す
        const timer = setTimeout(async () => {
            if (cancelled) return;
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (!Capacitor.isPluginAvailable("InAppReview")) return;
                const { InAppReview } = await import("@capacitor-community/in-app-review");
                await InAppReview.requestReview();
                // 促した記録を残す（StoreKit側でも年3回上限があるが、こちらは一度きり）
                try {
                    localStorage.setItem(REVIEW_ASKED_KEY, String(Date.now()));
                } catch {}
            } catch (e) {
                console.error("[AppReviewPrompt]", e);
            }
        }, 3000);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [accountCreatedAt]);

    return null;
}
