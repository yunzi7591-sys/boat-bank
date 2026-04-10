"use client";

import { useState, useTransition, useEffect } from "react";
import { getMyPredictions, deletePrediction } from "@/actions/admin-predictions";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Prediction = {
    id: string;
    title: string | null;
    placeName: string;
    raceNumber: number;
    raceDate: Date;
    publishType: string;
    price: number;
    isSettled: boolean;
    createdAt: Date;
};

export function AdminPredictionList() {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        getMyPredictions().then(setPredictions);
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm("この予想を削除しますか？関連するトランザクションも削除されます。")) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deletePrediction(id);
            if (result.success) {
                setPredictions(prev => prev.filter(p => p.id !== id));
                toast.success("予想を削除しました");
            } else {
                toast.error(result.error || "削除に失敗しました");
            }
            setDeletingId(null);
        });
    };

    if (predictions.length === 0) {
        return <p className="text-sm text-slate-400 text-center py-4">予想はありません</p>;
    }

    return (
        <div className="space-y-2">
            {predictions.map(pred => (
                <div key={pred.id} className={`flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg ${deletingId === pred.id ? "opacity-40" : ""}`}>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded">
                                {pred.placeName} {pred.raceNumber}R
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pred.publishType === "external" ? "bg-amber-100 text-amber-700" : pred.price > 0 ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                                {pred.publishType === "external" ? "外部" : pred.price > 0 ? `${pred.price}pt` : "無料"}
                            </span>
                            {pred.isSettled && <span className="text-[10px] text-slate-400">精算済</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate">{pred.title || "無題"}</p>
                        <p className="text-[10px] text-slate-400">{new Date(pred.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pred.id)}
                        disabled={isPending}
                        className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
