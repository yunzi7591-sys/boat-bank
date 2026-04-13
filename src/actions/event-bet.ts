"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { settleEventBets } from "@/lib/evaluate";
import { revalidatePath } from "next/cache";

interface EventBetInput {
    betType: string;
    combination: string;
    amount: number;
}

interface SubmitEventBetsPayload {
    eventId: string;
    placeName: string;
    raceNumber: number;
    raceDate: string; // ISO string
    bets: EventBetInput[];
}

export async function submitEventBets(payload: SubmitEventBetsPayload) {
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
        if (!payload.placeName || !payload.raceNumber || !payload.eventId) {
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

        // 3. Check event is active
        const event = await prisma.event.findUnique({
            where: { id: payload.eventId },
        });
        if (!event || !event.isActive) {
            return { success: false, error: "このイベントは現在開催されていません。" };
        }

        // 3.5. Check race deadline
        const raceDate = new Date(payload.raceDate);
        const schedule = await prisma.raceSchedule.findFirst({
            where: { placeName: payload.placeName, raceNumber: payload.raceNumber, raceDate },
            select: { deadlineAt: true },
        });
        if (schedule && new Date(schedule.deadlineAt) < new Date()) {
            return { success: false, error: "このレースは締め切りを過ぎています。" };
        }

        // 4. Check participant balance (途中参加も可能)
        let participant = await prisma.eventParticipant.findUnique({
            where: { eventId_userId: { eventId: payload.eventId, userId } },
        });
        if (!participant) {
            participant = await prisma.eventParticipant.create({
                data: { eventId: payload.eventId, userId, points: event.initialPt },
            });
        }

        const totalBetAmount = payload.bets.reduce((sum, b) => sum + b.amount, 0);
        if (totalBetAmount > participant.points) {
            return { success: false, error: `限定ptが不足しています。（残高: ${participant.points}pt / 必要: ${totalBetAmount}pt）` };
        }

        // 5. Transaction: create bets + deduct points
        const betDataArray = payload.bets.map(bet => ({
            eventId: payload.eventId,
            userId,
            placeName: payload.placeName,
            raceNumber: payload.raceNumber,
            raceDate,
            betType: bet.betType,
            combination: bet.combination,
            betAmount: bet.amount,
        }));

        await prisma.$transaction(async (tx) => {
            await tx.eventBet.createMany({ data: betDataArray });
            await tx.eventParticipant.update({
                where: { eventId_userId: { eventId: payload.eventId, userId } },
                data: { points: { decrement: totalBetAmount } },
            });
        });

        console.log(`[EventBet] User ${userId} submitted ${payload.bets.length} event bets for ${payload.placeName} R${payload.raceNumber} (event: ${payload.eventId})`);

        // 6. Auto-settle if race result already exists
        const existingResult = await prisma.raceResult.findUnique({
            where: { placeName_raceNumber_raceDate: { placeName: payload.placeName, raceNumber: payload.raceNumber, raceDate } },
        });
        if (existingResult) {
            try {
                await settleEventBets(payload.placeName, payload.raceNumber, raceDate);
                console.log(`[EventBet] Auto-settled event bets for ${payload.placeName} R${payload.raceNumber}`);
            } catch (e: any) {
                console.warn(`[EventBet] Auto-settle failed: ${e.message}`);
            }
        }

        revalidatePath('/events');
        return { success: true, count: payload.bets.length };
    } catch (e: any) {
        console.error("[EventBet Error] Failed to submit event bets:", e);
        return { success: false, error: "限定ptベットの登録に失敗しました。" };
    }
}
