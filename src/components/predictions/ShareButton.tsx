"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareButton({ title, urlPath }: { title: string; urlPath: string }) {
    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if placed inside a Link
        e.stopPropagation();

        const fullUrl = `${window.location.origin}${urlPath}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "BOAT BANK - 予想",
                    text: title,
                    url: fullUrl,
                });
            } catch (error) {
                if ((error as Error).name !== "AbortError") {
                    copyToClipboard(fullUrl);
                }
            }
        } else {
            copyToClipboard(fullUrl);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success("リンクをコピーしました", { position: 'top-center' });
        }).catch(() => {
            toast.error("コピーに失敗しました", { position: 'top-center' });
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors"
        >
            <Share2 className="w-4 h-4" />
        </Button>
    );
}
