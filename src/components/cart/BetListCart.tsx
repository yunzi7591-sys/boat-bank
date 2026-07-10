import { useBetStore } from '@/store/bet-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Loader2, AlertTriangle, ExternalLink, Store } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ensureVisibleAboveKeyboard } from '@/lib/keyboard-scroll';
import { publishPrediction } from '@/actions/prediction';
import { submitBets } from '@/actions/bet';
import { submitEventBets } from '@/actions/event-bet';
import { useState, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VENUES } from '@/lib/constants/venues';
import { cn } from '@/lib/utils';
import { usePublishShareStore } from '@/store/publish-share-store';

interface OddsMap {
    [oddsType: string]: { data: Record<string, number>; fetchedAt: string };
}

interface BetListCartProps {
    deadlineAt?: Date | null;
    initialPublishType?: "internal" | "external";
    eventId?: string;
    eventPoints?: number;
    odds?: OddsMap;
}

function getOddsForCombination(odds: OddsMap | undefined, betType: string, combination: string): number | null {
    if (!odds) return null;
    // betType: 3TR, 3PL, 2TR, 2PL, WIN
    const oddsEntry = odds[betType];
    if (!oddsEntry?.data) return null;

    // combinationは "1-2-3" 形式
    const val = oddsEntry.data[combination];
    return val && val > 0 ? val : null;
}

