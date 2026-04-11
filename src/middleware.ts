import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || "";

    // boat-bank.vercel.app や他の旧ドメインからboatbank.jpにリダイレクト
    if (host !== "boatbank.jp" && host !== "www.boatbank.jp" && host !== "localhost:3000") {
        const url = new URL(request.url);
        url.host = "boatbank.jp";
        url.protocol = "https";
        url.port = "";
        return NextResponse.redirect(url, 308);
    }

    return NextResponse.next();
}

export const config = {
    // APIルートとstaticファイルは除外
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-.*).*)"],
};
