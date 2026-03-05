import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiActionForms } from "@/components/admin/ApiActionForms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Server, CheckCircle2, DownloadCloud, Database } from "lucide-react";

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

                <Card className="shadow-sm border border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400" />
                            バッチジョブ (Batch Operations)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-[10px] text-slate-400 mt-3 text-center">
                            API Route <code className="bg-slate-100 px-1 rounded text-slate-500">/api/cron/sync-results</code> is active for automated scraping execution.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Ensure icons are imported.
import { PenSquare } from "lucide-react";
