import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminTabs } from "@/components/admin/AdminTabs";

export default async function AdminDashboard() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <div className="bg-red-900 text-white p-6 pb-12 rounded-b-lg shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            管理コンソール
                        </h1>
                    </div>
                    <Badge className="bg-red-950 text-red-300 font-bold border-red-800">
                        管理者専用
                    </Badge>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
                <AdminTabs />
            </div>
        </div>
    );
}
