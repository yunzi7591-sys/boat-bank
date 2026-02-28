"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function unlockPrediction(predictionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to unlock a prediction.");
    }

    const userId = session.user.id;

    try {
        await prisma.$transaction(async (tx) => {
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

            // If free or user is author, return early
            if (prediction.price === 0 || prediction.authorId === userId) {
                return { success: true };
            }

            // Checking if already unlocked
            const existingTransaction = await tx.transaction.findFirst({
                where: { userId, predictionId, action: 'BUY_PREDICTION' },
            });

            if (existingTransaction) {
                return { success: true };
            }

            // 2. Get the current user points
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { points: true },
            });

            if (!user) throw new Error("User not found");

            // 3. Check points
            if (user.points < prediction.price) {
                throw new Error("Insufficient points");
            }

            // 4. Execute transfers and logging

            // Deduct from buyer
            await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: prediction.price } },
            });

            // Add to author (Monetization ecosystem)
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

            // Create notification for seller
            const buyer = await tx.user.findUnique({ where: { id: userId }, select: { name: true } });
            await tx.notification.create({
                data: {
                    userId: prediction.authorId,
                    type: "SALE",
                    message: `${buyer?.name || '誰か'}さんがあなたの予想を購入しました（+${prediction.price}pt）`,
                }
            });
        });

        // 5. Revalidate page to re-render Server Component state
        revalidatePath(`/predictions/${predictionId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
