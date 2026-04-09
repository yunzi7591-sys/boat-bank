import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserVenueStatsWithPeriod } from "@/lib/stats";
import { VenueStatsGrid } from "@/components/mypage/VenueStatsGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function VenuesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, '0')}`);
    const [allTimeVenueStats, yearVenueStats, ...monthlyResults] = await Promise.all([
        getUserVenueStatsWithPeriod(userId, "all"),
        getUserVenueStatsWithPeriod(userId, "year"),
        ...months.map(m => getUserVenueStatsWithPeriod(userId, m)),
    ]);
    const monthlyStats: { [key: string]: typeof allTimeVenueStats } = {};
    months.forEach((m, i) => { monthlyStats[m] = monthlyResults[i]; });

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <Link
                    href="/mypage"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#64748d] hover:text-[#061b31] transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    マイページに戻る
                </Link>

                <h1 className="text-xl font-black text-[#061b31] mb-4">場別回収率</h1>

                <VenueStatsGrid
                    allTimeStats={allTimeVenueStats}
                    yearStats={yearVenueStats}
                    monthlyStats={monthlyStats}
                />
            </div>
        </div>
    );
}
