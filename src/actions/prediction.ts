"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { calculatePointDeduction } from "@/lib/points";
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
    publishType: "internal" | "external";
    externalUrl?: string;
    analysisComment?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("You must be logged in to publish a prediction.");
    }

    const userId = session.user.id;

    // Ensure cart is not empty
    if (data.cartData.length === 0) {
        throw new Error("Cart is empty. Please add selections before publishing.");
    }

    // Validate price
    if (!Number.isInteger(data.price) || data.price < 0 || data.price > 100_000) {
        throw new Error("価格は0〜100,000の整数で指定してください。");
    }

    // Deadline Guard
    if (new Date(data.deadlineAt) < new Date()) {
        throw new Error("締切時刻を過ぎたレースの予想は公開できません。");
    }

    // Validation by publishType
    if (data.publishType === "internal") {
        if (!data.title) {
            throw new Error("タイトルは必須です。");
        }
    } else if (data.publishType === "external") {
        if (!data.externalUrl || !/^https?:\/\//.test(data.externalUrl)) {
            throw new Error("有効な外部サイトURL（http/httpsで始まる）を入力してください。");
        }
    }

    // Validate cart amounts
    for (const f of data.cartData) {
        for (const c of f.combinations) {
            if (!Number.isInteger(c.amount) || c.amount <= 0 || c.amount > 10_000_000) {
                throw new Error("買い目の金額が不正です。");
            }
        }
    }

    // Calculate total bet amount
    const betAmount = data.cartData.reduce((sum, f) => sum + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

    // Convert cart to JSON string
    const predictedNumbersStr = JSON.stringify(data.cartData);

    if (data.publishType === "external") {
        // External publish: requires 100pt, betsPublic=false forced
        const prediction = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("ユーザーが見つかりません");
            const deduction = calculatePointDeduction(user.points, user.dailyPoints, 100);
            if (!deduction) {
                throw new Error("ポイントが不足しています。外部サイトへの予想公開には100ptが必要です。");
            }

            // 100pt deduction (dailyPoints優先)
            await tx.user.update({
                where: { id: userId },
                data: { points: deduction.newPoints, dailyPoints: deduction.newDailyPoints },
            });

            // Transaction record
            await tx.transaction.create({
                data: {
                    userId,
                    points: -100,
                    action: "EXTERNAL_PUBLISH",
                },
            });

            // Create prediction with betsPublic=false forced
            const pred = await tx.prediction.create({
                data: {
                    title: data.title,
                    commentary: data.commentary,
                    price: data.price,
                    predictedNumbers: predictedNumbersStr,
                    authorId: userId,
                    placeName: data.placeName,
                    raceNumber: data.raceNumber,
                    raceDate: data.raceDate,
                    deadlineAt: data.deadlineAt,
                    publishType: "external",
                    externalUrl: data.externalUrl,
                    betsPublic: false,
                    isPrivate: false,
                    betAmount: betAmount,
                },
            });

            return pred;
        });

        return { success: true, predictionId: prediction.id };
    }

    // Internal publish
    const prediction = await prisma.prediction.create({
        data: {
            title: data.title,
            commentary: data.commentary,
            price: data.price,
            predictedNumbers: predictedNumbersStr,
            authorId: userId,
            placeName: data.placeName,
            raceNumber: data.raceNumber,
            raceDate: data.raceDate,
            deadlineAt: data.deadlineAt,
            isPrivate: data.isPrivate || false,
            publishType: "internal",
            analysisComment: data.analysisComment,
            betsPublic: true,
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

    if (original.publishType === "external") {
        throw new Error("外部サイトの予想には相乗りできません。");
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

    // 相乗り: ポイント消費なし、予想のコピーを作成するだけ
    await prisma.prediction.create({
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

    return { success: true };
}
