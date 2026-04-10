import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, ClipboardList, Gift } from "lucide-react";

export default async function EarnPointsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const placeholders = [
        { title: "広告視聴", description: "動画広告を視聴してポイントを獲得", icon: Play },
        { title: "アンケート回答", description: "簡単なアンケートに回答してポイントを獲得", icon: ClipboardList },
        { title: "キャンペーン", description: "期間限定キャンペーンに参加してポイントを獲得", icon: Gift },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">

            {/* Top Nav */}
            <div className="max-w-4xl mx-auto px-4 pt-6 mb-6">
                <Link href="/points" className="inline-flex items-center gap-1 text-sm text-[#64748d] hover:text-[#533afd] transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    戻る
                </Link>
            </div>

            {/* Title */}
            <div className="max-w-4xl mx-auto px-4 mb-6">
                <h1 className="text-xl font-bold text-[#061b31]">ポイントを獲得</h1>
                <p className="text-sm text-[#64748d] mt-1">準備中です</p>
            </div>

            {/* Placeholder Cards */}
            <div className="max-w-4xl mx-auto px-4 flex flex-col gap-3">
                {placeholders.map((item) => (
                    <div
                        key={item.title}
                        className="bg-white border border-[#e5edf5] rounded-lg p-5 flex items-center gap-4 opacity-60"
                        style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}
                    >
                        <div className="w-10 h-10 rounded-lg bg-[#f6f8fa] border border-[#e5edf5] flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-5 h-5 text-[#533afd]" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#061b31]">{item.title}</p>
                            <p className="text-xs text-[#64748d] mt-0.5">{item.description}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#64748d] bg-[#f6f8fa] border border-[#e5edf5] px-2 py-1 rounded">
                            COMING SOON
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
