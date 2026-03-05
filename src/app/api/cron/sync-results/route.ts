import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 120 seconds for scraping multiple pages

export async function GET(request: Request) {
    try {
        // Validate Cron Secret
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        // Allowed in dev mode for easy testing, but requires secretion in prod.
        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log("[CRON] Starting today's bulk result sync...");

        // 1. Scrape and save RaceResults from boatrace.jp official site
        const syncRes = await syncTodayResults({ limit: 15 });
        if (!syncRes.success) {
            console.warn("[CRON] Result Sync failed:", syncRes.error);
            return NextResponse.json({ success: false, error: syncRes.error }, { status: 500 });
        }

        const processedRaces = syncRes.processedRaces || [];
        console.log(`[CRON] Successfully synced ${processedRaces.length} races.`);

        // 2. Automatically trigger evaluation (settlement) for all processed races
        let settlementCount = 0;
        for (const race of processedRaces) {
            try {
                console.log(`[CRON] Settling predictions for ${race.placeName} R${race.raceNumber}...`);
                const stats = await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
                if (stats.success) {
                    settlementCount += stats.settledCount;
                }
            } catch (evalErr: any) {
                console.error(`[CRON] Evaluation failed for ${race.placeName} R${race.raceNumber}:`, evalErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount: syncRes.count,
            settlementProcessedCount: settlementCount,
            races: processedRaces.map(r => `${r.placeName} R${r.raceNumber} `).join(', ')
        });
    } catch (e: any) {
        console.error('[CRON RESULT SYNC ERROR]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
