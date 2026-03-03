"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ApiActionForms() {
    const [isPendingSync, startTransitionSync] = useTransition();
    const [isPendingEval, startTransitionEval] = useTransition();

    const handleScheduleSync = () => {
        startTransitionSync(async () => {
            try {
                const res = await fetch('/api/sync?secret=' + (process.env.NEXT_PUBLIC_CRON_SECRET || ''));
                const result = await res.json();
                if (res.ok && result.success) {
                    toast.success(`同期完了: スケジュール ${result.schedule?.count || 0}件, スクレイピング ${result.scrape?.count || 0}件`);
                } else {
                    toast.error(`同期失敗: ${result.error || "データが取得できませんでした"}`);
                }
            } catch (error: any) {
                toast.error(`同期エラー: ${error.message}`);
            }
        });
    };

    const handleResultSync = () => {
        startTransitionEval(async () => {
            try {
                const res = await fetch('/api/cron/sync-results');
                const result = await res.json();
                if (res.ok && result.status === 'Success') {
                    toast.success(`[結果同期完了] ${result.syncedCount}件取得, ${result.settlementProcessedCount}件精算 (${result.races || 'なし'})`);
                } else {
                    toast.error(`結果同期失敗: ${result.message || "データが取得できませんでした"}`);
                }
            } catch (error: any) {
                toast.error(`同期エラー: ${error.message}`);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Sync Schedule */}
            <div>
                <Button
                    onClick={handleScheduleSync}
                    disabled={isPendingSync}
                    className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                    <DownloadCloud className={`w-4 h-4 mr-2 ${isPendingSync ? 'animate-bounce' : ''}`} />
                    {isPendingSync ? "同期・スクレイピング中..." : "本日のレース予定＆公式データ(グレード等)を同期"}
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                    APIからスケジュールを取得し、同時にboatrace.jpをスクレイピングして「グレード」「何日目か」の正確な情報をDBに保存します。（毎朝7時自動）
                </p>
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
                    {isPendingEval ? "取得＆精算中..." : "最新のレース結果をAPIから一括同期して精算"}
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                    本日のレースのうち、終了したものを一括で取得し全ユーザーの成績を再評価します。(通常は5分おきに自動実行されます)
                </p>
            </div>
        </div>
    );
}
