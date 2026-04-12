"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NewsItem {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

const PAGE_SIZE = 10;

export function NewsListClient({ items }: { items: NewsItem[] }) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const visible = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div>
            <div className="space-y-3">
                {visible.map((news) => (
                    <div
                        key={news.id}
                        className="bg-white border border-[#e5edf5] rounded-lg p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] font-bold bg-[#533afd] text-white px-1.5 py-0.5 rounded">
                                NEWS
                            </span>
                            <span className="text-[10px] text-[#64748d]">
                                {new Date(news.createdAt).toLocaleDateString("ja-JP", {
                                    timeZone: "Asia/Tokyo",
                                })}
                            </span>
                        </div>
                        <h2 className="text-sm font-bold text-[#061b31] mb-2">
                            {news.title}
                        </h2>
                        <div
                            className="text-sm text-[#374151] leading-relaxed [&_a]:text-[#533afd] [&_a]:underline [&_a]:hover:text-[#3b1ff0]"
                            dangerouslySetInnerHTML={{ __html: news.content }}
                        />
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-md text-[#64748d] hover:bg-[#f6f8fa] disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#64748d]">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() =>
                            setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page >= totalPages - 1}
                        className="p-1.5 rounded-md text-[#64748d] hover:bg-[#f6f8fa] disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
