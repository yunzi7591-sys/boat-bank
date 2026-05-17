import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };
const memBuckets = new Map<string, Bucket>();

const hasRedis = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedis ? Redis.fromEnv() : null;

const rlCache = new Map<string, Ratelimit>();

function getRatelimit(limit: number, windowMs: number): Ratelimit | null {
    if (!redis) return null;
    const key = `${limit}:${windowMs}`;
    const cached = rlCache.get(key);
    if (cached) return cached;
    const seconds = Math.max(1, Math.round(windowMs / 1000));
    const rl = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
        analytics: false,
        prefix: "bb:rl",
    });
    rlCache.set(key, rl);
    return rl;
}

export async function rateLimit(
    key: string,
    limit: number,
    windowMs: number,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
    const rl = getRatelimit(limit, windowMs);
    if (rl) {
        try {
            const { success, reset } = await rl.limit(key);
            return {
                allowed: success,
                retryAfterMs: success ? 0 : Math.max(0, reset - Date.now()),
            };
        } catch (e) {
            console.warn("[rateLimit] Redis failed, falling back to memory", e);
        }
    }

    const now = Date.now();
    const b = memBuckets.get(key);
    if (!b || b.resetAt <= now) {
        memBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterMs: 0 };
    }
    if (b.count >= limit) {
        return { allowed: false, retryAfterMs: b.resetAt - now };
    }
    b.count += 1;
    return { allowed: true, retryAfterMs: 0 };
}

if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, b] of memBuckets) {
            if (b.resetAt <= now) memBuckets.delete(key);
        }
    }, 60 * 1000).unref?.();
}
