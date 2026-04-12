import Link from "next/link";
import { Eye, Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { FollowButton } from "@/components/market/FollowButton";

export function TimelineCard({
    prediction,
    currentUserId,
    isFollowingAuthor
}: {
    prediction: any,
    currentUserId?: string,
    isFollowingAuthor: boolean
}) {
    const isFree = prediction.price === 0;
    const purchaseCount = prediction._count?.transactions || 0;

    return (
        <Link href={`/predictions/${prediction.id}`} className="block group">
            <div className="bg-white border border-[#dde5ef] hover:border-[#b9b9f9] hover:shadow-[0_4px_12px_rgba(50,50,93,0.12)] transition-shadow rounded-lg overflow-hidden mb-2">
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
                        </div>
                        <h3 className="font-bold text-sm text-[#061b31] leading-tight truncate group-hover:text-[#533afd] transition-colors">
                            {prediction.title || `${prediction.placeName}勝負レース`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#64748d]">
                            <span className="font-bold">{prediction.author?.name}</span>
                            {currentUserId && currentUserId !== prediction.authorId && (
                                <FollowButton targetUserId={prediction.authorId} initialIsFollowing={isFollowingAuthor} />
                            )}
                            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{purchaseCount}</span>
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{prediction.viewCount}</span>
                        </div>
                    </div>

                    {/* Price badge */}
                    <div className={`shrink-0 px-2.5 py-1.5 rounded-lg text-center ${isFree ? 'bg-[#15be53]/10' : 'bg-[#533afd]/10'}`}>
                        <span className={`text-xs font-black ${isFree ? 'text-[#15be53]' : 'text-[#533afd]'}`}>
                            {isFree ? "FREE" : `${prediction.price}pt`}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
