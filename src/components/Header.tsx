import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

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
        <header className="bg-blue-900 text-white shadow-md sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo / Home Link */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-yellow-400 text-blue-900 font-black italic px-2 py-1 rounded shadow-sm group-hover:bg-yellow-300 transition-colors">
                        BOAT
                    </div>
                    <span className="font-extrabold text-xl tracking-wider">BANK</span>
                </Link>

                {/* Auth / Nav Actions */}
                <div className="flex items-center gap-4">
                    {session?.user ? (
                        <>
                            <div className="hidden md:flex flex-col items-end mr-2">
                                <span className="text-xs text-blue-200">所持ポイント</span>
                                <span className="font-bold text-yellow-400">{userPoints.toLocaleString()} pt</span>
                            </div>

                            <HeaderNotifications notifications={notifications} />

                            <Link href="/mypage">
                                <Button variant="ghost" className="text-white hover:bg-blue-800 hover:text-white font-bold">
                                    マイページ
                                </Button>
                            </Link>
                            <form
                                action={async () => {
                                    "use server";
                                    await signOut();
                                }}
                            >
                                <Button type="submit" variant="outline" className="bg-transparent border-blue-400 text-blue-100 hover:bg-blue-800 hover:text-white text-xs h-8">
                                    ログアウト
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="outline" className="bg-transparent border-blue-400 text-blue-100 hover:bg-blue-800 hover:text-white font-bold h-9">
                                    ログイン
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold h-9">
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
