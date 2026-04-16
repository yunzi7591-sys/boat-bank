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
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "ログインが必要です。" };
        }

        const userId = session.user.id;

        if (data.cartData.length === 0) {
            return { success: false, error: "買い目が選択されていません。" };
        }

        if (!Number.isInteger(data.price) || data.price < 0 || data.price > 100_000) {
            return { success: false, error: "価格は0〜100,000の整数で指定してください。" };
        }

        if (new Date(data.deadlineAt) < new Date()) {
            return { success: false, error: "締切時刻を過ぎたレースの予想は公開できません。" };
        }

        if (data.publishType === "internal") {
            if (!data.title) {
                return { success: false, error: "タイトルは必須です。" };
            }
        } else if (data.publishType === "external") {
            if (!data.externalUrl || !/^https?:\/\//.test(data.externalUrl)) {
                return { success: false, error: "有効な外部サイトURL（http/httpsで始まる）を入力してください。" };
            }
        }

        for (const f of data.cartData) {
            for (const c of f.combinations) {
                if (!Number.isInteger(c.amount) || c.amount <= 0 || c.amount > 10_000_000) {
                    return { success: false, error: "買い目の金額が不正です。" };
                }
            }
        }

        const betAmount = data.cartData.reduce((sum, f) => sum + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

        if (betAmount > 100_000) {
            return { success: false, error: "1レースあたりの合計金額は10万円までです。" };
        }

        const predictedNumbersStr = JSON.stringify(data.cartData);

        if (data.publishType === "external") {
            const prediction = await prisma.$transaction(async (tx) => {
                const user = await tx.user.findUnique({ where: { id: userId } });
                if (!user) throw new Error("ユーザーが見つかりません");
                const deduction = calculatePointDeduction(user.points, user.dailyPoints, 100);
                if (!deduction) {
                    throw new Error("ポイントが不足しています。外部サイトへの予想公開には100ptが必要です。");
                }

                await tx.user.update({
                    where: { id: userId },
                    data: { points: deduction.newPoints, dailyPoints: deduction.newDailyPoints },
                });

                await tx.transaction.create({
                    data: { userId, points: -100, action: "EXTERNAL_PUBLISH" },
                });

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

        return { success: true, predictionId: prediction.id };
    } catch (e: any) {
        console.error("[publishPrediction Error]", e);
        return { success: false, error: e.message || "予想の公開に失敗しました。" };
    }
}

export async function ridePrediction(predictionId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "ログインが必要です。" };
        }

        const userId = session.user.id;

        const original = await prisma.prediction.findUnique({
            where: { id: predictionId },
        });

        if (!original) {
            return { success: false, error: "元の予想が見つかりません。" };
        }

        let cartData: Formation[];
        try {
            cartData = typeof original.predictedNumbers === 'string'
                ? JSON.parse(original.predictedNumbers)
                : original.predictedNumbers as unknown as Formation[];
        } catch {
            return { success: false, error: "買い目データの解析に失敗しました。" };
        }

        const betAmount = cartData.reduce((sum, f) => sum + f.combinations.reduce((sub, c) => sub + c.amount, 0), 0);

        if (betAmount <= 0) {
            return { success: false, error: "この予想にはベット金額が設定されていません。" };
        }

        const ride = await prisma.prediction.create({
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

        return { success: true, predictionId: ride.id };
    } catch (e: any) {
        console.error("[ridePrediction Error]", e);
        return { success: false, error: e.message || "相乗りに失敗しました。" };
    }
}
