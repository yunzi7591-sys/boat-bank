import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
    const h = await headers();

    // Vercel/Next.jsが直接セットするヘッダを最優先（ユーザー改ざん不可）
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();

    // X-Forwarded-Forは "client, proxy1, proxy2" の形式。
    // 信頼するプロキシ（Vercel）が末尾に実IPを追記するため、"最後" のIPを採用する。
    const xff = h.get("x-forwarded-for");
    if (xff) {
        const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
        const last = parts[parts.length - 1];
        if (last) return last;
    }

    return "unknown";
}
