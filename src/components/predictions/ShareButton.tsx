"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
    title: string;
    urlPath: string;
    placeName?: string;
    raceNumber?: number;
};

function buildShareText(placeName?: string, raceNumber?: number) {
    if (placeName && raceNumber) {
        return `${placeName} ${raceNumber}R の予想🚤`;
    }
    return "BOAT BANK の予想🚤";
}

export function ShareButton({ title, urlPath, placeName, raceNumber }: Props) {
    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const cacheBuster = Date.now().toString(36);
        const separator = urlPath.includes("?") ? "&" : "?";
        const fullUrl = `${window.location.origin}${urlPath}${separator}ref=${cacheBuster}`;
        const shareText = buildShareText(placeName, raceNumber);

        const predictionId = urlPath.match(/\/predictions\/([^/?#]+)/)?.[1];
        if (predictionId) {
            fetch(`/api/og/warmup?id=${predictionId}`, { cache: "no-store" }).catch(() => {});
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || "BOAT BANK - 予想",
                    text: shareText,
                    url: fullUrl,
                });
                return;
            } catch (error) {
                if ((error as Error).name === "AbortError") return;
            }
        }

        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
        window.open(intentUrl, "_blank", "noopener,noreferrer");
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
