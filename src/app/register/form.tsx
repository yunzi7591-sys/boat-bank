"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerUser } from "@/actions/auth";
import Link from "next/link";

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!agreeTerms || !agreePrivacy) {
            toast.error("利用規約とプライバシーポリシーに同意してください");
            return;
        }
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const res = await registerUser(formData);

            if (res.error) {
                toast.error(res.error);
                setIsLoading(false);
            } else if (res.needsVerification) {
                router.push(`/check-email?email=${encodeURIComponent(email)}`);
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
                <Input id="name" name="name" type="text" required placeholder="名無し" className="bg-slate-50 border-slate-200" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold">メールアドレス</Label>
                <Input id="email" name="email" type="email" required placeholder="name@example.com" className="bg-slate-50 border-slate-200" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-bold">パスワード</Label>
                <Input id="password" name="password" type="password" required placeholder="8文字以上" className="bg-slate-50 border-slate-200" />
            </div>

            <div className="space-y-3 pt-2">
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

            <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                disabled={isLoading || !agreeTerms || !agreePrivacy}
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "アカウントを作成"}
            </Button>
        </form>
    );
}
