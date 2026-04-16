"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ReloadButton({ className }: { className?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleRefresh = () => {
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
            className={cn("p-1 rounded-full hover:bg-slate-200/50 transition-colors disabled:opacity-50", className)}
            aria-label="最新データに更新"
        >
            <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
        </button>
    );
}
