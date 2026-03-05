"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";
import { triggerSyncSchedule, triggerSyncScrape, triggerResultSyncBulk } from "@/actions/admin";

export function ApiActionForms() {
    const [isPendingApiSync, startTransitionApiSync] = useTransition();
    const [isPendingScrape, startTransitionScrape] = useTransition();
    const [isPendingEval, startTransitionEval] = useTransition();

    const handleScheduleApiSync = () => {
        startTransitionApiSync(async () => {
            try {
                const result = await triggerSyncSchedule();
                if (result.success) {
                    toast.success(`API同期完了: ${result.count || 0}件のレース予定を保存しました`);
                } else {
                    toast.error(`API同期失敗: ${result.error || "データが取得できませんでした"}`);
                }
            } catch (error: any) {
                toast.error(`API同期エラー: ${error.message}`);
            }
        });
    };

    const handleScraping = () => {
        startTransitionScrape(async () => {
            try {
                const result = await triggerSyncScrape();
                if (result.success) {
                    toast.success(`スクレイピング完了: ${result.count || 0}件の公式データを補完しました`);
                } else {
                    toast.error(`スクレイピング失敗: ${result.error || "データが取得できませんでした"}`);
                }
            } catch (error: any) {
                toast.error(`スクレイピングエラー: ${error.message}`);
            }
        });
    };

    const handleResultSync = () => {
        startTransitionEval(async () => {
            try {
                const result = await triggerResultSyncBulk();
                if (result.success) {
                    toast.success(`[結果同期完了] ${result.syncedCount}件取得, ${result.settlementProcessedCount}件精算 (${result.races || 'なし'})`);
                } else {
                    toast.error(`結果同期失敗: ${result.error || "データが取得できませんでした"}`);
                }
            } catch (error: any) {
                toast.error(`結果同期エラー: ${error.message}`);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sync Schedule (API) */}
                <div className="space-y-2">
                    <Button
                        onClick={handleScheduleApiSync}
                        disabled={isPendingApiSync || isPendingScrape}
                        className="w-full h-auto whitespace-normal p-4 text-sm font-bold bg-blue-600 hover:bg-blue-700 rounded-xl"
                    >
                        <DownloadCloud className={`w-4 h-4 mr-2 shrink-0 ${isPendingApiSync ? 'animate-bounce' : ''}`} />
                        <span>{isPendingApiSync ? "API同期中..." : "本日のレース予定を同期 (API)"}</span>
                    </Button>
                    <p className="text-[11px] text-slate-500 leading-tight">
                        高速で安定したAPIから本日の全レースプログラムを取得し、データベースに下書き作成します。
                    </p>
                </div>

                {/* Scrape Data (Web) */}
                <div className="space-y-2">
                    <Button
                        onClick={handleScraping}
                        disabled={isPendingScrape || isPendingApiSync}
                        variant="outline"
                        className="w-full h-auto whitespace-normal p-4 text-sm font-bold border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl"
                    >
                        <Globe className={`w-4 h-4 mr-2 shrink-0 ${isPendingScrape ? 'animate-pulse' : ''}`} />
                        <span>{isPendingScrape ? "情報収集中..." : "公式データを補完 (スクレイピング)"}</span>
                    </Button>
                    <p className="text-[11px] text-slate-500 leading-tight">
                        boatrace.jp をスクレイピングし、正確な「グレード」「何日目か」の情報を補完します。少し時間がかかります。
                    </p>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Fetch Race Result & Evaluate Bulk */}
            <div>
                <Button
                    onClick={handleResultSync}
                    disabled={isPendingEval}
                    className="w-full h-12 text-sm font-bold bg-slate-800 hover:bg-slate-900 rounded-xl text-blue-50"
                >
                    <CheckCircle2 className={`w-4 h-4 mr-2 text-blue-400 ${isPendingEval ? 'animate-spin' : ''}`} />
                    {isPendingEval ? "スクレイピング＆精算中..." : "最新のレース結果を公式からスクレイピングして精算"}
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                    締切から10分以上経過したレースを公式サイトから直接スクレイピングし、的中判定と精算を行います。(GitHub Actionsにより5分おきに自動実行されます)
                </p>
            </div>
        </div>
    );
}
