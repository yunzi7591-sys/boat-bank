import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UnlockButton } from "@/components/predictions/UnlockButton";
import { Formation } from "@/lib/bet-logic";
import { parseJsonSafely } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Lock, ExternalLink } from "lucide-react";
import { ShareButton } from "@/components/predictions/ShareButton";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const prediction = await prisma.prediction.findUnique({
        where: { id },
        select: { title: true, placeName: true, raceNumber: true, author: { select: { name: true } } },
    });

    if (!prediction) return { title: 'BOAT BANK' };

    const title = prediction.title || `${prediction.placeName} ${prediction.raceNumber}R 予想`;
    const description = `${prediction.author?.name}の予想 - ${prediction.placeName} ${prediction.raceNumber}R | BOAT BANK`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [`/api/og/prediction?id=${id}`],
            type: 'article',
            siteName: 'BOAT BANK',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`/api/og/prediction?id=${id}`],
        },
    };
}

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
        if (prediction.authorId === userId) {
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
        formations = parseJsonSafely<Formation[]>(prediction.predictedNumbers);
    } catch (e) {
        formations = [];
    }

    // レース結果を取得して買い目ごとの的中判定に使う
    let payoutsMap = new Map<string, { type: string; numbers: string; amount: number }[]>();
    if (prediction.isSettled) {
        const raceResult = await prisma.raceResult.findUnique({
            where: { placeName_raceNumber_raceDate: { placeName: prediction.placeName, raceNumber: prediction.raceNumber, raceDate: prediction.raceDate } },
        });
        if (raceResult?.payouts) {
            const payouts = (typeof raceResult.payouts === 'string' ? JSON.parse(raceResult.payouts) : raceResult.payouts) as { type: string; numbers: string; amount: number }[];
            for (const p of payouts) {
                const arr = payoutsMap.get(p.type) || [];
                arr.push(p);
                payoutsMap.set(p.type, arr);
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Top Details Header */}
            <div className="bg-white px-5 pt-8 pb-6 border-b border-slate-200">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-black tracking-widest text-slate-400 uppercase">予想詳細</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                                {prediction.placeName} {prediction.raceNumber}R
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                                締切 {new Date(prediction.deadlineAt).toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <ShareButton title={prediction.title || `${prediction.placeName}の予想`} urlPath={`/predictions/${prediction.id}`} />
                </div>

                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">{prediction.title || `渾身の勝負レース`}</h1>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="font-extrabold text-[13px] text-slate-800">{prediction.author?.name || "Anonymous"}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(prediction.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="p-5">

                {/* Commentary Section */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> 見解・分析
                    </h3>

                    <div className={`prose prose-slate prose-sm max-w-none ${!isUnlocked && "blur-[4px] opacity-40 select-none pb-12"}`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                            {isUnlocked ? prediction.commentary : "この予想の見解を閲覧するにはアンロックが必要です。"}
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
                        <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> 買い目一覧
                    </h3>

                    {isUnlocked ? (
                        prediction.betsPublic === false ? (
                            <div className="w-full bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-slate-200 shadow-sm">
                                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mb-4">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <p className="font-bold text-slate-700 text-sm mb-1">この予想の買い目は非公開です</p>
                                <p className="text-xs text-slate-400 mb-4">収支管理専用の予想のため、買い目は表示されません。</p>
                                {prediction.externalUrl && (
                                    <a
                                        href={prediction.externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        外部サイトで予想を見る
                                    </a>
                                )}
                            </div>
                        ) : (
                        <div className="flex flex-col gap-4">
                            {formations.map((f, i) => (
                                <Card key={`form-${i}`} className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                        <span className="font-black text-xs text-slate-700">{f.betType}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{f.combinations.length} 点</span>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {f.combinations.map((c, j) => {
                                                // 的中判定
                                                let combHit = false;
                                                let combPayout = 0;
                                                if (prediction.isSettled) {
                                                    const officialPayouts = payoutsMap.get(f.betType) || [];
                                                    for (const op of officialPayouts) {
                                                        if (c.id === op.numbers) {
                                                            combHit = true;
                                                            combPayout = Math.floor((op.amount / 100) * c.amount);
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div key={`comb-${j}`} className={`flex justify-between items-center px-4 py-3 transition-colors ${combHit ? 'bg-[#533afd]/5' : 'hover:bg-slate-50/50'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-mono font-bold text-lg tracking-widest ${combHit ? 'text-[#533afd]' : 'text-slate-900'}`}>{c.id}</span>
                                                            {prediction.isSettled && (
                                                                combHit ? (
                                                                    <span className="text-[10px] font-bold text-white bg-[#533afd] px-1.5 py-0.5 rounded">的中</span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">不的中</span>
                                                                )
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-black text-sm text-slate-800">{c.amount.toLocaleString()} <span className="text-[10px] text-slate-500">円</span></span>
                                                            {combHit && (
                                                                <span className="text-sm font-black text-[#533afd]">→ {combPayout.toLocaleString()} <span className="text-[10px]">円</span></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Settlement Summary */}
                            {prediction.isSettled && (
                                <div className="bg-white rounded-lg border border-[#e5edf5] p-4" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#64748d]">精算結果</span>
                                        <span className={`text-lg font-black ${prediction.hitAmount - prediction.betAmount >= 0 ? 'text-[#533afd]' : 'text-[#ea2261]'}`}>
                                            {prediction.hitAmount - prediction.betAmount >= 0 ? '+' : ''}{(prediction.hitAmount - prediction.betAmount).toLocaleString()}円
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[11px] text-[#64748d]">
                                        <span>投資: {prediction.betAmount.toLocaleString()}円</span>
                                        <span>回収: {prediction.hitAmount.toLocaleString()}円</span>
                                    </div>
                                </div>
                            )}

                        </div>
                        )
                    ) : (
                        <div className="w-full bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>

                            <div className="z-10 flex flex-col items-center w-full text-center">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100 rotate-12">
                                    <Lock className="w-5 h-5 -rotate-12" />
                                </div>

                                <h4 className="font-black text-slate-800 text-lg mb-1">
                                    {!userId ? "会員登録が必要です" : "予想をアンロック"}
                                </h4>
                                <p className="text-xs font-semibold text-slate-500 mb-6 max-w-[220px]">
                                    {!userId
                                        ? "この予想を閲覧するにはログインまたは会員登録が必要です。"
                                        : isClosed
                                            ? "このレースは締切時刻を過ぎているため、購入できません。"
                                            : prediction.price === 0
                                                ? "無料予想です。ログインすると閲覧できます。"
                                                : "買い目と金額配分を確認するにはポイントが必要です。"
                                    }
                                </p>

                                {!userId ? (
                                    <a href="/login" className="inline-flex items-center justify-center bg-[#533afd] hover:bg-[#4434d4] text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors">
                                        ログイン / 新規登録
                                    </a>
                                ) : (
                                    <UnlockButton predictionId={prediction.id} price={prediction.price} isClosed={isClosed} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
