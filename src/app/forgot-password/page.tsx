"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const result = await requestPasswordReset(email);
            if (result.error) {
                setError(result.error);
            } else {
                setSent(true);
            }
        } catch {
            setError("エラーが発生しました。しばらくしてから再度お試しください。");
        } finally {
            setIsLoading(false);
        }
    }

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
                    <h2 className="text-lg font-light text-[#061b31] mb-6 text-center">パスワードリセット</h2>

                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <p className="text-emerald-700 text-sm">
                                    入力されたメールアドレスにリセット用のメールを送信しました。メールをご確認ください。
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-block text-sm text-[#533afd] hover:underline"
                            >
                                ログインに戻る
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 text-sm mb-4 text-center">
                                登録済みのメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700 font-bold">メールアドレス</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "リセットメールを送信"}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link href="/login" className="text-sm text-[#533afd] hover:underline">
                                    ログインに戻る
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
