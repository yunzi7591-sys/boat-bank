"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { settleRacePredictions } from "@/lib/evaluate";
import { revalidatePath } from "next/cache";

export async function deleteBet(betId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    await prisma.userBet.deleteMany({
        where: { id: betId, userId: session.user.id },
    });

    revalidatePath("/mypage");
    return { success: true };
}

export async function deleteBets(betIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    await prisma.userBet.deleteMany({
        where: { id: { in: betIds }, userId: session.user.id },
    });

    revalidatePath("/mypage");
    return { success: true };
}

interface BetInput {
    betType: string;
    combination: string;
    amount: number;
}

interface SubmitBetsPayload {
    placeName: string;
    raceNumber: number;
    raceDate: string; // ISO string
    bets: BetInput[];
}

export async function submitBets(payload: SubmitBetsPayload) {
    try {
        // 1. Authenticate user
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "ログインが必要です。" };
        }
        const userId = session.user.id;

        // 2. Validate input
        if (!payload.bets || payload.bets.length === 0) {
            return { success: false, error: "買い目が選択されていません。" };
        }
        if (!payload.placeName || !payload.raceNumber) {
            return { success: false, error: "レース情報が不足しています。" };
        }

        // 2.5. Validate individual bet amounts
        for (const bet of payload.bets) {
            if (!Number.isInteger(bet.amount) || bet.amount <= 0) {
                return { success: false, error: "ベット金額は1以上の整数で指定してください。" };
            }
            if (bet.amount > 10_000_000) {
                return { success: false, error: "ベット金額が上限を超えています。" };
            }
        }

        const raceDate = new Date(payload.raceDate);

        // 3. Build data array for createMany
        const betDataArray = payload.bets.map(bet => ({
            userId,
            betAmount: bet.amount,
            betType: bet.betType,
            combination: bet.combination,
            placeName: payload.placeName,
            raceNumber: payload.raceNumber,
            raceDate: raceDate,
        }));

        // 4. Bulk insert (賭け記録のみ、ポイント消費なし — 実際の舟券購入の記録)
        const result = await prisma.userBet.createMany({
            data: betDataArray,
        });

        console.log(`[Bet] User ${userId} submitted ${result.count} bets for ${payload.placeName} R${payload.raceNumber}`);

        // 5. 結果が既にあれば即座に精算
        const existingResult = await prisma.raceResult.findUnique({
            where: { placeName_raceNumber_raceDate: { placeName: payload.placeName, raceNumber: payload.raceNumber, raceDate } },
        });
        if (existingResult) {
            try {
                await settleRacePredictions(payload.placeName, payload.raceNumber, raceDate);
                console.log(`[Bet] Auto-settled bets for ${payload.placeName} R${payload.raceNumber}`);
            } catch (e: any) {
                console.warn(`[Bet] Auto-settle failed: ${e.message}`);
            }
        }

        revalidatePath('/mypage');
        return { success: true, count: result.count };
    } catch (e: any) {
        console.error("[Bet Error] Failed to submit bets:", e);
        return { success: false, error: "ベットの登録に失敗しました。" };
    }
}
