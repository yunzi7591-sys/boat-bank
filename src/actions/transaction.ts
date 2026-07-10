"use server";

import { after } from "next/server";
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
    // 締切後のみ（締切前は誰でも無料で閲覧できる）
    if (new Date(prediction.deadlineAt) >= new Date()) return { success: false, error: "締切前の予想はそのまま閲覧できます。" };
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

