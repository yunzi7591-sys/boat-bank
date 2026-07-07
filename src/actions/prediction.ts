"use server";

import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Formation } from "@/lib/bet-logic";
import { sendPushToMultipleUsers } from "@/lib/push";
import { rateLimit } from "@/lib/rate-limit";

async function notifyFollowers(authorId: string, placeName: string, raceNumber: number, predictionId: string) {
    try {
        const author = await prisma.user.findUnique({ where: { id: authorId }, select: { name: true } });
        const followers = await prisma.follows.findMany({
            where: { followingId: authorId },
            select: { followerId: true },
        });
        if (followers.length === 0) return;

        const followerIds = followers.map((f) => f.followerId);
        const message = `${author?.name || "ユーザー"}さんが${placeName} ${raceNumber}Rの予想を公開しました`;
        await sendPushToMultipleUsers(followerIds, "NEW_PREDICTION", message, `/predictions/${predictionId}`);
    } catch (e) {
        console.error("[notifyFollowers Error]", e);
    }
}

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

        // 連続投稿スパム対策: 公開予想は10分で10件まで（非公開予想は制限対象外）
        if (!data.isPrivate) {
            const { allowed, retryAfterMs } = await rateLimit(
                `publish:${userId}`,
                10,
                10 * 60 * 1000,
            );
            if (!allowed) {
                const mins = Math.ceil(retryAfterMs / 60000);
                return {
                    success: false,
                    error: `投稿が早すぎます。10分間に公開できる予想は10件までです。約${mins}分後に再度お試しください。`,
                };
            }
        }

        if (data.cartData.length === 0) {
            return { success: false, error: "買い目が選択されていません。" };
        }

        if (!Number.isInteger(data.price) || data.price < 0 || data.price > 100_000) {
            return { success: false, error: "価格は0〜100,000の整数で指定してください。" };
        }

        // クライアントから送られた deadlineAt は信用せず、DBから正規の締切時刻を引き直す
        const raceDateForLookup = new Date(data.raceDate);
        const schedule = await prisma.raceSchedule.findUnique({
            where: {
                placeName_raceNumber_raceDate: {
                    placeName: data.placeName,
                    raceNumber: data.raceNumber,
                    raceDate: raceDateForLookup,
                },
            },
            select: { deadlineAt: true },
        });
        if (!schedule) {
            return { success: false, error: "対象レースが見つかりません。" };
        }
        // 締切後は「公開予想」のみ禁止。非公開（自分用の収支記録）は締切後でも登録可
        if (!data.isPrivate && schedule.deadlineAt < new Date()) {
            return { success: false, error: "締切時刻を過ぎたレースの予想は公開できません。" };
        }
        data.deadlineAt = schedule.deadlineAt;

        // 1レースにつき1人1予想まで（同じ場・レース番号・日付への重複公開を禁止）
        const existing = await prisma.prediction.findFirst({
            where: {
                authorId: userId,
                placeName: data.placeName,
                raceNumber: data.raceNumber,
                raceDate: raceDateForLookup,
            },
            select: { id: true },
        });
        if (existing) {
            return { success: false, error: "このレースには既に予想を公開しています。1レースにつき1予想までです。" };
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
                // 残高条件付きUPDATEでロストアップデートを防ぐ
                const deducted = await tx.$executeRaw`
                    UPDATE "User"
                    SET "dailyPoints" = GREATEST("dailyPoints" - 100, 0),
                        "points" = "points" - GREATEST(100 - "dailyPoints", 0)
                    WHERE id = ${userId}
                      AND "dailyPoints" + "points" >= 100
                `;
                if (deducted === 0) {
                    throw new Error("ポイントが不足しています。外部サイトへの予想公開には100ptが必要です。");
                }

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

            // フォロワーに通知（応答をブロックしないよう after で送信）
            after(() => notifyFollowers(userId, data.placeName, data.raceNumber, prediction.id));
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

        // フォロワーに通知（応答をブロックしないよう after で送信）
        after(() => notifyFollowers(userId, data.placeName, data.raceNumber, prediction.id));
        return { success: true, predictionId: prediction.id };
    } catch (e: any) {
        console.error("[publishPrediction Error]", e);
        return { success: false, error: e.message || "予想の公開に失敗しました。" };
    }
}

