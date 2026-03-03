import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds

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

        // 1. Fetch, parse, and Upsert RaceResults from the API
        const syncRes = await syncTodayResults();
        if (!syncRes.success) {
            console.warn("[CRON] Result Sync skipped or failed:", syncRes.error);
            return NextResponse.json({ status: 'Skipped', message: syncRes.error });
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

        return NextResponse.json({
            status: 'Success',
            syncedCount: syncRes.count,
            settlementProcessedCount: settlementCount,
            races: processedRaces.map(r => `${r.placeName} R${r.raceNumber} `).join(', ')
        });
    } catch (e: any) {
        console.error('[CRON RESULT SYNC ERROR]', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
