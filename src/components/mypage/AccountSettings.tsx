import { signOut } from "@/auth";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountSettings() {
    return (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
            <h3 className="text-xs font-black tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" /> ACCOUNT SETTINGS
            </h3>

            <div className="flex flex-col gap-1">
                <Button variant="ghost" className="w-full justify-start text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold h-12 rounded-xl">
                    <ShieldCheck className="w-5 h-5 mr-3 text-slate-400" />
                    セキュリティと言語設定
                </Button>

                <form action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                }}>
                    <Button type="submit" variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-bold h-12 rounded-xl group transition-all">
                        <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-600" />
                        ログアウト
                    </Button>
                </form>
            </div>
        </div>
    );
}
