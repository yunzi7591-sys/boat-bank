import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Trophy, ChevronRight } from "lucide-react";
import { BOAT_COLORS } from "@/lib/bet-logic";
import { VenueGrid } from "@/components/dashboard/VenueGrid";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  const userId = session?.user?.id;

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

      {/* 2. 24 Venues Grid */}
      <div className="mt-5 px-4">
        <div className="bg-white rounded-lg p-3 border border-[#e5edf5]">
          <VenueGrid />
        </div>
      </div>

      {/* 4. Latest Results */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-light text-[#061b31] flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            最新レース結果
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">LIVE</span>
        </div>
        <div className="bg-white rounded-lg p-3 border border-[#e5edf5]">
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

      <div className="mt-8 pb-4 px-4 flex items-center justify-center gap-4 text-[10px] text-[#64748d]">
        <Link href="/privacy" className="hover:text-[#533afd]">プライバシーポリシー</Link>
        <span>|</span>
        <Link href="/terms" className="hover:text-[#533afd]">利用規約</Link>
      </div>
    </div>
  );
}
