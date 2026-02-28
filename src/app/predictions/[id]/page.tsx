import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UnlockButton } from "@/components/predictions/UnlockButton";
import { Formation } from "@/lib/bet-logic";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default async function PredictionPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    const userId = session?.user?.id;

    const prediction = await prisma.prediction.update({
        where: { id: params.id },
        data: {
            viewCount: { increment: 1 } // Increment view count on each visit
        },
        include: {
            author: {
                select: { name: true, image: true },
            },
        },
    });

    if (!prediction) {
        notFound();
    }

    let isUnlocked = false;
    const isClosed = new Date(prediction.deadlineAt) < new Date();

    if (userId) {
        if (prediction.authorId === userId || prediction.price === 0) {
            isUnlocked = true;
        } else {
            const transaction = await prisma.transaction.findFirst({
                where: {
                    userId,
                    predictionId: params.id,
                    action: "BUY_PREDICTION",
                },
            });
            if (transaction) {
                isUnlocked = true;
            }
        }
    }

    // Safe parse
    let formations: Formation[] = [];
    try {
        formations = JSON.parse(prediction.predictedNumbers);
    } catch (e) {
        formations = [];
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Top Details Header */}
            <div className="bg-white px-5 pt-8 pb-6 border-b border-slate-200">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Transaction Details</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                                {prediction.placeName} {prediction.raceNumber}R
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                締切 {new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">{prediction.title || `渾身の勝負レース`}</h1>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 shadow-inner text-xs border border-slate-200">
                        {prediction.author?.name?.charAt(0) || "U"}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-[13px] text-slate-800">{prediction.author?.name || "Anonymous"}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(prediction.createdAt).toLocaleDateString('ja-JP')}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="p-5">

                {/* Commentary Section */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> Insight & Analysis
                    </h3>

                    <div className={`prose prose-slate prose-sm max-w-none ${!isUnlocked && "blur-[4px] opacity-40 select-none pb-12"}`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                            {prediction.commentary}
                        </p>
                    </div>

                    {!isUnlocked && (
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-end pb-8">
                            <div className="bg-slate-900/5 backdrop-blur-xl p-4 rounded-full mb-3 border border-white/20 shadow-lg">
                                <Lock className="w-6 h-6 text-slate-700" />
                            </div>
                            <p className="font-bold text-slate-800 text-sm">機密情報につきロックされています</p>
                        </div>
                    )}
                </div>

                {/* Predictions Area - Financial Breakdown */}
                <div className="relative">
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> Position Details
                    </h3>

                    {isUnlocked ? (
                        <div className="flex flex-col gap-4">
                            {formations.map((f, i) => (
                                <Card key={`form-${i}`} className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                        <span className="font-black text-xs text-slate-700">{f.betType}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{f.combinations.length} POs</span>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {f.combinations.map((c, j) => (
                                                <div key={`comb-${j}`} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50/50 transition-colors">
                                                    <span className="font-mono font-bold text-lg text-slate-900 tracking-widest">{c.id}</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-bold text-slate-400 tracking-widest mb-0.5">ALLOCATED</span>
                                                        <span className="font-black text-sm text-slate-800">{c.amount.toLocaleString()} <span className="text-[10px] text-slate-500">pt</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>

                            <div className="z-10 flex flex-col items-center w-full text-center">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100 rotate-12">
                                    <Lock className="w-5 h-5 -rotate-12" />
                                </div>

                                <h4 className="font-black text-slate-800 text-lg mb-1">資産情報をアンロック</h4>
                                <p className="text-xs font-semibold text-slate-500 mb-6 max-w-[200px]">
                                    {isClosed
                                        ? "このレースは締切時刻を過ぎているため、購入できません。"
                                        : "このポジションの買い目と金額配分を確認するにはポイントが必要です。"
                                    }
                                </p>

                                <UnlockButton predictionId={prediction.id} price={prediction.price} isClosed={isClosed} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
