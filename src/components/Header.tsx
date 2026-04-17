import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Coins, HelpCircle } from "lucide-react";
import { checkAndUpdateLoginStreak } from "@/lib/login-streak";


export async function Header() {
    const session = await auth();

    let userPoints = 0;
    let eventPoints: number | null = null;
    if (session?.user?.id) {
        await checkAndUpdateLoginStreak(session.user.id);
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { points: true, dailyPoints: true }
        });
        userPoints = (dbUser?.points || 0) + (dbUser?.dailyPoints || 0);

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
        <header className="bg-white text-[#061b31] sticky top-0 z-50 border-b border-[#e5edf5]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
                    <Link href="/guide" className="text-[#64748d] hover:text-[#533afd] transition-colors">
                        <HelpCircle className="w-4 h-4" />
                    </Link>
                    {session?.user ? (
                        <>
                            <Link href="/points">
                                <div className="flex items-center gap-1.5 bg-[#f6f8fa] border border-[#e5edf5] px-3 py-1.5 rounded-lg hover:border-[#b9b9f9] transition-colors cursor-pointer">
                                    <Coins className="w-3.5 h-3.5 text-[#533afd]" />
                                    <span className="font-bold text-sm text-[#533afd]">{userPoints.toLocaleString()}</span>
                                    <span className="text-[10px] text-[#64748d] font-medium">pt</span>
                                </div>
                            </Link>

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
        </header>
    );
}
