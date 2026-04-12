import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPrivateVenueStatsAll } from "@/lib/stats";
import { VenueStatsGrid } from "@/components/mypage/VenueStatsGrid";
import { BackButton } from "@/components/BackButton";

export default async function VenuesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { all, year, monthly } = await getPrivateVenueStatsAll(session.user.id);

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <BackButton label="マイページに戻る" />
                <h1 className="text-xl font-black text-[#061b31] mb-4">詳細成績</h1>
                <VenueStatsGrid allTimeStats={all} yearStats={year} monthlyStats={monthly} />
            </div>
        </div>
    );
}
