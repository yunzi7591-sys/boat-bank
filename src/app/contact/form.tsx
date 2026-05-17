"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { sendContactMessage } from "@/actions/contact";

const CATEGORIES = ["不具合報告", "ご要望", "サブスクについて", "その他"] as const;

export function ContactForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [messageLength, setMessageLength] = useState(0);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await sendContactMessage(formData);
            if (res.error) {
                toast.error(res.error);
            } else {
                setSent(true);
                toast.success("お問い合わせを送信しました");
            }
        } catch {
            toast.error("送信エラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    }

    if (sent) {
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h2 className="text-lg font-bold text-emerald-900">送信完了</h2>
                <p className="text-sm text-emerald-800">
                    お問い合わせを受け付けました。<br />
                    通常2〜3営業日以内にご返信いたします。
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-bold">お名前</Label>
                <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    defaultValue={defaultName}
                    placeholder="山田 太郎"
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
                    defaultValue={defaultEmail}
                    placeholder="name@example.com"
                    className="bg-slate-50 border-slate-200"
                />
                <p className="text-xs text-slate-500">ご返信先のメールアドレスを正確にご入力ください。</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-700 font-bold">カテゴリ</Label>
                <select
                    id="category"
                    name="category"
                    required
                    defaultValue=""
                    className="w-full h-10 rounded-md bg-slate-50 border border-slate-200 px-3 text-sm"
                >
                    <option value="" disabled>選択してください</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="message" className="text-slate-700 font-bold">お問い合わせ内容</Label>
                    <span className={`text-xs ${messageLength > 3000 ? "text-red-500" : "text-slate-400"}`}>
                        {messageLength} / 3000
                    </span>
                </div>
                <textarea
                    id="message"
                    name="message"
                    required
                    maxLength={3000}
                    rows={8}
                    onChange={(e) => setMessageLength(e.target.value.length)}
                    placeholder="お問い合わせ内容をご記入ください。不具合報告の場合は、発生した状況や端末・ブラウザ情報も併せてお知らせいただけると助かります。"
                    className="w-full rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm resize-y"
                />
            </div>

            <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "送信する"}
            </Button>
        </form>
    );
}
