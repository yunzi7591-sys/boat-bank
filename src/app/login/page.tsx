import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "./form";

export default async function LoginPage() {
    const session = await auth();
    if (session) {
        redirect("/mypage");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
                <div className="bg-slate-950 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
                    <div className="relative z-10 flex items-center justify-center gap-1.5 mb-2">
                        <span className="bg-emerald-400 text-slate-950 font-black text-sm px-2.5 py-0.5 rounded-md">BOAT</span>
                        <span className="font-extrabold text-xl text-white tracking-wide">BANK</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium relative z-10">ガチ予想のマーケットプレイス</p>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">ログイン</h2>
                    <LoginForm />

                    <div className="mt-6 text-center text-sm text-slate-500">
                        アカウントをお持ちでないですか？{" "}
                        <Link href="/register" className="text-emerald-600 font-bold hover:underline">
                            新規登録
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
