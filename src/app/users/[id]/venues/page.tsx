import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicVenueStatsAll } from "@/lib/stats";
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

    const { all, year, monthly } = await getPublicVenueStatsAll(userId);

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <Link href={`/users/${userId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#64748d] hover:text-[#061b31] transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    {user.name}のプロフィールに戻る
                </Link>
                <h1 className="text-xl font-black text-[#061b31] mb-4">{user.name}の詳細成績</h1>
                <VenueStatsGrid allTimeStats={all} yearStats={year} monthlyStats={monthly} />
            </div>
        </div>
    );
}
