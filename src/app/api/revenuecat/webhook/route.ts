import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/** タイミング攻撃を避けて秘密トークンを比較する */
function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
}

type RCEvent = {
    type: string;
    app_user_id: string;
    product_id?: string;
    entitlement_ids?: string[];
    environment?: string;
    event_timestamp_ms?: number;
    expiration_at_ms?: number | null;
    original_transaction_id?: string;
    period_type?: string;
    store?: string;
};

type RCWebhookBody = {
    event?: RCEvent;
    api_version?: string;
};

function mapStoreToPlatform(store: string | undefined): string | null {
    switch (store) {
        case "APP_STORE":
            return "app_store";
        case "PLAY_STORE":
            return "play_store";
        case "PROMOTIONAL":
            return "promotional";
        default:
            return null;
    }
}

function mapEventToStatus(type: string, periodType: string | undefined): string | null {
    switch (type) {
        case "INITIAL_PURCHASE":
        case "RENEWAL":
        case "UNCANCELLATION":
        case "PRODUCT_CHANGE":
            return periodType === "TRIAL" ? "trialing" : "active";
        case "CANCELLATION":
            return "active"; // キャンセル申請されたが期限まで有効
        case "EXPIRATION":
            return "expired";
        case "BILLING_ISSUE":
            return "grace_period";
        case "SUBSCRIPTION_PAUSED":
            return "paused";
        default:
            return null;
    }
}

export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization");
    const expected = process.env.REVENUECAT_WEBHOOK_SECRET
        ? `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`
        : null;
    if (!expected || !authHeader || !safeEqual(authHeader, expected)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: RCWebhookBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const event = body.event;
    if (!event) {
        return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    if (event.type === "TEST") {
        return NextResponse.json({ ok: true, test: true });
    }

    // Replay protection: reject events older than 5 minutes
    if (event.event_timestamp_ms) {
        const ageMs = Date.now() - event.event_timestamp_ms;
        const FIVE_MIN = 5 * 60 * 1000;
        if (ageMs > FIVE_MIN || ageMs < -FIVE_MIN) {
            console.warn(`[RevenueCat] Stale or future event rejected: age=${ageMs}ms, type=${event.type}`);
            return NextResponse.json({ error: "Stale event" }, { status: 400 });
        }
    }

    const userId = event.app_user_id;
    if (!userId) {
        return NextResponse.json({ error: "Missing app_user_id" }, { status: 400 });
    }
    // CUID 形式チェック（不正な app_user_id を弾く）
    if (!/^c[a-z0-9]{20,}$/i.test(userId)) {
        console.warn(`[RevenueCat] Invalid app_user_id format: ${userId}`);
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // originalTransactionId が他ユーザーに既に紐づいてないか確認（不正な権限付与防止）
    if (event.original_transaction_id) {
        const conflicting = await prisma.subscription.findFirst({
            where: {
                originalTransactionId: event.original_transaction_id,
                userId: { not: userId },
            },
            select: { userId: true },
        });
        if (conflicting) {
            console.warn(
                `[RevenueCat] originalTransactionId ${event.original_transaction_id} already bound to ${conflicting.userId}, rejected for ${userId}`,
            );
            return NextResponse.json({ error: "Transaction already assigned" }, { status: 409 });
        }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.warn(`[RevenueCat] Unknown app_user_id: ${userId}`);
        // 200で返してリトライを防ぐ（不明ユーザーは自社DB側の問題）
        return NextResponse.json({ ok: true, skipped: "user_not_found" });
    }

    const status = mapEventToStatus(event.type, event.period_type);
    if (!status) {
        console.log(`[RevenueCat] Unhandled event type: ${event.type} for ${userId}`);
        return NextResponse.json({ ok: true, skipped: "unhandled_event" });
    }

    const platform = mapStoreToPlatform(event.store);
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
    const entitlementId = event.entitlement_ids?.[0] ?? null;
    const willRenew = event.type !== "CANCELLATION";
    const unsubscribedAt = event.type === "CANCELLATION" ? new Date() : null;

    const baseData = {
        status,
        productId: event.product_id ?? null,
        platform,
        originalTransactionId: event.original_transaction_id ?? null,
        entitlementId,
        revenueCatUserId: userId,
        currentPeriodEnd: expiresAt,
        willRenew,
        trialEnd: event.period_type === "TRIAL" ? expiresAt : null,
        unsubscribedAt,
    };

    await prisma.subscription.upsert({
        where: { userId },
        create: { userId, ...baseData },
        update: baseData,
    });

    console.log(`[RevenueCat] ${event.type} processed for ${userId} -> ${status}`);
    return NextResponse.json({ ok: true });
}
