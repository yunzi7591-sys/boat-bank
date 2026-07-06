import { NextResponse } from 'next/server';
import { settleAllPending } from '@/lib/evaluate';
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMutex } from "@/lib/cron-mutex";

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * 結果同期は dispatch-results（QStash→queue worker）に一本化した。
 * このルートは「結果は取得済みだが未精算」の予想/ベットを拾う安全網
 * （settleAllPending）だけを、多重起動を防ぐ mutex 付きで実行する。
 * 精算は冪等（EventBetのpt加算は updateMany の count 判定で二重払い防止、
 * Prediction/UserBet はフラグ更新のみで金銭移動なし）なので安全。
 */
export async function GET(request: Request) {
    const _auth = verifyCronAuth(request);
    if (!_auth.ok) return _auth.response;

    try {
        const result = await withCronMutex("settle-pending", 100, async () => {
            const pendingStats = await settleAllPending();
            return NextResponse.json({
                success: true,
                message: "Settle-pending completed",
                stats: {
                    predictionsSettled: pendingStats.settledCount,
                    racesChecked: pendingStats.racesChecked,
                },
            });
        });

        if (result && typeof result === "object" && "skipped" in result) {
            return NextResponse.json({ success: true, skipped: result.reason });
        }
        return result as NextResponse;
    } catch (error: any) {
        console.error("[Cron evaluate] Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
