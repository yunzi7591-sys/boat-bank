"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, Megaphone, ChevronDown } from "lucide-react";
import { updateNotificationSettings } from "@/actions/notification";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
    initialSettings: {
        notifySale: boolean;
        notifyNewPrediction: boolean;
    };
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50",
                checked ? "bg-[#533afd]" : "bg-slate-200"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    );
}

export function NotificationSettings({ initialSettings }: NotificationSettingsProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const handleChange = (key: keyof typeof settings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        startTransition(async () => {
            const res = await updateNotificationSettings(newSettings);
            if (res?.success) {
                toast.success("通知設定を保存しました", { duration: 1500 });
            }
        });
    };

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
            >
                <span className="text-sm font-bold text-[#061b31]">通知設定</span>
                <ChevronDown className={cn("w-4 h-4 text-[#94a3b8] transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="divide-y divide-[#f1f5f9] animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#533afd]/10 text-[#533afd]">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#061b31]">予想が購入された時</p>
                                <p className="text-[11px] text-[#94a3b8]">有料・無料どちらも通知</p>
                            </div>
                        </div>
                        <Toggle
                            checked={settings.notifySale}
                            onChange={(v) => handleChange("notifySale", v)}
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
                                <Megaphone className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#061b31]">フォロー中の人が予想を公開</p>
                                <p className="text-[11px] text-[#94a3b8]">新しい予想が出た時に通知</p>
                            </div>
                        </div>
                        <Toggle
                            checked={settings.notifyNewPrediction}
                            onChange={(v) => handleChange("notifyNewPrediction", v)}
                            disabled={isPending}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
