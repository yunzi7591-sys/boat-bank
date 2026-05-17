export function errorMessage(e: unknown, fallback = "不明なエラーが発生しました"): string {
    return e instanceof Error ? e.message : fallback;
}
