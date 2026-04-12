"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PredictionItem {
    id: string;
    placeName: string;
    raceNumber: number;
    title: string | null;
    price: number;
    isSettled: boolean;
    isHit: boolean;
    createdAt: string;
    purchaseCount: number;
    authorName?: string;
}

const PAGE_SIZE = 5;

export function PredictionList({ items, showAuthor = false }: { items: PredictionItem[]; showAuthor?: boolean }) {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(items.length / PAGE_SIZE);
    const visible = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    if (items.length === 0) {
        return <p className="text-center text-[#64748d] py-8 bg-white rounded-lg border border-[#e5edf5]">予想はありません</p>;
    }

    return (
        <div>
            <div className="space-y-2">
                {visible.map(pred => (
                    <Link href={`/predictions/${pred.id}`} key={pred.id}>
                        <div className={`border rounded-lg p-3 transition-colors ${pred.isSettled && pred.isHit ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300' : 'bg-white border-[#e5edf5] hover:border-[#b9b9f9]'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-[#061b31] text-white px-1.5 py-0.5 rounded">{pred.placeName} {pred.raceNumber}R</span>
                                    <span className="text-[10px] text-[#64748d]">{new Date(pred.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
                                </div>
                                {!pred.isSettled ? (
                                    <span className="text-[10px] text-[#64748d] bg-[#f6f8fa] px-1.5 py-0.5 rounded">結果待ち</span>
                                ) : pred.isHit ? (
                                    <span className="text-[10px] font-bold text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded">的中</span>
                                ) : (
                                    <span className="text-[10px] text-[#64748d] bg-[#f6f8fa] px-1.5 py-0.5 rounded">不的中</span>
                                )}
                            </div>
                            <p className="font-bold text-sm text-[#061b31] truncate">{pred.title || '無題'}</p>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-[#64748d]">
                                {showAuthor && pred.authorName && <span>{pred.authorName}</span>}
                                <span>{pred.price > 0 ? `${pred.price}pt` : '無料'}</span>
                                <span>{pred.purchaseCount}人購入</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-1.5 rounded-md text-[#64748d] hover:bg-[#f6f8fa] disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-[#64748d]">{page + 1} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
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
