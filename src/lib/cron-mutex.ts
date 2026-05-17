import { Redis } from "@upstash/redis";

const hasRedis = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedis ? Redis.fromEnv() : null;

const localLocks = new Map<string, number>();

/**
 * 排他ロックを取得して指定の処理を実行する。
 * 同じ key が他の cron で実行中の場合、即座に skip して null を返す。
 * Redis が無い場合はメモリ内ロックでフォールバック（同一 instance のみ有効）。
 */
export async function withCronMutex<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
): Promise<T | { skipped: true; reason: string }> {
    const lockKey = `bb:cron-lock:${key}`;

    if (redis) {
        // SETNX 相当: 既にあれば失敗
        const acquired = await redis.set(lockKey, Date.now(), {
            nx: true,
            ex: ttlSeconds,
        });
        if (acquired !== "OK") {
            console.warn(`[cron-mutex] ${key} already running, skipped`);
            return { skipped: true, reason: "already-running" };
        }
        try {
            return await fn();
        } finally {
            try {
                await redis.del(lockKey);
            } catch (e) {
                console.warn(`[cron-mutex] release failed for ${key}`, e);
            }
        }
    }

    // フォールバック: メモリロック
    const expiresAt = localLocks.get(lockKey) ?? 0;
    if (expiresAt > Date.now()) {
        return { skipped: true, reason: "already-running-local" };
    }
    localLocks.set(lockKey, Date.now() + ttlSeconds * 1000);
    try {
        return await fn();
    } finally {
        localLocks.delete(lockKey);
    }
}
