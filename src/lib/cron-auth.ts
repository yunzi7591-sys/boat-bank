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

    if (authHeader !== `Bearer ${secret}`) {
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
