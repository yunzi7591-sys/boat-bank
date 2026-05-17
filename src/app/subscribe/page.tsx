import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserSubscription, isSubscriptionActive } from "@/lib/subscription";
import { SubscribeClient } from "./SubscribeClient";

export default async function SubscribePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login?callbackUrl=/subscribe");

    const subscription = await getUserSubscription(session.user.id);
    const isActive = isSubscriptionActive(subscription);

    return (
        <SubscribeClient
            userId={session.user.id}
            status={subscription?.status ?? null}
            currentPeriodEnd={subscription?.currentPeriodEnd?.toISOString() ?? null}
            trialEnd={subscription?.trialEnd?.toISOString() ?? null}
            willRenew={subscription?.willRenew ?? false}
            isActive={isActive}
        />
    );
}
