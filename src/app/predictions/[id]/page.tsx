import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { isSubscriber } from "@/lib/subscription";
import { SubscriberUnlockButton } from "@/components/predictions/SubscriberUnlockButton";
import { Formation, normalizeCombo } from "@/lib/bet-logic";
import { BackButton } from "@/components/BackButton";
import { parseJsonSafely } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, ExternalLink } from "lucide-react";
import { ShareButton } from "@/components/predictions/ShareButton";
import Link from "next/link";
import type { Metadata } from "next";
import { isBusinessToday } from "@/lib/business-day";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ref?: string | string[] }> }): Promise<Metadata> {
    const { id } = await params;
    const sp = await searchParams;
    const refRaw = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
    const ref = refRaw && /^[a-z0-9]{1,16}$/i.test(refRaw) ? refRaw : undefined;

    const prediction = await prisma.prediction.findUnique({
        where: { id },
        select: { title: true, placeName: true, raceNumber: true, createdAt: true, author: { select: { name: true } } },
    });

    if (!prediction) return { title: 'BOAT BANK' };

    const raceLabel = `${prediction.placeName} ${prediction.raceNumber}R 予想`;
    const rawTitle = (prediction.title || '').trim();
    const hasReadableText = /[一-龠ぁ-んァ-ンa-zA-Z0-9]/.test(rawTitle);
    const baseTitle = hasReadableText && rawTitle.length >= 2 ? rawTitle : raceLabel;
    const title = baseTitle === raceLabel ? raceLabel : `${baseTitle} | ${raceLabel}`;
    const description = `${prediction.author?.name}さんの ${raceLabel}。BOAT BANK で公開中のガチ予想です。`;
    const ogImage = `https://boatbank.jp/api/og/prediction/${id}/${prediction.createdAt.getTime()}`;
    const canonicalUrl = ref
        ? `https://boatbank.jp/predictions/${id}?ref=${ref}`
        : `https://boatbank.jp/predictions/${id}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            images: [{
                url: ogImage,
                width: 1200,
                height: 630,
                type: 'image/png',
                alt: raceLabel,
            }],
            type: 'article',
            siteName: 'BOAT BANK',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [{
                url: ogImage,
                width: 1200,
                height: 630,
                alt: raceLabel,
            }],
        },
    };
}

export default async function PredictionPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    const userId = session?.user?.id;

    const prediction = await prisma.prediction.findUnique({
        where: { id: params.id },
        include: {
            author: {
                select: { name: true, image: true },
            },
        },
    });

    if (!prediction) {
        notFound();
    }

    if (prediction.isPrivate && prediction.authorId !== userId) {
        notFound();
    }

    // Increment viewCount only for logged-in users other than the author (prevents bot inflation & self-view spam)
    // レスポンスをブロックしないよう after() で応答後に実行する
    if (userId && prediction.authorId !== userId) {
        const pid = params.id;
        after(async () => {
            await prisma.prediction.update({
                where: { id: pid },
                data: { viewCount: { increment: 1 } },
            });
        });
    }

    // Safe parse
    // 投稿者本人かどうか（本人なら買い目非公開でも自分の買い目は見られる）
    const isAuthor = !!userId && prediction.authorId === userId;

    // 閲覧ルール: 締切前は誰でも無料。
    // 締切後は本人・アンロック済みの人のみ。当日レースに限り、サブスク会員が明示的にアンロックできる
    // （アンロック時に公開者へ通知が飛ぶため、自動開放ではなくボタン操作を挟む）
    const isClosed = new Date(prediction.deadlineAt) < new Date();
    let canView = !isClosed || isAuthor;
    if (!canView && userId) {
        const transaction = await prisma.transaction.findFirst({
            where: {
                userId,
                predictionId: params.id,
                action: { in: ["BUY_PREDICTION", "SUBSCRIBER_UNLOCK"] },
            },
            select: { id: true },
        });
        if (transaction) canView = true;
    }

    // 当日レースなら: 会員→アンロックボタン / 非会員→サブスク誘導
    let canSubscriberUnlock = false;
    let promptSubscribeForClosed = false;
    if (!canView) {
        const isRaceToday = isBusinessToday(new Date(prediction.raceDate));
        if (isRaceToday && userId && (await isSubscriber(userId))) {
            canSubscriberUnlock = true;
        } else if (isRaceToday) {
            promptSubscribeForClosed = true;
        }
    }

    let formations: Formation[] = [];
    try {
        formations = parseJsonSafely<Formation[]>(prediction.predictedNumbers);
    } catch (e) {
        formations = [];
    }

    // レース結果を取得して買い目ごとの的中判定に使う
    let payoutsMap = new Map<string, { type: string; numbers: string; amount: number }[]>();
    let refundedBoats: number[] = [];
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
        refundedBoats = raceResult?.refunds as number[] || [];
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Top Details Header */}
            <div className="bg-white px-5 pt-8 pb-6 border-b border-slate-200">
                <BackButton
                    label="戻る"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4"
                />
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
                    <ShareButton
                        title={prediction.title || `${prediction.placeName}の予想`}
                        urlPath={`/predictions/${prediction.id}`}
                        placeName={prediction.placeName}
                        raceNumber={prediction.raceNumber}
                    />
                </div>

                <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">{prediction.title || `渾身の勝負レース`}</h1>

                <div className="flex items-center gap-3">
                    <Link href={`/users/${prediction.authorId}`} className="flex flex-col -m-1 p-1 rounded-lg active:bg-slate-100 transition-colors">
                        <span className="font-extrabold text-[13px] text-slate-800 hover:underline">{prediction.author?.name || "Anonymous"}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{new Date(prediction.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
                    </Link>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="p-5">

                {/* Commentary Section */}
                {canView && prediction.commentary?.trim() && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> 見解・分析
                        </h3>
                        <div className="prose prose-slate prose-sm max-w-none">
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 font-medium">
                                {prediction.commentary}
                            </p>
                        </div>
                    </div>
                )}

                {/* Predictions Area - Financial Breakdown */}
                <div className="relative">
                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
                        <span className="w-1 h-3 bg-indigo-500 rounded-full"></span> 買い目一覧
                    </h3>

                    {!canView ? (
                        <div className="w-full bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.02)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>
                            <div className="z-10 flex flex-col items-center w-full text-center">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100 rotate-12">
                                    <Lock className="w-5 h-5 -rotate-12" />
                                </div>
                                <h4 className="font-black text-slate-800 text-lg mb-1">
                                    {canSubscriberUnlock
                                        ? "会員特典でアンロック"
                                        : promptSubscribeForClosed
                                            ? "サブスク会員限定"
                                            : "閲覧期間が終了しました"}
                                </h4>
                                <p className="text-xs font-semibold text-slate-500 mb-6 max-w-[240px]">
                                    {canSubscriberUnlock
                                        ? "締切済みの当日レースです。会員特典でアンロックして閲覧できます。"
                                        : promptSubscribeForClosed
                                            ? "このレースは締切時刻を過ぎました。当日のレースの予想はサブスク会員のみ閲覧できます。"
                                            : "締切時刻を過ぎたため閲覧できません。当日のレースはサブスク会員のみ閲覧できます。"}
                                </p>
                                {canSubscriberUnlock ? (
                                    <SubscriberUnlockButton predictionId={prediction.id} />
                                ) : promptSubscribeForClosed ? (
                                    !userId ? (
                                        <a href="/login" className="inline-flex items-center justify-center bg-[#533afd] hover:bg-[#4434d4] text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors">
                                            ログイン / 新規登録
                                        </a>
                                    ) : (
                                        <Link href="/subscribe" className="inline-flex items-center justify-center bg-[#533afd] hover:bg-[#4434d4] text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors shadow-md">
                                            サブスク会員になって閲覧する
                                        </Link>
                                    )
                                ) : null}
                            </div>
                        </div>
                    ) : prediction.betsPublic === false && !isAuthor ? (
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
                            {prediction.betsPublic === false && isAuthor && (
                                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl">
                                    <Lock className="w-3.5 h-3.5" />
                                    買い目は非公開です。この買い目はあなた（投稿者本人）だけに表示されています。
                                </div>
                            )}
                            {formations.map((f, i) => (
                                <Card key={`form-${i}`} className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                                        <span className="font-black text-xs text-slate-700">{f.betType}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{f.combinations.length} 点</span>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {f.combinations.map((c, j) => {
                                                // 的中・返還判定
                                                let combHit = false;
                                                let combRefund = false;
                                                let combPayout = 0;
                                                if (prediction.isSettled) {
                                                    // 返還チェック
                                                    const betNumbers = c.id.split(/[-=]/).map(n => parseInt(n, 10));
                                                    combRefund = betNumbers.some(n => refundedBoats.includes(n));

                                                    if (!combRefund) {
                                                        // 的中チェック（返還対象でない場合のみ）
                                                        const officialPayouts = payoutsMap.get(f.betType) || [];
                                                        for (const op of officialPayouts) {
                                                            if (normalizeCombo(c.id, f.betType) === normalizeCombo(op.numbers, f.betType)) {
                                                                combHit = true;
                                                                combPayout = Math.floor((op.amount / 100) * c.amount);
                                                            }
                                                        }
                                                    }
                                                }

                                                return (
                                                    <div key={`comb-${j}`} className={`flex justify-between items-center px-4 py-3 transition-colors ${combHit ? 'bg-[#533afd]/5' : combRefund ? 'bg-[#ca8a04]/5' : 'hover:bg-slate-50/50'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-mono font-bold text-lg tracking-widest ${combHit ? 'text-[#533afd]' : combRefund ? 'text-[#ca8a04]' : 'text-slate-900'}`}>{c.id}</span>
                                                            {prediction.isSettled && (
                                                                combHit ? (
                                                                    <span className="text-[10px] font-bold text-white bg-[#533afd] px-1.5 py-0.5 rounded">的中</span>
                                                                ) : combRefund ? (
                                                                    <span className="text-[10px] font-bold text-[#ca8a04] bg-[#ca8a04]/10 px-1.5 py-0.5 rounded">返還</span>
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
                                                            {combRefund && (
                                                                <span className="text-sm font-black text-[#ca8a04]">→ {c.amount.toLocaleString()} <span className="text-[10px]">円 (返還)</span></span>
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
                            {prediction.isSettled && (() => {
                                const totalReturn = prediction.hitAmount + prediction.refundAmount;
                                const pnl = totalReturn - prediction.betAmount;
                                return (
                                <div className="bg-white rounded-lg border border-[#e5edf5] p-4" style={{ boxShadow: 'rgba(50,50,93,0.08) 0px 4px 12px' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-[#64748d]">精算結果</span>
                                        <span className={`text-lg font-black ${pnl >= 0 ? 'text-[#533afd]' : 'text-[#ea2261]'}`}>
                                            {pnl >= 0 ? '+' : ''}{pnl.toLocaleString()}円
                                        </span>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[11px] text-[#64748d]">
                                        <span>投資: {prediction.betAmount.toLocaleString()}円</span>
                                        <span>回収: {totalReturn.toLocaleString()}円{prediction.refundAmount > 0 ? ` (返還${prediction.refundAmount.toLocaleString()}円含)` : ''}</span>
                                    </div>
                                </div>
                                );
                            })()}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
