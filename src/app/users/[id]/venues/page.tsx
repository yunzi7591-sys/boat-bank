import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicVenueStatsAll } from "@/lib/stats";
import { VenueStatsGrid } from "@/components/mypage/VenueStatsGrid";
import { BackButton } from "@/components/BackButton";

export default async function UserVenuesPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = params.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });

    if (!user) notFound();

    const { all, year, monthly, byRaceType } = await getPublicVenueStatsAll(userId);

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <BackButton label={`${user.name}のプロフィールに戻る`} />
                <h1 className="text-xl font-black text-[#061b31] mb-4">{user.name}の詳細成績</h1>
                <VenueStatsGrid allTimeStats={all} yearStats={year} monthlyStats={monthly} byRaceType={byRaceType} />
            </div>
        </div>
    );
}
