import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Trophy, Wallet, ChevronRight } from "lucide-react";
import { BOAT_COLORS } from "@/lib/bet-logic";
import { VenueGrid } from "@/components/dashboard/VenueGrid";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  let points = 0;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { points: true } });
    points = user?.points || 0;
  }

  const latestResultsRaw = await prisma.raceResult.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const latestResults = latestResultsRaw.map(r => {
    const payouts = (r.payouts as any[]) || [];
    const trifecta = payouts.find(p => p.type === '3TR');
    return {
      place: r.placeName,
      race: r.raceNumber,
      p1: r.firstPlace,
      p2: r.secondPlace,
      p3: r.thirdPlace,
      payout: trifecta?.amount || 0,
    };
  });

  const getColorStyle = (n: number) => {
    const colorObj = BOAT_COLORS.find(c => c.no === n);
    if (!colorObj) return "bg-slate-200 text-slate-800";
    return colorObj.colorCls;
  };

  return (
    <div className="min-h-full pb-8">
      {/* 1. Asset Summary */}
      <div className="bg-[#1c1e54] text-white px-5 pt-7 pb-10 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-20 -right-10 w-40 h-40 bg-[#533afd]/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <p className="text-white/50 text-[11px] font-semibold tracking-widest mb-1 uppercase">
            Total Assets
          </p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-5xl font-light tracking-tighter leading-none tabular-nums">{points.toLocaleString()}</h1>
            <span className="text-white/50 font-light text-sm">pt</span>
          </div>
        </div>
      </div>

      {/* 2. Welcome / Empty State */}
      {!session?.user ? (
        <div className="mx-4 -mt-4 relative z-10 bg-white border border-slate-200/80 p-5 rounded-lg shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-18px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#533afd]/5 rounded-lg flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-[#533afd]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-light text-[#061b31]">BOAT BANKへようこそ</h3>
              <p className="text-xs text-slate-500 mt-0.5">アカウントを作成して収支管理を始めよう</p>
            </div>
          </div>
          <Link href="/login" className="mt-4 block">
            <Button className="w-full rounded h-11 font-light text-sm bg-[#533afd] text-white hover:bg-[#4434d4] active:scale-[0.98] transition-all">
              ログイン / 新規登録
            </Button>
          </Link>
        </div>
      ) : null}

      {/* 3. 24 Venues Grid */}
      <div className={!session?.user ? "mt-6" : "-mt-2"}>
        <VenueGrid />
      </div>

      {/* 4. Latest Results */}
      <div className="mt-8 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-light text-[#061b31] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            最新レース結果
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">LIVE</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {latestResults.map((res, i) => (
            <div key={i} className="bg-white border border-[#e5edf5] rounded-lg p-4 flex items-center justify-between hover:border-slate-200 transition-colors">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-0.5">{res.place} {res.race}R</p>
                <p className="font-light text-lg text-[#061b31] tracking-tight tabular-nums">
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
