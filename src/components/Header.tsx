import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { HeaderAutoRefresh } from "@/components/HeaderAutoRefresh";
import { HeaderShell } from "@/components/HeaderShell";


export async function Header() {
    const session = await auth();

    let eventPoints: number | null = null;
    if (session?.user?.id) {
        const activeEvent = await prisma.event.findFirst({ where: { isActive: true } });
        if (activeEvent) {
            let participant = await prisma.eventParticipant.findUnique({
                where: { eventId_userId: { eventId: activeEvent.id, userId: session.user.id } }
            });
            if (!participant) {
                participant = await prisma.eventParticipant.create({
                    data: { eventId: activeEvent.id, userId: session.user.id, points: activeEvent.initialPt },
                });
            }
            eventPoints = participant.points;
        }
    }


    return (
        <HeaderShell>
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

                {/* Logo / Home Link */}
                <Link href="/" className="flex items-center gap-1.5 group">
                    <span className="bg-[#533afd] text-white font-black text-[13px] px-2 py-0.5 rounded-md tracking-tight group-hover:bg-[#4434d4] transition-colors">
                        BOAT
                    </span>
                    <span className="font-extrabold text-lg tracking-wide text-[#061b31]">BANK</span>
                </Link>

                {/* Auth / Nav Actions */}
                <div className="flex items-center gap-3">
                    <Link href="/guide" aria-label="使い方ガイド" className="text-[#64748d] hover:text-[#533afd] transition-colors p-2 -m-2">
                        <HelpCircle className="w-4 h-4" />
                    </Link>
                    {session?.user ? (
                        <>
                            {eventPoints !== null && (
                                <Link href="/events">
                                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg hover:border-amber-300 transition-colors cursor-pointer">
                                        <span className="text-[10px] font-bold text-amber-600">限定</span>
                                        <span className="font-bold text-sm text-amber-700">{eventPoints.toLocaleString()}</span>
                                        <span className="text-[10px] text-amber-500">pt</span>
                                    </div>
                                </Link>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="text-[#64748d] hover:bg-[#f6f8fa] hover:text-[#533afd] font-semibold text-sm h-9 px-3">
                                    ログイン
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-[#533afd] hover:bg-[#4434d4] text-white font-bold text-sm h-9 px-4 rounded-lg">
                                    新規登録
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            {session?.user && <HeaderAutoRefresh />}
        </HeaderShell>
    );
}
