import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy, TrendingUp } from "lucide-react";
import { BOAT_COLORS } from "@/lib/bet-logic";
import { VenueGrid } from "@/components/dashboard/VenueGrid";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  let points = 0;
  let recoveryRate = 0;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } });
    points = user?.points || 0;
    const stats = await getUserStats(session.user.id);
    recoveryRate = stats.recoveryRate;
  }

  // Mock recent results
  const latestResults = [
    { place: "大村", race: 9, p1: 1, p2: 2, p3: 4, payout: 1250 },
    { place: "桐生", race: 10, p1: 3, p2: 1, p3: 6, payout: 18400 },
    { place: "住之江", race: 11, p1: 4, p2: 5, p3: 6, payout: 124500 },
  ];

  const getColorStyle = (n: number) => {
    const colorObj = BOAT_COLORS.find(c => c.no === n);
    if (!colorObj) return "bg-slate-200 text-slate-800";
    return colorObj.colorCls;
  };

  return (
    <div className="min-h-full pb-8">
      {/* 1. Asset Summary Section */}
      <div className="bg-slate-900 text-white rounded-b-3xl px-6 pt-8 pb-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp className="w-40 h-40" /></div>
        <p className="text-slate-400 text-xs font-bold tracking-widest mb-1">TOTAL ASSETS</p>
        <div className="flex items-baseline gap-2 mb-6">
          <h1 className="text-5xl font-extrabold tracking-tight">{points.toLocaleString()}</h1>
          <span className="text-slate-400 font-medium tracking-wide">pt</span>
        </div>

        <div className="flex gap-4">
          {/* Portfolio performance metric */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl px-5 py-3.5 flex items-center gap-4 border border-slate-700/50 shadow-inner">
            <div className={`p-2.5 rounded-full ${recoveryRate >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {recoveryRate >= 100 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-0.5">今月の回収率</p>
              <p className={`text-xl font-black tracking-tight ${recoveryRate >= 100 ? 'text-green-400' : 'text-red-400'}`}>
                {recoveryRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {session?.user ? null : (
        <div className="mx-4 mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl text-center shadow-sm">
          <p className="text-sm text-blue-800 font-semibold">ログインして自身の資産ポートフォリオを管理しよう</p>
        </div>
      )}

      {/* 2. 24 Venues Grid */}
      <VenueGrid />

      {/* 3. Latest Results Widget */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[13px] font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-500" /> LATEST RESULTS
          </h2>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest bg-slate-200/50 px-2 py-0.5 rounded-sm">速報</span>
        </div>
        <div className="flex flex-col gap-3">
          {latestResults.map((res, i) => (
            <Card key={i} className="border-none shadow-md rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-500 tracking-wide mb-0.5">{res.place} {res.race}R</p>
                  <p className="font-black text-red-500 tracking-tight text-lg">{res.payout.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 ml-0.5">pt</span></p>
                </div>
                {/* Visual Official Colors Badge */}
                <div className="flex items-center bg-slate-50 p-1.5 rounded-full border border-slate-100 shadow-inner">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${getColorStyle(res.p1)}`}>{res.p1}</div>
                  <div className="w-2.5 h-[2px] bg-slate-300 mx-0.5 rounded-full"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${getColorStyle(res.p2)}`}>{res.p2}</div>
                  <div className="w-2.5 h-[2px] bg-slate-300 mx-0.5 rounded-full"></div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${getColorStyle(res.p3)}`}>{res.p3}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
