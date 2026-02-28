import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { submitManualResult, triggerBatchEvaluation } from "@/actions/admin";
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

                {/* Manual Entry Form */}
                <Card className="shadow-lg border-2 border-red-100">
                    <CardHeader className="bg-white border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <PenSquare className="w-5 h-5 text-slate-400" />
                            手動レース結果確定 (Manual Entry)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form action={submitManualResult} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">場名</label>
                                    <Input name="placeName" placeholder="桐生" required className="bg-slate-50 font-bold" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">R数</label>
                                    <Input name="raceNumber" type="number" placeholder="12" required className="bg-slate-50 font-bold" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">開催日</label>
                                    <Input name="raceDate" type="date" required className="bg-slate-50 font-bold" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">1着</label>
                                    <Input name="first" type="number" min="1" max="6" required className="font-mono text-center text-lg font-bold border-yellow-300 ring-yellow-100 focus-visible:ring-yellow-300" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">2着</label>
                                    <Input name="second" type="number" min="1" max="6" required className="font-mono text-center text-lg font-bold" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">3着</label>
                                    <Input name="third" type="number" min="1" max="6" required className="font-mono text-center text-lg font-bold border-red-200" />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="grid gap-4">
                                <label className="text-xs font-bold text-slate-500 block">払戻金設定 (Payouts)</label>
                                <div className="grid grid-cols-3 items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded text-center">3連単</span>
                                    <Input name="p3TRPayout" type="number" required className="col-span-2 text-right font-bold" placeholder="1250" />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded text-center">2連単</span>
                                    <Input name="p2TRPayout" type="number" required className="col-span-2 text-right font-bold" placeholder="550" />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded text-center">単勝</span>
                                    <Input name="winPayout" type="number" required className="col-span-2 text-right font-bold" placeholder="150" />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 rounded-xl mt-4">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                結果を確定して全ユーザーの成績を再評価
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* API Integrations */}
                <Card className="shadow-lg border-2 border-blue-100">
                    <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
                        <CardTitle className="text-lg font-black text-blue-900 flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-500" />
                            APIデータ一括連携 (API Integration)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ApiActionForms />
                    </CardContent>
                </Card>

                {/* Batch Jobs */}
                <Card className="shadow-sm border border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400" />
                            バッチジョブ (Batch Operations)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form action={triggerBatchEvaluation}>
                            <Button type="submit" variant="outline" className="w-full font-bold h-12 border-slate-300 text-slate-700 hover:bg-slate-100">
                                未判定の予想すべてを強制再評価
                            </Button>
                        </form>
                        <p className="text-[10px] text-slate-400 mt-3 text-center">
                            API Route <code className="bg-slate-100 px-1 rounded text-slate-500">/api/cron/evaluate</code> is active for automated execution.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Ensure icons are imported.
import { PenSquare } from "lucide-react";
