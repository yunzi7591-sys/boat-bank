"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markNotificationsAsRead } from "@/actions/notification";

interface Notification {
    id: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
}

export function HeaderNotifications({ notifications }: { notifications: Notification[] }) {
    const [open, setOpen] = useState(false);
    const [localNotifications, setLocalNotifications] = useState(notifications);

    const unreadCount = localNotifications.filter(n => !n.isRead).length;

    const handleOpenChange = async (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen && unreadCount > 0) {
            // Optimistic update
            setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            // Server update
            await markNotificationsAsRead();
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-blue-800 rounded-full">
                        <Bell className="w-5 h-5" />
                    </Button>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-blue-900 border border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-xl border-slate-200 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" align="end">
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-black text-slate-800 tracking-wider">NOTIFICATIONS</h3>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {localNotifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs font-bold">
                            通知はありません
                        </div>
                    ) : (
                        localNotifications.map((n) => (
                            <div key={n.id} className={`p-4 transition-colors ${n.isRead ? 'bg-white' : 'bg-blue-50/50'}`}>
                                <p className="text-sm text-slate-700 font-bold leading-snug mb-1">
                                    {n.message}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(n.createdAt).toLocaleString('ja-JP', {
                                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
