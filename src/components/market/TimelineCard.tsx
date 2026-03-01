import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Unlock, CopyPlus, Clock } from "lucide-react";
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

    const now = new Date();
    const isClosed = new Date(prediction.deadlineAt) < now;

    return (
        <Link href={`/predictions/${prediction.id}`} className="block group">
            <Card className="border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-blue-200 transition-all duration-300 rounded-[1.5rem] overflow-hidden mb-5 bg-white relative">
                <CardContent className="p-0">

                    {/* Header row: Author & Follow */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-full flex items-center justify-center font-bold text-indigo-700 shadow-sm text-sm border border-indigo-200">
                                {prediction.author?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[14px] text-slate-900 tracking-tight">{prediction.author?.name || "Anonymous"}</span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true, locale: ja })}
                                </span>
                            </div>
                        </div>

                        {currentUserId && !isAuthor && (
                            <FollowButton targetUserId={prediction.authorId} initialIsFollowing={isFollowingAuthor} />
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="p-5 pb-4 bg-gradient-to-b from-white to-slate-50/30">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-black text-[17px] text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                {prediction.title || `${prediction.placeName}勝負レース`}
                            </h3>
                            <span className="shrink-0 text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-md shadow-sm ml-3">
                                {prediction.placeName} {prediction.raceNumber}R
                            </span>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 mb-0.5">ベット額</span>
                                <span className="text-sm font-black text-blue-600 drop-shadow-sm">{(prediction.betAmount || 0).toLocaleString()}pt</span>
                            </div>
                            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 mb-0.5">締切</span>
                                <span className="text-sm font-black text-slate-700">
                                    {new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        {/* Financial style Price / Action area */}
                        <div className={`p-4 rounded-2xl flex items-center justify-between border shadow-inner ${isFree ? 'bg-green-50/80 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 tracking-wider mb-0.5 uppercase">Unlock Price</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-black tracking-tight drop-shadow-sm ${isFree ? 'text-green-600' : 'text-slate-900'}`}>
                                        {isFree ? "FREE" : prediction.price.toLocaleString()}
                                    </span>
                                    {!isFree && <span className="text-[11px] font-bold text-slate-500">pt</span>}
                                </div>
                            </div>

                            <div className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center border transition-transform group-hover:scale-110 duration-300 ${isFree ? 'bg-green-500 border-green-400' : 'bg-slate-800 border-slate-700'}`}>
                                {isFree ? <Unlock className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-slate-300" />}
                            </div>
                        </div>
                    </div>

                    {/* Footer Meta Row */}
                    <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-slate-200/60 shadow-sm text-slate-500">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">{prediction.viewCount} Views</span>
                        </div>

                        <div className="flex items-center text-[11px] font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                            詳細を見る
                            <CopyPlus className="w-3.5 h-3.5 ml-1" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
