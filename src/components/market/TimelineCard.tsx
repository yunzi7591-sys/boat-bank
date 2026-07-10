import Link from "next/link";
import { Eye, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { FollowButton } from "@/components/market/FollowButton";
import type { TimelineCardPrediction } from "@/lib/types";

export function TimelineCard({
    prediction,
    currentUserId,
    isFollowingAuthor
}: {
    prediction: TimelineCardPrediction;
    currentUserId?: string;
    isFollowingAuthor: boolean;
}) {
    return (
        <Link href={`/predictions/${prediction.id}`} className="block group">
            <div className={`border hover:shadow-[0_4px_12px_rgba(50,50,93,0.12)] transition-shadow rounded-lg overflow-hidden mb-2 ${prediction.isSettled && prediction.isHit ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300' : 'bg-white border-[#dde5ef] hover:border-[#b9b9f9]'}`}>
                <div className="px-3 py-2.5 flex items-center gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold bg-[#061b31] text-white px-1.5 py-0.5 rounded">
                                {prediction.placeName} {prediction.raceNumber}R
                            </span>
                            <span className="text-[10px] text-[#64748d]">
                                {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true, locale: ja })}
                            </span>
                            {prediction.hasCommentary && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#533afd] bg-[#533afd]/10 border border-[#533afd]/20 px-1.5 py-0.5 rounded leading-none">
                                    <FileText className="w-2.5 h-2.5" />見解分析あり
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-sm text-[#061b31] leading-tight truncate group-hover:text-[#533afd] transition-colors">
                            {prediction.title || `${prediction.placeName}勝負レース`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#64748d]">
                            <span className="font-bold">{prediction.author?.name}</span>
                            {prediction.author?.role === 'ADMIN' && <span className="text-[8px] font-black bg-amber-400 text-amber-900 px-1 py-0.5 rounded leading-none">公式</span>}
                            {currentUserId && currentUserId !== prediction.authorId && (
                                <FollowButton targetUserId={prediction.authorId} initialIsFollowing={isFollowingAuthor} />
                            )}
                            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{prediction.viewCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
