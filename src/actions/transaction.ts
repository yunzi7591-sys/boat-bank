"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";
import { isSubscriber } from "@/lib/subscription";

/**
 * 会員特典で締切後・当日の予想をアンロックする（pt消費なし）。
 * 締切前と同じく明示的な操作で実行し、アンロック時に公開者へ通知する。
 * SUBSCRIBER_UNLOCK 記録で重複アンロック・重複通知を防ぐ。
 */
export async function unlockBySubscription(predictionId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, error: "ログインが必要です。" };

    const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
        select: { authorId: true, deadlineAt: true, raceDate: true, placeName: true, raceNumber: true, isPrivate: true },
    });
    if (!prediction) return { success: false, error: "予想が見つかりません。" };

    // 本人・非公開は対象外
    if (prediction.authorId === userId || prediction.isPrivate) return { success: false, error: "この予想はアンロックできません。" };
    // 締切後のみ（締切前は通常の購入フロー）
    if (new Date(prediction.deadlineAt) >= new Date()) return { success: false, error: "締切前の予想は通常の購入でアンロックしてください。" };
    // 当日のレースのみ（JST）
    const jstDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
    if (jstDate(new Date(prediction.raceDate)) !== jstDate(new Date())) return { success: false, error: "当日のレースのみ閲覧できます。" };
    // サブスク会員のみ
    if (!(await isSubscriber(userId))) return { success: false, error: "サブスク会員のみ閲覧できます。" };

    // 既に購入済み or 既にアンロック済みなら何もしない（重複通知防止）
    const existing = await prisma.transaction.findFirst({
        where: { userId, predictionId, action: { in: ["BUY_PREDICTION", "SUBSCRIBER_UNLOCK"] } },
    });
    if (existing) {
        revalidatePath(`/predictions/${predictionId}`);
        return { success: true };
    }

    // アンロック記録を作成（pt変動なし）
    await prisma.transaction.create({
        data: { action: "SUBSCRIBER_UNLOCK", points: 0, userId, predictionId },
    });

    // 公開者へ通知
    const viewerName = (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name;
    const raceLabel = `${prediction.placeName}${prediction.raceNumber}Rの`;
    const message = `${viewerName || "会員"}さんが会員特典であなたの${raceLabel}予想を閲覧しました`;
    sendPushNotification(prediction.authorId, "SALE", message, `/predictions/${predictionId}`).catch(() => {});

    revalidatePath(`/predictions/${predictionId}`);
    return { success: true };
}

export async function unlockPrediction(predictionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to unlock a prediction.");
    }

    const userId = session.user.id;

    try {
        const txResult = await prisma.$transaction(async (tx) => {
            // 0. 二重課金防止: 同一購入者の購入処理を直列化する。
            //    購入者のUser行を FOR UPDATE でロックし、同時クリック/同時リクエストで
            //    「購入済みチェック → 引き落とし」が二重に走るのを防ぐ。
            //    （DBのユニーク制約は出品者側 SELL_PREDICTION が買い手ごとに重複するため使えない）
            await tx.$executeRaw`SELECT 1 FROM "User" WHERE id = ${userId} FOR UPDATE`;

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

            // Deadline Guard: 締切後は購入不可（締切後の閲覧はサブスク会員かつ当日のみ）
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
