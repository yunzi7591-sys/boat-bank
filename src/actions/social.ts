"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUserId = session.user.id;
    if (currentUserId === targetUserId) throw new Error("Cannot follow yourself");

    const existing = await prisma.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId: currentUserId,
                followingId: targetUserId
            }
        }
    });

    if (existing) {
        // Unfollow
        await prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: targetUserId
                }
            }
        });
    } else {
        // Follow
        await prisma.follows.create({
            data: {
                followerId: currentUserId,
                followingId: targetUserId
            }
        });
    }

    // Revalidate paths that might show follow status or following timeline
    revalidatePath('/market');
    revalidatePath(`/user/${targetUserId}`); // if user profiles exist
    revalidatePath('/mypage');

    return { success: true, isFollowing: !existing };
}
