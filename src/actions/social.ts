"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const currentUserId = session.user.id;
    if (currentUserId === targetUserId) throw new Error("Cannot follow yourself");

    const target = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
    });
    if (!target) throw new Error("User not found");

    const existing = await prisma.follows.findUnique({
        where: {
            followerId_followingId: {
                followerId: currentUserId,
                followingId: targetUserId
            }
        }
    });

    try {
        if (existing) {
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: targetUserId
                    }
                }
            });
        } else {
            await prisma.follows.create({
                data: {
                    followerId: currentUserId,
                    followingId: targetUserId
                }
            });
        }
    } catch (e: any) {
        if (e?.code === "P2002" || e?.code === "P2025") {
            return { success: true, isFollowing: !existing };
        }
        throw e;
    }

    revalidatePath('/market');
    revalidatePath(`/users/${targetUserId}`);
    revalidatePath('/mypage');

    return { success: true, isFollowing: !existing };
}
