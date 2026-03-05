"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function RefreshButton() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleRefresh = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isPending) return;

        startTransition(() => {
            router.refresh();
        });
        toast.success("最新の情報に更新しました", { duration: 2000 });
    };

    return (
        <button
            onClick={handleRefresh}
            disabled={isPending}
            className="p-1 ml-0.5 rounded-full hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-blue-600 disabled:opacity-50 outline-none focus:ring-2 focus:ring-blue-500/20"
            title="最新データに更新"
            aria-label="Refresh data"
        >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-blue-600' : ''}`} />
        </button>
    );
}
