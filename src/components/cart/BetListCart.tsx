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
import { publishPrediction } from '@/actions/prediction';
import { submitBets } from '@/actions/bet';
import { submitEventBets } from '@/actions/event-bet';
import { getUserPoints } from '@/actions/auth';
import { useState, useTransition, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VENUES } from '@/lib/constants/venues';
import { cn } from '@/lib/utils';

interface OddsMap {
    [oddsType: string]: { data: Record<string, number>; fetchedAt: string };
}

interface BetListCartProps {
    deadlineAt?: Date | null;
    userPoints?: number;
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

export function BetListCart({ deadlineAt, userPoints: initialUserPoints, initialPublishType, eventId, eventPoints, odds }: BetListCartProps = {}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { cart, updateCartItemAmount, updateCartFormationAmount, removeCombination, removeFormation, clearCart } = useBetStore();
    const [isPending, startTransition] = useTransition();
    const [isBetPending, startBetTransition] = useTransition();
    const [error, setError] = useState('');

    // Publish type: pre-selected from parent or null
    const [publishType, setPublishType] = useState<"internal" | "external" | null>(initialPublishType || null);
    const [externalUrl, setExternalUrl] = useState('');
    const [analysisComment, setAnalysisComment] = useState('');
    const [externalConsent, setExternalConsent] = useState(false);

    // User points (fetched client-side if not provided via props)
    const [userPoints, setUserPoints] = useState<number>(initialUserPoints ?? 0);
    const [pointsLoaded, setPointsLoaded] = useState(initialUserPoints !== undefined);

    useEffect(() => {
        if (initialUserPoints === undefined) {
            getUserPoints().then((pts) => {
                setUserPoints(pts);
                setPointsLoaded(true);
            });
        }
    }, [initialUserPoints]);

    // Initial values from URL params
    const qPlaceId = searchParams.get('placeId');
    const qPlaceName = VENUES.find(v => v.id === qPlaceId)?.name || '桐生';
    const qRaceNumber = searchParams.get('raceNumber') || '1';
    const isPrivate = searchParams.get('isPrivate') === 'true';
    const totalCombinations = cart.reduce((sum, f) => sum + f.combinations.length, 0);
    const totalAmount = cart.reduce((sum, f) => {
        return sum + f.combinations.reduce((sub, c) => sub + c.amount, 0);
    }, 0);

    // 締切チェック: 30秒ごとに更新
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);
    const isClosed = deadlineAt ? now > deadlineAt : false;
    const isPublic = !isPrivate;

    const hasInsufficientPoints = userPoints < 100;

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
                        {/* Header */}
                        <div className="px-3 py-2 bg-slate-50 flex items-center justify-between border-b">
                            <div className="flex gap-1.5 items-center">
                                <span className="font-bold text-[11px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                    {formation.betType}
                                </span>
                                <span className="text-xs font-semibold text-slate-600">{formation.combinations.length}点</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="relative w-20">
                                    <Input
                                        type="number"
                                        placeholder="一括"
                                        className="h-7 pr-5 text-right font-bold text-xs"
                                        value={formation.isIndividualAmount ? '' : (formation.totalExpectedAmount || '')}
                                        onChange={(e) => updateCartFormationAmount(formation.id, parseInt(e.target.value) || 0)}
                                    />
                                    <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">円</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeFormation(formation.id)} className="text-red-500 h-7 w-7">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
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
                                        <div className="relative w-20">
                                            <Input
                                                type="number"
                                                className="h-7 pr-5 text-right font-bold text-xs"
                                                value={comb.amount || ''}
                                                onChange={(e) => updateCartItemAmount(formation.id, comb.id, parseInt(e.target.value) || 0)}
                                            />
                                            <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">円</span>
                                        </div>
                                        <button onClick={() => removeCombination(formation.id, comb.id)} className="text-slate-300 hover:text-red-500 p-0.5">
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
                        <p className="text-[10px] text-amber-500 mt-0.5">確定オッズとは異なります</p>
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
                            <Dialog onOpenChange={(open) => {
                                if (!open) {
                                    setPublishType(null);
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
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-[#061b31]">予想記事の公開設定</DialogTitle>
                                        <DialogDescription className="text-[#64748d]">
                                            カートの予想データを記事として作成・販売します。
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
                                                )}>自サイトで販売</h4>
                                                <p className="text-xs text-[#64748d] mt-1">買い目を公開して販売</p>
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
                                                <p className="text-xs text-[#64748d] mt-1">100pt消費</p>
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
                                                                setError('100pt消費に同意してください');
                                                                return;
                                                            }
                                                            if (hasInsufficientPoints) {
                                                                setError('ポイントが不足しています');
                                                                return;
                                                            }
                                                        }

                                                        const res = await publishPrediction({
                                                            title: formData.get('title') as string,
                                                            commentary: publishType === "internal"
                                                                ? (formData.get('commentary') as string || '')
                                                                : '',
                                                            price: publishType === "internal"
                                                                ? ((parseInt(formData.get('price') as string) || 0) * 100)
                                                                : 0,
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
                                                            router.push(`/predictions/${res.predictionId}`);
                                                        }
                                                    } catch (err: any) {
                                                        setError(err.message || '公開に失敗しました');
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
                                                    <Input name="deadlineAt" type="datetime-local" defaultValue={deadlineAt ? new Date(deadlineAt.getTime() - deadlineAt.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} required readOnly className="bg-slate-50 border-[#e5edf5] text-[#64748d]" />
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
                                                    <div>
                                                        <label className="text-xs font-bold text-[#64748d]">販売価格 — 未入力で無料</label>
                                                        <div className="flex items-center gap-1">
                                                            <Input name="price" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" defaultValue="" className="border-[#e5edf5] text-right w-24" />
                                                            <span className="text-sm font-bold text-[#64748d] whitespace-nowrap">00 pt</span>
                                                        </div>
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
                                                            外部サイトへの予想公開に100ptを消費することに同意します
                                                        </span>
                                                    </label>

                                                    {/* Insufficient points warning */}
                                                    {pointsLoaded && hasInsufficientPoints && (
                                                        <p className="text-[#ea2261] text-xs font-bold">
                                                            ポイントが不足しています（残高: {userPoints}pt）
                                                        </p>
                                                    )}
                                                </>
                                            )}

                                            {error && <p className="text-[#ea2261] text-sm">{error}</p>}

                                            <Button
                                                type="submit"
                                                disabled={
                                                    isPending ||
                                                    (publishType === "external" && (!externalConsent || hasInsufficientPoints || !isValidUrl(externalUrl)))
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
