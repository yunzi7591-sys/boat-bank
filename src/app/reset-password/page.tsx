"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { resetPassword } from "@/actions/auth";
import { Suspense } from "react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("パスワードが一致しません");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("パスワードは8文字以上で入力してください");
            setIsLoading(false);
            return;
        }

        try {
            const result = await resetPassword(token || "", password);
            if (result.error) {
                setError(result.error);
            } else {
                setSuccess(true);
            }
        } catch {
            setError("エラーが発生しました。しばらくしてから再度お試しください。");
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">無効なリンクです。</p>
                </div>
                <Link href="/forgot-password" className="inline-block text-sm text-[#533afd] hover:underline">
                    パスワードリセットをやり直す
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-emerald-700 text-sm">
                        パスワードを変更しました。新しいパスワードでログインしてください。
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-md transition-colors"
                >
                    ログインへ
                </Link>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-bold">新しいパスワード</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        placeholder="8文字以上"
                        className="bg-slate-50 border-slate-200"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-700 font-bold">パスワード（確認）</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={8}
                        placeholder="もう一度入力"
                        className="bg-slate-50 border-slate-200"
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "パスワードを変更する"}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[#533afd] hover:underline">
                    ログインに戻る
                </Link>
            </div>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-lg shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-18px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100">
                <div className="bg-[#1c1e54] px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="relative z-10 flex items-center justify-center gap-1.5 mb-2">
                        <span className="bg-[#533afd] text-white font-light text-sm px-2.5 py-0.5 rounded-md">BOAT</span>
                        <span className="font-light text-xl text-white tracking-wide">BANK</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium relative z-10">ガチ予想のマーケットプレイス</p>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-light text-[#061b31] mb-6 text-center">パスワード再設定</h2>
                    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
