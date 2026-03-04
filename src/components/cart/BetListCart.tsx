import { useBetStore } from '@/store/bet-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VENUES } from '@/lib/constants/venues';

export function BetListCart() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { cart, updateCartItemAmount, updateCartFormationAmount, removeCombination, removeFormation, clearCart } = useBetStore();
    const [isPending, startTransition] = useTransition();
    const [isBetPending, startBetTransition] = useTransition();
    const [error, setError] = useState('');

    // Initial values from URL params
    const qPlaceId = searchParams.get('placeId');
    const qPlaceName = VENUES.find(v => v.id === qPlaceId)?.name || '桐生';
    const qRaceNumber = searchParams.get('raceNumber') || '1';
    const isPrivate = searchParams.get('isPrivate') === 'true';
    const totalCombinations = cart.reduce((sum, f) => sum + f.combinations.length, 0);
    const totalAmount = cart.reduce((sum, f) => {
        return sum + f.combinations.reduce((sub, c) => sub + c.amount, 0);
    }, 0);

    if (cart.length === 0) {
        return (
            <div className="w-full text-center p-8 text-neutral-500 bg-white border rounded">
                ベットリストは空です
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center">
            <div className="w-full max-w-md flex flex-col gap-4">
                {cart.map((formation) => (
                    <Card key={formation.id} className="w-full shadow-sm">
                        <CardHeader className="py-3 px-4 bg-neutral-50 flex flex-row items-center justify-between border-b space-y-0">
                            <div className="flex gap-2 items-center">
                                <span className="font-bold text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    {formation.betType}
                                </span>
                                <span className="text-sm font-semibold">{formation.combinations.length}点買い</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFormation(formation.id)} className="text-red-600 h-8 px-2">
                                削除
                            </Button>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Formation Amount Input (Batch) */}
                            <div className="flex items-center gap-2 p-3 border-b bg-white">
                                <span className="text-sm font-medium w-24 flex-shrink-0">一括金額入力</span>
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        placeholder="100"
                                        className="pr-6 text-right font-bold w-full"
                                        value={formation.isIndividualAmount ? '' : (formation.totalExpectedAmount || '')}
                                        onChange={(e) => updateCartFormationAmount(formation.id, parseInt(e.target.value) || 0)}
                                    />
                                    <span className="absolute right-3 top-2 text-sm text-neutral-500">pt</span>
                                </div>
                            </div>

                            {/* Individual Combinations */}
                            <div className="max-h-[300px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <tbody>
                                        {formation.combinations.map((comb) => (
                                            <tr key={comb.id} className="border-b last:border-0 hover:bg-neutral-50 transition-colors">
                                                <td className="py-2 px-4 font-mono font-bold text-lg">{comb.id}</td>
                                                <td className="py-2 px-2 text-right">
                                                    <div className="relative w-24 ml-auto">
                                                        <Input
                                                            type="number"
                                                            className="h-8 pr-6 text-right font-bold"
                                                            value={comb.amount || ''}
                                                            onChange={(e) => updateCartItemAmount(formation.id, comb.id, parseInt(e.target.value) || 0)}
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-xs text-neutral-500">pt</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2 w-10 text-center">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-600" onClick={() => removeCombination(formation.id, comb.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Global Cart Footer */}
                <div className="sticky bottom-4 left-0 right-0 bg-blue-900 text-white rounded-lg shadow-xl p-4 border border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                            <span className="text-blue-200 text-xs font-semibold">合計点数・金額</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold">{totalCombinations}</span><span className="text-sm">点</span>
                                <span className="text-2xl font-extrabold ml-2">{totalAmount.toLocaleString()}</span><span className="text-sm">pt</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Submit bets button */}
                        <Button
                            size="lg"
                            disabled={isBetPending || totalAmount === 0}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                            onClick={() => {
                                startBetTransition(async () => {
                                    try {
                                        // Flatten all cart formations into individual bets
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
                                            toast.success(`${res.count}件の買い目を保存しました！`, { position: 'top-center' });
                                            router.push('/mypage/dashboard');
                                        } else {
                                            toast.error(res.error || '投票に失敗しました', { position: 'top-center' });
                                        }
                                    } catch (err: any) {
                                        toast.error(err.message || '投票エラー', { position: 'top-center' });
                                    }
                                });
                            }}
                        >
                            {isBetPending ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 処理中...</>
                            ) : (
                                '投票する'
                            )}
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-white text-blue-900 hover:bg-neutral-100 font-bold px-8">
                                    予想を販売する
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>予想記事の公開設定</DialogTitle>
                                    <DialogDescription>
                                        カートの予想データを記事として作成・販売します。
                                    </DialogDescription>
                                </DialogHeader>

                                <form
                                    className="space-y-4"
                                    action={(formData) => {
                                        setError('');
                                        startTransition(async () => {
                                            try {
                                                const res = await publishPrediction({
                                                    title: isPrivate ? `[自分用] ${qPlaceName} ${qRaceNumber}R` : formData.get('title') as string,
                                                    commentary: isPrivate ? '' : formData.get('commentary') as string,
                                                    price: isPrivate ? 0 : (parseInt(formData.get('price') as string) || 0),
                                                    placeName: formData.get('placeName') as string || qPlaceName,
                                                    raceNumber: parseInt(formData.get('raceNumber') as string) || parseInt(qRaceNumber),
                                                    raceDate: new Date(),
                                                    deadlineAt: new Date(formData.get('deadlineAt') as string),
                                                    cartData: cart,
                                                    isPrivate: isPrivate
                                                });
                                                if (res?.success) {
                                                    clearCart();
                                                    toast.success(isPrivate ? '賭けを確定しました' : '予想を公開しました');
                                                    router.push(`/predictions/${res.predictionId}`);
                                                }
                                            } catch (err: any) {
                                                setError(err.message || '公開に失敗しました');
                                            }
                                        });
                                    }}
                                >
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500">場名</label>
                                        <Input name="placeName" defaultValue={qPlaceName} readOnly className="bg-slate-50" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-neutral-500">レース番号</label>
                                            <Input name="raceNumber" type="number" defaultValue={qRaceNumber} readOnly className="bg-slate-50" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-neutral-500">締切時刻 (手動/自動)</label>
                                            <Input name="deadlineAt" type="datetime-local" required />
                                        </div>
                                    </div>

                                    {!isPrivate && (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-neutral-500">タイトル</label>
                                                <Input name="title" placeholder="自信の勝負レース" required />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-neutral-500">見解</label>
                                                <Textarea name="commentary" placeholder="展開予想など..." rows={4} required />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-neutral-500">販売価格 (pt) - 0なら無料</label>
                                                <Input name="price" type="number" defaultValue="100" min="0" required />
                                            </div>
                                        </>
                                    )}

                                    {error && <p className="text-red-500 text-sm">{error}</p>}

                                    <Button type="submit" disabled={isPending} className={`w-full font-bold ${isPrivate ? 'bg-slate-800' : 'bg-blue-600'}`}>
                                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {isPrivate ? '賭けを確定する（非公開）' : '記事を公開する'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </div>
    );
}
