"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { changePassword } from "@/actions/profile";
import { deleteAccount } from "@/actions/account";

export function AccountSettings({ hasPassword = true }: { hasPassword?: boolean }) {
    const [open, setOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteText, setDeleteText] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    async function handleDelete(e: React.FormEvent) {
        e.preventDefault();
        setDeleteError("");
        setDeleteLoading(true);
        try {
            const result = await deleteAccount({
                confirmation: deleteText,
                password: hasPassword ? deletePassword : undefined,
            });
            if (result.success) {
                window.location.href = "/";
            } else {
                setDeleteError(result.error || "削除に失敗しました");
                setDeleteLoading(false);
            }
        } catch {
            setDeleteError("削除に失敗しました");
            setDeleteLoading(false);
        }
    }

    function resetForm() {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess("");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("新しいパスワードが一致しません。");
            return;
        }

        if (newPassword.length < 8) {
            setError("新しいパスワードは8文字以上で入力してください。");
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword({
                currentPassword,
                newPassword,
            });

            if (result.success) {
                setSuccess("パスワードを変更しました。");
                setTimeout(() => {
                    setOpen(false);
                    resetForm();
                }, 1500);
            } else {
                setError(result.error || "パスワードの変更に失敗しました。");
            }
        } catch {
            setError("パスワードの変更に失敗しました。");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-[#061b31] hover:text-[#533afd] hover:bg-[rgba(83,58,253,0.05)] font-medium h-12 rounded-lg group transition-all border border-[#e5edf5]"
                    >
                        <KeyRound className="w-5 h-5 mr-3 text-[#64748d] group-hover:text-[#533afd]" />
                        パスワード変更
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#061b31]">パスワード変更</DialogTitle>
                        <DialogDescription className="text-[#64748d]">
                            現在のパスワードを入力し、新しいパスワードを設定してください。
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-[#273951]">
                                現在のパスワード
                            </Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="border-[#e5edf5] focus-visible:border-[#533afd] focus-visible:ring-[#533afd]/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-[#273951]">
                                新しいパスワード
                            </Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="border-[#e5edf5] focus-visible:border-[#533afd] focus-visible:ring-[#533afd]/20"
                            />
                            <p className="text-xs text-[#64748d]">8文字以上で入力してください</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-[#273951]">
                                新しいパスワード（確認）
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="border-[#e5edf5] focus-visible:border-[#533afd] focus-visible:ring-[#533afd]/20"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="text-sm text-[#108c3d] bg-[rgba(21,190,83,0.1)] px-3 py-2 rounded-md border border-[rgba(21,190,83,0.3)]">
                                {success}
                            </p>
                        )}

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-[#533afd] hover:bg-[#4434d4] text-white rounded-[4px]"
                            >
                                {loading ? "変更中..." : "パスワードを変更"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Button
                variant="ghost"
                onClick={() => signOut({ redirectTo: "/login" })}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-medium h-12 rounded-lg group transition-all border border-[#e5edf5]"
            >
                <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-600" />
                ログアウト
            </Button>

            <Dialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) { setDeleteText(""); setDeletePassword(""); setDeleteError(""); } }}>
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-700 hover:text-red-800 hover:bg-red-50 font-medium h-12 rounded-lg group transition-all border border-red-200"
                    >
                        <Trash2 className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-700" />
                        アカウントを削除
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-700">アカウントを削除</DialogTitle>
                        <DialogDescription className="text-[#64748d] space-y-2">
                            <span className="block">この操作は取り消せません。以下のデータがすべて完全に削除されます。</span>
                            <span className="block text-xs">・プロフィール、保有ポイント<br/>・予想、取引履歴、賭け履歴<br/>・フォロー関係、通知設定<br/>・サブスクリプション情報</span>
                            <span className="block text-xs text-amber-700 bg-amber-50 p-2 rounded mt-2">
                                ⚠️ サブスク有効中の方は、先に「サブスクリプション → 解約」を済ませてください。App Store の課金はアプリでは解約できません（iPhone「設定 → Apple ID → サブスクリプション」から）。
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDelete} className="space-y-4">
                        {hasPassword && (
                            <div className="space-y-2">
                                <Label htmlFor="delete-password" className="text-[#273951]">
                                    本人確認のためパスワードを入力
                                </Label>
                                <Input
                                    id="delete-password"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="border-red-200 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="delete-confirm" className="text-[#273951]">
                                確認のため「<span className="font-bold">削除</span>」と入力してください
                            </Label>
                            <Input
                                id="delete-confirm"
                                type="text"
                                value={deleteText}
                                onChange={(e) => setDeleteText(e.target.value)}
                                required
                                className="border-red-200 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            />
                        </div>

                        {deleteError && (
                            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                                {deleteError}
                            </p>
                        )}

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={deleteLoading || deleteText !== "削除" || (hasPassword && !deletePassword)}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-[4px]"
                            >
                                {deleteLoading ? "削除中..." : "アカウントを完全に削除する"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
