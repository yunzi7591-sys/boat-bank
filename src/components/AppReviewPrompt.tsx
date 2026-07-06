"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/platform";

// 初回起動日を保存しておくキー（端末ローカル）
const FIRST_SEEN_KEY = "app-first-seen-at";
// 何回レビュー依頼を出したかの記録（0〜3）
const ASK_COUNT_KEY = "app-review-ask-count-v2";
// 旧ロジックで「一度だけ促した」記録（移行用）
const LEGACY_ASKED_KEY = "app-review-asked-v1";

const DAY_MS = 24 * 60 * 60 * 1000;
// 初回起動から何日目に依頼を出すか（1回目/2回目/3回目）
const ASK_ON_DAYS = [3, 20, 100];

/**
 * ストアレビュー促進（iOS: StoreKit / Android: Google Play In-App Review）
 *
 * 初回起動を起点に、3日目 / 20日目 / 100日目 の計3回まで評価ダイアログを促す。
 * 「実際にレビューしたか」はOS側が非公開のためアプリでは判定できないが、
 * 既にレビュー済みのユーザーには OS 側が自動的に再表示しないため問題ない。
 * 同一プラグイン（@capacitor-community/in-app-review）で iOS/Android 両対応。
 *
 * - accountCreatedAt: ログイン中ユーザーのアカウント作成日時(ISO文字列)。
 *   既存ユーザーは登録が起点になる。
 */
export function AppReviewPrompt({ accountCreatedAt }: { accountCreatedAt?: string | null }) {
    useEffect(() => {
        // ネイティブアプリ内（iOS/Android）でのみ動作（Webでは何もしない）
        if (!isNativeApp()) return;

        let askCount = 0;
        try {
            const stored = localStorage.getItem(ASK_COUNT_KEY);
            if (stored !== null) {
                askCount = Number(stored) || 0;
            } else if (localStorage.getItem(LEGACY_ASKED_KEY)) {
                // 旧ロジックで既に1回促した人は「1回済み」として引き継ぐ
                askCount = 1;
                localStorage.setItem(ASK_COUNT_KEY, "1");
            }
        } catch {
            return;
        }

        // 3回すべて促し済みなら終了
        if (askCount >= ASK_ON_DAYS.length) return;

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

        // 次に出すべき節目（askCount 回目 = ASK_ON_DAYS[askCount] 日目）に達していなければ待つ
        const daysSinceFirstSeen = (Date.now() - firstSeen) / DAY_MS;
        if (daysSinceFirstSeen < ASK_ON_DAYS[askCount]) return;

        let cancelled = false;
        // 起動直後の連打を避け、画面が落ち着いてから自然に出す
        const timer = setTimeout(async () => {
            if (cancelled) return;
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (!Capacitor.isPluginAvailable("InAppReview")) return;
                const { InAppReview } = await import("@capacitor-community/in-app-review");
                await InAppReview.requestReview();
                // 促した回数を1つ進める（次回は次の節目まで出さない）
                try {
                    localStorage.setItem(ASK_COUNT_KEY, String(askCount + 1));
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
