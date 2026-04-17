"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculatePointDeduction } from "@/lib/points";
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
                select: { price: true, authorId: true, deadlineAt: true },
            });

            if (!prediction) {
                throw new Error("Prediction not found");
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
                return { buyerName, authorId: prediction.authorId, price: 0 };
            }

            // 2. Get the current user points
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { points: true, dailyPoints: true },
            });

            if (!user) throw new Error("User not found");

            // 3. Check points (dailyPoints + points)
            const deduction = calculatePointDeduction(user.points, user.dailyPoints, prediction.price);
            if (!deduction) {
                throw new Error("ポイントが不足しています");
            }

            // 4. Execute transfers and logging

            // Deduct from buyer (dailyPoints優先)
            await tx.user.update({
                where: { id: userId },
                data: { points: deduction.newPoints, dailyPoints: deduction.newDailyPoints },
            });

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
            return { buyerName, authorId: prediction.authorId, price: prediction.price };
        });

        // プッシュ通知（トランザクション外で非同期送信）
        if (txResult.authorId) {
            const message = txResult.price === 0
                ? `${txResult.buyerName || '誰か'}さんがあなたの無料予想を購入しました`
                : `${txResult.buyerName || '誰か'}さんがあなたの予想を購入しました（+${txResult.price}pt）`;
            sendPushNotification(txResult.authorId, "SALE", message, `/predictions/${predictionId}`).catch(() => {});
        }

        // 5. Revalidate page to re-render Server Component state
        revalidatePath(`/predictions/${predictionId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
