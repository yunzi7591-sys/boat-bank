import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function EventsPage() {
    const session = await auth();

    const activeEvent = await prisma.event.findFirst({
        where: { isActive: true },
        include: {
            participants: {
                orderBy: { points: "desc" },
                take: 10,
                include: {
                    user: { select: { id: true, name: true, image: true } },
                },
            },
            _count: { select: { participants: true } },
        },
    });

    let myPoints: number | null = null;
    let myRank: number | null = null;

    if (activeEvent && session?.user?.id) {
        const participant = await prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId: activeEvent.id,
                    userId: session.user.id,
                },
            },
        });
        myPoints = participant?.points ?? null;

        if (participant) {
            const higherCount = await prisma.eventParticipant.count({
                where: {
                    eventId: activeEvent.id,
                    points: { gt: participant.points },
                },
            });
            myRank = higherCount + 1;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white p-4 pb-10 rounded-b-3xl shadow-lg">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-amber-700 shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="text-lg font-black flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-200" />
                            限定ptイベント
                        </h1>
                        <div className="w-10" />
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10 space-y-4">
                {!activeEvent ? (
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 text-center">
                        <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500">現在開催中のイベントはありません</p>
                        <p className="text-xs text-slate-400 mt-1">次のイベント開催をお楽しみに!</p>
                    </div>
                ) : (
                    <>
                        {/* Event Info Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-amber-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">開催中</span>
                                <h2 className="text-lg font-black text-slate-900">{activeEvent.name}</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-slate-50 rounded-lg p-2">
                                    <MapPin className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                    <p className="text-xs font-bold text-slate-800">{activeEvent.placeName}</p>
                                    <p className="text-[10px] text-slate-400">対象場</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2">
                                    <Calendar className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                    <p className="text-xs font-bold text-slate-800">
                                        {new Date(activeEvent.startDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}〜{new Date(activeEvent.endDate).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                                    </p>
                                    <p className="text-[10px] text-slate-400">開催期間</p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2">
                                    <Users className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                    <p className="text-xs font-bold text-slate-800">{activeEvent._count.participants}人</p>
                                    <p className="text-[10px] text-slate-400">参加者</p>
                                </div>
                            </div>
                        </div>

                        {/* My Points Card */}
                        {session?.user && myPoints !== null && (
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 shadow-lg border border-amber-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold text-amber-600 mb-1">あなたの限定pt</p>
                                        <p className="text-3xl font-black text-amber-800">{myPoints.toLocaleString()}<span className="text-sm ml-1">pt</span></p>
                                    </div>
                                    {myRank !== null && (
                                        <div className="text-center bg-white rounded-xl px-4 py-2 border border-amber-200">
                                            <p className="text-[10px] font-bold text-amber-500">現在の順位</p>
                                            <p className="text-2xl font-black text-amber-700">{myRank}<span className="text-xs ml-0.5">位</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Ranking */}
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
                            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                ランキング TOP10
                            </h3>
                            <div className="space-y-1">
                                {activeEvent.participants.map((p, idx) => {
                                    const isMe = session?.user?.id === p.userId;
                                    const rankColors = idx === 0
                                        ? "bg-yellow-50 border-yellow-200"
                                        : idx === 1
                                            ? "bg-slate-50 border-slate-200"
                                            : idx === 2
                                                ? "bg-orange-50 border-orange-200"
                                                : "bg-white border-slate-100";
                                    const rankIcon = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;

                                    return (
                                        <div
                                            key={p.id}
                                            className={`flex items-center justify-between p-2.5 rounded-lg border ${rankColors} ${isMe ? "ring-2 ring-amber-400" : ""}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-7 text-center font-black ${idx < 3 ? "text-base" : "text-xs text-slate-400"}`}>
                                                    {rankIcon}
                                                </span>
                                                <div>
                                                    <span className={`text-sm font-bold ${isMe ? "text-amber-700" : "text-slate-800"}`}>
                                                        {p.user.name || "名無し"}
                                                    </span>
                                                    {isMe && <span className="text-[9px] ml-1 text-amber-500 font-bold">YOU</span>}
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-slate-700">
                                                {p.points.toLocaleString()}<span className="text-[10px] text-slate-400 ml-0.5">pt</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Not logged in prompt */}
                        {!session?.user && (
                            <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 text-center">
                                <p className="text-sm font-bold text-slate-600 mb-2">ログインしてイベントに参加しよう</p>
                                <Link href="/login">
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                                        ログイン
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
