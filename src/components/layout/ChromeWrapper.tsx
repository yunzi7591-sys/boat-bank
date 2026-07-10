"use client";

import { usePathname } from "next/navigation";

// ヘッダー・フッター等のアプリUIを出さないページ（LP・診断などの独立コンテンツ）
const CHROMELESS_PREFIXES = ["/lp", "/shindan"];

export function HideOnLp({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname && CHROMELESS_PREFIXES.some(p => pathname.startsWith(p))) return null;
    return <>{children}</>;
}

export function MainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLp = pathname?.startsWith("/lp");

    if (isLp) {
        return (
            <main className="flex-1 w-full overflow-y-auto overscroll-none bg-white" style={{ WebkitOverflowScrolling: "touch" }}>
                {children}
            </main>
        );
    }
    return (
        <main
            className="flex-1 w-full relative max-w-md mx-auto bg-white overflow-y-auto overscroll-none"
            style={{
                WebkitOverflowScrolling: "touch",
                boxShadow:
                    "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
            }}
        >
            {children}
        </main>
    );
}
