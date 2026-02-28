"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadCloud, CheckCircle2 } from "lucide-react";
import { triggerSyncSchedule, triggerApiEvaluation } from "@/actions/admin";
import { toast } from "sonner";

export function ApiActionForms() {
    const [isPendingSync, startTransitionSync] = useTransition();
    const [isPendingEval, startTransitionEval] = useTransition();

    const handleSync = () => {
        startTransitionSync(async () => {
            const result = await triggerSyncSchedule();
            if (result.success) {
                toast.success(`同期完了: ${result.count}件のスケジュールをDBに保存しました`);
            } else {
                toast.error(`同期失敗: ${result.error || "データが取得できませんでした"}`);
            }
        });
    };

    const handleEvaluation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransitionEval(async () => {
            const placeName = formData.get("placeName") as string;
            const raceNumber = parseInt(formData.get("raceNumber") as string);

            const result = await triggerApiEvaluation(formData);

            if (result.success) {
                toast.success(`[判定完了] ${placeName} ${raceNumber}R の結果をAPIから取得し、全成績を再評価しました！`);
            } else {
                toast.error(`判定失敗: ${result.error || "データにアクセスできません"}`);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Sync Schedule */}
            <div>
                <Button
                    onClick={handleSync}
                    disabled={isPendingSync}
                    className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                    <DownloadCloud className={`w-4 h-4 mr-2 ${isPendingSync ? 'animate-bounce' : ''}`} />
                    {isPendingSync ? "同期中..." : "本日のレース予定をAPIから同期"}
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                    APIから「本日の開催場」「全レース番号」「締切時刻」を一括取得し、データベースに保存します。
                </p>
            </div>

            <hr className="border-slate-100" />

            {/* Fetch Race Result & Evaluate */}
            <div>
                <form onSubmit={handleEvaluation} className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">場名</label>
                            <Input name="placeName" placeholder="桐生" required className="bg-slate-50 font-bold" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">R数</label>
                            <Input name="raceNumber" type="number" placeholder="12" required className="bg-slate-50 font-bold" />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isPendingEval}
                        className="w-full h-12 text-sm font-bold bg-slate-800 hover:bg-slate-900 rounded-xl text-blue-50"
                    >
                        <CheckCircle2 className={`w-4 h-4 mr-2 text-blue-400 ${isPendingEval ? 'animate-spin' : ''}`} />
                        {isPendingEval ? "取得中..." : "指定レースの結果をAPIから取得して判定"}
                    </Button>
                </form>
                <p className="text-xs text-slate-500 mt-2">
                    APIから指定したレースの着順・払戻金を自動取得し、即座に全投資家の成績再評価バッチを走らせます。
                </p>
            </div>
        </div>
    );
}
