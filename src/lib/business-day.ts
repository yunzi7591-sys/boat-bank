// 営業日の考え方: レース日は深夜2時（JST 26時）までを「当日」として扱う。
// 0時で日付が切り替わると、ナイターレース後の収支登録や当日予想の閲覧が
// 深夜0時で突然できなくなるため、日付判定はすべてこのモジュールを通すこと。

/** 営業日の切り替え時刻（JSTの深夜◯時） */
export const BUSINESS_DAY_END_HOUR = 2;

/** 営業日基準のJST日付文字列（YYYY-MM-DD）。深夜2時までは前日の日付を返す */
export function jstBusinessDateString(now: Date = new Date()): string {
    const shifted = new Date(now.getTime() - BUSINESS_DAY_END_HOUR * 60 * 60 * 1000);
    return shifted.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

/** 営業日基準の raceDate（DB保存形式: 該当日のUTC 00:00:00） */
export function jstBusinessRaceDate(now: Date = new Date()): Date {
    return new Date(`${jstBusinessDateString(now)}T00:00:00.000Z`);
}

/** 指定日時が営業日基準で「今日のレース」かどうか（raceDate と比較する用） */
export function isBusinessToday(raceDate: Date, now: Date = new Date()): boolean {
    const raceStr = raceDate.toLocaleDateString("en-CA", { timeZone: "UTC" });
    return raceStr === jstBusinessDateString(now);
}
