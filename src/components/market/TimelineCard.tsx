import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Unlock } from "lucide-react";
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

    const isAuthor = currentUserId === prediction.authorId;
    const isFree = prediction.price === 0;
    // If we had transaction data passed down we could also mark it as purchased here,
    // but for the timeline, we just show if it's generally free or not, and let the detail page handle unlock state.

    const now = new Date();
    const isClosed = new Date(prediction.deadlineAt) < now;

    return (
        <Link href={`/predictions/${prediction.id}`} className="block group">
            <Card className="border-none shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-[20px] overflow-hidden mb-4 bg-white relative">
                <CardContent className="p-0">

                    {/* Header row: Author & Follow */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 shadow-inner text-sm border border-slate-200">
                                {prediction.author?.name?.charAt(0) || "U"}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[13px] text-slate-800 tracking-tight">{prediction.author?.name || "Anonymous"}</span>
                                <span className="text-[10px] text-slate-400 font-medium">予想家</span>
                            </div>
                        </div>

                        {currentUserId && !isAuthor && (
                            <FollowButton targetUserId={prediction.authorId} initialIsFollowing={isFollowingAuthor} />
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="px-5 pb-4">
                        <h3 className="font-black text-lg text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                            {prediction.title}
                        </h3>

                        {/* Race Info Meta */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                                {prediction.placeName} {prediction.raceNumber}R
                            </span>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                                締切 {new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isClosed && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">締切済</Badge>}
                        </div>

                        {/* Financial style Price / Action area */}
                        <div className={`p-4 rounded-2xl flex items-center justify-between border ${isFree ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">UNLOCK PRICE</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-2xl font-black tracking-tight ${isFree ? 'text-green-600' : 'text-slate-800'}`}>
                                        {isFree ? "FREE" : prediction.price.toLocaleString()}
                                    </span>
                                    {!isFree && <span className="text-xs font-bold text-slate-500">pt</span>}
                                </div>
                            </div>

                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200">
                                {isFree ? <Unlock className="w-4 h-4 text-green-500" /> : <Lock className="w-4 h-4 text-slate-400" />}
                            </div>
                        </div>
                    </div>

                    {/* Footer Meta Row */}
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(prediction.createdAt).toLocaleString('ja-JP')}
                        </span>

                        {prediction.viewCount > 0 && (
                            <div className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                <Eye className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{prediction.viewCount}人が注目</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
