import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiActionForms } from "@/components/admin/ApiActionForms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Server, CheckCircle2, DownloadCloud, Database, Trash2 } from "lucide-react";
import { AdminPredictionList } from "@/components/admin/AdminPredictionList";
import { EventManager } from "@/components/admin/EventManager";
import { Trophy } from "lucide-react";

export default async function AdminDashboard() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <div className="bg-red-900 text-white p-6 pb-12 rounded-b-3xl shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Admin Console
                        </h1>
                        <p className="text-xs text-red-200 mt-1">
                            System Management & Result Entries
                        </p>
                    </div>
                    <Badge className="bg-red-950 text-red-300 font-bold border-red-800">
                        Restricted Area
                    </Badge>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10 grid gap-6">
                {/* API Integrations */}
                <Card className="shadow-lg border-2 border-blue-100">
                    <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
                        <CardTitle className="text-lg font-black text-blue-900 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-500" />
                            APIデータ連携 & スクレイピング
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ApiActionForms />
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-amber-100">
                    <CardHeader className="bg-amber-50 border-b border-amber-100 pb-4">
                        <CardTitle className="text-lg font-black text-amber-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            限定ptイベント管理
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <EventManager />
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-2 border-red-100">
                    <CardHeader className="bg-red-50 border-b border-red-100 pb-4">
                        <CardTitle className="text-lg font-black text-red-900 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            自分の予想を管理（開発用）
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <AdminPredictionList />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Ensure icons are imported.
import { PenSquare } from "lucide-react";
