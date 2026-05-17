"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { searchUsers } from "@/actions/search";

type UserResult = {
    id: string;
    name: string | null;
    role: string;
    followerCount: number;
};

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchUsers = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const data = await searchUsers(q);
            setResults(data);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchUsers("");
    }, [fetchUsers]);

    // Debounced search
    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            fetchUsers(query);
        }, 300);
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [query, fetchUsers]);

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Search bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#e5edf5] px-4 py-3">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ユーザーを検索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-lg border border-[#e5edf5] bg-white px-4 py-2.5 text-sm text-[#061b31] placeholder-[#64748d] outline-none focus:border-[#533afd] focus:ring-1 focus:ring-[#533afd]"
                />
            </div>

            {/* Results */}
            <div className="px-4 py-2">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#533afd] border-t-transparent" />
                    </div>
                ) : results.length === 0 ? (
                    <p className="py-12 text-center text-sm text-[#64748d]">
                        ユーザーが見つかりません
                    </p>
                ) : (
                    <ul className="divide-y divide-[#e5edf5]">
                        {results.map((user) => (
                            <li key={user.id}>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/users/${user.id}`)}
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-left transition-colors active:bg-[#f8fafc]"
                                >
                                    <span className="font-bold text-[#061b31] flex items-center gap-1.5">
                                        {user.name ?? "名前未設定"}
                                        {user.role === 'ADMIN' && <span className="text-[8px] font-black bg-amber-400 text-amber-900 px-1 py-0.5 rounded leading-none">公式</span>}
                                    </span>
                                    <span className="text-xs text-[#64748d]">
                                        {user.followerCount} フォロワー
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
