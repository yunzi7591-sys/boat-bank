"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatform, isNativeApp } from "@/lib/platform";
import {
    configureRevenueCat,
    getCurrentOffering,
    hasActiveEntitlement,
    purchasePackage,
    restorePurchases,
} from "@/lib/revenuecat";
import type { PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
    userId: string;
    status: string | null;
    currentPeriodEnd: string | null;
    trialEnd: string | null;
    willRenew: boolean;
    isActive: boolean;
};

export function SubscribeClient({ userId, status, currentPeriodEnd, trialEnd, willRenew, isActive }: Props) {
    const [platform, setPlatform] = useState<"ios" | "android" | "web">("web");
    const [native, setNative] = useState(false);
    const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
    const [loadingPkg, setLoadingPkg] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        setPlatform(getPlatform());
        setNative(isNativeApp());
    }, []);

    useEffect(() => {
        if (!native || isActive) return;
        let cancelled = false;
        (async () => {
            setLoadingPkg(true);
            const configured = await configureRevenueCat(userId);
            if (!configured || cancelled) {
                setLoadingPkg(false);
                return;
            }
            const offering = await getCurrentOffering();
            if (cancelled) return;
            const monthly = offering?.monthly ?? offering?.availablePackages?.[0] ?? null;
            setPkg(monthly);
            setLoadingPkg(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [native, isActive, userId]);

    const handlePurchase = useCallback(async () => {
        if (!pkg) {
            toast.error("商品情報を取得できませんでした。しばらくしてからお試しください");
            return;
        }
        setPurchasing(true);
        try {
            const info = await purchasePackage(pkg);
            if (hasActiveEntitlement(info)) {
                toast.success("ご登録ありがとうございます！");
                setTimeout(() => window.location.reload(), 1200);
            } else {
                toast.error("購入は完了しましたが、反映までお時間がかかる場合があります");
            }
        } catch (e: unknown) {
            const err = e as { userCancelled?: boolean; message?: string };
            if (err?.userCancelled) {
                // ユーザーがキャンセル → 何もしない
            } else {
                console.error("[Subscribe] purchase error", e);
                toast.error(err?.message ?? "購入処理でエラーが発生しました");
            }
        } finally {
            setPurchasing(false);
        }
    }, [pkg]);

    const handleRestore = useCallback(async () => {
        setRestoring(true);
        try {
            const info = await restorePurchases();
            if (hasActiveEntitlement(info)) {
                toast.success("購入を復元しました");
                setTimeout(() => window.location.reload(), 1200);
            } else {
                toast.info("復元できる購入が見つかりませんでした");
            }
        } catch (e) {
            console.error("[Subscribe] restore error", e);
            toast.error("復元処理でエラーが発生しました");
        } finally {
            setRestoring(false);
        }
    }, []);

    const priceLabel = pkg?.product?.priceString ?? "¥500";
    const purchaseDisabled = purchasing || loadingPkg || !pkg;

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="max-w-md mx-auto px-5 pt-10 pb-24">
                <h1 className="text-2xl font-black text-slate-900 mb-2">BOAT BANK スタンダード</h1>
                <p className="text-sm text-slate-600 mb-6">詳細分析がすべて見られる会員プラン</p>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-black text-[#533afd]">{priceLabel}</span>
                        <span className="text-sm text-slate-500">/ 月</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">期間: 1か月（自動更新）</p>
                    <p className="text-xs text-emerald-600 font-bold mb-5">初月無料（30日間のトライアル）</p>

                    <ul className="space-y-2.5 mb-6">
                        {[
                            "24場ごとの詳細成績・回収率",
                            "月ごとのPnLカレンダー",
                            "他ユーザーの詳細分析も閲覧可能",
                            "今後追加予定の会員限定ツール",
                        ].map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {isActive ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <p className="font-bold text-emerald-700 text-sm mb-1">
                                {status === "trialing" ? "無料トライアル中" : "会員ステータス: 有効"}
                            </p>
                            {currentPeriodEnd && (
                                <p className="text-xs text-emerald-600">
                                    {willRenew ? "次回更新" : "有効期限"}:{" "}
                                    {new Date(currentPeriodEnd).toLocaleDateString("ja-JP")}
                                </p>
                            )}
                            {trialEnd && status === "trialing" && (
                                <p className="text-[10px] text-emerald-600 mt-1">
                                    トライアル終了: {new Date(trialEnd).toLocaleDateString("ja-JP")}
                                </p>
                            )}
                        </div>
                    ) : native ? (
                        <>
                            <button
                                className="w-full bg-[#533afd] text-white font-bold py-3 rounded-xl hover:bg-[#4125d1] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                onClick={handlePurchase}
                                disabled={purchaseDisabled}
                            >
                                {purchasing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        処理中...
                                    </>
                                ) : loadingPkg ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        読み込み中...
                                    </>
                                ) : (
                                    "無料で始める"
                                )}
                            </button>
                            <button
                                className="w-full mt-3 text-xs text-slate-500 py-2 hover:text-slate-700 disabled:opacity-50"
                                onClick={handleRestore}
                                disabled={restoring}
                            >
                                {restoring ? "復元中..." : "購入を復元する"}
                            </button>
                        </>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm text-slate-700 mb-4 font-bold">
                                会員登録はアプリから行えます
                            </p>
                            <div className="flex flex-col gap-2">
                                <a
                                    className="bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                                    href="https://apps.apple.com/jp/app/boat-bank/id6762543353"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    App Store からダウンロード <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700">サブスクリプション情報</h3>
                    <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                        <li>・タイトル: BOAT BANK スタンダード</li>
                        <li>・期間: 1か月単位（自動更新）</li>
                        <li>・価格: 月額 {priceLabel}（税込）</li>
                        <li>・無料トライアル: 30日間（初回のみ）</li>
                        <li>・支払いはApp Storeアカウントに請求されます</li>
                        <li>・自動更新は、現在の期間終了の24時間前までに解約しない限り継続されます</li>
                        <li>・解約は iPhone「設定」＞「Apple ID」＞「サブスクリプション」から</li>
                    </ul>
                </div>

                <div className="flex items-center justify-center gap-3 text-[11px] mb-4 flex-wrap">
                    <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#533afd] underline hover:text-[#4125d1]"
                    >
                        利用規約 (EULA)
                    </a>
                    <span className="text-slate-300">|</span>
                    <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#533afd] underline hover:text-[#4125d1]"
                    >
                        プライバシーポリシー
                    </a>
                    <span className="text-slate-300">|</span>
                    <a
                        href="/sct"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#533afd] underline hover:text-[#4125d1]"
                    >
                        特定商取引法
                    </a>
                </div>

                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    現在のプラットフォーム: {platform}
                </p>
            </div>
        </div>
    );
}
