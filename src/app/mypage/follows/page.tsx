import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { FollowTabs } from "./FollowTabs";

export default async function FollowsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const userId = session.user.id;

    const [followers, following] = await Promise.all([
        prisma.follows.findMany({
            where: { followingId: userId },
            include: { follower: { select: { id: true, name: true, _count: { select: { followers: true } } } } },
        }),
        prisma.follows.findMany({
            where: { followerId: userId },
            include: { following: { select: { id: true, name: true, _count: { select: { followers: true } } } } },
        }),
    ]);

    const followingList = following.map(f => ({
        id: f.following.id,
        name: f.following.name || "Unknown",
        followerCount: f.following._count.followers,
    }));

    const followerList = followers.map(f => ({
        id: f.follower.id,
        name: f.follower.name || "Unknown",
        followerCount: f.follower._count.followers,
    }));

    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            <div className="max-w-4xl mx-auto px-4 pt-6">
                <BackButton label="マイページに戻る" />

                <FollowTabs followingList={followingList} followerList={followerList} />
            </div>
        </div>
    );
}
