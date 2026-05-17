import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || "";

    // 正規化: www.boatbank.jp や他のドメインは boatbank.jp にリダイレクト（重複インデックス防止）
    if (host !== "boatbank.jp" && host !== "localhost:3000") {
        const url = new URL(request.url);
        url.host = "boatbank.jp";
        url.protocol = "https";
        url.port = "";
        return NextResponse.redirect(url, 308);
    }

    const response = NextResponse.next();

    // SNS の OGP プレビュー用クローラーには noindex を付けない
    const ua = request.headers.get("user-agent") || "";
    const isSocialCrawler = /Twitterbot|facebookexternalhit|facebookcatalog|LinkedInBot|Slackbot|Discordbot|WhatsApp|line\-|TelegramBot|Pinterest/i.test(ua);

    // TOPページとクローラー基本ファイル以外は noindex（検索結果はトップだけに統一）
    const pathname = request.nextUrl.pathname;
    const isCrawlerEssential = pathname === "/" || pathname === "/sitemap.xml" || pathname === "/robots.txt";
    if (!isCrawlerEssential && !isSocialCrawler) {
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }

    return response;
}

export const config = {
    // APIルートとstaticファイルは除外
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-.*).*)"],
};
