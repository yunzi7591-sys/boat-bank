import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function WalletPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true }
    });

    const transactions = await prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            prediction: {
                select: {
                    placeName: true,
                    raceNumber: true,
                    title: true
                }
            }
        },
        take: 100 // Limit to recent 100 for MVP
    });

    const getActionLabel = (action: string, prediction: any) => {
        switch (action) {
            case 'BUY_PREDICTION':
                return `【購入】${prediction?.placeName || ''} ${prediction?.raceNumber || ''}R 予想`;
            case 'SELL_PREDICTION':
                return `【売上】${prediction?.placeName || ''} ${prediction?.raceNumber || ''}R 予想`;
            case 'LOGIN_BONUS':
                return 'ログインボーナス';
            case 'WELCOME_BONUS':
                return '初回登録ボーナス';
            default:
                return action;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 font-sans pb-24">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center shadow-md sticky top-0 z-20">
                <Link href="/mypage">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1 text-center font-black text-lg tracking-wider flex items-center justify-center gap-1">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    PASSBOOK
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Total Balance Card */}
            <div className="bg-slate-900 text-white pb-8 pt-4 px-6 rounded-b-3xl shadow-lg mb-6">
                <p className="text-slate-400 text-xs font-bold tracking-widest mb-1 text-center">現在の残高</p>
                <div className="flex items-baseline justify-center gap-2">
                    <h1 className="text-5xl font-extrabold tracking-tight">{user?.points?.toLocaleString()}</h1>
                    <span className="text-slate-400 font-medium tracking-wide">pt</span>
                </div>
            </div>

            {/* Transaction List */}
            <div className="px-4 max-w-lg mx-auto">
                <h2 className="text-[13px] font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4 text-slate-500" /> 取引明細
                </h2>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-bold text-sm">
                            まだ取引履歴がありません。
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {transactions.map((tx) => {
                                const isPositive = tx.points > 0;
                                return (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="pr-4">
                                            <div className="text-[10px] font-bold text-slate-400 mb-1">
                                                {tx.createdAt.toLocaleString('ja-JP', {
                                                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="text-xs font-bold text-slate-700 leading-tight">
                                                {getActionLabel(tx.action, tx.prediction)}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <div className={`flex items-center justify-end gap-1 font-black text-lg ${isPositive ? 'text-green-600' : 'text-slate-800'
                                                }`}>
                                                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                                                {isPositive ? '+' : ''}{tx.points.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
