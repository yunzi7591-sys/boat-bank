"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function LoginForm({ callbackUrl = "/mypage" }: { callbackUrl?: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                if (res.error.includes("EMAIL_NOT_VERIFIED") || res.code === "EMAIL_NOT_VERIFIED") {
                    toast.error("メールアドレスが未確認です。確認メールをご確認ください。");
                    router.push(`/check-email?email=${encodeURIComponent(email)}`);
                } else {
                    toast.error("メールアドレスまたはパスワードが間違っています");
                }
                setIsLoading(false);
            } else {
                toast.success("ログインしました");
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (error) {
            toast.error("ログインエラーが発生しました");
            setIsLoading(false);
        }
    }

    const oauthBeforeSignIn = () => {
        if (!agreeTerms || !agreePrivacy) {
            toast.error("利用規約とプライバシーポリシーに同意してください（新規登録の場合）");
            return false;
        }
        return true;
    };

    return (
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
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-bold">パスワード</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="bg-slate-50 border-slate-200"
                />
            </div>
            <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-[#533afd] hover:underline">
                    パスワードを忘れた方
                </Link>
            </div>
            <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ログイン"}
            </Button>

            <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-slate-400">または</span>
                </div>
            </div>

            <div className="space-y-3 pt-1 pb-2">
                <p className="text-[11px] text-slate-500">
                    Apple / Google で初めて利用される方は、以下にご同意ください
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#533afd] focus:ring-[#533afd]" />
                    <span className="text-xs text-slate-600">
                        <Link href="/terms" target="_blank" className="text-[#533afd] underline">利用規約</Link>に同意する
                    </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#533afd] focus:ring-[#533afd]" />
                    <span className="text-xs text-slate-600">
                        <Link href="/privacy" target="_blank" className="text-[#533afd] underline">プライバシーポリシー</Link>に同意する
                    </span>
                </label>
            </div>

            <div className="space-y-2">
                <GoogleSignInButton beforeSignIn={oauthBeforeSignIn} />
                <AppleSignInButton beforeSignIn={oauthBeforeSignIn} />
            </div>
        </form>
    );
}
