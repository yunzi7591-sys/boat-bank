import { signOut } from "@/auth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountSettings() {
    return (
        <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
        }}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 font-medium h-12 rounded-lg group transition-all border border-[#e5edf5]">
                <LogOut className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-600" />
                ログアウト
            </Button>
        </form>
    );
}
