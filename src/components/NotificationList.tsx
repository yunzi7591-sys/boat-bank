"use client";

import { ShoppingCart, UserPlus, Megaphone, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
    id: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Info; color: string }> = {
    SALE: { icon: ShoppingCart, color: "text-[#533afd] bg-[#533afd]/10" },
    NEW_PREDICTION: { icon: Megaphone, color: "text-amber-600 bg-amber-50" },
    FOLLOW: { icon: UserPlus, color: "text-emerald-600 bg-emerald-50" },
    SYSTEM: { icon: Info, color: "text-slate-500 bg-slate-100" },
};

export function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Info className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-bold text-slate-400">通知はまだありません</p>
                <p className="text-xs text-slate-300 mt-1">予想が購入されたりフォロー中の人が予想を公開するとここに届きます</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-[#f1f5f9]">
            {notifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.SYSTEM;
                const Icon = config.icon;

                return (
                    <div
                        key={n.id}
                        className={cn(
                            "px-4 py-3 flex items-start gap-3 transition-colors",
                            !n.isRead && "bg-blue-50/40"
                        )}
                    >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", config.color)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#061b31] leading-snug">{n.message}</p>
                            <span className="text-[10px] text-[#94a3b8] mt-1 block">
                                {new Date(n.createdAt).toLocaleString("ja-JP", {
                                    timeZone: "Asia/Tokyo",
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
