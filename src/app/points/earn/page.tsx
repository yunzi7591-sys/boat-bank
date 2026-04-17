import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Flame, Check } from "lucide-react";
import { dailyPointsForStreak } from "@/lib/login-streak";

export default async function EarnPointsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { loginStreak: true, dailyPoints: true },
    });
    const streak = user?.loginStreak ?? 0;
    const currentDaily = dailyPointsForStreak(streak);

    const tiers = [
        { days: 1, pt: 300, label: "1〜2日目" },
        { days: 3, pt: 500, label: "3〜6日連続" },
        { days: 7, pt: 700, label: "7日連続〜" },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">

            {/* Top Nav */}
            <div className="max-w-4xl mx-auto px-4 pt-6 mb-6">
                <Link href="/points" className="inline-flex items-center gap-1 text-sm text-[#64748d] hover:text-[#533afd] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    戻る
                </Link>
            </div>

            {/* Title */}
            <div className="max-w-4xl mx-auto px-4 mb-6">
                <h1 className="text-xl font-bold text-[#061b31]">ポイントの獲得方法</h1>
                <p className="text-sm text-[#64748d] mt-1">毎日ログインしてデイリーポイントを増やそう</p>
            </div>

            {/* Login Streak Card */}
            <div className="max-w-4xl mx-auto px-4 mb-4">
                <div
                    className="bg-white border border-[#e5edf5] rounded-lg p-5"
                    style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#061b31]">連続ログインボーナス</p>
                            <p className="text-xs text-[#64748d] mt-0.5">
                                現在 <span className="font-bold text-orange-500">{streak}日連続</span>・本日のデイリー <span className="font-bold text-[#533afd]">{currentDaily}pt</span>
                            </p>
                        </div>
                    </div>

                    {/* Tier list */}
                    <div className="flex flex-col gap-2">
                        {tiers.map((tier) => {
                            const achieved = streak >= tier.days;
                            const isCurrent = currentDaily === tier.pt;
                            return (
                                <div
                                    key={tier.days}
                                    className={`flex items-center justify-between rounded-lg px-4 py-3 border ${isCurrent
                                        ? 'bg-[#f0eeff] border-[#b9b9f9]'
                                        : achieved
                                            ? 'bg-[#f8fafc] border-[#e5edf5]'
                                            : 'bg-white border-[#e5edf5] opacity-70'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {achieved ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <span className="w-4 h-4 rounded-full border-2 border-[#e5edf5]" />
                                        )}
                                        <span className="text-sm font-semibold text-[#061b31]">{tier.label}</span>
                                    </div>
                                    <span className={`text-sm font-bold tabular-nums ${isCurrent ? 'text-[#533afd]' : 'text-[#64748d]'}`}>
                                        {tier.pt}pt / 日
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-[10px] text-[#64748d] mt-3 leading-relaxed">
                        ※ 1日でもログインが途切れると連続日数はリセットされます
                    </p>
                </div>
            </div>
        </div>
    );
}
