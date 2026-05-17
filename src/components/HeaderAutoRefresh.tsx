"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function HeaderAutoRefresh() {
    const router = useRouter();
    const lastRefreshRef = useRef(0);

    useEffect(() => {
        const refreshIfStale = () => {
            const now = Date.now();
            if (now - lastRefreshRef.current < 5000) return;
            lastRefreshRef.current = now;
            router.refresh();
        };

        const onVisibility = () => {
            if (document.visibilityState === "visible") refreshIfStale();
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("focus", refreshIfStale);

        const interval = setInterval(refreshIfStale, 60_000);

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", refreshIfStale);
            clearInterval(interval);
        };
    }, [router]);

    return null;
}
