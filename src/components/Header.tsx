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
            select: { points: true }
        });
        userPoints = dbUser?.points || 0;
    }

    const notifications = session?.user?.id ? await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    }) : [];

    return (
        <header className="bg-slate-950 text-white sticky top-0 z-50 border-b border-white/[0.06]">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

                {/* Logo / Home Link */}
                <Link href="/" className="flex items-center gap-1.5 group">
                    <span className="bg-emerald-400 text-slate-950 font-black text-[13px] px-2 py-0.5 rounded-md tracking-tight group-hover:bg-emerald-300 transition-colors">
                        BOAT
                    </span>
                    <span className="font-extrabold text-lg tracking-wide">BANK</span>
                </Link>

                {/* Auth / Nav Actions */}
                <div className="flex items-center gap-3">
                    {session?.user ? (
                        <>
                            <div className="hidden md:flex items-center gap-1.5 bg-white/[0.08] px-3 py-1.5 rounded-lg">
                                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-bold text-sm text-emerald-400">{userPoints.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 font-medium">pt</span>
                            </div>

                            <HeaderNotifications notifications={notifications} />

                            <Link href="/mypage">
                                <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white font-semibold text-sm h-9 px-3">
                                    マイページ
                                </Button>
                            </Link>
                            <form
                                action={async () => {
                                    "use server";
                                    await signOut();
                                }}
                            >
                                <Button type="submit" variant="ghost" className="text-slate-500 hover:bg-white/10 hover:text-slate-300 text-xs h-8 px-2.5">
                                    ログアウト
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white font-semibold text-sm h-9 px-3">
                                    ログイン
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm h-9 px-4 rounded-lg">
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
