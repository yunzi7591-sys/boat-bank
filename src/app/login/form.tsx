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

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

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
                router.push("/mypage");
                router.refresh();
            }
        } catch (error) {
            toast.error("ログインエラーが発生しました");
            setIsLoading(false);
        }
    }

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
        </form>
    );
}
