"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMyPredictions() {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") return [];

    return prisma.prediction.findMany({
        where: { authorId: session!.user!.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true,
            title: true,
            placeName: true,
            raceNumber: true,
            raceDate: true,
            publishType: true,
            price: true,
            isSettled: true,
            createdAt: true,
        },
    });
}

export async function deletePrediction(predictionId: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // 自分の予想のみ削除可能
    const pred = await prisma.prediction.findFirst({
        where: { id: predictionId, authorId: session!.user!.id },
    });

    if (!pred) return { success: false, error: "予想が見つかりません" };

    // 関連トランザクションも削除
    await prisma.transaction.deleteMany({ where: { predictionId } });
    await prisma.prediction.delete({ where: { id: predictionId } });

    revalidatePath("/admin");
    return { success: true };
}
