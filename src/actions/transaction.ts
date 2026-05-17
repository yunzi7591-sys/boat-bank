"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

export async function unlockPrediction(predictionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to unlock a prediction.");
    }

    const userId = session.user.id;

    try {
        const txResult = await prisma.$transaction(async (tx) => {
            // 1. Get the prediction
            const prediction = await tx.prediction.findUnique({
                where: { id: predictionId },
                select: { price: true, authorId: true, deadlineAt: true, placeName: true, raceNumber: true, isPrivate: true },
            });

            if (!prediction) {
                throw new Error("Prediction not found");
            }

            // Private guard: non-owners cannot buy private predictions
            if (prediction.isPrivate && prediction.authorId !== userId) {
                throw new Error("この予想は購入できません");
            }

            // Deadline Guard
            if (new Date(prediction.deadlineAt) < new Date()) {
                throw new Error("この予想は既に締切時刻を過ぎているため購入できません。");
            }

            // Author always has access
            if (prediction.authorId === userId) {
                return { success: true };
            }

            // Checking if already unlocked
            const existingTransaction = await tx.transaction.findFirst({
                where: { userId, predictionId, action: 'BUY_PREDICTION' },
            });

            if (existingTransaction) {
                return { success: true };
            }

            // Free prediction: record transaction without point deduction
            if (prediction.price === 0) {
                await tx.transaction.create({
                    data: {
                        action: "BUY_PREDICTION",
                        points: 0,
                        userId,
                        predictionId,
                    },
                });
                const buyerName = (await tx.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name;
                return { buyerName, authorId: prediction.authorId, price: 0, placeName: prediction.placeName, raceNumber: prediction.raceNumber };
            }

            // 2-3. Atomic deduct: dailyPoints優先、残りをpointsから。
            //     WHERE句に残高条件を付けることで同時実行時のロストアップデートを防ぐ。
            const deducted = await tx.$executeRaw`
                UPDATE "User"
                SET "dailyPoints" = GREATEST("dailyPoints" - ${prediction.price}, 0),
                    "points" = "points" - GREATEST(${prediction.price} - "dailyPoints", 0)
                WHERE id = ${userId}
                  AND "dailyPoints" + "points" >= ${prediction.price}
            `;
            if (deducted === 0) {
                throw new Error("ポイントが不足しています");
            }

            // Add to author
            await tx.user.update({
                where: { id: prediction.authorId },
                data: { points: { increment: prediction.price } },
            });

            // Log buyer transaction
            await tx.transaction.create({
                data: {
                    action: "BUY_PREDICTION",
                    points: -prediction.price,
                    userId: userId,
                    predictionId: predictionId,
                },
            });

            // Log seller transaction
            await tx.transaction.create({
                data: {
                    action: "SELL_PREDICTION",
                    points: prediction.price,
                    userId: prediction.authorId,
                    predictionId: predictionId,
                },
            });

            const buyerName = (await tx.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name;
            return { buyerName, authorId: prediction.authorId, price: prediction.price, placeName: prediction.placeName, raceNumber: prediction.raceNumber };
        });

        // プッシュ通知（トランザクション外で非同期送信）
        if (txResult.authorId) {
            const raceLabel = txResult.placeName && txResult.raceNumber ? `${txResult.placeName}${txResult.raceNumber}Rの` : '';
            const message = txResult.price === 0
                ? `${txResult.buyerName || '誰か'}さんがあなたの${raceLabel}無料予想を購入しました`
                : `${txResult.buyerName || '誰か'}さんがあなたの${raceLabel}予想を購入しました（+${txResult.price}pt）`;
            sendPushNotification(txResult.authorId, "SALE", message, `/predictions/${predictionId}`).catch(() => {});
        }

        // 5. Revalidate page to re-render Server Component state
        revalidatePath(`/predictions/${predictionId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
