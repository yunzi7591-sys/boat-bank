import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserVenueStatsWithPeriod } from "@/lib/stats";
import { VenueStatsGrid } from "@/components/mypage/VenueStatsGrid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function UserVenuesPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = params.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });

    if (!user) notFound();

    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, '0')}`);

    const allTimeVenueStats = await getUserVenueStatsWithPeriod(userId, "all");
    const yearVenueStats = await getUserVenueStatsWithPeriod(userId, "year");

    const monthlyStats: { [key: string]: typeof allTimeVenueStats } = {};
    for (let i = 0; i < months.length; i += 3) {
        const batch = months.slice(i, i + 3);
        const results = await Promise.all(batch.map(m => getUserVenueStatsWithPeriod(userId, m)));
        batch.forEach((m, j) => { monthlyStats[m] = results[j]; });
    }

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <Link
                    href={`/users/${userId}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#64748d] hover:text-[#061b31] transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {user.name}のプロフィールに戻る
                </Link>

                <h1 className="text-xl font-black text-[#061b31] mb-4">{user.name}の場別回収率</h1>

                <VenueStatsGrid
                    allTimeStats={allTimeVenueStats}
                    yearStats={yearVenueStats}
                    monthlyStats={monthlyStats}
                />
            </div>
        </div>
    );
}
