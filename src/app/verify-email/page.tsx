"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("無効なリンクです");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("メールアドレスが確認されました！");
        } else {
          setStatus("error");
          setMessage(data.error || "確認に失敗しました");
        }
      } catch {
        setStatus("error");
        setMessage("エラーが発生しました");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-6" />
            <h1 className="text-lg font-bold text-slate-900 mb-2">
              確認中...
            </h1>
            <p className="text-slate-500 text-sm">
              メールアドレスを確認しています
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {message}
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              ログインしてBOAT BANKをお楽しみください。
              <br />
              ウェルカムボーナスとして5,000ptをプレゼント！
            </p>
            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11">
                ログインする
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              確認に失敗しました
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {message}
            </p>
            <Link href="/register">
              <Button variant="outline" className="w-full h-11">
                新規登録に戻る
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
