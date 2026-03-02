"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { ridePrediction } from "@/actions/prediction";
import { useRouter } from "next/navigation";

interface RideButtonProps {
    predictionId: string;
    betAmount: number;
    isClosed: boolean;
}

export function RideButton({ predictionId, betAmount, isClosed }: RideButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRide = () => {
        if (confirm(`この予想に相乗りしますか？（${betAmount.toLocaleString()}pt消費します）`)) {
            startTransition(async () => {
                try {
                    await ridePrediction(predictionId);
                    toast.success("相乗りしました！", {
                        description: `ポイントから${betAmount.toLocaleString()}pt消費して、自分の非公開予想として登録しました。`,
                    });
                    router.push('/mypage');
                } catch (error: any) {
                    toast.error(error.message || "相乗りに失敗しました");
                }
            });
        }
    };

    if (isClosed || betAmount <= 0) {
        return null; // Do not show if closed or no bet amount
    }

    return (
        <Button
            onClick={handleRide}
            disabled={isPending}
            className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black py-6 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
            {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Zap className="w-5 h-5 fill-white" />
            )}
            この予想に乗る（{betAmount.toLocaleString()}pt消費）
        </Button>
    );
}
