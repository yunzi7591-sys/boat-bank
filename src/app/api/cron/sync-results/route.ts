import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 120 seconds for scraping multiple pages

export async function GET(request: Request) {
    console.log("[CRON] /api/cron/sync-results endpoint invoked.");
    try {
        // Validate Cron Secret
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        // Allowed in dev mode for easy testing, but requires secretion in prod.
        if (process.env.NODE_ENV === 'production') {
            if (authHeader !== expectedAuth) {
                console.error(`[CRON] Unauthorized access attempt.`);
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
        }

        console.log("[CRON] Starting today's bulk result sync...");

        // 1. Scrape and save RaceResults from boatrace.jp official site
        const syncRes = await syncTodayResults();
        if (!syncRes.success) {
            console.error(`[CRON] Result Sync failed from syncTodayResults:`, syncRes.error);
            return NextResponse.json({ success: false, status: 'Skipped/Failed', error: syncRes.error });
        }

        const processedRaces = syncRes.processedRaces || [];
        console.log(`[CRON] Successfully synced ${processedRaces.length} races.`);

        // 2. Automatically trigger evaluation (settlement) for all processed races
        let settlementCount = 0;
        for (const race of processedRaces) {
            console.log(`[CRON] Settling predictions for ${race.placeName} R${race.raceNumber}...`);
            await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
            settlementCount++;
        }

        console.log(`[CRON] Execution final summary: ${syncRes.count} synced, ${settlementCount} evaluated.`);
        return NextResponse.json({
            success: true,
            status: 'Success',
            syncedCount: syncRes.count,
            settlementProcessedCount: settlementCount,
            races: processedRaces.map(r => `${r.placeName} R${r.raceNumber} `).join(', ')
        });
    } catch (e: any) {
        console.error('[CRON RESULT SYNC ERROR] Unhandled Exception:', e.message, e.stack);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

