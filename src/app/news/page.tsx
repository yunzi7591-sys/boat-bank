import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewsListClient } from "@/components/news/NewsListClient";

export const revalidate = 60;

export default async function NewsPage() {
    const allNews = await prisma.news.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
    });

    const newsItems = allNews.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt.toISOString(),
    }));

    return (
        <div className="min-h-full pb-8">
            {/* Header */}
            <div className="px-4 pt-4 pb-2">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#64748d] hover:text-[#533afd] transition-colors mb-3"
                >
                    <ChevronLeft className="w-4 h-4" />
                    ホームに戻る
                </Link>
                <h1 className="text-lg font-black text-[#061b31]">ニュース</h1>
                <p className="text-xs text-[#64748d] mt-0.5">お知らせ・更新情報</p>
            </div>

            {/* News List */}
            <div className="px-4 mt-3">
                {newsItems.length === 0 ? (
                    <div className="bg-white rounded-lg border border-[#e5edf5] p-8 text-center">
                        <p className="text-[#64748d] text-sm">ニュースはありません</p>
                    </div>
                ) : (
                    <NewsListClient items={newsItems} />
                )}
            </div>
        </div>
    );
}
