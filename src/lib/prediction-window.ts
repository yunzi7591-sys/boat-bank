/**
 * 公開予想の「早すぎる投稿」を防ぐための開放時刻ロジック。
 * 展示を見ずに投稿される当てずっぽう予想を防ぐ目的で、
 * place画面(UI) と publishPrediction(サーバー) の両方で同じ判定に使う。
 *
 * ルール:
 *  - 1R目      : 締切の30分前から公開可能
 *  - 2R目以降  : 前レースの締切時刻を過ぎてから公開可能
 *               （前レースの締切が取得できない場合は「締切30分前」にフォールバック）
 * 非公開（自分用の収支記録）はこの制限の対象外。
 */

export const R1_PUBLISH_LEAD_MS = 30 * 60 * 1000; // 1R目: 締切30分前

/** 公開予想を投稿できる最も早い時刻を返す。 */
export function earliestPublishTime(
    raceNumber: number,
    deadlineAt: Date | string,
    prevDeadlineAt?: Date | string | null,
): Date {
    if (raceNumber > 1 && prevDeadlineAt) {
        return new Date(prevDeadlineAt);
    }
    return new Date(new Date(deadlineAt).getTime() - R1_PUBLISH_LEAD_MS);
}

/** 現在時刻が公開可能時刻に達しているか。 */
export function canPublishNow(
    raceNumber: number,
    deadlineAt: Date | string,
    prevDeadlineAt?: Date | string | null,
    now: Date = new Date(),
): boolean {
    return now.getTime() >= earliestPublishTime(raceNumber, deadlineAt, prevDeadlineAt).getTime();
}

/** 開放時刻を JST の "HH:MM" 表記で返す。 */
export function formatPublishOpenTime(
    raceNumber: number,
    deadlineAt: Date | string,
    prevDeadlineAt?: Date | string | null,
): string {
    return earliestPublishTime(raceNumber, deadlineAt, prevDeadlineAt).toLocaleTimeString("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
    });
}
