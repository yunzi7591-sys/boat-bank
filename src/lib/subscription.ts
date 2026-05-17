import { prisma } from "@/lib/prisma";
import type { Subscription } from "@prisma/client";

const ACTIVE_STATUSES = ["active", "trialing", "grace_period"] as const;

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
        where: { userId },
    });
}

export async function isSubscriber(userId: string | undefined | null): Promise<boolean> {
    if (!userId) return false;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    if (user?.role === "ADMIN" || user?.role === "MONITOR") return true;

    const sub = await getUserSubscription(userId);
    if (!sub) return false;
    if (!ACTIVE_STATUSES.includes(sub.status as (typeof ACTIVE_STATUSES)[number])) return false;
    if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) return false;
    return true;
}

export function isSubscriptionActive(sub: Subscription | null | undefined): boolean {
    if (!sub) return false;
    if (!ACTIVE_STATUSES.includes(sub.status as (typeof ACTIVE_STATUSES)[number])) return false;
    if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) return false;
    return true;
}

export function isSubscriptionGateEnabled(): boolean {
    return process.env.SUBSCRIPTION_GATE_ENABLED === "true";
}
