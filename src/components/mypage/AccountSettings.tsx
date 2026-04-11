"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, KeyRound } from "lucide-react";
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

export function AccountSettings() {
    const [open, setOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

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
        </div>
    );
}
