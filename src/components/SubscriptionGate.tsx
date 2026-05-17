import { auth } from "@/auth";
import { isSubscriber, isSubscriptionGateEnabled } from "@/lib/subscription";
import Link from "next/link";
import { Lock } from "lucide-react";

type Props = {
    children: React.ReactNode;
    preview?: React.ReactNode;
};

export async function SubscriptionGate({ children, preview }: Props) {
    if (!isSubscriptionGateEnabled()) {
        return <>{children}</>;
    }

    const session = await auth();
    const userId = session?.user?.id;
    const subscribed = await isSubscriber(userId);

    if (subscribed) return <>{children}</>;

    return (
        <div className="relative">
            {preview ? (
                <div className="blur-sm opacity-40 pointer-events-none select-none" aria-hidden="true">{preview}</div>
            ) : (
                <div className="min-h-[240px] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl" aria-hidden="true" />
            )}
            <div
                role="region"
                aria-label="会員限定コンテンツ"
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm p-5 rounded-xl"
            >
                <div className="bg-slate-900/5 p-4 rounded-full mb-3 border border-white/20 shadow-lg">
                    <Lock className="w-6 h-6 text-slate-700" />
                </div>
                <p className="font-bold text-slate-900 text-sm mb-1">会員限定コンテンツ</p>
                <p className="text-xs text-slate-600 mb-4 text-center max-w-xs">
                    月500円（初月無料）で詳細分析がすべて見られます
                </p>
                <Link
                    href="/subscribe"
                    className="bg-[#533afd] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#4125d1] transition-colors shadow-md"
                >
                    会員になる
                </Link>
            </div>
        </div>
    );
}
