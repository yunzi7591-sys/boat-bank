import { prisma } from "@/lib/prisma";
import { Formation } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";

export interface PayoutData {
    type: string;    // "3TR" (3連単), "2TR" (2連単) 等
    numbers: string; // "1-2-3" 等
    amount: number;  // 100円あたりの払戻金 (例: 1540)
}

/**
 * 終了したレースの結果に基づき、未精算の予測（Prediction）を精算（Settlement）します。
 * - 返還 (REFUND): 買い目に返還対象の艇が含まれる場合、オッズに関わらず投資額を全額返還。
 * - 的中 (WIN): 返還の対象外で、着順（payouts）と一致した場合、オッズ通りの払戻を実施。
 */
export async function settleRacePredictions(placeName: string, raceNumber: number, raceDate: Date) {
    const raceResult = await prisma.raceResult.findUnique({
        where: { placeName_raceNumber_raceDate: { placeName, raceNumber, raceDate } },
    });

    if (!raceResult) throw new Error("Race result not found");

    // 未精算かつ、賭け金(betAmount)が0より大きい、自身用・販売用含め全てのPredictionを取得
    const predictions = await prisma.prediction.findMany({
        where: {
            placeName,
            raceNumber,
            raceDate,
            isSettled: false,
            betAmount: { gt: 0 }
        },
    });

    let payoutsList: PayoutData[] = [];
    try {
        payoutsList = parseJsonSafely<PayoutData[]>(raceResult.payouts) || [];
    } catch (e) {
        console.error("Failed to parse payouts JSON", e);
        return { success: false, settledCount: 0 };
    }

    const refundedBoats: number[] = raceResult.refunds || [];
    let settledCount = 0;

    for (const pred of predictions) {
        let formations: Formation[] = [];
        try {
            formations = parseJsonSafely<Formation[]>(pred.predictedNumbers) || [];
        } catch (e) {
            continue; // Skip invalid formats
        }

        let isHit = false;
        let isRefunded = false;
        let totalRefundAmount = 0; // 返還によるポイントバック額
        let totalWinAmount = 0;    // 的中によるポイントバック額

        for (const formation of formations) {
            const officialPayoutsForType = payoutsList.filter(p => p.type === formation.betType);

            for (const comb of formation.combinations) {
                // 1. 返還チェック (REFUND)
                // 買い目（"1-2-3"や"1=2=3"等）の中に、返還艇（[1, 2]等）が含まれているか確認
                const betNumbers = comb.id.split(/[-=]/).map(n => parseInt(n, 10));
                const containsRefundedBoat = betNumbers.some(n => refundedBoats.includes(n));

                if (containsRefundedBoat) {
                    isRefunded = true;
                    totalRefundAmount += comb.amount; // 賭け金をそのまま全額返還
                    continue; // 返還された買い目は的中の判定を行わない
                }

                // 2. 的中チェック (WIN) - WIDEなど複数的中がある券種に対応
                for (const officialPayout of officialPayoutsForType) {
                    if (comb.id === officialPayout.numbers) {
                        isHit = true;
                        // 例: 払戻金1540円(100円あたり)で 500pt 賭けていたら -> (1540 / 100) * 500 = 7700pt
                        const winPayout = Math.floor((officialPayout.amount / 100) * comb.amount);
                        totalWinAmount += winPayout;
                    }
                }
            }
        }

        const totalEarned = totalRefundAmount + totalWinAmount;

        // DBトランザクションでユーザーポイントへの加算と精算完了フラグを同時に更新
        await prisma.$transaction(async (tx) => {
            // 予想ステータスの更新
            await tx.prediction.update({
                where: { id: pred.id },
                data: {
                    isSettled: true,
                    resultChecked: true, // 互換性のため残す
                    isHit: isHit || isRefunded, // ユーザーから見て「ポイントが戻ってきた」ら便宜上Hit扱いまたは別途対応
                    hitAmount: totalEarned, // 獲得総額
                    refundAmount: totalEarned, // 互換性のため
                },
            });

            if (totalEarned > 0) {
                // ユーザーのポイント残高を加算
                await tx.user.update({
                    where: { id: pred.authorId },
                    data: {
                        points: { increment: totalEarned }
                    }
                });

                // トランザクション履歴の作成
                await tx.transaction.create({
                    data: {
                        userId: pred.authorId,
                        points: totalEarned,
                        action: isRefunded && totalWinAmount === 0 ? "REFUND" : "WIN", // 返還のみか、的中があったか
                        predictionId: pred.id,
                    }
                });
            }
        });

        settledCount++;
    }

    // === UserBet の精算 ===
    const userBets = await prisma.userBet.findMany({
        where: {
            placeName,
            raceNumber,
            raceDate,
            isSettled: false,
            betType: { not: null },
            combination: { not: null },
        },
    });

    for (const bet of userBets) {
        const betNumbers = bet.combination!.split(/[-=]/).map(n => parseInt(n, 10));
        const containsRefundedBoat = betNumbers.some(n => refundedBoats.includes(n));

        let hitAmount = 0;
        let isHit = false;

        if (containsRefundedBoat) {
            // 返還: 賭け金そのまま返す
            hitAmount = bet.betAmount;
            isHit = true;
        } else {
            // 的中チェック
            const officialPayouts = payoutsList.filter(p => p.type === bet.betType);
            for (const payout of officialPayouts) {
                if (bet.combination === payout.numbers) {
                    hitAmount = Math.floor((payout.amount / 100) * bet.betAmount);
                    isHit = true;
                }
            }
        }

        await prisma.userBet.update({
            where: { id: bet.id },
            data: {
                isSettled: true,
                isHit,
                hitAmount,
                refundAmount: containsRefundedBoat ? bet.betAmount : 0,
            },
        });

        settledCount++;
    }

    return { success: true, settledCount };
}
