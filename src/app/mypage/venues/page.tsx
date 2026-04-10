import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPrivateVenueStatsWithPeriod } from "@/lib/stats";
import { VenueStatsGrid } from "@/components/mypage/VenueStatsGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function VenuesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, '0')}`);

    // pgbouncer connection_limit対策: 3並列ずつ
    const allTimeVenueStats = await getPrivateVenueStatsWithPeriod(userId, "all");
    const yearVenueStats = await getPrivateVenueStatsWithPeriod(userId, "year");

    const monthlyStats: { [key: string]: typeof allTimeVenueStats } = {};
    for (let i = 0; i < months.length; i += 3) {
        const batch = months.slice(i, i + 3);
        const results = await Promise.all(batch.map(m => getPrivateVenueStatsWithPeriod(userId, m)));
        batch.forEach((m, j) => { monthlyStats[m] = results[j]; });
    }

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
