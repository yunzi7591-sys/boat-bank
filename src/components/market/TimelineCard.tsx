import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Unlock, ChevronRight, Clock } from "lucide-react";
import { FollowButton } from "@/components/market/FollowButton";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export function TimelineCard({
    prediction,
    currentUserId,
    isFollowingAuthor
}: {
    prediction: any,
    currentUserId?: string,
    isFollowingAuthor: boolean
}) {

    const isAuthor = currentUserId === prediction.authorId;
    const isFree = prediction.price === 0;

    return (
        <Link href={`/predictions/${prediction.id}`} className="block group">
            <div className="bg-white border border-slate-100 hover:border-slate-200 transition-all rounded-2xl overflow-hidden mb-3">
                {/* Header: Author */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600 text-sm">
                            {prediction.author?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                            <span className="font-bold text-[13px] text-slate-900">{prediction.author?.name || "Anonymous"}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true, locale: ja })}
                            </span>
                        </div>
                    </div>

                    {currentUserId && !isAuthor && (
                        <FollowButton targetUserId={prediction.authorId} initialIsFollowing={isFollowingAuthor} />
                    )}
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-[15px] text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                            {prediction.title || `${prediction.placeName}勝負レース`}
                        </h3>
                        <span className="shrink-0 text-[10px] font-bold bg-slate-900 text-white px-2 py-1 rounded-lg ml-2">
                            {prediction.placeName} {prediction.raceNumber}R
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center">
                            <span className="text-[10px] text-slate-400 font-medium">ベット額</span>
                            <p className="text-sm font-bold text-slate-800 tabular-nums">{(prediction.betAmount || 0).toLocaleString()}円</p>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 text-center">
                            <span className="text-[10px] text-slate-400 font-medium">締切</span>
                            <p className="text-sm font-bold text-slate-800">
                                {new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {/* Price */}
                    <div className={`px-4 py-3 rounded-xl flex items-center justify-between ${isFree ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <div>
                            <span className="text-[10px] text-slate-400 font-medium">閲覧価格</span>
                            <p className={`text-xl font-black tracking-tight ${isFree ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {isFree ? "FREE" : `${prediction.price.toLocaleString()} pt`}
                            </p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFree ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                            {isFree ? <Unlock className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-slate-300" />}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Eye className="w-3 h-3" />
                        <span className="font-medium">{prediction.viewCount}</span>
                    </div>
                    <div className="flex items-center text-[11px] font-semibold text-slate-400 group-hover:text-blue-500 transition-colors">
                        詳細を見る
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
