"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SHARE_REWARD_POINTS = 50;
const SHARE_RATE_LIMIT_PER_HOUR = 2;

export async function claimShareReward(predictionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "ログインが必要です" };
    }

    const userId = session.user.id;

    const purchased = await prisma.transaction.findFirst({
        where: { userId, predictionId, action: "BUY_PREDICTION" },
        select: { id: true },
    });
    if (!purchased) {
        return { success: false, error: "この予想を購入していません" };
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentShares = await prisma.transaction.count({
        where: {
            userId,
            action: "SHARE_REWARD",
            createdAt: { gte: oneHourAgo },
        },
    });
    if (recentShares >= SHARE_RATE_LIMIT_PER_HOUR) {
        return { success: false, error: "1時間あたりのシェア報酬上限に達しました。しばらく待ってから再度お試しください。" };
    }

    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { points: { increment: SHARE_REWARD_POINTS } },
        }),
        prisma.transaction.create({
            data: {
                action: "SHARE_REWARD",
                points: SHARE_REWARD_POINTS,
                userId,
                predictionId,
            },
        }),
    ]);

    revalidatePath(`/predictions/${predictionId}`);

    return {
        success: true,
        awardedPoints: SHARE_REWARD_POINTS,
        remaining: SHARE_RATE_LIMIT_PER_HOUR - recentShares - 1,
    };
}
