import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';
import { verifyCronAuth } from "@/lib/cron-auth";
import { withCronMutex } from "@/lib/cron-mutex";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * レガシー互換: バッチ結果同期 + 精算
 * 新アーキテクチャでは /api/cron/dispatch-results → /api/queue/sync-single-result を使用
 * このエンドポイントは QStash 未設定時やデバッグ用に残す
 */
export async function GET(request: Request) {
    try {
        const _auth = verifyCronAuth(request);
        if (!_auth.ok) return _auth.response;

        const result = await withCronMutex("sync-results", 270, async () => {
            console.log("[CRON] Starting batch result sync (legacy)...");

            const syncRes = await syncTodayResults({});
            if (!syncRes.success) {
                return { success: false, error: syncRes.error, status: 500 as const };
            }

            const processedRaces = syncRes.processedRaces || [];

            let settlementCount = 0;
            for (const race of processedRaces) {
                try {
                    const stats = await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
                    if (stats.success) settlementCount += stats.settledCount;
                } catch (evalErr: any) {
                    console.error(`[CRON] Settlement failed for ${race.placeName} R${race.raceNumber}:`, evalErr.message);
                }
            }

            return {
                success: true,
                syncedCount: syncRes.count,
                settlementCount,
                races: processedRaces.map(r => `${r.placeName} R${r.raceNumber}`).join(', '),
                status: 200 as const,
            };
        });

        if ("skipped" in result) {
            return NextResponse.json({ success: true, skipped: result.reason });
        }
        const { status, ...body } = result;
        return NextResponse.json(body, { status });
    } catch (e: any) {
        console.error('[CRON RESULT SYNC ERROR]', e);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
