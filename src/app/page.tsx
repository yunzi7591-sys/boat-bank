import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/stats";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Trophy, TrendingUp, Target, Wallet, Ship, ChevronRight } from "lucide-react";
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

  const hitRate = stats.totalPredictions > 0 ? (stats.hitCount / stats.totalPredictions) * 100 : 0;
  const isProfit = stats.recoveryRate >= 100;

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
      {/* 1. Asset Summary */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 text-white px-5 pt-7 pb-10 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-20 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <p className="text-slate-500 text-[11px] font-semibold tracking-widest mb-1 uppercase">
            Total Assets
          </p>
          <div className="flex items-baseline gap-2 mb-6">
            <h1 className="text-5xl font-black tracking-tighter leading-none tabular-nums">{points.toLocaleString()}</h1>
            <span className="text-slate-500 font-bold text-sm">pt</span>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Recovery Rate */}
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl p-3.5 border border-white/[0.06]">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${isProfit && stats.totalInvestment > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {isProfit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
              <p className="text-[10px] text-slate-500 font-medium mb-0.5">回収率</p>
              <p className={`text-xl font-black tracking-tight ${isProfit && stats.totalInvestment > 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {stats.totalInvestment === 0 ? "0.0" : stats.recoveryRate.toFixed(1)}<span className="text-xs font-bold opacity-40 ml-0.5">%</span>
              </p>
            </div>

            {/* Hit Rate */}
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl p-3.5 border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-blue-500/20 text-blue-400">
                <Target className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium mb-0.5">的中率</p>
              <p className="text-xl font-black tracking-tight text-slate-200">
                {hitRate.toFixed(1)}<span className="text-xs font-bold opacity-40 ml-0.5">%</span>
              </p>
            </div>

            {/* Total Bet */}
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl p-3.5 border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 bg-violet-500/20 text-violet-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium mb-0.5">投資額</p>
              <p className="text-xl font-black tracking-tight text-slate-200">
                {stats.totalInvestment > 9999 ? `${(stats.totalInvestment / 1000).toFixed(0)}k` : stats.totalInvestment.toLocaleString()}
                <span className="text-xs font-bold opacity-40 ml-0.5">pt</span>
              </p>
            </div>
          </div>

          {/* Record Badge */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="bg-white/[0.06] px-2.5 py-1 rounded-full font-semibold">
              {stats.hitCount}/{stats.totalPredictions} 的中
            </span>
          </div>
        </div>
      </div>

      {/* 2. Welcome / Empty State */}
      {!session?.user ? (
        <div className="mx-4 -mt-4 relative z-10 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-lg shadow-slate-900/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-slate-900">BOAT BANKへようこそ</h3>
              <p className="text-xs text-slate-500 mt-0.5">アカウントを作成して収支管理を始めよう</p>
            </div>
          </div>
          <Link href="/login" className="mt-4 block">
            <Button className="w-full rounded-xl h-11 font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] transition-all">
              ログイン / 新規登録
            </Button>
          </Link>
        </div>
      ) : stats.totalPredictions === 0 ? (
        <div className="mx-4 -mt-4 relative z-10 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-lg shadow-slate-900/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
              <Ship className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-slate-900">まだ予想がありません</h3>
              <p className="text-xs text-slate-500 mt-0.5">最初の勝負を始めてポートフォリオを構築しよう</p>
            </div>
          </div>
          <Link href="/predict/new" className="mt-4 block">
            <Button className="w-full rounded-xl h-11 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98] transition-all">
              最初の予想を作成する
            </Button>
          </Link>
        </div>
      ) : null}

      {/* 3. 24 Venues Grid */}
      <div className={!session?.user || stats.totalPredictions === 0 ? "mt-6" : "-mt-2"}>
        <VenueGrid />
      </div>

      {/* 4. Latest Results */}
      <div className="mt-8 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            最新レース結果
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">LIVE</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {latestResults.map((res, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-slate-200 transition-colors">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-0.5">{res.place} {res.race}R</p>
                <p className="font-black text-lg text-slate-900 tracking-tight tabular-nums">
                  ¥{res.payout.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getColorStyle(res.p1)}`}>{res.p1}</div>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getColorStyle(res.p2)}`}>{res.p2}</div>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getColorStyle(res.p3)}`}>{res.p3}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
