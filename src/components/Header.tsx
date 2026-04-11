import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

import { HeaderNotifications } from "./HeaderNotifications";

export async function Header() {
    const session = await auth();

    let userPoints = 0;
    if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { points: true, dailyPoints: true }
        });
        userPoints = (dbUser?.points || 0) + (dbUser?.dailyPoints || 0);
    }

    const notifications = session?.user?.id ? await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    }) : [];

    return (
        <header className="bg-white text-[#061b31] sticky top-0 z-50 border-b border-[#e5edf5]">
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
                    {session?.user ? (
                        <>
                            <Link href="/points">
                                <div className="flex items-center gap-1.5 bg-[#f6f8fa] border border-[#e5edf5] px-3 py-1.5 rounded-lg hover:border-[#b9b9f9] transition-colors cursor-pointer">
                                    <Coins className="w-3.5 h-3.5 text-[#533afd]" />
                                    <span className="font-bold text-sm text-[#533afd]">{userPoints.toLocaleString()}</span>
                                    <span className="text-[10px] text-[#64748d] font-medium">pt</span>
                                </div>
                            </Link>

                            <HeaderNotifications notifications={notifications} />

                            <Link href="/mypage">
                                <Button variant="ghost" className="text-[#64748d] hover:bg-[#f6f8fa] hover:text-[#533afd] font-semibold text-sm h-9 px-3">
                                    マイページ
                                </Button>
                            </Link>
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
