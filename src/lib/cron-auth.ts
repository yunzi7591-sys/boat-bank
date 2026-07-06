import { timingSafeEqual } from "crypto";

/** 長さ差でも早期returnせず、タイミング攻撃を避けて文字列を比較する */
function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}

export function verifyCronAuth(req: Request): { ok: true } | { ok: false; response: Response } {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            return {
                ok: false,
                response: new Response(JSON.stringify({ error: "CRON_SECRET not configured" }), {
                    status: 500,
                    headers: { "content-type": "application/json" },
                }),
            };
        }
        return { ok: true };
    }

    if (!authHeader || !safeEqual(authHeader, `Bearer ${secret}`)) {
        return {
            ok: false,
            response: new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "content-type": "application/json" },
            }),
        };
    }

    return { ok: true };
}
