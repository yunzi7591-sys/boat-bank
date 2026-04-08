import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * レガシー互換: バッチ結果同期 + 精算
 * 新アーキテクチャでは /api/cron/dispatch-results → /api/queue/sync-single-result を使用
 * このエンドポイントは QStash 未設定時やデバッグ用に残す
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log("[CRON] Starting batch result sync (legacy)...");

        // Vercel Hobby 10秒制限対策: limit を 5 に制限
        const syncRes = await syncTodayResults({ limit: 5 });
        if (!syncRes.success) {
            return NextResponse.json({ success: false, error: syncRes.error }, { status: 500 });
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

        return NextResponse.json({
            success: true,
            syncedCount: syncRes.count,
            settlementCount,
            races: processedRaces.map(r => `${r.placeName} R${r.raceNumber}`).join(', ')
        });
    } catch (e: any) {
        console.error('[CRON RESULT SYNC ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
