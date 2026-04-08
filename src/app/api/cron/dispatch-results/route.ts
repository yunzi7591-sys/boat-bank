import { NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { getUnsyncedRaces } from '@/lib/boatrace-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

const BATCH_LIMIT = 10;

export async function GET(request: Request) {
    try {
        // 認証チェック
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 未同期レースを取得
        const unsyncedRaces = await getUnsyncedRaces(BATCH_LIMIT);

        if (unsyncedRaces.length === 0) {
            return NextResponse.json({ success: true, dispatched: 0, message: 'No unsynced races' });
        }

        // QStash が設定されている場合はキューにディスパッチ
        const qstashToken = process.env.QSTASH_TOKEN;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

        if (qstashToken && appUrl) {
            const client = new Client({
                token: qstashToken,
                baseUrl: process.env.QSTASH_URL || "https://qstash.upstash.io",
            });
            const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;

            let dispatched = 0;
            for (const race of unsyncedRaces) {
                const params = new URLSearchParams({
                    placeName: race.placeName,
                    raceNumber: race.raceNumber.toString(),
                    raceDate: race.raceDate.toISOString(),
                });

                await client.publishJSON({
                    url: `${baseUrl}/api/queue/sync-single-result?${params.toString()}`,
                    body: { placeName: race.placeName, raceNumber: race.raceNumber, raceDate: race.raceDate.toISOString() },
                    retries: 2,
                    delay: dispatched * 2, // 2秒間隔でスタガー
                });
                dispatched++;
            }

            console.log(`[DISPATCH] Queued ${dispatched} races via QStash`);
            return NextResponse.json({ success: true, dispatched, races: unsyncedRaces.map(r => `${r.placeName} R${r.raceNumber}`) });
        }

        // QStash 未設定時: 直接同期（レガシーフォールバック）
        console.log(`[DISPATCH] QStash not configured, falling back to direct sync`);
        const { syncTodayResults } = await import('@/lib/boatrace-api');
        const { settleRacePredictions } = await import('@/lib/evaluate');

        const syncRes = await syncTodayResults({ limit: 5 });
        const processedRaces = syncRes.processedRaces || [];

        let settlementCount = 0;
        for (const race of processedRaces) {
            try {
                const stats = await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
                if (stats.success) settlementCount += stats.settledCount;
            } catch (err: any) {
                console.error(`[DISPATCH] Settlement failed for ${race.placeName} R${race.raceNumber}:`, err.message);
            }
        }

        return NextResponse.json({
            success: true,
            mode: 'direct',
            syncedCount: syncRes.count,
            settlementCount,
        });
    } catch (e: any) {
        console.error('[DISPATCH ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
