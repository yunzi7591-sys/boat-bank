"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
    userId: string;
    userName?: string | null;
};

/**
 * 自分の公開プロフィール（/users/[id]）を共有するボタン。
 * navigator.share が使えればOS共有シート、なければXへ投稿。
 */
export function ProfileShareButton({ userId, userName }: Props) {
    const handleShare = async () => {
        const cacheBuster = Date.now().toString(36);
        const fullUrl = `${window.location.origin}/users/${userId}?ref=${cacheBuster}`;
        const shareText = `${userName || "私"}の競艇収支・予想をチェック🚤 #BOATBANK`;

        if (navigator.share) {
            try {
                await navigator.share({ title: "BOAT BANK", text: shareText, url: fullUrl });
                return;
            } catch (error) {
                if ((error as Error).name === "AbortError") return;
            }
        }

        // フォールバック: Xへの投稿（共有シート非対応のPCブラウザ等）
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
        const opened = window.open(intentUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
            try {
                await navigator.clipboard.writeText(fullUrl);
                toast.success("リンクをコピーしました");
            } catch {
                toast.error("共有に失敗しました");
            }
        }
    };

    return (
        <button
            type="button"
            onClick={handleShare}
            aria-label="プロフィールを共有"
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
            <Share2 className="w-4 h-4" />
        </button>
    );
}
