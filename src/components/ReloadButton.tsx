"use client";

import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ReloadButton({ className }: { className?: string }) {
    const router = useRouter();
    const [spinning, setSpinning] = useState(false);

    const handleReload = () => {
        setSpinning(true);
        router.refresh();
        setTimeout(() => setSpinning(false), 1000);
    };

    return (
        <button
            onClick={handleReload}
            className={cn("p-1.5 rounded-lg hover:bg-black/10 active:scale-90 transition-all", className)}
            aria-label="更新"
        >
            <RotateCw className={cn("w-4 h-4", spinning && "animate-spin")} />
        </button>
    );
}
