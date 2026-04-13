"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUser, deleteUser } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, X, Search } from "lucide-react";

type UserItem = {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    points: number;
    dailyPoints: number;
    emailVerified: string | null;
    _count: {
        followers: number;
        following: number;
        predictions: number;
    };
};

export function UserManager() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // 編集ダイアログ
    const [editUser, setEditUser] = useState<UserItem | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState("BUYER");
    const [editPoints, setEditPoints] = useState(0);
    const [editDailyPoints, setEditDailyPoints] = useState(0);

    const fetchUsers = async () => {
        const result = await getAllUsers();
        if (result.error) {
            setMessage(result.error);
        } else {
            setUsers(result.users as any);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openEditDialog = (user: UserItem) => {
        setEditUser(user);
        setEditName(user.name || "");
        setEditEmail(user.email || "");
        setEditRole(user.role);
        setEditPoints(user.points);
        setEditDailyPoints(user.dailyPoints);
        setMessage("");
    };

    const handleUpdate = async () => {
        if (!editUser) return;
        setLoading(true);
        setMessage("");
        const result = await updateUser(editUser.id, {
            name: editName,
            email: editEmail,
            role: editRole,
            points: editPoints,
            dailyPoints: editDailyPoints,
        });
        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage("ユーザーを更新しました");
            setEditUser(null);
            await fetchUsers();
        }
        setLoading(false);
    };

    const handleDelete = async (userId: string, userName: string | null) => {
        if (!confirm(`「${userName || "名前なし"}」を削除しますか？関連データもすべて削除されます。`)) return;
        setLoading(true);
        setMessage("");
        const result = await deleteUser(userId);
        if (result.error) {
            setMessage(result.error);
        } else {
            setMessage("ユーザーを削除しました");
            await fetchUsers();
        }
        setLoading(false);
    };

    const filteredUsers = users.filter((u) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            {/* 検索 */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="名前・メールで検索..."
                    className="pl-9"
                />
            </div>

            {message && (
                <p className={`text-xs font-bold ${message.includes("失敗") || message.includes("権限") || message.includes("できません") ? "text-red-500" : "text-emerald-600"}`}>
                    {message}
                </p>
            )}

            {/* ユーザー一覧 */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">
                    全ユーザー ({filteredUsers.length}件)
                </h3>
                {filteredUsers.length === 0 ? (
                    <p className="text-xs text-slate-400">ユーザーが見つかりません</p>
                ) : (
                    <div className="space-y-2">
                        {filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="p-3 rounded-lg border bg-white border-slate-200"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-slate-800 truncate">
                                                {user.name || "（名前なし）"}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    user.role === "ADMIN"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}
                                            >
                                                {user.role}
                                            </span>
                                            {user.emailVerified ? (
                                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                                    認証済
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                    未認証
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                            {user.email || "メールなし"}
                                        </p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                                            <span className="text-[11px] text-slate-500">
                                                保有pt: <span className="font-bold text-slate-700">{user.points.toLocaleString()}</span>
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                Daily: <span className="font-bold text-slate-700">{user.dailyPoints.toLocaleString()}</span>
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                フォロワー: <span className="font-bold text-slate-700">{user._count.followers}</span>
                                            </span>
                                            <span className="text-[11px] text-slate-500">
                                                予想: <span className="font-bold text-slate-700">{user._count.predictions}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(user)}
                                            className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(user.id, user.name)}
                                            disabled={loading}
                                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 編集ダイアログ（オーバーレイ） */}
            {editUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">ユーザー編集</h3>
                            <button
                                onClick={() => setEditUser(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">名前</label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">メールアドレス</label>
                                <Input
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">ロール</label>
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="BUYER">BUYER</option>
                                    <option value="MONITOR">MONITOR</option>
                                    <option value="ADMIN">ADMIN</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">保有ポイント</label>
                                    <Input
                                        type="number"
                                        value={editPoints}
                                        onChange={(e) => setEditPoints(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">デイリーポイント</label>
                                    <Input
                                        type="number"
                                        value={editDailyPoints}
                                        onChange={(e) => setEditDailyPoints(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex-1"
                            >
                                {loading ? "保存中..." : "保存"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setEditUser(null)}
                                className="flex-1"
                            >
                                キャンセル
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
