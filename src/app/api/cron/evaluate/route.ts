import { NextResponse } from 'next/server';
import { syncTodayResults } from '@/lib/boatrace-api';
import { settleRacePredictions } from '@/lib/evaluate';

// Phase 53: This route now scrapes results from boatrace.jp, then evaluates pending predictions.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET || 'dev-cron-secret';

    if (authHeader !== `Bearer ${secret}` && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("[Cron] Starting scraping-based result sync + evaluation batch...");

        // 1. Scrape results from boatrace.jp official site
        const syncRes = await syncTodayResults();
        const processedRaces = syncRes.processedRaces || [];

        // 2. Settle predictions for newly synced races
        let settlementCount = 0;
        for (const race of processedRaces) {
            try {
                const stats = await settleRacePredictions(race.placeName, race.raceNumber, race.raceDate);
                if (stats.success) {
                    settlementCount += stats.settledCount;
                }
            } catch (e) {
                // If settlement fails for one race, continue with others
            }
        }

        console.log(`[Cron] Batch: scraped ${processedRaces.length} races, settled ${settlementCount} predictions.`);

        return NextResponse.json({
            success: true,
            message: `Batch completed`,
            stats: {
                racesScraped: processedRaces.length,
                predictionsSettled: settlementCount
            }
        });
    } catch (error: any) {
        console.error("[Cron Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

