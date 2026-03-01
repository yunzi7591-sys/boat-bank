import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy, TrendingUp, Target, Activity, Wallet, Ship } from "lucide-react";
import { BOAT_COLORS } from "@/lib/bet-logic";
import { VenueGrid } from "@/components/dashboard/VenueGrid";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  let points = 0;
  let stats = {
    totalInvestment: 0,
    totalRefund: 0,
    recoveryRate: 0,
    hitCount: 0,
    totalPredictions: 0,
  };

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } });
    points = user?.points || 0;
    stats = await getUserStats(session.user.id);
  }

  // Hit rate calculation
  const hitRate = stats.totalPredictions > 0 ? (stats.hitCount / stats.totalPredictions) * 100 : 0;
  const isProfit = stats.recoveryRate >= 100;

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
      {/* 1. Asset Summary Dashboard Section */}
      <div className="bg-slate-900 text-white rounded-b-[2.5rem] px-6 pt-8 pb-12 shadow-2xl relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><TrendingUp className="w-64 h-64 -rotate-12 transform translate-x-12 -translate-y-8" /></div>
        <div className="absolute top-32 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <p className="text-slate-400 text-xs font-bold tracking-widest mb-1 flex items-center gap-1.5 uppercase">
            <Wallet className="w-3.5 h-3.5" /> Total Assets
          </p>
          <div className="flex items-baseline gap-2 mb-8">
            <h1 className="text-[3.5rem] font-black tracking-tighter leading-none">{points.toLocaleString()}</h1>
            <span className="text-slate-400 font-bold tracking-wide">pt</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Recovery Rate Metric */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 flex flex-col justify-between border border-white/10 shadow-inner group transition-all hover:bg-white/10 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${isProfit && stats.totalInvestment > 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2.5 rounded-xl ${isProfit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'} transition-transform group-hover:scale-110`}>
                  {isProfit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <Activity className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider mb-0.5 uppercase">回収率</p>
                <p className={`text-2xl font-black tracking-tighter ${isProfit && stats.totalInvestment > 0 ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]' : 'text-slate-100'}`}>
                  {stats.totalInvestment === 0 ? "0.0" : stats.recoveryRate.toFixed(1)}<span className="text-sm font-bold opacity-50 ml-0.5">%</span>
                </p>
              </div>
            </div>

            {/* Hit Rate / Investment Metric */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 flex flex-col justify-between border border-white/10 shadow-inner group transition-all hover:bg-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-500" />
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 transition-transform group-hover:scale-110 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">{stats.hitCount}/{stats.totalPredictions} 的中</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider mb-0.5 uppercase">総ベット額</p>
                <p className="text-2xl font-black tracking-tighter text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                  {stats.totalInvestment.toLocaleString()}<span className="text-sm font-bold opacity-50 ml-0.5">pt</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar for Hit Rate UI */}
          <div className="mt-5 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-1.5 px-1 text-xs font-bold">
              <span className="text-slate-400">的中率 (HIT RATE)</span>
              <span className="text-blue-300">{hitRate.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${Math.min(hitRate, 100)}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/20 blur-[2px] animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Empty State Prompts or Login Prompts */}
      {!session?.user ? (
        <div className="mx-4 mt-6 bg-gradient-to-br from-white to-blue-50 border border-blue-100/50 p-6 rounded-3xl text-center shadow-lg shadow-blue-900/5 flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1 shadow-inner text-blue-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">BOAT BANKへようこそ</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">アカウントを作成して自分の資産を<br />美しいダッシュボードで管理しよう。</p>
          </div>
          <Link href="/login" className="mt-2 w-full">
            <Button className="w-full rounded-2xl h-12 font-bold text-sm bg-slate-900 text-white shadow-xl shadow-slate-900/20 active:scale-95 transition-all">
              ログイン / 新規登録
            </Button>
          </Link>
        </div>
      ) : stats.totalPredictions === 0 ? (
        <div className="mx-4 mt-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 p-6 rounded-3xl text-center shadow-lg shadow-blue-900/5 flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm text-indigo-500">
            <Ship className="w-7 h-7 -mr-1" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">まだ予想がありません</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">さあ、最初の勝負を始めよう。<br />買い目を作成して資産ポートフォリオを構築しましょう。</p>
          </div>
          <Link href="/predict/new" className="mt-3 w-full">
            <Button className="w-full rounded-2xl h-12 font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 active:scale-95 transition-all">
              最初の予想を作成する
            </Button>
          </Link>
        </div>
      ) : null}

      {/* 3. 24 Venues Grid */}
      <div className="mt-2">
        <VenueGrid />
      </div>

      {/* 4. Latest Results Widget */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-800 tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500 drop-shadow-sm" /> LATEST RESULTS
          </h2>
          <span className="text-[10px] text-slate-400 font-black tracking-widest bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">速報</span>
        </div>
        <div className="flex flex-col gap-3">
          {latestResults.map((res, i) => (
            <Card key={i} className="border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[1.25rem] overflow-hidden bg-white hover:border-slate-200 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-slate-400 tracking-wider mb-0.5">{res.place} {res.race}R</p>
                  <p className="font-black text-red-500 tracking-tight text-xl drop-shadow-sm">{res.payout.toLocaleString()} <span className="text-[10px] font-extrabold text-slate-300 ml-0.5">pt</span></p>
                </div>
                {/* Visual Official Colors Badge */}
                <div className="flex items-center bg-slate-50 p-1.5 rounded-full border border-slate-200/60 shadow-inner">
                  <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white ${getColorStyle(res.p1)}`}>{res.p1}</div>
                  <div className="w-2.5 h-[2px] bg-slate-300 mx-0.5 rounded-full"></div>
                  <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white ${getColorStyle(res.p2)}`}>{res.p2}</div>
                  <div className="w-2.5 h-[2px] bg-slate-300 mx-0.5 rounded-full"></div>
                  <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white ${getColorStyle(res.p3)}`}>{res.p3}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
