"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { BotIdClient } from "botid/client";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/actions/auth";
import Link from "next/link";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    setIsResending(true);
    try {
      const res = await resendVerificationEmail(email);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("確認メールを再送しました");
      }
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <BotIdClient
        protect={[
          { path: "/check-email", method: "POST" },
        ]}
      />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-emerald-600" />
        </div>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          メールを確認してください
        </h1>

        <p className="text-slate-500 text-sm mb-2">
          確認メールを送信しました
        </p>

        {email && (
          <p className="text-slate-700 font-medium text-sm mb-6">
            {email}
          </p>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-left">
          <p className="text-amber-800 text-xs leading-relaxed">
            <span className="font-bold">⚠️ メール到着まで最大10分ほどかかる場合があります。</span>
            <br />
            10分以上経っても届かない場合は <span className="font-bold">迷惑メール（スパム）フォルダ</span> も必ずご確認ください。
          </p>
        </div>

        <p className="text-slate-400 text-xs mb-8 leading-relaxed">
          メール内のリンクをクリックして、アカウントの作成を完了してください。
        </p>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            確認メールを再送する
          </Button>

          <Link href="/login">
            <Button variant="ghost" className="w-full text-slate-500 text-sm">
              ログインページに戻る
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
