/**
 * リトライ・タイムアウト機能付き fetch ラッパー
 * 外部 API（boatrace.jp など）への接続エラーや一時的な障害に強くする
 */

export type FetchWithRetryOptions = RequestInit & {
    /** リトライ回数（既定: 3） */
    retries?: number;
    /** タイムアウト ms（既定: 10000） */
    timeoutMs?: number;
    /** 指数バックオフ基準 ms（既定: 500） */
    backoffMs?: number;
    /** デバッグログラベル */
    label?: string;
};

const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_BACKOFF_MS = 500;

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

export async function fetchWithRetry(
    url: string,
    options: FetchWithRetryOptions = {},
): Promise<Response> {
    const {
        retries = DEFAULT_RETRIES,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        backoffMs = DEFAULT_BACKOFF_MS,
        label,
        ...init
    } = options;

    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...init, signal: controller.signal });
            clearTimeout(timer);

            // 5xx と 429 はリトライ対象
            if (res.status >= 500 || res.status === 429) {
                if (attempt < retries) {
                    const wait = backoffMs * Math.pow(2, attempt) + Math.random() * 200;
                    console.warn(
                        `[fetchWithRetry${label ? `:${label}` : ""}] ${url} status=${res.status}, retrying in ${Math.round(wait)}ms (attempt ${attempt + 1}/${retries})`,
                    );
                    await sleep(wait);
                    continue;
                }
            }
            return res;
        } catch (e) {
            clearTimeout(timer);
            lastErr = e;
            if (attempt < retries) {
                const wait = backoffMs * Math.pow(2, attempt) + Math.random() * 200;
                console.warn(
                    `[fetchWithRetry${label ? `:${label}` : ""}] ${url} error=${(e as Error).message}, retrying in ${Math.round(wait)}ms (attempt ${attempt + 1}/${retries})`,
                );
                await sleep(wait);
                continue;
            }
        }
    }
    throw lastErr ?? new Error(`fetchWithRetry exhausted: ${url}`);
}
