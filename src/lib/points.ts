/**
 * ポイント消費ヘルパー
 * dailyPoints（毎日500pt、持ち越し不可）を先に消費し、足りなければpointsから消費
 */
export function calculatePointDeduction(
    currentPoints: number,
    currentDailyPoints: number,
    cost: number
): { newPoints: number; newDailyPoints: number } | null {
    const totalAvailable = currentPoints + currentDailyPoints;
    if (totalAvailable < cost) return null; // 不足

    let remaining = cost;
    let newDailyPoints = currentDailyPoints;
    let newPoints = currentPoints;

    // まずdailyPointsから消費
    if (newDailyPoints >= remaining) {
        newDailyPoints -= remaining;
        remaining = 0;
    } else {
        remaining -= newDailyPoints;
        newDailyPoints = 0;
    }

    // 残りをpointsから消費
    if (remaining > 0) {
        newPoints -= remaining;
    }

    return { newPoints, newDailyPoints };
}
