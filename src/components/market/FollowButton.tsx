"use client";

import { useState } from "react";
import { toggleFollow } from "@/actions/social";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

export function FollowButton({ targetUserId, initialIsFollowing }: { targetUserId: string, initialIsFollowing: boolean }) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if this is inside a Link
        setLoading(true);
        try {
            const res = await toggleFollow(targetUserId);
            if (res.success) {
                setIsFollowing(res.isFollowing);
            }
        } catch (err) {
            console.error("Failed to follow", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={loading}
            className={`h-7 px-3 text-[10px] font-bold rounded-full transition-colors ${isFollowing
                    ? 'border-slate-300 text-slate-500 hover:bg-slate-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                }`}
        >
            {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    フォロー中
                </>
            ) : (
                <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    フォロー
                </>
            )}
        </Button>
    );
}