export function BetListCart({ deadlineAt, initialPublishType, eventId, eventPoints, odds }: BetListCartProps = {}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const openPublishShare = usePublishShareStore((s) => s.open);
    const { cart, updateCartItemAmount, updateCartFormationAmount, removeCombination, removeFormation, clearCart } = useBetStore();
    const [isPending, startTransition] = useTransition();
    const [isBetPending, startBetTransition] = useTransition();
    const [error, setError] = useState('');
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);

    // Publish type: pre-selected from parent or null
    const [publishType, setPublishType] = useState<"internal" | "external" | null>(initialPublishType || null);
    const [externalUrl, setExternalUrl] = useState('');
    const [analysisComment, setAnalysisComment] = useState('');
    const [externalConsent, setExternalConsent] = useState(false);

    // 自動資金配分: 合計金額（100円単位の数値文字列）
    const [allocTotal, setAllocTotal] = useState('');

    // キーボードの高さ（公開ポップアップを開いている間だけ検知）。
    // resize:'none' のため画面が縮まらない → この分の余白を下に足してスクロール可能にする。
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    useEffect(() => {
        if (!publishDialogOpen) {
            setKeyboardHeight(0);
            return;
        }
        let cleanup: (() => void) | undefined;
        let cancelled = false;
        (async () => {
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Keyboard")) {
                    const { Keyboard } = await import("@capacitor/keyboard");
                    const showH = await Keyboard.addListener("keyboardWillShow", (info) => {
                        if (!cancelled) setKeyboardHeight(info.keyboardHeight || 0);
                    });
                    const hideH = await Keyboard.addListener("keyboardWillHide", () => {
                        if (!cancelled) setKeyboardHeight(0);
                    });
                    cleanup = () => { showH.remove(); hideH.remove(); };
                    return;
                }
            } catch {}
            // Web フォールバック: visualViewport で隠れた高さを推定
            const vv = typeof window !== "undefined" ? window.visualViewport : null;
            if (!vv) return;
            const onResize = () => {
                const hidden = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
                if (!cancelled) setKeyboardHeight(hidden);
            };
            vv.addEventListener("resize", onResize);
            vv.addEventListener("scroll", onResize);
            cleanup = () => { vv.removeEventListener("resize", onResize); vv.removeEventListener("scroll", onResize); };
        })();
        return () => { cancelled = true; cleanup?.(); };
    }, [publishDialogOpen]);

    // Initial values from URL params
    const qPlaceId = searchParams.get('placeId');
    const qPlaceName = VENUES.find(v => v.id === qPlaceId)?.name || '桐生';
    const qRaceNumber = searchParams.get('raceNumber') || '1';
    const isPrivate = searchParams.get('isPrivate') === 'true';
    const totalCombinations = cart.reduce((sum, f) => sum + f.combinations.length, 0);
    const totalAmount = cart.reduce((sum, f) => {
        return sum + f.combinations.reduce((sub, c) => sub + c.amount, 0);
    }, 0);

    // 合成オッズ計算: 各買い目の「的中時払戻倍率」 = (bet × odds) / totalAmount
    const compositeOdds = (() => {
        if (totalAmount === 0 || !odds) return null;
        const ratios: number[] = [];
        let hasMissing = false;
        for (const formation of cart) {
            for (const comb of formation.combinations) {
                if (comb.amount <= 0) continue;
                const o = getOddsForCombination(odds, formation.betType, comb.id);
                if (o === null) {
                    hasMissing = true;
                    continue;
                }
                ratios.push((comb.amount * o) / totalAmount);
            }
        }
        if (ratios.length === 0) return null;
        return {
            min: Math.min(...ratios),
            max: Math.max(...ratios),
            avg: ratios.reduce((a, b) => a + b, 0) / ratios.length,
            hasMissing,
        };
    })();

    // 自動資金配分: どの買い目が当たっても払戻が均等になるよう、合計金額をオッズに反比例して配分
    const handleAutoAllocate = () => {
        const units = parseInt((allocTotal || '').replace(/[^0-9]/g, '')) || 0;
        const budgetYen = units * 100;
        if (budgetYen <= 0) {
            toast.error('配分する合計金額を入力してください', { position: 'top-center' });
            return;
        }
        // オッズが取得できる買い目だけを対象にする
        const targets: { formationId: string; combId: string; odds: number }[] = [];
        const excluded: { formationId: string; combId: string }[] = [];
        for (const f of cart) {
            for (const c of f.combinations) {
                const o = getOddsForCombination(odds, f.betType, c.id);
                if (o && o > 0) targets.push({ formationId: f.id, combId: c.id, odds: o });
                else excluded.push({ formationId: f.id, combId: c.id });
            }
        }
        if (targets.length === 0) {
            toast.error('オッズが取得できる買い目がありません', { position: 'top-center' });
            return;
        }
        if (budgetYen < targets.length * 100) {
            toast.error(`金額が少なすぎます（最低 ¥${(targets.length * 100).toLocaleString()}）`, { position: 'top-center' });
            return;
        }
        // オッズの逆数に比例 → 各買い目を100円単位で配分（最低1単位＝100円）
        const totalUnits = Math.floor(budgetYen / 100);
        const sumInv = targets.reduce((s, t) => s + 1 / t.odds, 0);
        const ideal = targets.map((t) => (totalUnits * (1 / t.odds)) / sumInv);
        const alloc = ideal.map((x) => Math.max(1, Math.floor(x)));
        let diff = totalUnits - alloc.reduce((a, b) => a + b, 0);
        const fracOrder = ideal.map((x, i) => ({ i, frac: x - Math.floor(x) }));
        if (diff > 0) {
            const order = [...fracOrder].sort((a, b) => b.frac - a.frac);
            let k = 0;
            while (diff > 0) { alloc[order[k % order.length].i]++; diff--; k++; }
        } else if (diff < 0) {
            const order = [...fracOrder].sort((a, b) => a.frac - b.frac);
            let k = 0, guard = 0;
            while (diff < 0 && guard < order.length * 1000) {
                const idx = order[k % order.length].i;
                if (alloc[idx] > 1) { alloc[idx]--; diff++; }
                k++; guard++;
            }
        }
        // 反映（対象は配分額、オッズ未取得は0に）
        targets.forEach((t, i) => updateCartItemAmount(t.formationId, t.combId, alloc[i] * 100));
        excluded.forEach((e) => updateCartItemAmount(e.formationId, e.combId, 0));
        // トリガミ判定
        const payouts = targets.map((t, i) => alloc[i] * 100 * t.odds);
        const minPayout = Math.min(...payouts);
        if (excluded.length > 0) {
            toast.warning(`オッズ未取得の${excluded.length}点を除外して配分しました`, { position: 'top-center' });
        } else if (minPayout < budgetYen) {
            toast.warning(`トリガミ注意: 最低払戻 約¥${Math.round(minPayout).toLocaleString()} が投資 ¥${budgetYen.toLocaleString()} を下回ります`, { position: 'top-center' });
        } else {
            toast.success(`配分しました（目標払戻 約¥${Math.round(minPayout).toLocaleString()}）`, { position: 'top-center' });
        }
    };

    // 締切チェック: 30秒ごとに更新
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);
    const isClosed = deadlineAt ? now > deadlineAt : false;
    const isPublic = !isPrivate;

    // URL validation
    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return /^https?:\/\//.test(url);
        } catch {
            return false;
        }
    };

    if (cart.length === 0) {
        return (
            <div className="w-full text-center p-8 text-neutral-500 bg-white border rounded">
                ベットリストは空です
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center">
            <div className="w-full max-w-md flex flex-col gap-2">
                {cart.map((formation) => (
                    <div key={formation.id} className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-2.5 py-1.5 bg-slate-50 flex items-center justify-between border-b">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[10px] bg-blue-100 text-blue-800 px-1.5 py-px rounded">{formation.betType}</span>
                                <span className="text-[10px] font-semibold text-slate-500">{formation.combinations.length}点</span>
                                <div className="w-24 flex items-center bg-white border border-slate-200 rounded-md h-6 focus-within:border-blue-400">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="一括"
                                        className="flex-1 w-0 h-full text-right font-bold text-[11px] px-1.5 bg-transparent outline-none border-0"
                                        value={formation.isIndividualAmount ? '' : (formation.totalExpectedAmount ? Math.floor(formation.totalExpectedAmount / 100) : '')}
                                        onChange={(e) => updateCartFormationAmount(formation.id, (parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0) * 100)}
                                    />
                                    <span className="text-[11px] font-bold text-slate-400 pr-1.5 whitespace-nowrap select-none">00円</span>
                                </div>
                            </div>
                            <button aria-label="削除" onClick={() => removeFormation(formation.id)} className="text-slate-300 hover:text-red-500 p-2 -m-1">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Combinations */}
                        <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                            {formation.combinations.map((comb) => {
                                const oddsVal = getOddsForCombination(odds, formation.betType, comb.id);
                                return (
                                    <div key={comb.id} className="flex items-center px-3 py-1.5 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <span className="font-mono font-bold text-sm">{comb.id}</span>
                                            {oddsVal && (
                                                <span className="ml-1.5 text-[10px] font-bold text-amber-600">{oddsVal.toFixed(1)}倍</span>
                                            )}
                                        </div>
                                        <div className="w-28 shrink-0 flex items-center bg-white border border-slate-200 rounded-md h-7 focus-within:border-blue-400">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                className="flex-1 w-0 h-full text-right font-bold text-xs px-2 bg-transparent outline-none border-0"
                                                value={comb.amount > 0 ? Math.floor(comb.amount / 100) : ''}
                                                onChange={(e) => updateCartItemAmount(formation.id, comb.id, (parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0) * 100)}
                                            />
                                            <span className="text-xs font-bold text-slate-400 pr-2 whitespace-nowrap select-none">00円</span>
                                        </div>
                                        <button aria-label="削除" onClick={() => removeCombination(formation.id, comb.id)} className="text-slate-300 hover:text-red-500 p-2 -m-1">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Odds notice */}
                {odds && Object.keys(odds).length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                        <p className="text-[11px] font-bold text-amber-700">
                            参考オッズ
                            <span className="font-normal text-amber-600 ml-1">
                                (更新: {new Date(Object.values(odds)[0].fetchedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}時点)
                            </span>
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">確定オッズとは異なります</p>
                    </div>
                )}

                {/* 自動資金配分 */}
                {odds && Object.keys(odds).length > 0 && totalCombinations > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">自動資金配分</span>
                            <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-md h-8 focus-within:border-blue-400">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="合計"
                                    className="flex-1 w-0 h-full text-right font-bold text-xs px-2 bg-transparent outline-none border-0"
                                    value={allocTotal}
                                    onChange={(e) => setAllocTotal(e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <span className="text-xs font-bold text-slate-400 pr-2 whitespace-nowrap select-none">00円</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleAutoAllocate}
                                className="h-8 px-3 rounded-md bg-[#533afd] text-white text-xs font-bold hover:bg-[#4434d4] whitespace-nowrap transition-colors"
                            >
                                配分
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">どの買い目が当たっても払戻が均等になるよう配分します</p>
                    </div>
                )}

                {/* Composite Odds */}
                {compositeOdds && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-black text-indigo-700 tracking-wider">合成オッズ</span>
                            {compositeOdds.hasMissing && (
                                <span className="text-xs text-indigo-700 font-bold">一部オッズ未取得</span>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[9px] text-indigo-500 font-bold mb-0.5">最低</p>
                                <p className="text-sm font-black text-indigo-900 tabular-nums">{compositeOdds.min.toFixed(2)}倍</p>
                            </div>
                            <div className="border-x border-indigo-200">
                                <p className="text-[9px] text-indigo-500 font-bold mb-0.5">平均</p>
                                <p className="text-sm font-black text-indigo-900 tabular-nums">{compositeOdds.avg.toFixed(2)}倍</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-indigo-500 font-bold mb-0.5">最高</p>
                                <p className="text-sm font-black text-indigo-900 tabular-nums">{compositeOdds.max.toFixed(2)}倍</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Total Summary */}
                <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-600">合計 {totalCombinations}点</span>
                        <span className="text-lg font-black text-[#061b31]">¥{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Global Cart Footer */}
                <div className="flex gap-2 w-full mt-2">
                    {!isPublic ? (
                        eventId ? (
                            // Event betting mode (限定pt)
                            isClosed ? (
                                <Button size="lg" disabled className="flex-1 font-bold bg-slate-400 text-slate-100 cursor-not-allowed">
                                    締切終了
                                </Button>
                            ) :
                            <Button
                                size="lg"
                                disabled={isBetPending || totalAmount === 0}
                                className="flex-1 font-bold shadow-sm transition-all text-white bg-amber-500 hover:bg-amber-600"
                                onClick={() => {
                                    startBetTransition(async () => {
                                        try {
                                            const allBets = cart.flatMap(formation =>
                                                formation.combinations.map(comb => ({
                                                    betType: formation.betType,
                                                    combination: comb.id,
                                                    amount: comb.amount,
                                                }))
                                            );
                                            const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
                                            const currentDate = new Date(todayStr);
                                            const yyyy = currentDate.getFullYear();
                                            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                                            const dd = String(currentDate.getDate()).padStart(2, '0');

                                            const res = await submitEventBets({
                                                eventId,
                                                placeName: qPlaceName,
                                                raceNumber: parseInt(qRaceNumber),
                                                raceDate: `${yyyy}-${mm}-${dd}T00:00:00.000Z`,
                                                bets: allBets,
                                            });
                                            if (res.success) {
                                                clearCart();
                                                toast.success('限定ptで賭けました!', { position: 'top-center' });
                                                router.push('/events');
                                            } else {
                                                toast.error(res.error || '賭けに失敗しました', { position: 'top-center' });
                                            }
                                        } catch (err: any) {
                                            toast.error(err.message || 'エラーが発生しました', { position: 'top-center' });
                                        }
                                    });
                                }}
                            >
                                {isBetPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 処理中...</>
                                ) : (
                                    `限定ptで賭ける（${totalAmount.toLocaleString()}pt）`
                                )}
                            </Button>
                        ) : (
                        // Private (isPrivate === true)
                        <Button
                            size="lg"
                            disabled={isBetPending || totalAmount === 0}
                            className={cn(
                                "flex-1 font-bold shadow-sm transition-all text-white",
                                isClosed
                                    ? "bg-slate-700 hover:bg-slate-800"
                                    : "bg-emerald-500 hover:bg-emerald-600"
                            )}
                            onClick={() => {
                                startBetTransition(async () => {
                                    try {
                                        const allBets = cart.flatMap(formation =>
                                            formation.combinations.map(comb => ({
                                                betType: formation.betType,
                                                combination: comb.id,
                                                amount: comb.amount,
                                            }))
                                        );
                                        const todayStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
                                        const currentDate = new Date(todayStr);
                                        const yyyy = currentDate.getFullYear();
                                        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                                        const dd = String(currentDate.getDate()).padStart(2, '0');

                                        const res = await submitBets({
                                            placeName: qPlaceName,
                                            raceNumber: parseInt(qRaceNumber),
                                            raceDate: `${yyyy}-${mm}-${dd}T00:00:00.000Z`,
                                            bets: allBets,
                                        });
                                        if (res.success) {
                                            clearCart();
                                            toast.success('保存しました！', { position: 'top-center' });
                                            router.push('/mypage');
                                        } else {
                                            toast.error(res.error || '保存に失敗しました', { position: 'top-center' });
                                        }
                                    } catch (err: any) {
                                        toast.error(err.message || 'エラーが発生しました', { position: 'top-center' });
                                    }
                                });
                            }}
                        >
                            {isBetPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 処理中...</>
                            ) : (
                                isClosed ? '収支登録' : '投票する（非公開）'
                            )}
                        </Button>
                        )
                    ) : (
                        // Public (isPublic === true)
                        isClosed ? (
                            <Button
                                size="lg"
                                disabled={true}
                                className="flex-1 font-bold bg-slate-400 text-slate-100 cursor-not-allowed"
                            >
                                締切終了
                            </Button>
                        ) : (
                            <Dialog open={publishDialogOpen} onOpenChange={(open) => {
                                setPublishDialogOpen(open);
                                if (!open) {
                                    setPublishType(initialPublishType || null);
                                    setExternalUrl('');
                                    setAnalysisComment('');
                                    setExternalConsent(false);
                                    setError('');
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="lg"
                                        disabled={totalAmount === 0}
                                        className="flex-1 bg-[#533afd] hover:bg-[#4434d4] text-white font-bold px-8 shadow-sm"
                                    >
                                        予想を公開する
                                    </Button>
                                </DialogTrigger>
                                <DialogContent
                                    className="sm:max-w-md max-h-[85dvh] overflow-y-auto"
                                    style={{ paddingBottom: keyboardHeight ? keyboardHeight + 24 : undefined }}
                                    onFocusCapture={(e) => {
                                        const t = e.target as HTMLElement;
                                        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) {
                                            setTimeout(() => ensureVisibleAboveKeyboard(t), 300);
                                        }
                                    }}
                                >
                                    <DialogHeader>
                                        <DialogTitle className="text-[#061b31]">予想記事の公開設定</DialogTitle>
                                        <DialogDescription className="text-[#64748d]">
                                            カートの予想データを記事として作成・公開します。
                                        </DialogDescription>
                                    </DialogHeader>

                                    {/* Step 0: Publish Type Selection (skip if pre-selected) */}
                                    {!initialPublishType && <div className="grid grid-cols-2 gap-3 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setPublishType("internal")}
                                            className="focus:outline-none"
                                        >
                                            <div className={cn(
                                                "text-center p-4 border rounded-lg transition-all",
                                                publishType === "internal"
                                                    ? "border-[#533afd] bg-[#533afd]/5 ring-2 ring-[#533afd]/20"
                                                    : "border-[#e5edf5] bg-white hover:border-[#533afd]/40"
                                            )}>
                                                <Store className={cn(
                                                    "w-6 h-6 mx-auto mb-2",
                                                    publishType === "internal" ? "text-[#533afd]" : "text-[#64748d]"
                                                )} />
                                                <h4 className={cn(
                                                    "font-bold text-sm",
                                                    publishType === "internal" ? "text-[#533afd]" : "text-[#061b31]"
                                                )}>自サイトで公開</h4>
                                                <p className="text-xs text-[#64748d] mt-1">買い目を公開する</p>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPublishType("external")}
                                            className="focus:outline-none"
                                        >
                                            <div className={cn(
                                                "text-center p-4 border rounded-lg transition-all",
                                                publishType === "external"
                                                    ? "border-[#533afd] bg-[#533afd]/5 ring-2 ring-[#533afd]/20"
                                                    : "border-[#e5edf5] bg-white hover:border-[#533afd]/40"
                                            )}>
                                                <ExternalLink className={cn(
                                                    "w-6 h-6 mx-auto mb-2",
                                                    publishType === "external" ? "text-[#533afd]" : "text-[#64748d]"
                                                )} />
                                                <h4 className={cn(
                                                    "font-bold text-sm",
                                                    publishType === "external" ? "text-[#533afd]" : "text-[#061b31]"
                                                )}>他サイトへ誘導</h4>
                                            </div>
                                        </button>
                                    </div>}

                                    {/* Form appears after publishType is selected */}
                                    {publishType && (
                                        <form
                                            className="space-y-4"
                                            action={(formData) => {
                                                setError('');
                                                startTransition(async () => {
                                                    try {
                                                        if (publishType === "external") {
                                                            if (!isValidUrl(externalUrl)) {
                                                                setError('有効なURL（http:// または https:// で始まる）を入力してください');
                                                                return;
                                                            }
                                                            if (!externalConsent) {
                                                                setError('注意事項に同意してください');
                                                                return;
                                                            }
                                                        }

                                                        const res = await publishPrediction({
                                                            title: formData.get('title') as string,
                                                            commentary: publishType === "internal"
                                                                ? (formData.get('commentary') as string || '')
                                                                : '',
                                                            price: 0,
                                                            placeName: formData.get('placeName') as string || qPlaceName,
                                                            raceNumber: parseInt(formData.get('raceNumber') as string) || parseInt(qRaceNumber),
                                                            raceDate: (() => {
                                                                // JST基準で当日の00:00:00 UTCを生成
                                                                const jst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
                                                                const y = jst.getFullYear();
                                                                const m = String(jst.getMonth() + 1).padStart(2, '0');
                                                                const d = String(jst.getDate()).padStart(2, '0');
                                                                return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
                                                            })(),
                                                            deadlineAt: new Date(formData.get('deadlineAt') as string),
                                                            cartData: cart,
                                                            isPrivate: false,
                                                            publishType: publishType,
                                                            externalUrl: publishType === "external" ? externalUrl : undefined,
                                                            analysisComment: publishType === "internal" ? analysisComment : undefined,
                                                        });
                                                        if (res?.success) {
                                                            clearCart();
                                                            toast.success(
                                                                publishType === "internal"
                                                                    ? '予想を公開しました'
                                                                    : '外部サイトへの誘導を公開しました'
                                                            );
                                                            // 公開直後に「Xに投稿」ポップを出す（layout常駐モーダルなので遷移後も表示される）
                                                            if (res.predictionId) {
                                                                openPublishShare({
                                                                    predictionId: res.predictionId,
                                                                    placeName: (formData.get('placeName') as string) || qPlaceName,
                                                                    raceNumber: parseInt(formData.get('raceNumber') as string) || parseInt(qRaceNumber),
                                                                });
                                                            }
                                                            router.push(`/predictions/${res.predictionId}`);
                                                        } else {
                                                            setError(res?.error || '公開に失敗しました');
                                                        }
                                                    } catch (err: any) {
                                                        setError('公開に失敗しました');
                                                    }
                                                });
                                            }}
                                        >
                                            <div>
                                                <label className="text-xs font-bold text-[#64748d]">場名</label>
                                                <Input name="placeName" defaultValue={qPlaceName} readOnly className="bg-slate-50 border-[#e5edf5]" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-[#64748d]">レース番号</label>
                                                    <Input name="raceNumber" type="number" defaultValue={qRaceNumber} readOnly className="bg-slate-50 border-[#e5edf5]" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-[#64748d]">締切時刻</label>
                                                    <div className="h-9 px-3 flex items-center bg-slate-50 border border-[#e5edf5] rounded-md text-[#64748d] text-sm select-none">
                                                        {deadlineAt
                                                            ? deadlineAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                                                            : '—'}
                                                    </div>
                                                    <input type="hidden" name="deadlineAt" value={deadlineAt ? deadlineAt.toISOString() : ''} />
                                                </div>
                                            </div>

                                            {/* External URL - only for external */}
                                            {publishType === "external" && (
                                                <div>
                                                    <label className="text-xs font-bold text-[#64748d]">外部サイトURL <span className="text-[#ea2261]">*</span></label>
                                                    <Input
                                                        type="url"
                                                        placeholder="https://example.com/your-prediction"
                                                        value={externalUrl}
                                                        onChange={(e) => setExternalUrl(e.target.value)}
                                                        required
                                                        className="border-[#e5edf5]"
                                                    />
                                                    {externalUrl && !isValidUrl(externalUrl) && (
                                                        <p className="text-[#ea2261] text-xs mt-1">有効なURL（http:// または https://）を入力してください</p>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-xs font-bold text-[#64748d]">タイトル <span className="text-[#ea2261]">*</span></label>
                                                <Input name="title" placeholder="自信の勝負レース" required className="border-[#e5edf5]" />
                                            </div>

                                            {/* Internal-only fields */}
                                            {publishType === "internal" && (
                                                <>
                                                    <div>
                                                        <label className="text-xs font-bold text-[#64748d]">展開予想 <span className="text-[10px] text-[#64748d] font-normal">（任意）</span></label>
                                                        <Textarea
                                                            name="commentary"
                                                            placeholder="展開予想など..."
                                                            rows={4}
                                                            value={analysisComment}
                                                            onChange={(e) => setAnalysisComment(e.target.value)}
                                                            className="border-[#e5edf5]"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* External-only fields */}
                                            {publishType === "external" && (
                                                <>
                                                    {/* Warning alert */}
                                                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-amber-800 leading-relaxed">
                                                            買い目は公開されず、自身の収支計算のみに使用されます
                                                        </p>
                                                    </div>

                                                    {/* Consent checkbox */}
                                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={externalConsent}
                                                            onChange={(e) => setExternalConsent(e.target.checked)}
                                                            className="mt-0.5 w-4 h-4 rounded border-[#e5edf5] text-[#533afd] focus:ring-[#533afd]"
                                                        />
                                                        <span className="text-xs text-[#061b31] leading-relaxed">
                                                            上記の注意事項を確認し、外部サイトへの誘導を公開することに同意します
                                                        </span>
                                                    </label>
                                                </>
                                            )}

                                            {error && <p className="text-[#ea2261] text-sm">{error}</p>}

                                            <Button
                                                type="submit"
                                                disabled={
                                                    isPending ||
                                                    (publishType === "external" && (!externalConsent || !isValidUrl(externalUrl)))
                                                }
                                                className="w-full font-bold bg-[#533afd] hover:bg-[#4434d4] text-white disabled:opacity-50"
                                            >
                                                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                {publishType === "internal" ? '記事を公開する' : '外部サイトへの誘導を公開する'}
                                            </Button>
                                        </form>
                                    )}
                                </DialogContent>
                            </Dialog>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
