import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicStatsLeaves, buildSampleStatsLeaves } from "@/lib/stats";
import { VenueStatsGrid } from "@/components/mypage/VenueStatsGrid";
import { BackButton } from "@/components/BackButton";
import { SubscriptionGate } from "@/components/SubscriptionGate";

export default async function UserVenuesPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = params.id;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });

    if (!user) notFound();

    const leaves = await getPublicStatsLeaves(userId);
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <BackButton label={`${user.name}のプロフィールに戻る`} />
                <h1 className="text-xl font-black text-[#061b31] mb-4">{user.name}の詳細成績</h1>
                <SubscriptionGate
                    preview={<VenueStatsGrid leaves={buildSampleStatsLeaves(currentYear)} year={currentYear} />}
                >
                    <VenueStatsGrid leaves={leaves} year={currentYear} />
                </SubscriptionGate>
            </div>
        </div>
    );
}
