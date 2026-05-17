"use client";

import { useEffect } from "react";
import { configureRevenueCat } from "@/lib/revenuecat";
import { isNativeApp } from "@/lib/platform";

type Props = { userId: string | null };

export function RevenueCatInit({ userId }: Props) {
    useEffect(() => {
        if (!userId) return;
        if (!isNativeApp()) return;
        configureRevenueCat(userId).catch((e) =>
            console.warn("[RevenueCatInit] failed", e),
        );
    }, [userId]);

    return null;
}
