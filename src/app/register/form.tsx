"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerUser } from "@/actions/auth";
import { signIn } from "next-auth/react";

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await registerUser(formData);

            if (res.error) {
                toast.error(res.error);
                setIsLoading(false);
            } else {
                toast.success("アカウントが作成されました！自動ログインします...");
                // Auto login after registration
                await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                router.push("/mypage");
                router.refresh();
            }
        } catch (error) {
            toast.error("登録エラーが発生しました");
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-bold">ニックネーム</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="名無し"
                    className="bg-slate-50 border-slate-200"
                />
            </div>
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
                    placeholder="6文字以上"
                    className="bg-slate-50 border-slate-200"
                />
            </div>
            <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "アカウントを作成"}
            </Button>
        </form>
    );
}
