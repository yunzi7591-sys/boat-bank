import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "./form";
import { Ship } from "lucide-react";

export default async function RegisterPage() {
    const session = await auth();
    if (session) {
        redirect("/mypage");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-yellow-500 px-6 py-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>
                    <Ship className="w-12 h-12 text-blue-900 mx-auto mb-3 relative z-10" />
                    <h1 className="text-2xl font-black text-blue-900 tracking-widest relative z-10">BOAT BANK</h1>
                    <p className="text-blue-800 text-sm font-bold mt-1 relative z-10">新規登録ボーナス 1,000pt 付与！</p>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">アカウントの作成</h2>
                    <RegisterForm />

                    <div className="mt-6 text-center text-sm text-slate-500">
                        すでにアカウントをお持ちですか？{" "}
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            ログイン
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
