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

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Postgres advisory lock（ユーザー単位）で、同一ユーザーの並列要求を直列化する。
            // これにより count() → insert の TOCTOU を物理的に防ぐ。
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`share-reward:${userId}`}, 0))`;

            const purchased = await tx.transaction.findFirst({
                where: { userId, predictionId, action: "BUY_PREDICTION" },
                select: { id: true },
            });
            if (!purchased) {
                throw new Error("この予想を購入していません");
            }

            const alreadyClaimed = await tx.transaction.findFirst({
                where: { userId, predictionId, action: "SHARE_REWARD" },
                select: { id: true },
            });
            if (alreadyClaimed) {
                throw new Error("この予想のシェア報酬は既に受け取っています");
            }

            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentShares = await tx.transaction.count({
                where: {
                    userId,
                    action: "SHARE_REWARD",
                    createdAt: { gte: oneHourAgo },
                },
            });
            if (recentShares >= SHARE_RATE_LIMIT_PER_HOUR) {
                throw new Error("1時間あたりのシェア報酬上限に達しました。しばらく待ってから再度お試しください。");
            }

            await tx.transaction.create({
                data: {
                    action: "SHARE_REWARD",
                    points: SHARE_REWARD_POINTS,
                    userId,
                    predictionId,
                },
            });

            await tx.user.update({
                where: { id: userId },
                data: { points: { increment: SHARE_REWARD_POINTS } },
            });

            return { remaining: SHARE_RATE_LIMIT_PER_HOUR - recentShares - 1 };
        });

        revalidatePath(`/predictions/${predictionId}`);

        return {
            success: true,
            awardedPoints: SHARE_REWARD_POINTS,
            remaining: result.remaining,
        };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "シェア報酬の取得に失敗しました";
        return { success: false, error: msg };
    }
}
