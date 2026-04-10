import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserPointsDetail } from "@/lib/stats";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function PointsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const detail = await getUserPointsDetail(session.user.id);
    const { points, dailyPoints, totalPoints, totalEarned, monthEarned } = detail;

    const dailyMax = 500;
    const dailyUsagePercent = Math.min((dailyPoints / dailyMax) * 100, 100);

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">

            {/* Header (Dark) */}
            <div className="bg-[#1c1e54] text-white p-6 pb-12 rounded-b-lg">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-lg font-light tracking-tight mb-4">ポイント</h1>
                    <p className="text-4xl font-light tabular-nums tracking-tight">
                        {totalPoints.toLocaleString()}
                        <span className="text-lg ml-1">pt</span>
                    </p>
                </div>
            </div>

            {/* Points Breakdown Card */}
            <div className="max-w-4xl mx-auto px-4 -mt-6 mb-4 relative z-10">
                <div className="bg-white border border-[#e5edf5] rounded-lg p-5" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                    <h2 className="text-xs font-bold text-[#64748d] uppercase tracking-wider mb-4">ポイント内訳</h2>

                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-bold text-[#061b31]">保有ポイント</p>
                            <p className="text-[10px] text-[#64748d]">恒久</p>
                        </div>
                        <p className="text-lg font-bold text-[#061b31] tabular-nums">
                            {points.toLocaleString()}<span className="text-xs text-[#64748d] ml-0.5">pt</span>
                        </p>
                    </div>

                    <div className="border-t border-[#e5edf5] pt-3">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-sm font-bold text-[#061b31]">デイリーポイント</p>
                                <p className="text-[10px] text-[#64748d]">毎日0時リセット</p>
                            </div>
                            <p className="text-lg font-bold text-[#061b31] tabular-nums">
                                {dailyPoints.toLocaleString()}<span className="text-xs text-[#64748d] ml-0.5">pt</span>
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[#64748d]">使用状況</span>
                                <span className="text-[10px] text-[#64748d] tabular-nums">{dailyPoints} / {dailyMax} pt</span>
                            </div>
                            <div className="w-full bg-[#e5edf5] rounded-full h-2">
                                <div
                                    className="bg-[#533afd] h-2 rounded-full transition-all"
                                    style={{ width: `${dailyUsagePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Earned Stats Card */}
            <div className="max-w-4xl mx-auto px-4 mb-4">
                <div className="bg-white border border-[#e5edf5] rounded-lg p-5" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                    <h2 className="text-xs font-bold text-[#64748d] uppercase tracking-wider mb-4">獲得実績</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-[#64748d] font-bold">通算獲得</p>
                            <p className="text-xl font-bold text-[#061b31] tabular-nums">
                                {totalEarned.toLocaleString()}<span className="text-xs text-[#64748d] ml-0.5">pt</span>
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[#64748d] font-bold">今月獲得</p>
                            <p className="text-xl font-bold text-[#061b31] tabular-nums">
                                {monthEarned.toLocaleString()}<span className="text-xs text-[#64748d] ml-0.5">pt</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Earn Points Button */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                <Link href="/points/earn">
                    <div className="bg-[#533afd] hover:bg-[#4434d4] transition-colors text-white rounded-lg h-14 flex items-center justify-center gap-2 font-bold text-base">
                        ポイントを獲得する
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
