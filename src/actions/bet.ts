"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
        const invalidBet = payload.bets.find(bet => bet.amount <= 0);
        if (invalidBet) {
            return { success: false, error: "ベット金額は1以上で指定してください。" };
        }

        // 2.6. Check point balance
        const totalBetAmount = payload.bets.reduce((sum, bet) => sum + bet.amount, 0);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.points < totalBetAmount) {
            return { success: false, error: "ポイントが不足しています" };
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

        // 4. Bulk insert with createMany and deduct points in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Re-check balance inside transaction to prevent race conditions
            const freshUser = await tx.user.findUnique({ where: { id: userId } });
            if (!freshUser || freshUser.points < totalBetAmount) {
                throw new Error("ポイントが不足しています");
            }

            const created = await tx.userBet.createMany({
                data: betDataArray,
            });

            await tx.user.update({
                where: { id: userId },
                data: { points: { decrement: totalBetAmount } },
            });

            await tx.transaction.create({
                data: {
                    userId,
                    points: -totalBetAmount,
                    action: "BET",
                },
            });

            return created;
        });

        console.log(`[Bet] User ${userId} submitted ${result.count} bets for ${payload.placeName} R${payload.raceNumber}`);
        return { success: true, count: result.count };
    } catch (e: any) {
        console.error("[Bet Error] Failed to submit bets:", e);
        return { success: false, error: e.message };
    }
}
