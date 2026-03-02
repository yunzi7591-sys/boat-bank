"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { Formation } from "@/lib/bet-logic";

export async function publishPrediction(data: {
    title: string;
    commentary: string;
    price: number;
    placeName: string;
    raceNumber: number;
    raceDate: Date;
    deadlineAt: Date;
    cartData: Formation[];
    isPrivate?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to publish a prediction.");
    }

    // Ensure cart is not empty
    if (data.cartData.length === 0) {
        throw new Error("Cart is empty. Please add selections before publishing.");
    }

    // Deadline Guard
    if (new Date(data.deadlineAt) < new Date()) {
        throw new Error("締切時刻を過ぎたレースの予想は公開できません。");
    }

    // Calculate total bet amount
    const betAmount = data.cartData.reduce((sum, f) => sum + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

    // Convert cart to JSON string
    const predictedNumbersStr = JSON.stringify(data.cartData);

    const prediction = await prisma.prediction.create({
        data: {
            title: data.title,
            commentary: data.commentary,
            price: data.price,
            predictedNumbers: predictedNumbersStr,
            authorId: session.user.id,
            placeName: data.placeName,
            raceNumber: data.raceNumber,
            raceDate: data.raceDate,
            deadlineAt: data.deadlineAt,
            isPrivate: data.isPrivate || false,
            betAmount: betAmount,
        },
    });

    // Return ID to let the client handle navigation safely
    return { success: true, predictionId: prediction.id };
}

export async function ridePrediction(predictionId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to ride a prediction.");
    }

    const userId = session.user.id;

    const original = await prisma.prediction.findUnique({
        where: { id: predictionId },
    });

    if (!original) {
        throw new Error("元の予想が見つかりません。");
    }

    if (new Date(original.deadlineAt) < new Date()) {
        throw new Error("締切時刻を過ぎているため、この予想には乗れません。");
    }

    let cartData: Formation[] = [];
    try {
        cartData = JSON.parse(original.predictedNumbers as string);
    } catch (e) {
        throw new Error("買い目データの解析に失敗しました。");
    }

    const betAmount = cartData.reduce((sum, f) => sum + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

    if (betAmount <= 0) {
        throw new Error("この予想にはベット金額が設定されていません。");
    }

    await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.points < betAmount) {
            throw new Error(`ポイントが不足しています。ベットには ${betAmount.toLocaleString()}pt 必要です。`);
        }

        // Deduct points
        await tx.user.update({
            where: { id: userId },
            data: { points: { decrement: betAmount } },
        });

        // Record bet transaction
        await tx.transaction.create({
            data: {
                userId,
                points: -betAmount,
                action: "RIDE_BET",
                predictionId: original.id,
            }
        });

        // Create private copy
        await tx.prediction.create({
            data: {
                title: `[相乗り] ${original.title || '無題'}`,
                commentary: "",
                price: 0,
                predictedNumbers: original.predictedNumbers as Prisma.InputJsonValue,
                authorId: userId,
                placeName: original.placeName,
                raceNumber: original.raceNumber,
                raceDate: original.raceDate,
                deadlineAt: original.deadlineAt,
                isPrivate: true,
                betAmount: betAmount,
                originalPredictionId: original.id,
            }
        });
    });

    return { success: true };
}
