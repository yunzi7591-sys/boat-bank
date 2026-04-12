"use client";

import { useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

interface UserItem {
    id: string;
    name: string;
    followerCount: number;
}

function UserList({ users, emptyMessage }: { users: UserItem[]; emptyMessage: string }) {
    if (users.length === 0) {
        return (
            <div className="py-12 text-center">
                <Users className="w-8 h-8 text-[#e5edf5] mx-auto mb-2" />
                <p className="text-sm text-[#64748d]">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {users.map(user => (
                <Link key={user.id} href={`/users/${user.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[#f8fafc] transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-sm text-slate-600">
                                {user.name.charAt(0)}
                            </div>
                            <span className="font-bold text-[#061b31]">{user.name}</span>
                        </div>
                        <span className="text-xs text-[#64748d]">{user.followerCount} フォロワー</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export function FollowTabs({ followingList, followerList }: { followingList: UserItem[]; followerList: UserItem[] }) {
    const [activeTab, setActiveTab] = useState<"following" | "followers">("following");

    return (
        <div>
            <div className="grid grid-cols-2 mb-4 h-11 bg-white shadow-sm border border-[#e5edf5] rounded-lg p-1">
                <button
                    onClick={() => setActiveTab("following")}
                    className={`font-semibold text-sm rounded-md transition-all ${activeTab === "following" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    フォロー中 ({followingList.length})
                </button>
                <button
                    onClick={() => setActiveTab("followers")}
                    className={`font-semibold text-sm rounded-md transition-all ${activeTab === "followers" ? "bg-[#533afd] text-white" : "text-[#64748d]"}`}
                >
                    フォロワー ({followerList.length})
                </button>
            </div>

            {activeTab === "following" && (
                <UserList users={followingList} emptyMessage="まだ誰もフォローしていません" />
            )}
            {activeTab === "followers" && (
                <UserList users={followerList} emptyMessage="まだフォロワーがいません" />
            )}
        </div>
    );
}
