import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventBetHistory } from "@/components/events/EventBetHistory";

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
    let myBets: any[] = [];

    if (activeEvent && session?.user?.id) {
        let participant = await prisma.eventParticipant.findUnique({
            where: {
                eventId_userId: {
                    eventId: activeEvent.id,
                    userId: session.user.id,
                },
            },
        });
        // 途中参加: 未参加なら自動登録
        if (!participant) {
            participant = await prisma.eventParticipant.create({
                data: { eventId: activeEvent.id, userId: session.user.id, points: activeEvent.initialPt },
            });
        }
        myPoints = participant.points;

        {
            const higherCount = await prisma.eventParticipant.count({
                where: {
                    eventId: activeEvent.id,
                    points: { gt: participant.points },
                },
            });
            myRank = higherCount + 1;

            myBets = await prisma.eventBet.findMany({
                where: { eventId: activeEvent.id, userId: session.user.id },
                orderBy: [{ raceDate: 'desc' }, { raceNumber: 'desc' }],
            });
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

                        {/* Bet History & Graph */}
                        {session?.user && myBets.length >= 0 && (
                            <EventBetHistory
                                bets={myBets.map(b => ({
                                    id: b.id,
                                    placeName: b.placeName,
                                    raceNumber: b.raceNumber,
                                    raceDate: b.raceDate.toISOString(),
                                    betType: b.betType,
                                    combination: b.combination,
                                    betAmount: b.betAmount,
                                    hitAmount: b.hitAmount,
                                    refundAmount: b.refundAmount,
                                    isSettled: b.isSettled,
                                    isHit: b.isHit,
                                }))}
                                initialPt={activeEvent.initialPt}
                            />
                        )}

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
